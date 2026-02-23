import { NextResponse } from 'next/server';
import { getCourseDetailFromDB } from '@/lib/courses';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get('dept') || '202';
    const degree = searchParams.get('degree') || '1';
    const year = searchParams.get('year') || '2026';
    const semester = searchParams.get('semester') || '2';

    const courseDetail = await getCourseDetailFromDB(id, dept, degree, year, semester);

    if (!courseDetail) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(courseDetail);
  } catch (error) {
    console.error('Failed to fetch course detail:', error);
    return NextResponse.json({ error: 'Failed to fetch course detail' }, { status: 500 });
  }
}
