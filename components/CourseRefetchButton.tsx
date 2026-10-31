'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { CourseDetail } from '@/types/course';
import {
  formatLastFetchedDate,
  isScheduledCourseStale,
  syncRefetchedCourseToSchedule,
} from '@/lib/schedule';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CourseRefetchButtonProps {
  courseId: string;
  dept: string;
  degree: string;
  year: string;
  semester: string;
  lastUpdated?: string | Date | null;
  isStale?: boolean;
  autoRefetchIfStale?: boolean;
  refreshRouter?: boolean;
  variant?: 'default' | 'compact' | 'inline';
  dictionary: any;
  locale: string;
  onRefetched?: (detail: CourseDetail) => void;
  className?: string;
}

export function CourseRefetchButton({
  courseId,
  dept,
  degree,
  year,
  semester,
  lastUpdated,
  isStale,
  autoRefetchIfStale = false,
  refreshRouter = false,
  variant = 'default',
  dictionary,
  locale,
  onRefetched,
  className,
}: CourseRefetchButtonProps) {
  const router = useRouter();
  const [isRefetching, setIsRefetching] = useState(false);
  const [isBackgroundUpdating, setIsBackgroundUpdating] = useState(false);
  const [currentLastUpdated, setCurrentLastUpdated] = useState<string | Date | null | undefined>(
    lastUpdated
  );
  const [isMounted, setIsMounted] = useState(false);
  const autoTriggeredRef = useRef<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setCurrentLastUpdated(lastUpdated);
  }, [lastUpdated]);

  const performRefetch = useCallback(
    async (isBackground: boolean) => {
      if (isRefetching || isBackgroundUpdating) return;
      if (isBackground) {
        setIsBackgroundUpdating(true);
      } else {
        setIsRefetching(true);
      }

      try {
        const res = await fetch(
          `/api/courses/${encodeURIComponent(courseId)}?dept=${encodeURIComponent(dept)}&degree=${encodeURIComponent(degree)}&year=${encodeURIComponent(year)}&semester=${encodeURIComponent(semester)}&refresh=1`,
          { cache: 'no-store' }
        );
        if (!res.ok) {
          if (!isBackground) {
            toast.error(dictionary?.common?.error || 'Error');
          }
          return;
        }

        const detail: CourseDetail = await res.json();
        const freshTs = detail.lastUpdated || new Date().toISOString();
        setCurrentLastUpdated(freshTs);

        const { updatedInSchedule, groupsChanged } = syncRefetchedCourseToSchedule(detail, {
          courseId,
          dept,
          degree,
          year,
          semester,
        });

        onRefetched?.(detail);

        if (refreshRouter) {
          router.refresh();
        }

        if (!isBackground) {
          toast.success(
            updatedInSchedule
              ? dictionary?.course?.refetchUpdatedScheduleToast ||
                  dictionary?.course?.refetchSuccessToast
              : dictionary?.course?.refetchSuccessToast
          );
        } else if (updatedInSchedule && groupsChanged) {
          toast.info(
            dictionary?.course?.refetchUpdatedScheduleToast ||
              dictionary?.course?.refetchSuccessToast
          );
        }
      } catch (err) {
        console.error('Failed to refetch course:', err);
        if (!isBackground) {
          toast.error(dictionary?.common?.error || 'Error');
        }
      } finally {
        setIsRefetching(false);
        setIsBackgroundUpdating(false);
      }
    },
    [
      courseId,
      dept,
      degree,
      year,
      semester,
      isRefetching,
      isBackgroundUpdating,
      dictionary,
      onRefetched,
      refreshRouter,
      router,
    ]
  );

  // Automatic background refetch when course data is stale
  useEffect(() => {
    if (!autoRefetchIfStale) return;
    const key = `${dept}.${degree}.${courseId}-${year}-${semester}`;
    if (autoTriggeredRef.current === key) return;

    const stale = isStale ?? isScheduledCourseStale(currentLastUpdated);
    if (stale) {
      autoTriggeredRef.current = key;
      performRefetch(true);
    }
  }, [
    autoRefetchIfStale,
    dept,
    degree,
    courseId,
    year,
    semester,
    isStale,
    currentLastUpdated,
    performRefetch,
  ]);

  const formattedDate = isMounted
    ? formatLastFetchedDate(currentLastUpdated, locale)
    : null;

  const busy = isRefetching || isBackgroundUpdating;

  if (variant === 'compact') {
    return (
      <div
        className={cn('inline-flex items-center gap-1.5 text-[11px] text-muted-foreground', className)}
        onClick={e => e.stopPropagation()}
      >
        <span className="inline-flex items-center gap-1 truncate" title={dictionary?.course?.lastFetched}>
          <Clock className="h-3 w-3 shrink-0 opacity-70" />
          <span className="font-mono">
            {isBackgroundUpdating
              ? dictionary?.course?.autoRefetchingStale
              : formattedDate || dictionary?.course?.neverFetched}
          </span>
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            performRefetch(false);
          }}
          title={dictionary?.course?.refetchCourse}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={cn('h-3 w-3', busy && 'animate-spin text-primary')} />
        </button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn('flex items-center justify-between gap-2 text-xs', className)}
        onClick={e => e.stopPropagation()}
      >
        <span className="text-muted-foreground flex items-center gap-1.5 min-w-0">
          <Clock className="h-3.5 w-3.5 text-primary/80 shrink-0" />
          <span className="truncate">
            {dictionary?.course?.lastFetched}:{' '}
            <strong className="font-mono font-medium text-foreground">
              {isBackgroundUpdating
                ? dictionary?.course?.autoRefetchingStale
                : formattedDate || dictionary?.course?.neverFetched}
            </strong>
          </span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            performRefetch(false);
          }}
          className="h-7 px-2.5 text-xs font-semibold gap-1.5 rounded-lg shrink-0 cursor-pointer"
        >
          <RefreshCw className={cn('h-3 w-3', busy && 'animate-spin text-primary')} />
          <span>
            {isRefetching
              ? dictionary?.course?.refetchingCourse
              : dictionary?.course?.refetchCourse}
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn('inline-flex flex-wrap items-center gap-2', className)}
      onClick={e => e.stopPropagation()}
    >
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 px-2.5 py-1 rounded-lg">
        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>{dictionary?.course?.lastFetched}:</span>
        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
          {isBackgroundUpdating
            ? dictionary?.course?.autoRefetchingStale
            : formattedDate || dictionary?.course?.neverFetched}
        </span>
      </span>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          performRefetch(false);
        }}
        className="rounded-lg h-9 px-3 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 cursor-pointer"
      >
        <RefreshCw className={cn('h-3.5 w-3.5 text-primary', busy && 'animate-spin')} />
        <span>
          {isRefetching
            ? dictionary?.course?.refetchingCourse
            : dictionary?.course?.refetchCourse}
        </span>
      </Button>
    </div>
  );
}
