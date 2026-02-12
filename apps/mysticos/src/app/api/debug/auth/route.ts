import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const deviceId = cookieStore.get('mysticos_device_id')?.value;
  const profileCompleted = cookieStore.get('profile_completed')?.value;
  const mockProfile = cookieStore.get('mock_profile')?.value;

  let dbProfile = null;
  let dbError = null;

  if (deviceId) {
    try {
      const user = await prisma.user.findUnique({
        where: { deviceId },
        include: { profile: true }
      });
      dbProfile = user?.profile || null;
    } catch (e: any) {
      dbError = e.message;
    }
  }

  return NextResponse.json({
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL ? true : false,
    cookies: {
      deviceId: deviceId || null,
      profile_completed: profileCompleted || null,
      mock_profile_exists: !!mockProfile
    },
    db: {
      connected: !dbError,
      profile_found: !!dbProfile,
      error: dbError
    }
  });
}
