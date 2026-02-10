'use client';

import React from 'react';
import { ChevronLeft, Hash, Info, ShieldAlert, Target, Zap } from 'lucide-react';
import Link from 'next/link';

interface MahjongClientProps {
  data: {
    summary: string;
    participation: "recommended" | "neutral" | "avoid";
    style: "conservative" | "balanced" | "aggressive";
    tips: string[];
    lucky_color: string;
    warning?: string;
    aiExplanation?: string;
  };
}

export default function MahjongClient({ data }: MahjongClientProps) {
  const participationInfo = {
    recommended: { label: "建议参与", color: "text-emerald-600", bg: "bg-emerald-50", icon: <Target className="w-5 h-5" /> },
    neutral: { label: "中性态度", color: "text-slate-500", bg: "bg-slate-50", icon: <Zap className="w-5 h-5" /> },
    avoid: { label: "不宜入局", color: "text-rose-500", bg: "bg-rose-50", icon: <ShieldAlert className="w-5 h-5" /> }
  };

  const styleLabels = {
    conservative: "保守观望",
    balanced: "稳健平衡",
    aggressive: "果敢出击"
  };

  const info = participationInfo[data.participation];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <Link href="/" className="flex items-center text-slate-500 mb-8 hover:text-indigo-600 transition-colors w-fit">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">返回总览</span>
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Hash className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">今日娱乐/麻将参考</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5 uppercase tracking-widest">Entertainment Reference</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI 个性化解释 */}
          {data.aiExplanation && (
            <div className="bg-indigo-900/5 p-5 rounded-3xl border border-indigo-100/50">
              <div className="flex items-center gap-2 text-indigo-700 mb-2">
                <Info className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">AI 个性化解读</span>
              </div>
              <p className="text-xs text-indigo-600 leading-relaxed italic font-medium">
                “{data.aiExplanation}”
              </p>
            </div>
          )}

          {/* 状态总览 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${info.bg} ${info.color} rounded-full text-xs font-black uppercase tracking-widest mb-4`}>
              {info.icon}
              {info.label}
            </div>
            <p className="text-slate-800 font-semibold leading-relaxed text-lg mb-6">
              {data.summary}
            </p>
            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">建议风格</p>
                <p className="text-sm font-bold text-slate-700">{styleLabels[data.style]}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">开运色系</p>
                <p className="text-sm font-bold text-emerald-600">{data.lucky_color}</p>
              </div>
            </div>
          </div>

          {/* 行为提示 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">行为建议清单</h3>
            <ul className="space-y-4">
              {data.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-sm text-slate-700 font-medium leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 风险提示 */}
          {data.warning && (
            <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100/50 flex gap-4">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900 mb-1">风险警示</h4>
                <p className="text-sm text-rose-700 leading-relaxed font-medium">
                  {data.warning}
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex gap-4">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
              娱乐建议旨在平衡当日多巴胺波动，请勿将其作为博弈依据。小赌怡情，大赌伤神。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
