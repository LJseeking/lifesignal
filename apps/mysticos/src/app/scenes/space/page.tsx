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

export default async function SpacePage({
  searchParams,
}: {
  searchParams: { zone?: string };
}) {
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

  // 修复：如果 Space 页面发现没有 DailyResult，原地生成
  if (!daily) {
    console.log(`[SpacePage] Daily result not found for ${user.id}, generating on the fly...`);
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
      console.error("[SpacePage] Failed to generate fallback daily result:", e);
      redirect('/');
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
