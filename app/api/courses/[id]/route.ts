import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { fetchCourseDetail } from '@/lib/scraper';

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

    const client = await clientPromise;
    const db = client.db('course_catalog');
    const collection = db.collection('course_details');

    // Check DB first
    const existingCourse = await collection.findOne({ id, year, semester });
    
    if (existingCourse) {
      const { _id, ...rest } = existingCourse;
      return NextResponse.json(rest);
    }

    // Fallback to scraping
    console.log(`Course ${id} not found in DB, scraping...`);
    const courseDetail = await fetchCourseDetail({
      courseId: id,
      dept,
      degree,
      year,
      semester,
    });

    if (courseDetail) {
      // Save to DB
      await collection.insertOne({
        ...courseDetail,
        year,
        semester,
        lastUpdated: new Date()
      });
    }

    return NextResponse.json(courseDetail);
  } catch (error) {
    console.error('Failed to fetch course detail:', error);
    return NextResponse.json({ error: 'Failed to fetch course detail' }, { status: 500 });
  }
}
