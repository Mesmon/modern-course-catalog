import { NextResponse } from 'next/server';
import { getDepartmentCoursesFromDB } from '@/lib/courses';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ dept: string }> }
) {
  try {
    const { dept } = await params;
    const { searchParams } = new URL(req.url);
    const degreeParam = searchParams.get('degree');
    const year = searchParams.get('year') || '2027';
    const semester = searchParams.get('semester') || '1';

    if (!degreeParam || degreeParam === 'all') {
      const [deg1Courses, deg2Courses] = await Promise.all([
        getDepartmentCoursesFromDB(dept, '1', year, semester),
        getDepartmentCoursesFromDB(dept, '2', year, semester),
      ]);
      const combined = [...deg1Courses, ...deg2Courses];
      return NextResponse.json(combined);
    }

    const courses = await getDepartmentCoursesFromDB(dept, degreeParam, year, semester);
    
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Failed to fetch department courses:', error);
    return NextResponse.json({ error: 'Failed to fetch department courses' }, { status: 500 });
  }
}
