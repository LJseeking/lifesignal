import { createPublicClient, http, parseUnits } from 'viem';
import { bscTestnet } from 'viem/chains';

export const SIGNAL_TOKEN_ADDRESS = '0x89b2aD69f84775F22eD798b8DF15323441537938';
export const ENERGY_VAULT_ADDRESS = '0xa6A5DbE7D88340Cb90cc759DE6cee6f872f830A6';

// 优先使用环境变量中的 RPC，否则回退到公共节点
const RPC_URL = process.env.PRIMARY_RPC || 'https://bsc-testnet-rpc.publicnode.com';

export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(RPC_URL),
});

export function toTokenAmount(amount: string) {
  return parseUnits(amount, 18);
}
