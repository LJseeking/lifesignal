'use server';

import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { getOrCreateDeviceId } from '@/lib/device';
import { ProfileSchema } from '@/lib/zod-schemas';

export async function submitProfile(formData: FormData) {
  const deviceId = getOrCreateDeviceId();

  const parsed = ProfileSchema.safeParse({
    birthDate: formData.get('birthDate'),
    birthTime: formData.get('birthTime'),
    birthTimePrecision: formData.get('birthTimePrecision'),
    birthShichen: formData.get('birthShichen'),
    birthTimeRange: formData.get('birthTimeRange'),
    birthPlace: formData.get('birthPlace'),
    gender: formData.get('gender'),
    focus: formData.get('focus'),
    mbti: formData.get('mbti'),
    bloodType: formData.get('bloodType'),
  });

  if (!parsed.success) {
    throw new Error('PROFILE_VALIDATION_ERROR');
  }

  const data = parsed.data as any;
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
    birthPlace: data.birthPlace || null,
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

  redirect('/');
}
