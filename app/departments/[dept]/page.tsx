import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchCourseList } from '@/lib/scraper';
import { ArrowLeft, Search, Filter, BookOpen, ChevronLeft } from 'lucide-react';

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

  const courses = await fetchCourseList(dept, degree, year, semester);

  return (
    <div className="min-h-screen bg-slate-50/50" dir="rtl">
      {/* Sleek Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container max-w-6xl h-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
              <ArrowLeft className="h-6 w-6 rotate-180 text-slate-600 group-hover:text-primary" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-none">מחלקה {dept}</h1>
              <p className="text-sm text-muted-foreground mt-1">סמסטר {semester} | שנת {year}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="secondary" className="px-3 py-1 font-bold">
                {courses.length} קורסים נמצאו
             </Badge>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar / Filters (Placeholder) */}
          <aside className="hidden lg:block space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-slate-700">
                <Filter className="h-4 w-4" />
                סינון תוצאות
              </h3>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">תואר</label>
                    <div className="flex flex-wrap gap-2">
                        <Badge className="bg-primary hover:bg-primary cursor-pointer">ראשון</Badge>
                        <Badge variant="outline" className="hover:bg-slate-50 cursor-pointer">שני</Badge>
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
                  <Card className="h-full border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden bg-white">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-100 group-hover:bg-primary transition-colors" />
                    <CardHeader className="p-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">
                          {course.id}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold border-slate-200">
                          {course.activeIn}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-black leading-tight text-slate-800 group-hover:text-primary transition-colors">
                        {course.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                      <div className="flex items-center justify-between text-primary font-bold text-sm">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 opacity-50" />
                            <span>פרטי קורס</span>
                        </div>
                        <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {courses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center px-6">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Search className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">לא נמצאו קורסים</h3>
                <p className="text-muted-foreground max-w-sm">לא מצאנו קורסים עבור מחלקה זו בסמסטר הנוכחי. נסה לבדוק סמסטר אחר או מספר מחלקה שונה.</p>
                <Link href="/" className="mt-8">
                    <Button variant="outline" className="rounded-xl px-8 h-12 font-bold">חזרה לחיפוש</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
