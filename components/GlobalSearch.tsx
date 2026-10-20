"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
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
import { cn } from "@/lib/utils"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const { data: courses = [], refetch } = useAllCourses()
  const router = useRouter()
  const { dictionary, locale } = useDictionary()
  const isRtl = locale === 'he'

  React.useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, refetch])

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 px-3 text-sm text-muted-foreground transition-colors cursor-pointer"
      >
        <span className="inline-flex items-center gap-2 truncate">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {dictionary.navbar.searchPlaceholder}
          </span>
        </span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:inline-flex shrink-0">
          <span>⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          <CommandInput
            placeholder={dictionary.navbar.searchPlaceholder}
            className={isRtl ? 'text-right' : 'text-left'}
          />
          <CommandList className={isRtl ? 'text-right' : 'text-left'}>
            <CommandEmpty>{dictionary.navbar.noResults}</CommandEmpty>
            <CommandGroup heading={dictionary.home.fullCatalog}>
              {courses.map((course) => (
                <CommandItem
                  key={course.id}
                  value={`${course.id} ${course.name}`}
                  onSelect={() => {
                    setOpen(false)
                    const parts = course.id.split('.')
                    const dept = (course as any).params?.dept || parts[0] || '202'
                    const degree = (course as any).params?.degree || parts[1] || '1'
                    const cId = (course as any).params?.course || parts[2] || course.id
                    const activeParts = course.activeIn ? course.activeIn.split('-') : []
                    const latestOffering = (course as any).offerings?.[0]
                    const year = (course as any).params?.year || latestOffering?.year || activeParts[0] || '2027'
                    const semester = (course as any).params?.semester || latestOffering?.semester || activeParts[1] || '1'

                    router.push(`/courses/${cId}?dept=${dept}&deg=${degree}&year=${year}&sem=${semester}`)
                  }}
                  className={cn(
                    "flex items-center justify-between gap-3 py-2.5 px-3 cursor-pointer rounded-lg",
                    isRtl ? "text-right" : "text-left"
                  )}
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                    {course.name}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0">
                    {course.id}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </div>
      </CommandDialog>
    </>
  )
}
