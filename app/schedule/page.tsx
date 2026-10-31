import { WeeklySchedule } from '@/components/WeeklySchedule';
import { TourGuideClient } from '@/components/TourGuideClient';

export default function SchedulePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/40 dark:bg-slate-950/40">
      <TourGuideClient page="schedule" />
      <WeeklySchedule />
    </div>
  );
}
