import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const { viem } = connection;
  const publicClient = await viem.getPublicClient();

  const address = process.env.COUNTER_ADDRESS as `0x${string}`;
  if (!address) throw new Error("Missing COUNTER_ADDRESS in .env");

  const counter = await viem.getContractAt("Counter", address);

  const x = await counter.read.x();
  const chainId = await publicClient.getChainId();

  console.log("chainId:", chainId);
  console.log("counter:", address);
  console.log("x =", x.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
