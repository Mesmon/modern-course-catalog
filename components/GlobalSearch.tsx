"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { COURSES_QUERY_KEY, fetchCoursesCatalog } from "@/hooks/useCourses";
import { useDictionary } from "@/components/providers/DictionaryProvider";

const LazyGlobalSearchDialog = dynamic(
  () => import("./GlobalSearchDialog").then((m) => m.GlobalSearchDialog),
  { ssr: false }
);

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [hasOpened, setHasOpened] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const queryClient = useQueryClient();
  const { dictionary } = useDictionary();

  const warmSearchResources = React.useCallback(() => {
    void import("./GlobalSearchDialog");
    void queryClient.prefetchQuery({
      queryKey: COURSES_QUERY_KEY,
      queryFn: fetchCoursesCatalog,
      staleTime: 60 * 60 * 1000,
    });
  }, [queryClient]);

  const handleOpen = React.useCallback(() => {
    setHasOpened(true);
    setOpen(true);
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setHasOpened(true);
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        onPointerEnter={warmSearchResources}
        onFocus={warmSearchResources}
        aria-label={dictionary.navbar.searchPlaceholder}
        className="relative flex h-9 w-9 sm:w-full items-center justify-center sm:justify-between gap-2 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 px-0 sm:px-3 text-sm text-muted-foreground transition-colors cursor-pointer"
      >
        <span className="inline-flex items-center gap-2 truncate">
          {isNavigating ? (
            <Loader2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-primary animate-spin shrink-0" />
          ) : (
            <Search className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-slate-500 sm:text-slate-400 shrink-0" />
          )}
          <span className="hidden sm:inline truncate text-sm text-slate-500 dark:text-slate-400">
            {dictionary.navbar.searchPlaceholder}
          </span>
        </span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:inline-flex shrink-0">
          <span>⌘</span>K
        </kbd>
      </button>

      {hasOpened && (
        <LazyGlobalSearchDialog
          open={open}
          onOpenChange={setOpen}
          onNavigatingChange={setIsNavigating}
        />
      )}
    </>
  );
}
