import { getCourseDetailFromDB } from '@/lib/courses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  ArrowLeft,
  Clock,
  Award,
  BookOpen,
  GraduationCap,
  Download,
  Info,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { notFound, redirect } from 'next/navigation';
import { CopyCourseId } from '@/components/CopyCourseId';
import { AddToScheduleButton } from '@/components/AddToScheduleButton';
import { cn } from '@/lib/utils';

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dept?: string; deg?: string; year?: string; sem?: string }>;
}) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const isRtl = locale === 'he';
  const dictionary = getDictionary(locale);

  const { id } = await params;
  const sParams = await searchParams;

  const deptParam = sParams.dept || '202';
  const degParam = sParams.deg || '1';
  const reqYear = sParams.year || '2027';
  const reqSem = sParams.sem || '1';

  const course = await getCourseDetailFromDB(id, deptParam, degParam, reqYear, reqSem);

  if (!course) {
    return notFound();
  }

  if (course.year !== reqYear || course.semester !== reqSem) {
    redirect(`/courses/${id}?dept=${deptParam}&deg=${degParam}&year=${course.year}&sem=${course.semester}`);
  }

  const fullId = `${deptParam}.${degParam}.${id}`;

  const sP = course.syllabusParams;
  const syllabusLink = sP
    ? `/api/syllabus?dept=${sP[0]}&degree=${sP[1]}&course=${sP[2]}&year=${sP[3]}&semester=${sP[4]}&courseName=${encodeURIComponent(course.name)}`
    : null;

  const groupedRelated = course.relatedCourses.reduce((acc, curr) => {
    const key = `${curr.params.dept}-${curr.params.course}-${curr.name}-${curr.relation}`;
    if (!acc[key]) {
      acc[key] = { ...curr, degrees: [curr.params.degree] };
    } else if (!acc[key].degrees.includes(curr.params.degree)) {
      acc[key].degrees.push(curr.params.degree);
    }
    return acc;
  }, {} as Record<string, (typeof course.relatedCourses)[0] & { degrees: string[] }>);

  const uniqueRelated = Object.values(groupedRelated);

  const groupedBlocked = (course.blockedCourses || []).reduce((acc, curr) => {
    const key = `${curr.params.dept}-${curr.params.course}-${curr.name}-${curr.relation}`;
    if (!acc[key]) {
      acc[key] = { ...curr, degrees: [curr.params.degree] };
    } else if (!acc[key].degrees.includes(curr.params.degree)) {
      acc[key].degrees.push(curr.params.degree);
    }
    return acc;
  }, {} as Record<string, (typeof course.relatedCourses)[0] & { degrees: string[] }>);

  const uniqueBlocked = Object.values(groupedBlocked);

  return (
    <div className="min-h-screen bg-slate-50/40 dark:bg-slate-950/40" dir={isRtl ? 'rtl' : 'ltr'}>
      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Top Action & Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
          <Link
            href={`/departments/${deptParam}?deg=${degParam}&year=${reqYear}&sem=${reqSem}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium group"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
              <ArrowLeft className={cn('h-4 w-4', isRtl && 'rotate-180')} />
            </span>
            <span>{dictionary.department.back}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <CopyCourseId
              id={fullId}
              className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
              iconClassName="h-3.5 w-3.5"
            />
            <AddToScheduleButton
              courseId={id}
              dept={deptParam}
              degree={degParam}
              year={reqYear}
              semester={reqSem}
              name={course.name}
              points={course.points}
              groups={course.groups || []}
              dictionary={dictionary}
              locale={locale}
              variant="outline"
              className="rounded-lg h-9 text-xs font-medium"
            />
            {syllabusLink ? (
              <Button asChild variant="outline" size="sm" className="rounded-lg h-9 text-xs font-medium gap-1.5">
                <a href={syllabusLink} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-3.5 w-3.5" />
                  <span>{dictionary.course.syllabus}</span>
                </a>
              </Button>
            ) : (
              <Button disabled variant="outline" size="sm" className="rounded-lg h-9 text-xs font-medium gap-1.5 opacity-60">
                <Download className="h-3.5 w-3.5" />
                <span>{dictionary.course.noSyllabus}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left/Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Meta */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge variant="secondary" className="font-medium text-xs px-2.5 py-0.5 rounded-md">
                  {course.semesterName}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  {dictionary.department.title} {deptParam}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                {course.name}
              </h1>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: dictionary.course.points, val: course.points, icon: Award },
                { label: dictionary.course.hours, val: course.hours, icon: Clock },
                {
                  label: dictionary.course.degreeLevel,
                  val: degParam === '2' ? dictionary.course.master : dictionary.course.bachelor,
                  icon: GraduationCap,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-2"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <stat.icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-medium truncate">{stat.label}</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                    {stat.val}
                  </p>
                </div>
              ))}
            </div>

            {/* Course Description / Abstract */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                <FileText className="h-4 w-4 text-primary" />
                <h2>{dictionary.course.description}</h2>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 text-start">
                {course.abstract || dictionary.course.noAbstract}
              </p>
            </div>

            {/* Prerequisites & Related Courses */}
            {uniqueRelated.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>{dictionary.course.relatedCourses}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uniqueRelated.map((rel, idx) => (
                    <Link
                      key={idx}
                      href={`/courses/${rel.params.course}?dept=${rel.params.dept}&deg=${rel.degrees[0]}&year=${rel.params.year}&sem=${rel.params.semester}`}
                      className="group rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start gap-3"
                    >
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {rel.params.dept}.{rel.degrees.length > 1 ? 'X' : rel.degrees[0]}.{rel.params.course}
                          </span>
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                            {rel.relation}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                          {rel.name}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Blocked Courses (Prerequisite For) */}
            {uniqueBlocked.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Layers className="h-4 w-4 text-rose-500" />
                  <span>{dictionary.course.prerequisiteFor}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uniqueBlocked.map((blk, idx) => (
                    <Link
                      key={idx}
                      href={`/courses/${blk.params.course}?dept=${blk.params.dept}&deg=${blk.degrees[0]}&year=${blk.params.year}&sem=${blk.params.semester}`}
                      className="group rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start gap-3"
                    >
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-rose-500 transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {blk.params.dept}.{blk.degrees.length > 1 ? 'X' : blk.degrees[0]}.{blk.params.course}
                          </span>
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                            {blk.relation}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-rose-500 transition-colors">
                          {blk.name}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right/Sidebar Column */}
          <div className="space-y-5">
            {/* Quick Info Card */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <Info className="h-4 w-4 text-primary" />
                <h2>{dictionary.course.quickInfo}</h2>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/70">
                  <span className="text-xs text-muted-foreground">{dictionary.course.courseId}</span>
                  <CopyCourseId
                    id={fullId}
                    className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                    iconClassName="h-3 w-3"
                  />
                </div>
                {course.type && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="text-xs text-muted-foreground">{dictionary.course.type}</span>
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">{course.type}</span>
                  </div>
                )}
                {course.exam && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="text-xs text-muted-foreground">{dictionary.course.exam}</span>
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">{course.exam}</span>
                  </div>
                )}
                {course.gradeType && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="text-xs text-muted-foreground">{dictionary.course.gradeType}</span>
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">{course.gradeType}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <AddToScheduleButton
                  courseId={id}
                  dept={deptParam}
                  degree={degParam}
                  year={reqYear}
                  semester={reqSem}
                  name={course.name}
                  points={course.points}
                  groups={course.groups || []}
                  dictionary={dictionary}
                  locale={locale}
                  className="w-full h-10 rounded-xl text-xs font-semibold gap-2"
                />
                {syllabusLink ? (
                  <Button asChild variant="outline" className="w-full h-10 rounded-xl text-xs font-semibold gap-2">
                    <a href={syllabusLink} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-3.5 w-3.5" />
                      <span>{dictionary.course.viewFullSyllabus}</span>
                    </a>
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="w-full h-10 rounded-xl text-xs font-medium gap-2 opacity-60">
                    <Download className="h-3.5 w-3.5" />
                    <span>{dictionary.course.syllabusNotAvailable}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Available Semesters */}
            {course.offerings && course.offerings.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Clock className="h-4 w-4 text-primary" />
                  <h2>{dictionary.course.availableIn}</h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {course.offerings.map((off: any, idx: number) => {
                    const isActive = off.year === reqYear && off.semester === reqSem;
                    return (
                      <Link
                        key={idx}
                        href={`/courses/${id}?dept=${deptParam}&deg=${degParam}&year=${off.year}&sem=${off.semester}`}
                      >
                        <Badge
                          variant={isActive ? 'default' : 'outline'}
                          className={cn(
                            'text-xs font-medium cursor-pointer',
                            !isActive && 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          )}
                        >
                          {dictionary.course.semester} {off.semester} • {off.year}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Teaching Staff */}
            {course.lecturers && course.lecturers.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Award className="h-4 w-4 text-primary" />
                  <h2>{dictionary.course.teachingStaff}</h2>
                </div>
                <div className="space-y-2">
                  {course.lecturers.map((lecturer, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-slate-950/60"
                    >
                      <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold text-xs shrink-0">
                        {lecturer.split(':')[1]?.trim()?.charAt(0) || lecturer.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 text-xs truncate">
                          {lecturer.split(':')[1]?.trim() || lecturer}
                        </p>
                        {lecturer.includes(':') && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {lecturer.split(':')[0]?.trim()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
