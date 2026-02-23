import { NextResponse } from 'next/server';
import { getDepartmentCoursesFromDB } from '@/lib/courses';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ dept: string }> }
) {
  try {
    const { dept } = await params;
    const { searchParams } = new URL(req.url);
    const degree = searchParams.get('degree') || '1';
    const year = searchParams.get('year') || '2026';
    const semester = searchParams.get('semester') || '2';

    const courses = await getDepartmentCoursesFromDB(dept, degree, year, semester);
    
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Failed to fetch department courses:', error);
    return NextResponse.json({ error: 'Failed to fetch department courses' }, { status: 500 });
  }
}
