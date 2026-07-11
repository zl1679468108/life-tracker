/**
 * 签名 token 工具
 *
 * 用途：为邮箱验证、密码重置等流程生成带 HMAC 签名的 token，防止伪造。
 *
 * 规则：
 *   token = base64url(payload) + "." + base64url(hmac_sha256(payload, secret))
 *   验证时重新计算 hmac 并与 token 中的签名比对，同时校验 exp 和 type。
 *
 * 密钥来源：优先使用 AUTH_TOKEN_SECRET 环境变量，回退到 SUPABASE_SERVICE_ROLE_KEY，
 *   避免现有部署因缺少新环境变量而无法工作。
 */
import { createHmac, timingSafeEqual } from 'crypto';

function getSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('AUTH_TOKEN_SECRET 或 SUPABASE_SERVICE_ROLE_KEY 未配置，无法签发 token');
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string): string {
  const secret = getSecret();
  const sig = createHmac('sha256', secret).update(payload).digest();
  return base64url(sig);
}

export interface TokenPayload {
  userId: string;
  email?: string;
  type: 'signup' | 'reset';
  exp: number;
}

/**
 * 签发带签名的 token
 */
export function signToken(payload: Omit<TokenPayload, 'exp'>, ttlMs: number): string {
  const fullPayload: TokenPayload = { ...payload, exp: Date.now() + ttlMs };
  const payloadStr = base64url(JSON.stringify(fullPayload));
  return `${payloadStr}.${sign(payloadStr)}`;
}

/**
 * 验证 token 签名与有效期，返回 payload；失败抛出 Error
 */
export function verifyToken(token: string, expectedType: TokenPayload['type']): TokenPayload {
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('无效的验证链接');
  }
  const [payloadStr, sigStr] = parts;

  // 使用 timingSafeEqual 比对签名，避免时序攻击
  const expectedSig = sign(payloadStr);
  const sigBuffer = Buffer.from(sigStr);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('无效的验证链接');
  }

  let decoded: TokenPayload;
  try {
    decoded = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
  } catch {
    throw new Error('无效的验证链接');
  }

  if (decoded.type !== expectedType) {
    throw new Error('无效的验证链接');
  }
  if (decoded.exp < Date.now()) {
    throw new Error(expectedType === 'signup' ? '验证链接已过期' : '重置链接已过期');
  }
  return decoded;
}
