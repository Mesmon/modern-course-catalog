import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { fetchDepartments } from '@/lib/scraper';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('course_catalog');
    const collection = db.collection('departments');

    // Check if we have departments and how old they are
    const metaCollection = db.collection('metadata');
    const deptMeta = await metaCollection.findOne({ type: 'departments_sync' });
    
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    let departments;
    
    if (!deptMeta || (now.getTime() - new Date(deptMeta.lastSync).getTime() > oneDay)) {
      console.log('Fetching fresh departments from BGU...');
      departments = await fetchDepartments();
      
      // Update DB in background/concurrently
      await collection.deleteMany({});
      await collection.insertMany(departments);
      await metaCollection.updateOne(
        { type: 'departments_sync' },
        { $set: { lastSync: now } },
        { upsert: true }
      );
    } else {
      const cursor = await collection.find({});
      departments = await cursor.toArray();
      // Clean up internal _id
      departments = departments.map(({ _id, ...rest }) => rest);
    }

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}
