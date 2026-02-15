import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { getOrCreateDeviceId } from '@/lib/device';

export async function getUserWithProfileOrRedirect(deviceIdArg?: string) {
  const deviceId = deviceIdArg ?? getOrCreateDeviceId();

  const user = await prisma.user.findUnique({
    where: { deviceId },
    include: { profile: true, energyAccount: true },
  });

  if (!user || !user.profile) {
    redirect('/onboarding');
  }

  return user;
}
