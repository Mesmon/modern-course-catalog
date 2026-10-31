'use client';

import React, { useMemo, useState } from 'react';
import {
  ScheduledCourse,
  ScheduleVersionMeta,
  COURSE_COLOR_PALETTE,
  MAX_SCHEDULE_VERSIONS,
  computeScheduleVersionMetrics,
  getCourseVersion,
  timeToMinutes,
} from '@/lib/schedule';
import { CourseGroup, CourseMeeting } from '@/types/course';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Copy,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Sparkles,
  Columns2,
  Layers,
  Pencil,
  ArrowLeftRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'] as const;
const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const MINI_HOUR_HEIGHT = 44; // compact px per hour for side-by-side grids
const OVERLAY_HOUR_HEIGHT = 58; // px per hour for combined overlay grid

const VERSION_ACCENT_STYLES: Record<
  number,
  {
    pill: string;
    pillActive: string;
    badge: string;
    ring: string;
    dot: string;
  }
> = {
  1: {
    pill: 'border-orange-200 dark:border-orange-800/70 text-orange-800 dark:text-orange-300',
    pillActive: 'bg-orange-600 text-white border-orange-600 shadow-2xs',
    badge: 'bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-200 border-orange-300 dark:border-orange-800',
    ring: 'ring-orange-500/40',
    dot: 'bg-orange-500',
  },
  2: {
    pill: 'border-blue-200 dark:border-blue-800/70 text-blue-800 dark:text-blue-300',
    pillActive: 'bg-blue-600 text-white border-blue-600 shadow-2xs',
    badge: 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border-blue-300 dark:border-blue-800',
    ring: 'ring-blue-500/40',
    dot: 'bg-blue-500',
  },
  3: {
    pill: 'border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300',
    pillActive: 'bg-emerald-600 text-white border-emerald-600 shadow-2xs',
    badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
    ring: 'ring-emerald-500/40',
    dot: 'bg-emerald-500',
  },
  4: {
    pill: 'border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300',
    pillActive: 'bg-rose-600 text-white border-rose-600 shadow-2xs',
    badge: 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-800',
    ring: 'ring-rose-500/40',
    dot: 'bg-rose-500',
  },
};

interface MiniEvent {
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
  versions?: number[];
}

