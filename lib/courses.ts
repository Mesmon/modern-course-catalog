import clientPromise from '@/lib/mongodb';
import { fetchCourseList, fetchCourseDetail } from '@/lib/scraper';
import { CourseDetail } from '@/types/course';

export interface Course {
  id: string;
  name: string;
  activeIn: string;
}

export async function getDepartmentCoursesFromDB(dept: string, degree: string, year: string, semester: string): Promise<any[]> {
  const client = await clientPromise;
  const db = client.db('course_catalog');
  const collection = db.collection('courses');

  const coursesCursor = await collection.find({
    id: { $regex: `^${dept}\\.` }
  });
  const existingCourses = await coursesCursor.toArray();

  if (existingCourses.length > 0) {
    return existingCourses.map(c => {
      const { _id, ...rest } = c;
      return rest;
    });
  }

  console.log(`Department ${dept} courses not found in DB, scraping...`);
  const scrapedCourses = await fetchCourseList(dept, degree, year, semester);

  if (scrapedCourses && scrapedCourses.length > 0) {
    const coursesToInsert = scrapedCourses.map((c: any) => ({
      ...c,
      lastUpdated: new Date()
    }));
    for (const course of coursesToInsert) {
      await collection.updateOne(
        { id: course.id },
        { $set: course },
        { upsert: true }
      );
    }
  }

  return scrapedCourses;
}

export async function getCourseDetailFromDB(id: string, dept: string, degree: string, year: string, semester: string): Promise<CourseDetail | null> {
  const client = await clientPromise;
  const db = client.db('course_catalog');
  const collection = db.collection('course_details');

  const existingCourse = await collection.findOne({ id, year, semester });
  
  if (existingCourse && Array.isArray(existingCourse.relatedCourses)) {
    const { _id, ...rest } = existingCourse;
    return rest as CourseDetail;
  }

  console.log(`Course ${id} not found complete in DB, scraping...`);
  try {
    const courseDetail = await fetchCourseDetail({
      courseId: id,
      dept,
      degree,
      year,
      semester,
    });

    if (courseDetail) {
      await collection.updateOne(
        { id, year, semester },
        { 
          $set: {
            ...courseDetail,
            year,
            semester,
            lastUpdated: new Date()
          }
        },
        { upsert: true }
      );
    }
    return courseDetail;
  } catch (err) {
    console.error(`Failed to fetch course details for ${id}`, err);
    return null;
  }
}
