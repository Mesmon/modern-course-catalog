import { Loader2 } from 'lucide-react';

export default function CourseLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5" aria-busy="true">
        {/* Modern Active Loading Banner */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-orange-200/80 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/30 px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                טוען נתוני קורס וקבוצות רישום...
              </p>
              <p className="text-[11px] text-muted-foreground">
                שולף סילבוס, קשרי קדם ומועדי הוראה מהשנתון האקדמי
              </p>
            </div>
          </div>
          <span className="font-mono text-[11px] font-semibold text-primary px-2.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-orange-200/60 dark:border-orange-800/50">
            BGU · 2027
          </span>
        </div>

        {/* Course Header Skeleton */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs animate-pulse space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-24 rounded bg-orange-100 dark:bg-orange-950/60" />
            <div className="h-5 w-28 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-5 w-20 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="h-8 w-72 sm:w-96 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-40 rounded-lg bg-orange-200/70 dark:bg-orange-900/50" />
              <div className="h-9 w-28 rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 animate-pulse">
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
              <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3.5 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3.5 w-11/12 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3.5 w-4/5 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
              <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
              {[1, 2, 3].map((r) => (
                <div key={r} className="h-11 w-full rounded-lg bg-slate-100 dark:bg-slate-800/70" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              {[1, 2, 3, 4].map((r) => (
                <div key={r} className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
