import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ALLOWED_GOOGLE_DOMAIN, getGoogleOAuthConfig } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { clientId, hasClientSecret } = getGoogleOAuthConfig();
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/';

  if (!clientId || !hasClientSecret) {
    const fallbackUrl = new URL(returnTo, request.nextUrl.origin);
    fallbackUrl.searchParams.set('authError', 'missing_config');
    return NextResponse.redirect(fallbackUrl);
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/google`;
  const nonce = crypto.randomBytes(16).toString('hex');
  const statePayload = Buffer.from(
    JSON.stringify({ nonce, returnTo })
  ).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    hd: ALLOWED_GOOGLE_DOMAIN,
    prompt: 'select_account',
    access_type: 'online',
    state: statePayload,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  const response = NextResponse.redirect(googleAuthUrl);

  response.cookies.set('bgu_oauth_nonce', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  });

  return response;
}
