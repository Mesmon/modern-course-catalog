import { getCatalogDb } from '@/lib/mongodb';
import { fetchCourseList, fetchCourseDetail, fetchDepartments } from '@/lib/scraper';
import { CourseDetail } from '@/types/course';

export interface CourseOfferingSummary {
  year: string;
  semester: string;
  activeIn: string;
  name: string;
}

export interface Course {
  id: string;
  name: string;
  activeIn: string;
  lastUpdated?: string;
  offerings?: CourseOfferingSummary[];
  params?: {
    dept?: string;
    degree?: string;
    course?: string;
    year?: string;
    semester?: string;
  };
}

export interface DepartmentItem {
  id: string;
  name: string;
}

export const COURSE_STALE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (1 full day)

const ALL_COURSES_MEMORY_TTL_MS = 60 * 1000; // 60 seconds hot RAM cache
const COURSE_DETAIL_MEMORY_TTL_MS = 2 * 60 * 1000; // 2 minutes hot RAM cache
const DEPARTMENTS_MEMORY_TTL_MS = 60 * 60 * 1000; // 1 hour hot RAM cache
const DEPARTMENTS_DB_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours DB sync TTL
const MAX_DETAIL_CACHE_ENTRIES = 250;

interface CatalogRuntimeStore {
  allCoursesCache: { data: Course[]; expiresAt: number } | null;
  departmentsCache: { data: DepartmentItem[]; expiresAt: number } | null;
  courseDetailCache: Map<string, { data: CourseDetail; expiresAt: number }>;
  memoryCourses: Map<string, any>;
  memoryCourseDetails: Map<string, any>;
}

const globalForCatalog = globalThis as typeof globalThis & {
  _bguCatalogRuntimeStore?: CatalogRuntimeStore;
};

function getRuntimeStore(): CatalogRuntimeStore {
  if (!globalForCatalog._bguCatalogRuntimeStore) {
    globalForCatalog._bguCatalogRuntimeStore = {
      allCoursesCache: null,
      departmentsCache: null,
      courseDetailCache: new Map(),
      memoryCourses: new Map(),
      memoryCourseDetails: new Map(),
    };
  }
  return globalForCatalog._bguCatalogRuntimeStore;
}

export function invalidateAllCoursesCache() {
  getRuntimeStore().allCoursesCache = null;
}

function setCourseDetailCache(key: string, data: CourseDetail) {
  const store = getRuntimeStore();
  if (store.courseDetailCache.size >= MAX_DETAIL_CACHE_ENTRIES) {
    const oldestKey = store.courseDetailCache.keys().next().value;
    if (oldestKey) store.courseDetailCache.delete(oldestKey);
  }
  store.courseDetailCache.set(key, {
    data,
    expiresAt: Date.now() + COURSE_DETAIL_MEMORY_TTL_MS,
  });
}

export function isCourseTimestampStale(lastUpdated?: string | Date | null): boolean {
  if (!lastUpdated) return false;
  const ts = new Date(lastUpdated).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts >= COURSE_STALE_TTL_MS;
}

export async function getDepartmentsFromDB(options?: {
  forceRefresh?: boolean;
}): Promise<DepartmentItem[]> {
  const store = getRuntimeStore();
  const nowMs = Date.now();

  if (!options?.forceRefresh && store.departmentsCache && store.departmentsCache.expiresAt > nowMs) {
    return store.departmentsCache.data;
  }

  const db = await getCatalogDb();

  if (db && !options?.forceRefresh) {
    try {
      const metaCollection = db.collection('metadata');
      const deptMeta = await metaCollection.findOne(
        { type: 'departments_sync' },
        { projection: { _id: 0, lastSync: 1 } }
      );

      if (deptMeta?.lastSync && nowMs - new Date(deptMeta.lastSync).getTime() <= DEPARTMENTS_DB_TTL_MS) {
        const departments = (await db
          .collection('departments')
          .find({}, { projection: { _id: 0, id: 1, name: 1 } })
          .toArray()) as unknown as DepartmentItem[];

        if (departments.length > 0) {
          store.departmentsCache = {
            data: departments,
            expiresAt: nowMs + DEPARTMENTS_MEMORY_TTL_MS,
          };
          return departments;
        }
      }
    } catch (err) {
      console.error('Failed reading departments from DB, falling back to scraper:', err);
    }
  }

  const departments = await fetchDepartments();
  store.departmentsCache = {
    data: departments,
    expiresAt: Date.now() + DEPARTMENTS_MEMORY_TTL_MS,
  };

  if (db && departments.length > 0) {
    const syncTime = new Date();
    void (async () => {
      try {
        const collection = db.collection('departments');
        await collection.deleteMany({});
        await collection.insertMany(departments.map((d) => ({ ...d })));
        await db
          .collection('metadata')
          .updateOne(
            { type: 'departments_sync' },
            { $set: { lastSync: syncTime } },
            { upsert: true }
          );
      } catch (err) {
        console.error('Background departments DB persist failed:', err);
      }
    })();
  }

  return departments;
}

