import { NextResponse } from 'next/server';
import { getGoogleOAuthConfig, getServerSession, ALLOWED_GOOGLE_DOMAIN } from '@/lib/auth';

export async function GET() {
  const user = await getServerSession();
  const { clientId, hasClientSecret, isConfigured } = getGoogleOAuthConfig();

  return NextResponse.json({
    user,
    oauth: {
      clientId: clientId || null,
      hasClientSecret,
      isConfigured,
      allowedDomain: ALLOWED_GOOGLE_DOMAIN,
    },
  });
}
