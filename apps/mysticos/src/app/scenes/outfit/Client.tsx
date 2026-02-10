'use client';

import React from 'react';
import { ChevronLeft, Shirt, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface OutfitClientProps {
  data: {
    summary: string;
    recommendedColors: string[];
    avoidColors: string[];
    materials: string[];
    accessories: string[];
    notes?: string;
  };
}

export default function OutfitClient({ data }: OutfitClientProps) {
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <Link href="/" className="flex items-center text-slate-500 mb-8 hover:text-indigo-600 transition-colors w-fit">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">返回总览</span>
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Shirt className="w-7 h-7 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">今日穿搭建议</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5 uppercase tracking-widest">Outfit Reference</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 总结 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">核心参考</h3>
            <p className="text-slate-800 font-semibold leading-relaxed text-lg">
              {data.summary}
            </p>
          </div>

          {/* 颜色建议 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">开运色系</h3>
              <div className="flex flex-wrap gap-2">
                {data.recommendedColors.map((c) => (
                  <span key={c} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">避开色系</h3>
              <div className="flex flex-wrap gap-2">
                {data.avoidColors.map((c) => (
                  <span key={c} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold opacity-80">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 材质与饰品 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">材质选择</h3>
              <div className="flex flex-wrap gap-3">
                {data.materials.map((m) => (
                  <div key={m} className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span className="text-sm font-medium">{m}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-50">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">饰品提示</h3>
              <div className="flex flex-wrap gap-3">
                {data.accessories.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-300" />
                    <span className="text-sm font-medium">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 为什么这样穿 */}
          {data.notes && (
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 flex gap-4">
              <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-indigo-900 mb-1">决策逻辑</h4>
                <p className="text-sm text-indigo-700 leading-relaxed font-medium">
                  {data.notes}
                </p>
              </div>
            </div>
          )}

          <p className="text-center text-[10px] text-slate-300 px-10 mt-10">
            穿搭建议是基于您当日的五行能量模型生成的颜色引导，旨在通过视觉频率调节心态。
          </p>
        </div>
      </div>
    </div>
  );
}
