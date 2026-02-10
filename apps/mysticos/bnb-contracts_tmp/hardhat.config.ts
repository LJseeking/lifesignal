import hardhatVerifyPlugin from "@nomicfoundation/hardhat-verify";

import "dotenv/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: { version: "0.8.28" },
      production: {
        version: "0.8.28",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
    },
  },
  networks: {
  hardhatMainnet: { type: "edr-simulated", chainType: "l1" },
  hardhatOp: { type: "edr-simulated", chainType: "op" },

  // ✅ BNB Testnet（必须有）
  bscTestnet: {
    type: "http",
    chainType: "l1",
    url: process.env.BSC_TESTNET_RPC_URL!, // 这里必须存在
    accounts: process.env.BSC_PRIVATE_KEY ? [process.env.BSC_PRIVATE_KEY] : [],
  },

  // ✅ 只有在你真的配置了环境变量时才加入 sepolia
  ...(process.env.SEPOLIA_RPC_URL && process.env.SEPOLIA_PRIVATE_KEY
    ? {
        sepolia: {
          type: "http",
          chainType: "l1",
          url: process.env.SEPOLIA_RPC_URL,
          accounts: [process.env.SEPOLIA_PRIVATE_KEY],
        },
      }
    : {}),

  // ✅ 只有在你真的配置了主网 RPC 时才加入 bsc
  ...(process.env.BSC_RPC_URL
    ? {
        bsc: {
          type: "http",
          chainType: "l1",
          url: process.env.BSC_RPC_URL,
          accounts: process.env.BSC_MAINNET_PRIVATE_KEY
            ? [process.env.BSC_MAINNET_PRIVATE_KEY]
            : [],
        },
      }
    : {}),
},
});
