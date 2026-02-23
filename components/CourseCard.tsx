"use client";

import { Course } from '@/lib/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDictionary } from '@/components/providers/DictionaryProvider';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const deptId = course.id.split('.')[0];
  const { dictionary, locale } = useDictionary();
  
  return (
    <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <CardHeader className="pb-3 gap-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold leading-tight break-words pl-2 text-slate-900">{course.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0 font-mono tracking-wider">{deptId}</Badge>
        </div>
        <CardDescription className="font-mono text-sm text-slate-500 bg-slate-100/80 w-fit px-2 py-0.5 rounded-md">
          {course.id}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
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

