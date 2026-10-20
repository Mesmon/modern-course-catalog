import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import {
  ALLOWED_GOOGLE_DOMAIN,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  getGoogleOAuthConfig,
  isAllowedBguEmail,
  signSessionToken,
} from '@/lib/auth';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const stateParam = request.nextUrl.searchParams.get('state');
  const errorParam = request.nextUrl.searchParams.get('error');

  let returnTo = '/';
  let stateNonce = '';

  if (stateParam) {
    try {
      const parsed = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'));
      if (parsed.returnTo && typeof parsed.returnTo === 'string' && parsed.returnTo.startsWith('/')) {
        returnTo = parsed.returnTo;
      }
      if (parsed.nonce) {
        stateNonce = parsed.nonce;
      }
    } catch {
      // ignore malformed state
    }
  }

  const redirectWithError = (errCode: string) => {
    const url = new URL(returnTo, request.nextUrl.origin);
    url.searchParams.set('authError', errCode);
    const res = NextResponse.redirect(url);
    res.cookies.delete('bgu_oauth_nonce');
    return res;
  };

  if (errorParam || !code) {
    return redirectWithError('oauth_cancelled');
  }

  const cookieNonce = request.cookies.get('bgu_oauth_nonce')?.value;
  if (cookieNonce && stateNonce && cookieNonce !== stateNonce) {
    return redirectWithError('state_mismatch');
  }

  const { clientId, clientSecret } = getGoogleOAuthConfig();
  if (!clientId || !clientSecret) {
    return redirectWithError('missing_config');
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text());
      return redirectWithError('token_exchange_failed');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return redirectWithError('userinfo_failed');
    }

    const profile = await userRes.json();
    const email = (profile.email || '').trim().toLowerCase();
    const hd = (profile.hd || '').trim().toLowerCase();

    if (!profile.email_verified || !isAllowedBguEmail(email, hd)) {
      return redirectWithError('invalid_domain');
    }

    const sessionUser = {
      sub: String(profile.sub || email),
      email,
      name: profile.name || email.split('@')[0],
      picture: profile.picture || undefined,
      hd: ALLOWED_GOOGLE_DOMAIN,
    };

    // Upsert user metadata in MongoDB
    try {
      const client = await clientPromise;
      const db = client.db('course_catalog');
      await db.collection('user_profiles').updateOne(
        { email },
        {
          $set: {
            email,
            sub: sessionUser.sub,
            name: sessionUser.name,
            picture: sessionUser.picture,
            lastLoginAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (dbErr) {
      console.error('Failed to upsert user profile on login:', dbErr);
    }

    const sessionToken = signSessionToken(sessionUser);
    const successUrl = new URL(returnTo, request.nextUrl.origin);
    successUrl.searchParams.set('authSuccess', '1');

    const response = NextResponse.redirect(successUrl);
    response.cookies.delete('bgu_oauth_nonce');
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return redirectWithError('server_error');
  }
}
