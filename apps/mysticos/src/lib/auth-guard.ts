import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';

export async function checkProfileOrRedirect() {
  const deviceId = getDeviceId();
  
  // 1. 如果没有 deviceId，直接跳转 onboarding (Middleware 应该已生成，如果这里还没有，说明异常)
  if (!deviceId) redirect('/onboarding');

  const cookieStore = cookies();
  const profileCompleted = cookieStore.get('profile_completed')?.value === '1';

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { deviceId },
      include: { profile: true, energyAccount: true }
    });
  } catch (e) {
    // 数据库连接失败，继续后续逻辑
  }

  // 2. 如果数据库中有完整的用户资料，验证通过
  if (user && user.profile) {
    return user;
  }

  // 3. 如果数据库没有资料（或连接失败），但 Cookie 标记了 "profile_completed=1"
  // 这说明用户刚刚在 Vercel 环境下完成了 Onboarding，但 DB 写入可能失败了（无 DB 模式）
  // 此时我们构造一个 Mock User，放行访问
  if (profileCompleted) {
    const mockProfileCookie = cookieStore.get('mock_profile');
    let mockProfile = { focus: 'career', birthDate: '2000-01-01' };
    
    if (mockProfileCookie) {
      try {
        mockProfile = JSON.parse(mockProfileCookie.value);
      } catch (e) {}
    }
    
    return {
      id: "mock-user-id",
      deviceId,
      profile: mockProfile,
      energyAccount: { energyLevel: 50 }
    } as any;
  }

  // 4. 既无数据库资料，又无 Cookie 标记，才强制跳转
  redirect('/onboarding');
}
