// Script to generate a JWT token for smoke testing
// Usage: export JWT_SECRET="your_secret" && node scripts/generate-token.ts

const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 16) {
  console.error('Error: JWT_SECRET environment variable is required and must be at least 16 chars.');
  process.exit(1);
}

const payload = {
  userId: process.env.SMOKE_USER || 'smoke-tester'
};

// 保持与后端 JwtUtil 一致：仅 userId 校验
// 可选支持 TTL, Issuer 等（如果后端未来开启校验，这里需要对齐）
const options = {
  expiresIn: process.env.TOKEN_TTL || '10m', // 默认 10 分钟
  // issuer: 'credits-ledger', // 目前后端未强制校验 issuer
};

try {
  const token = jwt.sign(payload, secret, options);
  console.log(`export SMOKE_TOKEN="${token}"`);
} catch (e) {
  console.error('Failed to generate token:', e);
  process.exit(1);
}
