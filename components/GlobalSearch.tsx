"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAllCourses } from "@/hooks/useCourses"
import { useDictionary } from "@/components/providers/DictionaryProvider"
import { MIN_ACADEMIC_YEAR } from "@/lib/schedule"
import { cn } from "@/lib/utils"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [selectingCourse, setSelectingCourse] = React.useState<{ id: string; name: string } | null>(null)
  const [isPending, startTransition] = React.useTransition()
  const { data: courses = [], isLoading, isFetching, refetch } = useAllCourses()
  const router = useRouter()
  const { dictionary, locale } = useDictionary()
  const isRtl = locale === 'he'

  React.useEffect(() => {
    if (open) {
      refetch()
    } else {
      setSelectingCourse(null)
    }
  }, [open, refetch])

  React.useEffect(() => {
    if (!isPending && selectingCourse) {
      setOpen(false)
      setSelectingCourse(null)
    }
  }, [isPending, selectingCourse])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const isInitialLoading = isLoading || (isFetching && courses.length === 0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 px-3 text-sm text-muted-foreground transition-colors cursor-pointer"
      >
        <span className="inline-flex items-center gap-2 truncate">
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
          ) : (
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          )}
          <span className="truncate text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {dictionary.navbar.searchPlaceholder}
          </span>
        </span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:inline-flex shrink-0">
          <span>⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="relative" dir={isRtl ? 'rtl' : 'ltr'}>
          <CommandInput
            placeholder={dictionary.navbar.searchPlaceholder}
            className={isRtl ? 'text-right' : 'text-left'}
          />

          {/* Modern Loading Overlay when selecting a course */}
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
                  <span className="font-mono font-semibold text-primary">{selectingCourse.id}</span>
                  <span>·</span>
                  <span>{isRtl ? 'טוען נתוני קורס...' : 'Loading course details...'}</span>
                </p>
              </div>
            </div>
          )}

          <CommandList className={isRtl ? 'text-right' : 'text-left'}>
            {isInitialLoading ? (
              <div className="p-4 space-y-3" aria-busy="true">
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                  <span>{isRtl ? 'טוען קטלוג קורסים...' : 'Loading course catalog...'}</span>
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
            ) : (
              <>
                <CommandEmpty>{dictionary.navbar.noResults}</CommandEmpty>
                <CommandGroup heading={dictionary.home.fullCatalog}>
                  {courses.map((course) => (
                    <CommandItem
                      key={course.id}
                      value={`${course.id} ${course.name}`}
                      onSelect={() => {
                        const parts = course.id.split('.')
                        const dept = (course as any).params?.dept || parts[0] || '202'
                        const degree = (course as any).params?.degree || parts[1] || '1'
                        const cId = (course as any).params?.course || parts[2] || course.id
                        const activeParts = course.activeIn ? course.activeIn.split('-') : []
                        const latestOffering = (course as any).offerings?.[0]
                        const rawYear = (course as any).params?.year || latestOffering?.year || activeParts[0] || '2027'
                        const year = Number(rawYear) >= MIN_ACADEMIC_YEAR ? String(rawYear) : '2027'
                        const semester = (course as any).params?.semester || latestOffering?.semester || activeParts[1] || '1'

                        setSelectingCourse({ id: course.id, name: course.name })
                        startTransition(() => {
                          router.push(`/courses/${cId}?dept=${dept}&deg=${degree}&year=${year}&sem=${semester}`)
                        })
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
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </div>
      </CommandDialog>
    </>
  )
}
