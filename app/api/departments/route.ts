import { NextResponse } from 'next/server';
import { getDepartmentsFromDB } from '@/lib/courses';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === '1';
    const departments = await getDepartmentsFromDB({ forceRefresh });

    return NextResponse.json(departments, {
      headers: {
        'Cache-Control': forceRefresh
          ? 'no-cache'
          : 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}
