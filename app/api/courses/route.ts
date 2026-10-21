import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('course_catalog');
    const collection = db.collection('courses');

    // Return what's in DB
    const coursesCursor = await collection.find({});
    const courses = await coursesCursor.toArray();
    
    // Map internal _id away, and keep only 2027+ offerings/courses
    const formattedCourses = courses
      .map(c => {
        const { _id, ...rest } = c;
        const validOfferings = Array.isArray(rest.offerings)
          ? rest.offerings.filter((o: any) => Number(o.year) >= 2027)
          : [];
        const activeYear = Number(String(rest.activeIn || '').split('-')[0]);
        if (validOfferings.length === 0 && activeYear > 0 && activeYear < 2027) {
          return null;
        }
        return {
          ...rest,
          offerings: validOfferings,
          activeIn: validOfferings[0]?.activeIn || rest.activeIn,
        };
      })
      .filter(Boolean);

    return NextResponse.json(formattedCourses);
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
