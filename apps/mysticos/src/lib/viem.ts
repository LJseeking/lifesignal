import { createPublicClient, createWalletClient, http, custom } from 'viem';
import { bscTestnet } from 'viem/chains';

const RPC_URL = process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/';

export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(RPC_URL),
});

export const getWalletClient = () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return createWalletClient({
      chain: bscTestnet,
      transport: custom((window as any).ethereum),
    });
  }
  return null;
};

export const CONTRACT_ADDRESS = '0xa6A5DbE7D88340Cb90cc759DE6cee6f872f830A6';
