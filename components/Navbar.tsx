import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { ThemeToggle } from './ThemeToggle';
import { UserAuthMenu } from './UserAuthMenu';
import { NavLinks } from './NavLinks';

export async function Navbar() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md"
      dir={locale === 'en' ? 'ltr' : 'rtl'}
    >
      <div className="container flex h-14 items-center justify-between max-w-7xl mx-auto px-4 gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity shrink-0"
          >
            <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 p-1.5 rounded-lg">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight hidden sm:inline-block text-slate-900 dark:text-slate-100">
              {dictionary.navbar.logoText1}{' '}
              <span className="text-muted-foreground font-medium">{dictionary.navbar.logoText2}</span>
            </span>
          </Link>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <NavLinks
            mapLabel={dictionary.map.title}
            scheduleLabel={dictionary.schedule.title}
          />
        </div>

        <div className="flex-1 flex justify-center max-w-md mx-auto">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <UserAuthMenu />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
