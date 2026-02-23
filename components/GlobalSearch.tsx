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
import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/providers/DictionaryProvider"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const { data: courses = [] } = useAllCourses()
  const router = useRouter()
  const { dictionary, locale } = useDictionary()

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
      <Button 
        variant="outline" 
        className={`relative h-12 w-full justify-start rounded-xl bg-slate-50/80 hover:bg-white text-base font-normal text-muted-foreground shadow-sm hover:shadow-md transition-all sm:pr-14 md:w-full lg:w-[500px] border-slate-200`}
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center gap-3">
           <Search className="h-5 w-5 text-primary" />
           <span className="text-slate-500 font-medium">{dictionary.navbar.searchPlaceholder}</span>
        </span>
        <kbd className={`pointer-events-none absolute ${locale === 'he' ? 'left-[0.4rem]' : 'right-[0.4rem]'} top-[0.4rem] hidden h-8 select-none items-center gap-1 rounded-lg border bg-white px-2.5 font-mono text-[12px] font-bold text-slate-500 opacity-100 sm:flex shadow-sm`}>
          <span className="text-sm">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={dictionary.navbar.searchPlaceholder} className={locale === 'he' ? 'text-right' : 'text-left'} />
        <CommandList className={locale === 'he' ? 'text-right' : 'text-left'} dir={locale === 'en' ? 'ltr' : 'rtl'}>
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
                  const year = (course as any).params?.year || '2026'
                  const semester = (course as any).params?.semester || '2'
                  
                  router.push(`/courses/${cId}?dept=${dept}&deg=${degree}&year=${year}&sem=${semester}`)
                }}
                className="flex flex-col items-start py-3 px-4 cursor-pointer hover:bg-slate-50 rounded-lg m-1"
              >
                <div className="flex flex-col gap-1 w-full text-start">
                  <span className="font-bold text-slate-900 text-base">{course.name}</span>
                  <span className="text-sm text-slate-500 font-mono tracking-tight w-fit">{course.id}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
