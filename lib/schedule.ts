import { CourseGroup } from '@/types/course';

export interface ScheduledCourse {
  id: string;        // fullId e.g. '232.1.1011'
  courseId: string;  // shortId e.g. '1011'
  dept: string;
  degree: string;
  year: string;
  semester: string;
  name: string;
  points: string;
  colorIndex: number;
  selectedGroups: CourseGroup[];
  allGroups: CourseGroup[];
}

export interface ScheduleTerm {
  year: string;
  semester: string;
}

export const SCHEDULE_STORAGE_KEY = 'weeklyScheduleCourses_v1';
export const SCHEDULE_TERM_KEY = 'weeklyScheduleActiveTerm_v1';
export const SCHEDULE_EVENT = 'weekly-schedule-updated';

export const COURSE_COLOR_PALETTE = [
  {
    bg: 'bg-blue-500/15 dark:bg-blue-500/25',
    border: 'border-blue-500/50 dark:border-blue-400/50',
    text: 'text-blue-950 dark:text-blue-100',
    badge: 'bg-blue-600 text-white',
    accent: 'bg-blue-500',
  },
  {
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    border: 'border-emerald-500/50 dark:border-emerald-400/50',
    text: 'text-emerald-950 dark:text-emerald-100',
    badge: 'bg-emerald-600 text-white',
    accent: 'bg-emerald-500',
  },
  {
    bg: 'bg-purple-500/15 dark:bg-purple-500/25',
    border: 'border-purple-500/50 dark:border-purple-400/50',
    text: 'text-purple-950 dark:text-purple-100',
    badge: 'bg-purple-600 text-white',
    accent: 'bg-purple-500',
  },
  {
    bg: 'bg-amber-500/15 dark:bg-amber-500/25',
    border: 'border-amber-500/50 dark:border-amber-400/50',
    text: 'text-amber-950 dark:text-amber-100',
    badge: 'bg-amber-600 text-white',
    accent: 'bg-amber-500',
  },
  {
    bg: 'bg-rose-500/15 dark:bg-rose-500/25',
    border: 'border-rose-500/50 dark:border-rose-400/50',
    text: 'text-rose-950 dark:text-rose-100',
    badge: 'bg-rose-600 text-white',
    accent: 'bg-rose-500',
  },
  {
    bg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
    border: 'border-cyan-500/50 dark:border-cyan-400/50',
    text: 'text-cyan-950 dark:text-cyan-100',
    badge: 'bg-cyan-600 text-white',
    accent: 'bg-cyan-500',
  },
  {
    bg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
    border: 'border-indigo-500/50 dark:border-indigo-400/50',
    text: 'text-indigo-950 dark:text-indigo-100',
    badge: 'bg-indigo-600 text-white',
    accent: 'bg-indigo-500',
  },
  {
    bg: 'bg-teal-500/15 dark:bg-teal-500/25',
    border: 'border-teal-500/50 dark:border-teal-400/50',
    text: 'text-teal-950 dark:text-teal-100',
    badge: 'bg-teal-600 text-white',
    accent: 'bg-teal-500',
  },
];

export function loadActiveTerm(): ScheduleTerm {
  if (typeof window === 'undefined') return { year: '2027', semester: '1' };
  try {
    const raw = localStorage.getItem(SCHEDULE_TERM_KEY);
    if (!raw) return { year: '2027', semester: '1' };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.year && parsed.semester) {
      return { year: String(parsed.year), semester: String(parsed.semester) };
    }
    return { year: '2027', semester: '1' };
  } catch (e) {
    return { year: '2027', semester: '1' };
  }
}

export function saveActiveTerm(term: ScheduleTerm) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCHEDULE_TERM_KEY, JSON.stringify(term));
    window.dispatchEvent(new Event(SCHEDULE_EVENT));
  } catch (e) {
    console.error('Failed to save active schedule term', e);
  }
}

export function loadScheduledCourses(): ScheduledCourse[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load schedule from localStorage', e);
    return [];
  }
}

export function saveScheduledCourses(courses: ScheduledCourse[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(courses));
    window.dispatchEvent(new Event(SCHEDULE_EVENT));
  } catch (e) {
    console.error('Failed to save schedule to localStorage', e);
  }
}

export function upsertScheduledCourse(course: Omit<ScheduledCourse, 'colorIndex'> & { colorIndex?: number }): ScheduledCourse[] {
  const current = loadScheduledCourses();
  const existingIdx = current.findIndex(
    c => c.id === course.id && c.year === course.year && c.semester === course.semester
  );
  let updated: ScheduledCourse[];

  if (existingIdx >= 0) {
    const existingColor = current[existingIdx].colorIndex;
    updated = [...current];
    updated[existingIdx] = {
      ...course,
      colorIndex: course.colorIndex ?? existingColor,
    };
  } else {
    const termCourses = current.filter(
      c => c.year === course.year && c.semester === course.semester
    );
    const usedColors = new Set(termCourses.map(c => c.colorIndex));
    let nextColor = 0;
    for (let i = 0; i < COURSE_COLOR_PALETTE.length; i++) {
      if (!usedColors.has(i)) {
        nextColor = i;
        break;
      }
    }
    if (usedColors.has(nextColor)) {
      nextColor = termCourses.length % COURSE_COLOR_PALETTE.length;
    }
    updated = [
      ...current,
      {
        ...course,
        colorIndex: course.colorIndex ?? nextColor,
      },
    ];
  }

  saveScheduledCourses(updated);
  return updated;
}

export function removeScheduledCourse(id: string, year?: string, semester?: string): ScheduledCourse[] {
  const current = loadScheduledCourses();
  const updated = current.filter(c => {
    if (c.id !== id) return true;
    if (year && semester) {
      return !(c.year === year && c.semester === semester);
    }
    return false;
  });
  saveScheduledCourses(updated);
  return updated;
}

export function clearScheduledCoursesForTerm(year: string, semester: string): ScheduledCourse[] {
  const current = loadScheduledCourses();
  const updated = current.filter(c => !(c.year === year && c.semester === semester));
  saveScheduledCourses(updated);
  return updated;
}

export function isCourseOfferedInTerm(course: any, year: string, semester: string): boolean {
  if (Array.isArray(course.offerings) && course.offerings.length > 0) {
    return course.offerings.some(
      (o: any) => String(o.year) === String(year) && String(o.semester) === String(semester)
    );
  }
  if (course.activeIn) {
    return course.activeIn === `${year}-${semester}`;
  }
  if (course.params?.year && course.params?.semester) {
    return String(course.params.year) === String(year) && String(course.params.semester) === String(semester);
  }
  return false;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
