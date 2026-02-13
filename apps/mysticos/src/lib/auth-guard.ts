import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';

export async function checkProfileOrRedirect() {
  const deviceId = getDeviceId();

  if (!deviceId) {
    redirect('/onboarding');
  }

  const cookieStore = cookies();
  const profileCompleted = cookieStore.get('profile_completed')?.value === '1';
  const mockProfileRaw = cookieStore.get('mock_profile')?.value;

  if (profileCompleted || mockProfileRaw) {
    let profile: any = { focus: 'career', birthDate: '2000-01-01' };
    if (mockProfileRaw) {
      try {
        profile = JSON.parse(mockProfileRaw);
      } catch {
        // ignore
      }
    }

    return {
      id: 'mock-user-id',
      deviceId,
      profile,
      energyAccount: { energyLevel: 50 }
    } as any;
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
