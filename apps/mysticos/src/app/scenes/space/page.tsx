import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { computeEnergyState } from '@/lib/energy/service';
import SpaceClient from './Client';
import { getSpaceAdvice } from '@/lib/scenes/space';
import { SpaceZone } from '@/lib/scenes/space/rules';
import { generateUnifiedModel } from '@/lib/engine'; // Added import

export default async function SpacePage({
  searchParams,
}: {
  searchParams: { zone?: string };
}) {
  const deviceId = getDeviceId();
  if (!deviceId) redirect('/onboarding');

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { deviceId },
      include: { profile: true }
    });
  } catch (e) {
    console.warn("DB Error in Space:", e);
  }

  // Mock User Fallback
  if (!user) {
    user = {
      id: "mock-user-id",
      deviceId,
      profile: { focus: "wealth", mbti: "INTJ", birthTime: "12:00" }
    } as any;
  }

  if (!user || !user.profile) redirect('/onboarding');

  const today = format(new Date(), 'yyyy-MM-dd');
  
  let daily = null;
  try {
    if (user.id !== "mock-user-id") {
      daily = await prisma.dailyResult.findUnique({
        where: { userId_date: { userId: user.id, date: today } }
      });
    }
  } catch (e) {}

  if (!daily) {
    // In-Place Generation Fallback
    try {
      const model = generateUnifiedModel(user.profile as any, today, deviceId);
      daily = {
        energyModel: JSON.stringify(model)
      } as any;
    } catch (e) {
       console.error("Failed to generate fallback daily in Space:", e);
       redirect('/');
    }
  }

  const model = JSON.parse(daily!.energyModel);
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
