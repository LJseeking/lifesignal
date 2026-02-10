const API_URL = 'http://localhost:4000';
const USER_ID = 'u1';

async function testPostEvents() {
  console.log('--- Testing POST /credits/events ---');
  
  const eventUid = 'order-' + Date.now();
  const payload = {
    eventUid,
    source: 'order-service',
    type: 'EARN',
    amount: '100',
    title: '订单奖励',
    occurredAt: new Date().toISOString()
  };

  // 1. 成功写入
  const res1 = await fetch(API_URL + '/credits/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': USER_ID },
    body: JSON.stringify(payload)
  });
  const data1 = await res1.json();
  console.log('Success Case:', data1);
  if (data1.deduped === false) console.log('✅ PASS: Event created.');

  // 2. 重复写入 (幂等验证)
  const res2 = await fetch(API_URL + '/credits/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': USER_ID },
    body: JSON.stringify(payload)
  });
  const data2 = await res2.json();
  console.log('Duplicate Case:', data2);
  if (data2.deduped === true) console.log('✅ PASS: Idempotency handled.');

  // 3. 非法参数 (EARN 必须 > 0)
  const res3 = await fetch(API_URL + '/credits/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': USER_ID },
    body: JSON.stringify({ ...payload, eventUid: eventUid + '-bad', amount: '-100' })
  });
  console.log('Invalid Amount Case (Status ' + res3.status + '):', await res3.json());
  if (res3.status === 400) console.log('✅ PASS: Validation error handled.');
}

testPostEvents().catch(console.error);
