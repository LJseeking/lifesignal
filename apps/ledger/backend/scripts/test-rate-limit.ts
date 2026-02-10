import { JwtUtil } from '../src/utils/jwt.util';

const API_URL = 'http://localhost:4000';
const LIMIT = 5; // 测试用限制
const USER_ID = 'rate-limit-test-user';

async function testRateLimit() {
  console.log('--- Rate Limit Test (Strict) ---');
  console.log('Ensure backend is running and DB is reachable.');
  
  // 1. 获取 Token (强制依赖 dev-login 或 dev fallback)
  let token = '';
  
  // 尝试使用 dev-login 获取
  try {
    const loginRes = await fetch(API_URL + '/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID })
    });
    
    if (loginRes.status === 200) {
      const data = await loginRes.json();
      token = data.accessToken;
      console.log('✅ Obtained Token via /auth/dev-login');
    } else {
      console.log('ℹ️ /auth/dev-login not available (Status: ' + loginRes.status + ')');
    }
  } catch (e: any) {
    console.error('❌ Failed to reach backend:', e.message);
    process.exit(1);
  }

  // 如果无法获取 token，且不是 dev fallback 环境，则退出
  // 这里我们简化处理：如果没有 token，尝试直接用 X-User-Id (仅限 dev)
  // 为了脚本严谨性，我们先用 /healthz 检查
  try {
    const health = await fetch(API_URL + '/healthz');
    if (health.status !== 200) {
      console.error('❌ Backend unhealthy');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Backend unreachable');
    process.exit(1);
  }

  const headers: any = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  } else {
    // Fallback to X-User-Id
    console.log('⚠️ Using X-User-Id fallback (Only works in non-production)');
    headers['X-User-Id'] = USER_ID;
  }

  console.log(`Sending ${LIMIT + 2} requests... (Limit: ${LIMIT})`);
  
  for (let i = 1; i <= LIMIT + 2; i++) {
    const res = await fetch(API_URL + '/credits/events', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        eventUid: `rl-strict-${Date.now()}-${i}`,
        type: 'EARN',
        amount: '1',
        title: 'Rate limit strict test',
        occurredAt: new Date().toISOString()
      })
    });

    if (i <= LIMIT) {
      // 阈值内：不得出现 429
      if (res.status === 429) {
        console.log(`❌ FAIL [Req ${i}]: Premature 429`);
        process.exit(1);
      } else if (res.status === 500) {
         // 严格模式下，500 视为环境未就绪
         console.log(`❌ FAIL [Req ${i}]: DB not ready (500)`);
         process.exit(1);
      }
      console.log(`[Req ${i}] Status: ${res.status} (Allowed)`);
    } else {
      // 超过阈值：必须 429
      if (res.status === 429) {
        console.log(`[Req ${i}] Status: 429 Too Many Requests`);
        const body = await res.json();
        const retryHeader = res.headers.get('retry-after');
        
        if (retryHeader && typeof body.retryAfterSeconds === 'number') {
           console.log('✅ PASS: Rate limit triggered with complete fields');
        } else {
           console.log('❌ FAIL: Missing Retry-After fields');
        }
        return; // 测试结束
      } else {
        console.log(`❌ FAIL [Req ${i}]: Expected 429, got ${res.status}`);
      }
    }
  }
}

testRateLimit().catch(e => {
  console.error(e);
  process.exit(1);
});
