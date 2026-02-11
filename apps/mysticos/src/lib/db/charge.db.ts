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
  // 插入充能记录
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
      // 忽略唯一约束冲突 (P2002)
      if (e.code === 'P2002') return null;
      throw e;
    }
  },

  // 获取所有记录 (带分页)
  getCharges: async (limit = 20, offset = 0, user?: string) => {
    const where = user && user.trim() !== '' ? { user: user.toLowerCase() } : {};
    
    const charges = await prisma.charge.findMany({
      where,
      orderBy: [
        { blockNumber: 'desc' },
        { logIndex: 'desc' }
      ],
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
  },

  // 获取记录总数
  getChargesCount: async (user?: string) => {
    const where = user && user.trim() !== '' ? { user: user.toLowerCase() } : {};
    return await prisma.charge.count({ where });
  },

  // 获取最新同步到的区块号 (用于补录)
  getLatestBlockNumber: async () => {
    const result = await prisma.charge.findFirst({
      orderBy: { blockNumber: 'desc' },
      select: { blockNumber: true }
    });
    return result?.blockNumber || 0;
  }
};

export default chargeDb;
