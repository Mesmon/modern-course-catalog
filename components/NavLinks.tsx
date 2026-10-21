'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Workflow, Calendar, BookOpen } from 'lucide-react';
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
    <nav className="hidden md:flex items-center gap-1 shrink-0" aria-label="Main navigation">
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
        <span>{mapLabel}</span>
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
        <span>{scheduleLabel}</span>
      </Link>
    </nav>
  );
}

export function MobileBottomNav({
  catalogLabel,
  mapLabel,
  scheduleLabel,
  dir = 'rtl',
}: {
  catalogLabel: string;
  mapLabel: string;
  scheduleLabel: string;
  dir?: 'rtl' | 'ltr';
}) {
  const pathname = usePathname();
  const isMap = pathname?.startsWith('/map');
  const isSchedule = pathname?.startsWith('/schedule');
  const isCatalog = !isMap && !isSchedule;

  return (
    <nav
      dir={dir}
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 border-t border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md grid grid-cols-3 items-center px-2 select-none"
    >
      <Link
        href="/"
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 h-11 rounded-lg text-[11px] font-medium transition-colors',
          isCatalog
            ? 'text-primary font-semibold bg-primary/8 dark:bg-primary/15'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        )}
      >
        <BookOpen className="h-4 w-4 shrink-0" />
        <span className="truncate max-w-full px-1">{catalogLabel}</span>
      </Link>

      <Link
        href="/map"
        id="tour-map-link-mobile"
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 h-11 rounded-lg text-[11px] font-medium transition-colors',
          isMap
            ? 'text-primary font-semibold bg-primary/8 dark:bg-primary/15'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        )}
      >
        <Workflow className="h-4 w-4 shrink-0" />
        <span className="truncate max-w-full px-1">{mapLabel}</span>
      </Link>

      <Link
        href="/schedule"
        id="tour-schedule-link-mobile"
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 h-11 rounded-lg text-[11px] font-medium transition-colors',
          isSchedule
            ? 'text-primary font-semibold bg-primary/8 dark:bg-primary/15'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        )}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        <span className="truncate max-w-full px-1">{scheduleLabel}</span>
      </Link>
    </nav>
  );
}

