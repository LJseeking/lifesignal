import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const COOKIE_NAME = 'mysticos_device_id';

export function middleware(request: NextRequest) {
  let deviceId = request.cookies.get(COOKIE_NAME)?.value;
  let response = NextResponse.next();

  // 1. 如果没有 Device ID，生成并写入
  if (!deviceId) {
    deviceId = uuidv4();
    response.cookies.set(COOKIE_NAME, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  const { pathname } = request.nextUrl;

  // 2. 路由守卫逻辑
  // 放行静态资源、API、Onboarding
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/static') || 
    pathname === '/favicon.ico' || 
    pathname === '/onboarding'
  ) {
    return response;
  }

  // 3. 检查 Onboarding 状态 (仅对首页生效，避免重定向循环)
  // 注意：Middleware 无法直接读取数据库，这里只能做基本的 Cookie 检查
  // 更深层的 User/Profile 检查交由 page.tsx (Server Component) 处理
  // 如果这里强制重定向到 /onboarding，会导致所有页面都跳过去，不灵活
  
  // 4. 防止从子页面错误跳回首页
  // 之前的逻辑可能在某些条件下重定向到了 '/'，这里我们不做任何强制重定向
  // 让各个页面自己处理权限逻辑

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
