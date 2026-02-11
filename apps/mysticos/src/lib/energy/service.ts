import { prisma } from '@/lib/prisma';
import { differenceInDays, parseISO, format } from 'date-fns';

export type EnergyState = 'dormant' | 'low' | 'high' | 'medium';

// Mock Account for fallback
const MOCK_ACCOUNT = {
  id: "mock-energy-account",
  userId: "mock-user",
  energyLevel: 50,
  lastChargedAt: null,
  lastDecayDate: null,
  updatedAt: new Date()
};

export async function getEnergyAccount(userId: string) {
  try {
    let account = await prisma.energyAccount.findUnique({
      where: { userId }
    });

    if (!account) {
      // 尝试创建，如果失败则返回 Mock
      try {
        account = await prisma.energyAccount.create({
          data: {
            userId,
            energyLevel: 50,
          }
        });
      } catch (e) {
        console.warn("Failed to create energy account, returning Mock:", e);
        return { ...MOCK_ACCOUNT, userId };
      }
    }

    return account;
  } catch (error) {
    console.warn("Failed to get energy account (DB Error), using mock:", error);
    return { ...MOCK_ACCOUNT, userId };
  }
}

export async function applyDailyDecayIfNeeded(userId: string, today: string) {
  const account = await getEnergyAccount(userId);
  if (account.id === "mock-energy-account") return account;

  const todayDate = parseISO(today);
  const lastDecay = account.lastDecayDate ? parseISO(account.lastDecayDate) : new Date(0);
  
  const daysDiff = differenceInDays(todayDate, lastDecay);

  if (daysDiff > 0) {
    const newLevel = Math.max(0, account.energyLevel - 5);
    try {
      const updated = await prisma.energyAccount.update({
        where: { userId },
        data: {
          energyLevel: newLevel,
          lastDecayDate: format(todayDate, 'yyyy-MM-dd')
        }
      });
      return updated;
    } catch (e) {
      console.error("Failed to decay energy:", e);
      return account;
    }
  }

  return account;
}

export function computeEnergyState(level: number): EnergyState {
  if (level <= 20) return 'dormant';
  if (level <= 40) return 'low';
  if (level >= 80) return 'high';
  return 'medium';
}

export function estimateRuntimeDays(level: number) {
  return Math.floor(level / 5);
}

export async function chargeEnergy(userId: string, amount: number) {
  const account = await getEnergyAccount(userId);
  if (account.id === "mock-energy-account") return account;

  const newLevel = Math.min(100, account.energyLevel + amount);
  try {
    return await prisma.energyAccount.update({
      where: { userId },
      data: { 
        energyLevel: newLevel,
        lastChargedAt: new Date()
      }
    });
  } catch (e) {
    return account;
  }
}

export async function consumeEnergy(userId: string, amount: number) {
  const account = await getEnergyAccount(userId);
  if (account.id === "mock-energy-account") return account;

  const newLevel = Math.max(0, account.energyLevel - amount);
  try {
    return await prisma.energyAccount.update({
      where: { userId },
      data: { energyLevel: newLevel }
    });
  } catch (e) {
    return account;
  }
}