export async function getAllCoursesFromDB(options?: {
  forceRefresh?: boolean;
}): Promise<Course[]> {
  const store = getRuntimeStore();
  const nowMs = Date.now();

  if (!options?.forceRefresh && store.allCoursesCache && store.allCoursesCache.expiresAt > nowMs) {
    return store.allCoursesCache.data;
  }

  const db = await getCatalogDb();
  let rawCourses: any[] = [];

  if (db) {
    rawCourses = await db
      .collection('courses')
      .find(
        {},
        {
          projection: {
            _id: 0,
            id: 1,
            name: 1,
            activeIn: 1,
            offerings: 1,
            lastUpdated: 1,
            params: 1,
          },
        }
      )
      .toArray();
  } else {
    rawCourses = Array.from(store.memoryCourses.values());
  }

  const formattedCourses: Course[] = [];
  for (let i = 0; i < rawCourses.length; i++) {
    const c = rawCourses[i];
    const validOfferings = Array.isArray(c.offerings)
      ? c.offerings.filter((o: any) => Number(o.year) >= 2027)
      : [];
    const activeYear = Number(String(c.activeIn || '').split('-')[0]);
    if (validOfferings.length === 0 && activeYear > 0 && activeYear < 2027) {
      continue;
    }
    formattedCourses.push({
      id: c.id,
      name: c.name,
      offerings: validOfferings,
      activeIn: validOfferings[0]?.activeIn || c.activeIn,
      lastUpdated: c.lastUpdated ? new Date(c.lastUpdated).toISOString() : undefined,
      ...(c.params ? { params: c.params } : {}),
    });
  }

  store.allCoursesCache = {
    data: formattedCourses,
    expiresAt: Date.now() + ALL_COURSES_MEMORY_TTL_MS,
  };

  return formattedCourses;
}

