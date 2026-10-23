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
export const SCHEDULE_CLOUD_HYDRATED_EVENT = 'weekly-schedule-cloud-hydrated';

export const DEPENDENCY_MAP_NODES_KEY = 'dependencyMapNodes';
export const DEPENDENCY_MAP_EDGES_KEY = 'dependencyMapEdges';
export const DEPENDENCY_MAP_RELATIONS_KEY = 'dependencyMapRelations';
export const DEPENDENCY_MAP_EVENT = 'dependency-map-updated';
export const DEPENDENCY_MAP_CLOUD_HYDRATED_EVENT = 'dependency-map-cloud-hydrated';

export const COURSE_COLOR_PALETTE = [
  {
    bg: 'bg-emerald-50/95 dark:bg-emerald-950/35',
    border: 'border-emerald-200 dark:border-emerald-800/70 border-s-4 border-s-emerald-600 dark:border-s-emerald-500',
    text: 'text-emerald-950 dark:text-emerald-100',
    badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-200',
    codeChip: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    accent: 'bg-emerald-600',
  },
  {
    bg: 'bg-blue-50/95 dark:bg-blue-950/35',
    border: 'border-blue-200 dark:border-blue-800/70 border-s-4 border-s-blue-600 dark:border-s-blue-500',
    text: 'text-blue-950 dark:text-blue-100',
    badge: 'bg-blue-100 text-blue-900 dark:bg-blue-900/70 dark:text-blue-200',
    codeChip: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    accent: 'bg-blue-600',
  },
  {
    bg: 'bg-amber-50/95 dark:bg-amber-950/35',
    border: 'border-amber-200 dark:border-amber-800/70 border-s-4 border-s-amber-600 dark:border-s-amber-500',
    text: 'text-amber-950 dark:text-amber-100',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200',
    codeChip: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    accent: 'bg-amber-600',
  },
  {
    bg: 'bg-orange-50/95 dark:bg-orange-950/35',
    border: 'border-orange-200 dark:border-orange-800/70 border-s-4 border-s-orange-600 dark:border-s-orange-500',
    text: 'text-orange-950 dark:text-orange-100',
    badge: 'bg-orange-100 text-orange-900 dark:bg-orange-900/70 dark:text-orange-200',
    codeChip: 'bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    accent: 'bg-orange-600',
  },
  {
    bg: 'bg-teal-50/95 dark:bg-teal-950/35',
    border: 'border-teal-200 dark:border-teal-800/70 border-s-4 border-s-teal-600 dark:border-s-teal-500',
    text: 'text-teal-950 dark:text-teal-100',
    badge: 'bg-teal-100 text-teal-900 dark:bg-teal-900/70 dark:text-teal-200',
    codeChip: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    accent: 'bg-teal-600',
  },
  {
    bg: 'bg-rose-50/95 dark:bg-rose-950/35',
    border: 'border-rose-200 dark:border-rose-800/70 border-s-4 border-s-rose-600 dark:border-s-rose-500',
    text: 'text-rose-950 dark:text-rose-100',
    badge: 'bg-rose-100 text-rose-900 dark:bg-rose-900/70 dark:text-rose-200',
    codeChip: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    accent: 'bg-rose-600',
  },
  {
    bg: 'bg-sky-50/95 dark:bg-sky-950/35',
    border: 'border-sky-200 dark:border-sky-800/70 border-s-4 border-s-sky-600 dark:border-s-sky-500',
    text: 'text-sky-950 dark:text-sky-100',
    badge: 'bg-sky-100 text-sky-900 dark:bg-sky-900/70 dark:text-sky-200',
    codeChip: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    accent: 'bg-sky-600',
  },
  {
    bg: 'bg-stone-100/95 dark:bg-stone-900/60',
    border: 'border-stone-300 dark:border-stone-700 border-s-4 border-s-stone-600 dark:border-s-stone-400',
    text: 'text-stone-950 dark:text-stone-100',
    badge: 'bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-200',
    codeChip: 'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700',
    accent: 'bg-stone-600',
  },
];

export const MIN_ACADEMIC_YEAR = 2027;

/**
 * Returns academic years starting from 2027 (never before 2027).
 * Currently (in 2026) returns ['2027'].
 * In subsequent calendar years (2027+), automatically adds newer academic years.
 */
export function getAvailableAcademicYears(): string[] {
  const calYear = new Date().getFullYear();
  const maxYear = calYear >= MIN_ACADEMIC_YEAR ? calYear + 1 : MIN_ACADEMIC_YEAR;
  const years: string[] = [];
  for (let y = maxYear; y >= MIN_ACADEMIC_YEAR; y--) {
    years.push(String(y));
  }
  return years;
}

