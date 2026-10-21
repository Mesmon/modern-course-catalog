import { getCourseDetailFromDB } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import {
  FileText,
  ArrowLeft,
  Clock,
  Award,
  GraduationCap,
  Download,
  Info,
  Layers,
  CheckCircle2,
  ClipboardCheck,
  Table2,
  Users,
  Lock,
  Unlock,
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
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {/* Breadcrumb Hierarchy (Stitch course.html) */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-4"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            {isRtl ? 'קטלוג' : 'Catalog'}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <Link
            href={`/departments/${deptParam}?deg=${degParam}&year=${reqYear}&sem=${reqSem}`}
            className="hover:text-primary transition-colors"
          >
            {dictionary.department.title} {deptParam}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-foreground font-medium truncate max-w-[260px] sm:max-w-md">
            {course.name} ({fullId})
          </span>
        </nav>

        {/* Course Header Unit Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <CopyCourseId
              id={fullId}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-50 dark:bg-orange-950/40 rounded border border-orange-200/80 dark:border-orange-800/60 font-mono text-xs font-semibold text-primary hover:bg-orange-100/80 dark:hover:bg-orange-900/50 transition-colors"
              iconClassName="h-3.5 w-3.5"
            />
            <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium rounded border border-slate-200/80 dark:border-slate-700">
              {course.semesterName} · {reqYear}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-xs font-medium rounded border border-slate-200/80 dark:border-slate-700">
              {degParam === '2' ? dictionary.course.master : dictionary.course.bachelor}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-xs font-medium rounded border border-slate-200/80 dark:border-slate-700">
              {dictionary.department.title} {deptParam}
            </span>
          </div>

          {/* Course Title and Primary Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {course.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
                variant="default"
                className="rounded-lg h-9 px-4 text-xs font-semibold shadow-2xs"
              />
              {syllabusLink ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-9 px-3.5 text-xs font-medium gap-1.5 border-slate-200 dark:border-slate-800"
                >
                  <a href={syllabusLink} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-3.5 w-3.5" />
                    <span>{dictionary.course.syllabus}</span>
                  </a>
                </Button>
              ) : (
                <Button
                  disabled
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-9 px-3.5 text-xs font-medium gap-1.5 opacity-60"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{dictionary.course.noSyllabus}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Thin Stats Strip with Hairline Dividers (Stitch course.html) */}
        <div className="border-y border-slate-200 dark:border-slate-800 py-3 my-5 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
            <Award className="h-4 w-4 text-primary shrink-0" />
            <span>
              {course.points} {dictionary.course.points}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span>
              {course.hours} {dictionary.course.hours}
            </span>
          </div>

          {course.type && (
            <>
              <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>
                  {dictionary.course.type}:{' '}
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">
                    {course.type}
                  </strong>
                </span>
              </div>
            </>
          )}

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary shrink-0" />
            <span>
              {dictionary.course.degreeLevel}:{' '}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {degParam === '2' ? dictionary.course.master : dictionary.course.bachelor}
              </span>
            </span>
          </div>

          {course.gradeType && (
            <>
              <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary shrink-0" />
                <span>
                  {dictionary.course.gradeType}:{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {course.gradeType}
                  </span>
                </span>
              </div>
            </>
          )}

          {course.exam && (
            <>
              <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span>
                  {dictionary.course.exam}:{' '}
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">
                    {course.exam}
                  </strong>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Two-Column Editorial Workplace Layout (70% Main / 30% Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
          {/* ================= MAIN COLUMN (70%) ================= */}
          <section className="lg:col-span-7 space-y-6">
            {/* SECTION 1: תיאור הקורס */}
            <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span>{dictionary.course.description}</span>
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {isRtl ? 'סילבוס אקדמי רשמי' : 'Official Academic Syllabus'}
                </span>
              </div>
              <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 text-start">
                {course.abstract || dictionary.course.noAbstract}
              </p>
            </article>

            {/* SECTION 2: דרישות קדם ותלויות אקדמיות */}
            {(uniqueRelated.length > 0 || uniqueBlocked.length > 0) && (
              <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      {isRtl ? 'דרישות קדם ותלויות אקדמיות' : 'Prerequisites & Academic Dependencies'}
                    </span>
                  </h2>
                  <Link
                    href="/map"
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{isRtl ? 'הצג מפת קדם גרפית' : 'Open Prerequisite Map'}</span>
                    <ArrowLeft className={cn('h-3.5 w-3.5', !isRtl && 'rotate-180')} />
                  </Link>
                </div>

                {/* Prerequisites List */}
                {uniqueRelated.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{dictionary.course.relatedCourses}</span>
                    </h3>
                    <div className="border border-slate-200/90 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-200/70 dark:divide-slate-800 bg-white dark:bg-slate-950/40">
                      {uniqueRelated.map((rel, idx) => (
                        <Link
                          key={idx}
                          href={`/courses/${rel.params.course}?dept=${rel.params.dept}&deg=${rel.degrees[0]}&year=${rel.params.year}&sem=${rel.params.semester}`}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-xs font-semibold text-primary px-2 py-0.5 bg-orange-50 dark:bg-orange-950/50 border border-orange-200/70 dark:border-orange-800/60 rounded shrink-0">
                              {rel.params.dept}.{rel.degrees.length > 1 ? 'X' : rel.degrees[0]}.{rel.params.course}
                            </span>
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors truncate">
                              {rel.name}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100/90 text-orange-950 dark:bg-orange-950/70 dark:text-orange-200 shrink-0">
                            {rel.relation}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unlocks / Prerequisite For List */}
                {uniqueBlocked.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Unlock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>{dictionary.course.prerequisiteFor}</span>
                    </h3>
                    <div className="border border-slate-200/90 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-200/70 dark:divide-slate-800 bg-white dark:bg-slate-950/40">
                      {uniqueBlocked.map((blk, idx) => (
                        <Link
                          key={idx}
                          href={`/courses/${blk.params.course}?dept=${blk.params.dept}&deg=${blk.degrees[0]}&year=${blk.params.year}&sem=${blk.params.semester}`}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-300 px-2 py-0.5 bg-sky-50 dark:bg-sky-950/50 border border-sky-200/70 dark:border-sky-800/60 rounded shrink-0">
                              {blk.params.dept}.{blk.degrees.length > 1 ? 'X' : blk.degrees[0]}.{blk.params.course}
                            </span>
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors truncate">
                              {blk.name}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                            {blk.relation}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )}

            {/* SECTION 3: קבוצות רישום ומועדים (Stitch Registration Groups Table) */}
            {course.groups && course.groups.length > 0 && (
              <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Table2 className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        {isRtl
                          ? `קבוצות רישום ומועדים — ${course.semesterName} ${reqYear}`
                          : `Registration Groups & Schedule — ${course.semesterName} ${reqYear}`}
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dictionary.schedule.selectGroupsDesc}
                    </p>
                  </div>
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
                    className="h-8 text-xs font-semibold rounded-lg shrink-0"
                  />
                </div>

                <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-start border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3 text-start">{dictionary.schedule.group}</th>
                        <th className="py-2.5 px-3 text-start">{dictionary.course.type}</th>
                        <th className="py-2.5 px-3 text-start">{dictionary.course.teachingStaff}</th>
                        <th className="py-2.5 px-3 text-start">{isRtl ? 'יום ושעה' : 'Day & Time'}</th>
                        <th className="py-2.5 px-3 text-start">{isRtl ? 'מיקום וכיתה' : 'Location'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {course.groups.map((grp, gIdx) => {
                        const isLecture =
                          grp.type.includes('הרצאה') ||
                          grp.type.toLowerCase().includes('lecture') ||
                          grp.type.includes('שעור');
                        const isTutorial =
                          grp.type.includes('תרגול') ||
                          grp.type.includes('תרגיל') ||
                          grp.type.toLowerCase().includes('tutorial');

                        return (
                          <tr
                            key={`${grp.id}-${gIdx}`}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-3 font-mono font-semibold text-primary">
                              {grp.id}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-[11px] font-semibold inline-block',
                                  isLecture
                                    ? 'bg-orange-100 text-orange-950 dark:bg-orange-950/60 dark:text-orange-200'
                                    : isTutorial
                                      ? 'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200'
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                )}
                              >
                                {grp.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                              {grp.lecturer || '—'}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                              {grp.meetings && grp.meetings.length > 0 ? (
                                <div className="space-y-0.5">
                                  {grp.meetings.map((m, mIdx) => (
                                    <div key={mIdx}>
                                      {(dictionary.schedule.days as Record<string, string>)?.[m.day] || (locale === 'he' ? `יום ${m.day}'` : m.day)}{' '}
                                      <span dir="ltr">
                                        {m.startTime}–{m.endTime}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">
                              {grp.meetings && grp.meetings.length > 0 ? (
                                <div className="space-y-0.5">
                                  {grp.meetings.map((m, mIdx) => (
                                    <div key={mIdx}>{m.location || '—'}</div>
                                  ))}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            )}
          </section>

          {/* ================= SIDEBAR COLUMN (30%) ================= */}
          <aside className="lg:col-span-3 space-y-5 lg:sticky lg:top-20">
            {/* BLOCK 1: פרטי רישום ומנהלה */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>{dictionary.course.quickInfo}</span>
              </h3>

              <dl className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                <div className="py-2 flex justify-between items-center gap-2">
                  <dt className="text-muted-foreground">{dictionary.course.courseId}</dt>
                  <dd>
                    <CopyCourseId
                      id={fullId}
                      className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                      iconClassName="h-3 w-3"
                    />
                  </dd>
                </div>
                <div className="py-2 flex justify-between items-center gap-2">
                  <dt className="text-muted-foreground">{dictionary.department.title}</dt>
                  <dd className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    #{deptParam}
                  </dd>
                </div>
                {course.type && (
                  <div className="py-2 flex justify-between items-center gap-2">
                    <dt className="text-muted-foreground">{dictionary.course.type}</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">{course.type}</dd>
                  </div>
                )}
                {course.exam && (
                  <div className="py-2 flex justify-between items-center gap-2">
                    <dt className="text-muted-foreground">{dictionary.course.exam}</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">{course.exam}</dd>
                  </div>
                )}
                {course.gradeType && (
                  <div className="py-2 flex justify-between items-center gap-2">
                    <dt className="text-muted-foreground">{dictionary.course.gradeType}</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">{course.gradeType}</dd>
                  </div>
                )}
              </dl>

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
                  className="w-full h-9 rounded-lg text-xs font-semibold gap-2"
                />
                {syllabusLink ? (
                  <Button asChild variant="outline" className="w-full h-9 rounded-lg text-xs font-semibold gap-2">
                    <a href={syllabusLink} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-3.5 w-3.5" />
                      <span>{dictionary.course.viewFullSyllabus}</span>
                    </a>
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="w-full h-9 rounded-lg text-xs font-medium gap-2 opacity-60">
                    <Download className="h-3.5 w-3.5" />
                    <span>{dictionary.course.syllabusNotAvailable}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* BLOCK 2: מועדי הוראה בשנתון */}
            {course.offerings && course.offerings.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>{dictionary.course.availableIn}</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {course.offerings.map((off: any, idx: number) => {
                    const isActive = off.year === reqYear && off.semester === reqSem;
                    return (
                      <Link
                        key={idx}
                        href={`/courses/${id}?dept=${deptParam}&deg=${degParam}&year=${off.year}&sem=${off.semester}`}
                        className={cn(
                          'px-2.5 py-1 rounded text-xs font-medium transition-colors border',
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary font-semibold'
                            : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary'
                        )}
                      >
                        {dictionary.course.semester} {off.semester} · {off.year}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BLOCK 3: סגל הוראה */}
            {course.lecturers && course.lecturers.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <span>{dictionary.course.teachingStaff}</span>
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {course.lecturers.map((lecturer, idx) => {
                    const role = lecturer.includes(':') ? lecturer.split(':')[0]?.trim() : null;
                    const name = lecturer.includes(':') ? lecturer.split(':')[1]?.trim() : lecturer;
                    const initials = name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(part => part.replace(/[^א-תa-zA-Z]/g, '').charAt(0))
                      .join('');

                    return (
                      <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center font-mono text-xs font-bold text-primary shrink-0">
                          {initials || name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                            {name}
                          </p>
                          {role && (
                            <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                              {role}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