export async function getDepartmentCoursesFromDB(
  dept: string,
  degree: string,
  year: string,
  semester: string
): Promise<any[]> {
  const store = getRuntimeStore();
  const db = await getCatalogDb();
  const prefix = `${dept}.${degree}.`;

  let existingCourses: any[] = [];
  if (db) {
    existingCourses = await db
      .collection('courses')
      .find(
        { id: { $regex: `^${dept}\\.${degree}\\.` } },
        { projection: { _id: 0, id: 1, name: 1, activeIn: 1, offerings: 1, lastUpdated: 1 } }
      )
      .toArray();
  } else {
    store.memoryCourses.forEach((c) => {
      if (typeof c.id === 'string' && c.id.startsWith(prefix)) {
        existingCourses.push(c);
      }
    });
  }

  if (existingCourses.length > 0) {
    const hasHistory = existingCourses.some((c) => c.offerings && c.offerings.length > 0);
    const maxScrapedYear = existingCourses.reduce((max, c) => {
      const courseMax = (c.offerings || []).reduce(
        (m: number, o: any) => Math.max(m, parseInt(o.year, 10) || 0),
        0
      );
      return Math.max(max, courseMax);
    }, 0);
    const requestedYearNum = parseInt(year, 10) || 2027;

    // If we have history for this department & degree and it covers up to the requested year, return from DB
    if (hasHistory && maxScrapedYear >= requestedYearNum) {
      const filtered = existingCourses
        .map((c) => {
          const offering = c.offerings?.find((o: any) => o.year === year && o.semester === semester);
          if (offering) {
            return {
              id: c.id,
              name: offering.name,
              activeIn: offering.activeIn,
              lastUpdated: c.lastUpdated ? new Date(c.lastUpdated).toISOString() : undefined,
            };
          }
          return null;
        })
        .filter(Boolean);

      return (filtered as any[]).sort((a, b) => b.activeIn.localeCompare(a.activeIn));
    }
  }

  console.log(
    `Department ${dept} (degree ${degree}) courses not found for ${year}-${semester} or history missing, scraping from 2027...`
  );
  const currentYear = Math.max(parseInt(year, 10) || 2027, 2027);
  const yearsToScrape: number[] = [];
  for (let y = currentYear; y >= 2027; y--) {
    yearsToScrape.push(y);
  }
  const semestersToScrape = ['1', '2', '3']; // 1: Fall, 2: Spring, 3: Summer

  const courseMap = new Map<string, any>();

  // Initialize map with existing courses to preserve older history
  existingCourses.forEach((c) => {
    courseMap.set(c.id, {
      ...c,
      offerings: c.offerings ? [...c.offerings] : [],
    });
  });

  // Fetch all terms concurrently for maximum speed
  const fetchPromises = [];
  for (const yr of yearsToScrape) {
    for (const sem of semestersToScrape) {
      fetchPromises.push(
        fetchCourseList(dept, degree, yr.toString(), sem)
          .then((scraped) => ({ yr: yr.toString(), sem, scraped }))
          .catch((err) => {
            console.error(
              `Failed to scrape ${dept} (degree ${degree}) for year ${yr} semester ${sem}`,
              err
            );
            return { yr: yr.toString(), sem, scraped: [] };
          })
      );
    }
  }

  const results = await Promise.all(fetchPromises);

  results.forEach(({ yr, sem, scraped }) => {
    if (scraped && scraped.length > 0) {
      scraped.forEach((c) => {
        if (!courseMap.has(c.id)) {
          courseMap.set(c.id, {
            id: c.id,
            name: c.name,
            activeIn: c.activeIn,
            offerings: [],
            lastUpdated: new Date(),
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
            name: c.name,
          });
        }
      });
    }
  });

  const finalCourses = Array.from(courseMap.values());

  if (finalCourses.length > 0) {
    finalCourses.forEach((course) => {
      if (course.offerings) {
        course.offerings.sort((a: any, b: any) => b.activeIn.localeCompare(a.activeIn));
      }
      const { _id, ...rest } = course;
      store.memoryCourses.set(course.id, rest);
    });
    invalidateAllCoursesCache();

    if (db) {
      const bulkOps = finalCourses.map((course) => {
        const { _id, ...rest } = course;
        return {
          updateOne: {
            filter: { id: course.id },
            update: { $set: rest },
            upsert: true,
          },
        };
      });
      await db.collection('courses').bulkWrite(bulkOps);
    }
  }

  const filtered = finalCourses
    .map((c) => {
      const offering = c.offerings?.find((o: any) => o.year === year && o.semester === semester);
      if (offering) {
        return {
          id: c.id,
          name: offering.name,
          activeIn: offering.activeIn,
          lastUpdated: c.lastUpdated ? new Date(c.lastUpdated).toISOString() : undefined,
        };
      }
      return null;
    })
    .filter(Boolean);

  return (filtered as any[]).sort((a, b) => b.activeIn.localeCompare(a.activeIn));
}

