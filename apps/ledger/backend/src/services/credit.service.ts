import { PrismaClient, CreditEventType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 判断是否为可重试的事务冲突错误
 * - SQLSTATE 40001: serialization_failure
 * - SQLSTATE 40P01: deadlock_detected
 * - Prisma P2034: Transaction failed due to a write conflict or a deadlock
 */
function isRetryableTxError(error: any): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2034') return true;
  }
  
  const message = error.message || '';
  const code = (error as any).code || '';
  
  // 兼容不同形态的错误对象，检查 SQLSTATE 或错误信息关键字
  return (
    message.includes('40001') || 
    message.includes('40P01') || 
    message.includes('serialization failure') || 
    message.includes('deadlock detected') ||
    code === '40001' ||
    code === '40P01'
  );
}

export class CreditService {
  /**
   * 核心写入逻辑：保证幂等与事务一致性
   * 增强：增加 3 次事务冲突自动重试
   */
  static async appendEvent(data: {
    event_uid: string;
    source: string;
    user_id: string;
    type: CreditEventType;
    amount: bigint;
    title?: string;
    occurred_at: Date;
  }) {
    // 1. 业务规则校验
    if (data.type === 'EARN' && data.amount <= 0n) throw new Error('EARN amount must be > 0');
    if (data.type === 'SPEND' && data.amount >= 0n) throw new Error('SPEND amount must be < 0');

    const maxAttempts = 3;
    const delays = [20, 80];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          await sleep(delays[attempt - 2] ?? 100);
          console.log(`[Retry] Attempt ${attempt} for event_uid: ${data.event_uid}`);
        }

        return await prisma.$transaction(async (tx) => {
          // 2. 直接插入事件 (依赖数据库 UNIQUE 约束)
          const event = await tx.creditEvent.create({ data });

          // 3. 计算余额增量
          let balanceInc = event.amount;
          let earnedInc = 0n;
          let spentInc = 0n;

          if (event.type === 'EARN' || (event.type === 'ADJUST' && event.amount > 0n)) {
            earnedInc = event.amount;
          } else if (event.type === 'SPEND' || (event.type === 'ADJUST' && event.amount < 0n)) {
            spentInc = event.amount < 0n ? -event.amount : 0n;
          }

          // 4. 原子更新聚合表
          const balance = await tx.creditBalance.upsert({
            where: { user_id_currency: { user_id: event.user_id, currency: event.currency } },
            create: {
              user_id: event.user_id,
              currency: event.currency,
              balance: balanceInc,
              earned_total: earnedInc,
              spent_total: spentInc,
            },
            update: {
              balance: { increment: balanceInc },
              earned_total: { increment: earnedInc },
              spent_total: { increment: spentInc },
            }
          });

          return { deduped: false, event, balance };
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable // 极高隔离级别防止幻读
        });
      } catch (error) {
        // 5. 捕获 P2002 (Unique constraint failed) - 幂等冲突不重试
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          return { deduped: true, error: 'Event already exists' };
        }

        // 6. 检查是否可重试
        if (attempt < maxAttempts && isRetryableTxError(error)) {
          continue;
        }

        // 达到最大重试次数或不可重试错误，抛出
        throw error;
      }
    }
    
    throw new Error('Maximum retries exceeded'); // 理论上不会到达这里
  }

  static async recompute(userId: string, currency: string = 'CREDIT') {
    return await prisma.$transaction(async (tx) => {
      const events = await tx.creditEvent.findMany({
        where: { user_id: userId, currency, status: 'VALID' },
        orderBy: { occurred_at: 'asc' }
      });

      let balance = 0n;
      let earned = 0n;
      let spent = 0n;

      for (const e of events) {
        balance += e.amount;
        if (e.type === 'EARN' || (e.type === 'ADJUST' && e.amount > 0n)) {
          earned += e.amount;
        } else if (e.type === 'SPEND' || (e.type === 'ADJUST' && e.amount < 0n)) {
          spent += e.amount < 0n ? -e.amount : 0n;
        }
      }

      return await tx.creditBalance.upsert({
        where: { user_id_currency: { user_id: userId, currency } },
        create: { user_id: userId, currency, balance, earned_total: earned, spent_total: spent },
        update: { balance, earned_total: earned, spent_total: spent }
      });
    });
  }
}
