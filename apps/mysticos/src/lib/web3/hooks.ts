import { useState, useCallback, useEffect } from "react";
import { Address, isAddress } from "viem";
import { getPublicClient } from "./client";
import { ERC20_ABI } from "./abis";
import { CONTRACT_ADDRESSES } from "./config";

export function useTokenData(address: Address | null) {
  const [data, setData] = useState({
    balance: BigInt(0),
    allowance: BigInt(0),
    treasuryBalance: BigInt(0),
    decimals: 18,
    symbol: "SIGNAL",
    loading: false,
  });

  const refresh = useCallback(async () => {
    // 即使地址为空，我们也可以读取 Treasury 的余额
    setData((prev) => ({ ...prev, loading: true }));
    const client = getPublicClient();

    try {
      const calls = [
        client.readContract({
          address: CONTRACT_ADDRESSES.SIGNAL_TOKEN as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
        client.readContract({
          address: CONTRACT_ADDRESSES.SIGNAL_TOKEN as Address,
          abi: ERC20_ABI,
          functionName: "symbol",
        }),
        client.readContract({
          address: CONTRACT_ADDRESSES.SIGNAL_TOKEN as Address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [CONTRACT_ADDRESSES.TREASURY as Address],
        }),
      ];

      if (address && isAddress(address)) {
        calls.push(
          client.readContract({
            address: CONTRACT_ADDRESSES.SIGNAL_TOKEN as Address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          }),
          client.readContract({
            address: CONTRACT_ADDRESSES.SIGNAL_TOKEN as Address,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, CONTRACT_ADDRESSES.ENERGY_VAULT as Address],
          })
        );
      }

      const results = await Promise.all(calls);

      setData({
        decimals: results[0] as number,
        symbol: results[1] as string,
        treasuryBalance: results[2] as bigint,
        balance: address ? (results[3] as bigint) : BigInt(0),
        allowance: address ? (results[4] as bigint) : BigInt(0),
        loading: false,
      });
    } catch (error) {
      setData((prev) => ({ ...prev, loading: false }));
    }
  }, [address]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { ...data, refresh };
}
