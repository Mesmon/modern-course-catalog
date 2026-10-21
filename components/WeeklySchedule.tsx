'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAllCourses } from '@/hooks/useCourses';
import {
  ScheduledCourse,
  ScheduleTerm,
  COURSE_COLOR_PALETTE,
  loadScheduledCourses,
  loadActiveTerm,
  saveActiveTerm,
  upsertScheduledCourse,
  removeScheduledCourse,
  clearScheduledCoursesForTerm,
  isCourseOfferedInTerm,
  timeToMinutes,
  buildGoogleCalendarUrl,
  generateMeetingIcs,
  generateScheduleIcs,
  getAvailableAcademicYears,
  SCHEDULE_EVENT,
  SCHEDULE_CLOUD_HYDRATED_EVENT,
} from '@/lib/schedule';
import { CourseDetail, CourseGroup, CourseMeeting } from '@/types/course';
import { GroupSelectorDialog } from './GroupSelectorDialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Calendar,
  CalendarPlus,
  Download,
  Clock,
  MapPin,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Filter,
  Pencil,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'] as const;
const YEARS = ['2027', '2026', '2025', '2024'] as const;
const SEMESTERS = ['1', '2', '3'] as const;
const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 66; // px per hour

interface CalendarEvent {
  uid: string;
  course: ScheduledCourse;
  group: CourseGroup;
  meeting: CourseMeeting;
  day: string;
  startMin: number;
  endMin: number;
  column: number;
  totalColumns: number;
  hasOverlap: boolean;
}

function layoutDayEvents(rawEvents: Omit<CalendarEvent, 'column' | 'totalColumns' | 'hasOverlap'>[]): CalendarEvent[] {
  if (rawEvents.length === 0) return [];

  const sorted = [...rawEvents].sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return b.endMin - a.endMin;
  });

  const clusters: (typeof sorted)[] = [];
  let currentCluster: typeof sorted = [];
  let clusterEnd = -1;

  sorted.forEach(ev => {
    if (currentCluster.length === 0 || ev.startMin < clusterEnd) {
      currentCluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [ev];
      clusterEnd = ev.endMin;
    }
  });
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: CalendarEvent[] = [];

  clusters.forEach(cluster => {
    const columnsEnd: number[] = [];
    const placed: { ev: (typeof sorted)[0]; col: number }[] = [];

    cluster.forEach(ev => {
      let assignedCol = -1;
      for (let c = 0; c < columnsEnd.length; c++) {
        if (columnsEnd[c] <= ev.startMin) {
          assignedCol = c;
          columnsEnd[c] = ev.endMin;
          break;
        }
      }
      if (assignedCol === -1) {
        assignedCol = columnsEnd.length;
        columnsEnd.push(ev.endMin);
      }
      placed.push({ ev, col: assignedCol });
    });

    const totalCols = columnsEnd.length;
    const hasOverlap = cluster.length > 1;

    placed.forEach(({ ev, col }) => {
      result.push({
        ...ev,
        column: col,
        totalColumns: totalCols,
        hasOverlap,
      });
    });
  });

  return result;
}

interface Department {
  id: string;
  name: string;
}

