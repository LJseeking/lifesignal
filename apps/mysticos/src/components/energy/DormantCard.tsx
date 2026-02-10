import React from 'react';
import { Battery, Zap } from 'lucide-react';
import Link from 'next/link';

export function DormantCard() {
  return (
    <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Battery className="w-32 h-32 rotate-12" />
      </div>
      
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 mb-6">
          <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">休眠状态 / Dormant</span>
        </div>
        
        <h3 className="text-2xl font-black mb-4 leading-tight">
          Signal 当前处于休眠状态
        </h3>
        
        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
          由于运行能量耗尽，它已暂停对你状态的分析。你可以随时为其充能，恢复运行。
        </p>
        
        <Link 
          href="/energy"
          className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-95"
        >
          <Zap className="w-5 h-5 fill-slate-900" />
          <span>CHARGE SIGNAL</span>
        </Link>
      </div>
    </div>
  );
}
