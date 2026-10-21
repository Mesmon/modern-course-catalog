"use client";

import { Course } from '@/lib/courses';
import { useDictionary } from '@/components/providers/DictionaryProvider';
import { CopyCourseId } from '@/components/CopyCourseId';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
  isLoading?: boolean;
}

export function CourseCard({ course, isLoading = false }: CourseCardProps) {
  const parts = course.id.split('.');
  const deptId = parts[0] || '202';
  const degreeId = parts[1] || '1';
  const { dictionary, locale } = useDictionary();
  const isRtl = locale !== 'en';

  return (
    <div
      className={cn(
        'group h-full flex flex-col justify-between rounded-xl border bg-white dark:bg-slate-900 p-4 sm:p-5 transition-all',
        isLoading
          ? 'border-primary ring-2 ring-primary/15 bg-orange-50/20 dark:bg-orange-950/15'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-primary/60 dark:hover:border-primary/60'
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <CopyCourseId
            id={course.id}
            className="font-mono text-xs font-semibold text-primary bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800/60 px-2 py-0.5 rounded hover:bg-orange-100/80 dark:hover:bg-orange-900/50 transition-colors"
            iconClassName="h-3 w-3"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {degreeId === '2' ? dictionary.department.master : dictionary.department.bachelor}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              #{deptId}
            </span>
          </div>
        </div>

        <h3 className="text-sm sm:text-base font-bold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-2">
          {course.name}
        </h3>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-muted-foreground">
        {isLoading ? (
          <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span>{isRtl ? 'טוען נתוני קורס...' : 'Loading course...'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>
              {dictionary.course.availableIn}:{' '}
              <strong className="font-mono font-semibold text-foreground">{course.activeIn}</strong>
            </span>
          </span>
        )}
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
        ) : (
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors" />
        )}
      </div>
    </div>
  );
}
