import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDepartmentCoursesFromDB } from '@/lib/courses';
import { ArrowLeft, BookOpen, ChevronLeft, Filter, Search } from 'lucide-react';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';

export default async function DepartmentPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ dept: string }>,
  searchParams: Promise<{ deg?: string, year?: string, sem?: string }>
}) {
  const { dept } = await params;
  const sParams = await searchParams;
  
  const degree = sParams.deg || '1';
  const year = sParams.year || '2026';
  const semester = sParams.sem || '2';

  const courses = await getDepartmentCoursesFromDB(dept, degree, year, semester);
  
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      {/* Sleek Header */}
      <header className="sticky top-0 z-50 w-full border-b dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container max-w-6xl h-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group">
              <ArrowLeft className={`h-6 w-6 text-slate-600 dark:text-slate-400 group-hover:text-primary ${locale === 'he' ? 'rotate-180' : ''}`} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{dictionary.department.title} {dept}</h1>
              <p className="text-sm text-muted-foreground mt-1">{dictionary.department.semesterPrefix} {semester} | {dictionary.department.yearPrefix} {year}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="secondary" className="px-3 py-1 font-bold">
                {courses.length} {dictionary.department.coursesFound}
             </Badge>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar / Filters (Placeholder) */}
          <aside className="hidden lg:block space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Filter className="h-4 w-4" />
                {dictionary.department.filterResults}
              </h3>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{dictionary.department.degree}</label>
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/departments/${dept}?deg=1&year=${year}&sem=${semester}`}>
                          <Badge variant={degree === '1' ? 'default' : 'outline'} className={degree === '1' ? 'bg-primary hover:bg-primary cursor-pointer' : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'}>
                            {dictionary.department.bachelor}
                          </Badge>
                        </Link>
                        <Link href={`/departments/${dept}?deg=2&year=${year}&sem=${semester}`}>
                          <Badge variant={degree === '2' ? 'default' : 'outline'} className={degree === '2' ? 'bg-primary hover:bg-primary cursor-pointer' : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'}>
                            {dictionary.department.master}
                          </Badge>
                        </Link>
                    </div>
                 </div>
                 <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{dictionary.department.yearPrefix || 'Year'}</label>
                    <div className="flex flex-wrap gap-2">
                        {[2026, 2025, 2024, 2023].map(y => (
                          <Link key={y} href={`/departments/${dept}?deg=${degree}&year=${y}&sem=${semester}`}>
                            <Badge variant={y.toString() === year ? 'default' : 'outline'} className={y.toString() === year ? 'bg-primary hover:bg-primary cursor-pointer' : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'}>
                              {y}
                            </Badge>
                          </Link>
                        ))}
                    </div>
                 </div>
                 <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{dictionary.department.semesterPrefix || 'Semester'}</label>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map(s => (
                          <Link key={s} href={`/departments/${dept}?deg=${degree}&year=${year}&sem=${s}`}>
                            <Badge variant={s.toString() === semester ? 'default' : 'outline'} className={s.toString() === semester ? 'bg-primary hover:bg-primary cursor-pointer' : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'}>
                              {s}
                            </Badge>
                          </Link>
                        ))}
                    </div>
                 </div>
              </div>
            </div>
          </aside>

          {/* Course Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
              {courses.map((course: any, i: number) => (
                <Link 
                  key={course.id} 
                  href={`/courses/${course.id.split('.').pop()}?dept=${dept}&deg=${degree}&year=${year}&sem=${semester}`}
                  className="block h-full group"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden bg-white dark:bg-slate-900">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary transition-colors" />
                    <CardHeader className="p-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border dark:border-slate-800">
                          {course.id}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-700">
                          {course.activeIn}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-black leading-tight text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                        {course.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                      <div className="flex items-center justify-between text-primary font-bold text-sm">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 opacity-50" />
                            <span>{dictionary.department.courseDetails}</span>
                        </div>
                        <ChevronLeft className={`h-5 w-5 transition-transform group-hover:-translate-x-1 ${locale === 'he' ? '' : 'rotate-180 group-hover:translate-x-1'}`} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {courses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center px-6">
                <div className="h-20 w-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-6">
                    <Search className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">{dictionary.department.noCoursesTitle}</h3>
                <p className="text-muted-foreground max-w-sm">{dictionary.department.noCoursesDesc}</p>
                <Link href="/" className="mt-8">
                    <Button variant="outline" className="rounded-xl px-8 h-12 font-bold">{dictionary.department.backToSearch}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
