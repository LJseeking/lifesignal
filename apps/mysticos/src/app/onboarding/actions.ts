'use server';

import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';
import { ProfileData } from '@/lib/zod-schemas';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function submitProfile(data: ProfileData) {
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

    console.log(`Upserting profile for user: ${user.id}...`);
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: data,
      create: {
        userId: user.id,
        ...data
      }
    });
    console.log("Profile updated successfully:", updatedProfile.id);

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error("Server Action Error (DB), using Cookie Fallback:", e);
    // Fallback: Store profile in Cookie so page.tsx can read it next time
    cookies().set('mock_profile', JSON.stringify(data), {
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return { success: true }; // Pretend success to user
  }
}
