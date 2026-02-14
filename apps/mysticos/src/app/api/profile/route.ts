import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ProfileSchema } from '@/lib/zod-schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const cookieStore = cookies();
  const deviceId = cookieStore.get('mysticos_device_id')?.value;

  if (!deviceId) {
    return NextResponse.json(
      { ok: false, error: 'NO_DEVICE_ID' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'INVALID_JSON' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const parsed = ProfileSchema.safeParse({
    birthDate: (json as any)?.birthDate,
    gender: (json as any)?.gender,
    focus: (json as any)?.focus,
    mbti: (json as any)?.mbti,
    bloodType: (json as any)?.bloodType,
    birthTimePrecision: (json as any)?.birthTimePrecision,
    birthShichen: (json as any)?.birthShichen,
    birthTimeRange: (json as any)?.birthTimeRange,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const data = parsed.data as any;
  const profileData = {
    birthDate: data.birthDate,
    gender: data.gender,
    focus: data.focus,
    mbti: data.mbti || null,
    bloodType: data.bloodType || null,
    birthTime: null,
    birthTimePrecision: data.birthTimePrecision || 'unknown',
    birthShichen: data.birthShichen || null,
    birthTimeRange: data.birthTimeRange || null,
    birthPlace: null,
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

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
