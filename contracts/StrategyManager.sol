// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80);
    function decimals() external view returns (uint8);
}

contract StrategyManager {
    AggregatorV3Interface public priceFeed;

    uint256 public lowVolStrikeMultiplier = 110;
    uint256 public highVolStrikeMultiplier = 120;
    uint256 public volatilityThreshold = 500;

    int256 public lastPrice;
    uint256 public lastPriceTimestamp;

    event StrategyUpdated(
        uint256 strikePrice,
        uint256 collateralRatio,
        bool highVol
    );

    constructor(address _priceFeedAddress) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        (, lastPrice, , , ) = priceFeed.latestRoundData();
        lastPriceTimestamp = block.timestamp;
    }

    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function calculateStrikePrice() public view returns (uint256) {
        int256 currentPrice = getLatestPrice();
        require(currentPrice > 0, "Invalid price");
        bool highVol = _isHighVolatility(currentPrice);
        return
            highVol
                ? (uint256(currentPrice) * highVolStrikeMultiplier) / 100
                : (uint256(currentPrice) * lowVolStrikeMultiplier) / 100;
    }

    function calculateCollateralRatio() public view returns (uint256) {
        int256 currentPrice = getLatestPrice();
        return _isHighVolatility(currentPrice) ? 150 : 110;
    }

    function _isHighVolatility(
        int256 currentPrice
    ) internal view returns (bool) {
        if (lastPrice == 0) return false;
        int256 delta = currentPrice - lastPrice;
        if (delta < 0) delta = -delta;
        return uint256(delta) > volatilityThreshold * 1e8;
    }

    function snapshotPrice() external {
        lastPrice = getLatestPrice();
        lastPriceTimestamp = block.timestamp;
    }

    function getStrategyParams()
        external
        view
        returns (
            int256 currentPrice,
            uint256 strikePrice,
            uint256 collateralRatio,
            bool isHighVolatility
        )
    {
        currentPrice = getLatestPrice();
        strikePrice = calculateStrikePrice();
        collateralRatio = calculateCollateralRatio();
        isHighVolatility = _isHighVolatility(currentPrice);
    }
}
