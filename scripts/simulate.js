const hre = require("hardhat");
const addresses = require("../frontend/src/abis/addresses.json");

async function main() {
    const [owner, user1] = await hre.ethers.getSigners();
    const vault = await hre.ethers.getContractAt("Vault", addresses.Vault, owner);
    const mockFeed = await hre.ethers.getContractAt("MockV3Aggregator", addresses.MockV3Aggregator, owner);

    console.log("Step 1: Deposit 5 ETH");
    await (await vault.connect(user1).deposit({ value: hre.ethers.utils.parseEther("5") })).wait();

    console.log("Step 2: Write covered call (60s expiry)");
    await (await vault.writeCoveredCall(60)).wait();
    const cycle = await vault.getActiveCycle();
    console.log("Strike: $" + Number(cycle.strikePrice) / 1e8);

    console.log("Step 3: Collect 0.2 ETH premium");
    await (await vault.collectPremium(0, { value: hre.ethers.utils.parseEther("0.2") })).wait();

    console.log("Step 4: Advance time 61s + set price to $3200");
    await hre.network.provider.send("evm_increaseTime", [61]);
    await hre.network.provider.send("evm_mine");
    await (await mockFeed.updateAnswer(320000000000)).wait();

    console.log("Step 5: Settle option");
    await (await vault.settleOption(0)).wait();

    const pnl = await vault.getPnL();
    const apy = await vault.getAPY();
    const tvl = await vault.getVaultTVL();
    console.log("\n=== RESULTS ===");
    console.log("PnL:", hre.ethers.utils.formatEther(pnl.toString()), "ETH");
    console.log("APY:", Number(apy) / 100, "%");
    console.log("TVL:", hre.ethers.utils.formatEther(tvl), "ETH");
}

main().catch(console.error);
