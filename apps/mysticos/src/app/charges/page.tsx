"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ChevronLeft, 
  History, 
  ExternalLink, 
  RefreshCw, 
  User, 
  Zap,
  Calendar,
  Hash,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { formatUnits } from "viem";
import { BSC_TESTNET_CONFIG } from "@/lib/web3/config";

interface ChargeRecord {
  id: number;
  tx_hash: string;
  log_index: number;
  block_number: number;
  user: string;
  token_amount: string;
  energy_credit: string;
  timestamp: number;
}

export default function ChargesHistoryPage() {
  const [records, setRecords] = useState<ChargeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userFilter, setUserFilter] = useState("");

  const fetchRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const url = new URL("/api/charges", window.location.origin);
      if (userFilter) url.searchParams.append("user", userFilter);
      
      const res = await fetch(url.toString());
      const json = await res.json();
      
      if (json.success) {
        setRecords(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch charges:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="px-6 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/charge" className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">返回充能</span>
          </Link>
          <button 
            onClick={() => fetchRecords(true)}
            disabled={refreshing}
            className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
            <History className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">充能记录</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5 uppercase tracking-widest">基于链上事件的实时同步数据</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-8 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <input 
            type="text"
            placeholder="按钱包地址搜索..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium">正在读取链上记录...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
              <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 text-sm font-medium">暂无充能记录</p>
            </div>
          ) : (
            records.map((record) => (
              <div 
                key={`${record.tx_hash}-${record.log_index}`}
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900">+{record.energy_credit}</span>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Credits</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />
                        {formatDate(record.timestamp)}
                      </div>
                    </div>
                  </div>
                  <a 
                    href={`${BSC_TESTNET_CONFIG.blockExplorers.default.url}/tx/${record.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="在 BscScan 查看"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">用户</p>
                    <p className="font-mono text-[11px] font-bold text-slate-600">{shortAddr(record.user)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">消耗</p>
                    <p className="font-bold text-slate-600">
                      {formatUnits(BigInt(record.token_amount), 18)} <span className="text-[10px] text-slate-400">SIGNAL</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-300 font-mono">
                  <Hash className="w-2.5 h-2.5" />
                  <span>Block: {record.block_number}</span>
                  <span className="mx-1">•</span>
                  <span className="truncate">Tx: {record.tx_hash.slice(0, 20)}...</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info */}
        {!loading && records.length > 0 && (
          <p className="mt-8 text-center text-[10px] text-slate-400 font-medium px-10 leading-relaxed italic">
            * 数据直接从 BSC Testnet 节点同步，确保与链上真实交易一致。
          </p>
        )}
      </div>
    </div>
  );
}
