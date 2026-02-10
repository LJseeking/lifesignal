import { createPublicClient, http, parseUnits } from 'viem';
import { bscTestnet } from 'viem/chains';

export const SIGNAL_TOKEN_ADDRESS = '0x89b2aD69f84775F22eD798b8DF15323441537938';
export const ENERGY_VAULT_ADDRESS = '0xa6A5DbE7D88340Cb90cc759DE6cee6f872f830A6';

export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http('https://bsc-testnet-rpc.publicnode.com'),
});

export function toTokenAmount(amount: string) {
  return parseUnits(amount, 18);
}
