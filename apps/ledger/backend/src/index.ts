import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { CreditService } from './services/credit.service';
import { JwtUtil } from './utils/jwt.util';
import { rateLimit } from './utils/rate-limit';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// v0.6 Whitelist Config
const writeWhitelist = process.env.WRITE_ENABLED_USERS 
  ? new Set(process.env.WRITE_ENABLED_USERS.split(',').map(u => u.trim()).filter(Boolean)) 
  : null;

// 严格 CORS 配置
const corsOriginEnv = process.env.CORS_ORIGIN;
const isProd = process.env.NODE_ENV === 'production';

let originConfig: string[] | boolean;

if (corsOriginEnv) {
  // 支持逗号分隔并 trim，过滤空字符串
  const origins = corsOriginEnv.split(',').map(o => o.trim()).filter(Boolean);
  if (origins.length === 0) {
    if (isProd) throw new Error('FATAL: CORS_ORIGIN is set but empty in production');
    originConfig = true;
  } else {
    originConfig = origins;
  }
} else {
  if (isProd) {
    // 生产环境强制要求配置 CORS_ORIGIN
    throw new Error('FATAL: CORS_ORIGIN is required in production');
  }
  originConfig = true; // 开发环境默认允许所有
}

// 生产环境必要变量 Fail-Fast 检查
if (isProd) {
  const missingEnvs: string[] = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    missingEnvs.push('JWT_SECRET (must be >= 16 chars)');
  }
  if (!process.env.CORS_ORIGIN) {
    missingEnvs.push('CORS_ORIGIN');
  }
  if (!process.env.DATABASE_URL) {
    missingEnvs.push('DATABASE_URL');
  }

  if (missingEnvs.length > 0) {
    console.error('FATAL: Missing required environment variables in production:');
    missingEnvs.forEach(e => console.error(`  - ${e}`));
    console.error('\nExamples to fix:');
    console.error('  Docker Run: -e JWT_SECRET="s3cr3t..." -e CORS_ORIGIN="http://example.com" -e DATABASE_URL="..."');
    console.error('  Compose: Ensure .env file has these variables or set in environment section.');
    process.exit(1);
  }
}

fastify.register(cors, {
  origin: originConfig,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Admin-Token'],
});

// 鉴权 Middleware (必须先注册)
fastify.addHook('preHandler', async (request, reply) => {
  const isProd = process.env.NODE_ENV === 'production';
  const url = request.url;

  // 1. Admin 接口校验 (仅限 /admin/*)
  if (url.startsWith('/admin')) {
    const adminToken = request.headers['x-admin-token'];
    if (typeof adminToken !== 'string' || adminToken !== process.env.ADMIN_TOKEN) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Invalid Admin Token' });
    }
    return;
  }

  // 2. 业务接口校验 (/credits/*)
  if (url.startsWith('/credits')) {
    let userId: string | null = null;

    // A. 解析 Authorization Header (大小写不敏感，多空格处理)
    const authHeader = request.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.trim() !== '') {
      const parts = authHeader.split(/\s+/);
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        const token = parts[1];
        const payload = JwtUtil.verify(token);
        
        // 严格校验 userId 类型 (必须为非空字符串)
        if (payload && typeof payload.userId === 'string' && payload.userId.trim() !== '') {
          const validUserId = payload.userId.trim();
          userId = validUserId;
          
          // v0.6 Revocation Check
          if (payload.iat) {
             const userAuth = await prisma.userAuth.findUnique({ where: { user_id: validUserId } });
             if (userAuth && userAuth.token_revoked_before) {
               const revokedSeconds = Math.floor(userAuth.token_revoked_before.getTime() / 1000);
               if (payload.iat < revokedSeconds) {
                 return reply.status(401).send({ error: 'Unauthorized', message: 'Token revoked' });
               }
             }
          }
        } else {
          return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
        }
      } else {
        // Scheme 错误：只要提供了 Authorization 且不是 Bearer，就直接报错
        return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid authorization scheme (expected Bearer)' });
      }
    }

    // B. 向后兼容: 仅在非生产环境且无 Authorization 时尝试使用 X-User-Id
    if (!userId && !isProd) {
      const xUserId = request.headers['x-user-id'];
      // 严格校验 X-User-Id 类型 (必须为非空字符串，避免数组/undefined 误用)
      if (typeof xUserId === 'string' && xUserId.trim() !== '') {
        userId = xUserId.trim();
      }
    }

    // C. 最终校验
    if (!userId) {
      const msg = isProd ? 'JWT token required' : 'JWT token or X-User-Id required';
      return reply.status(401).send({ error: 'Unauthorized', message: msg });
    }

    (request as any).userId = userId;
  }
});