function layoutEvents<T extends { startMin: number; endMin: number }>(
  rawEvents: T[]
): (T & { column: number; totalColumns: number; hasOverlap: boolean })[] {
  if (rawEvents.length === 0) return [];

  const sorted = [...rawEvents].sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return b.endMin - a.endMin;
  });

  const clusters: T[][] = [];
  let currentCluster: T[] = [];
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

  const result: (T & { column: number; totalColumns: number; hasOverlap: boolean })[] = [];

  clusters.forEach(cluster => {
    const columnsEnd: number[] = [];
    const placed: { ev: T; col: number }[] = [];

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

interface ScheduleComparisonViewProps {
  versions: ScheduleVersionMeta[];
  activeVersion: number;
  termCourses: ScheduledCourse[];
  dictionary: any;
  locale: string;
  onSelectAndEditVersion: (versionId: number) => void;
  onEditCourseInVersion: (course: ScheduledCourse, versionId: number) => void;
  onCreateVersion: (duplicateFrom?: number) => void;
}

export function ScheduleComparisonView({
  versions,
  activeVersion,
  termCourses,
  dictionary,
  locale,
  onSelectAndEditVersion,
  onEditCourseInVersion,
  onCreateVersion,
}: ScheduleComparisonViewProps) {
  const isRtl = locale === 'he';
  const [selectedVersionIds, setSelectedVersionIds] = useState<number[]>(() =>
    versions.map(v => v.id)
  );
  const [gridViewMode, setGridViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');

  // Keep selectedVersionIds synced when new versions are added or deleted
  React.useEffect(() => {
    setSelectedVersionIds(prev => {
      const valid = prev.filter(id => versions.some(v => v.id === id));
      if (valid.length === 0) return versions.map(v => v.id);
      // If a new version was just created, include it automatically
      if (versions.length > valid.length) {
        return versions.map(v => v.id);
      }
      return valid;
    });
  }, [versions]);

  const toggleComparedVersion = (id: number) => {
    setSelectedVersionIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least 1 selected
        return prev.filter(x => x !== id);
      }
      return [...prev, id].sort((a, b) => a - b);
    });
  };

  const getVersionLabel = (v: ScheduleVersionMeta) => {
    const defaultLabel = `${dictionary.schedule.version} ${v.id}`;
    return v.name ? `${defaultLabel} (${v.name})` : defaultLabel;
  };

  const getShortVersionBadge = (vId: number) => {
    return `${dictionary.schedule.versionShort}${vId}`;
  };

  const comparedVersions = useMemo(
    () => versions.filter(v => selectedVersionIds.includes(v.id)),
    [versions, selectedVersionIds]
  );

  const coursesByVersion = useMemo(() => {
    const map: Record<number, ScheduledCourse[]> = {};
    versions.forEach(v => {
      map[v.id] = termCourses.filter(c => getCourseVersion(c) === v.id);
    });
    return map;
  }, [versions, termCourses]);

  const metricsByVersion = useMemo(() => {
    const map: Record<number, ReturnType<typeof computeScheduleVersionMetrics>> = {};
    versions.forEach(v => {
      map[v.id] = computeScheduleVersionMetrics(coursesByVersion[v.id] || []);
    });
    return map;
  }, [versions, coursesByVersion]);

  // Identify "optimal" metrics when comparing >= 2 non-empty versions
  const nonEmptyComparedIds = useMemo(
    () => comparedVersions.map(v => v.id).filter(id => (coursesByVersion[id]?.length || 0) > 0),
    [comparedVersions, coursesByVersion]
  );

  const minActiveDays = useMemo(() => {
    if (nonEmptyComparedIds.length < 2) return null;
    const vals = nonEmptyComparedIds.map(id => metricsByVersion[id].activeDays.length);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return min < max ? min : null;
  }, [nonEmptyComparedIds, metricsByVersion]);

  const minGapHours = useMemo(() => {
    if (nonEmptyComparedIds.length < 2) return null;
    const vals = nonEmptyComparedIds.map(id => metricsByVersion[id].gapHours);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return min < max ? min : null;
  }, [nonEmptyComparedIds, metricsByVersion]);

  const minOverlaps = useMemo(() => {
    if (nonEmptyComparedIds.length < 2) return null;
    const vals = nonEmptyComparedIds.map(id => metricsByVersion[id].overlapCount);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return min < max ? min : null;
  }, [nonEmptyComparedIds, metricsByVersion]);

  // Build unique courses list across compared versions for the diff matrix
  const courseDiffRows = useMemo(() => {
    const courseMap = new Map<
      string,
      {
        id: string;
        name: string;
        points: string;
        colorIndex: number;
        byVersion: Record<number, ScheduledCourse | undefined>;
      }
    >();

    comparedVersions.forEach(v => {
      (coursesByVersion[v.id] || []).forEach(c => {
        if (!courseMap.has(c.id)) {
          courseMap.set(c.id, {
            id: c.id,
            name: c.name,
            points: c.points,
            colorIndex: c.colorIndex,
            byVersion: {},
          });
        }
        courseMap.get(c.id)!.byVersion[v.id] = c;
      });
    });

    return Array.from(courseMap.values()).map(row => {
      const presentInCount = comparedVersions.filter(v => !!row.byVersion[v.id]).length;
      const isInAll = presentInCount === comparedVersions.length;
      const groupSignatures = comparedVersions
        .map(v => {
          const c = row.byVersion[v.id];
          if (!c) return '__MISSING__';
          return (c.selectedGroups || [])
            .map(g => `${g.type}:${g.id}`)
            .sort()
            .join('|');
        });
      const allSameSignature = groupSignatures.every(sig => sig === groupSignatures[0]);

      let status: 'same' | 'diff' | 'partial' = 'same';
      if (!isInAll) {
        status = 'partial';
      } else if (!allSameSignature) {
        status = 'diff';
      }

      return {
        ...row,
        status,
      };
    });
  }, [comparedVersions, coursesByVersion]);

  const hoursList = useMemo(() => {
    const arr: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      arr.push(h);
    }
    return arr;
  }, []);

  // Build events by day for each version (for side-by-side grids)
  const eventsByVersionAndDay = useMemo(() => {
    const result: Record<number, Record<string, MiniEvent[]>> = {};

    comparedVersions.forEach(v => {
      const rawByDay: Record<
        string,
        Omit<MiniEvent, 'column' | 'totalColumns' | 'hasOverlap'>[]
      > = {};
      DAYS.forEach(d => {
        rawByDay[d] = [];
      });

      (coursesByVersion[v.id] || []).forEach(course => {
        (course.selectedGroups || []).forEach(group => {
          (group.meetings || []).forEach((meeting, mIdx) => {
            const day = meeting.day;
            if (!rawByDay[day]) return;
            const startMin = timeToMinutes(meeting.startTime || (meeting as any).startHour);
            const endMin = timeToMinutes(meeting.endTime || (meeting as any).endHour);
            if (endMin <= startMin) return;
            rawByDay[day].push({
              uid: `${v.id}-${course.id}-${group.id}-${mIdx}`,
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

      const laidOut: Record<string, MiniEvent[]> = {};
      DAYS.forEach(d => {
        laidOut[d] = layoutEvents(rawByDay[d]);
      });
      result[v.id] = laidOut;
    });

    return result;
  }, [comparedVersions, coursesByVersion]);

  // Build merged overlay events by day (for Combined Overlay view)
  const overlayEventsByDay = useMemo(() => {
    const rawByDay: Record<
      string,
      Omit<MiniEvent, 'column' | 'totalColumns' | 'hasOverlap'>[]
    > = {};
    DAYS.forEach(d => {
      rawByDay[d] = [];
    });

    DAYS.forEach(day => {
      const mergedMap = new Map<
        string,
        Omit<MiniEvent, 'column' | 'totalColumns' | 'hasOverlap'>
      >();

      comparedVersions.forEach(v => {
        (coursesByVersion[v.id] || []).forEach(course => {
          (course.selectedGroups || []).forEach(group => {
            (group.meetings || []).forEach(meeting => {
              if (meeting.day !== day) return;
              const startMin = timeToMinutes(meeting.startTime || (meeting as any).startHour);
              const endMin = timeToMinutes(meeting.endTime || (meeting as any).endHour);
              if (endMin <= startMin) return;

              const key = `${course.id}__${group.id}__${day}__${startMin}__${endMin}`;
              if (!mergedMap.has(key)) {
                mergedMap.set(key, {
                  uid: key,
                  course,
                  group,
                  meeting,
                  day,
                  startMin,
                  endMin,
                  versions: [v.id],
                });
              } else {
                const existing = mergedMap.get(key)!;
                if (!existing.versions?.includes(v.id)) {
                  existing.versions = [...(existing.versions || []), v.id];
                }
              }
            });
          });
        });
      });

      rawByDay[day] = Array.from(mergedMap.values());
    });

    const result: Record<string, MiniEvent[]> = {};
    DAYS.forEach(d => {
      result[d] = layoutEvents(rawByDay[d]);
    });
    return result;
  }, [comparedVersions, coursesByVersion]);

  return (
    <div className="flex-1 max-w-[1520px] w-full mx-auto p-3.5 sm:p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. TOP CONTROL BAR FOR COMPARISON */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {dictionary.schedule.compareTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {dictionary.schedule.compareSubtitle}
          </p>
        </div>

        {/* Version Filter Chips & Quick Create */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 me-1">
            {dictionary.schedule.selectVersionsToCompare}
          </span>
          {versions.map(v => {
            const isSelected = selectedVersionIds.includes(v.id);
            const accent = VERSION_ACCENT_STYLES[v.id] || VERSION_ACCENT_STYLES[1];
            const count = coursesByVersion[v.id]?.length || 0;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => toggleComparedVersion(v.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                  isSelected
                    ? accent.pillActive
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                )}
              >
                <span>{getVersionLabel(v)}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {versions.length < MAX_SCHEDULE_VERSIONS && (
            <div className="flex items-center gap-1.5 ms-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onCreateVersion(activeVersion)}
                className="h-8 text-xs font-semibold gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{dictionary.schedule.duplicateVersion}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onCreateVersion(undefined)}
                className="h-8 text-xs font-semibold gap-1 border-dashed cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{dictionary.schedule.newVersion}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Prompt if only 1 version exists in this semester */}
      {versions.length === 1 && (
        <div className="bg-orange-50/70 dark:bg-orange-950/25 border border-orange-200/80 dark:border-orange-800/60 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>{dictionary.schedule.needTwoVersionsTitle}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {dictionary.schedule.needTwoVersionsDesc}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={() => onCreateVersion(activeVersion)}
              className="h-9 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{dictionary.schedule.duplicateVersion}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onCreateVersion(undefined)}
              className="h-9 text-xs font-semibold gap-1.5 bg-white dark:bg-slate-900 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{dictionary.schedule.newVersion}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2. VISUAL TIMETABLE COMPARISON (SIDE-BY-SIDE OR COMBINED OVERLAY) */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="inline-flex p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
            <button
              type="button"
              onClick={() => setGridViewMode('side-by-side')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                gridViewMode === 'side-by-side'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span>{dictionary.schedule.sideBySideView}</span>
            </button>
            <button
              type="button"
              onClick={() => setGridViewMode('overlay')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                gridViewMode === 'overlay'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{dictionary.schedule.overlayView}</span>
            </button>
          </div>

          {gridViewMode === 'overlay' && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {comparedVersions.map(v => {
                const accent = VERSION_ACCENT_STYLES[v.id] || VERSION_ACCENT_STYLES[1];
                return (
                  <div key={v.id} className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border',
                        accent.badge
                      )}
                    >
                      {getShortVersionBadge(v.id)}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {getVersionLabel(v)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {gridViewMode === 'side-by-side' ? (
          <div
            className={cn(
              'grid gap-5',
              comparedVersions.length === 1 ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'
            )}
          >
            {comparedVersions.map(v => {
              const accent = VERSION_ACCENT_STYLES[v.id] || VERSION_ACCENT_STYLES[1];
              const m = metricsByVersion[v.id];
              const dayMap = eventsByVersionAndDay[v.id] || {};

              return (
                <div
                  key={v.id}
                  className={cn(
                    'bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-2xs flex flex-col',
                    v.id === activeVersion
                      ? 'border-primary/60 ring-1 ring-primary/20'
                      : 'border-slate-200/90 dark:border-slate-800'
                  )}
                >
                  {/* Mini Timetable Header */}
                  <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', accent.dot)} />
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {getVersionLabel(v)}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({m.coursesCount} {dictionary.schedule.totalCourses} · {m.totalCredits}{' '}
                        {dictionary.schedule.totalCredits})
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={v.id === activeVersion ? 'secondary' : 'outline'}
                      onClick={() => onSelectAndEditVersion(v.id)}
                      className="h-7 px-2.5 text-xs font-semibold gap-1 cursor-pointer"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>{dictionary.schedule.switchToVersion}</span>
                    </Button>
                  </div>

                  {/* Mini 6-Day Grid */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[540px]">
                      <div className="grid grid-cols-[46px_repeat(6,1fr)] border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
                        <div className="p-1.5 text-center border-e border-slate-200/80 dark:border-slate-800 font-mono text-[10px] text-muted-foreground">
                          {isRtl ? 'שעה' : 'Hr'}
                        </div>
                        {DAYS.map(day => (
                          <div
                            key={day}
                            className="p-1.5 text-center border-e last:border-e-0 border-slate-200/80 dark:border-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-200"
                          >
                            {dictionary.schedule.daysShort[day]}
                          </div>
                        ))}
                      </div>

                      <div
                        className="relative grid grid-cols-[46px_repeat(6,1fr)]"
                        style={{ height: `${TOTAL_HOURS * MINI_HOUR_HEIGHT}px` }}
                      >
                        {/* Hours column */}
                        <div className="relative border-e border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 select-none">
                          {hoursList.slice(0, -1).map((hour, idx) => (
                            <div
                              key={hour}
                              className="absolute w-full text-center text-[10px] font-mono text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60 pt-0.5"
                              style={{
                                top: `${idx * MINI_HOUR_HEIGHT}px`,
                                height: `${MINI_HOUR_HEIGHT}px`,
                              }}
                            >
                              {String(hour).padStart(2, '0')}:00
                            </div>
                          ))}
                        </div>

                        {/* Day columns */}
                        {DAYS.map(day => {
                          const dayEvents = dayMap[day] || [];
                          return (
                            <div
                              key={day}
                              className="relative border-e last:border-e-0 border-slate-200/80 dark:border-slate-800"
                            >
                              {hoursList.slice(0, -1).map(hour => (
                                <div
                                  key={hour}
                                  className="w-full border-b border-slate-100 dark:border-slate-800/60"
                                  style={{ height: `${MINI_HOUR_HEIGHT}px` }}
                                />
                              ))}

                              {dayEvents.map(ev => {
                                const startOffsetMin = Math.max(0, ev.startMin - START_HOUR * 60);
                                const durationMin = Math.max(30, ev.endMin - ev.startMin);
                                const topPx = (startOffsetMin / 60) * MINI_HOUR_HEIGHT;
                                const heightPx = (durationMin / 60) * MINI_HOUR_HEIGHT;
                                const widthPct = 100 / ev.totalColumns;
                                const offsetPct = ev.column * widthPct;
                                const palette =
                                  COURSE_COLOR_PALETTE[
                                    ev.course.colorIndex % COURSE_COLOR_PALETTE.length
                                  ];

                                return (
                                  <div
                                    key={ev.uid}
                                    onClick={() => onEditCourseInVersion(ev.course, v.id)}
                                    style={{
                                      top: `${topPx + 1}px`,
                                      height: `${heightPx - 2}px`,
                                      width: `calc(${widthPct}% - 4px)`,
                                      [isRtl ? 'right' : 'left']: `calc(${offsetPct}% + 2px)`,
                                    }}
                                    className={cn(
                                      'absolute z-10 rounded border p-1 overflow-hidden cursor-pointer transition-all hover:z-30 hover:shadow-xs flex flex-col justify-between',
                                      palette.bg,
                                      palette.border,
                                      palette.text,
                                      ev.hasOverlap && 'ring-1 ring-amber-500 border-amber-500'
                                    )}
                                    title={`${ev.course.name} (${ev.group.type} #${ev.group.id})\n${ev.meeting.startTime}-${ev.meeting.endTime}`}
                                  >
                                    <div className="min-h-0 overflow-hidden">
                                      <div className="font-bold text-[10px] leading-tight line-clamp-2">
                                        {ev.course.name}
                                      </div>
                                      <div className="text-[9px] font-mono opacity-85 truncate">
                                        {ev.group.type} #{ev.group.id}
                                      </div>
                                    </div>
                                    {heightPx >= 42 && (
                                      <div
                                        dir="ltr"
                                        className="text-[9px] font-mono opacity-80 text-end shrink-0"
                                      >
                                        {ev.meeting.startTime}-{ev.meeting.endTime}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* COMBINED OVERLAY TIMETABLE */
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
                  <div className="p-2.5 text-center border-e border-slate-200/80 dark:border-slate-800 font-mono text-xs text-muted-foreground">
                    {isRtl ? 'שעה' : 'Time'}
                  </div>
                  {DAYS.map(day => (
                    <div
                      key={day}
                      className="p-2.5 text-center border-e last:border-e-0 border-slate-200/80 dark:border-slate-800 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                    >
                      {dictionary.schedule.days[day]}
                    </div>
                  ))}
                </div>

                <div
                  className="relative grid grid-cols-[60px_repeat(6,1fr)]"
                  style={{ height: `${TOTAL_HOURS * OVERLAY_HOUR_HEIGHT}px` }}
                >
                  {/* Hours column */}
                  <div className="relative border-e border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 select-none">
                    {hoursList.slice(0, -1).map((hour, idx) => (
                      <div
                        key={hour}
                        className="absolute w-full text-center text-[11px] font-mono text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60 pt-1"
                        style={{
                          top: `${idx * OVERLAY_HOUR_HEIGHT}px`,
                          height: `${OVERLAY_HOUR_HEIGHT}px`,
                        }}
                      >
                        {String(hour).padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {DAYS.map(day => {
                    const dayEvents = overlayEventsByDay[day] || [];
                    return (
                      <div
                        key={day}
                        className="relative border-e last:border-e-0 border-slate-200/80 dark:border-slate-800"
                      >
                        {hoursList.slice(0, -1).map(hour => (
                          <div
                            key={hour}
                            className="w-full border-b border-slate-100 dark:border-slate-800/60"
                            style={{ height: `${OVERLAY_HOUR_HEIGHT}px` }}
                          />
                        ))}

                        {dayEvents.map(ev => {
                          const startOffsetMin = Math.max(0, ev.startMin - START_HOUR * 60);
                          const durationMin = Math.max(30, ev.endMin - ev.startMin);
                          const topPx = (startOffsetMin / 60) * OVERLAY_HOUR_HEIGHT;
                          const heightPx = (durationMin / 60) * OVERLAY_HOUR_HEIGHT;
                          const widthPct = 100 / ev.totalColumns;
                          const offsetPct = ev.column * widthPct;
                          const palette =
                            COURSE_COLOR_PALETTE[
                              ev.course.colorIndex % COURSE_COLOR_PALETTE.length
                            ];
                          const evVersions = ev.versions || [1];
                          const isSharedInAll =
                            comparedVersions.length > 1 &&
                            evVersions.length === comparedVersions.length;

                          return (
                            <div
                              key={ev.uid}
                              onClick={() => onEditCourseInVersion(ev.course, evVersions[0])}
                              style={{
                                top: `${topPx + 2}px`,
                                height: `${heightPx - 4}px`,
                                width: `calc(${widthPct}% - 6px)`,
                                [isRtl ? 'right' : 'left']: `calc(${offsetPct}% + 3px)`,
                              }}
                              className={cn(
                                'absolute z-10 rounded-md border p-1.5 overflow-hidden cursor-pointer transition-all hover:z-30 hover:shadow-sm flex flex-col justify-between',
                                palette.bg,
                                palette.border,
                                palette.text,
                                !isSharedInAll && comparedVersions.length > 1 && 'border-dashed'
                              )}
                            >
                              <div className="space-y-0.5 min-h-0 overflow-hidden">
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-bold text-xs leading-tight line-clamp-2">
                                    {ev.course.name}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-0.5 shrink-0">
                                    {evVersions.map(vId => {
                                      const accent =
                                        VERSION_ACCENT_STYLES[vId] || VERSION_ACCENT_STYLES[1];
                                      return (
                                        <span
                                          key={vId}
                                          className={cn(
                                            'px-1 py-0.2 rounded text-[9px] font-mono font-bold border',
                                            accent.badge
                                          )}
                                        >
                                          {getShortVersionBadge(vId)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                                <span className="block font-mono text-[10px] opacity-85">
                                  {ev.group.type} #{ev.group.id}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] font-mono opacity-90 pt-0.5 border-t border-black/8 dark:border-white/10">
                                <span>
                                  {isSharedInAll
                                    ? isRtl
                                      ? 'משותף'
                                      : 'Shared'
                                    : ''}
                                </span>
                                <span dir="ltr">
                                  {ev.meeting.startTime}-{ev.meeting.endTime}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. SUMMARY METRICS COMPARISON CARDS */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 px-0.5">
          {dictionary.schedule.metricsComparison}
        </h3>
        <div
          className={cn(
            'grid gap-3.5',
            comparedVersions.length === 1 && 'grid-cols-1 max-w-md',
            comparedVersions.length === 2 && 'grid-cols-1 md:grid-cols-2',
            comparedVersions.length === 3 && 'grid-cols-1 md:grid-cols-3',
            comparedVersions.length >= 4 && 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
          )}
        >
          {comparedVersions.map(v => {
            const m = metricsByVersion[v.id];
            const accent = VERSION_ACCENT_STYLES[v.id] || VERSION_ACCENT_STYLES[1];
            const isBestDays =
              minActiveDays !== null &&
              m.coursesCount > 0 &&
              m.activeDays.length === minActiveDays;
            const isBestGaps =
              minGapHours !== null && m.coursesCount > 0 && m.gapHours === minGapHours;
            const isBestOverlaps =
              minOverlaps !== null && m.coursesCount > 0 && m.overlapCount === minOverlaps;

            return (
              <div
                key={v.id}
                className={cn(
                  'bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-2xs flex flex-col justify-between gap-3.5 transition-all',
                  v.id === activeVersion
                    ? 'border-primary/60 ring-1 ring-primary/20'
                    : 'border-slate-200/90 dark:border-slate-800'
                )}
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', accent.dot)} />
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {getVersionLabel(v)}
                    </span>
                    {v.id === activeVersion && (
                      <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0">
                        {dictionary.schedule.activeBadge}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectAndEditVersion(v.id)}
                    className="h-7 px-2 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1 shrink-0 cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>{dictionary.schedule.switchToVersion}</span>
                  </Button>
                </div>

                {/* Metrics rows */}
                <div className="space-y-2.5 text-xs">
                  {/* Courses & Credits */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {dictionary.schedule.totalCourses} / {dictionary.schedule.totalCredits}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {m.coursesCount} {dictionary.schedule.totalCourses} · {m.totalCredits}{' '}
                      {dictionary.schedule.totalCredits}
                    </span>
                  </div>

                  {/* Weekly Hours */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {dictionary.schedule.metricWeeklyHours}
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {m.totalWeeklyHours} {isRtl ? 'שעות' : 'hrs'}
                    </span>
                  </div>

                  {/* Campus Days */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      {dictionary.schedule.metricActiveDays}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isBestDays && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                          {dictionary.schedule.bestChoice}
                        </span>
                      )}
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {m.activeDays.length} {isRtl ? 'ימים' : 'days'}
                        {m.activeDays.length > 0 && (
                          <span className="text-muted-foreground font-normal ms-1">
                            ({m.activeDays.map(d => dictionary.schedule.daysShort[d]).join(', ')})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Free Days (Sun-Thu) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      {dictionary.schedule.metricFreeDays}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {m.freeWeekdays.length > 0 ? (
                        m.freeWeekdays.map(d => (
                          <span
                            key={d}
                            className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 font-semibold text-[11px]"
                          >
                            {dictionary.schedule.daysShort[d]}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">
                          {dictionary.schedule.allDaysActive}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Idle Gaps (Windows) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      {dictionary.schedule.metricGaps}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isBestGaps && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                          {dictionary.schedule.bestChoice}
                        </span>
                      )}
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {m.gapHours === 0
                          ? dictionary.schedule.noGaps
                          : `${m.gapHours} ${isRtl ? 'שעות' : 'hrs'}`}
                      </span>
                    </div>
                  </div>

                  {/* Time Conflicts */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      {dictionary.schedule.metricOverlaps}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isBestOverlaps && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                          {dictionary.schedule.bestChoice}
                        </span>
                      )}
                      {m.overlapCount === 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{dictionary.schedule.noConflicts}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>
                            {m.overlapCount} {dictionary.schedule.overlapWarning}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Daily Hours Span */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {dictionary.schedule.metricHoursRange}
                    </span>
                    <span dir="ltr" className="font-mono text-slate-700 dark:text-slate-300">
                      {m.earliestStart && m.latestEnd
                        ? `${m.earliestStart} – ${m.latestEnd}`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. COURSE & GROUP DIFFERENCES MATRIX */}
      {courseDiffRows.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {dictionary.schedule.coursesComparison}
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {courseDiffRows.length} {dictionary.schedule.totalCourses}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-4 text-start font-semibold w-64">
                    {isRtl ? 'קורס' : 'Course'}
                  </th>
                  <th className="py-2.5 px-3 text-start font-semibold w-32">
                    {isRtl ? 'סטטוס השוואה' : 'Status'}
                  </th>
                  {comparedVersions.map(v => {
                    const accent = VERSION_ACCENT_STYLES[v.id] || VERSION_ACCENT_STYLES[1];
                    return (
                      <th key={v.id} className="py-2.5 px-4 text-start font-semibold">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={cn('w-2 h-2 rounded-full', accent.dot)} />
                          <span className="text-slate-900 dark:text-slate-100">
                            {getVersionLabel(v)}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {courseDiffRows.map(row => {
                  const palette =
                    COURSE_COLOR_PALETTE[row.colorIndex % COURSE_COLOR_PALETTE.length];
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-950/40',
                        row.status !== 'same' && 'bg-amber-50/20 dark:bg-amber-950/10'
                      )}
                    >
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              'w-fit font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded border',
                              palette.codeChip
                            )}
                          >
                            {row.id}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                            {row.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top">
                        {row.status === 'same' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {dictionary.schedule.diffStatusSame}
                          </span>
                        )}
                        {row.status === 'diff' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {dictionary.schedule.diffStatusDiff}
                          </span>
                        )}
                        {row.status === 'partial' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            {dictionary.schedule.diffStatusPartial}
                          </span>
                        )}
                      </td>

                      {comparedVersions.map(v => {
                        const courseInVer = row.byVersion[v.id];
                        if (!courseInVer) {
                          return (
                            <td key={v.id} className="py-3 px-4 align-top text-muted-foreground italic">
                              {dictionary.schedule.notInVersion}
                            </td>
                          );
                        }
                        return (
                          <td key={v.id} className="py-3 px-4 align-top">
                            <div className="flex flex-wrap gap-1.5">
                              {(courseInVer.selectedGroups || []).length > 0 ? (
                                courseInVer.selectedGroups.map(g => (
                                  <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => onEditCourseInVersion(courseInVer, v.id)}
                                    className={cn(
                                      'text-start px-2 py-1 rounded-md border text-[11px] transition-all cursor-pointer hover:shadow-2xs',
                                      palette.bg,
                                      palette.border,
                                      palette.text
                                    )}
                                    title={dictionary.schedule.editInSchedule}
                                  >
                                    <div className="font-semibold">
                                      {g.type} #{g.id}
                                    </div>
                                    {g.meetings && g.meetings.length > 0 && (
                                      <div className="text-[10px] opacity-85 font-mono">
                                        {g.meetings
                                          .map(
                                            m =>
                                              `${dictionary.schedule.daysShort[m.day] || m.day} ${m.startTime}-${m.endTime}`
                                          )
                                          .join(', ')}
                                      </div>
                                    )}
                                  </button>
                                ))
                              ) : (
                                <span className="text-muted-foreground">
                                  {dictionary.schedule.noMeetings}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
