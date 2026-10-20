'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Workflow, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavLinks({
  mapLabel,
  scheduleLabel,
}: {
  mapLabel: string;
  scheduleLabel: string;
}) {
  const pathname = usePathname();
  const isMap = pathname?.startsWith('/map');
  const isSchedule = pathname?.startsWith('/schedule');

  return (
    <nav className="flex items-center gap-1 shrink-0" aria-label="Main navigation">
      <Link
        href="/map"
        id="tour-map-link"
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-colors',
          isMap
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
        )}
      >
        <Workflow className="h-4 w-4 shrink-0" />
        <span className="hidden md:inline-block">{mapLabel}</span>
      </Link>
      <Link
        href="/schedule"
        id="tour-schedule-link"
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-colors',
          isSchedule
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
        )}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        <span className="hidden md:inline-block">{scheduleLabel}</span>
      </Link>
    </nav>
  );
}
