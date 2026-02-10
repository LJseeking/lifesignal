import hre from "hardhat";

async function main() {
  // Hardhat 3: viem lives on the network connection
  const connection = await hre.network.connect();
  const { viem } = connection;

  const [walletClient] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  console.log("Network (cli):", process.env.HARDHAT_NETWORK);
  console.log("Deployer:", walletClient.account.address);

  const counter = await viem.deployContract("Counter", []);
  console.log("Counter deployed to:", counter.address);

  const hash = counter.deploymentTransactionHash;
  if (hash) {
    console.log("Tx hash:", hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Confirmed in block:", receipt.blockNumber.toString());
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
