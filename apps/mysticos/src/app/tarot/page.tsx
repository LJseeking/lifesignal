import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { ChevronLeft, Moon } from 'lucide-react';
import Link from 'next/link';
import { getRandomTarot } from '@/lib/engine/tarot';
import { getEnergyAccount, computeEnergyState } from '@/lib/energy/service';
import { generateUnifiedModel } from '@/lib/engine';
import { getAllScenes } from '@/lib/scenes/index';
import TarotDrawClient from './TarotDrawClient';

export default async function TarotPage() {
  const deviceId = getDeviceId();
  if (!deviceId) redirect('/onboarding');

  const user = await prisma.user.findUnique({
    where: { deviceId },
    include: { profile: true }
  });

  if (!user || !user.profile) redirect('/onboarding');

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = `${today}-${deviceId}`;
  
  const account = await getEnergyAccount(user.id);
  const energyState = computeEnergyState(account.energyLevel);

  let daily = await prisma.dailyResult.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });

  // 修复：如果子页面发现没有 DailyResult，不再重定向回首页，而是原地生成
  // 这避免了 "无限重定向循环" (首页没生成 -> 跳首页 -> 首页生成慢 -> 用户点太快又进子页 -> 又跳回)
  if (!daily) {
    console.log(`[TarotPage] Daily result not found for ${user.id}, generating on the fly...`);
    try {
      const model = generateUnifiedModel(user.profile as any, today, deviceId);
      const tarot = getRandomTarot(seed, (user.profile as any).focus);
      const scenes = getAllScenes(model, tarot.card, seed, energyState);
      
      daily = await prisma.dailyResult.create({
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
    } catch (e) {
      console.error("[TarotPage] Failed to generate fallback daily result:", e);
      // 只有彻底失败时才回首页，避免死循环
      redirect('/');
    }
  }

  const model = JSON.parse(daily.energyModel);
  const tarotData = getRandomTarot(seed, (user.profile as any).focus);

  const result = {
    card: daily.tarotCard || tarotData.card,
    focusAdvice: tarotData.focusAdvice,
    whyThisCard: `该结果结合了您当前对「${(user.profile as any).focus === 'wealth' ? '财富' : (user.profile as any).focus === 'love' ? '情感' : '事业'}」的关注，以及当日能量场 ${model.daily_volatility.intensity > 0.6 ? '显著波动' : '相对稳定'} 的频率特征生成。`
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-12 overflow-x-hidden">
      <div className="px-6 py-8 max-w-lg mx-auto">
        <Link href="/" className="flex items-center text-slate-400 mb-8 hover:text-white transition-colors w-fit">
          <ChevronLeft className="w-5 h-5" />
          <span>返回</span>
        </Link>

        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center shadow-inner">
            <Moon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">今日塔罗启示</h1>
            <p className="text-[10px] text-purple-400/60 font-bold uppercase tracking-widest mt-0.5">Today&apos;s Tarot Guidance</p>
          </div>
        </div>

        <TarotDrawClient 
          result={result} 
          energyState={energyState}
          energyLevel={account.energyLevel}
          userId={user.id}
        />
        
        <div className="mt-16 text-center">
          <p className="text-[10px] text-slate-600 leading-relaxed px-10">
            塔罗启示基于潜意识映射模型生成，旨在提供行为风格参考，不构成任何确定性预测。
          </p>
        </div>
      </div>
    </div>
  );
}
