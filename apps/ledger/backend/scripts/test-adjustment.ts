const API_URL = 'http://localhost:4000';
const ADMIN_TOKEN = 'secret_admin_token_123';
const USER_ID = 'u1';

async function testAdjustment() {
  console.log('--- Testing POST /credits/adjustments ---');

  // 1. 获取调整前余额
  const sumRes1 = await fetch(API_URL + '/credits/summary', {
    headers: { 'X-User-Id': USER_ID }
  });
  const sum1 = await sumRes1.json();
  const balanceBefore = BigInt(sum1.balance);
  console.log('Balance Before:', sum1.balance);

  // 2. 执行调整 (+50)
  const adjRes = await fetch(API_URL + '/credits/adjustments', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Admin-Token': ADMIN_TOKEN
    },
    body: JSON.stringify({
      userId: USER_ID,
      amount: '50',
      reason: '系统修复',
      occurredAt: new Date().toISOString()
    })
  });
  const adjData = await adjRes.json();
  console.log('Adjustment Response:', adjData);

  // 3. 验证调整后余额
  const sumRes2 = await fetch(API_URL + '/credits/summary', {
    headers: { 'X-User-Id': USER_ID }
  });
  const sum2 = await sumRes2.json();
  const balanceAfter = BigInt(sum2.balance);
  console.log('Balance After:', sum2.balance);

  if (balanceAfter === balanceBefore + 50n) {
    console.log('✅ PASS: Balance updated correctly after adjustment.');
  } else {
    console.log('❌ FAIL: Balance mismatch!');
  }
}

testAdjustment().catch(console.error);
