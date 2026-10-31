import { cookies } from 'next/headers';
import { Locale } from '@/lib/dictionaries';
import { DependencyMap } from '@/components/DependencyMap';
import { TourGuideClient } from '@/components/TourGuideClient';

export default async function MapPage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] md:h-[calc(100dvh-3.5rem)] overflow-hidden bg-slate-50/30 dark:bg-slate-950/30" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <TourGuideClient page="map" />
      <main className="flex-1 w-full relative">
        <DependencyMap />
      </main>
    </div>
  );
}
