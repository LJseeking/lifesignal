import { expect } from "chai";
import { ethers } from "hardhat";
import { SignalToken, EnergyVault } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EnergyVault", function () {
  let signalToken: SignalToken;
  let energyVault: EnergyVault;
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let treasury: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const ALICE_BALANCE = ethers.parseEther("100"); // 100 tokens

  beforeEach(async function () {
    [deployer, alice, treasury] = await ethers.getSigners();

    // Deploy SignalToken
    const SignalTokenFactory = await ethers.getContractFactory("SignalToken");
    signalToken = await SignalTokenFactory.deploy(INITIAL_SUPPLY);

    // Deploy EnergyVault
    const EnergyVaultFactory = await ethers.getContractFactory("EnergyVault");
    energyVault = await EnergyVaultFactory.deploy(await signalToken.getAddress(), treasury.address);

    // Transfer some tokens to Alice
    await signalToken.transfer(alice.address, ALICE_BALANCE);
  });

  describe("Charge", function () {
    it("Case 1: charge should successfully transfer tokens to treasury", async function () {
      const amount = ethers.parseEther("10"); // 10 tokens

      // Alice approves the vault
      await signalToken.connect(alice).approve(await energyVault.getAddress(), amount);

      // Record balances before charge
      const aliceBalanceBefore = await signalToken.balanceOf(alice.address);
      const treasuryBalanceBefore = await signalToken.balanceOf(treasury.address);

      // Alice charges energy
      await energyVault.connect(alice).charge(amount);

      // Verify balances after charge
      expect(await signalToken.balanceOf(alice.address)).to.equal(aliceBalanceBefore - amount);
      expect(await signalToken.balanceOf(treasury.address)).to.equal(treasuryBalanceBefore + amount);
    });

    it("Case 2: should emit EnergyCharged event with correct energyCredit", async function () {
      // Subcase A: 1 token = 10 credits
      const amount1 = ethers.parseEther("1");
      await signalToken.connect(alice).approve(await energyVault.getAddress(), amount1);
      
      await expect(energyVault.connect(alice).charge(amount1))
        .to.emit(energyVault, "EnergyCharged")
        .withArgs(alice.address, amount1, 10);

      // Subcase B: 2.5 tokens = 25 credits
      const amount2 = ethers.parseEther("2.5");
      await signalToken.connect(alice).approve(await energyVault.getAddress(), amount2);

      await expect(energyVault.connect(alice).charge(amount2))
        .to.emit(energyVault, "EnergyCharged")
        .withArgs(alice.address, amount2, 25);
    });

    it("Case 3: tokenAmount=0 should revert with INVALID_AMOUNT", async function () {
      await expect(energyVault.connect(alice).charge(0))
        .to.be.revertedWith("INVALID_AMOUNT");
    });

    it("Case 4: charge without approval should revert", async function () {
      const amount = ethers.parseEther("10");
      // Alice does NOT approve the vault
      await expect(energyVault.connect(alice).charge(amount))
        .to.be.revertedWithCustomError(signalToken, "ERC20InsufficientAllowance");
    });
  });

  describe("Quote", function () {
    it("should return correct quote for different amounts", async function () {
      expect(await energyVault.quoteEnergyCredit(ethers.parseEther("1"))).to.equal(10);
      expect(await energyVault.quoteEnergyCredit(ethers.parseEther("0.1"))).to.equal(1);
      expect(await energyVault.quoteEnergyCredit(ethers.parseEther("0.09"))).to.equal(0); // floor logic
    });
  });
});
