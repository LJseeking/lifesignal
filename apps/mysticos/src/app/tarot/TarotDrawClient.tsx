'use client';

import React, { useReducer, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCcw, Info, BrainCircuit, BatteryCharging, Zap, ChevronRight, AlertCircle } from 'lucide-react';
import styles from './tarot-anim.module.css';
import { EnergyState } from '@/lib/energy/service';
import Link from 'next/link';

type State = 'idle' | 'shuffling' | 'drawing' | 'reveal' | 'done';

interface TarotResult {
  card: string;
  focusAdvice: string;
  whyThisCard: string;
}

interface TarotDrawClientProps {
  result: TarotResult;
  energyState: EnergyState;
  energyLevel: number;
  userId: string;
}

type Action = 
  | { type: 'START_DRAW' }
  | { type: 'FINISH_SHUFFLE' }
  | { type: 'FINISH_DRAW' }
  | { type: 'FINISH_REVEAL' }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_DRAW':
      return state === 'idle' || state === 'done' ? 'shuffling' : state;
    case 'FINISH_SHUFFLE':
      return state === 'shuffling' ? 'drawing' : state;
    case 'FINISH_DRAW':
      return state === 'drawing' ? 'reveal' : state;
    case 'FINISH_REVEAL':
      return state === 'reveal' ? 'done' : state;
    case 'RESET':
      return 'idle';
    default:
      return state;
  }
}

export default function TarotDrawClient({ result, energyState, energyLevel, userId }: TarotDrawClientProps) {
  const [state, dispatch] = useReducer(reducer, 'idle');

  const startAnimation = useCallback(() => {
    if (state !== 'idle' && state !== 'done') return;
    
    dispatch({ type: 'START_DRAW' });
    
    // 触发轻微震动
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }

    // 状态切换时序
    setTimeout(() => {
      dispatch({ type: 'FINISH_SHUFFLE' });
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    }, 1200);

    setTimeout(() => {
      dispatch({ type: 'FINISH_DRAW' });
    }, 2400);

    setTimeout(() => {
      dispatch({ type: 'FINISH_REVEAL' });
    }, 3200);
  }, [state]);

  // CSS 粒子生成 (仅在 shuffling 时展示)
  const particles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${1 + Math.random() * 2}s`
  }));

  return (
    <div className="flex flex-col items-center py-4 w-full">
      {/* 塔罗牌容器 */}
      <div className={styles.container}>
        <div 
          className={`
            ${styles.cardWrapper} 
            ${state === 'shuffling' ? styles.shuffling : ''} 
            ${state === 'drawing' ? styles.drawing : ''} 
            ${(state === 'reveal' || state === 'done') ? styles.reveal : ''}
          `}
          onClick={state === 'idle' ? startAnimation : undefined}
        >
          {/* 背景光晕 */}
          <div className={`${styles.glow} ${(state === 'drawing' || state === 'reveal') ? styles.glowActive : ''}`} />

          {/* 牌背 */}
          <div className={`${styles.cardSide} ${styles.cardBack}`}>
            <div className={styles.pattern} />
            <div className="z-10 text-center px-4">
              <MoonIcon />
              <p className="text-[10px] text-purple-300 font-black uppercase tracking-[0.2em] mt-2">Signal</p>
            </div>
            {state === 'shuffling' && (
              <div className={styles.particles}>
                {particles.map(p => (
                  <div 
                    key={p.id} 
                    className={styles.particle} 
                    style={{ 
                      top: p.top, 
                      left: p.left, 
                      animationDelay: p.delay,
                      width: '3px',
                      height: '3px'
                    }} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* 牌面 */}
          <div className={`${styles.cardSide} ${styles.cardFront}`}>
            <div className={styles.pattern} />
            <div className="z-10 text-center p-4">
              <span className="text-4xl block mb-4">✨</span>
              <h2 className="text-2xl font-black tracking-[0.15em] text-white uppercase shadow-sm">
                {result.card}
              </h2>
              <div className="w-12 h-0.5 bg-purple-400/50 mx-auto mt-4 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 交互文案与按钮 */}
      <div className="mt-12 w-full max-w-xs px-4 text-center min-h-[160px]">
        {state === 'idle' && (
          <button 
            onClick={startAnimation}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>开始抽牌</span>
          </button>
        )}

        {(state === 'shuffling' || state === 'drawing') && (
          <div className="flex flex-col items-center gap-3 text-purple-400 font-medium">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <p className="animate-pulse tracking-widest text-sm uppercase">
              {state === 'shuffling' ? '正在洗牌...' : '正在抽取...'}
            </p>
          </div>
        )}

        {state === 'done' && (
          <div className={styles.fadeIn}>
            <div className="mb-10 space-y-6 text-left">
              {/* 今日启示卡片 */}
              <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 shadow-2xl">
                <h3 className="text-purple-400 font-black uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  今日启示
                </h3>
                <p className="text-lg text-white leading-relaxed font-bold italic mb-4">
                  「{result.card}」建议：{result.focusAdvice}
                </p>
                
                {/* 为什么是这张？微型说明 */}
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-start gap-2 text-slate-500 text-[10px] leading-normal italic">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{result.whyThisCard}</span>
                  </div>
                </div>
              </div>

              {/* AI 深度解读模块 */}
              <div className="bg-indigo-900/20 rounded-[32px] border border-indigo-500/20 overflow-hidden shadow-xl">
                <div className="px-6 py-5 bg-indigo-500/10 border-b border-indigo-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <BrainCircuit className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">AI 深度解读</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                    (energyState === 'high' || energyState === 'medium') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    Energy: {energyState}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {(energyState === 'high' || energyState === 'medium') ? (
                    <>
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest">这张牌为什么出现</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          基于您当前的关注焦点与当日波动率，系统识别到「{result.card}」所代表的能量频率与您的潜意识决策路径产生了高度共振。这并非偶然，而是行为模型在多维度博弈后的最优信号选择。
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest">今天如何使用这个信号</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          建议将该信号作为您决策时的「底层滤镜」。在面临不确定选择时，优先参考牌面传递的节奏感，将其转化为具体的行动步调，以维持整体能量场的稳定性。
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest">需要注意的偏差</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          避免过度解读单一点位的得失。AI 观察到当前环境存在细微的非理性干扰，建议保持观察者的视角，防止情绪对信号传递造成扭曲。
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                          当前能量状态下，Signal 提供的是基础解读。为获得更深入的背景分析与使用建议，您可以选择为 Signal 充能。
                        </p>
                      </div>
                      
                      <Link 
                        href="/energy"
                        className="flex items-center justify-between w-full bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-900/20"
                      >
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 fill-white" />
                          <span className="text-xs font-black uppercase tracking-widest">开启 AI 深度解读（Charge Signal）</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 弱化的动画重播按钮 */}
            <button 
              onClick={startAnimation}
              className="mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest hover:text-purple-400 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <RefreshCcw className="w-3 h-3" />
              <span>重新开始仪式</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MoonIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400/40">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  );
}
