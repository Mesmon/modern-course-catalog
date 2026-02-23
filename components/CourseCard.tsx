"use client";

import { Course } from '@/lib/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDictionary } from '@/components/providers/DictionaryProvider';
import { CopyCourseId } from '@/components/CopyCourseId';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const deptId = course.id.split('.')[0];
  const { dictionary, locale } = useDictionary();
  
  return (
    <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-sm" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <CardHeader className="pb-3 gap-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold leading-tight break-words pl-2 text-slate-900 dark:text-slate-100">{course.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0 font-mono tracking-wider">{deptId}</Badge>
        </div>
        <CopyCourseId id={course.id} className="font-mono text-sm text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 w-fit px-2 py-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/80" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-900/50 w-fit px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          {dictionary.course.availableIn}: {course.activeIn}
        </div>
      </CardContent>
    </Card>
  );
}

