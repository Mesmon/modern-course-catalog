import Link from 'next/link';
import { GlobalSearch } from './GlobalSearch';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { ThemeToggle } from './ThemeToggle';
import { UserAuthMenu } from './UserAuthMenu';
import { NavLinks, MobileBottomNav } from './NavLinks';

export async function Navbar() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);
  const isHe = locale === 'he';

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md"
        dir={isHe ? 'rtl' : 'ltr'}
      >
        <div className="max-w-[1520px] mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          {/* Brand Logo + Desktop Nav Links */}
          <div className="flex items-center gap-7 h-full shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 group transition-opacity hover:opacity-95"
            >
              <div className="flex h-8 px-2 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-xs font-bold tracking-tight shrink-0 shadow-2xs">
                {isHe ? 'בג״ע' : 'BGU'}
              </div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                <span className="text-primary font-mono font-bold me-1.5 hidden sm:inline">BGU</span>
                {isHe ? 'שנתון אקדמי' : 'Course Catalog'}
              </span>
            </Link>

            <NavLinks
              catalogLabel={isHe ? 'קטלוג קורסים' : 'Course Catalog'}
              mapLabel={dictionary.map.title}
              scheduleLabel={dictionary.schedule.title}
            />
          </div>

          {/* Search & Utility Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
            <div className="w-full max-w-[200px] sm:max-w-xs">
              <GlobalSearch />
            </div>

            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <LanguageSwitcher />
              <ThemeToggle />
              <UserAuthMenu />
            </div>
          </div>
        </div>
      </header>

      <MobileBottomNav
        catalogLabel={isHe ? 'קטלוג' : 'Catalog'}
        mapLabel={dictionary.map.title}
        scheduleLabel={isHe ? 'מערכת' : dictionary.schedule.title}
        dir={isHe ? 'rtl' : 'ltr'}
      />
    </>
  );
}
