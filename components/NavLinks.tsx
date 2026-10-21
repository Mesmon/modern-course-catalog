'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Workflow, Calendar, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavLinks({
  catalogLabel,
  mapLabel,
  scheduleLabel,
}: {
  catalogLabel: string;
  mapLabel: string;
  scheduleLabel: string;
}) {
  const pathname = usePathname();
  const isMap = pathname?.startsWith('/map');
  const isSchedule = pathname?.startsWith('/schedule');
  const isCatalog = !isMap && !isSchedule;

  return (
    <nav className="hidden md:flex items-center gap-6 h-full shrink-0" aria-label="Main navigation">
      <Link
        href="/"
        className={cn(
          'inline-flex items-center gap-1.5 h-14 px-1 border-b-2 text-sm transition-colors',
          isCatalog
            ? 'border-primary text-primary font-semibold'
            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary font-normal'
        )}
      >
        <span>{catalogLabel}</span>
      </Link>
      <Link
        href="/schedule"
        id="tour-schedule-link"
        className={cn(
          'inline-flex items-center gap-1.5 h-14 px-1 border-b-2 text-sm transition-colors',
          isSchedule
            ? 'border-primary text-primary font-semibold'
            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary font-normal'
        )}
      >
        <span>{scheduleLabel}</span>
      </Link>
      <Link
        href="/map"
        id="tour-map-link"
        className={cn(
          'inline-flex items-center gap-1.5 h-14 px-1 border-b-2 text-sm transition-colors',
          isMap
            ? 'border-primary text-primary font-semibold'
            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary font-normal'
        )}
      >
        <span>{mapLabel}</span>
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
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md grid grid-cols-3 items-center px-3 select-none"
    >
      <Link
        href="/schedule"
        id="tour-schedule-link-mobile"
        className={cn(
          'flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] transition-colors active:scale-95',
          isSchedule
            ? 'text-primary font-semibold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
        )}
      >
        <Calendar className={cn('h-5 w-5 shrink-0', isSchedule && 'stroke-[2.25]')} />
        <span className="truncate max-w-full px-1">{scheduleLabel}</span>
      </Link>

      <Link
        href="/"
        className={cn(
          'flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] transition-colors active:scale-95',
          isCatalog
            ? 'text-primary font-semibold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
        )}
      >
        <BookOpen className={cn('h-5 w-5 shrink-0', isCatalog && 'stroke-[2.25]')} />
        <span className="truncate max-w-full px-1">{catalogLabel}</span>
      </Link>

      <Link
        href="/map"
        id="tour-map-link-mobile"
        className={cn(
          'flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] transition-colors active:scale-95',
          isMap
            ? 'text-primary font-semibold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
        )}
      >
        <Workflow className={cn('h-5 w-5 shrink-0', isMap && 'stroke-[2.25]')} />
        <span className="truncate max-w-full px-1">{mapLabel}</span>
      </Link>
    </nav>
  );
}
