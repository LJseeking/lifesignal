import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  // 仅在 NODE_ENV=production 或 vercel 环境下可用
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = !!process.env.VERCEL;

  if (!isProduction && !isVercel) {
    return NextResponse.json({ error: 'Only available in production/vercel' }, { status: 403 });
  }

  const cookieStore = cookies();
  
  const options = {
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365 // 1 year
  };

  // 1. 设置 profile_completed=1
  cookieStore.set('profile_completed', '1', options);

  // 2. 设置 mock_profile
  const mockProfile = {
    focus: 'career',
    birthDate: '2000-01-01',
    mbti: 'INTJ',
    birthTime: '12:00'
  };
  cookieStore.set('mock_profile', JSON.stringify(mockProfile), options);

  // 3. 返回 JSON { ok: true }
  return NextResponse.json({ ok: true });
}
