import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const { viem } = connection;
  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients();

  const address = process.env.COUNTER_ADDRESS as `0x${string}`;
  if (!address) throw new Error("Missing COUNTER_ADDRESS in .env");

  const counter = await viem.getContractAt("Counter", address);

  console.log("from:", walletClient.account.address);
  console.log("counter:", address);

  const hash = await counter.write.inc();
  console.log("tx:", hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("status:", receipt.status);
  console.log("block:", receipt.blockNumber.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
