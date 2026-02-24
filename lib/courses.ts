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
    const hasHistory = existingCourses.some(c => c.offerings && c.offerings.length > 0);
    // If we have history for this department, we don't need to rescrape even if this specific term is empty
    if (hasHistory) {
      const filtered = existingCourses.map(c => {
        const offering = c.offerings?.find((o: any) => o.year === year && o.semester === semester);
        if (offering) {
          return {
            id: c.id,
            name: offering.name,
            activeIn: offering.activeIn,
          };
        }
        return null;
      }).filter(Boolean);

      return (filtered as any[]).sort((a, b) => b.activeIn.localeCompare(a.activeIn));
    }
  }

  console.log(`Department ${dept} courses not found for ${year}-${semester} or history missing, scraping last 4 years...`);
  const currentYear = parseInt(year, 10) || new Date().getFullYear();
  const yearsToScrape = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  const semestersToScrape = ['1', '2', '3']; // 1: Fall, 2: Spring, 3: Summer
  
  const courseMap = new Map<string, any>();

  // Initialize map with existing courses to preserve older history
  existingCourses.forEach(c => {
    courseMap.set(c.id, {
      ...c,
      offerings: c.offerings || []
    });
  });

  // Fetch all terms concurrently for maximum speed
  const fetchPromises = [];
  for (const yr of yearsToScrape) {
    for (const sem of semestersToScrape) {
      fetchPromises.push(
        fetchCourseList(dept, degree, yr.toString(), sem)
          .then(scraped => ({ yr: yr.toString(), sem, scraped }))
          .catch(err => {
            console.error(`Failed to scrape ${dept} for year ${yr} semester ${sem}`, err);
            return { yr: yr.toString(), sem, scraped: [] };
          })
      );
    }
  }

  const results = await Promise.all(fetchPromises);

  results.forEach(({ yr, sem, scraped }) => {
    if (scraped && scraped.length > 0) {
      scraped.forEach(c => {
        if (!courseMap.has(c.id)) {
          courseMap.set(c.id, { 
            id: c.id, 
            name: c.name,
            activeIn: c.activeIn,
            offerings: [],
            lastUpdated: new Date()
          });
        }
        const course = courseMap.get(c.id);
        // Update latest name/activeIn if newer (just to keep high-level course meta fresh)
        if (c.activeIn.localeCompare(course.activeIn || '') > 0) {
          course.name = c.name;
          course.activeIn = c.activeIn;
          course.lastUpdated = new Date();
        }
        // Add offering if it doesn't exist
        const exists = course.offerings.some((o: any) => o.year === yr && o.semester === sem);
        if (!exists) {
           course.offerings.push({
             year: yr,
             semester: sem,
             activeIn: c.activeIn,
             name: c.name
           });
        }
      });
    }
  });

  const finalCourses = Array.from(courseMap.values());
  
  if (finalCourses.length > 0) {
    const bulkOps = finalCourses.map(course => {
      // Sort offerings by activeIn descending
      if (course.offerings) {
        course.offerings.sort((a: any, b: any) => b.activeIn.localeCompare(a.activeIn));
      }
      const { _id, ...rest } = course;
      return {
        updateOne: {
          filter: { id: course.id },
          update: { $set: rest },
          upsert: true
        }
      };
    });
    await collection.bulkWrite(bulkOps);
  }

  const filtered = finalCourses.map(c => {
    const offering = c.offerings?.find((o: any) => o.year === year && o.semester === semester);
    if (offering) {
      return {
        id: c.id,
        name: offering.name,
        activeIn: offering.activeIn,
      };
    }
    return null;
  }).filter(Boolean);

  return (filtered as any[]).sort((a, b) => b.activeIn.localeCompare(a.activeIn));
}

export async function getCourseDetailFromDB(id: string, dept: string, degree: string, year: string, semester: string): Promise<CourseDetail | null> {
  const client = await clientPromise;
  const db = client.db('course_catalog');
  const collection = db.collection('course_details');

  const fullId = `${dept}.${degree}.${id}`;
  
  // Try full ID first
  let existingCourse = await collection.findOne({ id: fullId, year, semester });
  
  // If not found or empty name (failed scrape), fallback to short ID
  if (!existingCourse || !existingCourse.name) {
    const fallback = await collection.findOne({ id, year, semester });
    if (fallback && fallback.name) {
      existingCourse = fallback;
    } else if (!existingCourse) {
      existingCourse = fallback; // Keep it if both are flawed but one exists, prevents hard crashes later
    }
  }
  
  // Sometimes id is already the full id, sometimes it's just the course part
  const baseCourse = await db.collection('courses').findOne({ 
    $or: [{ id: fullId }, { id: id }] 
  });
  const offerings = baseCourse?.offerings || [];

  if (offerings.length > 0) {
    const requestedExists = offerings.some((o: any) => o.year === year && o.semester === semester);
    if (!requestedExists) {
      const latest = offerings[0];
      if (latest.year !== year || latest.semester !== semester) {
        console.log(`Course ${id} not found for ${year}-${semester}, routing to latest offering: ${latest.year}-${latest.semester}`);
        return getCourseDetailFromDB(id, dept, degree, latest.year, latest.semester);
      }
    }
  }

  // Look up what courses this course blocks (Forward Prerequisites)
  const forwardBlocksCursor = await collection.find({
    "relatedCourses.id": id
  }, {
    projection: { id: 1, name: 1, relatedCourses: 1, year: 1, semester: 1 }
  });
  
  const forwardBlocksRaw = await forwardBlocksCursor.toArray();
  const blockedCourses = forwardBlocksRaw.map(fb => {
    // find the specific relation they have to us
    const relationInfo = fb.relatedCourses.find((rc: any) => rc.id === id);
    const parts = fb.id.split('.');
    return {
      id: parts[2] || fb.id,
      name: fb.name,
      relation: relationInfo?.relation || 'Unknown',
      params: {
        dept: parts[0] || dept,
        degree: parts[1] || degree,
        course: parts[2] || fb.id,
        year: fb.year || year,
        semester: fb.semester || semester,
      }
    };
  });
  
  if (existingCourse && Array.isArray(existingCourse.relatedCourses)) {
    const { _id, ...rest } = existingCourse;
    return { ...rest, offerings, blockedCourses } as CourseDetail;
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
        { id: courseDetail.id, year, semester },
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
      courseDetail.offerings = offerings;
      courseDetail.year = year;
      courseDetail.semester = semester;
      courseDetail.blockedCourses = blockedCourses;
    }
    return courseDetail;
  } catch (err) {
    console.error(`Failed to fetch course details for ${id}`, err);
    return null;
  }
}
