// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockOptionToken.sol";
import "./StrategyManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vault is Ownable, ReentrancyGuard {
    StrategyManager public strategyManager;

    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;
    uint256 public totalPremiumCollected;
    uint256 public totalLossFromExercise;

    struct OptionCycle {
        address optionTokenAddress;
        uint256 strikePrice;
        uint256 collateralLocked;
        uint256 premiumCollected;
        uint256 expiry;
        bool settled;
    }

    OptionCycle[] public optionCycles;
    uint256 public activeCycleIndex;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event OptionWritten(
        uint256 cycleIndex,
        uint256 strikePrice,
        uint256 expiry,
        uint256 collateral
    );
    event OptionSettled(
        uint256 cycleIndex,
        bool exercised,
        uint256 settlementPrice
    );
    event PremiumReceived(uint256 cycleIndex, uint256 amount);

    constructor(address _strategyManagerAddress) Ownable(msg.sender) {
        strategyManager = StrategyManager(_strategyManagerAddress);
    }

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Must deposit ETH");
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        require(
            address(this).balance >= amount,
            "Insufficient vault liquidity"
        );
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function writeCoveredCall(uint256 expiryDuration) external onlyOwner {
        require(totalDeposits > 0, "No deposits");
        (, uint256 strikePrice, uint256 collateralRatio, ) = strategyManager
            .getStrategyParams();
        uint256 expiryTimestamp = block.timestamp + expiryDuration;

        MockOptionToken optionToken = new MockOptionToken(
            "ETH Covered Call",
            "ECC",
            strikePrice,
            expiryTimestamp
        );

        uint256 collateralToLock = (totalDeposits * collateralRatio) / 100;
        if (collateralToLock > address(this).balance) {
            collateralToLock = address(this).balance;
        }

        uint256 tokensToMint = collateralToLock / 1e16;
        optionToken.mint(address(this), tokensToMint);

        optionCycles.push(
            OptionCycle({
                optionTokenAddress: address(optionToken),
                strikePrice: strikePrice,
                collateralLocked: collateralToLock,
                premiumCollected: 0,
                expiry: expiryTimestamp,
                settled: false
            })
        );

        activeCycleIndex = optionCycles.length - 1;
        emit OptionWritten(
            activeCycleIndex,
            strikePrice,
            expiryTimestamp,
            collateralToLock
        );
    }

    /// @notice Write a covered call with an AI-recommended strike price
    /// @param aiStrikePrice Strike price in USD with 8 decimals (e.g. 327500000000 = $3275)
    /// @param expiryDuration Seconds until option expires
    function writeCoveredCallWithStrike(
        uint256 aiStrikePrice,
        uint256 expiryDuration
    ) external onlyOwner {
        require(totalDeposits > 0, "No deposits");
        require(aiStrikePrice > 0, "Invalid strike price");

        // Validate: AI strike must be at least 2% above current market price
        int256 currentPrice = strategyManager.getLatestPrice();
        require(currentPrice > 0, "Invalid oracle price");
        uint256 minStrike = (uint256(currentPrice) * 102) / 100;
        require(aiStrikePrice >= minStrike, "Strike too close to market price");

        uint256 expiryTimestamp = block.timestamp + expiryDuration;
        uint256 collateralRatio = strategyManager.calculateCollateralRatio();

        MockOptionToken optionToken = new MockOptionToken(
            "ETH AI Call",
            "EAIC",
            aiStrikePrice,
            expiryTimestamp
        );

        uint256 collateralToLock = (totalDeposits * collateralRatio) / 100;
        if (collateralToLock > address(this).balance) {
            collateralToLock = address(this).balance;
        }

        uint256 tokensToMint = collateralToLock / 1e16;
        optionToken.mint(address(this), tokensToMint);

        optionCycles.push(
            OptionCycle({
                optionTokenAddress: address(optionToken),
                strikePrice: aiStrikePrice,
                collateralLocked: collateralToLock,
                premiumCollected: 0,
                expiry: expiryTimestamp,
                settled: false
            })
        );

        activeCycleIndex = optionCycles.length - 1;
        emit OptionWritten(
            activeCycleIndex,
            aiStrikePrice,
            expiryTimestamp,
            collateralToLock
        );
    }

    function collectPremium(uint256 cycleIndex) external payable {
        require(cycleIndex < optionCycles.length, "Invalid cycle");
        require(!optionCycles[cycleIndex].settled, "Already settled");
        require(msg.value > 0, "Premium must be > 0");
        optionCycles[cycleIndex].premiumCollected += msg.value;
        totalPremiumCollected += msg.value;
        emit PremiumReceived(cycleIndex, msg.value);
    }

    function settleOption(uint256 cycleIndex) external onlyOwner {
        OptionCycle storage cycle = optionCycles[cycleIndex];
        require(!cycle.settled, "Already settled");

        MockOptionToken optionToken = MockOptionToken(cycle.optionTokenAddress);
        int256 currentPrice = strategyManager.getLatestPrice();
        require(currentPrice > 0, "Invalid price");

        bool exercised = uint256(currentPrice) > cycle.strikePrice;

        if (exercised && uint256(currentPrice) > 0) {
            uint256 marketValue = (cycle.collateralLocked *
                uint256(currentPrice)) / cycle.strikePrice;
            if (marketValue > cycle.collateralLocked) {
                totalLossFromExercise += (marketValue - cycle.collateralLocked);
            }
        }

        optionToken.settle(exercised, uint256(currentPrice));
        cycle.settled = true;
        emit OptionSettled(cycleIndex, exercised, uint256(currentPrice));
    }

    function getUserBalance(address user) external view returns (uint256) {
        return deposits[user];
    }

    function getVaultTVL() external view returns (uint256) {
        return address(this).balance;
    }

    function getAPY() external view returns (uint256) {
        if (totalDeposits == 0) return 0;
        uint256 avgPremium = optionCycles.length > 0
            ? totalPremiumCollected / optionCycles.length
            : 0;
        uint256 annualPremium = avgPremium * 52;
        return (annualPremium * 10000) / totalDeposits;
    }

    function getPnL() external view returns (int256) {
        return int256(totalPremiumCollected) - int256(totalLossFromExercise);
    }

    function getOptionCyclesCount() external view returns (uint256) {
        return optionCycles.length;
    }

    function getActiveCycle()
        external
        view
        returns (
            address optionTokenAddress,
            uint256 strikePrice,
            uint256 collateralLocked,
            uint256 premiumCollected,
            uint256 expiry,
            bool settled
        )
    {
        require(optionCycles.length > 0, "No cycles");
        OptionCycle storage c = optionCycles[activeCycleIndex];
        return (
            c.optionTokenAddress,
            c.strikePrice,
            c.collateralLocked,
            c.premiumCollected,
            c.expiry,
            c.settled
        );
    }

    receive() external payable {}
}
