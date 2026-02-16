'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getOrCreateDeviceId } from '@/lib/device';
import { ProfileSchema } from '@/lib/zod-schemas';

export async function submitProfile(rawData: unknown) {
  const deviceId = getOrCreateDeviceId();
  
  console.log('[submitProfile] Received rawData:', JSON.stringify(rawData));

  // Preprocess: Convert empty strings to undefined for optional fields
  const sanitized = Object.fromEntries(
    Object.entries(rawData as Record<string, unknown>).map(([k, v]) => [
      k,
      v === '' ? undefined : v
    ])
  );

  const result = ProfileSchema.safeParse(sanitized);

  if (!result.success) {
    console.error('[submitProfile] Validation Failed:', result.error.flatten());
    return { 
      success: false, 
      error: "PROFILE_VALIDATION_ERROR", 
      details: result.error.flatten() 
    };
  }

  const data = result.data;
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

  try {
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

    // Success path: Set completion cookie
    cookies().set('profile_completed', '1', {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error("Server Action Error (DB), using Cookie Fallback:", e);
    
    // Fallback: Store profile in Cookie
    cookies().set('mock_profile', JSON.stringify(data), {
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Mark as completed for Vercel even on DB error
    cookies().set('profile_completed', '1', {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return { success: true };
  }
}
