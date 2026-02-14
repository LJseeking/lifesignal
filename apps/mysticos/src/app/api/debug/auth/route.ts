import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const cookieStore = cookies();
  const deviceId = cookieStore.get('mysticos_device_id')?.value || null;

  const result: any = {
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL === '1',
    cookies: {
      deviceId,
    },
    db: {
      connected: false,
      profile_found: false,
      user_id: null,
      error: null
    }
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    result.db.connected = true;

    if (deviceId) {
      const user = await prisma.user.findUnique({
        where: { deviceId },
        include: { profile: true }
      });
      result.db.user_id = user?.id || null;
      result.db.profile_found = !!user?.profile;
    }
  } catch (e: any) {
    result.db.error = String(e?.message || e);
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
