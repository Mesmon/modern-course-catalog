"use client";

import { Course } from '@/lib/courses';
import { Badge } from '@/components/ui/badge';
import { useDictionary } from '@/components/providers/DictionaryProvider';
import { CopyCourseId } from '@/components/CopyCourseId';
import { ArrowUpRight } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const deptId = course.id.split('.')[0];
  const { dictionary, locale } = useDictionary();

  return (
    <div
      className="group h-full flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all"
      dir={locale === 'en' ? 'ltr' : 'rtl'}
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <CopyCourseId
            id={course.id}
            className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700/80"
          />
          <Badge variant="outline" className="shrink-0 font-mono text-[11px] font-medium text-muted-foreground border-slate-200 dark:border-slate-800">
            {dictionary.department.title} {deptId}
          </Badge>
        </div>

        <h3 className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-2">
          {course.name}
        </h3>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>
            {dictionary.course.availableIn}: <strong className="font-medium text-foreground">{course.activeIn}</strong>
          </span>
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
      </div>
    </div>
  );
}
