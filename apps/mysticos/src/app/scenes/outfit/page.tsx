import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import OutfitClient from './Client';
import { getAllScenes } from '@/lib/scenes/index';
import { generateUnifiedModel } from '@/lib/engine';
import { getRandomTarot } from '@/lib/engine/tarot';
import { computeEnergyState } from '@/lib/energy/service';
import { checkProfileOrRedirect } from '@/lib/auth-guard';

export default async function OutfitPage() {
  const user = await checkProfileOrRedirect();

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
      console.error('[OutfitPage] Failed to generate fallback daily result:', e);
      return <div className="p-8 text-center text-slate-500">今日数据生成中，请稍后刷新...</div>;
    }
  }

  let scenes: any = {};
  try {
    scenes = JSON.parse(daily!.scenesJSON);
  } catch (e) {
    console.error('Failed to parse scenesJSON', e);
  }

  let outfit = scenes.outfit || {};
  if (!outfit.recommendedColors || energyState === 'dormant') {
    const model = JSON.parse(daily!.energyModel);
    const newScenes = getAllScenes(model, daily!.tarotCard || '未知', seed, energyState);
    outfit = newScenes.outfit;
  }

  const clientData = {
    summary: outfit.description || '今日适合保持低调，以舒适材质为主。',
    recommendedColors: outfit.recommendedColors || ['灰色', '米色'],
    avoidColors: outfit.avoidColors || ['鲜红色'],
    materials: outfit.materials || ['棉质'],
    accessories: outfit.accessories || ['无'],
    notes: outfit.notes || '根据当日能量模型生成的平衡建议。'
  };

  return <OutfitClient data={clientData} />;
}
