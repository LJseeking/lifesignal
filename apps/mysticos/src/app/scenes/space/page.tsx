import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { getEnergyAccount, computeEnergyState } from '@/lib/energy/service';
import SpaceClient from './Client';
import { getSpaceAdvice } from '@/lib/scenes/space';
import { SpaceZone } from '@/lib/scenes/space/rules';
import { generateUnifiedModel } from '@/lib/engine';
import { getAllScenes } from '@/lib/scenes/index';
import { getRandomTarot } from '@/lib/engine/tarot';
import { checkProfileOrRedirect } from '@/lib/auth-guard';

export default async function SpacePage({
  searchParams,
}: {
  searchParams: { zone?: string };
}) {
  const user = await checkProfileOrRedirect();

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = `${today}-${user.deviceId}`;
  
  // 确保 energyAccount 存在
  const account = user.energyAccount || { energyLevel: 50 };
  const energyState = computeEnergyState(account.energyLevel);

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
      console.error("[SpacePage] Failed to generate fallback daily result:", e);
      return <div className="p-8 text-center text-slate-500">今日数据生成中，请稍后刷新...</div>;
    }
  }

  const model = JSON.parse(daily.energyModel);
  const zone = (searchParams.zone || 'work') as SpaceZone;
  const advice = getSpaceAdvice(model, zone, energyState);

  return (
    <SpaceClient 
      userId={user.id}
      initialData={advice}
      energyState={energyState}
      currentZone={zone}
    />
  );
}
