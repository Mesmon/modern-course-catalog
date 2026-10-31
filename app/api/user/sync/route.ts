import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession, isAllowedBguEmail } from '@/lib/auth';

export async function GET() {
  const user = await getServerSession();
  if (!user || !isAllowedBguEmail(user.email, user.hd)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('course_catalog');
    const doc = await db.collection('user_profiles').findOne({ email: user.email });

    return NextResponse.json({
      email: user.email,
      schedule: doc?.schedule || null,
      dependencyMap: doc?.dependencyMap || null,
    });
  } catch (err) {
    console.error('Failed to load user sync data:', err);
    return NextResponse.json({ error: 'failed_to_load' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getServerSession();
  if (!user || !isAllowedBguEmail(user.email, user.hd)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { schedule, dependencyMap } = body || {};
    const now = new Date().toISOString();

    const setFields: Record<string, any> = {
      email: user.email,
      sub: user.sub,
      name: user.name,
      updatedAt: now,
    };

    if (schedule && typeof schedule === 'object') {
      setFields.schedule = {
        courses: Array.isArray(schedule.courses) ? schedule.courses : [],
        activeTerm:
          schedule.activeTerm && schedule.activeTerm.year && schedule.activeTerm.semester
            ? {
                year: String(schedule.activeTerm.year),
                semester: String(schedule.activeTerm.semester),
              }
            : { year: '2027', semester: '1' },
        versionsMap:
          schedule.versionsMap &&
          typeof schedule.versionsMap === 'object' &&
          !Array.isArray(schedule.versionsMap)
            ? schedule.versionsMap
            : {},
        updatedAt: now,
      };
    }

    if (dependencyMap && typeof dependencyMap === 'object') {
      setFields.dependencyMap = {
        nodes: Array.isArray(dependencyMap.nodes) ? dependencyMap.nodes : [],
        edges: Array.isArray(dependencyMap.edges) ? dependencyMap.edges : [],
        selectedRelations: Array.isArray(dependencyMap.selectedRelations)
          ? dependencyMap.selectedRelations
          : ['קורס קדם'],
        updatedAt: now,
      };
    }

    const client = await clientPromise;
    const db = client.db('course_catalog');
    await db.collection('user_profiles').updateOne(
      { email: user.email },
      {
        $set: setFields,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, updatedAt: now });
  } catch (err) {
    console.error('Failed to save user sync data:', err);
    return NextResponse.json({ error: 'failed_to_save' }, { status: 500 });
  }
}
