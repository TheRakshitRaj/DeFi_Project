const { ethers } = require("hardhat");
const addresses = require("../frontend/src/abis/addresses.json");

// ─────────────────────────────────────────────────────
// PRICE SOURCES — Fallback chain
// ─────────────────────────────────────────────────────
const PRICE_SOURCES = [
    {
        name: "Binance",
        url: "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT",
        extract: (data) => parseFloat(data.price)
    },
    {
        name: "Coinbase",
        url: "https://api.coinbase.com/v2/prices/ETH-USD/spot",
        extract: (data) => parseFloat(data.data.amount)
    },
    {
        name: "CoinCap",
        url: "https://api.coincap.io/v2/assets/ethereum",
        extract: (data) => parseFloat(data.data.priceUsd)
    }
];

// ─────────────────────────────────────────────────────
// Fetch ETH price from sources with fallback
// ─────────────────────────────────────────────────────
async function fetchETHPrice() {
    for (const source of PRICE_SOURCES) {
        try {
            const res = await fetch(source.url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const price = source.extract(data);
            if (!price || price <= 0) throw new Error("Invalid price returned");
            console.log(`📡 Source: ${source.name} | ETH Price: $${price.toFixed(2)}`);
            return { price, source: source.name };
        } catch (err) {
            console.log(`⚠️  ${source.name} failed: ${err.message}`);
        }
    }
    throw new Error("❌ All price sources failed");
}

// ─────────────────────────────────────────────────────
// Update MockV3Aggregator with new price
// ─────────────────────────────────────────────────────
async function updateMockFeed(price) {
    const [signer] = await ethers.getSigners();

    const mockFeed = await ethers.getContractAt(
        "MockV3Aggregator",
        addresses.MockV3Aggregator,
        signer
    );

    // Chainlink format: multiply by 1e8
    // Example: $3247.83 → 324783000000
    const chainlinkFormatPrice = Math.round(price * 1e8);

    const tx = await mockFeed.updateAnswer(chainlinkFormatPrice);
    await tx.wait();

    console.log(`✅ Mock feed updated: $${price.toFixed(2)} → onchain: ${chainlinkFormatPrice}`);
}

// ─────────────────────────────────────────────────────
// Also snapshot price in StrategyManager
// ─────────────────────────────────────────────────────
async function snapshotStrategy() {
    try {
        const [signer] = await ethers.getSigners();
        const strategyManager = await ethers.getContractAt(
            "StrategyManager",
            addresses.StrategyManager,
            signer
        );
        const tx = await strategyManager.snapshotPrice();
        await tx.wait();
        console.log(`📸 StrategyManager price snapshot taken`);
    } catch (err) {
        // Non-critical — just log
        console.log(`ℹ️  Snapshot skipped: ${err.message}`);
    }
}

// ─────────────────────────────────────────────────────
// Main loop
// ─────────────────────────────────────────────────────
async function main() {
    console.log("═".repeat(55));
    console.log("  🚀 DynVault — Real-Time ETH Price Updater");
    console.log("  📊 Binance → Coinbase → CoinCap (fallback chain)");
    console.log("  ⏱️  Interval: 30 seconds");
    console.log("═".repeat(55));
    console.log("");

    let lastPrice = null;
    let updateCount = 0;

    while (true) {
        try {
            console.log(`\n[Update #${++updateCount}] ${new Date().toLocaleTimeString()}`);
            console.log("─".repeat(45));

            const { price, source } = await fetchETHPrice();

            // Calculate change from last price
            if (lastPrice !== null) {
                const change = ((price - lastPrice) / lastPrice * 100);
                const direction = price > lastPrice ? "📈" : price < lastPrice ? "📉" : "➡️ ";
                console.log(`${direction} Price change: ${change >= 0 ? "+" : ""}${change.toFixed(3)}%`);

                // Volatility hint for demo
                const absChange = Math.abs(change);
                if (absChange > 1) {
                    console.log(`🔴 HIGH VOLATILITY detected (${absChange.toFixed(2)}% move)`);
                } else {
                    console.log(`🟢 LOW VOLATILITY (${absChange.toFixed(2)}% move)`);
                }
            }

            await updateMockFeed(price);

            // Snapshot on every update so StrategyManager always has fresh data
            await snapshotStrategy();

            lastPrice = price;

        } catch (err) {
            console.error(`\n❌ Update cycle failed: ${err.message}`);
            console.log("🔄 Will retry in 30 seconds...");
        }

        // Wait 30 seconds before next update
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
