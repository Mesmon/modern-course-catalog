import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { TourGuideClient } from '@/components/TourGuideClient';

export default async function SchedulePage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/40 dark:bg-slate-950/40">
      <TourGuideClient page="schedule" />
      <WeeklySchedule dictionary={dictionary} locale={locale} />
    </div>
  );
}
