import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';

export async function Navbar() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/80 backdrop-blur-md shadow-sm" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <div className="container flex h-16 items-center max-w-7xl mx-auto px-4 gap-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-primary/10 p-2 rounded-xl">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <span className="font-black text-xl tracking-tight hidden sm:inline-block text-slate-900">
            {locale === 'en' ? (
               <>BGU <span className="text-primary gap-1">Catalog</span></>
            ) : (
               <>קטלוג<span className="text-primary gap-1"> .</span>קורסים</>
            )}
          </span>
        </Link>
        <div className="flex-1 flex justify-center max-w-2xl mx-auto px-2">
          <GlobalSearch />
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
