'use client';

import React, { useState } from 'react';
import { BatteryCharging, CheckCircle2, Zap } from 'lucide-react';
import { handleCharge } from '@/lib/energy/actions';

interface ChargeOptionsProps {
  userId: string;
  currentLevel: number;
}

const OPTIONS = [
  { amount: 15, label: '+15 Energy', duration: '约 3 天', color: 'bg-indigo-50 text-indigo-600' },
  { amount: 35, label: '+35 Energy', duration: '约 7 天', recommended: true, color: 'bg-indigo-600 text-white' },
  { amount: 70, label: '+70 Energy', duration: '约 14 天', color: 'bg-indigo-50 text-indigo-600' },
];

export function ChargeOptions({ userId, currentLevel }: ChargeOptionsProps) {
  const [selected, setSelected] = useState(OPTIONS[1]);
  const [isCharging, setIsCharging] = useState(false);

  const onCharge = async () => {
    setIsCharging(true);
    const res = await handleCharge(userId, selected.amount);
    if (res.success) {
      // 可以在这里加个成功提示
    }
    setIsCharging(false);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.amount}
            onClick={() => setSelected(opt)}
            className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all active:scale-95 ${
              selected.amount === opt.amount 
                ? 'border-indigo-600 shadow-md scale-105' 
                : 'border-slate-100 hover:border-slate-200 opacity-60'
            } ${opt.color}`}
          >
            {opt.recommended && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                推荐
              </span>
            )}
            <Zap className={`w-5 h-5 mb-2 ${selected.amount === opt.amount ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-black tracking-tighter">{opt.label}</span>
            <span className={`text-[10px] mt-1 font-bold ${selected.amount === opt.amount ? 'opacity-90' : 'opacity-50'}`}>
              {opt.duration}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
        <h4 className="text-xs font-black text-indigo-900 mb-4 uppercase tracking-widest">充能效果预览</h4>
        <div className="space-y-3">
          {[
            '维持连续记忆',
            '提供更完整的状态解读',
            '在关键时刻给出提醒'
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-indigo-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{text}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[10px] text-indigo-400 font-medium italic">
          充能后，Signal 将有足够的能量维持深度 AI 计算模块的运行。
        </p>
      </div>

      <button
        onClick={onCharge}
        disabled={isCharging}
        className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {isCharging ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <BatteryCharging className="w-6 h-6" />
        )}
        <span className="tracking-widest">为 SIGNAL 充能 / CHARGE</span>
      </button>
    </div>
  );
}
