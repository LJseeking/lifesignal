"use client";
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import WalletConnect from '@/components/WalletConnect';
import Link from 'next/link';

export default function Overview() {
  const [summary, setSummary] = useState<any>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Create Event State
  const [amount, setAmount] = useState('100');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const loadData = async () => {
      try {
        const [sumData, txData] = await Promise.all([
          fetchWithAuth('/credits/summary'),
          fetchWithAuth('/credits/transactions?limit=5')
        ]);
        setSummary(sumData);
        setTxs(txData.items);
      } catch (err: any) {
        // Ignore auth errors (user needs to login)
        if (!err.message.includes('401')) {
          setError(err.message);
        }
      }
    };
    if (localStorage.getItem('jwt_token')) {
      loadData();
    }
  }, []);

  const handleEarn = async () => {
    setSubmitting(true);
    try {
      await fetchWithAuth('/credits/events', {
        method: 'POST',
        body: JSON.stringify({
          eventUid: `evt-${Date.now()}`,
          type: 'EARN',
          amount: amount,
          source: 'frontend-manual',
          title: 'Manual Earn',
          occurredAt: new Date().toISOString()
        })
      });
      window.location.reload();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-black text-slate-900 tracking-tight italic">CREDIT_LEDGER <span className="text-indigo-500">v0.6</span></h1>
        <WalletConnect />
      </div>

      {!summary ? (
        <div className="p-20 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-300">
          <p className="text-slate-400 font-bold">Please connect wallet to view ledger</p>
        </div>
      ) : (
        <>
          <header className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-indigo-600 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl font-black">
                {summary.currency}
              </div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total Balance</h2>
              <div className="flex items-baseline gap-3 relative z-10">
                <span className="text-7xl font-black leading-none">{summary.balance}</span>
                <span className="text-xl font-bold opacity-80 uppercase tracking-widest">Credits</span>
              </div>
            </div>
            
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Quick Action</p>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                  <button 
                    onClick={handleEarn}
                    disabled={submitting}
                    className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    EARN
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-xs font-mono text-slate-400">
                 <span>In: +{summary.earnedTotal}</span>
                 <span>Out: -{summary.spentTotal}</span>
              </div>
            </div>
          </header>

          <section className="space-y-6">
            <div className="flex justify-between items-end px-4">
              <h2 className="text-lg font-black text-slate-900">Recent Stream</h2>
              <Link href="/transactions" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-all">
                Full History →
              </Link>
            </div>
            
            <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-50">
                {txs.length === 0 ? (
                  <p className="p-10 text-center text-slate-300 font-bold uppercase tracking-widest">No transactions yet</p>
                ) : txs.map(tx => (
                  <div key={tx.eventUid} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                         <span className={`w-2 h-2 rounded-full ${tx.type === 'EARN' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                         <p className="font-bold text-slate-800">{tx.title || 'Untitled'}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{new Date(tx.occurredAt).toLocaleString()}</p>
                    </div>
                    <div className={`font-black text-lg ${tx.amount.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>
                      {tx.amount.startsWith('-') ? '' : '+'}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-500 rounded-xl text-center text-sm font-bold">
          {error}
        </div>
      )}

      <footer className="text-center">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">
          {summary ? `Last Sync: ${new Date(summary.updatedAt).toLocaleTimeString()}` : 'Not Connected'}
        </p>
      </footer>
    </div>
  );
}
