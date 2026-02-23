import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { DependencyMap } from '@/components/DependencyMap';

export default async function MapPage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);

  return (
    <div className="flex flex-col h-screen bg-slate-50/30" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <header className="border-b bg-white z-50 shrink-0">
        <div className="container max-w-6xl h-16 flex items-center px-4 justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold group">
            <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
              <ArrowLeft className={`h-5 w-5 ${locale === 'he' ? 'rotate-180' : ''}`} />
            </div>
            <span>{dictionary.common.back}</span>
          </Link>
          <div className="font-black text-lg text-slate-800">
            {dictionary.map.title}
          </div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>
      <main className="flex-1 w-full relative">
         <DependencyMap dictionary={dictionary} locale={locale} />
      </main>
    </div>
  );
}
