import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const data = {
    vercel: process.env.VERCEL === "1",
    env: process.env.NODE_ENV,
    git: {
      sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      ref: process.env.VERCEL_GIT_COMMIT_REF || null,
      msg: process.env.VERCEL_GIT_COMMIT_MESSAGE || null
    },
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}
