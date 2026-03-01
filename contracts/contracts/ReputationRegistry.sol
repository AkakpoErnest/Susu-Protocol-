// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReputationRegistry
/// @notice Tracks on-chain reputation scores for Susu Protocol participants.
///         Scores start at 500, range 0-1000. Only authorized pools can write.
contract ReputationRegistry is Ownable {
    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant INITIAL_SCORE = 500;
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant POINTS_ON_TIME = 10;
    uint256 public constant POINTS_LATE = 3;
    uint256 public constant POINTS_DEFAULT = 50; // deducted
    uint256 public constant POINTS_COMPLETION = 25;

    // ─── State ────────────────────────────────────────────────────────────────
    address public factory;
    mapping(address => bool) public authorizedPools;
    mapping(address => uint256) public scores;
    mapping(address => bool) public hasScore; // to distinguish 0 from uninitialized
    mapping(address => ContributionRecord[]) private _history;
    mapping(address => uint256) public totalPoolsCompleted;

    // ─── Structs ──────────────────────────────────────────────────────────────
    struct ContributionRecord {
        address poolAddress;
        uint256 cycleNumber;
        bool onTime;
        bool defaulted;
        uint256 timestamp;
    }

    // ─── Events ───────────────────────────────────────────────────────────────
    event ScoreUpdated(address indexed member, uint256 oldScore, uint256 newScore);
    event ContributionRecorded(
        address indexed member,
        address indexed pool,
        uint256 cycle
    );
    event PoolAuthorized(address indexed pool);
    event FactorySet(address indexed factory);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyAuthorized() {
        require(authorizedPools[msg.sender], "ReputationRegistry: caller not authorized pool");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "ReputationRegistry: caller is not factory");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Set the factory address. Called once after factory deployment.
    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "ReputationRegistry: zero address");
        factory = _factory;
        emit FactorySet(_factory);
    }

    /// @notice Authorize a deployed pool to write reputation data.
    ///         Only callable by the factory.
    function authorizePool(address pool) external onlyFactory {
        require(pool != address(0), "ReputationRegistry: zero address");
        authorizedPools[pool] = true;
        emit PoolAuthorized(pool);
    }

    // ─── Write functions (pools only) ─────────────────────────────────────────

    /// @notice Record a contribution (on-time or late) and update score.
    function recordContribution(
        address member,
        address pool,
        uint256 cycle,
        bool onTime
    ) external onlyAuthorized {
        _ensureScore(member);
        uint256 oldScore = scores[member];
        uint256 points = onTime ? POINTS_ON_TIME : POINTS_LATE;
        uint256 newScore = oldScore + points > MAX_SCORE ? MAX_SCORE : oldScore + points;
        scores[member] = newScore;

        _history[member].push(
            ContributionRecord({
                poolAddress: pool,
                cycleNumber: cycle,
                onTime: onTime,
                defaulted: false,
                timestamp: block.timestamp
            })
        );

        emit ScoreUpdated(member, oldScore, newScore);
        emit ContributionRecorded(member, pool, cycle);
    }

    /// @notice Record a default (missed cycle) and penalize score.
    function recordDefault(
        address member,
        address pool,
        uint256 cycle
    ) external onlyAuthorized {
        _ensureScore(member);
        uint256 oldScore = scores[member];
        uint256 newScore = oldScore >= POINTS_DEFAULT ? oldScore - POINTS_DEFAULT : 0;
        scores[member] = newScore;

        _history[member].push(
            ContributionRecord({
                poolAddress: pool,
                cycleNumber: cycle,
                onTime: false,
                defaulted: true,
                timestamp: block.timestamp
            })
        );

        emit ScoreUpdated(member, oldScore, newScore);
        emit ContributionRecorded(member, pool, cycle);
    }

    /// @notice Record pool completion bonus for a member.
    function recordCompletion(address member, address pool) external onlyAuthorized {
        _ensureScore(member);
        uint256 oldScore = scores[member];
        uint256 newScore = oldScore + POINTS_COMPLETION > MAX_SCORE
            ? MAX_SCORE
            : oldScore + POINTS_COMPLETION;
        scores[member] = newScore;
        totalPoolsCompleted[member]++;

        emit ScoreUpdated(member, oldScore, newScore);
        emit ContributionRecorded(member, pool, 0);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    /// @notice Get the current reputation score for an address.
    function getScore(address member) external view returns (uint256) {
        if (!hasScore[member]) return INITIAL_SCORE;
        return scores[member];
    }

    /// @notice Get full contribution history for an address.
    function getHistory(
        address member
    ) external view returns (ContributionRecord[] memory) {
        return _history[member];
    }

    /// @notice Get total number of pools completed by a member.
    function getTotalPoolsCompleted(address member) external view returns (uint256) {
        return totalPoolsCompleted[member];
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _ensureScore(address member) internal {
        if (!hasScore[member]) {
            scores[member] = INITIAL_SCORE;
            hasScore[member] = true;
        }
    }
}
