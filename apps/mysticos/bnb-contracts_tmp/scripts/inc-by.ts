import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const { viem } = connection;
  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients();

  const address = process.env.COUNTER_ADDRESS as `0x${string}`;
  if (!address) throw new Error("Missing COUNTER_ADDRESS in .env");

  const by = BigInt(process.env.BY ?? "5");
  if (by <= 0n) throw new Error("BY must be > 0");

  const counter = await viem.getContractAt("Counter", address);

  console.log("from:", walletClient.account.address);
  console.log("incBy:", by.toString());

  const hash = await counter.write.incBy([by]);
  console.log("tx:", hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("status:", receipt.status);
  console.log("block:", receipt.blockNumber.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
