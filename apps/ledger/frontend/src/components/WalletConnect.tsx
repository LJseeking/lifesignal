"use client";
import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { devLogin } from '@/lib/api';

export default function WalletConnect() {
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Manual Input State
  const [manualId, setManualId] = useState('');
  const [mode, setMode] = useState<'wallet' | 'manual'>('wallet');

  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    // Support both new generic identifier and old wallet_address
    const storedId = localStorage.getItem('user_identifier') || localStorage.getItem('wallet_address');
    
    if (storedToken && storedId) {
      setToken(storedToken);
      setIdentifier(storedId);
    }
  }, []);

  const connectWallet = async () => {
    setError(null);
    if (!(window as any).ethereum) {
      setError('MetaMask not found');
      return;
    }

    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      await login(accounts[0]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleManualLogin = async () => {
    if (!manualId.trim()) return;
    await login(manualId);
  };

  const login = async (id: string) => {
    setLoading(true);
    try {
      const data = await devLogin(id);
      localStorage.setItem('jwt_token', data.accessToken);
      localStorage.setItem('user_identifier', id);
      setToken(data.accessToken);
      setIdentifier(id);
      window.location.reload(); 
    } catch (err: any) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear(); // Simple clear for demo
    setIdentifier(null);
    setToken(null);
    window.location.reload();
  };

  if (identifier && token) {
    const isWallet = identifier.startsWith('0x') && identifier.length === 42;
    return (
      <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isWallet ? 'Wallet Connected' : 'Dev User'}
          </span>
          <span className="text-xs font-mono font-bold text-slate-700">
            {isWallet ? `${identifier.slice(0, 6)}...${identifier.slice(-4)}` : identifier}
          </span>
        </div>
        <button 
          onClick={logout}
          className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-300 transition-colors"
        >
          Exit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
        <button 
          onClick={() => setMode('wallet')}
          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'wallet' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Wallet
        </button>
        <button 
          onClick={() => setMode('manual')}
          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'manual' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Manual
        </button>
      </div>

      {mode === 'wallet' ? (
        <button 
          onClick={connectWallet}
          disabled={loading}
          className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          {loading ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      ) : (
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="User ID (e.g. u1)"
            value={manualId}
            onChange={e => setManualId(e.target.value)}
            className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={e => e.key === 'Enter' && handleManualLogin()}
          />
          <button 
            onClick={handleManualLogin}
            disabled={loading || !manualId}
            className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go
          </button>
        </div>
      )}
      
      {error && <span className="text-[10px] text-red-500 font-bold">{error}</span>}
    </div>
  );
}
