import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';

export async function checkProfileOrRedirect() {
  const deviceId = getDeviceId();

  if (!deviceId) {
    redirect('/onboarding');
  }

  const user = await prisma.user.findUnique({
    where: { deviceId },
    include: { profile: true, energyAccount: true }
  });

  if (user && user.profile) {
    return user;
  }

  redirect('/onboarding');
}
