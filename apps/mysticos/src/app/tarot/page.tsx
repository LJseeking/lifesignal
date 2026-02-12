import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ChevronLeft, Moon } from 'lucide-react';
import Link from 'next/link';
import { getRandomTarot } from '@/lib/engine/tarot';
import { getEnergyAccount, computeEnergyState } from '@/lib/energy/service';
import { generateUnifiedModel } from '@/lib/engine';
import { getAllScenes } from '@/lib/scenes/index';
import TarotDrawClient from './TarotDrawClient';
import { checkProfileOrRedirect } from '@/lib/auth-guard';

export default async function TarotPage() {
  const deviceId = getDeviceId();
  if (!deviceId) redirect('/onboarding');

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { deviceId },
      include: { profile: true }
    });
  } catch (e) {
    console.warn("DB Error in Tarot:", e);
  }

  // Fallback / Mock Logic
  if (!user) {
    user = {
      id: "mock-user-id",
      deviceId,
      profile: { focus: "wealth", mbti: "INTJ", birthTime: "12:00" } // Ensure minimal profile
    } as any;
  }

  if (!user || !user.profile) redirect('/onboarding');

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = `${today}-${user.deviceId}`;
  
  // 确保 energyAccount 存在
  const account = user.energyAccount || { energyLevel: 50 };
  const energyState = computeEnergyState(account.energyLevel);

  let daily = await prisma.dailyResult.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });

  // Generate Daily if missing (In-Place Generation)
  if (!daily) {
    try {
      const model = generateUnifiedModel(user.profile as any, today, deviceId);
      const tarot = getRandomTarot(seed, (user.profile as any).focus);
      const scenes = getAllScenes(model, tarot.card, seed, energyState);
      
      // Attempt to save if real user
      if (user.id !== "mock-user-id") {
        try {
          daily = await prisma.dailyResult.create({
            data: {
              userId: user.id,
              date: today,
              energyModel: JSON.stringify(model),
              scenesJSON: JSON.stringify(scenes),
              tarotCard: tarot.card,
              aiInsights: JSON.stringify({})
            } as any
          });
        } catch (saveErr) {
          console.warn("Failed to save daily result:", saveErr);
        }
      }
      
      // If save failed or mock user, use memory object
      if (!daily) {
        daily = {
          tarotCard: tarot.card,
          energyModel: JSON.stringify(model),
          scenesJSON: JSON.stringify(scenes)
        } as any;
      }
    } catch (genErr) {
      console.error("Generation failed:", genErr);
      // Ultimate fallback
      daily = {
        tarotCard: "The Wheel of Fortune",
        energyModel: JSON.stringify({ daily_volatility: { intensity: 0.5 } })
      } as any;
    }
  }

  const model = JSON.parse(daily!.energyModel);
  const tarotData = getRandomTarot(seed, (user.profile as any).focus);

  const result = {
    card: daily!.tarotCard || tarotData.card,
    focusAdvice: tarotData.focusAdvice,
    whyThisCard: `该结果结合了您当前对「${(user.profile as any).focus === 'wealth' ? '财富' : (user.profile as any).focus === 'love' ? '情感' : '事业'}」的关注，以及当日能量场 ${model.daily_volatility.intensity > 0.6 ? '显著波动' : '相对稳定'} 的频率特征生成。`
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-12 overflow-x-hidden relative">
      {/* DEBUG HEADER */}
      <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 z-[9999] font-bold shadow-lg">
        🚧 DEBUG: TAROT PAGE ACTIVE 🚧
      </div>

      <div className="px-6 py-8 max-w-lg mx-auto pt-16">
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
