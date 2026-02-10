"use client";
import { useState, useEffect } from 'react';

export default function UserSelector() {
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('userId') || 'u1';
    setUserId(saved);
  }, []);

  const handleSave = () => {
    localStorage.setItem('userId', userId);
    window.location.reload(); // 刷新页面以应用新 ID
  };

  return (
    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
      <span className="text-xs font-bold text-slate-500 uppercase ml-2">User ID:</span>
      <input 
        type="text" 
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button 
        onClick={handleSave}
        className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Apply
      </button>
    </div>
  );
}
