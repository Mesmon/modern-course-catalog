import Link from 'next/link';
import { Calendar, Workflow, Library } from 'lucide-react';
import { CourseList } from '@/components/CourseList';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { DepartmentSearch } from '@/components/DepartmentSearch';
import { TourGuideClient } from '@/components/TourGuideClient';

export default async function Home() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);

  return (
    <div className="min-h-screen bg-slate-50/40 dark:bg-slate-950/40">
      <TourGuideClient page="home" />

      <main className="container max-w-6xl mx-auto px-4 py-12 space-y-14">
        {/* Hero & Department Search */}
        <section className="max-w-2xl mx-auto text-center space-y-6 pt-2">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {dictionary.home.title}{' '}
              <span className="text-primary">{dictionary.home.titleSuffix}</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {dictionary.home.description}
            </p>
          </div>

          <div
            id="tour-search"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm text-start space-y-3"
          >
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {dictionary.home.searchTitle}
              </h2>
              <p className="text-xs text-muted-foreground">
                {dictionary.home.searchDesc}
              </p>
            </div>
            <DepartmentSearch dictionary={dictionary} locale={locale} />
          </div>

          {/* Quick Tools Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-100 shadow-2xs transition-all"
            >
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{dictionary.schedule.title}</span>
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-100 shadow-2xs transition-all"
            >
              <Workflow className="h-3.5 w-3.5 text-primary" />
              <span>{dictionary.map.title}</span>
            </Link>
          </div>
        </section>

        {/* Full Catalog Section */}
        <section id="tour-full-catalog" className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Library className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {dictionary.home.fullCatalog}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CourseList />
          </div>
        </section>
      </main>
    </div>
  );
}
