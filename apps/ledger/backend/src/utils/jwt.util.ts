import { createHmac, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';

// 生产环境安全检查
if (isProd) {
  if (!JWT_SECRET || JWT_SECRET.length < 16) {
    throw new Error('FATAL: JWT_SECRET must be at least 16 characters in production');
  }
}

const SECRET_BUFFER = Buffer.from(JWT_SECRET || 'dev-secret-key-12345');

/**
 * 将字符串或 Buffer 转换为 Base64URL 编码（JWT 标准）
 */
function base64UrlEncode(str: string | Buffer): string {
  return (typeof str === 'string' ? Buffer.from(str) : str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * 将 Base64URL 编码还原为普通字符串，补齐 padding
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // 补齐 padding
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString();
}

/**
 * 将 Base64URL 编码还原为 Buffer，补齐 padding
 */
function base64UrlDecodeToBuffer(str: string): Buffer {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

export class JwtUtil {
  /**
   * 签名：生成 JWT Token
   */
  static sign(payload: any, expiresInSeconds: number = 3600): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
    
    const signature = createHmac('sha256', SECRET_BUFFER)
      .update(encodedHeader + '.' + encodedPayload)
      .digest();
    
    const encodedSignature = base64UrlEncode(signature);
    
    return encodedHeader + '.' + encodedPayload + '.' + encodedSignature;
  }

  /**
   * 验证：校验 Token 有效性
   */
  static verify(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const [headerB64, payloadB64, signatureB64] = parts;

      // 1. 显式校验 Header
      const header = JSON.parse(base64UrlDecode(headerB64));
      if (header.alg !== 'HS256') return null;
      // 增强：严格校验 typ (如果存在必须是 JWT)
      if (header.typ !== undefined && header.typ !== 'JWT') return null;

      // 2. 使用 timingSafeEqual 比较签名
      const actualSignature = base64UrlDecodeToBuffer(signatureB64);
      const expectedSignature = createHmac('sha256', SECRET_BUFFER)
        .update(headerB64 + '.' + payloadB64)
        .digest();

      if (actualSignature.length !== expectedSignature.length) return null;
      if (!timingSafeEqual(actualSignature, expectedSignature)) return null;

      // 3. 校验过期时间
      const payload = JSON.parse(base64UrlDecode(payloadB64));
      const now = Math.floor(Date.now() / 1000);
      
      // 增强：仅当 exp 为 number 时才判断过期
      if (typeof payload.exp === 'number') {
        if (payload.exp <= now) {
          return null; // 到点即过期
        }
      }
      // 如果 exp 不存在或非 number，视为不过期 (Long-lived token)

      return payload;
    } catch (e) {
      return null;
    }
  }
}
