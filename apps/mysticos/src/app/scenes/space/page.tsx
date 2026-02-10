import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { getEnergyAccount, computeEnergyState } from '@/lib/energy/service';
import SpaceClient from './Client';
import { getSpaceAdvice } from '@/lib/scenes/space';
import { SpaceZone } from '@/lib/scenes/space/rules';

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
  const daily = await prisma.dailyResult.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });

  if (!daily) redirect('/');

  const account = await getEnergyAccount(user.id);
  const energyState = computeEnergyState(account.energyLevel);
  const model = JSON.parse(daily.energyModel);

  // 默认值处理
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
