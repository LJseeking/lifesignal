import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import MahjongClient from './Client';
import { generateUnifiedModel } from '@/lib/engine';
import { getAllScenes } from '@/lib/scenes/index';
import { getRandomTarot } from '@/lib/engine/tarot';
import { FEATURE_FLAG_AI, AIInsights } from '@/lib/ai';
import { generatePersonalizedExplanation } from '@/lib/ai/interpreters';
import { computeEnergyState } from '@/lib/energy/service';
import { checkProfileOrRedirect } from '@/lib/auth-guard';

export default async function MahjongPage() {
  const user = await checkProfileOrRedirect();

  // 确保 energyAccount 存在
  const account = user.energyAccount || { energyLevel: 50 };
  const energyState = computeEnergyState(account.energyLevel);

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = `${today}-${user.deviceId}`;
  let daily = await prisma.dailyResult.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });

  if (!daily) {
    try {
      const model = generateUnifiedModel(user.profile as any, today, user.deviceId);
      const tarot = getRandomTarot(seed, (user.profile as any).focus);
      const scenes = getAllScenes(model, tarot.card, seed, energyState);
      
      if (user.id !== "mock-user-id") {
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
      } else {
        daily = {
          id: "mock-daily-id",
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
        } as any;
      }
    } catch (e) {
      console.error("[MahjongPage] Failed to generate fallback daily result:", e);
      return <div className="p-8 text-center text-slate-500">今日数据生成中，请稍后刷新...</div>;
    }
  }

  let scenes: any = {};
  try {
    scenes = JSON.parse(daily!.scenesJSON);
  } catch (e) {
    console.error("Failed to parse scenesJSON", e);
  }

  const aiInsights: AIInsights = (daily as any).aiInsights ? JSON.parse((daily as any).aiInsights) : {
    stateInterpreter: null,
    personalizedSummary: null,
    personalizedMahjong: null,
    patternObserver: null
  };

  let mahjong = scenes.mahjong || {};
  if (!mahjong.participation || energyState === 'dormant') {
    const model = JSON.parse(daily!.energyModel);
    const newScenes = getAllScenes(model, daily!.tarotCard || "未知", seed, energyState);
    mahjong = newScenes.mahjong;
  }

  let currentAIInsights = aiInsights;
  if (FEATURE_FLAG_AI && !aiInsights.personalizedMahjong) {
    const personalizedMahjong = await generatePersonalizedExplanation(mahjong.description, user.profile);
    currentAIInsights = {
      ...aiInsights,
      personalizedMahjong
    };
    try {
      if (user.id !== "mock-user-id") {
        await prisma.dailyResult.update({
          where: { id: daily!.id },
          data: { aiInsights: JSON.stringify(currentAIInsights) } as any
        });
      }
    } catch (e) {
      console.warn("Failed to update AI insights for mahjong", e);
    }
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
