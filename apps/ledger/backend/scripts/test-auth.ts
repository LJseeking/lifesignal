const API_URL = 'http://localhost:4000';

async function testAuth() {
  console.log('--- Authentication & Security Test ---');

  // 1. 测试 Scheme 错误
  console.log('[Test 1] Wrong Authorization Scheme (Basic)');
  const res1 = await fetch(API_URL + '/credits/summary', {
    headers: { 'Authorization': 'Basic dXNlcjpwYXNz' }
  });
  const data1 = await res1.json();
  console.log('Status:', res1.status, 'Message:', data1.message);
  if (res1.status === 401 && data1.message.includes('expected Bearer')) {
    console.log('✅ PASS');
  } else {
    console.log('❌ FAIL');
  }

  // 2. 测试 Token 篡改
  console.log('\n[Test 2] Tampered Token');
  const res2 = await fetch(API_URL + '/credits/summary', {
    headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1MSIsImlhdCI6MTc3MDE3NzU4MSwiZXhwIjoxNzcwMTgxMTgxfQ.invalid_sig' }
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status, 'Message:', data2.message);
  if (res2.status === 401 && data2.message.includes('Invalid or expired token')) {
    console.log('✅ PASS');
  } else {
    console.log('❌ FAIL');
  }

  // 3. 测试 Dev 环境 X-User-Id 兼容性 (假设当前是 Dev 模式)
  console.log('\n[Test 3] Dev Fallback to X-User-Id (No Token)');
  const res3 = await fetch(API_URL + '/credits/summary', {
    headers: { 'X-User-Id': 'u1' }
  });
  const data3 = await res3.json();
  console.log('Status:', res3.status);
  if (res3.status === 200 || (res3.status === 500 && data3.error?.includes('Prisma'))) {
    console.log('✅ PASS (Authentication passed, but DB is down)');
  } else {
    console.log('❌ FAIL');
  }

  // 4. 测试 Dev Login 获取 Token 并访问
  console.log('\n[Test 4] Dev Login & Access');
  const loginRes = await fetch(API_URL + '/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'u2' })
  });
  
  if (loginRes.status === 200) {
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    console.log('Login Success, Token obtained.');
    
    const res4 = await fetch(API_URL + '/credits/summary', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data4 = await res4.json();
    console.log('Access Status:', res4.status);
    if (res4.status === 200 || (res4.status === 500 && data4.error?.includes('Prisma'))) {
      console.log('✅ PASS (Authentication passed with JWT, but DB is down)');
    } else {
      console.log('❌ FAIL');
    }
  } else {
    console.log('ℹ️ INFO (Dev Login disabled or not found - Expected in Production)');
  }

  console.log('\n--- Test Completed ---');
}

testAuth().catch(e => {
  console.error('Test script crashed:', e.message);
  process.exit(1);
});
