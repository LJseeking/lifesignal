export const runtime = 'nodejs';
import { redirect } from 'next/navigation';
import { getDeviceId } from '@/lib/device';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { generateUnifiedModel } from '@/lib/engine';
import { getAllScenes } from '@/lib/scenes/index';
import { getRandomTarot } from '@/lib/engine/tarot';
import { FEATURE_FLAG_AI, AIInsights } from '@/lib/ai';
import { generateStateInsight, generatePersonalizedExplanation, generatePatternHint } from '@/lib/ai/interpreters';
import { applyDailyDecayIfNeeded, computeEnergyState, estimateRuntimeDays } from '@/lib/energy/service';
import { EnergyBadge } from '@/components/energy/EnergyBadge';
import { DormantCard } from '@/components/energy/DormantCard';
import { BoostTrigger } from '@/components/energy/BoostTrigger';
import { Sparkles, Shirt, Hash, Moon, Lock, Clock, CheckCircle2, XCircle, ChevronRight, AlertCircle, Briefcase, MessageSquare, ShieldAlert, BrainCircuit, ChevronDown, ChevronUp, LayoutGrid, ShieldCheck, Info, Zap } from 'lucide-react';
import Link from 'next/link';
import { DecisionSceneCard } from '@/components/DecisionSceneCard';

