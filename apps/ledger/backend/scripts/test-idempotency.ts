import { CreditService } from '../src/services/credit.service';

async function testIdempotency() {
  console.log('--- Concurrent Idempotency Test (10 times) ---');
  
  // 使用当前毫秒构造唯一的 event_uid
  const event_uid = 'concurrent-test-' + Date.now();
  const data = {
    event_uid: event_uid,
    source: 'test_suit',
    user_id: 'u1',
    type: 'EARN' as const,
    amount: 100n,
    title: '并发入账压力测试 (含自动重试)',
    occurred_at: new Date()
  };

  console.log('Testing UID: ' + event_uid);
  console.log('Sending 10 concurrent requests...');

  // 核心：使用 Promise.all 同时发起 10 个事务请求
  const results = await Promise.allSettled(
    Array.from({ length: 10 }).map(function() {
      return CreditService.appendEvent(data);
    })
  );

  let successCount = 0;
  let dedupedCount = 0;
  let errorCount = 0;

  results.forEach(function(res, i) {
    if (res.status === 'fulfilled') {
      if (res.value.deduped) {
        dedupedCount++;
      } else {
        successCount++;
        console.log('[Request ' + i + '] SUCCESS: Balance updated.');
      }
    } else {
      errorCount++;
      console.error('[Request ' + i + '] FAILED (Non-retryable or retries exhausted):', res.reason);
    }
  });

  console.log('\n--- Final Audit Result ---');
  console.log('Total Requests: 10');
  console.log('Results: Success=' + successCount + ', Deduped=' + dedupedCount + ', Errors=' + errorCount);

  /**
   * 验收标准说明：
   * 1. successCount 必须为 1 (幂等性)。
   * 2. dedupedCount 必须为 9 (幂等键冲突)。
   * 3. errorCount 必须为 0 (由于 service 内部已实现对事务冲突的自动重试)。
   */
  if (successCount === 1 && dedupedCount === 9 && errorCount === 0) {
    console.log('\n✅ PASS: Native Idempotency & Transaction Retry are working perfectly.');
  } else {
    console.log('\n❌ FAIL: Consistency issue detected!');
    if (errorCount > 0) {
      console.log('Tip: Check if PostgreSQL is under extreme load or if isolationLevel is causing issues.');
    }
  }
}

testIdempotency().catch(console.error);
