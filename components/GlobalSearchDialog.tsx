"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAllCourses, filterCoursesFast } from "@/hooks/useCourses";
import { useDictionary } from "@/components/providers/DictionaryProvider";
import { MIN_ACADEMIC_YEAR } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import type { Course } from "@/lib/courses";

const MAX_RESULTS = 60;

function getCourseTargetHref(course: Course): string {
  const parts = course.id.split(".");
  const dept = course.params?.dept || parts[0] || "202";
  const degree = course.params?.degree || parts[1] || "1";
  const cId = course.params?.course || parts[2] || course.id;
  const activeParts = course.activeIn ? course.activeIn.split("-") : [];
  const latestOffering = course.offerings?.[0];
  const rawYear =
    course.params?.year || latestOffering?.year || activeParts[0] || "2027";
  const year = Number(rawYear) >= MIN_ACADEMIC_YEAR ? String(rawYear) : "2027";
  const semester =
    course.params?.semester || latestOffering?.semester || activeParts[1] || "1";

  return `/courses/${cId}?dept=${dept}&deg=${degree}&year=${year}&sem=${semester}`;
}

export interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigatingChange?: (navigating: boolean) => void;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  onNavigatingChange,
}: GlobalSearchDialogProps) {
  const [query, setQuery] = React.useState("");
  const [selectingCourse, setSelectingCourse] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const { data: courses = [], isLoading, isFetching } = useAllCourses({
    enabled: open,
  });
  const router = useRouter();
  const { dictionary, locale } = useDictionary();
  const isRtl = locale === "he";
  const hoverTimerRef = React.useRef<number | null>(null);

  const scheduleHoverPrefetch = React.useCallback(
    (href: string) => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }
      hoverTimerRef.current = window.setTimeout(() => {
        hoverTimerRef.current = null;
        router.prefetch(href);
      }, 150);
    },
    [router]
  );

  const cancelHoverPrefetch = React.useCallback(() => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    onNavigatingChange?.(isPending);
  }, [isPending, onNavigatingChange]);

  React.useEffect(() => {
    if (!open) {
      setSelectingCourse(null);
      setQuery("");
    }
  }, [open]);

  React.useEffect(() => {
    if (!isPending && selectingCourse) {
      onOpenChange(false);
      setSelectingCourse(null);
    }
  }, [isPending, selectingCourse, onOpenChange]);

  const { items: visibleCourses, totalMatches } = React.useMemo(
    () => filterCoursesFast(courses, query, MAX_RESULTS),
    [courses, query]
  );

  const isInitialLoading = isLoading || (isFetching && courses.length === 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <div className="relative" dir={isRtl ? "rtl" : "ltr"}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={dictionary.navbar.searchPlaceholder}
          className={isRtl ? "text-right" : "text-left"}
        />

        {isPending && selectingCourse && (
          <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center gap-3 animate-in fade-in duration-150">
            <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-primary shadow-2xs">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                {selectingCourse.name}
              </p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <span className="font-mono font-semibold text-primary">
                  {selectingCourse.id}
                </span>
                <span>·</span>
                <span>
                  {isRtl ? "טוען נתוני קורס..." : "Loading course details..."}
                </span>
              </p>
            </div>
          </div>
        )}

        <CommandList className={isRtl ? "text-right" : "text-left"}>
          {isInitialLoading ? (
            <div className="p-4 space-y-3" aria-busy="true">
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                <span>
                  {isRtl ? "טוען קטלוג קורסים..." : "Loading course catalog..."}
                </span>
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border border-slate-100 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/40 animate-pulse"
                >
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-20 bg-orange-100 dark:bg-orange-950/60 rounded font-mono" />
                </div>
              ))}
            </div>
          ) : visibleCourses.length === 0 ? (
            <CommandEmpty>{dictionary.navbar.noResults}</CommandEmpty>
          ) : (
            <CommandGroup
              heading={
                totalMatches > visibleCourses.length
                  ? `${dictionary.home.fullCatalog} (${visibleCourses.length} / ${totalMatches})`
                  : `${dictionary.home.fullCatalog} (${totalMatches})`
              }
            >
              {visibleCourses.map((course) => {
                const href = getCourseTargetHref(course);
                return (
                  <CommandItem
                    key={course.id}
                    value={course.id}
                    onMouseEnter={() => scheduleHoverPrefetch(href)}
                    onMouseLeave={cancelHoverPrefetch}
                    onSelect={() => {
                      setSelectingCourse({ id: course.id, name: course.name });
                      startTransition(() => {
                        router.push(href);
                      });
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 py-2.5 px-3 cursor-pointer rounded-lg",
                      isRtl ? "text-right" : "text-left"
                    )}
                  >
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                      {course.name}
                    </span>
                    <span className="text-xs text-primary bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/50 px-1.5 py-0.5 rounded font-mono font-semibold shrink-0">
                      {course.id}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </div>
    </CommandDialog>
  );
}
