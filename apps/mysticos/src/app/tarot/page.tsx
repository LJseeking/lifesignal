import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { ChevronLeft, Moon } from 'lucide-react';
import Link from 'next/link';
import { getRandomTarot } from '@/lib/engine/tarot';
import { getEnergyAccount, computeEnergyState } from '@/lib/energy/service';
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

  // 如果当日结果不存在，虽然首页应该已经生成了，但这里做个兜底
  if (!daily) redirect('/');

  const model = JSON.parse(daily.energyModel);
  const tarotData = getRandomTarot(seed, user.profile.focus);

  const result = {
    card: daily.tarotCard || tarotData.card,
    focusAdvice: tarotData.focusAdvice,
    whyThisCard: `该结果结合了您当前对「${user.profile.focus === 'wealth' ? '财富' : user.profile.focus === 'love' ? '情感' : '事业'}」的关注，以及当日能量场 ${model.daily_volatility.intensity > 0.6 ? '显著波动' : '相对稳定'} 的频率特征生成。`
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