// AI 解读组件
function AIStateInsightSection({ insights, isDormant, userId, energyLevel, metadata }: { insights: AIInsights, isDormant: boolean, userId: string, energyLevel: number, metadata?: any }) {
  if (!insights.stateInterpreter || isDormant) return null;
  
  const precision = metadata?.birthTimePrecision || 'unknown';
  const confidenceLabels = {
    exact_shichen: { text: "高精度四柱模型", icon: <ShieldCheck className="w-3 h-3" />, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
    approx_range: { text: "交集稳健模型", icon: <Info className="w-3 h-3" />, color: "text-amber-500 bg-amber-50 border-amber-100" },
    unknown: { text: "基础日期模型", icon: <AlertCircle className="w-3 h-3" />, color: "text-slate-400 bg-slate-50 border-slate-100" },
  };
  const label = confidenceLabels[precision as keyof typeof confidenceLabels] || confidenceLabels.unknown;

  return (
    <div className="mt-6">
      <details className="group bg-indigo-900/5 rounded-3xl border border-indigo-100/50 overflow-hidden transition-all">
        <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
          <div className="flex items-center gap-3 text-indigo-700">
            <BrainCircuit className="w-5 h-5" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-black uppercase tracking-widest">AI 状态解读</span>
              <div className={`mt-1 px-2 py-0.5 rounded-full flex items-center gap-1 border ${label.color}`}>
                {label.icon}
                <span className="text-[8px] font-bold uppercase tracking-tighter">{label.text}</span>
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-indigo-300 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="px-5 pb-6 space-y-4">
          <div className="bg-white/60 p-4 rounded-2xl border border-white">
            <h4 className="text-sm font-bold text-slate-800 mb-2">{insights.stateInterpreter.headline}</h4>
            <ul className="space-y-2">
              {insights.stateInterpreter.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                  <div className="w-1 h-1 rounded-full bg-indigo-300 mt-1.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <BoostTrigger userId={userId} energyLevel={energyLevel} />
          </div>
          {insights.patternObserver?.patternHint && (
            <div className="p-3 bg-indigo-600/5 rounded-xl border border-indigo-600/10">
              <p className="text-[10px] text-indigo-600 font-bold leading-normal">
                历史趋势观察：{insights.patternObserver.patternHint}
              </p>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

export default async function Home() {
  const deviceId = getDeviceId();
  const isSubscribed = true; // 临时设为 true 以便预览 Premium 效果
  if (!deviceId) redirect('/onboarding');

  const user = await prisma.user.findUnique({
    where: { deviceId },
    include: { profile: true, energyAccount: true }
  });

  // 如果用户未填写画像，引导至 Onboarding
  if (!user || !user.profile) {
    console.log("[Home] Missing user profile, redirecting to onboarding");
    console.log("[Home] Missing user profile, redirecting to onboarding");
    redirect('/onboarding');
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = `${today}-${deviceId}`;

  // 处理能量衰减
  const energyAccount = await applyDailyDecayIfNeeded(user.id, today);
  const energyState = computeEnergyState(energyAccount.energyLevel);
  const isDormant = energyState === 'dormant';
  const runtimeDays = estimateRuntimeDays(energyAccount.energyLevel);

  let daily = await prisma.dailyResult.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });

  // 如果当日结果不存在，实时生成
  if (!daily) {
    try {
      const model = generateUnifiedModel(user.profile as any, today, deviceId);
      const tarot = getRandomTarot(seed, (user.profile as any).focus);
      const scenes = getAllScenes(model, tarot.card, seed, energyState);
      
      const dailyRecord = await prisma.dailyResult.create({
        data: {
          userId: user.id,
          date: today,
          energyModel: JSON.stringify(model),
          scenesJSON: JSON.stringify(scenes),
          tarotCard: tarot.card,
          aiInsights: JSON.stringify({
            stateInterpreter: null,
            personalizedSummary: null,
            personalizedMahjong: null,
            patternObserver: null
          })
        } as any
      });
      daily = dailyRecord;
      console.log(`[ActivityLog] Generated DailyResult for User: ${user.id}, Date: ${today}`);
    } catch (error) {
      console.error("Failed to generate daily result:", error);
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
          <AlertCircle className="w-12 h-12 text-red-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">生成建议失败</h2>
          <p className="text-slate-500 text-sm text-center">今日状态较为复杂，建议以稳妥与观察为主。请稍后再试。</p>
          <Link href="/onboarding" className="mt-6 text-indigo-600 font-medium">返回完善信息</Link>
        </div>
      );
    }
  }

  const scenes = JSON.parse(daily.scenesJSON);
  const model = JSON.parse(daily.energyModel);
  const aiInsights: AIInsights = (daily as any).aiInsights ? JSON.parse((daily as any).aiInsights) : {
    stateInterpreter: null,
    personalizedSummary: null,
    personalizedMahjong: null,
    patternObserver: null
  };

  // 检查是否需要重新生成场景数据 (如果逻辑更新了)
  const needsUpdate = !scenes.summary.scenes || !scenes.mahjong.participation;
  // 检查是否需要 AI 补充
  const needsAIUpdate = FEATURE_FLAG_AI && !aiInsights.stateInterpreter && !isDormant;
  
  let currentScenes = scenes;
  let currentAIInsights = aiInsights;

  if ((needsUpdate || needsAIUpdate) && !isDormant) {
    console.log(`[ActivityLog] Updating data for User: ${user.id}, needsUpdate: ${needsUpdate}, needsAIUpdate: ${needsAIUpdate}`);
    
    try {
      if (needsUpdate) {
        const newScenes = getAllScenes(model, daily.tarotCard || "未知", seed, energyState);
        currentScenes = newScenes;
      }

      if (needsAIUpdate) {
        const stateInsight = await generateStateInsight(model, (user.profile as any).focus);
        const personalizedSummary = await generatePersonalizedExplanation(currentScenes.summary.description, user.profile);
        
        // 获取历史数据用于模式观察
        const history = await prisma.dailyResult.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
          take: 7,
          select: { energyModel: true }
        });
        const patternHint = await generatePatternHint(history.map(h => JSON.parse(h.energyModel)));

        currentAIInsights = {
          stateInterpreter: stateInsight,
          personalizedSummary: personalizedSummary,
          personalizedMahjong: null, // 场景页单独处理
          patternObserver: patternHint
        };
      }

      await prisma.dailyResult.update({
        where: { id: daily.id },
        data: { 
          scenesJSON: JSON.stringify(currentScenes),
          aiInsights: JSON.stringify(currentAIInsights)
        } as any
      });
      console.log(`[ActivityLog] Successfully updated DailyResult with AI insights for User: ${user.id}`);
    } catch (e) {
      console.error("[ActivityLog] Failed to update DailyResult with AI insights:", e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* 🧠 模块 1 & 🔑 模块 2: 总结与关键词 */}
      <div className="bg-white px-6 pt-16 pb-10 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-tight">
            <Sparkles className="w-5 h-5" />
            <span>Signal</span>
          </div>
          <EnergyBadge level={energyAccount.energyLevel} state={energyState} estimatedDays={runtimeDays} />
        </div>
        
        <h1 className="text-3xl font-bold leading-tight text-slate-900 mb-6">
          {currentScenes.summary.description}
        </h1>

        {isDormant ? (
          <div className="mb-10">
            <DormantCard />
          </div>
        ) : (
          <>
            {currentAIInsights.personalizedSummary && (
              <p className="text-xs text-indigo-600 font-medium italic mb-6 leading-relaxed bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/30">
                AI 深度解读：{currentAIInsights.personalizedSummary.personalizedExplanation}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {currentScenes.summary.keywords.map((k: string) => (
                <span key={k} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
                  {k}
                </span>
              ))}
              {model.daily_volatility.intensity > 0.7 && (
                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100">
                  能量高波动
                </span>
              )}
            </div>

            {/* AI 状态解读模块 */}
            <AIStateInsightSection 
              insights={currentAIInsights} 
              isDormant={isDormant} 
              userId={user.id}
              energyLevel={energyAccount.energyLevel}
              metadata={model.metadata}
            />
            
            {/* 自动触发 Boost 弹窗 (当能量低且波动大时) */}
            {energyState === 'low' && model.daily_volatility.intensity > 0.7 && (
              <div className="hidden">
                <BoostTrigger userId={user.id} energyLevel={energyAccount.energyLevel} autoTrigger={true} />
              </div>
            )}
          </>
        )}
      </div>

      {!isDormant && (
        <>
          {/* 📋 模块 3: 宜 / 忌 行为参考 */}
          <div className="px-6 py-8 grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 mb-4">
                <CheckCircle2 className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">今日适合</h4>
              </div>
              <ul className="space-y-3">
                {currentScenes.summary.dos.map((d: string) => (
                  <li key={d} className="text-sm text-slate-700 font-medium leading-snug">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-rose-500 mb-4">
                <XCircle className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">今日避免</h4>
              </div>
              <ul className="space-y-3">
                {currentScenes.summary.donts.map((d: string) => (
                  <li key={d} className="text-sm text-slate-700 font-medium leading-snug opacity-80">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 🛠 模块: 轻场景决策参考 (新增可折叠模块) */}
          {currentScenes.summary.scenes && (
            <div className="px-6 pb-10 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">行为决策参考</h3>
              
              <DecisionSceneCard 
                title="今日行动与工作参考"
                suggestion={currentScenes.summary.scenes.action.suggestion}
                description={currentScenes.summary.action}
                dos={currentScenes.summary.scenes.action.dos}
                donts={currentScenes.summary.scenes.action.donts}
                icon={<Briefcase className="w-5 h-5" />}
              />

              <DecisionSceneCard 
                title="今日沟通与人际提示"
                suggestion={currentScenes.summary.scenes.communication.suggestion}
                description={currentScenes.summary.communication}
                dos={currentScenes.summary.scenes.communication.dos}
                donts={currentScenes.summary.scenes.communication.donts}
                icon={<MessageSquare className="w-5 h-5" />}
              />

              <DecisionSceneCard 
                title="今日风险与决策提示"
                suggestion={currentScenes.summary.scenes.risk.suggestion}
                description={currentScenes.summary.risk}
                dos={currentScenes.summary.scenes.risk.dos}
                donts={currentScenes.summary.scenes.risk.donts}
                icon={<ShieldAlert className="w-5 h-5" />}
              />
            </div>
          )}
        </>
      )}

      {/* 🎯 模块 4: 场景入口卡片 */}
      <div className="px-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">深度场景参考</h3>
        
        {/* 卡片 1: 今日穿搭 */}
        <Link 
          href={isSubscribed ? "/scenes/outfit" : "#"} 
          className={`group block bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md ${!isSubscribed ? 'relative overflow-hidden' : ''}`}
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
              <Shirt className="w-7 h-7 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-slate-900">今日穿搭建议</h4>
                {!isSubscribed && <Lock className="w-3 h-3 text-slate-300" />}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                从颜色与材质层面，帮助你保持判断稳定性
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
          </div>
          {!isSubscribed && (
            <div className="absolute top-0 right-0 p-2">
              <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm">PREMIUM</span>
            </div>
          )}
        </Link>

        {/* 卡片 2: 娱乐 / 麻将 */}
        <Link 
          href={isSubscribed ? "/scenes/mahjong" : "#"} 
          className={`group block bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md ${!isSubscribed ? 'relative overflow-hidden' : ''}`}
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
              <Hash className="w-7 h-7 text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-slate-900">娱乐 / 麻将参考</h4>
                {!isSubscribed && <Lock className="w-3 h-3 text-slate-300" />}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                基于今日状态与风险偏好给出参与提示
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
          </div>
          {!isSubscribed && (
            <div className="absolute top-0 right-0 p-2">
              <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm">PREMIUM</span>
            </div>
          )}
        </Link>

        {/* 卡片 3: 空间建议 (新增) */}
        <Link 
          href="/scenes/space" 
          className="group block bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <LayoutGrid className="w-7 h-7 text-indigo-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 mb-1">今日空间建议</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                基于你当前状态的空间调整参考
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>

        {/* 卡片 4: 充能中心 (新增) */}
        <Link 
          href="/charge" 
          className="group block bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/50">
              <Zap className="w-7 h-7 text-white fill-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white mb-1">充能中心（只读演示）</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                查看链上充能换算与连通状态
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
          </div>
        </Link>

        {/* 卡片 5: 今日塔罗 (免费入口) */}
        <Link 
          href="/tarot" 
          className="group block bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0">
              <Moon className="w-7 h-7 text-purple-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 mb-1">今日塔罗启示</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                由「{daily.tarotCard}」带来的潜意识决策引导
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* 锚点与免责 */}
      <div className="px-6 mt-12 space-y-8">
        <div className="flex justify-center">
          <div className="bg-slate-200/50 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            <span>下一次完整建议将在明日 00:00 更新</span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="py-4 border-t border-slate-100/50 space-y-1">
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">
              Life Signal is an AI system that continuously reads signals from your life — time, space, habits, and personal state — and turns them into calm, actionable guidance.
            </p>
          </div>

          <p className="text-[10px] text-slate-300 leading-relaxed px-8">
            所有内容基于行为倾向与情境分析，仅供个人参考，不构成任何形式的确定性判断。
          </p>
          <p className="text-[9px] text-slate-200 font-bold uppercase tracking-[0.2em]">
            Signal Decision Support System
          </p>
        </div>
      </div>
    </div>
  );
}
// TEST WRITE
