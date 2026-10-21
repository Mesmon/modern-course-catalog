import Link from 'next/link';
import { Calendar, Workflow, ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { CourseList } from '@/components/CourseList';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { DepartmentSearch } from '@/components/DepartmentSearch';
import { TourGuideClient } from '@/components/TourGuideClient';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';

export default async function Home() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const isRtl = locale === 'he';
  const dictionary = getDictionary(locale);
  const ArrowIcon = isRtl ? ArrowUpLeft : ArrowUpRight;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      <TourGuideClient page="home" />
      <ScrollToTopButton label={isRtl ? 'חזרה למעלה' : 'Back to top'} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">
        {/* Editorial Hero & Search Workspace */}
        <section className="space-y-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/60 text-primary text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{isRtl ? 'שנת הלימודים תשפ״ז · 2027' : 'Academic Year 2026–2027'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {dictionary.home.title}{' '}
              <span className="text-primary">{dictionary.home.titleSuffix}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {dictionary.home.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Search Panel (8 columns) */}
            <div
              id="tour-search"
              className="lg:col-span-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {dictionary.home.searchTitle}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {dictionary.home.searchDesc}
                </p>
              </div>
              <DepartmentSearch dictionary={dictionary} locale={locale} />
            </div>

            {/* Quick Workspace Cards (4 columns) */}
            <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
              <Link
                href="/schedule"
                className="group rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 hover:border-primary/60 transition-colors flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-50 dark:bg-orange-950/50 border border-orange-200/70 dark:border-orange-800/60 flex items-center justify-center text-primary shrink-0">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <ArrowIcon className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                    {dictionary.schedule.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {dictionary.schedule.subtitle}
                  </p>
                </div>
              </Link>

              <Link
                href="/map"
                className="group rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 hover:border-primary/60 transition-colors flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-50 dark:bg-orange-950/50 border border-orange-200/70 dark:border-orange-800/60 flex items-center justify-center text-primary shrink-0">
                    <Workflow className="h-4.5 w-4.5" />
                  </div>
                  <ArrowIcon className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                    {dictionary.map.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {isRtl
                      ? 'תרשים זרימה אינטראקטיבי של קורסי קדם ושרשראות חסימה'
                      : 'Interactive directed graph of course prerequisites and chains'}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Full Catalog Section */}
        <section id="tour-full-catalog">
          <CourseList />
        </section>
      </main>

      {/* Academic Footer (Stitch Design) */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 mt-12 pb-20 md:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            {isRtl
              ? '© תשפ״ז שנתון אקדמי אוניברסיטת בן-גוריון בנגב · תכנון תואר ומערכת שעות'
              : '© 2027 BGU Academic Course Catalog & Schedule Planner'}
          </div>
          <div className="flex items-center gap-5 font-mono text-[11px]">
            <Link href="/" className="hover:text-primary transition-colors">
              {isRtl ? 'קטלוג קורסים' : 'Catalog'}
            </Link>
            <Link href="/schedule" className="hover:text-primary transition-colors">
              {dictionary.schedule.title}
            </Link>
            <Link href="/map" className="hover:text-primary transition-colors">
              {dictionary.map.title}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
