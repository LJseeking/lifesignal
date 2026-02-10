'use client';

import React, { useState } from 'react';
import { ChevronLeft, Home, Info, AlertCircle, CheckCircle2, XCircle, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SpaceLanguageOutput } from '@/lib/scenes/space/language';
import { EnergyState } from '@/lib/energy/service';
import { SpaceZone } from '@/lib/scenes/space/rules';

interface SpaceClientProps {
  userId: string;
  initialData: SpaceLanguageOutput;
  energyState: EnergyState;
  currentZone: SpaceZone;
}

const ZONES = [
  { id: 'work', label: '工作区', icon: '💻' },
  { id: 'living', label: '客厅', icon: '🛋️' },
  { id: 'sleep', label: '睡眠区', icon: '🌙' },
  { id: 'entry', label: '入门区', icon: '🚪' },
];

export default function SpaceClient({ initialData, currentZone }: SpaceClientProps) {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);

  const handleSelection = (zone: string) => {
    setIsChanging(true);
    router.push(`/scenes/space?zone=${zone}`);
    // 在路由跳转后重置加载状态，由于是同页面跳转，通过 useEffect 或简单延迟处理
    setTimeout(() => setIsChanging(false), 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <Link href="/" className="flex items-center text-slate-500 mb-8 hover:text-indigo-600 transition-colors w-fit">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">返回总览</span>
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Home className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">今日空间建议</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5 uppercase tracking-widest">Space Guidance</p>
          </div>
        </div>

        {/* 极简选择器 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">选择空间</h3>
          <div className="grid grid-cols-4 gap-3">
            {ZONES.map((z) => (
              <button
                key={z.id}
                onClick={() => handleSelection(z.id)}
                className={`py-3 rounded-2xl text-[10px] font-black transition-all flex flex-col items-center gap-1.5 uppercase tracking-widest ${
                  currentZone === z.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">{z.icon}</span>
                {z.label}
              </button>
            ))}
          </div>
        </div>

        {/* 输出结果 */}
        <div className={`space-y-6 transition-opacity duration-300 ${isChanging ? 'opacity-50' : 'opacity-100'}`}>
          {/* ① 今日空间基调 */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">今日空间基调</h3>
            <p className="text-slate-900 font-bold leading-relaxed text-xl">
              {initialData.headline}
            </p>
          </div>

          {/* ② 建议调整的物件 */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">建议调整</h3>
            <div className="space-y-5">
              {initialData.recommendations.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-slate-800 font-bold leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ③ 今日建议避免 */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">今日避免</h3>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-slate-800 font-bold leading-relaxed">{initialData.avoid}</p>
            </div>
          </div>

          {/* ④ 简要原因说明 (Energy >= Medium) */}
          {initialData.reason && (
            <div className="bg-indigo-900 text-white p-8 rounded-[40px] shadow-xl flex gap-5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5">
                <Info className="w-24 h-24 rotate-12 fill-white" />
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">原因说明</h4>
                <p className="text-sm text-indigo-100 leading-relaxed font-medium">
                  {initialData.reason}
                </p>
              </div>
            </div>
          )}

          {/* ⑤ 明日恢复建议 (Energy == High) */}
          {initialData.recovery && (
            <div className="bg-amber-50 p-8 rounded-[40px] border border-amber-100 flex gap-5">
              <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-600 fill-amber-600" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-2">明日恢复建议</h4>
                <p className="text-sm text-amber-800 leading-relaxed font-medium italic">
                  {initialData.recovery}
                </p>
              </div>
            </div>
          )}

          {/* 能量状态提示 (Energy < Medium) */}
          {initialData.energyHint && (
            <div className="p-8 bg-slate-100 rounded-[40px] border border-slate-200">
              <div className="flex items-start gap-4 mb-8">
                <AlertCircle className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {initialData.energyHint}
                </p>
              </div>
              <Link 
                href="/energy"
                className="flex items-center justify-between w-full bg-indigo-600 hover:bg-indigo-500 text-white p-5 rounded-3xl transition-all active:scale-[0.98] shadow-xl shadow-indigo-900/20"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 fill-white" />
                  <span className="text-xs font-black uppercase tracking-widest">开启深度空间建议</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <p className="text-center text-[10px] text-slate-300 px-10 mt-10 italic font-medium leading-relaxed">
            空间建议基于行为环境心理学生成，旨在通过微调物理环境来协同您的能量状态。
          </p>
        </div>
      </div>
    </div>
  );
}
