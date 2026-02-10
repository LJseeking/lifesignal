import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const { viem } = connection;
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  console.log("Hardhat network name:", hre.network.name);
  console.log("RPC chainId:", chainId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
