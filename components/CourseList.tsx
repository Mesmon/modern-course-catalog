'use client';

import { CourseCard } from '@/components/CourseCard';
import { useAllCourses } from '@/hooks/useCourses';
import { useDictionary } from '@/components/providers/DictionaryProvider';
import { Loader2, Search, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useTransition } from 'react';
import { MIN_ACADEMIC_YEAR } from '@/lib/schedule';
import { cn } from '@/lib/utils';

const INITIAL_VISIBLE_COUNT = 9;
const PAGE_STEP = 18;

export function CourseList() {
  const { data: courses, isLoading, error } = useAllCourses();
  const { dictionary, locale } = useDictionary();
  const isRtl = locale === 'he';
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [degreeFilter, setDegreeFilter] = useState<'all' | '1' | '2'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    const q = searchFilter.trim().toLowerCase();
    return courses.filter(c => {
      if (degreeFilter !== 'all') {
        const deg = (c as any).params?.degree || c.id.split('.')[1] || '1';
        if (String(deg) !== degreeFilter) return false;
      }
      if (q) {
        return (
          c.id.toLowerCase().includes(q) ||
          (c.name && c.name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [courses, degreeFilter, searchFilter]);

  const displayedCourses = useMemo(
    () => filteredCourses.slice(0, visibleCount),
    [filteredCourses, visibleCount]
  );
  const remainingCount = Math.max(0, filteredCourses.length - displayedCourses.length);

  if (isLoading || !isMounted) {
    return (
      <div className="col-span-full space-y-5" dir={isRtl ? 'rtl' : 'ltr'} aria-busy="true">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/90 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <Loader2 className="h-4.5 w-4.5 animate-spin text-primary shrink-0" />
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {isRtl ? 'טוען קטלוג קורסים...' : 'Loading course catalog...'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 rounded bg-orange-100 dark:bg-orange-950/50" />
                <div className="h-4 w-16 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3.5 w-1/3 rounded bg-slate-100 dark:bg-slate-800 pt-2" />
            </div>
          ))}
        </div>
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
    <div className="col-span-full space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Section Header, Inline Filter Input & Degree Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {dictionary.home.fullCatalog}
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            ({filteredCourses.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => {
                setSearchFilter(e.target.value);
                setVisibleCount(INITIAL_VISIBLE_COUNT);
              }}
              placeholder={dictionary.department.filters.search}
              className="h-8 w-44 sm:w-56 ps-8 pe-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
            {[
              { id: 'all' as const, label: isRtl ? 'הכל' : 'All' },
              { id: '1' as const, label: dictionary.department.bachelor },
              { id: '2' as const, label: dictionary.department.master },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setDegreeFilter(tab.id);
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                }}
                className={cn(
                  'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer',
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
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-14 text-sm text-muted-foreground border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
          {dictionary.department.noCoursesTitle}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayedCourses.map((course, idx) => {
              const parts = course.id.split('.');
              const dept = (course as any).params?.dept || parts[0] || '202';
              const degree = (course as any).params?.degree || parts[1] || '1';
              const cId = (course as any).params?.course || parts[2] || course.id;
              const activeParts = course.activeIn ? course.activeIn.split('-') : [];
              const latestOffering = (course as any).offerings?.[0];
              const rawYear = (course as any).params?.year || latestOffering?.year || activeParts[0] || '2027';
              const year = Number(rawYear) >= MIN_ACADEMIC_YEAR ? String(rawYear) : '2027';
              const semester = (course as any).params?.semester || latestOffering?.semester || activeParts[1] || '1';
              const isCardLoading = isNavigating && loadingCourseId === course.id;

              return (
                <div
                  key={course.id}
                  style={
                    idx >= INITIAL_VISIBLE_COUNT
                      ? { contentVisibility: 'auto', containIntrinsicSize: 'auto none auto 136px' }
                      : undefined
                  }
                  onClick={() => {
                    setLoadingCourseId(course.id);
                    startTransition(() => {
                      router.push(`/courses/${cId}?dept=${dept}&deg=${degree}&year=${year}&sem=${semester}`);
                    });
                  }}
                  className="block relative cursor-pointer"
                >
                  <CourseCard course={course} isLoading={isCardLoading} />
                </div>
              );
            })}
          </div>

          {remainingCount > 0 && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + PAGE_STEP)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/60 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer shadow-2xs"
              >
                <span>
                  {isRtl
                    ? `הצג עוד קורסים (${remainingCount} נוספים)`
                    : `Show more courses (${remainingCount} more)`}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
