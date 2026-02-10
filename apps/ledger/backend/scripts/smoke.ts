// Only native fetch used
// Note: We don't import JwtUtil anymore to avoid local signing dependency issues

const BASE_URL = process.env.SMOKE_BASE_URL || process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
const SMOKE_USER = process.env.SMOKE_USER || 'smoke-tester';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Auth State
let authHeaders: Record<string, string> | null = null;
let authMode = 'UNKNOWN';

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (authHeaders) return authHeaders;

  console.log(`[AUTH] Resolving authentication strategy for user: ${SMOKE_USER}`);

  // 1. Env Token (Mandatory)
  if (process.env.SMOKE_TOKEN) {
    authMode = 'ENV_TOKEN';
    authHeaders = { 'Authorization': `Bearer ${process.env.SMOKE_TOKEN}` };
    console.log('   -> Using SMOKE_TOKEN from env');
    return authHeaders;
  }

  // If we reach here, no valid token is available
  throw new Error(
    'SMOKE_TOKEN environment variable is required.\n' +
    '   How to generate: Run "npm run generate-token" (ensure JWT_SECRET is set).'
  );
}

async function check(name: string, fn: () => Promise<void>) {
  process.stdout.write(`[TEST] ${name} ... `);
  try {
    await fn();
    console.log('✅ PASS');
  } catch (e: any) {
    console.log('❌ FAIL');
    console.error(`   Error: ${e.message}`);
    if (authMode !== 'UNKNOWN') console.error(`   Auth Mode: ${authMode}`);
    if (e.cause) console.error('   Cause:', e.cause);
    process.exit(1);
  }
}