// v0.6 Whitelist Enforcement Hook
fastify.addHook('preHandler', async (request, reply) => {
  const method = request.method;
  const path = request.url.split('?')[0];

  if (method === 'POST' && path === '/credits/events') {
    const userId = (request as any).userId;
    if (writeWhitelist && userId && !writeWhitelist.has(userId)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'User not in pilot whitelist' });
    }
  }
});

// v0.4 功能 0: 限流保护 (写接口) - 必须在鉴权后执行
fastify.addHook('preHandler', async (request, reply) => {
  const method = request.method;
  const path = request.url.split('?')[0];

  // 仅限流写操作 (POST)
  if (method !== 'POST') return;

  let limit = Number(process.env.RATE_LIMIT_MAX_REQ) || 60;
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
  let key = '';

  // 1. 业务写接口 /credits/events
  if (path === '/credits/events') {
    const userId = (request as any).userId;
    // 修复：仅当鉴权通过且 userId 有效时才限流
    if (typeof userId === 'string' && userId.trim() !== '') {
      key = `user:${userId.trim()}`;
    } else {
      // 防御式兜底：若无有效 userId，强制返回 401
      const isProd = process.env.NODE_ENV === 'production';
      return reply.status(401).send({ 
        error: 'Unauthorized', 
        message: isProd ? 'JWT token required' : 'JWT token or X-User-Id required' 
      });
    }
  }
  
  // 2. Admin 写接口 (覆盖所有 admin 相关写操作)
  else if (path.startsWith('/credits/adjustments') || path.startsWith('/admin/')) {
    limit = Number(process.env.ADMIN_RATE_LIMIT_MAX_REQ) || 120;
    key = 'admin:global'; // 简单起见，Admin 全局限流
  }

  if (key) {
    const allowed = rateLimit(key, limit, windowMs);
    if (!allowed) {
      reply.header('Retry-After', Math.ceil(windowMs / 1000));
      return reply.status(429).send({ 
        error: 'Too Many Requests', 
        retryAfterMs: windowMs,
        retryAfterSeconds: Math.ceil(windowMs / 1000)
      });
    }
  }
});

// Admin GET 审计接口限流
fastify.addHook('preHandler', async (request, reply) => {
  const path = request.url.split('?')[0];
  if (request.method === 'GET' && path.startsWith('/admin/credits/audit')) {
    const limit = Number(process.env.ADMIN_RATE_LIMIT_MAX_REQ) || 120;
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
    const allowed = rateLimit('admin:audit', limit, windowMs);
    if (!allowed) {
      reply.header('Retry-After', Math.ceil(windowMs / 1000));
      return reply.status(429).send({ error: 'Too Many Requests', retryAfterMs: windowMs });
    }
  }
});

// v0.4 功能 0: 健康检查 (P0)
fastify.get('/healthz', async () => {
  return { ok: true };
});

