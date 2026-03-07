const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OptionVault", function () {
    let vault, strategy, mockFeed, owner, user1;

    before(async () => {
        [owner, user1] = await ethers.getSigners();

        const MockFeed = await ethers.getContractFactory("MockV3Aggregator");
        mockFeed = await MockFeed.deploy(8, 300000000000);

        const Strategy = await ethers.getContractFactory("StrategyManager");
        strategy = await Strategy.deploy(mockFeed.address);

        const Vault = await ethers.getContractFactory("Vault");
        vault = await Vault.deploy(strategy.address);
    });

    it("deposits ETH", async () => {
        await vault.connect(user1).deposit({ value: ethers.utils.parseEther("5") });
        const balance = await vault.getUserBalance(user1.address);
        expect(balance.toString()).to.equal(ethers.utils.parseEther("5").toString());
    });

    it("writes covered call", async () => {
        await vault.writeCoveredCall(60);
        const cycle = await vault.getActiveCycle();
        expect(Number(cycle.strikePrice)).to.be.gt(0);
        expect(cycle.settled).to.be.false;
    });

    it("collects premium", async () => {
        await vault.collectPremium(0, { value: ethers.utils.parseEther("0.2") });
        const cycle = await vault.getActiveCycle();
        expect(cycle.premiumCollected.toString()).to.equal(ethers.utils.parseEther("0.2").toString());
    });

    it("settles after expiry", async () => {
        await ethers.provider.send("evm_increaseTime", [61]);
        await ethers.provider.send("evm_mine");
        await vault.settleOption(0);
        const cycle = await vault.getActiveCycle();
        expect(cycle.settled).to.be.true;
    });

    it("withdraws ETH", async () => {
        const before = await ethers.provider.getBalance(user1.address);
        await vault.connect(user1).withdraw(ethers.utils.parseEther("5"));
        const after = await ethers.provider.getBalance(user1.address);
        expect(after.gt(before)).to.be.true;
    });
});