export async function getCourseDetailFromDB(
  id: string,
  dept: string,
  degree: string,
  year: string,
  semester: string,
  options?: { forceRefresh?: boolean }
): Promise<CourseDetail | null> {
  const store = getRuntimeStore();
  const fullId = `${dept}.${degree}.${id}`;
  const forceRefresh = Boolean(options?.forceRefresh);
  const cacheKey = `${fullId}:${year}:${semester}`;

  if (!forceRefresh) {
    const cached = store.courseDetailCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        ...cached.data,
        isStale: isCourseTimestampStale(cached.data.lastUpdated),
      };
    }
  }

  const db = await getCatalogDb();

  let existingCourse: any = null;
  let baseCourse: any = null;
  let forwardBlocksRaw: any[] = [];

  if (db) {
    const collection = db.collection('course_details');
    const coursesCollection = db.collection('courses');

    // Run all 3 MongoDB lookups concurrently instead of 4 sequential roundtrips
    const [detailCandidates, foundBaseCourse, foundForwardBlocks] = await Promise.all([
      collection
        .find({ id: { $in: [fullId, id] }, year, semester })
        .toArray(),
      coursesCollection.findOne(
        { id: { $in: [fullId, id] } },
        { projection: { _id: 0, id: 1, offerings: 1, lastUpdated: 1 } }
      ),
      collection
        .find(
          { 'relatedCourses.id': { $in: [fullId, id] } },
          { projection: { _id: 0, id: 1, name: 1, relatedCourses: 1, year: 1, semester: 1 } }
        )
        .toArray(),
    ]);

    const exactNamed = detailCandidates.find((d) => d.id === fullId && d.name);
    const shortNamed = detailCandidates.find((d) => d.id === id && d.name);
    existingCourse =
      exactNamed ||
      shortNamed ||
      detailCandidates.find((d) => d.id === fullId) ||
      detailCandidates[0] ||
      null;

    baseCourse = foundBaseCourse;
    forwardBlocksRaw = foundForwardBlocks;
  } else {
    existingCourse =
      store.memoryCourseDetails.get(`${fullId}:${year}:${semester}`) ||
      store.memoryCourseDetails.get(`${id}:${year}:${semester}`) ||
      null;
    baseCourse = store.memoryCourses.get(fullId) || store.memoryCourses.get(id) || null;
    store.memoryCourseDetails.forEach((doc) => {
      if (
        Array.isArray(doc.relatedCourses) &&
        doc.relatedCourses.some((rc: any) => rc.id === fullId || rc.id === id)
      ) {
        forwardBlocksRaw.push(doc);
      }
    });
  }

  const offerings = (baseCourse?.offerings || []).filter((o: any) => Number(o.year) >= 2027);

  if (offerings.length > 0 && !forceRefresh) {
    const requestedExists = offerings.some((o: any) => o.year === year && o.semester === semester);
    if (!requestedExists) {
      const latest = offerings[0];
      if (latest.year !== year || latest.semester !== semester) {
        console.log(
          `Course ${id} not found for ${year}-${semester}, routing to latest offering: ${latest.year}-${latest.semester}`
        );
        return getCourseDetailFromDB(id, dept, degree, latest.year, latest.semester);
      }
    }
  }

  const blockedCourses = forwardBlocksRaw.map((fb) => {
    const relationInfo = fb.relatedCourses.find((rc: any) => rc.id === fullId || rc.id === id);
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
      },
    };
  });

  if (
    !forceRefresh &&
    existingCourse &&
    Array.isArray(existingCourse.relatedCourses) &&
    Array.isArray(existingCourse.groups)
  ) {
    const { _id, ...rest } = existingCourse;
    const rawTs = existingCourse.lastUpdated || baseCourse?.lastUpdated;
    const lastUpdated = rawTs ? new Date(rawTs).toISOString() : undefined;
    const isStale = isCourseTimestampStale(lastUpdated);
    const result = {
      ...rest,
      offerings,
      blockedCourses,
      lastUpdated,
      isStale,
    } as CourseDetail;
    setCourseDetailCache(cacheKey, result);
    return result;
  }

  console.log(
    forceRefresh
      ? `Force refetching course ${fullId} (${year}-${semester}) from BGU4U...`
      : `Course ${id} not found complete in DB, scraping...`
  );
  try {
    const courseDetail = await fetchCourseDetail({
      courseId: id,
      dept,
      degree,
      year,
      semester,
    });

    if (courseDetail && courseDetail.name) {
      const now = new Date();
      const nowIso = now.toISOString();

      const persistedDoc = {
        ...courseDetail,
        year,
        semester,
        lastUpdated: now,
      };
      store.memoryCourseDetails.set(`${courseDetail.id}:${year}:${semester}`, persistedDoc);
      store.memoryCourseDetails.set(cacheKey, persistedDoc);

      if (store.memoryCourses.has(fullId)) {
        store.memoryCourses.set(fullId, {
          ...store.memoryCourses.get(fullId),
          lastUpdated: now,
        });
      }
      invalidateAllCoursesCache();

      if (db) {
        await Promise.all([
          db
            .collection('course_details')
            .updateOne({ id: courseDetail.id, year, semester }, { $set: persistedDoc }, { upsert: true }),
          db
            .collection('courses')
            .updateOne({ id: fullId }, { $set: { lastUpdated: now } }),
        ]);
      }

      courseDetail.offerings = offerings;
      courseDetail.year = year;
      courseDetail.semester = semester;
      courseDetail.blockedCourses = blockedCourses;
      courseDetail.lastUpdated = nowIso;
      courseDetail.isStale = false;
      setCourseDetailCache(cacheKey, courseDetail);
      return courseDetail;
    }

    // Fallback to existingCourse if scrape returned empty while force-refreshing
    if (existingCourse) {
      const { _id, ...rest } = existingCourse;
      const rawTs = existingCourse.lastUpdated || baseCourse?.lastUpdated;
      const lastUpdated = rawTs ? new Date(rawTs).toISOString() : undefined;
      return {
        ...rest,
        offerings,
        blockedCourses,
        lastUpdated,
        isStale: isCourseTimestampStale(lastUpdated),
      } as CourseDetail;
    }

    return courseDetail;
  } catch (err) {
    console.error(`Failed to fetch course details for ${id}`, err);
    if (existingCourse) {
      const { _id, ...rest } = existingCourse;
      const rawTs = existingCourse.lastUpdated || baseCourse?.lastUpdated;
      const lastUpdated = rawTs ? new Date(rawTs).toISOString() : undefined;
      return {
        ...rest,
        offerings,
        blockedCourses,
        lastUpdated,
        isStale: isCourseTimestampStale(lastUpdated),
      } as CourseDetail;
    }
    return null;
  }
}
