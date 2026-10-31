import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

const ALLOWED_AVATAR_HOST_RE = /^https:\/\/[a-z0-9-]+\.googleusercontent\.com\//i;

export async function GET(request: NextRequest) {
  const paramUrl = request.nextUrl.searchParams.get('u');
  let targetUrl: string | undefined;

  if (paramUrl && ALLOWED_AVATAR_HOST_RE.test(paramUrl)) {
    targetUrl = paramUrl;
  } else {
    const session = await getServerSession();
    if (session?.picture && ALLOWED_AVATAR_HOST_RE.test(session.picture)) {
      targetUrl = session.picture;
    }
  }

  if (!targetUrl) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      referrerPolicy: 'no-referrer',
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return new NextResponse(null, { status: 415 });
    }

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
