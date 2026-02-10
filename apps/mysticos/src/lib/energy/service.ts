import { prisma } from '@/lib/prisma';
import { differenceInDays, parseISO } from 'date-fns';

export async function getEnergyAccount(userId: string) {
  try {
    let account = await prisma.energyAccount.findUnique({
      where: { userId }
    });

    if (!account) {
      account = await prisma.energyAccount.create({
        data: {
          userId,
          energyLevel: 50, // 默认初始能量
        }
      });
    }

    return account;
  } catch (error) {
    console.warn("Failed to get energy account (DB Error), using mock:", error);
    return {
      id: "mock-energy-account",
      userId,
      energyLevel: 50,
      lastChargedAt: null,
      lastDecayDate: null,
      updatedAt: new Date()
    };
  }
}

export async function applyDailyDecayIfNeeded(userId: string, today: string) {
  const account = await getEnergyAccount(userId);
  
  // 如果是 Mock 账户，直接返回
  if (account.id === "mock-energy-account") return account;

  const todayDate = parseISO(today);
  const lastDecay = account.lastDecayDate ? account.lastDecayDate : new Date(0);
  
  // 简单逻辑：如果上次衰减日期不是今天，就衰减
  // 注意：这里用 UTC 日期比较简化处理
  const daysDiff = differenceInDays(todayDate, lastDecay);

  if (daysDiff > 0) {
    // 衰减逻辑：每天 -5
    const newLevel = Math.max(0, account.energyLevel - 5);
    
    try {
      const updated = await prisma.energyAccount.update({
        where: { userId },
        data: {
          energyLevel: newLevel,
          lastDecayDate: todayDate
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

export function computeEnergyState(level: number) {
  if (level <= 20) return 'dormant'; // 休眠
  if (level <= 40) return 'low';     // 低能量
  if (level >= 80) return 'high';    // 高能量
  return 'normal';
}

export function estimateRuntimeDays(level: number) {
  // 假设每天消耗 5 点
  return Math.floor(level / 5);
}
