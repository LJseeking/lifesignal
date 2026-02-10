"use client";

import React, { useState, useCallback, useMemo } from "react";
import { 
  Address, 
  formatUnits, 
  parseUnits, 
  isAddress,
  decodeEventLog,
  parseEventLogs
} from "viem";
import { bscTestnet } from "viem/chains";
import Link from "next/link";
import { 
  ChevronLeft, 
  Zap, 
  Wallet, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Info,
  History
} from "lucide-react";

import { CHAIN_ID, CONTRACT_ADDRESSES, BSC_TESTNET_CONFIG } from "@/lib/web3/config";
import { ERC20_ABI, ENERGY_VAULT_ABI } from "@/lib/web3/abis";
import { getPublicClient, getWalletClient } from "@/lib/web3/client";
import { useTokenData } from "@/lib/web3/hooks";

type TxStatus = "idle" | "pending" | "success" | "failed";

interface ChargeResult {
  tokenAmount: bigint;
  energyCredit: bigint;
  user: string;
}

export default function ChargePage() {
  const [address, setAddress] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("1");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [chargeResult, setChargeResult] = useState<ChargeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // 获取代币与余额数据 (含 Treasury 余额)
  const { balance, allowance, treasuryBalance, decimals, symbol, loading: isRefreshing, refresh } = useTokenData(address);

  // 账户语义校验：禁止 Treasury 发起交易
  const isTreasuryConnected = useMemo(() => {
    return address?.toLowerCase() === CONTRACT_ADDRESSES.TREASURY.toLowerCase();
  }, [address]);

  // 连接钱包逻辑
  const connectWallet = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const walletClient = getWalletClient();
      if (!walletClient) throw new Error("未检测到 MetaMask，请先安装钱包扩展");
      
      const [addr] = await walletClient.requestAddresses();
      const id = await walletClient.getChainId();
      
      setAddress(addr);
      setChainId(id);
    } catch (err: any) {
      setError(err.message || "连接钱包失败");
    } finally {
      setIsConnecting(false);
    }
  };

  // 网络切换逻辑
  const switchNetwork = async () => {
    const walletClient = getWalletClient();
    if (!walletClient) return;
    try {
      await walletClient.switchChain({ id: CHAIN_ID });
      setChainId(CHAIN_ID);
    } catch (err: any) {
      if (err.code === 4902) {
        await walletClient.addChain({ chain: bscTestnet });
      } else {
        setError("切换网络失败，请在钱包中手动操作");
      }
    }
  };

  // 错误消息语义化解析
  const parseWeb3Error = (err: any) => {
    const msg = err.message || "";
    const shortMsg = err.shortMessage || "";

    if (msg.includes("User rejected the request")) return "用户拒绝了签名请求";
    if (msg.includes("insufficient funds")) return "账户 tBNB 余额不足以支付 Gas 费用";
    if (msg.includes("ERC20: transfer amount exceeds balance")) return "SIGNAL 代币余额不足";
    if (msg.includes("0xfb8f41b2") || shortMsg.includes("ERC20InsufficientAllowance")) return "授权额度不足，请先完成 Approve 交易";
    
    return shortMsg || msg.slice(0, 100) || "发生未知错误";
  };

  // Step A: Approve (授权 Vault 扣款)
  const handleApprove = async () => {
    if (!address || !amount || isTreasuryConnected) return;
    setTxStatus("pending");
    setError(null);
    setTxHash(null);

    try {
      const walletClient = getWalletClient();
      const pubClient = getPublicClient();
      if (!walletClient) throw new Error("钱包未就绪");

      const parsedAmount = parseUnits(amount, decimals);
      
      const { request } = await pubClient.simulateContract({
        account: address,
        address: CONTRACT_ADDRESSES.SIGNAL_TOKEN as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.ENERGY_VAULT as Address, parsedAmount],
      });

      const hash = await walletClient.writeContract(request);
      setTxHash(hash);
      
      await pubClient.waitForTransactionReceipt({ hash });
      await refresh();
      setTxStatus("success");
    } catch (err: any) {
      setTxStatus("failed");
      setError(parseWeb3Error(err));
    }
  };

  // Step B: Charge (用户调用 Vault 发起转账)
  const handleCharge = async () => {
    if (!address || !amount || isTreasuryConnected) return;
    setTxStatus("pending");
    setError(null);
    setTxHash(null);
    setChargeResult(null);

    try {
      const walletClient = getWalletClient();
      const pubClient = getPublicClient();
      if (!walletClient) throw new Error("钱包未就绪");

      const parsedAmount = parseUnits(amount, decimals);
      
      // 1. 模拟交易并校验
      const { request } = await pubClient.simulateContract({
        account: address,
        address: CONTRACT_ADDRESSES.ENERGY_VAULT as Address,
        abi: ENERGY_VAULT_ABI,
        functionName: "charge",
        args: [parsedAmount],
      });

      // 2. 发起写入
      const hash = await walletClient.writeContract(request);
      setTxHash(hash);
      
      // 3. 等待 Receipt 并解析 Event
      const receipt = await pubClient.waitForTransactionReceipt({ hash });
      
      // 解析 EnergyCharged 事件
      const logs = parseEventLogs({
        abi: ENERGY_VAULT_ABI,
        eventName: "EnergyCharged",
        logs: receipt.logs,
      });

      if (logs.length > 0) {
        const { user, tokenAmount, energyCredit } = logs[0].args;
        setChargeResult({ 
          user: user as string, 
          tokenAmount: tokenAmount as bigint, 
          energyCredit: energyCredit as bigint 
        });
      }

      await refresh();
      setTxStatus("success");
    } catch (err: any) {
      setTxStatus("failed");
      setError(parseWeb3Error(err));
    }
  };

  // 状态机辅助计算
  const parsedAmount = useMemo(() => {
    try {
      return amount && !isNaN(Number(amount)) ? parseUnits(amount, decimals) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, [amount, decimals]);

  const isCorrectNetwork = chainId === CHAIN_ID;
  const isApproved = allowance >= parsedAmount && parsedAmount > BigInt(0);
  const hasBalance = balance >= parsedAmount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="px-6 py-8 max-w-lg mx-auto">
        <Link href="/" className="flex items-center text-slate-500 mb-8 hover:text-indigo-600 transition-colors w-fit">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">返回 Life Signal</span>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">充能中心</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Charge Logic Correction v2</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/charges"
              className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
              title="查看充能记录"
            >
              <History className="w-4 h-4" />
            </Link>
            {address && (
              <button 
                onClick={refresh}
                disabled={isRefreshing}
                className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 disabled:opacity-50 transition-all active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* 1. 账户校验与 Treasury 提示 */}
        {isTreasuryConnected && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <p className="text-xs font-bold text-rose-600">
              检测到当前连接的是 Treasury 归集地址。为了安全，Treasury 不允许发起充能操作。请切换回用户钱包。
            </p>
          </div>
        )}

        {/* 2. Wallet Status Card */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-6">
          {!address ? (
            <button 
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
            >
              {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
              <span>Connect Wallet</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signer (From)</span>
                <span className="font-mono text-xs font-bold bg-slate-50 px-3 py-1 rounded-full text-slate-600">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className={`text-xs font-bold ${isCorrectNetwork ? 'text-slate-600' : 'text-rose-500'}`}>
                    {isCorrectNetwork ? 'BSC Testnet (97)' : `Wrong Chain (${chainId})`}
                  </span>
                  {!isCorrectNetwork && (
                    <button onClick={switchNetwork} className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md font-black text-[9px] uppercase border border-rose-100">Switch</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Balance Comparison Section */}
        {address && isCorrectNetwork && (
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Balance</span>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">{formatUnits(balance, decimals)}</span>
                  <span className="text-[10px] font-black text-slate-400 ml-1">{symbol}</span>
                </div>
              </div>
              <div className="h-[1px] bg-slate-50" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Treasury Balance</span>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-400">{formatUnits(treasuryBalance, decimals)}</span>
                  <span className="text-[10px] font-black text-slate-300 ml-1">{symbol}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Main Charge UI */}
        <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden mb-6">
          <div className="absolute -right-6 -top-6 opacity-[0.03]">
            <Zap className="w-48 h-48 rotate-12 fill-white" />
          </div>
          
          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount (Wei Semantics)</label>
                <p className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  1 {symbol} = 10 Credits
                </p>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-2xl font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-indigo-400 uppercase">{symbol}</span>
              </div>
              <div className="flex items-center gap-2 px-1 text-slate-400 text-[10px] font-bold">
                <Info className="w-3 h-3" />
                <span>Transfer Path: {address ? `${address.slice(0,6)}...` : 'User'} → Treasury</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {!address ? (
                <button disabled className="w-full bg-white/5 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest border border-white/5">
                  Wallet Not Connected
                </button>
              ) : isTreasuryConnected ? (
                <button disabled className="w-full bg-rose-900/50 text-rose-400 py-4 rounded-2xl font-black uppercase tracking-widest border border-rose-500/20 cursor-not-allowed">
                  Treasury Signer Blocked
                </button>
              ) : !isCorrectNetwork ? (
                <button onClick={switchNetwork} className="w-full bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all">
                  Switch to BSC Testnet
                </button>
              ) : !isApproved ? (
                <button 
                  onClick={handleApprove}
                  disabled={txStatus === "pending" || Number(amount) <= 0 || !hasBalance}
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {txStatus === "pending" ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  <span>Approve SIGNAL (Wei)</span>
                </button>
              ) : (
                <button 
                  onClick={handleCharge}
                  disabled={txStatus === "pending" || Number(amount) <= 0 || !hasBalance}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {txStatus === "pending" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-white" />}
                  <span>Confirm Charge (On-chain)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5. Business Verification (Events & Receipts) */}
        {txStatus === "success" && chargeResult && (
          <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[32px] mb-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">业务执行成功</p>
                <p className="text-[10px] text-emerald-600/60 font-bold uppercase tracking-widest">EnergyCharged Event Verified</p>
              </div>
            </div>
            
            <div className="bg-white/60 rounded-2xl p-4 space-y-3 mb-4 border border-emerald-100">
              <div className="flex justify-between text-[10px]">
                <span className="font-black text-emerald-700/50 uppercase">Credits Earned</span>
                <span className="font-black text-emerald-700">+{chargeResult.energyCredit.toString()}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="font-black text-emerald-700/50 uppercase">Tokens Deducted</span>
                <span className="font-black text-emerald-700">{formatUnits(chargeResult.tokenAmount, decimals)} {symbol}</span>
              </div>
            </div>

            <a 
              href={`${BSC_TESTNET_CONFIG.blockExplorers.default.url}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
            >
              <span>View on BscScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* 6. Error Feedback */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 mb-6">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-black text-rose-600 uppercase tracking-wider">Semantic Error</p>
              <p className="text-xs font-bold text-rose-500/80 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="p-8 bg-slate-100/50 rounded-[40px] border border-slate-100">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <History className="w-4 h-4" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Semantic Verification</h4>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Treasury Account (To)</p>
              <p className="font-mono text-[9px] text-slate-500 break-all bg-white/80 p-3 rounded-xl border border-slate-100">{CONTRACT_ADDRESSES.TREASURY}</p>
            </div>
            <p className="text-[9px] font-bold text-slate-400 leading-relaxed italic border-t border-slate-200 pt-4">
              * Correction Note: Scheme B implemented. Frontend parses units to 18 decimals (Wei) before sending to EnergyVault.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
