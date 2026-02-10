/**
 * Web3 核心配置
 * 
 * 单位语义说明：
 * - 链上调用统一使用最小单位 (Wei/Smallest Unit)。
 * - 1 SIGNAL = 10^18 Wei。
 * - 充能换算：1 SIGNAL (1e18 Wei) = 10 Credits。
 */

export const CHAIN_ID = 97; // BSC Testnet

export const CONTRACT_ADDRESSES = {
  // SIGNAL 代币合约 (ERC-20)
  SIGNAL_TOKEN: "0x89b2aD69f84775F22eD798b8DF15323441537938",
  
  // 充能金库合约 (结算层)
  ENERGY_VAULT: "0xa6A5DbE7D88340Cb90cc759DE6cee6f872f830A6",
  
  // 资金归集地址 (所有充能的代币最终流向)
  TREASURY: "0x04039C68b9BB638dD032951281013C0F04F01da7",
} as const;

export const BSC_TESTNET_CONFIG = {
  id: CHAIN_ID,
  name: "BSC Testnet",
  network: "bsc-testnet",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://bsc-testnet-rpc.publicnode.com"] },
    public: { http: ["https://bsc-testnet-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://testnet.bscscan.com" },
  },
} as const;
