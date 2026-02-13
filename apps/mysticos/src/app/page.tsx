export const runtime = 'nodejs';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { format } from 'date-fns';

import { getDeviceId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateUnifiedModel } from '@/lib/engine';
import { getAllScenes } from '@/lib/scenes/index';
import { getRandomTarot } from '@/lib/engine/tarot';
import { computeEnergyState, estimateRuntimeDays } from '@/lib/energy/service';

import { EnergyBadge } from '@/components/energy/EnergyBadge';

export default async function Home() {
  const deviceId = getDeviceId();
  if (!deviceId) redirect('/onboarding');

  const cookieStore = cookies();
  const profileCompleted = cookieStore.get('profile_completed')?.value === '1';
  const mockProfileRaw = cookieStore.get('mock_profile')?.value;

  let dbUser: any = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { deviceId },
      include: { profile: true, energyAccount: true }
    });
  } catch (e) {
    console.error('[Home] prisma.user.findUnique failed:', e);
  }

  let finalUser: any = dbUser;

  if ((!finalUser || !finalUser.profile) && (profileCompleted || mockProfileRaw)) {
    let profile: any = { focus: 'career', birthDate: '2000-01-01' };
    if (mockProfileRaw) {
      try {
        profile = JSON.parse(mockProfileRaw);
      } catch (e) {
        console.error('[Home] Failed to parse mock_profile cookie, using default profile:', e);
      }
    }

    finalUser = {
      id: 'mock-user-id',
      deviceId,
      profile,
      energyAccount: { energyLevel: 50 }
    };
  }

  if ((!finalUser || !finalUser.profile) && !(profileCompleted || mockProfileRaw)) {
    redirect('/onboarding');
  }

  const buildSha = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 8) || 'local';
  const marker = `HOME_GUARD_BYPASS_OK_${buildSha}`;

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = `${today}-${deviceId}`;

  const energyLevel = finalUser.energyAccount?.energyLevel ?? 50;
  const energyState = computeEnergyState(energyLevel);
  const runtimeDays = estimateRuntimeDays(energyLevel);

  const model = generateUnifiedModel(finalUser.profile as any, today, deviceId);
  const tarot = getRandomTarot(seed, (finalUser.profile as any).focus);
  const scenes = getAllScenes(model, tarot.card, seed, energyState);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div>{marker}</div>

      <div className="bg-white px-6 pt-16 pb-10 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="text-indigo-600 font-bold tracking-tight">Signal</div>
          <EnergyBadge level={energyLevel} state={energyState} estimatedDays={runtimeDays} />
        </div>

        <h1 className="text-2xl font-bold leading-tight text-slate-900 mb-4">{scenes.summary.description}</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {scenes.summary.keywords.map((k: string) => (
            <span key={k} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
              {k}
            </span>
          ))}
        </div>

        <div className="flex gap-4">
          <Link href="/tarot" className="text-indigo-600 font-bold">
            今日塔罗
          </Link>
          <Link href="/energy" className="text-indigo-600 font-bold">
            能量
          </Link>
        </div>
      </div>
    </div>
  );
}