export function loadActiveTerm(): ScheduleTerm {
  if (typeof window === 'undefined') return { year: '2027', semester: '1' };
  try {
    const raw = localStorage.getItem(SCHEDULE_TERM_KEY);
    if (!raw) return { year: '2027', semester: '1' };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.year && parsed.semester) {
      const yrNum = Number(parsed.year);
      const safeYear = Number.isFinite(yrNum) && yrNum >= MIN_ACADEMIC_YEAR ? String(yrNum) : '2027';
      return { year: safeYear, semester: String(parsed.semester) };
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

export function hydrateScheduleFromCloud(courses: ScheduledCourse[], activeTerm?: ScheduleTerm) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(courses || []));
    if (activeTerm && activeTerm.year && activeTerm.semester) {
      localStorage.setItem(
        SCHEDULE_TERM_KEY,
        JSON.stringify({ year: String(activeTerm.year), semester: String(activeTerm.semester) })
      );
    }
    window.dispatchEvent(new Event(SCHEDULE_CLOUD_HYDRATED_EVENT));
  } catch (e) {
    console.error('Failed to hydrate schedule from cloud', e);
  }
}

export function loadDependencyMapStorage(): {
  nodes: any[];
  edges: any[];
  selectedRelations: string[];
} {
  if (typeof window === 'undefined') {
    return { nodes: [], edges: [], selectedRelations: ['קורס קדם'] };
  }
  try {
    const rawNodes = localStorage.getItem(DEPENDENCY_MAP_NODES_KEY);
    const rawEdges = localStorage.getItem(DEPENDENCY_MAP_EDGES_KEY);
    const rawRelations = localStorage.getItem(DEPENDENCY_MAP_RELATIONS_KEY);
    return {
      nodes: rawNodes ? JSON.parse(rawNodes) : [],
      edges: rawEdges ? JSON.parse(rawEdges) : [],
      selectedRelations: rawRelations ? JSON.parse(rawRelations) : ['קורס קדם'],
    };
  } catch (e) {
    return { nodes: [], edges: [], selectedRelations: ['קורס קדם'] };
  }
}

