import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ALLOWED_GOOGLE_DOMAIN = 'post.bgu.ac.il';
export const SESSION_COOKIE_NAME = 'bgu_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  hd?: string;
}

interface SessionPayload extends SessionUser {
  iat: number;
  exp: number;
}

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    'bgu-course-catalog-session-secret-2027'
  );
}

export function getGoogleOAuthConfig() {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    isConfigured: Boolean(clientId.trim()),
    hasClientSecret: Boolean(clientId.trim() && clientSecret.trim()),
  };
}

export function isAllowedBguEmail(email?: string | null, hd?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  if (parts.length !== 2 || !parts[0]) return false;
  if (parts[1] !== ALLOWED_GOOGLE_DOMAIN) return false;
  if (hd && hd.trim().toLowerCase() !== ALLOWED_GOOGLE_DOMAIN) return false;
  return true;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padLength = (4 - (input.length % 4)) % 4;
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signSessionToken(user: SessionUser): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: user.sub,
    email: user.email.trim().toLowerCase(),
    name: user.name,
    picture: user.picture,
    hd: ALLOWED_GOOGLE_DOMAIN,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };
  const headerB64 = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', getAuthSecret()).update(data).digest()
  );
  return `${data}.${signature}`;
}

export function verifySessionToken(token?: string | null): SessionUser | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expectedSig = base64UrlEncode(
      crypto.createHmac('sha256', getAuthSecret()).update(data).digest()
    );
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload: SessionPayload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return null;
    if (!isAllowedBguEmail(payload.email, payload.hd)) return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      hd: payload.hd,
    };
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}
