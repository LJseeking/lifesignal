'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Info } from 'lucide-react';

interface DecisionSceneCardProps {
  title: string;
  suggestion: string;
  description: string;
  dos: string[];
  donts: string[];
  icon?: React.ReactNode;
}

export function DecisionSceneCard({
  title,
  suggestion,
  description,
  dos,
  donts,
  icon
}: DecisionSceneCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
              {icon}
            </div>
          )}
          <div>
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">
              建议：{suggestion}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-300" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-300" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/30">
          <p className="text-sm text-slate-600 leading-relaxed mb-6 italic">
            "{description}"
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">适合行为</span>
              </div>
              <ul className="space-y-2">
                {dos.map((d, i) => (
                  <li key={i} className="text-xs text-slate-700 font-medium leading-snug">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-rose-500">
                <XCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">避开方式</span>
              </div>
              <ul className="space-y-2">
                {donts.map((d, i) => (
                  <li key={i} className="text-xs text-slate-700 font-medium leading-snug opacity-80">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-6 flex items-start gap-2 p-3 bg-white/50 rounded-2xl border border-slate-100">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-slate-400 leading-normal">
              本建议结合你的个人画像与当日波动模型生成，仅供决策风格参考。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
