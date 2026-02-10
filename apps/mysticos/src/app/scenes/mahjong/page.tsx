import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import MahjongClient from './Client';
import { generateUnifiedModel } from '@/lib/engine';
import { getAllScenes } from '@/lib/scenes/index';
import { FEATURE_FLAG_AI, AIInsights } from '@/lib/ai';
import { generatePersonalizedExplanation } from '@/lib/ai/interpreters';

import { getEnergyAccount, computeEnergyState } from '@/lib/energy/service';

export default async function MahjongPage() {
  const deviceId = getDeviceId();
  // 注意：实际生产中应从权限系统获取
  const isSubscribed = true; 
  
  if (!deviceId) redirect('/onboarding');

  const user = await prisma.user.findUnique({
    where: { deviceId },
    include: { profile: true }
  });

  if (!user || !user.profile) redirect('/onboarding');

  const account = await getEnergyAccount(user.id);
  const energyState = computeEnergyState(account.energyLevel);

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = `${today}-${deviceId}`;
  const daily = await prisma.dailyResult.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });

  if (!daily) redirect('/');

  // 最小数据契约解析与兜底
  let scenes: any = {};
  try {
    scenes = JSON.parse(daily.scenesJSON);
  } catch (e) {
    console.error("Failed to parse scenesJSON", e);
  }

  // AI 状态
  const aiInsights: AIInsights = (daily as any).aiInsights ? JSON.parse((daily as any).aiInsights) : {
    stateInterpreter: null,
    personalizedSummary: null,
    personalizedMahjong: null,
    patternObserver: null
  };

  // 如果数据结构过旧（缺少 participation），实时重新生成并更新
  let mahjong = scenes.mahjong || {};
  if (!mahjong.participation || energyState === 'dormant') {
    const model = JSON.parse(daily.energyModel);
    const newScenes = getAllScenes(model, daily.tarotCard || "未知", seed, energyState);
    mahjong = newScenes.mahjong;
  }

  // 检查是否需要 AI 补充（针对麻将详情页）
  let currentAIInsights = aiInsights;
  if (FEATURE_FLAG_AI && !aiInsights.personalizedMahjong) {
    const personalizedMahjong = await generatePersonalizedExplanation(mahjong.description, user.profile);
    currentAIInsights = {
      ...aiInsights,
      personalizedMahjong
    };
    await prisma.dailyResult.update({
      where: { id: daily.id },
      data: { aiInsights: JSON.stringify(currentAIInsights) } as any
    });
  }

  const clientData = {
    summary: mahjong.description || "今日娱乐建议保持平常心，不宜过度投入。",
    participation: mahjong.participation || "neutral",
    style: mahjong.style || "balanced",
    tips: mahjong.tips || ["观摩学习为主", "控制参与时长"],
    lucky_color: mahjong.lucky_color || "深灰色",
    warning: mahjong.warning || "能量场相对平淡，建议适度娱乐。",
    aiExplanation: currentAIInsights.personalizedMahjong?.personalizedExplanation
  };

  return <MahjongClient data={clientData} />;
}