export function WeeklySchedule({ dictionary, locale }: { dictionary: any; locale: string }) {
  const isRtl = locale === 'he';
  const [allScheduledCourses, setAllScheduledCourses] = useState<ScheduledCourse[]>([]);
  const [activeTerm, setActiveTerm] = useState<ScheduleTerm>({ year: '2027', semester: '1' });
  const [isMounted, setIsMounted] = useState(false);
  const [mobileDay, setMobileDay] = useState<(typeof DAYS)[number]>('א');
  const [mobileViewMode, setMobileViewMode] = useState<'day' | 'week'>('day');
  const [showOverlaps, setShowOverlaps] = useState(true);
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);
  const [todayHebrewDay, setTodayHebrewDay] = useState<string | null>(null);

  // Search dialog state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [loadingCourseMeta, setLoadingCourseMeta] = useState<{ id: string; name: string } | null>(null);
  const availableYears = useMemo(() => getAvailableAcademicYears(), []);

  // Group selector dialog state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [pendingCourse, setPendingCourse] = useState<{
    id: string;
    courseId: string;
    dept: string;
    degree: string;
    year: string;
    semester: string;
    name: string;
    points: string;
    groups: CourseGroup[];
    initialSelectedIds?: string[];
    isAlreadyScheduled?: boolean;
  } | null>(null);

  // Fetch department fallback dialog state
  const [showFetchDeptDialog, setShowFetchDeptDialog] = useState(false);
  const [fetchDeptInput, setFetchDeptInput] = useState('');
  const [isFetchingDept, setIsFetchingDept] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [gcalDialogOpen, setGcalDialogOpen] = useState(false);
  const suggestContainerRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const {
    data: courses = [],
    isLoading: isLoadingCatalog,
    isFetching: isFetchingCatalog,
    refetch: refetchCourses,
  } = useAllCourses();

  useEffect(() => {
    setIsMounted(true);
    const sync = () => {
      setAllScheduledCourses(loadScheduledCourses());
      setActiveTerm(loadActiveTerm());
    };
    sync();

    const updateClock = () => {
      const now = new Date();
      const dayIdx = now.getDay(); // 0 = Sun ... 5 = Fri
      setTodayHebrewDay(dayIdx >= 0 && dayIdx <= 5 ? DAYS[dayIdx] : null);
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateClock();
    const timer = setInterval(updateClock, 60000);

    window.addEventListener(SCHEDULE_EVENT, sync);
    window.addEventListener(SCHEDULE_CLOUD_HYDRATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener(SCHEDULE_EVENT, sync);
      window.removeEventListener(SCHEDULE_CLOUD_HYDRATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const handleSelectTerm = (year: string, semester: string) => {
    const next = { year, semester };
    setActiveTerm(next);
    saveActiveTerm(next);
  };

  const scheduledCourses = useMemo(() => {
    return allScheduledCourses.filter(
      c => String(c.year) === String(activeTerm.year) && String(c.semester) === String(activeTerm.semester)
    );
  }, [allScheduledCourses, activeTerm]);

  const relevantCatalogCourses = useMemo(() => {
    return (courses || []).filter((course: any) =>
      isCourseOfferedInTerm(course, activeTerm.year, activeTerm.semester)
    );
  }, [courses, activeTerm]);

  useEffect(() => {
    if (searchOpen) {
      refetchCourses();
    }
  }, [searchOpen, refetchCourses]);

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (Array.isArray(data)) setDepartments(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingDepartments(false);
      }
    }
    loadDepts();
  }, []);

  useEffect(() => {
    setFilteredDepartments(
      departments.filter(
        d =>
          fetchDeptInput === '' ||
          d.id.includes(fetchDeptInput) ||
          d.name.toLowerCase().includes(fetchDeptInput.toLowerCase())
      )
    );
  }, [fetchDeptInput, departments]);

  const handleSelectCourseFromSearch = async (course: any) => {
    if (!isCourseOfferedInTerm(course, activeTerm.year, activeTerm.semester)) {
      toast.error(dictionary.schedule.notOfferedInTermToast);
      return;
    }

    setSearchOpen(false);
    const parts = course.id.split('.');
    const dept = course.params?.dept || parts[0] || '202';
    const degree = course.params?.degree || parts[1] || '1';
    const cId = course.params?.course || parts[2] || course.id;
    const year = activeTerm.year;
    const semester = activeTerm.semester;
    const fullId = `${dept}.${degree}.${cId}`;

    const existing = scheduledCourses.find(c => c.id === fullId);
    if (existing && existing.allGroups && existing.allGroups.length > 0) {
      setPendingCourse({
        id: existing.id,
        courseId: existing.courseId,
        dept: existing.dept,
        degree: existing.degree,
        year: existing.year,
        semester: existing.semester,
        name: existing.name,
        points: existing.points,
        groups: existing.allGroups,
        initialSelectedIds: existing.selectedGroups.map(g => g.id),
        isAlreadyScheduled: true,
      });
      setGroupDialogOpen(true);
      return;
    }

    setIsLoadingCourse(true);
    setLoadingCourseMeta({ id: fullId, name: course.name });
    try {
      const res = await fetch(`/api/courses/${cId}?dept=${dept}&degree=${degree}&year=${year}&semester=${semester}`);
      if (!res.ok) {
        toast.error(dictionary.common.error);
        return;
      }
      const detail: CourseDetail = await res.json();

      if (
        (detail.year && String(detail.year) !== String(year)) ||
        (detail.semester && String(detail.semester) !== String(semester))
      ) {
        toast.error(dictionary.schedule.notOfferedInTermToast);
        return;
      }

      const groups = detail.groups || [];
      const offeringName =
        course.offerings?.find((o: any) => o.year === year && o.semester === semester)?.name ||
        detail.name ||
        course.name;

      if (groups.length <= 1 && !existing) {
        upsertScheduledCourse({
          id: fullId,
          courseId: cId,
          dept,
          degree,
          year,
          semester,
          name: offeringName,
          points: detail.points || '0',
          selectedGroups: groups,
          allGroups: groups,
        });
        toast.success(dictionary.schedule.addedToast);
      } else {
        setPendingCourse({
          id: fullId,
          courseId: cId,
          dept,
          degree,
          year,
          semester,
          name: offeringName,
          points: detail.points || '0',
          groups,
          initialSelectedIds: existing?.selectedGroups.map(g => g.id),
          isAlreadyScheduled: !!existing,
        });
        setGroupDialogOpen(true);
      }
    } catch (e) {
      console.error('Failed to fetch course for schedule:', e);
      toast.error(dictionary.common.error);
    } finally {
      setIsLoadingCourse(false);
      setLoadingCourseMeta(null);
    }
  };

  const handleOpenCourseGroups = (course: ScheduledCourse) => {
    setPendingCourse({
      id: course.id,
      courseId: course.courseId,
      dept: course.dept,
      degree: course.degree,
      year: course.year,
      semester: course.semester,
      name: course.name,
      points: course.points,
      groups: course.allGroups || [],
      initialSelectedIds: course.selectedGroups.map(g => g.id),
      isAlreadyScheduled: true,
    });
    setGroupDialogOpen(true);
  };

  const handleConfirmGroups = (selectedGroups: CourseGroup[]) => {
    if (!pendingCourse) return;
    upsertScheduledCourse({
      id: pendingCourse.id,
      courseId: pendingCourse.courseId,
      dept: pendingCourse.dept,
      degree: pendingCourse.degree,
      year: pendingCourse.year,
      semester: pendingCourse.semester,
      name: pendingCourse.name,
      points: pendingCourse.points,
      selectedGroups,
      allGroups: pendingCourse.groups,
    });
    toast.success(
      pendingCourse.isAlreadyScheduled
        ? dictionary.schedule.updatedToast
        : dictionary.schedule.addedToast
    );
  };

  const handleRemoveCourse = (id: string, year: string, semester: string) => {
    removeScheduledCourse(id, year, semester);
    toast.info(dictionary.schedule.removedToast);
  };

  const handleClearSchedule = () => {
    clearScheduledCoursesForTerm(activeTerm.year, activeTerm.semester);
  };

  const handleDownloadIcs = () => {
    const icsContent = generateScheduleIcs(scheduledCourses, activeTerm.year, activeTerm.semester);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bgu-schedule-${activeTerm.year}-sem${activeTerm.semester}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(dictionary.schedule.icsDownloadedToast);
  };

  const handleDownloadMeetingIcs = (
    course: ScheduledCourse,
    group: CourseGroup,
    meeting: CourseMeeting
  ) => {
    const icsContent = generateMeetingIcs({ course, group, meeting });
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `bgu-${course.courseId}-g${group.id}-${course.year}-sem${course.semester}.ics`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(dictionary.schedule.icsDownloadedToast);
  };

  const handleFetchDepartment = async () => {
    if (!fetchDeptInput) return;
    setIsFetchingDept(true);
    try {
      const res = await fetch(
        `/api/departments/${fetchDeptInput}?year=${activeTerm.year}&semester=${activeTerm.semester}`
      );
      if (res.ok) {
        const deptCourses = await res.json();
        await queryClient.invalidateQueries({ queryKey: ['courses'] });
        if (deptCourses && deptCourses.length > 0) {
          toast.success(dictionary.map.deptFound);
          setShowFetchDeptDialog(false);
          setFetchDeptInput('');
          setSearchOpen(true);
        } else {
          toast.error(dictionary.schedule.noCoursesInTerm);
        }
      } else {
        toast.error(dictionary.map.deptNotFound);
      }
    } catch (err) {
      console.error(err);
      toast.error(dictionary.map.deptNotFound);
    } finally {
      setIsFetchingDept(false);
    }
  };

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    DAYS.forEach(d => {
      map[d] = [];
    });

    const rawByDay: Record<string, Omit<CalendarEvent, 'column' | 'totalColumns' | 'hasOverlap'>[]> = {};
    DAYS.forEach(d => {
      rawByDay[d] = [];
    });

    scheduledCourses.forEach(course => {
      (course.selectedGroups || []).forEach(group => {
        (group.meetings || []).forEach((meeting, mIdx) => {
          const day = meeting.day;
          if (!rawByDay[day]) return;
          const startMin = timeToMinutes(meeting.startTime);
          const endMin = timeToMinutes(meeting.endTime);
          if (endMin <= startMin) return;
          rawByDay[day].push({
            uid: `${course.id}-${group.id}-${mIdx}`,
            course,
            group,
            meeting,
            day,
            startMin,
            endMin,
          });
        });
      });
    });

    DAYS.forEach(d => {
      map[d] = layoutDayEvents(rawByDay[d]);
    });

    return map;
  }, [scheduledCourses]);

  useEffect(() => {
    if ((eventsByDay[mobileDay]?.length || 0) === 0) {
      const firstActiveDay = DAYS.find(d => (eventsByDay[d]?.length || 0) > 0);
      if (firstActiveDay) {
        setMobileDay(firstActiveDay);
      }
    }
  }, [eventsByDay, mobileDay]);

  const totalCredits = useMemo(() => {
    return scheduledCourses.reduce((sum, c) => sum + (parseFloat(c.points) || 0), 0);
  }, [scheduledCourses]);

  const totalWeeklyHours = useMemo(() => {
    let mins = 0;
    DAYS.forEach(d => {
      (eventsByDay[d] || []).forEach(ev => {
        mins += Math.max(0, ev.endMin - ev.startMin);
      });
    });
    return Math.round((mins / 60) * 10) / 10;
  }, [eventsByDay]);

  const firstOverlap = useMemo(() => {
    for (const day of DAYS) {
      const overlapping = (eventsByDay[day] || []).filter(e => e.hasOverlap);
      if (overlapping.length >= 2) {
        return {
          day,
          events: overlapping.slice(0, 2),
        };
      }
    }
    return null;
  }, [eventsByDay]);

  const hoursList = useMemo(() => {
    const arr: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      arr.push(h);
    }
    return arr;
  }, []);

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeSemesterLabel =
    dictionary.schedule.semesters?.[activeTerm.semester] ||
    `${dictionary.schedule.semesterLabel} ${activeTerm.semester}`;

  const showCurrentTimeLine =
    nowMinutes !== null &&
    nowMinutes >= START_HOUR * 60 &&
    nowMinutes <= END_HOUR * 60;
  const currentTimeTopPx = showCurrentTimeLine
    ? ((nowMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
    : 0;
  const currentTimeFormatted =
    nowMinutes !== null
      ? `${String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:${String(nowMinutes % 60).padStart(2, '0')}`
      : '';

  const renderEventBlock = (ev: CalendarEvent) => {
    const startOffsetMin = Math.max(0, ev.startMin - START_HOUR * 60);
    const durationMin = Math.max(30, ev.endMin - ev.startMin);
    const topPx = (startOffsetMin / 60) * HOUR_HEIGHT;
    const heightPx = (durationMin / 60) * HOUR_HEIGHT;

    const widthPct = 100 / ev.totalColumns;
    const offsetPct = ev.column * widthPct;

    const palette =
      COURSE_COLOR_PALETTE[ev.course.colorIndex % COURSE_COLOR_PALETTE.length];

    const gcalUrl = buildGoogleCalendarUrl({
      course: ev.course,
      group: ev.group,
      meeting: ev.meeting,
    });

    const highlightConflict = ev.hasOverlap && showOverlaps;

    return (
      <div
        key={ev.uid}
        onClick={() => handleOpenCourseGroups(ev.course)}
        style={{
          top: `${topPx + 2}px`,
          height: `${heightPx - 4}px`,
          width: `calc(${widthPct}% - 6px)`,
          [isRtl ? 'right' : 'left']: `calc(${offsetPct}% + 3px)`,
        }}
        className={cn(
          'group/block absolute z-10 rounded-md border p-2 overflow-hidden cursor-pointer transition-all hover:z-30 hover:shadow-sm flex flex-col justify-between',
          palette.bg,
          palette.border,
          palette.text,
          highlightConflict && 'ring-2 ring-amber-500 border-amber-500'
        )}
        title={`${ev.course.name} (${ev.group.type} - ${dictionary.schedule.group} ${ev.group.id})\n${ev.meeting.startTime} - ${ev.meeting.endTime}\n${ev.meeting.location}`}
      >
        <div className="space-y-0.5 min-h-0 overflow-hidden">
          <div className="flex items-start justify-between gap-1">
            <span className="font-bold text-xs leading-tight line-clamp-2">
              {ev.course.name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {highlightConflict ? (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-200 text-amber-950 dark:bg-amber-500 dark:text-slate-950 px-1 py-0.2 rounded shrink-0"
                  title={dictionary.schedule.overlapWarning}
                >
                  <AlertTriangle className="h-2.5 w-2.5" />
                  <span className="hidden xl:inline">{dictionary.schedule.overlapWarning}</span>
                </span>
              ) : (
                <span
                  className={cn(
                    'font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded shrink-0',
                    palette.badge
                  )}
                >
                  {ev.group.type} #{ev.group.id}
                </span>
              )}
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title={dictionary.schedule.openInGoogleCalendar}
                className="opacity-100 sm:opacity-0 sm:group-hover/block:opacity-100 p-0.5 rounded bg-white/80 dark:bg-slate-950/80 hover:bg-white dark:hover:bg-slate-900 transition-opacity shadow-2xs"
              >
                <CalendarPlus className="h-3 w-3" />
              </a>
            </div>
          </div>

          {highlightConflict && (
            <span className="block font-mono text-[10px] opacity-85">
              {ev.group.type} #{ev.group.id}
            </span>
          )}

          {ev.meeting.location && heightPx >= 56 && (
            <p className="text-[11px] opacity-85 truncate flex items-center gap-1 pt-0.5">
              <MapPin className="h-3 w-3 shrink-0 opacity-75" />
              <span className="truncate">{ev.meeting.location}</span>
            </p>
          )}
        </div>

        <div className="pt-1 border-t border-black/8 dark:border-white/10 text-[10px] font-medium opacity-90 flex items-center justify-between gap-1 shrink-0">
          {ev.group.lecturer && heightPx >= 64 ? (
            <span className="truncate flex items-center gap-1">
              <User className="h-2.5 w-2.5 shrink-0 opacity-70" />
              <span className="truncate">{ev.group.lecturer}</span>
            </span>
          ) : (
            <span />
          )}
          <span dir="ltr" className="font-mono font-semibold shrink-0">
            {ev.meeting.startTime}-{ev.meeting.endTime}
          </span>
        </div>
      </div>
    );
  };

  const currentDayIdx = DAYS.indexOf(mobileDay);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ================= SUB-HEADER / CONTROLS ROW (Stitch Design) ================= */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 py-3.5">
        <div className="max-w-[1520px] mx-auto flex flex-wrap items-center justify-between gap-3.5">
          {/* Right (RTL): Title, Year, Semester & Metric Pill */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {dictionary.schedule.title}
            </h1>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Year Segmented Control */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
              {availableYears.map(yr => {
                const isActive = activeTerm.year === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleSelectTerm(yr, activeTerm.semester)}
                    className={cn(
                      'px-2.5 py-1 rounded-md font-mono font-semibold transition-all cursor-pointer',
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-primary shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>

            {/* Semester Segmented Control */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
              {SEMESTERS.map(sem => {
                const isActive = activeTerm.semester === sem;
                const countInSem = allScheduledCourses.filter(
                  c => c.year === activeTerm.year && c.semester === sem
                ).length;
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => handleSelectTerm(activeTerm.year, sem)}
                    className={cn(
                      'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-primary shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    <span>{dictionary.schedule.semesters?.[sem] || sem}</span>
                    {countInSem > 0 && (
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/15 text-primary'
                        )}
                      >
                        {countInSem}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Metric Badge (BGU Orange Pill) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span>
                {scheduledCourses.length} {dictionary.schedule.totalCourses} ·{' '}
                {totalCredits.toFixed(1).replace(/\.0$/, '')} {dictionary.schedule.totalCredits}
              </span>
            </div>
          </div>

          {/* Left (RTL): Actions (Clear, Calendar Exports, Primary Add Course) */}
          <div className="flex flex-wrap items-center gap-2">
            {scheduledCourses.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleClearSchedule}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{dictionary.schedule.clearSchedule}</span>
                </button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGcalDialogOpen(true)}
                  className="h-8 px-3 rounded-lg font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                  <span>Google Calendar</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadIcs}
                  className="h-8 px-3 rounded-lg font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Apple Calendar</span>
                </Button>
              </>
            )}

            <Button
              size="sm"
              onClick={() => setSearchOpen(true)}
              disabled={isLoadingCourse}
              className="h-8 px-3.5 rounded-lg font-semibold text-xs gap-1.5 shadow-2xs cursor-pointer"
            >
              {isLoadingCourse ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{dictionary.schedule.addCourse}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ================= MAIN WORKSPACE (2-COLUMN DENSE VIEW) ================= */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto p-3.5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 1. SIDEBAR (הקורסים שלי) — Second on mobile so timetable is immediately visible */}
        <aside className="order-2 lg:order-1 lg:col-span-3 flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {dictionary.schedule.myCourses}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {scheduledCourses.length} {dictionary.schedule.totalCourses} · {totalWeeklyHours}{' '}
                {isRtl ? 'שעות שבועיות' : 'weekly hrs'}
              </p>
            </div>
            <Badge variant="secondary" className="font-mono font-semibold text-xs">
              {scheduledCourses.length}
            </Badge>
          </div>

          {scheduledCourses.length === 0 && !isLoadingCourse ? (
            <div className="py-10 px-4 text-center space-y-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <Calendar className="h-7 w-7 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                {dictionary.schedule.noCoursesScheduled}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {dictionary.schedule.noCoursesScheduledDesc}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSearchOpen(true)}
                className="mt-2 h-8 text-xs font-medium gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                {dictionary.schedule.addCourse}
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {scheduledCourses.map(course => {
                const palette = COURSE_COLOR_PALETTE[course.colorIndex % COURSE_COLOR_PALETTE.length];
                return (
                  <div
                    key={`${course.id}-${course.year}-${course.semester}`}
                    className={cn(
                      'group relative bg-white dark:bg-slate-950/80 border rounded-lg p-3 transition-all hover:shadow-2xs',
                      palette.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <span
                          className={cn(
                            'inline-block font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border',
                            palette.codeChip
                          )}
                        >
                          {course.id}
                        </span>
                        <Link
                          href={`/courses/${course.courseId}?dept=${course.dept}&deg=${course.degree}&year=${course.year}&sem=${course.semester}`}
                          className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-primary transition-colors flex items-center gap-1 mt-1 leading-snug"
                        >
                          <span className="truncate">{course.name}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0 opacity-85 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenCourseGroups(course)}
                          title={dictionary.schedule.editInSchedule}
                          className="p-1 text-slate-500 hover:text-primary rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCourse(course.id, course.year, course.semester)}
                          title={dictionary.schedule.removeFromSchedule}
                          className="p-1 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {course.selectedGroups && course.selectedGroups.length > 0 ? (
                        course.selectedGroups.map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => handleOpenCourseGroups(course)}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer"
                          >
                            {g.type} {g.id}
                          </button>
                        ))
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCourseGroups(course)}
                          className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
                        >
                          {dictionary.schedule.selectGroupsTitle}
                        </button>
                      )}
                      {course.points && (
                        <span className="text-[11px] font-mono font-semibold ms-auto text-slate-600 dark:text-slate-400">
                          {course.points} {dictionary.schedule.totalCredits}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Modern Pending Course Card while loading groups */}
              {isLoadingCourse && loadingCourseMeta && (
                <div className="relative bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/70 border-s-4 border-s-primary rounded-lg p-3 animate-in fade-in duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <span className="inline-block font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border bg-white dark:bg-slate-900 text-primary border-orange-200 dark:border-orange-800">
                        {loadingCourseMeta.id}
                      </span>
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {loadingCourseMeta.name}
                      </p>
                      <p className="text-[11px] text-primary font-medium flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                        <span>
                          {isRtl ? 'טוען קבוצות רישום ומועדים...' : 'Loading groups & schedule...'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Button to add more courses directly under the added courses list */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingCourse}
                onClick={() => setSearchOpen(true)}
                className="w-full h-9 rounded-lg border-dashed border-slate-300 dark:border-slate-700 hover:border-primary hover:text-primary hover:bg-orange-50/40 dark:hover:bg-orange-950/25 text-xs font-semibold gap-1.5 cursor-pointer transition-colors"
              >
                {isLoadingCourse ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-primary" />
                )}
                <span>{dictionary.schedule.addCourse}</span>
              </Button>
            </div>
          )}

          {/* Sidebar Footer Toggles */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="flex items-center justify-between cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>{isRtl ? 'הדגש חפיפות בשעות' : 'Highlight time overlaps'}</span>
              <input
                type="checkbox"
                checked={showOverlaps}
                onChange={e => setShowOverlaps(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
              />
            </label>
          </div>
        </aside>

        {/* 2. MAIN TIME GRID AREA */}
        <section className="order-1 lg:order-2 lg:col-span-9 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          {/* Desktop Grid Topbar + Course Legend */}
          <div className="hidden md:flex items-center justify-between px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isRtl ? 'תצוגה שבועית' : 'Weekly View'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                08:00 – 21:00
              </span>
            </div>
            {scheduledCourses.length > 0 && (
              <div className="flex items-center gap-3.5 text-xs flex-wrap">
                {scheduledCourses.map(c => {
                  const palette = COURSE_COLOR_PALETTE[c.colorIndex % COURSE_COLOR_PALETTE.length];
                  return (
                    <div key={c.id} className="flex items-center gap-1.5">
                      <span className={cn('w-2.5 h-2.5 rounded-xs shrink-0', palette.accent)} />
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                        {c.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Day Switcher & Segmented View Toggle (Stitch mobile.html) */}
          <div className="md:hidden p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMobileViewMode('day')}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                    mobileViewMode === 'day'
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  {isRtl ? 'יומי' : 'Day'}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileViewMode('week')}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                    mobileViewMode === 'week'
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  {isRtl ? 'שבועי' : 'Week'}
                </button>
              </div>

              {mobileViewMode === 'day' && (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {dictionary.schedule.days[mobileDay]}
                  </span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() =>
                        setMobileDay(DAYS[(currentDayIdx - 1 + DAYS.length) % DAYS.length])
                      }
                      className="h-6 w-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="Previous day"
                    >
                      <ChevronRight className={cn('h-4 w-4', !isRtl && 'rotate-180')} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileDay(DAYS[(currentDayIdx + 1) % DAYS.length])}
                      className="h-6 w-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="Next day"
                    >
                      <ChevronLeft className={cn('h-4 w-4', !isRtl && 'rotate-180')} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {mobileViewMode === 'day' && (
              <div className="grid grid-cols-6 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                {DAYS.map(day => {
                  const count = eventsByDay[day]?.length || 0;
                  const isActive = mobileDay === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setMobileDay(day)}
                      className={cn(
                        'py-1.5 px-1 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer',
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-2xs ring-2 ring-primary/20'
                          : 'bg-slate-50/70 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800'
                      )}
                    >
                      <span>{day}&apos;</span>
                      <span
                        className={cn(
                          'text-[10px] font-mono font-bold',
                          isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                        )}
                      >
                        {count}
                      </span>
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          count > 0
                            ? isActive
                              ? 'bg-white'
                              : 'bg-primary'
                            : 'bg-transparent'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Single-Day Timeline View (< md when mobileViewMode === 'day') */}
          <div className={cn('md:hidden', mobileViewMode !== 'day' && 'hidden')}>
            <div
              className="relative grid grid-cols-[54px_1fr]"
              style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
            >
              {/* Time Labels Column */}
              <div className="relative border-e border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 select-none">
                {hoursList.slice(0, -1).map((hour, idx) => (
                  <div
                    key={hour}
                    className="absolute w-full text-center text-[11px] font-mono text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60 flex items-start justify-center pt-1"
                    style={{
                      top: `${idx * HOUR_HEIGHT}px`,
                      height: `${HOUR_HEIGHT}px`,
                    }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Selected Day Column */}
              <div className="relative">
                {hoursList.slice(0, -1).map(hour => (
                  <div
                    key={hour}
                    className="w-full border-b border-slate-100 dark:border-slate-800/60"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  />
                ))}
                {showCurrentTimeLine && todayHebrewDay === mobileDay && (
                  <div
                    className="absolute inset-x-0 z-30 flex items-center pointer-events-none"
                    style={{ top: `${currentTimeTopPx}px` }}
                  >
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 h-[2px] bg-primary" />
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-primary-foreground ms-1 shadow-2xs">
                      {currentTimeFormatted}
                    </span>
                  </div>
                )}
                {(eventsByDay[mobileDay] || []).map(ev => renderEventBlock(ev))}
              </div>
            </div>
          </div>

          {/* Full 6-Day Week Grid (Desktop & Mobile 'week' mode) */}
          <div className={cn('overflow-x-auto', mobileViewMode === 'day' ? 'hidden md:block' : 'block')}>
            <div className="min-w-[780px]">
              {/* Day Headers */}
              <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
                <div className="p-2.5 flex items-center justify-center border-e border-slate-200/80 dark:border-slate-800 font-mono text-xs text-muted-foreground">
                  {isRtl ? 'שעה' : 'Time'}
                </div>
                {DAYS.map(day => {
                  const isToday = todayHebrewDay === day;
                  return (
                    <div
                      key={day}
                      className={cn(
                        'p-2.5 text-center border-e last:border-e-0 border-slate-200/80 dark:border-slate-800',
                        isToday && 'bg-primary/8 dark:bg-primary/15'
                      )}
                    >
                      <div
                        className={cn(
                          'font-semibold text-xs sm:text-sm',
                          isToday
                            ? 'text-primary font-bold'
                            : 'text-slate-700 dark:text-slate-200'
                        )}
                      >
                        {dictionary.schedule.days[day]}
                        {isToday && (
                          <span className="text-[11px] font-mono font-normal text-primary ms-1">
                            ({isRtl ? 'היום' : 'Today'})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Grid Body */}
              <div
                className="relative grid grid-cols-[60px_repeat(6,1fr)]"
                style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
              >
                {/* Time Labels Column */}
                <div className="relative border-e border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 select-none">
                  {hoursList.slice(0, -1).map((hour, idx) => (
                    <div
                      key={hour}
                      className="absolute w-full text-center text-[11px] font-mono text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60 flex items-start justify-center pt-1"
                      style={{
                        top: `${idx * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`,
                      }}
                    >
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {DAYS.map(day => {
                  const dayEvents = eventsByDay[day] || [];
                  const isToday = todayHebrewDay === day;
                  return (
                    <div
                      key={day}
                      className={cn(
                        'relative border-e last:border-e-0 border-slate-200/80 dark:border-slate-800',
                        isToday && 'bg-primary/[0.02] dark:bg-primary/[0.04]'
                      )}
                    >
                      {/* Horizontal Hour Lines */}
                      {hoursList.slice(0, -1).map(hour => (
                        <div
                          key={hour}
                          className="w-full border-b border-slate-100 dark:border-slate-800/60"
                          style={{ height: `${HOUR_HEIGHT}px` }}
                        />
                      ))}

                      {/* Current Time Indicator Line on Today's Column */}
                      {showCurrentTimeLine && isToday && (
                        <div
                          className="absolute inset-x-0 z-30 flex items-center pointer-events-none"
                          style={{ top: `${currentTimeTopPx}px` }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-primary -ms-1 ring-2 ring-white dark:ring-slate-900 shrink-0" />
                          <div className="flex-1 h-[2px] bg-primary" />
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-primary-foreground me-1 shadow-2xs">
                            {currentTimeFormatted}
                          </span>
                        </div>
                      )}

                      {/* Scheduled Course Blocks */}
                      {dayEvents.map(ev => renderEventBlock(ev))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Conflict Warning Footer Banner (Stitch schedule.html bottom strip) */}
          {firstOverlap && showOverlaps && (
            <div className="bg-amber-50/90 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-800/70 px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong className="font-semibold">
                    {isRtl ? 'זוהתה חפיפה במערכת:' : 'Schedule conflict detected:'}
                  </strong>{' '}
                  {dictionary.schedule.days[firstOverlap.day]}{' '}
                  <span dir="ltr" className="font-mono">
                    {firstOverlap.events[0].meeting.startTime}–{firstOverlap.events[0].meeting.endTime}
                  </span>{' '}
                  ({firstOverlap.events.map(e => `${e.course.name} ${e.group.type} ${e.group.id}`).join(' / ')})
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCourseGroups(firstOverlap.events[0].course)}
                className="px-3 py-1 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                {isRtl ? 'החלף לקבוצה חלופית' : 'Change Group'}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Mobile Floating Action Button (FAB) from Stitch mobile.html */}
      <div className="md:hidden fixed bottom-20 end-4 z-30">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-full shadow-lg border border-primary/20 active:scale-95 transition-all text-xs font-semibold cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{dictionary.schedule.addCourse}</span>
        </button>
      </div>

      {/* Modern Course Loading Overlay when adding a course to the schedule */}
      {isLoadingCourse && loadingCourseMeta && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          dir={isRtl ? 'rtl' : 'ltr'}
          aria-busy="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl max-w-sm w-full flex flex-col items-center text-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-primary shadow-2xs">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="space-y-1 min-w-0 w-full">
              <span className="inline-block font-mono text-xs font-bold text-primary bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded border border-orange-200/80 dark:border-orange-800/60">
                {loadingCourseMeta.id}
              </span>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate pt-1">
                {loadingCourseMeta.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? 'שולף קבוצות רישום, מרצים ושעות הוראה מהשנתון...'
                  : 'Fetching registration groups, lecturers, and schedule...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Course Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <div className="px-4 py-2.5 pe-12 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-muted-foreground" dir={isRtl ? 'rtl' : 'ltr'}>
          <span className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              {dictionary.schedule.onlyOfferedInTermHint}{' '}
              <strong className="font-semibold text-foreground">
                {activeSemesterLabel} ({activeTerm.year})
              </strong>
            </span>
          </span>
          <Badge variant="secondary" className="text-[10px] font-mono font-semibold">
            {relevantCatalogCourses.length} {dictionary.schedule.totalCourses}
          </Badge>
        </div>
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          <CommandInput
            placeholder={dictionary.schedule.searchPlaceholder}
            className={isRtl ? 'text-right' : 'text-left'}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        </div>
        <CommandList className={isRtl ? 'text-right' : 'text-left'} dir={isRtl ? 'rtl' : 'ltr'}>
          {isLoadingCatalog || (isFetchingCatalog && courses.length === 0) ? (
            <div className="p-4 space-y-3" aria-busy="true">
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                <span>{isRtl ? 'טוען קטלוג קורסים...' : 'Loading course catalog...'}</span>
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border border-slate-100 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/40 animate-pulse"
                >
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-20 bg-orange-100 dark:bg-orange-950/60 rounded font-mono" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center text-center gap-3 py-6 px-4">
                  <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                    {dictionary.schedule.noCoursesInTerm} ({activeSemesterLabel} {activeTerm.year})
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    {dictionary.map.suggestDepartment}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSearchOpen(false);
                      setShowFetchDeptDialog(true);
                    }}
                    className="mt-1 rounded-lg"
                  >
                    {dictionary.schedule.fetchDeptBtn}
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup heading={`${activeSemesterLabel} • ${activeTerm.year}`}>
                {relevantCatalogCourses.map((course: any) => {
                  const isScheduled = scheduledCourses.some(c => c.id === course.id);
                  const termOffering = course.offerings?.find(
                    (o: any) => String(o.year) === activeTerm.year && String(o.semester) === activeTerm.semester
                  );
                  const displayName = termOffering?.name || course.name;
                  return (
                    <CommandItem
                      key={course.id}
                      value={`${course.id} ${displayName}`}
                      onSelect={() => handleSelectCourseFromSearch(course)}
                      className="flex items-center justify-between gap-3 py-2.5 px-3 cursor-pointer rounded-lg my-0.5"
                    >
                      <div className="flex flex-col gap-0.5 text-start min-w-0">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {displayName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {course.id} • {activeTerm.year}-{activeTerm.semester}
                        </span>
                      </div>
                      {isScheduled && (
                        <Badge variant="secondary" className="text-[11px] font-semibold shrink-0">
                          {dictionary.schedule.inSchedule}
                        </Badge>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>

      {/* Group Selector Modal */}
      {pendingCourse && (
        <GroupSelectorDialog
          open={groupDialogOpen}
          onOpenChange={setGroupDialogOpen}
          courseName={pendingCourse.name}
          courseId={pendingCourse.id}
          groups={pendingCourse.groups}
          initialSelectedGroupIds={pendingCourse.initialSelectedIds}
          isAlreadyScheduled={pendingCourse.isAlreadyScheduled}
          onConfirm={handleConfirmGroups}
          onRemove={() =>
            handleRemoveCourse(pendingCourse.id, pendingCourse.year, pendingCourse.semester)
          }
          dictionary={dictionary}
          locale={locale}
        />
      )}

      {/* Google Calendar Export Dialog */}
      <Dialog open={gcalDialogOpen} onOpenChange={setGcalDialogOpen}>
        <DialogContent
          className="sm:max-w-xl max-h-[85vh] flex flex-col"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <CalendarPlus className="h-5 w-5 text-primary shrink-0" />
              {dictionary.schedule.googleCalendarTitle}
            </DialogTitle>
            <DialogDescription>
              {dictionary.schedule.googleCalendarDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-2 pe-1">
            {scheduledCourses.map(course => {
              const palette = COURSE_COLOR_PALETTE[course.colorIndex % COURSE_COLOR_PALETTE.length];
              return (course.selectedGroups || []).map(group =>
                (group.meetings || []).map((meeting, mIdx) => {
                  const gcalUrl = buildGoogleCalendarUrl({ course, group, meeting });
                  const dayLabel =
                    dictionary.schedule.days?.[meeting.day] ||
                    `${dictionary.course.dayPrefix}${meeting.day}`;
                  return (
                    <div
                      key={`${course.id}-${group.id}-${mIdx}`}
                      className={cn(
                        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all',
                        palette.bg,
                        palette.border
                      )}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('font-semibold text-sm', palette.text)}>
                            {course.name}
                          </span>
                          <span className={cn('text-[11px] font-mono font-semibold px-2 py-0.5 rounded', palette.badge)}>
                            {group.type} #{group.id}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                            {dayLabel} •{' '}
                            <span dir="ltr" className="font-mono">
                              {meeting.startTime} - {meeting.endTime}
                            </span>
                          </span>
                          {meeting.location && (
                            <span className="inline-flex items-center gap-1 font-medium">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{meeting.location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          asChild
                          size="sm"
                          className="h-8 rounded-lg font-medium text-xs gap-1.5"
                        >
                          <a href={gcalUrl} target="_blank" rel="noopener noreferrer">
                            <CalendarPlus className="h-3.5 w-3.5" />
                            {dictionary.schedule.openInGoogleCalendar}
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadMeetingIcs(course, group, meeting)}
                          className="h-8 rounded-lg font-medium text-xs gap-1.5 bg-white/80 dark:bg-slate-950/80 hover:bg-white dark:hover:bg-slate-900"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {dictionary.schedule.openInAppleCalendar}
                        </Button>
                      </div>
                    </div>
                  );
                })
              );
            })}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDownloadIcs}
              className="rounded-lg font-medium gap-2 flex-1"
            >
              <Download className="h-4 w-4" />
              {dictionary.schedule.downloadIcsAll}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGcalDialogOpen(false)}
              className="rounded-lg font-medium"
            >
              {dictionary.schedule.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fetch Department Dialog */}
      <Dialog open={showFetchDeptDialog} onOpenChange={setShowFetchDeptDialog}>
        <DialogContent className="sm:max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{dictionary.map.fetchDeptTitle}</DialogTitle>
            <DialogDescription>{dictionary.map.fetchDeptDesc}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center py-2" ref={suggestContainerRef}>
            <div className="grid flex-1 gap-2 relative">
              <Input
                value={fetchDeptInput}
                onChange={e => {
                  setFetchDeptInput(e.target.value);
                  setIsSuggestOpen(true);
                }}
                onFocus={() => setIsSuggestOpen(true)}
                placeholder={dictionary.map.fetchDeptPlaceholder}
                disabled={isFetchingDept}
                className={cn(isRtl ? 'text-right' : 'text-left')}
                autoComplete="off"
              />
              {isLoadingDepartments && (
                <div className="absolute top-1/2 -translate-y-1/2 end-3 h-4 w-4">
                  <Loader2 className="h-full w-full animate-spin text-primary/50" />
                </div>
              )}
              {isSuggestOpen && filteredDepartments.length > 0 && (
                <div className="absolute top-full z-[100] w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
                  <ul className="max-h-[200px] overflow-auto py-1">
                    {filteredDepartments.map(dept => (
                      <li key={dept.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setFetchDeptInput(dept.id);
                            setIsSuggestOpen(false);
                          }}
                          className="w-full px-3.5 py-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-start"
                        >
                          <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{dept.name}</span>
                          <span className="text-slate-400 text-xs font-mono shrink-0">#{dept.id}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowFetchDeptDialog(false)} disabled={isFetchingDept}>
              {dictionary.map.cancel}
            </Button>
            <Button onClick={handleFetchDepartment} disabled={isFetchingDept || !fetchDeptInput}>
              {isFetchingDept && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {dictionary.map.searchDeptBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
