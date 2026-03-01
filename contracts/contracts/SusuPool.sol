// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IReputationRegistry {
    function recordContribution(
        address member,
        address pool,
        uint256 cycle,
        bool onTime
    ) external;
    function recordDefault(address member, address pool, uint256 cycle) external;
    function recordCompletion(address member, address pool) external;
    function getScore(address member) external view returns (uint256);
}

interface ISusuFactory {
    function registerMember(address pool, address member) external;
}

/// @title SusuPool
/// @notice A single rotating savings group. Members contribute each cycle;
///         one member receives the full pot per cycle in a deterministic rotation.
contract SusuPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Enums ────────────────────────────────────────────────────────────────
    enum PoolState {
        OPEN,
        ACTIVE,
        COMPLETED,
        CANCELLED
    }

    // ─── Config (immutable after deployment) ──────────────────────────────────
    struct PoolConfig {
        string name;
        string description;
        address operator;
        address stablecoin;
        uint256 contributionAmount;
        uint256 maxMembers;
        uint256 cycleDurationSeconds;
        uint256 gracePeriodSeconds;
        uint256 minReputationScore;
        bool isPrivate;
    }

    // ─── State ────────────────────────────────────────────────────────────────
    PoolConfig public config;
    PoolState public state;
    address public reputationRegistry;
    address public factory;
    uint256 public poolId;

    address[] public memberOrder;
    mapping(address => bool) public isMember;
    mapping(address => bool) public operatorApproved;
    mapping(address => bool) public hasContributedThisCycle;
    mapping(address => bool) public hasReceivedPayout;
    mapping(address => uint256) public defaultCount;

    uint256 public currentCycle;
    uint256 public cycleStartTime;
    uint256 public totalMembers;

    // Emergency cancel vote tracking
    mapping(address => bool) public cancelVoted;
    uint256 public cancelVoteCount;

    // ─── Events ───────────────────────────────────────────────────────────────
    event PoolStarted(uint256 timestamp, address[] payoutOrder);
    event MemberJoined(address indexed member, uint256 totalMembers);
    event ContributionMade(
        address indexed member,
        uint256 cycle,
        uint256 amount,
        bool late
    );
    event PayoutTriggered(address indexed recipient, uint256 amount, uint256 cycle);
    event MemberDefaulted(address indexed member, uint256 cycle);
    event PoolCompleted(uint256 timestamp, uint256 totalCycles);
    event PoolCancelled(uint256 timestamp, string reason);
    event EmergencyCancelVote(address indexed voter, uint256 votes);
    event MemberApproved(address indexed member);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOperator() {
        require(msg.sender == config.operator, "SusuPool: caller is not operator");
        _;
    }

    modifier onlyActive() {
        require(state == PoolState.ACTIVE, "SusuPool: pool is not active");
        _;
    }

    modifier onlyOpen() {
        require(state == PoolState.OPEN, "SusuPool: pool is not open");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(
        uint256 _poolId,
        string memory _name,
        string memory _description,
        address _operator,
        address _stablecoin,
        uint256 _contributionAmount,
        uint256 _maxMembers,
        uint256 _cycleDurationSeconds,
        uint256 _gracePeriodSeconds,
        uint256 _minReputationScore,
        bool _isPrivate,
        address _reputationRegistry,
        address _factory
    ) {
        config = PoolConfig({
            name: _name,
            description: _description,
            operator: _operator,
            stablecoin: _stablecoin,
            contributionAmount: _contributionAmount,
            maxMembers: _maxMembers,
            cycleDurationSeconds: _cycleDurationSeconds,
            gracePeriodSeconds: _gracePeriodSeconds,
            minReputationScore: _minReputationScore,
            isPrivate: _isPrivate
        });

        state = PoolState.OPEN;
        reputationRegistry = _reputationRegistry;
        factory = _factory;
        poolId = _poolId;
    }

    // ─── Member Management ────────────────────────────────────────────────────

    /// @notice Join this pool. Checks reputation, privacy, and capacity.
    function joinPool() external onlyOpen nonReentrant {
        require(!isMember[msg.sender], "SusuPool: already a member");
        require(totalMembers < config.maxMembers, "SusuPool: pool is full");

        if (config.minReputationScore > 0) {
            uint256 score = IReputationRegistry(reputationRegistry).getScore(msg.sender);
            require(score >= config.minReputationScore, "SusuPool: insufficient reputation score");
        }

        if (config.isPrivate) {
            require(operatorApproved[msg.sender], "SusuPool: not approved for private pool");
        }

        isMember[msg.sender] = true;
        memberOrder.push(msg.sender);
        totalMembers++;

        // Notify factory for member tracking
        ISusuFactory(factory).registerMember(address(this), msg.sender);

        emit MemberJoined(msg.sender, totalMembers);
    }

    /// @notice Operator approves an applicant for a private pool.
    function approveApplicant(address member) external onlyOperator onlyOpen {
        require(member != address(0), "SusuPool: zero address");
        operatorApproved[member] = true;
        emit MemberApproved(member);
    }

    // ─── Pool Lifecycle ───────────────────────────────────────────────────────

    /// @notice Operator starts the pool, locks member order, begins cycle 1.
    function startPool() external onlyOperator onlyOpen {
        require(totalMembers >= 2, "SusuPool: need at least 2 members");

        // Deterministic pseudo-random shuffle (fine for testnet)
        _shuffleMembers();

        state = PoolState.ACTIVE;
        cycleStartTime = block.timestamp;
        currentCycle = 1;

        emit PoolStarted(block.timestamp, memberOrder);
    }

    /// @notice Contribute to the current cycle. Pulls stablecoin from caller.
    function contribute() external onlyActive nonReentrant {
        require(isMember[msg.sender], "SusuPool: not a member");
        require(!hasContributedThisCycle[msg.sender], "SusuPool: already contributed this cycle");

        uint256 deadline = cycleStartTime + config.cycleDurationSeconds + config.gracePeriodSeconds;
        require(block.timestamp <= deadline, "SusuPool: contribution deadline passed");

        bool isLate = block.timestamp > cycleStartTime + config.cycleDurationSeconds;

        IERC20(config.stablecoin).safeTransferFrom(
            msg.sender,
            address(this),
            config.contributionAmount
        );

        hasContributedThisCycle[msg.sender] = true;

        IReputationRegistry(reputationRegistry).recordContribution(
            msg.sender,
            address(this),
            currentCycle,
            !isLate
        );

        emit ContributionMade(msg.sender, currentCycle, config.contributionAmount, isLate);

        // Auto-trigger payout if everyone has contributed
        if (_allMembersContributed()) {
            _executePayout();
        }
    }

    /// @notice Trigger payout after deadline. Callable by anyone.
    ///         Slashes defaulters in reputation.
    function triggerPayout() external onlyActive nonReentrant {
        uint256 deadline = cycleStartTime + config.cycleDurationSeconds + config.gracePeriodSeconds;
        bool allContributed = _allMembersContributed();

        // Operator can trigger early if all contributed; otherwise wait for deadline
        if (msg.sender == config.operator && allContributed) {
            _executePayout();
            return;
        }

        require(block.timestamp > deadline, "SusuPool: deadline not yet passed");
        _executePayout();
    }

    // ─── Emergency Cancel ─────────────────────────────────────────────────────

    /// @notice Vote for emergency cancellation. Requires operator OR 75% member vote.
    function emergencyCancel(string calldata reason) external nonReentrant {
        require(
            state == PoolState.OPEN || state == PoolState.ACTIVE,
            "SusuPool: pool already finalized"
        );

        if (msg.sender == config.operator) {
            _doCancel(reason);
            return;
        }

        // Member vote path
        require(isMember[msg.sender], "SusuPool: not a member");
        require(!cancelVoted[msg.sender], "SusuPool: already voted");

        cancelVoted[msg.sender] = true;
        cancelVoteCount++;

        emit EmergencyCancelVote(msg.sender, cancelVoteCount);

        // 75% threshold
        uint256 threshold = (totalMembers * 75) / 100;
        if (cancelVoteCount >= threshold && cancelVoteCount >= 1) {
            _doCancel(reason);
        }
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getMembersContributed() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < memberOrder.length; i++) {
            if (hasContributedThisCycle[memberOrder[i]]) count++;
        }
        return count;
    }

    function getTimeUntilDeadline() external view returns (uint256) {
        if (state != PoolState.ACTIVE) return 0;
        uint256 deadline = cycleStartTime + config.cycleDurationSeconds + config.gracePeriodSeconds;
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    function getPoolInfo()
        external
        view
        returns (
            PoolConfig memory poolConfig,
            PoolState poolState,
            uint256 cycle,
            uint256 members,
            uint256 cycleStart,
            uint256 potBalance
        )
    {
        return (
            config,
            state,
            currentCycle,
            totalMembers,
            cycleStartTime,
            IERC20(config.stablecoin).balanceOf(address(this))
        );
    }

    function getPotBalance() external view returns (uint256) {
        return IERC20(config.stablecoin).balanceOf(address(this));
    }

    function getPayoutSchedule()
        external
        view
        returns (address[] memory members, bool[] memory paid)
    {
        members = memberOrder;
        paid = new bool[](memberOrder.length);
        for (uint256 i = 0; i < memberOrder.length; i++) {
            paid[i] = hasReceivedPayout[memberOrder[i]];
        }
    }

    function getMembers() external view returns (address[] memory) {
        return memberOrder;
    }

    function getContributionStatus() external view returns (address[] memory, bool[] memory) {
        bool[] memory statuses = new bool[](memberOrder.length);
        for (uint256 i = 0; i < memberOrder.length; i++) {
            statuses[i] = hasContributedThisCycle[memberOrder[i]];
        }
        return (memberOrder, statuses);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _allMembersContributed() internal view returns (bool) {
        for (uint256 i = 0; i < memberOrder.length; i++) {
            if (!hasContributedThisCycle[memberOrder[i]]) return false;
        }
        return true;
    }

    function _executePayout() internal {
        // Record defaults for non-contributors
        for (uint256 i = 0; i < memberOrder.length; i++) {
            address member = memberOrder[i];
            if (!hasContributedThisCycle[member]) {
                defaultCount[member]++;
                IReputationRegistry(reputationRegistry).recordDefault(
                    member,
                    address(this),
                    currentCycle
                );
                emit MemberDefaulted(member, currentCycle);
            }
        }

        // Payout recipient = memberOrder[currentCycle - 1]
        address recipient = memberOrder[currentCycle - 1];
        uint256 potAmount = IERC20(config.stablecoin).balanceOf(address(this));

        require(potAmount > 0, "SusuPool: pot is empty");

        hasReceivedPayout[recipient] = true;
        IERC20(config.stablecoin).safeTransfer(recipient, potAmount);

        emit PayoutTriggered(recipient, potAmount, currentCycle);

        // Reset contributions for next cycle
        for (uint256 i = 0; i < memberOrder.length; i++) {
            hasContributedThisCycle[memberOrder[i]] = false;
        }

        if (currentCycle == totalMembers) {
            _finalizePool();
        } else {
            cycleStartTime = cycleStartTime + config.cycleDurationSeconds;
            currentCycle++;
        }
    }

    function _finalizePool() internal {
        state = PoolState.COMPLETED;

        // Award completion bonus to members who never defaulted
        for (uint256 i = 0; i < memberOrder.length; i++) {
            if (defaultCount[memberOrder[i]] == 0) {
                IReputationRegistry(reputationRegistry).recordCompletion(
                    memberOrder[i],
                    address(this)
                );
            }
        }

        emit PoolCompleted(block.timestamp, totalMembers);
    }

    function _doCancel(string memory reason) internal {
        state = PoolState.CANCELLED;

        // Refund current cycle contributions
        for (uint256 i = 0; i < memberOrder.length; i++) {
            address member = memberOrder[i];
            if (hasContributedThisCycle[member]) {
                hasContributedThisCycle[member] = false;
                IERC20(config.stablecoin).safeTransfer(member, config.contributionAmount);
            }
        }

        emit PoolCancelled(block.timestamp, reason);
    }

    function _shuffleMembers() internal {
        uint256 n = memberOrder.length;
        for (uint256 i = n - 1; i > 0; i--) {
            uint256 j = uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        blockhash(block.number - 1),
                        memberOrder,
                        i
                    )
                )
            ) % (i + 1);
            address temp = memberOrder[i];
            memberOrder[i] = memberOrder[j];
            memberOrder[j] = temp;
        }
    }
}
