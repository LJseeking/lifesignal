import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';

export async function checkProfileOrRedirect() {
  const deviceId = getDeviceId(); // This already checks cookies
  console.log(`[AuthGuard] Checking for deviceId: ${deviceId}`);
  
  if (!deviceId) {
    console.log('[AuthGuard] No deviceId, redirecting to onboarding');
    redirect('/onboarding');
  }

  const cookieStore = cookies();
  const profileCompleted = cookieStore.get('profile_completed')?.value === '1';
  const mockProfileCookie = cookieStore.get('mock_profile');
  const mockProfileExists = !!mockProfileCookie;

  console.log(`[AuthGuard] Cookies state: profile_completed=${profileCompleted}, mock_profile_exists=${mockProfileExists}`);

  // B) 优先检查 Mock Profile (Vercel 环境优先)
  if (profileCompleted || mockProfileExists) { // Changed && to || to be more lenient
    console.log('[AuthGuard] Vercel Fallback: Using mock profile from cookies');
    let mockProfile = { focus: 'career', birthDate: '2000-01-01' };
    try {
      if (mockProfileCookie) mockProfile = JSON.parse(mockProfileCookie.value);
    } catch (e) {
      console.error('[AuthGuard] Failed to parse mock profile cookie', e);
    }
    
    return {
      id: "mock-user-id",
      deviceId,
      profile: mockProfile,
      energyAccount: { energyLevel: 50 }
    } as any;
  }

  // 其次检查数据库
  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { deviceId },
      include: { profile: true, energyAccount: true }
    });
  } catch (e) {
    console.error('[AuthGuard] DB Error:', e);
  }

  if (user && user.profile) {
    console.log('[AuthGuard] DB Success: Found user profile');
    return user;
  }

  // 既无 Mock 又无 DB，跳转
  console.log('[AuthGuard] No profile found (DB or Mock), redirecting to onboarding');
  redirect('/onboarding');
}
