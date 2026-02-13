import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDeviceId } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const cookieStore = cookies();
  const deviceId = getDeviceId();
  const profileCompleted = cookieStore.get('profile_completed')?.value;
  const mockProfile = cookieStore.get('mock_profile')?.value;
  const mockProfileExists = !!mockProfile;
  const profileCompletedBool = profileCompleted === '1';

  // 模拟 checkProfileOrRedirect 的逻辑
  let guardStatus = "UNKNOWN";
  let guardReason = "";

  if (!deviceId) {
    guardStatus = "REDIRECT_ONBOARDING";
    guardReason = "No Device ID";
  } else if (profileCompletedBool || mockProfileExists) {
    guardStatus = "ALLOW";
    guardReason = `Cookie Match: completed=${profileCompletedBool}, mock=${mockProfileExists}`;
  } else {
    guardStatus = "CHECK_DB";
    guardReason = "No matching cookies, falling back to DB check (result unknown here)";
  }

  return NextResponse.json({
    deviceId,
    cookies: {
      profile_completed: profileCompleted,
      mock_profile: mockProfile ? "EXISTS" : "MISSING",
    },
    guard_simulation: {
      status: guardStatus,
      reason: guardReason
    },
    timestamp: new Date().toISOString()
  });
}
