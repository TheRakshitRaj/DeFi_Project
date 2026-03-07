const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with:", deployer.address);

    // Deploy mock feed — ETH price $3000 (8 decimals = 300000000000)
    const MockAgg = await hre.ethers.getContractFactory("MockV3Aggregator");
    const mockFeed = await MockAgg.deploy(8, 300000000000);
    await mockFeed.deployed();
    console.log("MockV3Aggregator:", mockFeed.address);

    // Deploy StrategyManager
    const StrategyManager = await hre.ethers.getContractFactory("StrategyManager");
    const strategyManager = await StrategyManager.deploy(mockFeed.address);
    await strategyManager.deployed();
    console.log("StrategyManager:", strategyManager.address);

    // Deploy Vault
    const Vault = await hre.ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(strategyManager.address);
    await vault.deployed();
    console.log("Vault:", vault.address);

    // Save addresses
    const addresses = {
        MockV3Aggregator: mockFeed.address,
        StrategyManager: strategyManager.address,
        Vault: vault.address,
        network: "localhost",
        chainId: 31337
    };

    const abiDir = path.join(__dirname, "../frontend/src/abis");
    fs.mkdirSync(abiDir, { recursive: true });

    fs.writeFileSync(
        path.join(abiDir, "addresses.json"),
        JSON.stringify(addresses, null, 2)
    );

    // Save ABIs
    for (const name of ["Vault", "StrategyManager", "MockOptionToken"]) {
        const artifact = await hre.artifacts.readArtifact(name);
        fs.writeFileSync(
            path.join(abiDir, `${name}.json`),
            JSON.stringify(artifact.abi, null, 2)
        );
    }

    console.log("✅ Deployment done. ABIs saved to frontend/src/abis/");
}

main().catch(e => { console.error(e); process.exitCode = 1; });
