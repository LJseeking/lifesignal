interface RateLimitStore {
  count: number;
  resetAt: number;
}

const stores = new Map<string, RateLimitStore>();

// 默认配置 (60秒 60次)
const DEFAULT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const CLEANUP_PROBABILITY = 0.05; // 5% 概率触发清理

/**
 * 简单的内存滑动窗口限流 (基于固定窗口重置，近似滑动)
 * O(1) 查询与更新
 * @param key 限流标识 (如 userId 或 IP)
 * @param limit 最大请求数
 * @param windowMs 窗口时间 (毫秒)
 * @returns true = 允许通过, false = 超限
 */
export function rateLimit(key: string, limit: number, windowMs: number = DEFAULT_WINDOW_MS): boolean {
  const now = Date.now();
  let record = stores.get(key);

  // 惰性清理: 每次写入时有小概率触发全量清理 (防止 Map 无限增长)
  if (Math.random() < CLEANUP_PROBABILITY) {
    cleanup(now);
  }

  // 初始化或重置窗口
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    stores.set(key, record);
    return true;
  }

  // 窗口内计数
  if (record.count < limit) {
    record.count++;
    return true;
  }

  // 超限
  return false;
}

function cleanup(now: number) {
  for (const [key, record] of stores.entries()) {
    if (now > record.resetAt) {
      stores.delete(key);
    }
  }
}
