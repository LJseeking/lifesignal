'use client';

import React, { useState } from 'react';
import { Zap, X, AlertCircle, BatteryCharging } from 'lucide-react';
import { handleBoost } from '@/lib/energy/actions';
import { useRouter } from 'next/navigation';

interface BoostModalProps {
  userId: string;
  energyLevel: number;
  isOpen: boolean;
  onClose: () => void;
}

export function BoostModal({ userId, energyLevel, isOpen, onClose }: BoostModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const canBoost = energyLevel >= 10;

  const onBoost = async () => {
    if (!canBoost) {
      router.push('/energy');
      return;
    }

    setIsProcessing(true);
    const res = await handleBoost(userId);
    if (res.success) {
      onClose();
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-12">
          <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-sm">
            <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
          </div>

          <h3 className="text-xl font-black text-slate-900 text-center mb-3">
            是否让 Signal 今天更专注一些？
          </h3>
          
          <p className="text-slate-500 text-sm font-medium text-center leading-relaxed mb-8 px-2">
            提升运行能量可以帮助 Signal 提供更细致的状态解读与风险提示。这只会影响今天。
          </p>

          <div className="space-y-3">
            <button
              onClick={onBoost}
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 ${
                canBoost 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {canBoost ? <Zap className="w-5 h-5 fill-white" /> : <BatteryCharging className="w-5 h-5" />}
                  <span>{canBoost ? 'BOOST SIGNAL (-10)' : '先去充能 / CHARGE'}</span>
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-4 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              维持当前状态
            </button>
          </div>

          {!canBoost && (
            <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-rose-50 rounded-xl border border-rose-100">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <p className="text-[10px] text-rose-600 font-bold leading-tight">
                当前能量不足以支持 Boost。请先补充运行能量。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
