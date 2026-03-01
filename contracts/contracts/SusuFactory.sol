// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SusuPool.sol";

interface IReputationRegistryFactory {
    function authorizePool(address pool) external;
}

/// @title SusuFactory
/// @notice Deploys and indexes all SusuPool contracts. Single entry point for pool creation.
contract SusuFactory {
    // ─── State ────────────────────────────────────────────────────────────────
    address public reputationRegistry;
    address public defaultStablecoin;
    address[] public allPools;
    uint256 public totalPoolsCreated;

    mapping(address => address[]) public operatorPools;
    mapping(address => address[]) public memberPools;
    mapping(address => bool) public isPool; // quick lookup

    // ─── Events ───────────────────────────────────────────────────────────────
    event PoolCreated(
        address indexed poolAddress,
        address indexed operator,
        string name,
        uint256 timestamp,
        uint256 poolId
    );

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address _reputationRegistry, address _defaultStablecoin) {
        require(_reputationRegistry != address(0), "SusuFactory: zero registry");
        require(_defaultStablecoin != address(0), "SusuFactory: zero stablecoin");
        reputationRegistry = _reputationRegistry;
        defaultStablecoin = _defaultStablecoin;
    }

    // ─── Pool Creation ────────────────────────────────────────────────────────

    /// @notice Deploy a new SusuPool.
    /// @param name Pool display name
    /// @param description Short description
    /// @param contributionAmount Amount each member contributes per cycle (in stablecoin decimals)
    /// @param maxMembers Maximum number of members (2-20)
    /// @param cycleDurationDays Cycle duration in days (1-90)
    /// @param gracePeriodHours Grace period for late contributions in hours (0-168)
    /// @param minReputationScore Minimum reputation score to join (0 = open)
    /// @param isPrivate If true, operator must approve each member
    /// @param stablecoin ERC20 token address (pass address(0) to use default MockUSDC)
    function createPool(
        string calldata name,
        string calldata description,
        uint256 contributionAmount,
        uint256 maxMembers,
        uint256 cycleDurationDays,
        uint256 gracePeriodHours,
        uint256 minReputationScore,
        bool isPrivate,
        address stablecoin
    ) external returns (address poolAddress) {
        require(bytes(name).length > 0, "SusuFactory: name required");
        require(bytes(name).length <= 50, "SusuFactory: name too long");
        require(maxMembers >= 2 && maxMembers <= 20, "SusuFactory: maxMembers must be 2-20");
        require(contributionAmount > 0, "SusuFactory: contributionAmount must be > 0");
        require(
            cycleDurationDays >= 1 && cycleDurationDays <= 90,
            "SusuFactory: cycleDurationDays must be 1-90"
        );
        require(gracePeriodHours <= 168, "SusuFactory: gracePeriodHours must be <= 168");

        address token = stablecoin == address(0) ? defaultStablecoin : stablecoin;
        uint256 cycleDurationSeconds = cycleDurationDays * 1 days;
        uint256 gracePeriodSeconds = gracePeriodHours * 1 hours;

        uint256 poolId = totalPoolsCreated + 1;

        SusuPool pool = new SusuPool(
            poolId,
            name,
            description,
            msg.sender,
            token,
            contributionAmount,
            maxMembers,
            cycleDurationSeconds,
            gracePeriodSeconds,
            minReputationScore,
            isPrivate,
            reputationRegistry,
            address(this)
        );

        poolAddress = address(pool);

        // Authorize pool in reputation registry
        IReputationRegistryFactory(reputationRegistry).authorizePool(poolAddress);

        allPools.push(poolAddress);
        operatorPools[msg.sender].push(poolAddress);
        isPool[poolAddress] = true;
        totalPoolsCreated++;

        emit PoolCreated(poolAddress, msg.sender, name, block.timestamp, poolId);
    }

    // ─── Callback from pools ──────────────────────────────────────────────────

    /// @notice Called by a pool when a member joins. Records membership.
    function registerMember(address pool, address member) external {
        require(isPool[msg.sender], "SusuFactory: caller is not a registered pool");
        // Avoid duplicate entries
        address[] storage pools = memberPools[member];
        for (uint256 i = 0; i < pools.length; i++) {
            if (pools[i] == pool) return;
        }
        memberPools[member].push(pool);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    /// @notice Returns all pools in OPEN or ACTIVE state.
    function getActivePools() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allPools.length; i++) {
            SusuPool.PoolState s = SusuPool(allPools[i]).state();
            if (s == SusuPool.PoolState.OPEN || s == SusuPool.PoolState.ACTIVE) {
                count++;
            }
        }

        address[] memory result = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allPools.length; i++) {
            SusuPool.PoolState s = SusuPool(allPools[i]).state();
            if (s == SusuPool.PoolState.OPEN || s == SusuPool.PoolState.ACTIVE) {
                result[idx++] = allPools[i];
            }
        }
        return result;
    }

    function getPoolsByOperator(address op) external view returns (address[] memory) {
        return operatorPools[op];
    }

    function getPoolsByMember(address member) external view returns (address[] memory) {
        return memberPools[member];
    }

    function getPoolCount() external view returns (uint256) {
        return allPools.length;
    }
}
