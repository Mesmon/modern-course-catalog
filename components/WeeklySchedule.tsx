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
  Settings2,
  Loader2,
  Award,
  BookOpen,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'] as const;
const YEARS = ['2027', '2026', '2025', '2024'] as const;
const SEMESTERS = ['1', '2', '3'] as const;
const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 68; // px per hour

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

  // Group into connected overlapping clusters
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

  // Search dialog state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);

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
  const { data: courses = [], refetch: refetchCourses } = useAllCourses();

  useEffect(() => {
    setIsMounted(true);
    const sync = () => {
      setAllScheduledCourses(loadScheduledCourses());
      setActiveTerm(loadActiveTerm());
    };
    sync();
    window.addEventListener(SCHEDULE_EVENT, sync);
    window.addEventListener(SCHEDULE_CLOUD_HYDRATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
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

  // Courses scheduled specifically for the active year & semester
  const scheduledCourses = useMemo(() => {
    return allScheduledCourses.filter(
      c => String(c.year) === String(activeTerm.year) && String(c.semester) === String(activeTerm.semester)
    );
  }, [allScheduledCourses, activeTerm]);

  // Only allow adding courses from the catalog that are offered in the selected year & semester
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
    // Double-check the course is offered in the selected semester
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

    // Check if already in schedule for this term
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
    try {
      const res = await fetch(`/api/courses/${cId}?dept=${dept}&degree=${degree}&year=${year}&semester=${semester}`);
      if (!res.ok) {
        toast.error(dictionary.common.error);
        return;
      }
      const detail: CourseDetail = await res.json();

      // Verify that the returned course detail matches the requested term (wasn't redirected to an older offering)
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

  // Compute events per day
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

  // Automatically switch mobileDay to the first day with classes if current day is empty
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

    return (
      <div
        key={ev.uid}
        onClick={() => handleOpenCourseGroups(ev.course)}
        style={{
          top: `${topPx + 2}px`,
          height: `${heightPx - 4}px`,
          width: `calc(${widthPct}% - 4px)`,
          [isRtl ? 'right' : 'left']: `calc(${offsetPct}% + 2px)`,
        }}
        className={cn(
          'group/block absolute z-10 rounded-lg border p-2 overflow-hidden cursor-pointer transition-all hover:z-30 hover:shadow-md flex flex-col justify-between',
          palette.bg,
          palette.border,
          palette.text,
          ev.hasOverlap && 'ring-2 ring-amber-500/80 dark:ring-amber-400/80'
        )}
        title={`${ev.course.name} (${ev.group.type} - ${dictionary.schedule.group} ${ev.group.id})\n${ev.meeting.startTime} - ${ev.meeting.endTime}\n${ev.meeting.location}`}
      >
        <div className="space-y-0.5 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <span
              className={cn(
                'text-[10px] font-semibold px-1.5 py-0.2 rounded shrink-0',
                palette.badge
              )}
            >
              {ev.group.type} #{ev.group.id}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {ev.hasOverlap && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-amber-500 text-white px-1 rounded shrink-0"
                  title={dictionary.schedule.overlapWarning}
                >
                  <AlertTriangle className="h-2.5 w-2.5" />
                  <span className="hidden xl:inline">{dictionary.schedule.overlapWarning}</span>
                </span>
              )}
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title={dictionary.schedule.openInGoogleCalendar}
                className="opacity-100 sm:opacity-0 sm:group-hover/block:opacity-100 p-0.5 rounded bg-white/80 dark:bg-slate-950/80 hover:bg-white dark:hover:bg-slate-900 transition-opacity shadow-xs"
              >
                <CalendarPlus className="h-3 w-3" />
              </a>
            </div>
          </div>

          <p className="font-bold text-xs leading-tight line-clamp-2 pt-0.5">
            {ev.course.name}
          </p>

          {ev.group.lecturer && heightPx >= 75 && (
            <p className="text-[10px] opacity-80 truncate">
              {ev.group.lecturer}
            </p>
          )}
        </div>

        <div className="space-y-0.5 pt-1 border-t border-black/5 dark:border-white/10 text-[10px] font-medium opacity-90 shrink-0">
          <div dir="ltr" className="font-mono font-semibold truncate">
            {ev.meeting.startTime} - {ev.meeting.endTime}
          </div>
          {ev.meeting.location && heightPx >= 60 && (
            <div className="truncate opacity-80 flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{ev.meeting.location}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Bar */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {dictionary.schedule.title}
              </h1>
              <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5 rounded-md">
                {activeSemesterLabel} • {activeTerm.year}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">{dictionary.schedule.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2.5 h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>{scheduledCourses.length}</span>
                <span className="text-muted-foreground font-normal">{dictionary.schedule.totalCourses}</span>
              </div>
              <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span>{totalCredits.toFixed(1).replace(/\.0$/, '')}</span>
                <span className="text-muted-foreground font-normal">{dictionary.schedule.totalCredits}</span>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setSearchOpen(true)}
              disabled={isLoadingCourse}
              className="h-9 px-3.5 rounded-lg font-medium text-xs gap-1.5 shadow-xs"
            >
              {isLoadingCourse ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {dictionary.schedule.addCourse}
            </Button>

            {scheduledCourses.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGcalDialogOpen(true)}
                  className="h-9 px-3 rounded-lg font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                  {dictionary.schedule.addToGoogleCalendar}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadIcs}
                  className="h-9 px-3 rounded-lg font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  {dictionary.schedule.addToAppleCalendar}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearSchedule}
                  className="h-9 px-3 rounded-lg font-medium text-xs gap-1.5 text-red-600 dark:text-red-400 border-red-200/80 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {dictionary.schedule.clearSchedule}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Year & Semester Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {dictionary.schedule.yearLabel}:
              </span>
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                {YEARS.map(yr => {
                  const isActive = activeTerm.year === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleSelectTerm(yr, activeTerm.semester)}
                      className={cn(
                        'px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                        isActive
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      )}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Semester Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {dictionary.schedule.semesterLabel}:
              </span>
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
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
                        'px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                        isActive
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      )}
                    >
                      <span>{dictionary.schedule.semesters?.[sem] || sem}</span>
                      {countInSem > 0 && (
                        <span
                          className={cn(
                            'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
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
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              {dictionary.schedule.onlyOfferedInTermHint}{' '}
              <strong className="font-semibold text-foreground">
                {activeSemesterLabel} ({activeTerm.year})
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar of Courses + Weekly Timetable Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6 items-start">
        {/* Scheduled Courses List (second on mobile so timetable is immediately visible, first on desktop) */}
        <div className="order-2 lg:order-1 lg:col-span-1 space-y-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {dictionary.schedule.myCourses}
            </h2>
            <Badge variant="secondary" className="font-semibold text-xs">
              {scheduledCourses.length}
            </Badge>
          </div>

          {scheduledCourses.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <Calendar className="h-7 w-7 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                {dictionary.schedule.noCoursesScheduled}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {dictionary.schedule.noCoursesScheduledDesc}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {scheduledCourses.map(course => {
                const palette = COURSE_COLOR_PALETTE[course.colorIndex % COURSE_COLOR_PALETTE.length];
                return (
                  <div
                    key={`${course.id}-${course.year}-${course.semester}`}
                    className={cn(
                      'rounded-xl border p-3 transition-all space-y-2 relative overflow-hidden',
                      palette.bg,
                      palette.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] font-semibold opacity-75">
                            {course.id}
                          </span>
                          {course.points && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-semibold bg-white/60 dark:bg-slate-950/60">
                              {course.points} {dictionary.schedule.totalCredits}
                            </Badge>
                          )}
                        </div>
                        <Link
                          href={`/courses/${course.courseId}?dept=${course.dept}&deg=${course.degree}&year=${course.year}&sem=${course.semester}`}
                          className={cn('font-semibold text-sm hover:underline flex items-center gap-1 leading-snug', palette.text)}
                        >
                          <span className="truncate">{course.name}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenCourseGroups(course)}
                          title={dictionary.schedule.editInSchedule}
                          className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCourse(course.id, course.year, course.semester)}
                          title={dictionary.schedule.removeFromSchedule}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Selected Groups Chips */}
                    <div className="flex flex-wrap gap-1">
                      {course.selectedGroups && course.selectedGroups.length > 0 ? (
                        course.selectedGroups.map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => handleOpenCourseGroups(course)}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-950/80 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
                          >
                            {g.type} • {dictionary.schedule.group} {g.id}
                          </button>
                        ))
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCourseGroups(course)}
                          className="text-[11px] italic opacity-75 hover:underline cursor-pointer"
                        >
                          {dictionary.schedule.selectGroupsTitle}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly Calendar Grid */}
        <div className="order-1 lg:order-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Mobile Day Switcher & View Mode Toggle (< md) */}
          <div className="md:hidden p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {mobileViewMode === 'day'
                  ? dictionary.schedule.days[mobileDay]
                  : dictionary.schedule.title}
              </span>
              <div className="inline-flex p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMobileViewMode('day')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                    mobileViewMode === 'day'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  {isRtl ? 'יומי' : 'Day'}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileViewMode('week')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                    mobileViewMode === 'week'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  {isRtl ? 'שבועי' : 'Week'}
                </button>
              </div>
            </div>

            {mobileViewMode === 'day' && (
              <div className="grid grid-cols-6 gap-1">
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
                          ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800'
                      )}
                    >
                      <span>{day}&apos;</span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 rounded-full font-bold leading-tight',
                          count > 0
                            ? isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-primary/15 text-primary'
                            : 'opacity-40'
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Single-Day Timeline View (< md when mobileViewMode === 'day') */}
          <div className={cn('md:hidden', mobileViewMode !== 'day' && 'hidden')}>
            <div
              className="relative grid grid-cols-[56px_1fr]"
              style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
            >
              {/* Time Labels Column */}
              <div className="relative border-e border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 select-none">
                {hoursList.slice(0, -1).map((hour, idx) => (
                  <div
                    key={hour}
                    className="absolute w-full text-center text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60 flex items-start justify-center pt-1"
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
                {(eventsByDay[mobileDay] || []).map(ev => renderEventBlock(ev))}
              </div>
            </div>
          </div>

          {/* Full 6-Day Week Grid (always visible on md+, or on mobile when mobileViewMode === 'week') */}
          <div className={cn('overflow-x-auto', mobileViewMode === 'day' ? 'hidden md:block' : 'block')}>
            <div className="min-w-[720px]">
              {/* Day Headers */}
              <div className="grid grid-cols-[64px_repeat(6,1fr)] border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
                <div className="p-2.5 flex items-center justify-center border-e border-slate-200 dark:border-slate-800">
                  <Clock className="h-4 w-4 text-slate-400" />
                </div>
                {DAYS.map(day => (
                  <div
                    key={day}
                    className="p-2.5 text-center border-e last:border-e-0 border-slate-200 dark:border-slate-800"
                  >
                    <div className="font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      {dictionary.schedule.days[day]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Grid Body */}
              <div
                className="relative grid grid-cols-[64px_repeat(6,1fr)]"
                style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
              >
                {/* Time Labels Column */}
                <div className="relative border-e border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 select-none">
                  {hoursList.slice(0, -1).map((hour, idx) => (
                    <div
                      key={hour}
                      className="absolute w-full text-center text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60 flex items-start justify-center pt-1"
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
                  return (
                    <div
                      key={day}
                      className="relative border-e last:border-e-0 border-slate-200 dark:border-slate-800"
                    >
                      {/* Horizontal Hour Lines */}
                      {hoursList.slice(0, -1).map(hour => (
                        <div
                          key={hour}
                          className="w-full border-b border-slate-100 dark:border-slate-800/60"
                          style={{ height: `${HOUR_HEIGHT}px` }}
                        />
                      ))}

                      {/* Scheduled Course Blocks */}
                      {dayEvents.map(ev => renderEventBlock(ev))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Course Dialog (filtered strictly by activeTerm.year & activeTerm.semester) */}
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
          <Badge variant="secondary" className="text-[10px] font-semibold">
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
                        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all',
                        palette.bg,
                        palette.border
                      )}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('font-semibold text-sm', palette.text)}>
                            {course.name}
                          </span>
                          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-md', palette.badge)}>
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
