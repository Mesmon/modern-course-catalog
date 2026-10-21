'use client';

import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvailableAcademicYears } from '@/lib/schedule';

interface Department {
  id: string;
  name: string;
}

interface DepartmentSearchProps {
  dictionary: any;
  locale: 'en' | 'he';
}

const POPULAR_DEPTS = [
  { id: '202', labelHe: 'הנדסת מערכות תוכנה ומידע', labelEn: 'Software & Info Systems' },
  { id: '201', labelHe: 'מדעי המחשב', labelEn: 'Computer Science' },
  { id: '361', labelHe: 'הנדסת חשמל ומחשבים', labelEn: 'Electrical Engineering' },
  { id: '364', labelHe: 'הנדסת תעשייה וניהול', labelEn: 'Industrial Engineering' },
];

export function DepartmentSearch({ dictionary, locale }: DepartmentSearchProps) {
  const isRtl = locale === 'he';
  const availableYears = useMemo(() => getAvailableAcademicYears(), []);
  const [query, setQuery] = useState('');
  const [degree, setDegree] = useState<'1' | '2'>('1');
  const [year, setYear] = useState('2027');
  const [semester, setSemester] = useState('1');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loadingDeptId, setLoadingDeptId] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (Array.isArray(data)) {
          setDepartments(data);
        } else {
          setDepartments([]);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDepartments();
  }, []);

  useEffect(() => {
    const filtered = departments.filter(
      (dept) =>
        query === '' ||
        dept.id.includes(query) ||
        dept.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredDepartments(filtered);
  }, [query, departments]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (deptId: string) => {
    const trimmed = deptId.trim();
    if (trimmed) {
      setIsOpen(false);
      setLoadingDeptId(trimmed);
      startTransition(() => {
        router.push(`/departments/${trimmed}?deg=${degree}&year=${year}&sem=${semester}`);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredDepartments.length - 1 ? prev + 1 : prev));
      setIsOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && filteredDepartments[selectedIndex]) {
        e.preventDefault();
        handleSearch(filteredDepartments[selectedIndex].id);
      } else if (query) {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isBusy = isNavigating && Boolean(loadingDeptId);

  return (
    <div className="w-full space-y-3" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Segmented Term & Degree Controls */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
          {(['1', '2'] as const).map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => setDegree(deg)}
              className={cn(
                'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer',
                degree === deg
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              {deg === '1' ? dictionary.department.bachelor : dictionary.department.master}
            </button>
          ))}
        </div>

        <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
          {availableYears.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setYear(yr)}
              className={cn(
                'px-2.5 py-1 rounded-md font-mono font-semibold transition-all cursor-pointer',
                year === yr
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              {yr}
            </button>
          ))}
        </div>

        <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
          {(['1', '2', '3'] as const).map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => setSemester(sem)}
              className={cn(
                'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer',
                semester === sem
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              {dictionary.schedule?.semesters?.[sem] || `${dictionary.department.semesterPrefix} ${sem}`}
            </button>
          ))}
        </div>
      </div>

      {/* Department Autocomplete Input */}
      <div className="relative" ref={containerRef}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              name="dept"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={dictionary.home.searchPlaceholder}
              disabled={isBusy}
              className="h-10 ps-10 pe-9 text-sm rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 focus:bg-white dark:focus:bg-slate-950 transition-colors"
              required
              autoComplete="off"
            />
            {(isLoading || isBusy) && (
              <div className="absolute top-1/2 -translate-y-1/2 end-3.5 h-4 w-4">
                <Loader2 className="h-full w-full animate-spin text-primary" />
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={isBusy}
            className="h-10 px-5 text-xs font-semibold rounded-lg gap-2 shrink-0 cursor-pointer shadow-2xs"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{isRtl ? `טוען מחלקה #${loadingDeptId}...` : `Loading #${loadingDeptId}...`}</span>
              </>
            ) : (
              <>
                <span>{dictionary.home.searchBtn}</span>
                <ArrowRight className={cn('h-3.5 w-3.5', isRtl && 'rotate-180')} />
              </>
            )}
          </Button>
        </form>

        {/* Modern Inline Loading Indicator when navigating to a department */}
        {isBusy && (
          <div className="mt-2.5 rounded-lg border border-orange-200/80 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/30 px-3.5 py-2.5 flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {isRtl
                    ? `שולף קורסים עבור מחלקה #${loadingDeptId}...`
                    : `Fetching courses for department #${loadingDeptId}...`}
                </span>
                <span className="text-muted-foreground ms-1.5 hidden sm:inline">
                  ({year} · {dictionary.schedule?.semesters?.[semester] || semester})
                </span>
              </div>
            </div>
            <span className="font-mono text-[11px] font-semibold text-primary px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 border border-orange-200/60 dark:border-orange-800/50">
              #{loadingDeptId}
            </span>
          </div>
        )}

        {isOpen && !isBusy && filteredDepartments.length > 0 && (
          <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">
            <ul className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredDepartments.map((dept, index) => (
                <li key={dept.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(dept.id);
                      setIsOpen(false);
                      handleSearch(dept.id);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full px-3 py-2 flex items-center justify-between gap-3 rounded-md text-start transition-colors cursor-pointer',
                      selectedIndex === index
                        ? 'bg-orange-50/80 dark:bg-orange-950/40 text-primary'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <span className="font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {dept.name}
                    </span>
                    <span className="font-mono text-xs font-semibold text-primary bg-orange-50 dark:bg-orange-950/50 px-1.5 py-0.5 rounded border border-orange-200/70 dark:border-orange-800/50 shrink-0">
                      #{dept.id}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quick Popular Department Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] text-muted-foreground me-1">
          {isRtl ? 'מחלקות נפוצות:' : 'Popular:'}
        </span>
        {POPULAR_DEPTS.map((d) => {
          const isThisLoading = isBusy && loadingDeptId === d.id;
          return (
            <button
              key={d.id}
              type="button"
              disabled={isBusy}
              onClick={() => handleSearch(d.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] transition-colors cursor-pointer',
                isThisLoading
                  ? 'border-primary bg-orange-50 dark:bg-orange-950/50 text-primary font-semibold'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-primary/50 hover:text-primary text-slate-600 dark:text-slate-400'
              )}
            >
              {isThisLoading ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              ) : (
                <span className="font-mono font-semibold text-primary">#{d.id}</span>
              )}
              <span>{isRtl ? d.labelHe : d.labelEn}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
