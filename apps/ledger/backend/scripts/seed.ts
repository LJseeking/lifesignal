import { CreditService } from '../src/services/credit.service';

async function seed() {
  console.log('--- Seeding Credit Events for u1 ---');
  const userId = 'u1';
  const now = new Date();

  const events = [
    { event_uid: 'e1', source: 'app', user_id: userId, type: 'EARN' as const, amount: 1000n, title: '注册奖励', occurred_at: new Date(now.getTime() - 100000) },
    { event_uid: 'e2', source: 'app', user_id: userId, type: 'EARN' as const, amount: 500n, title: '每日签到', occurred_at: new Date(now.getTime() - 90000) },
    { event_uid: 'e3', source: 'app', user_id: userId, type: 'SPEND' as const, amount: -200n, title: '购买道具', occurred_at: new Date(now.getTime() - 80000) },
    { event_uid: 'e4', source: 'app', user_id: userId, type: 'ADJUST' as const, amount: 50n, title: '系统补偿', occurred_at: new Date(now.getTime() - 70000) },
    { event_uid: 'e5', source: 'app', user_id: userId, type: 'SPEND' as const, amount: -100n, title: '游戏入场券', occurred_at: new Date(now.getTime() - 60000) },
  ];

  for (const e of events) {
    const res = await CreditService.appendEvent(e);
    console.log(`Event ${e.event_uid}: ${res.deduped ? 'Deduped' : 'Created'}`);
  }

  // 验证幂等：再次插入 e1
  console.log('--- Testing Idempotency (Inserting e1 again) ---');
  const resDup = await CreditService.appendEvent(events[0]);
  console.log(`Event e1 duplicate: ${resDup.deduped ? 'Deduped (Success)' : 'Failed'}`);
}

seed().catch(console.error);
