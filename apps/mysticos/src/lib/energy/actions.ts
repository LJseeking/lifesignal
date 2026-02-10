'use server';

import { chargeEnergy, consumeEnergy } from './service';
import { revalidatePath } from 'next/cache';

export async function handleCharge(userId: string, amount: number) {
  try {
    await chargeEnergy(userId, amount);
    revalidatePath('/');
    revalidatePath('/energy');
    return { success: true };
  } catch (error) {
    console.error('Failed to charge energy:', error);
    return { success: false };
  }
}

export async function handleBoost(userId: string) {
  try {
    // Boost 消耗 10 能量
    await consumeEnergy(userId, 10);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to boost energy:', error);
    return { success: false };
  }
}
