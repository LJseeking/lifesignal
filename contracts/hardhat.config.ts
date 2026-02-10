import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
  },
  networks: {
    hardhat: {},
    bscTestnet: {
      url: "https://data-seed-prebsc-2-s1.bnbchain.org:8545",
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 120000,
    },
  },
};

export default config;
