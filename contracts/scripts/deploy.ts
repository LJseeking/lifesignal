import { ethers } from "hardhat";

const SIGNAL_TOKEN = "0x89b2aD69f84775F22eD798b8DF15323441537938";

async function main() {
  const [deployer] = await ethers.getSigners();

  const tokenAddress = SIGNAL_TOKEN;
  const treasuryAddress = deployer.address; // ✅ 明确指定

  console.log("Deploying with account:", deployer.address);
  console.log("Token address:", tokenAddress);
  console.log("Treasury address:", treasuryAddress);

  // ✅ 强制校验，避免任何“空值”混入
  if (!ethers.isAddress(tokenAddress) || tokenAddress === ethers.ZeroAddress) {
    throw new Error("TOKEN_ADDRESS_INVALID");
  }
  if (!ethers.isAddress(treasuryAddress) || treasuryAddress === ethers.ZeroAddress) {
    throw new Error("TREASURY_ADDRESS_INVALID");
  }

  console.log("Deploying EnergyVault...");
  const EnergyVault = await ethers.getContractFactory("EnergyVault");
  const vault = await EnergyVault.deploy(tokenAddress, treasuryAddress);
  await vault.waitForDeployment();

  console.log("EnergyVault deployed to:", await vault.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
