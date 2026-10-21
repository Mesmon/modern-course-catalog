import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getDepartmentCoursesFromDB } from '@/lib/courses';
import { ArrowLeft, BookOpen, ChevronLeft, Filter, Search } from 'lucide-react';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { cn } from '@/lib/utils';
import { getAvailableAcademicYears, MIN_ACADEMIC_YEAR } from '@/lib/schedule';

export default async function DepartmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ dept: string }>;
  searchParams: Promise<{ deg?: string; year?: string; sem?: string }>;
}) {
  const { dept } = await params;
  const sParams = await searchParams;

  const degree = sParams.deg || '1';
  const rawYear = Number(sParams.year || '2027');
  const year = Number.isFinite(rawYear) && rawYear >= MIN_ACADEMIC_YEAR ? String(rawYear) : '2027';
  const semester = sParams.sem || '1';
  const availableYears = getAvailableAcademicYears();

  const courses = await getDepartmentCoursesFromDB(dept, degree, year, semester);

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const isRtl = locale === 'he';
  const dictionary = getDictionary(locale);

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
        {/* Breadcrumb + Page Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-primary hover:text-primary transition-colors shrink-0"
              aria-label={dictionary.department.back}
            >
              <ArrowLeft className={cn('h-4 w-4', isRtl && 'rotate-180')} />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-semibold text-primary bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/60 px-2 py-0.5 rounded">
                  #{dept}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {dictionary.department.title} {dept}
                </h1>
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {courses.length} {dictionary.department.coursesFound}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dictionary.department.degree}:{' '}
                <strong className="font-medium text-foreground">
                  {degree === '2' ? dictionary.department.master : dictionary.department.bachelor}
                </strong>{' '}
                · {dictionary.department.semesterPrefix} {semester} · {dictionary.department.yearPrefix}{' '}
                <span className="font-mono">{year}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6 items-start">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 lg:sticky lg:top-20 space-y-3">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <Filter className="h-3.5 w-3.5 text-primary" />
                <span>{dictionary.department.filterResults}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground block">
                  {dictionary.department.degree}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    href={`/departments/${dept}?deg=1&year=${year}&sem=${semester}`}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center border transition-colors',
                      degree === '1'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-slate-50/70 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    {dictionary.department.bachelor}
                  </Link>
                  <Link
                    href={`/departments/${dept}?deg=2&year=${year}&sem=${semester}`}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center border transition-colors',
                      degree === '2'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-slate-50/70 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    {dictionary.department.master}
                  </Link>
                </div>
              </div>

              <div className="space-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-semibold text-muted-foreground block">
                  {dictionary.department.yearPrefix || 'Year'}
                </label>
                <div className={cn('grid gap-1.5', availableYears.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                  {availableYears.map((y) => {
                    const active = y === year;
                    return (
                      <Link
                        key={y}
                        href={`/departments/${dept}?deg=${degree}&year=${y}&sem=${semester}`}
                        className={cn(
                          'px-2 py-1.5 rounded-lg font-mono text-xs font-semibold text-center border transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-slate-50/70 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:text-foreground'
                        )}
                      >
                        {y}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-semibold text-muted-foreground block">
                  {dictionary.department.semesterPrefix || 'Semester'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((s) => {
                    const active = s.toString() === semester;
                    return (
                      <Link
                        key={s}
                        href={`/departments/${dept}?deg=${degree}&year=${year}&sem=${s}`}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center border transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-slate-50/70 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:text-foreground'
                        )}
                      >
                        {(dictionary.schedule?.semesters as Record<string, string>)?.[String(s)] || s}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Course Grid */}
          <div className="lg:col-span-3">
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id.split('.').pop()}?dept=${dept}&deg=${degree}&year=${year}&sem=${semester}`}
                    className="group flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:border-primary/60 transition-colors"
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800/60 px-2 py-0.5 rounded">
                          {course.id}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                          {course.activeIn}
                        </span>
                      </div>
                      <h2 className="text-base font-bold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                        {course.name}
                      </h2>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                        <span>{dictionary.department.courseDetails}</span>
                      </span>
                      <ChevronLeft
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isRtl ? 'group-hover:-translate-x-0.5' : 'rotate-180 group-hover:translate-x-0.5'
                        )}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-6">
                <div className="h-11 w-11 bg-orange-50 dark:bg-orange-950/50 border border-orange-200/70 dark:border-orange-800/60 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {dictionary.department.noCoursesTitle}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                  {dictionary.department.noCoursesDesc}
                </p>
                <Link href="/" className="mt-5">
                  <Button variant="outline" size="sm" className="rounded-lg font-semibold text-xs">
                    {dictionary.department.backToSearch}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
