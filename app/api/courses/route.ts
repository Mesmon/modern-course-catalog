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