fastify.get('/readyz', async (request, reply) => {
  try {
    // 轻量 DB 检查
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (e: any) {
    const msg = e.message || String(e);
    let reason = 'db_unreachable';
    
    // P1001: Can't reach database server
    // ECONNREFUSED / ENOTFOUND usually imply network/dns issues
    if (msg.includes('P1001') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      reason = 'db_unreachable';
    } 
    // P1003: Database does not exist
    // P1010: User denied access
    // P1000: Authentication failed
    else if (msg.includes('P1003') || msg.includes('P1010') || msg.includes('P1000')) {
      reason = 'db_auth_or_db_missing';
    }
    // P4002: The schema of the database does not match the Prisma schema (rarely thrown on queryRaw, but possible on other queries)
    // Table not found usually P2010 or P2021
    else if (msg.includes('P2010') || msg.includes('P2021')) {
      reason = 'db_schema_not_ready';
    }

    request.log.error({ err: e }, `Readiness check failed: ${reason}`);
    return reply.status(503).send({ ok: false, reason });
  }
});

// v0.4 辅助功能: 开发登录 (生产环境永远禁用)
fastify.post('/auth/dev-login', async (request: any, reply) => {
  const isProd = process.env.NODE_ENV === 'production';
  const allowDevLogin = process.env.ALLOW_DEV_LOGIN === 'true';
  
  // 生产环境默认禁用，除非显式开启 ALLOW_DEV_LOGIN
  if (isProd && !allowDevLogin) {
    return reply.status(404).send({ error: 'Not Found' });
  }

  const { userId } = request.body;
  if (typeof userId !== 'string' || userId.trim() === '') {
    return reply.status(400).send({ error: 'Missing userId' });
  }

  const trimmedId = userId.trim();
  const expiresInSeconds = 3600;
  const token = JwtUtil.sign({ userId: trimmedId }, expiresInSeconds);
  
  return { 
    accessToken: token, 
    tokenType: 'Bearer',
    expiresInSeconds
  };
});

// v0.6 Admin: Revoke Token
fastify.post('/admin/users/revoke-token', async (request: any, reply) => {
  // Auth checked by global hook
  const { userId, revokedBefore } = request.body;
  if (!userId) return reply.status(400).send({ error: 'Missing userId' });

  const date = revokedBefore ? new Date(revokedBefore) : new Date();
  await prisma.userAuth.upsert({
    where: { user_id: userId },
    update: { token_revoked_before: date },
    create: { user_id: userId, token_revoked_before: date }
  });
  return { success: true, revokedBefore: date.toISOString() };
});

// v0.6 Admin: Issue Token
fastify.post('/admin/users/issue-token', async (request: any, reply) => {
  const { userId, ttlSeconds = 3600 } = request.body;
  if (!userId) return reply.status(400).send({ error: 'Missing userId' });

  const token = JwtUtil.sign({ userId }, ttlSeconds);
  return { token, userId, ttlSeconds };
});

// 1. 获取汇总 - 统一 CamelCase + BigInt String
fastify.get('/credits/summary', async (request) => {
  const userId = (request as any).userId;
  const summary = await prisma.creditBalance.findUnique({
    where: { user_id_currency: { user_id: userId, currency: 'CREDIT' } }
  });

  return {
    userId: userId,
    currency: summary?.currency || 'CREDIT',
    balance: (summary?.balance ?? 0n).toString(),
    earnedTotal: (summary?.earned_total ?? 0n).toString(),
    spentTotal: (summary?.spent_total ?? 0n).toString(),
    updatedAt: summary?.updated_at?.toISOString() || new Date().toISOString()
  };
});

// 2. 流水查询 - 增强校验与默认过滤
fastify.get('/credits/transactions', async (request: any, reply) => {
  const userId = request.userId;
  const { limit = 20, cursor } = request.query;
  
  const limitNum = Number(limit);
  if (isNaN(limitNum) || limitNum <= 0) return reply.status(400).send({ error: 'Invalid limit' });
  const take = Math.min(limitNum, 50);

  let where: any = { user_id: userId, status: 'VALID' };

  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString();
      const parts = decoded.split('|');
      if (parts.length !== 2) throw new Error();
      const [occ, uid] = parts;
      const occDate = new Date(occ);
      if (isNaN(occDate.getTime())) throw new Error();

      where = { ...where, OR: [
        { occurred_at: { lt: occDate } },
        { occurred_at: { equals: occDate }, event_uid: { lt: uid } }
      ]};
    } catch (e) {
      return reply.status(400).send({ error: 'Invalid cursor' });
    }
  }

  const items = await prisma.creditEvent.findMany({
    where, take: take + 1,
    orderBy: [{ occurred_at: 'desc' }, { event_uid: 'desc' }]
  });

  const hasMore = items.length > take;
  const resultItems = hasMore ? items.slice(0, -1) : items;
  let nextCursor = hasMore ? Buffer.from(`${resultItems[resultItems.length - 1].occurred_at.toISOString()}|${resultItems[resultItems.length - 1].event_uid}`).toString('base64') : null;

  return {
    items: resultItems.map(e => ({
      eventUid: e.event_uid, source: e.source, type: e.type,
      amount: e.amount.toString(), currency: e.currency, title: e.title,
      occurredAt: e.occurred_at.toISOString()
    })),
    nextCursor, hasMore
  };
});

