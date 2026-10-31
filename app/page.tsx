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

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* Centered, Calm Hero & Unified Department Search */}
        <section className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {dictionary.home.title}{' '}
              <span className="text-primary">{dictionary.home.titleSuffix}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              {dictionary.home.description}
            </p>
          </div>

          <div
            id="tour-search"
            className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs"
          >
            <DepartmentSearch />
          </div>

          {/* Subtle Quick Links to Schedule & Prerequisite Map */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/schedule"
              className="group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-primary/50 transition-colors text-xs shadow-2xs"
            >
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                {dictionary.schedule.title}
              </span>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="text-muted-foreground hidden sm:inline">
                {isRtl ? 'בניית מערכת והשוואת גרסאות' : 'Build & compare timetables'}
              </span>
              <ArrowIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/map"
              className="group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-primary/50 transition-colors text-xs shadow-2xs"
            >
              <Workflow className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                {dictionary.map.title}
              </span>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="text-muted-foreground hidden sm:inline">
                {isRtl ? 'תרשים זרימה של קורסי קדם' : 'Interactive prerequisite graph'}
              </span>
              <ArrowIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors" />
            </Link>
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
