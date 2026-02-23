import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { DependencyMap } from '@/components/DependencyMap';
import { TourGuideClient } from '@/components/TourGuideClient';

export default async function MapPage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50/30 dark:bg-slate-950/30" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <TourGuideClient page="map" />
      <main className="flex-1 w-full relative">
         <DependencyMap dictionary={dictionary} locale={locale} />
      </main>
    </div>
  );
}
