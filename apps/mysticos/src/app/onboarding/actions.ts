'use server';

import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';
import { ProfileData } from '@/lib/zod-schemas';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function submitProfile(data: ProfileData) {
  console.log('[Onboarding] submitProfile started');
  const deviceId = getDeviceId();
  if (!deviceId) return { success: false, error: "身份验证失败" };

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

    if (!user) throw new Error("无法创建或查找用户");

    console.log(`[Onboarding] Upserting profile for user: ${user.id}...`);
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: data,
      create: {
        userId: user.id,
        ...data
      }
    });
    
    // Success path: Set completion cookie
    cookies().set('profile_completed', '1', {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    console.log('[Onboarding] DB Success: profile_completed set');

    revalidatePath('/');
  } catch (e) {
    console.error("[Onboarding] Server Action Error (DB), using Cookie Fallback:", e);
    
    // Fallback: Store profile in Cookie
    cookies().set('mock_profile', JSON.stringify(data), {
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    cookies().set('profile_completed', '1', {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    console.log('[Onboarding] Fallback Success: mock_profile and profile_completed set');
  }

  // A) 不再使用 redirect，返回成功标志由客户端处理
  console.log('[Onboarding] Action completed, returning success');
  return { ok: true };
}
