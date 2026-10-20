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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, accessToken } = body || {};
    const { clientId } = getGoogleOAuthConfig();

    let email = '';
    let hd = '';
    let name = '';
    let picture = '';
    let sub = '';
    let emailVerified = false;

    if (credential) {
      // Verify Google ID token via Google's official tokeninfo endpoint
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (!verifyRes.ok) {
        return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
      }
      const tokenInfo = await verifyRes.json();
      if (clientId && tokenInfo.aud !== clientId) {
        return NextResponse.json({ error: 'audience_mismatch' }, { status: 401 });
      }
      email = (tokenInfo.email || '').trim().toLowerCase();
      hd = (tokenInfo.hd || '').trim().toLowerCase();
      name = tokenInfo.name || email.split('@')[0];
      picture = tokenInfo.picture || '';
      sub = String(tokenInfo.sub || email);
      emailVerified = tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true;
    } else if (accessToken) {
      const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userRes.ok) {
        return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
      }
      const profile = await userRes.json();
      email = (profile.email || '').trim().toLowerCase();
      hd = (profile.hd || '').trim().toLowerCase();
      name = profile.name || email.split('@')[0];
      picture = profile.picture || '';
      sub = String(profile.sub || email);
      emailVerified = profile.email_verified === true || profile.email_verified === 'true';
    } else {
      return NextResponse.json({ error: 'missing_credentials' }, { status: 400 });
    }

    if (!emailVerified || !isAllowedBguEmail(email, hd)) {
      return NextResponse.json(
        {
          error: 'invalid_domain',
          message: `Only @${ALLOWED_GOOGLE_DOMAIN} accounts are allowed.`,
        },
        { status: 403 }
      );
    }

    const sessionUser = {
      sub,
      email,
      name,
      picture: picture || undefined,
      hd: ALLOWED_GOOGLE_DOMAIN,
    };

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
      console.error('Failed to upsert user profile on verify:', dbErr);
    }

    const sessionToken = signSessionToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err) {
    console.error('Error verifying Google token:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
