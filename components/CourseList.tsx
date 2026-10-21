'use client';

import { CourseCard } from '@/components/CourseCard';
import { useAllCourses } from '@/hooks/useCourses';
import { useDictionary } from '@/components/providers/DictionaryProvider';
import { Loader2, Library } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export function CourseList() {
  const { data: courses, isLoading, error } = useAllCourses();
  const { dictionary, locale } = useDictionary();
  const isRtl = locale === 'he';
  const [isMounted, setIsMounted] = useState(false);
  const [degreeFilter, setDegreeFilter] = useState<'all' | '1' | '2'>('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    if (degreeFilter === 'all') return courses;
    return courses.filter(c => {
      const deg = (c as any).params?.degree || c.id.split('.')[1] || '1';
      return String(deg) === degreeFilter;
    });
  }, [courses, degreeFilter]);

  if (isLoading || !isMounted) {
    return (
      <div className="flex justify-center items-center py-20 col-span-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !courses) {
    return (
      <div className="text-center py-20 text-red-500 col-span-full font-bold">
        Failed to load courses. Please try again later.
      </div>
    );
  }

  return (
    <div className="col-span-full space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Section Header & Degree Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/90 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <Library className="h-4.5 w-4.5 text-primary shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {dictionary.home.fullCatalog}
          </h2>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/50 text-primary border border-orange-200/70 dark:border-orange-800/60">
            {filteredCourses.length}
          </span>
        </div>

        <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
          {[
            { id: 'all' as const, label: isRtl ? 'כל הקורסים' : 'All Courses' },
            { id: '1' as const, label: dictionary.department.bachelor },
            { id: '2' as const, label: dictionary.department.master },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDegreeFilter(tab.id)}
              className={cn(
                'px-3 py-1 rounded-md font-semibold transition-all cursor-pointer',
                degreeFilter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
          {dictionary.department.noCoursesTitle}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => {
            const parts = course.id.split('.');
            const dept = (course as any).params?.dept || parts[0] || '202';
            const degree = (course as any).params?.degree || parts[1] || '1';
            const cId = (course as any).params?.course || parts[2] || course.id;
            const activeParts = course.activeIn ? course.activeIn.split('-') : [];
            const latestOffering = (course as any).offerings?.[0];
            const year = (course as any).params?.year || latestOffering?.year || activeParts[0] || '2027';
            const semester = (course as any).params?.semester || latestOffering?.semester || activeParts[1] || '1';

            return (
              <Link
                key={course.id}
                href={`/courses/${cId}?dept=${dept}&deg=${degree}&year=${year}&sem=${semester}`}
                className="block"
              >
                <CourseCard course={course} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