export function hydrateDependencyMapFromCloud(data: {
  nodes?: any[];
  edges?: any[];
  selectedRelations?: string[];
}) {
  if (typeof window === 'undefined') return;
  try {
    const nodes = Array.isArray(data.nodes) ? data.nodes : [];
    const edges = Array.isArray(data.edges) ? data.edges : [];
    const selectedRelations = Array.isArray(data.selectedRelations)
      ? data.selectedRelations
      : ['קורס קדם'];

    if (nodes.length > 0 || edges.length > 0) {
      localStorage.setItem(DEPENDENCY_MAP_NODES_KEY, JSON.stringify(nodes));
      localStorage.setItem(DEPENDENCY_MAP_EDGES_KEY, JSON.stringify(edges));
    } else {
      localStorage.removeItem(DEPENDENCY_MAP_NODES_KEY);
      localStorage.removeItem(DEPENDENCY_MAP_EDGES_KEY);
    }
    localStorage.setItem(DEPENDENCY_MAP_RELATIONS_KEY, JSON.stringify(selectedRelations));
    window.dispatchEvent(new Event(DEPENDENCY_MAP_CLOUD_HYDRATED_EVENT));
  } catch (e) {
    console.error('Failed to hydrate dependency map from cloud', e);
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
  if (!time || typeof time !== 'string') return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

const DAY_TO_INDEX: Record<string, number> = {
  'א': 0,
  'ב': 1,
  'ג': 2,
  'ד': 3,
  'ה': 4,
  'ו': 5,
};

const DAY_TO_RRULE_BYDAY: Record<string, string> = {
  'א': 'SU',
  'ב': 'MO',
  'ג': 'TU',
  'ד': 'WE',
  'ה': 'TH',
  'ו': 'FR',
};

export function getTermDateRange(year: string, semester: string): { start: Date; end: Date } {
  const y = parseInt(year, 10) || 2027;
  // Exact BGU 2026-2027 (תשפ"ז) academic calendar dates, with general fallback for other years
  if (y === 2027) {
    if (semester === '1') {
      return { start: new Date(2026, 9, 25), end: new Date(2027, 0, 22) }; // Oct 25, 2026 - Jan 22, 2027
    }
    if (semester === '2') {
      return { start: new Date(2027, 2, 7), end: new Date(2027, 5, 18) }; // Mar 7, 2027 - Jun 18, 2027
    }
    if (semester === '3') {
      return { start: new Date(2027, 6, 18), end: new Date(2027, 8, 10) }; // Jul 18, 2027 - Sep 10, 2027
    }
  }
  if (semester === '1') {
    return { start: new Date(y - 1, 9, 20), end: new Date(y, 0, 25) };
  }
  if (semester === '2') {
    return { start: new Date(y, 2, 1), end: new Date(y, 5, 20) };
  }
  return { start: new Date(y, 6, 15), end: new Date(y, 8, 15) };
}

function getFirstMeetingDate(termStart: Date, dayHebrew: string): Date {
  const targetDow = DAY_TO_INDEX[dayHebrew] ?? 0;
  const d = new Date(termStart.getFullYear(), termStart.getMonth(), termStart.getDate());
  const diff = (targetDow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatLocalDateTime(date: Date, timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(h || 0)}${pad2(m || 0)}00`;
}

function formatUntilDateUtc(endDate: Date): string {
  return `${endDate.getFullYear()}${pad2(endDate.getMonth() + 1)}${pad2(endDate.getDate())}T235959Z`;
}

export function buildGoogleCalendarUrl(params: {
  course: ScheduledCourse;
  group: CourseGroup;
  meeting: { day: string; startTime: string; endTime: string; location: string; mode?: string };
}): string {
  const { course, group, meeting } = params;
  const { start, end } = getTermDateRange(course.year, course.semester);
  const firstDate = getFirstMeetingDate(start, meeting.day);
  const startDt = formatLocalDateTime(firstDate, meeting.startTime);
  const endDt = formatLocalDateTime(firstDate, meeting.endTime);
  const byDay = DAY_TO_RRULE_BYDAY[meeting.day] || 'SU';
  const untilStr = formatUntilDateUtc(end);

  const title = `${course.name} (${group.type} - קבוצה ${group.id})`;
  const location = meeting.location ? `${meeting.location}, אוניברסיטת בן-גוריון` : 'אוניברסיטת בן-גוריון';
  const detailsParts = [
    `קורס: ${course.name} (${course.id})`,
    `סוג: ${group.type} | קבוצה: ${group.id}`,
  ];
  if (group.lecturer) detailsParts.push(`מרצה: ${group.lecturer}`);
  if (meeting.location) detailsParts.push(`מיקום: ${meeting.location}`);
  if (meeting.mode) detailsParts.push(`אופן לימוד: ${meeting.mode}`);

  const urlParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDt}/${endDt}`,
    ctz: 'Asia/Jerusalem',
    location,
    details: detailsParts.join('\n'),
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${untilStr}`,
  });

  return `https://calendar.google.com/calendar/render?${urlParams.toString()}`;
}

function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

const VTIMEZONE_ASIA_JERUSALEM = [
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Jerusalem',
  'X-LIC-LOCATION:Asia/Jerusalem',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0300',
  'TZNAME:IDT',
  'DTSTART:19700327T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1FR',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0300',
  'TZOFFSETTO:+0200',
  'TZNAME:IST',
  'DTSTART:19701025T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

function buildVEventLines(params: {
  course: ScheduledCourse;
  group: CourseGroup;
  meeting: { day: string; startTime: string; endTime: string; location: string; mode?: string };
  uidSuffix: string;
  termStart: Date;
  untilStr: string;
  nowStamp: string;
}): string[] {
  const { course, group, meeting, uidSuffix, termStart, untilStr, nowStamp } = params;
  const firstDate = getFirstMeetingDate(termStart, meeting.day);
  const startDt = formatLocalDateTime(firstDate, meeting.startTime);
  const endDt = formatLocalDateTime(firstDate, meeting.endTime);
  const byDay = DAY_TO_RRULE_BYDAY[meeting.day] || 'SU';

  const summary = `${course.name} (${group.type} - קבוצה ${group.id})`;
  const location = meeting.location
    ? `${meeting.location}, אוניברסיטת בן-גוריון`
    : 'אוניברסיטת בן-גוריון';
  const descParts = [
    `קורס: ${course.name} (${course.id})`,
    `סוג: ${group.type} | קבוצה: ${group.id}`,
  ];
  if (group.lecturer) descParts.push(`מרצה: ${group.lecturer}`);
  if (meeting.location) descParts.push(`מיקום: ${meeting.location}`);
  if (meeting.mode) descParts.push(`אופן לימוד: ${meeting.mode}`);

  return [
    'BEGIN:VEVENT',
    `UID:${course.id}-${group.id}-${uidSuffix}-${course.year}-${course.semester}@bgu-catalog`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART;TZID=Asia/Jerusalem:${startDt}`,
    `DTEND;TZID=Asia/Jerusalem:${endDt}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${untilStr}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`,
    'END:VEVENT',
  ];
}

export function generateMeetingIcs(params: {
  course: ScheduledCourse;
  group: CourseGroup;
  meeting: { day: string; startTime: string; endTime: string; location: string; mode?: string };
}): string {
  const { course, group, meeting } = params;
  const { start, end } = getTermDateRange(course.year, course.semester);
  const untilStr = formatUntilDateUtc(end);
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Modern BGU Course Catalog//Weekly Schedule//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-TIMEZONE:Asia/Jerusalem',
    ...VTIMEZONE_ASIA_JERUSALEM,
    ...buildVEventLines({
      course,
      group,
      meeting,
      uidSuffix: `${meeting.day}-${meeting.startTime.replace(':', '')}`,
      termStart: start,
      untilStr,
      nowStamp,
    }),
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

export function generateScheduleIcs(courses: ScheduledCourse[], year: string, semester: string): string {
  const { start, end } = getTermDateRange(year, semester);
  const untilStr = formatUntilDateUtc(end);
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Modern BGU Course Catalog//Weekly Schedule//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-TIMEZONE:Asia/Jerusalem',
    ...VTIMEZONE_ASIA_JERUSALEM,
  ];

  courses.forEach(course => {
    (course.selectedGroups || []).forEach(group => {
      (group.meetings || []).forEach((meeting, mIdx) => {
        lines.push(
          ...buildVEventLines({
            course,
            group,
            meeting,
            uidSuffix: String(mIdx),
            termStart: start,
            untilStr,
            nowStamp,
          })
        );
      });
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

