// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice Testnet USDC mock for Susu Protocol. Permissionless faucet for testing.
contract MockUSDC is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 1000 * 10 ** 6; // 1000 mUSDC
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    mapping(address => uint256) public lastClaim;

    event Faucet(address indexed recipient, uint256 amount);

    constructor() ERC20("Mock USDC", "mUSDC") {
        // Mint 1,000,000 mUSDC to deployer for initial liquidity
        _mint(msg.sender, 1_000_000 * 10 ** 6);
    }

    /// @notice Returns 6 decimals to match real USDC
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Claim 1000 mUSDC — rate limited to once per 24 hours per address
    function faucet() external {
        require(
            block.timestamp >= lastClaim[msg.sender] + FAUCET_COOLDOWN,
            "MockUSDC: faucet cooldown not elapsed"
        );
        lastClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit Faucet(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Returns seconds until next faucet claim is available for an address
    function timeUntilNextClaim(address user) external view returns (uint256) {
        uint256 nextClaim = lastClaim[user] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextClaim) return 0;
        return nextClaim - block.timestamp;
    }
}
