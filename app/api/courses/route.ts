import { NextResponse } from 'next/server';
import { getAllCoursesFromDB } from '@/lib/courses';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === '1';
    const courses = await getAllCoursesFromDB({ forceRefresh });

    return NextResponse.json(courses, {
      headers: {
        'Cache-Control': forceRefresh
          ? 'no-cache'
          : 'public, max-age=0, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
