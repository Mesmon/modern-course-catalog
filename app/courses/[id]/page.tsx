import { getCourseDetailFromDB } from '@/lib/courses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft, Clock, Award, BookOpen, GraduationCap, Link as LinkIcon, Download, Info, Layers } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { notFound } from 'next/navigation';
import { CopyCourseId } from '@/components/CopyCourseId';

export default async function CoursePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ dept?: string, deg?: string, year?: string, sem?: string }>
}) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);

  const { id } = await params;
  const sParams = await searchParams;
  
  const course = await getCourseDetailFromDB(
    id,
    sParams.dept || '202',
    sParams.deg || '1',
    sParams.year || '2026',
    sParams.sem || '2'
  );

  if (!course) {
    return notFound();
  }

  const fullId = `${sParams.dept || '202'}.${sParams.deg || '1'}.${id}`;

  const sP = course.syllabusParams;
  const syllabusLink = sP ? `/api/syllabus?dept=${sP[0]}&degree=${sP[1]}&course=${sP[2]}&year=${sP[3]}&semester=${sP[4]}&courseName=${encodeURIComponent(course.name)}` : null;

  const groupedRelated = course.relatedCourses.reduce((acc, curr) => {
    const key = `${curr.params.dept}-${curr.params.course}-${curr.name}-${curr.relation}`;
    if (!acc[key]) {
      acc[key] = { ...curr, degrees: [curr.params.degree] };
    } else {
      if (!acc[key].degrees.includes(curr.params.degree)) {
        acc[key].degrees.push(curr.params.degree);
      }
    }
    return acc;
  }, {} as Record<string, typeof course.relatedCourses[0] & { degrees: string[] }>);

  const uniqueRelated = Object.values(groupedRelated);

  return (
    <div className="min-h-screen bg-slate-50/30" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      {/* Dynamic Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container max-w-6xl h-20 flex items-center px-4 justify-between">
          <Link href={`/departments/${sParams.dept || '202'}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold group">
            <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
              <ArrowLeft className={`h-5 w-5 ${locale === 'he' ? 'rotate-180' : ''}`} />
            </div>
            <span>{dictionary.department.back}</span>
          </Link>
          <div className="flex items-center gap-4">
             {syllabusLink ? (
                <Button asChild variant="outline" className="hidden sm:flex rounded-xl font-bold border-primary/20 hover:bg-primary/5 text-primary">
                  <a href={syllabusLink} target="_blank" rel="noopener noreferrer" download>
                   <Download className={`h-4 w-4 ${locale === 'he' ? 'ml-2' : 'mr-2'}`} />
                   {dictionary.course.syllabus}
                  </a>
                </Button>
             ) : (
                <Button disabled variant="outline" className="hidden sm:flex rounded-xl font-bold border-slate-200 text-slate-400">
                  <Download className={`h-4 w-4 ${locale === 'he' ? 'ml-2' : 'mr-2'}`} />
                  {dictionary.course.noSyllabus}
                </Button>
             )}
             <div className="h-8 w-[1px] bg-slate-200 hidden sm:block mx-2" />
             <CopyCourseId id={fullId} className="font-mono text-xs font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors" iconClassName="h-3 w-3" />
          </div>
        </div>
      </header>

      <main className="container max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content (Left/Center) */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700">
               <div className="flex items-center gap-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors py-1 px-3 rounded-lg font-bold">
                    {course.semesterName}
                  </Badge>
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span className="text-slate-500 font-bold">{dictionary.course.computerScience}</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                 {course.name}
               </h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in duration-1000">
              {[
                { label: dictionary.course.points, val: course.points, icon: Award, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: dictionary.course.hours, val: course.hours, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: dictionary.course.degreeLevel, val: dictionary.course.bachelor, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' }
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm ring-1 ring-slate-100 bg-white group hover:ring-primary/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className={`${stat.bg} ${stat.color} h-10 w-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-800">{stat.val}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mobile Quick Info Card */}
            <Card className="lg:hidden border-none shadow-lg bg-slate-900 text-white rounded-[2rem]">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        {dictionary.course.quickInfo}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                    <div className="pt-2 pb-5 border-b border-white/10 space-y-3">
                        <div className="text-slate-400 font-bold">{dictionary.course.courseId}</div>
                        <CopyCourseId id={fullId} className="w-full h-14 bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-2xl font-black font-mono text-white transition-all shadow-inner" iconClassName="h-6 w-6" />
                    </div>
                    {course.type && (
                        <div className="flex justify-between items-center py-4 border-b border-white/10">
                            <span className="text-slate-400 font-bold">{dictionary.course.type}</span>
                            <span className="text-white">{course.type}</span>
                        </div>
                    )}
                    {course.exam && (
                        <div className="flex justify-between items-center py-4 border-b border-white/10">
                            <span className="text-slate-400 font-bold">{dictionary.course.exam}</span>
                            <span className="text-white">{course.exam}</span>
                        </div>
                    )}
                    {course.gradeType && (
                        <div className="flex justify-between items-center py-4 border-b border-white/10">
                            <span className="text-slate-400 font-bold">{dictionary.course.gradeType}</span>
                            <span className="text-white">{course.gradeType}</span>
                        </div>
                    )}
                    {syllabusLink ? (
                         <Button asChild className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl text-lg font-black gap-3 shadow-lg shadow-primary/30">
                           <a href={syllabusLink} target="_blank" rel="noopener noreferrer" download>
                             <Download className="h-5 w-5" />
                             {dictionary.course.viewFullSyllabus}
                            </a>
                          </Button>
                     ) : (
                          <Button disabled className="w-full h-14 bg-slate-200 text-slate-400 rounded-2xl text-lg font-black gap-3 cursor-not-allowed">
                             <Download className="h-5 w-5" />
                             {dictionary.course.syllabusNotAvailable}
                          </Button>
                    )}
                </CardContent>
            </Card>

            {/* Abstract Section */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
               <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white">
                        <FileText className="h-5 w-5" />
                    </div>
                    {dictionary.course.description}
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-10">
                  <div className="relative">
                    <div className={`absolute ${locale === 'he' ? '-right-4' : '-left-4'} top-0 w-1 h-full bg-primary/10 rounded-full`} />
                    <p className="text-xl leading-[1.8] text-slate-700 font-medium text-justify">
                      {course.abstract || dictionary.course.noAbstract}
                    </p>
                  </div>
               </CardContent>
            </Card>
          </div>

          {/* Sidebar (Right) */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            {/* Quick Info Card */}
            <Card className="hidden lg:block border-none shadow-lg bg-slate-900 text-white rounded-[2rem]">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        {dictionary.course.quickInfo}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                    <div className="pt-2 pb-5 border-b border-white/10 space-y-3">
                        <div className="text-slate-400 font-bold">{dictionary.course.courseId}</div>
                        <CopyCourseId id={fullId} className="w-full h-14 bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-2xl font-black font-mono text-white transition-all shadow-inner" iconClassName="h-6 w-6" />
                    </div>
                    {course.type && (
                        <div className="flex justify-between items-center py-4 border-b border-white/10">
                            <span className="text-slate-400 font-bold">{dictionary.course.type}</span>
                            <span className="text-white">{course.type}</span>
                        </div>
                    )}
                    {course.exam && (
                        <div className="flex justify-between items-center py-4 border-b border-white/10">
                            <span className="text-slate-400 font-bold">{dictionary.course.exam}</span>
                            <span className="text-white">{course.exam}</span>
                        </div>
                    )}
                    {course.gradeType && (
                        <div className="flex justify-between items-center py-4 border-b border-white/10">
                            <span className="text-slate-400 font-bold">{dictionary.course.gradeType}</span>
                            <span className="text-white">{course.gradeType}</span>
                        </div>
                    )}
                    {syllabusLink ? (
                         <Button asChild className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl text-lg font-black gap-3 shadow-lg shadow-primary/30">
                           <a href={syllabusLink} target="_blank" rel="noopener noreferrer" download>
                             <Download className="h-5 w-5" />
                             {dictionary.course.viewFullSyllabus}
                            </a>
                          </Button>
                     ) : (
                          <Button disabled className="w-full h-14 bg-slate-200 text-slate-400 rounded-2xl text-lg font-black gap-3 cursor-not-allowed">
                             <Download className="h-5 w-5" />
                             {dictionary.course.syllabusNotAvailable}
                          </Button>
                    )}
                </CardContent>
            </Card>

            {/* Lecturers Section */}
            {course.lecturers && course.lecturers.length > 0 && (
              <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <Award className="h-5 w-5 text-primary" />
                    {dictionary.course.teachingStaff}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {course.lecturers.map((lecturer, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {lecturer.split(':')[1]?.trim()?.charAt(0) || lecturer.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{lecturer.split(':')[1]?.trim() || lecturer}</p>
                        <p className="text-xs text-slate-500">{lecturer.split(':')[0]?.trim() || ''}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}


            {/* Related Courses Section */}
            {course.relatedCourses && course.relatedCourses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-black flex items-center gap-2 text-slate-800 px-2">
                    <Layers className="h-5 w-5 text-primary" />
                    {dictionary.course.relatedCourses}
                </h3>
                <div className="space-y-3">
                  {uniqueRelated.map((rel, idx) => (
                    <Link 
                      key={idx} 
                      href={`/courses/${rel.params.course}?dept=${rel.params.dept}&deg=${rel.degrees[0]}&year=${rel.params.year}&sem=${rel.params.semester}`}
                      className="block group"
                    >
                      <Card className="border-none shadow-sm hover:shadow-md ring-1 ring-slate-100 hover:ring-primary/20 transition-all bg-white rounded-2xl overflow-hidden">
                        <CardContent className="p-4 flex items-center gap-4">
                           <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <BookOpen className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                           </div>
                           <div className="flex-1 overflow-hidden">
                             <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{rel.params.dept}.{rel.degrees.length > 1 ? 'X' : rel.degrees[0]}.{rel.params.course}</span>
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-auto leading-tight font-bold bg-slate-100">
                                    {rel.relation}
                                </Badge>
                                {rel.degrees.length > 0 && (
                                  <span className="text-[10px] font-bold text-slate-400">
                                    ({dictionary.course.degree} {rel.degrees.sort().join(', ')})
                                  </span>
                                )}
                             </div>
                             <p className="font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
                                {rel.name}
                             </p>
                           </div>
                        </CardContent>
                      </Card>
                    </Link>
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


