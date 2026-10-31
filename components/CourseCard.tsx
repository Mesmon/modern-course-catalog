"use client";

import { Course } from '@/lib/courses';
import { useDictionary } from '@/components/providers/DictionaryProvider';
import { CopyCourseId } from '@/components/CopyCourseId';
import { CourseRefetchButton } from '@/components/CourseRefetchButton';
import { MIN_ACADEMIC_YEAR } from '@/lib/schedule';
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
  const shortId = parts[2] || course.id;
  const activeParts = course.activeIn ? course.activeIn.split('-') : [];
  const rawYear = Number(activeParts[0] || '2027');
  const year = Number.isFinite(rawYear) && rawYear >= MIN_ACADEMIC_YEAR ? String(rawYear) : '2027';
  const semester = activeParts[1] || '1';
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
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CopyCourseId
            id={course.id}
            className="font-mono text-xs font-semibold text-primary bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/50 px-2 py-0.5 rounded hover:bg-orange-100/80 dark:hover:bg-orange-900/50 transition-colors"
            iconClassName="h-3 w-3"
          />
          <span className="text-[11px] text-muted-foreground font-medium truncate">
            {degreeId === '2' ? dictionary.department.master : dictionary.department.bachelor}
            {course.activeIn ? (
              <span className="font-mono ms-1.5 text-slate-500 dark:text-slate-400">
                · {course.activeIn}
              </span>
            ) : null}
          </span>
        </div>

        <h3 className="text-sm sm:text-base font-bold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-2">
          {course.name}
        </h3>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        {isLoading ? (
          <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span>{isRtl ? 'טוען נתוני קורס...' : 'Loading course...'}</span>
          </span>
        ) : (
          <div className="opacity-80 group-hover:opacity-100 transition-opacity min-w-0">
            <CourseRefetchButton
              courseId={shortId}
              dept={deptId}
              degree={degreeId}
              year={year}
              semester={semester}
              lastUpdated={(course as any).lastUpdated}
              variant="compact"
              dictionary={dictionary}
              locale={locale}
            />
          </div>
        )}
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
        ) : (
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors shrink-0" />
        )}
      </div>
    </div>
  );
}
