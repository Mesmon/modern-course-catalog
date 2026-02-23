import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAllCourses } from '@/lib/courses';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('course_catalog');
    const collection = db.collection('courses');

    // If the database is empty, fallback to the local JSON scraping data
    const count = await collection.countDocuments();
    if (count === 0) {
      console.log('MongoDB collection empty, falling back to local JSON data...');
      const fallbackCourses = getAllCourses(); // synchronous JSON reading
      if (fallbackCourses.length > 0) {
        // Option to add a 'lastUpdated' field to periodically invalidate/re-scrape
        const coursesToInsert = fallbackCourses.map(c => ({
          ...c,
          lastUpdated: new Date()
        }));
        await collection.insertMany(coursesToInsert);
      }
      return NextResponse.json(fallbackCourses);
    }

    // Every once in a while, we could check if data in DB is too old compared to JSON/scraping
    // For now, return what's in DB
    const coursesCursor = await collection.find({});
    const courses = await coursesCursor.toArray();
    
    // Map internal _id away, preserving the original string 'id'
    const formattedCourses = courses.map(c => {
      const { _id, ...rest } = c;
      return rest;
    });

    return NextResponse.json(formattedCourses);
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
