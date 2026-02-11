import { prisma } from '@/lib/prisma';

export interface ChargeRecord {
  id?: number;
  tx_hash: string;
  log_index: number;
  block_number: number;
  user: string;
  token_amount: string;
  energy_credit: string;
  timestamp: number;
}

export const chargeDb = {
  insertCharge: async (record: ChargeRecord) => {
    try {
      return await prisma.charge.create({
        data: {
          txHash: record.tx_hash,
          logIndex: record.log_index,
          blockNumber: record.block_number,
          user: record.user,
          tokenAmount: record.token_amount,
          energyCredit: record.energy_credit,
          timestamp: record.timestamp
        }
      });
    } catch (e: any) {
      if (e.code === 'P2002') return null;
      console.warn("Failed to insert charge (DB Error), ignoring:", e);
      return null;
    }
  },

  getCharges: async (limit = 20, offset = 0, user?: string) => {
    try {
      const where = user && user.trim() !== '' ? { user: user.toLowerCase() } : {};
      const charges = await prisma.charge.findMany({
        where,
        orderBy: [{ blockNumber: 'desc' }, { logIndex: 'desc' }],
        take: limit,
        skip: offset
      });

      return charges.map(c => ({
        id: c.id,
        tx_hash: c.txHash,
        log_index: c.logIndex,
        block_number: c.blockNumber,
        user: c.user,
        token_amount: c.tokenAmount,
        energy_credit: c.energyCredit,
        timestamp: c.timestamp
      }));
    } catch (e) {
      console.warn("Failed to get charges, returning empty list:", e);
      return [];
    }
  },

  getChargesCount: async (user?: string) => {
    try {
      const where = user && user.trim() !== '' ? { user: user.toLowerCase() } : {};
      return await prisma.charge.count({ where });
    } catch (e) {
      return 0;
    }
  },

  getLatestBlockNumber: async () => {
    try {
      const result = await prisma.charge.findFirst({
        orderBy: { blockNumber: 'desc' },
        select: { blockNumber: true }
      });
      return result?.blockNumber || 0;
    } catch (e) {
      return 0;
    }
  }
};

export default chargeDb;
