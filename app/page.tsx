import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, GraduationCap, Database, Sparkles, BookOpen, ArrowRight, Library } from 'lucide-react';
import { redirect } from 'next/navigation';
import { CourseList } from '@/components/CourseList';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';

import { DepartmentSearch } from '@/components/DepartmentSearch';

export default async function Home() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="container max-w-6xl px-4 py-20 flex flex-col items-center">
        <div className="text-center space-y-6 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-4">
            <Sparkles className="h-4 w-4" />
            <span>{dictionary.home.tagline}</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
            {dictionary.home.title} <br />
            <span className="text-primary">{dictionary.home.titleSuffix}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {dictionary.home.description}
          </p>
        </div>

        <Card className="w-full max-w-2xl shadow-2xl shadow-primary/10 border-primary/10 backdrop-blur-sm bg-white/80">
          <div className="h-2 bg-primary" />
          <CardHeader className="space-y-1 p-8">
            <CardTitle className="text-3xl font-black flex items-center gap-3">
              <Search className="h-8 w-8 text-primary" />
              {dictionary.home.searchTitle}
            </CardTitle>
            <CardDescription className="text-lg">
              {dictionary.home.searchDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <DepartmentSearch dictionary={dictionary} locale={locale} />
          </CardContent>
        </Card>


        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {[
                { title: dictionary.home.features.speed.title, desc: dictionary.home.features.speed.desc, icon: Sparkles },
                { title: dictionary.home.features.data.title, desc: dictionary.home.features.data.desc, icon: Database },
                { title: dictionary.home.features.design.title, desc: dictionary.home.features.design.desc, icon: GraduationCap },
            ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.desc}</p>
                </div>
            ))}
        </div>

        <div className="mt-32 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Library className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{dictionary.home.fullCatalog}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseList />
          </div>
        </div>
      </main>
    </div>
  );
}

