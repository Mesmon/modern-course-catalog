'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Department {
  id: string;
  name: string;
}

interface DepartmentSearchProps {
  dictionary: any;
  locale: 'en' | 'he';
}

export function DepartmentSearch({ dictionary, locale }: DepartmentSearchProps) {
  const isRtl = locale === 'he';
  const [query, setQuery] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
      router.push(`/departments/${trimmed}`);
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

  return (
    <div className="w-full relative" ref={containerRef} dir={isRtl ? 'rtl' : 'ltr'}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query);
        }}
        className="flex flex-col sm:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4 text-slate-400 pointer-events-none"
          />
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
            className="h-11 ps-10 pe-9 text-sm rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-950 transition-colors"
            required
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute top-1/2 -translate-y-1/2 end-3.5 h-4 w-4">
              <Loader2 className="h-full w-full animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <Button
          type="submit"
          className="h-11 px-5 text-sm font-semibold rounded-xl gap-2 shrink-0 cursor-pointer"
        >
          <span>{dictionary.home.searchBtn}</span>
          <ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
        </Button>
      </form>

      {isOpen && filteredDepartments.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <ul className="max-h-64 overflow-y-auto p-1">
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
                    'w-full px-3 py-2 flex items-center justify-between gap-3 rounded-lg text-start transition-colors cursor-pointer',
                    selectedIndex === index
                      ? 'bg-slate-100 dark:bg-slate-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  )}
                >
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                    {dept.name}
                  </span>
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500 shrink-0">
                    #{dept.id}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
