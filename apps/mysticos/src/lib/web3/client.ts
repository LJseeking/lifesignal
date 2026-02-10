import { createPublicClient, createWalletClient, http, custom } from "viem";
import { bscTestnet } from "viem/chains";

export const getPublicClient = () => {
  return createPublicClient({
    chain: bscTestnet,
    transport: http(),
  });
};

export const getWalletClient = () => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return createWalletClient({
      chain: bscTestnet,
      transport: custom((window as any).ethereum),
    });
  }
  return null;
};
