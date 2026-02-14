'use server';

import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';
import { ProfileData } from '@/lib/zod-schemas';
import { revalidatePath } from 'next/cache';

export async function submitProfile(data: ProfileData) {
  const deviceId = getDeviceId();
  if (!deviceId) {
    throw new Error('NO_DEVICE_ID');
  }

  const profileData = {
    birthDate: data.birthDate,
    gender: data.gender,
    focus: data.focus,
    mbti: data.mbti || null,
    bloodType: data.bloodType || null,
    birthTime: data.birthTime || null,
    birthTimePrecision: data.birthTimePrecision || 'unknown',
    birthShichen: data.birthShichen || null,
    birthTimeRange: data.birthTimeRange || null,
    birthPlace: (data as any).birthPlace || null,
  };

  await prisma.user.upsert({
    where: { deviceId },
    update: {
      profile: {
        upsert: {
          update: profileData,
          create: profileData,
        },
      },
      energyAccount: {
        upsert: {
          update: { energyLevel: 100 },
          create: { energyLevel: 100 },
        },
      },
    },
    create: {
      deviceId,
      profile: { create: profileData },
      energyAccount: { create: { energyLevel: 100 } },
    },
  });

  revalidatePath('/');
  return { ok: true };
}