// v0.4 功能 1: 对外标准写入接口
fastify.post('/credits/events', async (request: any, reply) => {
  const userId = request.userId;
  const { eventUid, source, type, amount, title, occurredAt, currency = 'CREDIT' } = request.body;

  // 1. 严格校验
  if (!eventUid || typeof eventUid !== 'string') return reply.status(400).send({ error: 'Invalid eventUid' });
  if (!['EARN', 'SPEND', 'ADJUST'].includes(type)) return reply.status(400).send({ error: 'Invalid type' });
  
  let amountBigInt: bigint;
  try {
    amountBigInt = BigInt(amount);
  } catch (e) {
    return reply.status(400).send({ error: 'Invalid amount' });
  }

  if (type === 'EARN' && amountBigInt <= 0n) return reply.status(400).send({ error: 'EARN amount must be > 0' });
  if (type === 'SPEND' && amountBigInt >= 0n) return reply.status(400).send({ error: 'SPEND amount must be < 0' });
  if (type === 'ADJUST' && amountBigInt === 0n) return reply.status(400).send({ error: 'ADJUST amount must not be 0' });

  const occDate = new Date(occurredAt);
  if (isNaN(occDate.getTime())) return reply.status(400).send({ error: 'Invalid occurredAt' });

  // 2. 调用 Service
  const result = await CreditService.appendEvent({
    event_uid: eventUid,
    source,
    user_id: userId,
    type: type as any,
    amount: amountBigInt,
    title,
    occurred_at: occDate
  });

  if (result.deduped) {
    return { deduped: true, eventUid };
  }

  // 使用强制类型转换或显式判空以通过 TS 校验
  const successResult = result as { event: any; balance: any };
  return {
    deduped: false,
    balanceAfter: successResult.balance?.balance.toString(),
    eventUid: successResult.event?.event_uid
  };
});

// v0.4 功能 2: 修账接口 (Admin)
fastify.post('/credits/adjustments', async (request: any, reply) => {
  // 修账接口现在统一由 preHandler 里的 /admin 逻辑保护
  if (request.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const { userId, targetEventUid, amount, reason, occurredAt } = request.body;
  if (!userId) return reply.status(400).send({ error: 'Missing userId' });

  let amountBigInt: bigint;
  try {
    amountBigInt = BigInt(amount);
  } catch (e) {
    return reply.status(400).send({ error: 'Invalid amount' });
  }

  const occDate = occurredAt ? new Date(occurredAt) : new Date();
  const eventUid = 'adjust-' + (targetEventUid || 'manual') + '-' + Date.now();

  const result = await CreditService.appendEvent({
    event_uid: eventUid,
    source: 'admin-adjustment',
    user_id: userId,
    type: 'ADJUST',
    amount: amountBigInt,
    title: reason || 'Admin adjustment',
    occurred_at: occDate
  });

  const successResult = result as { balance: any };
  return {
    success: true,
    adjustEventUid: eventUid,
    balanceAfter: successResult.balance?.balance.toString()
  };
});

// v0.4 功能 3: 对账与健康检查 (Admin)
fastify.get('/admin/credits/audit', async (request: any, reply) => {
  const userId = request.query.userId;
  if (!userId) return reply.status(400).send({ error: 'Missing userId' });

  // 1. 查询所有 VALID events
  const events = await prisma.creditEvent.findMany({
    where: { user_id: userId, status: 'VALID' }
  });

  let eventsSum = 0n;
  let earnedFromEvents = 0n;
  let spentFromEvents = 0n;
  let lastEventAt: Date | null = null;

  for (const e of events) {
    eventsSum += e.amount;
    if (e.type === 'EARN' || (e.type === 'ADJUST' && e.amount > 0n)) {
      earnedFromEvents += e.amount;
    } else if (e.type === 'SPEND' || (e.type === 'ADJUST' && e.amount < 0n)) {
      spentFromEvents += e.amount < 0n ? -e.amount : 0n;
    }
    if (!lastEventAt || e.occurred_at > lastEventAt) {
      lastEventAt = e.occurred_at;
    }
  }

  // 2. 查询聚合表
  const balanceTable = await prisma.creditBalance.findUnique({
    where: { user_id_currency: { user_id: userId, currency: 'CREDIT' } }
  });

  const tableBalance = balanceTable?.balance ?? 0n;
  const tableEarned = balanceTable?.earned_total ?? 0n;
  const tableSpent = balanceTable?.spent_total ?? 0n;

  const consistent = 
    eventsSum === tableBalance && 
    earnedFromEvents === tableEarned && 
    spentFromEvents === tableSpent;

  if (!consistent) {
    return {
      userId,
      consistent: false,
      diff: (eventsSum - tableBalance).toString(),
      suggestion: 'Run recompute(userId)'
    };
  }

  return {
    userId,
    consistent: true,
    eventsSum: eventsSum.toString(),
    balanceTable: tableBalance.toString(),
    earnedFromEvents: earnedFromEvents.toString(),
    spentFromEvents: spentFromEvents.toString(),
    lastEventAt: lastEventAt?.toISOString()
  };
});

// 管理接口：重算
fastify.post('/admin/credits/recompute', async (request: any, reply) => {
  const { userId } = request.body;
  const result = await CreditService.recompute(userId);
  return {
    success: true,
    summary: {
      userId: result.user_id,
      balance: result.balance.toString(),
      earnedTotal: result.earned_total.toString(),
      spentTotal: result.spent_total.toString()
    }
  };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log('Server listening on port ' + port);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
