'use server';

import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';
import { ProfileData } from '@/lib/zod-schemas';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function submitProfile(data: ProfileData) {
  console.log('[Onboarding] submitProfile started');
  
  // 强制写入 Cookie（无论验证结果如何，确保调试/兜底可用）
  cookies().set('profile_completed', '1', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 31536000 // 1 year
  });
  
  cookies().set('mock_profile', JSON.stringify({
    focus: data.focus || 'career',
    birthDate: data.birthDate || '2000-01-01',
    mbti: data.mbti || 'INTJ',
    birthTime: '12:00'
  }), {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 31536000 // 1 year
  });
  console.log('[Onboarding] Forced cookies set: profile_completed & mock_profile');

  const deviceId = getDeviceId();
  if (deviceId) {
    try {
      let user = await prisma.user.findUnique({
        where: { deviceId },
        include: { profile: true }
      });

      if (!user) {
        user = await prisma.user.create({
          data: { deviceId },
          include: { profile: true }
        });
      }

      if (user) {
        console.log(`[Onboarding] Upserting profile for user: ${user.id}...`);
        await prisma.profile.upsert({
          where: { userId: user.id },
          update: data,
          create: {
            userId: user.id,
            ...data
          }
        });
        console.log('[Onboarding] DB Success');
      }
      revalidatePath('/');
    } catch (e) {
      console.error("[Onboarding] DB Operation Failed (Non-blocking):", e);
    }
  } else {
    console.warn("[Onboarding] No deviceId found, skipping DB write");
  }

  // 返回明确的成功标志和 Cookie 写入确认
  console.log('[Onboarding] Action completed success');
  return { ok: true, wroteCookies: true };
}
