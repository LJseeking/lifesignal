import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const COOKIE_NAME = 'mysticos_device_id';

export function middleware(request: NextRequest) {
  let deviceId = request.cookies.get(COOKIE_NAME)?.value;
  let response = NextResponse.next();

  if (!deviceId) {
    deviceId = uuidv4();
    response.cookies.set(COOKIE_NAME, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
