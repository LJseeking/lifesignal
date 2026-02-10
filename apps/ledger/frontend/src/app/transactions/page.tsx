"use client";
import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/api';
import WalletConnect from '@/components/WalletConnect';
import Link from 'next/link';

export default function TransactionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchItems = useCallback(async (cursor: string | null = null) => {
    setLoading(true);
    try {
      const url = `/credits/transactions?limit=20${cursor ? `&cursor=${cursor}` : ''}`;
      const data = await fetchWithAuth(url);
      
      if (cursor) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <Link href="/" className="text-sm font-bold text-indigo-600 hover:underline">← Back to Overview</Link>
        <WalletConnect />
      </div>

      <h1 className="text-3xl font-black text-slate-900">Transaction History</h1>

      <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-50">
          {items.map((tx) => (
            <div key={tx.eventUid} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors group">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                    tx.type === 'EARN' ? 'bg-green-100 text-green-600' : 
                    tx.type === 'SPEND' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {tx.type}
                  </span>
                  <p className="font-bold text-slate-800">{tx.title || 'Untitled'}</p>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  {new Date(tx.occurredAt).toLocaleString()} • ID: {tx.eventUid.slice(0, 8)}...
                </p>
              </div>
              <div className={`font-black text-xl ${tx.amount.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>
                {tx.amount.startsWith('-') ? '' : '+'}{tx.amount}
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="p-8 text-center border-t border-slate-50">
            <button 
              onClick={() => fetchItems(nextCursor)}
              disabled={loading}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? 'Loading...' : 'Load More Records'}
            </button>
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <p className="p-8 text-center text-xs text-slate-300 font-medium uppercase tracking-widest">
            End of history
          </p>
        )}
      </div>
    </div>
  );
}
