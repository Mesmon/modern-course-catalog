import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { fetchCourseList } from '@/lib/scraper';

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

    const client = await clientPromise;
    const db = client.db('course_catalog');
    const collection = db.collection('courses');

    // Check if we have courses for this department in DB
    // A course id typically starts with the department id + '.' (e.g. 202.1.1234)
    const coursesCursor = await collection.find({
      id: { $regex: `^${dept}\\.` }
    });
    const existingCourses = await coursesCursor.toArray();

    if (existingCourses.length > 0) {
      // Return from DB
      const formattedCourses = existingCourses.map(c => {
        const { _id, ...rest } = c;
        return rest;
      });
      return NextResponse.json(formattedCourses);
    }

    // Fallback to scraping
    console.log(`Department ${dept} courses not found in DB, scraping...`);
    const scrapedCourses = await fetchCourseList(dept, degree, year, semester);

    if (scrapedCourses && scrapedCourses.length > 0) {
      // Save newly scraped courses to DB
      const coursesToInsert = scrapedCourses.map((c: any) => ({
        ...c,
        lastUpdated: new Date()
      }));
      // Insert dynamically, ignoring duplicates if they somehow exist
      for (const course of coursesToInsert) {
        await collection.updateOne(
          { id: course.id },
          { $set: course },
          { upsert: true }
        );
      }
    }

    return NextResponse.json(scrapedCourses);
  } catch (error) {
    console.error('Failed to fetch department courses:', error);
    return NextResponse.json({ error: 'Failed to fetch department courses' }, { status: 500 });
  }
}