async function smokeTest() {
  console.log(`\n🔥 Starting Smoke Test against ${BASE_URL}\n`);

  // Prepare Auth first
  const headers = await getAuthHeaders();

  // 1. Health Check
  await check('GET /healthz', async () => {
    const res = await fetch(`${BASE_URL}/healthz`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    if (data.ok !== true) throw new Error('Body.ok !== true');
  });

  // 2. Readiness Check (DB)
  await check('GET /readyz (DB Check)', async () => {
    const res = await fetch(`${BASE_URL}/readyz`);
    if (res.status !== 200) {
      const txt = await res.text();
      let reason = txt;
      try { reason = JSON.parse(txt).reason || txt; } catch {}
      throw new Error(`Status ${res.status} - Reason: ${reason}`);
    }
    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid JSON response');
    }
    if (data.ok !== true) throw new Error('Body.ok !== true');
  });

  // 3. Auth 401 Check (No Auth headers)
  await check('GET /credits/summary (No Auth -> 401)', async () => {
    const res = await fetch(`${BASE_URL}/credits/summary`); // No headers
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 4. Idempotency Check (Write Event)
  const eventUid = `smoke-evt-${Date.now()}-${Math.floor(Math.random()*10000)}`;
  await check('POST /credits/events (Idempotency)', async () => {
    const payload = {
      eventUid,
      type: 'EARN',
      amount: '1',
      title: 'Smoke Test',
      occurredAt: new Date().toISOString(),
      source: 'SMOKE_TEST'
    };

    // First Call
    const res1 = await fetch(`${BASE_URL}/credits/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload)
    });
    
    if (res1.status === 401) throw new Error('401 Unauthorized - Please provide valid SMOKE_TOKEN');
    if (![200, 201].includes(res1.status)) {
       const txt = await res1.text();
       throw new Error(`First call failed: ${res1.status} - ${txt}`);
    }
    const data1: any = await res1.json();
    if (data1.deduped !== false) throw new Error(`First call deduped=${data1.deduped}, expected false`);

    // Second Call
    const res2 = await fetch(`${BASE_URL}/credits/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload)
    });
    if (![200, 201].includes(res2.status)) throw new Error(`Second call failed: ${res2.status}`);
    const data2: any = await res2.json();
    if (data2.deduped !== true) throw new Error(`Second call deduped=${data2.deduped}, expected true`);
  });

  // 5. Balance Check
  await check('GET /credits/summary (Balance Check)', async () => {
    const res = await fetch(`${BASE_URL}/credits/summary`, {
      headers: { ...headers }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data: any = await res.json();
    
    // Check structure
    if (typeof data.balance !== 'string') throw new Error('Missing balance field');
    if (typeof data.userId !== 'string') throw new Error('Missing userId field');
    
    console.log(`   (Balance: ${data.balance})`);
  });

  // 6. Pagination Check
  await check('GET /credits/transactions (Pagination)', async () => {
    // Fetch page 1
    const res1 = await fetch(`${BASE_URL}/credits/transactions?limit=1`, {
      headers: { ...headers }
    });
    if (res1.status !== 200) throw new Error(`Page 1 failed: ${res1.status}`);
    const data1: any = await res1.json();
    
    // 修复：结构应为 items/nextCursor/hasMore (data1.items 而不是 data1.data)
    if (!Array.isArray(data1.items)) throw new Error('data1.items is not array');
    if (data1.items.length === 0) {
      console.log('   (Skipping pagination logic check - no transactions)');
      return;
    }
    
    const cursor = data1.nextCursor;
    if (!cursor) {
      console.log('   (No nextCursor returned, maybe only 1 item)');
      return;
    }

    // Fetch page 2 using cursor
    const res2 = await fetch(`${BASE_URL}/credits/transactions?limit=1&cursor=${cursor}`, {
      headers: { ...headers }
    });
    if (res2.status !== 200) throw new Error(`Page 2 failed: ${res2.status}`);
    const data2: any = await res2.json();
    
    if (!Array.isArray(data2.items)) throw new Error('data2.items is not array');
    // 修复：使用 eventUid 校验 (data.items[0].eventUid)
    if (data2.items.length > 0 && data1.items[0].eventUid === data2.items[0].eventUid) {
       throw new Error('Page 1 and Page 2 returned same first item despite cursor');
    }
  });

  // 7. Rate Limit Check
  await check('Rate Limit Triggering', async () => {
    const maxTries = Number(process.env.SMOKE_RATE_LIMIT_MAX_TRIES) || 30;
    const expectRateLimit = process.env.SMOKE_EXPECT_RATE_LIMIT === 'true';
    let triggered = false;

    console.log(`(Max ${maxTries} tries)`); // 单独一行输出

    for (let i = 0; i < maxTries; i++) {
      const res = await fetch(`${BASE_URL}/credits/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          eventUid: `smoke-rl-${Date.now()}-${i}`,
          type: 'EARN',
          amount: '1',
          title: 'Rate Limit Test',
          occurredAt: new Date().toISOString(),
          source: 'SMOKE_TEST'
        })
      });

      if (res.status === 401) {
        throw new Error('401 Unauthorized during rate limit test - Token invalid?');
      }

      if (res.status === 429) {
        triggered = true;
        const retryHeader = res.headers.get('retry-after');
        
        let body: any;
        try {
          body = await res.json();
        } catch (e) {
          throw new Error('429 response body is not valid JSON');
        }
        
        if (!retryHeader) throw new Error('Missing Retry-After header');
        if (typeof body.retryAfterSeconds !== 'number') throw new Error('Missing body.retryAfterSeconds');
        break;
      }
    }

    if (!triggered) {
      if (expectRateLimit) {
        throw new Error(`Rate limit NOT triggered after ${maxTries} requests`);
      } else {
        console.warn(`(Warning: Limit not hit)`); 
        return; 
      }
    }
  });

  // v0.6 Tests: Whitelist & Revocation (Requires ADMIN_TOKEN)
  if (ADMIN_TOKEN) {
    console.log('\n[v0.6 Pilot Tests]');

    // Helper: Issue Token via Admin API
    const issueToken = async (userId: string, ttl: number = 300) => {
      const res = await fetch(`${BASE_URL}/admin/users/issue-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': ADMIN_TOKEN },
        body: JSON.stringify({ userId, ttlSeconds: ttl })
      });
      if (res.status !== 200) throw new Error(`Admin issue-token failed: ${res.status}`);
      const data: any = await res.json();
      return data.token;
    };

    // Helper: Revoke Token via Admin API
    const revokeToken = async (userId: string) => {
      const res = await fetch(`${BASE_URL}/admin/users/revoke-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': ADMIN_TOKEN },
        body: JSON.stringify({ userId }) // Default: now
      });
      if (res.status !== 200) throw new Error(`Admin revoke-token failed: ${res.status}`);
    };

    // 8. Whitelist Check
    await check('Whitelist Enforcement (Intruder -> 403)', async () => {
      const intruderToken = await issueToken('intruder');
      const res = await fetch(`${BASE_URL}/credits/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${intruderToken}` 
        },
        body: JSON.stringify({
          eventUid: `intruder-${Date.now()}`,
          type: 'EARN',
          amount: '1',
          title: 'Intrusion Attempt',
          occurredAt: new Date().toISOString(),
          source: 'SMOKE_TEST'
        })
      });
      
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for non-whitelisted user, got ${res.status}`);
      }
    });

    // 9. Revocation Flow
    await check('Token Revocation (Revoke -> 401 -> Re-issue -> 200)', async () => {
      // 1. Revoke current SMOKE_USER
      await revokeToken(SMOKE_USER);

      // 2. Verify Old Token is invalid
      const res1 = await fetch(`${BASE_URL}/credits/summary`, {
        headers: { ...headers }
      });
      if (res1.status !== 401) {
        throw new Error(`Expected 401 after revocation, got ${res1.status}`);
      }

      // 3. Issue New Token
      const newToken = await issueToken(SMOKE_USER);
      
      // 4. Verify New Token works
      const res2 = await fetch(`${BASE_URL}/credits/summary`, {
        headers: { 'Authorization': `Bearer ${newToken}` }
      });
      if (res2.status !== 200) {
        throw new Error(`Expected 200 with new token, got ${res2.status}`);
      }
    });
  } else {
    console.log('\n⚠️  Skipping v0.6 Tests (ADMIN_TOKEN not set)');
  }

  console.log('\n✨ All Smoke Tests Passed!');
}

smokeTest().catch(e => {
  console.error('Fatal Error:', e);
  process.exit(1);
});
