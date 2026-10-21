import { Loader2 } from 'lucide-react';

export default function DepartmentLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6" aria-busy="true">
        {/* Active Loading Status Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-primary shrink-0">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                טוען קורסים של המחלקה מהשנתון...
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                שולף רשימת קורסים עדכנית לשנת הלימודים 2027
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-semibold text-primary bg-orange-50 dark:bg-orange-950/50 px-2.5 py-1 rounded border border-orange-200/80 dark:border-orange-800/60">
            2027
          </span>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6 items-start animate-pulse">
          <aside className="lg:col-span-1 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-4">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="h-9 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="h-9 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
          </aside>
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-24 rounded bg-orange-100 dark:bg-orange-950/50" />
                  <div className="h-4 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
