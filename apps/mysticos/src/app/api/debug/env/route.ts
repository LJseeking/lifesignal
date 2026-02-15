import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasPostgresUrl = !!process.env.POSTGRES_URL;
  const hasPostgresPrismaUrl = !!process.env.POSTGRES_PRISMA_URL;
  const hasNeonUrl = !!process.env.NEON_DATABASE_URL;

  return NextResponse.json(
    {
      ok: true,
      env: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        hasDatabaseUrl,
        hasPostgresUrl,
        hasPostgresPrismaUrl,
        hasNeonUrl,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
