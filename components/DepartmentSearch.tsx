'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
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
    const filtered = departments.filter((dept) =>
      query === '' || 
      dept.id.includes(query) || 
      dept.name.toLowerCase().includes(query.toLowerCase())
    )
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
    if (deptId) {
      router.push(`/departments/${deptId}`);
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
    <div className="w-full relative" ref={containerRef}>
      <form 
        onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
        }} 
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
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
            className={cn(
               "h-14 text-xl rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-950 transition-all font-bold",
               locale === 'he' ? 'pr-12 text-right' : 'pl-12 text-left'
            )}
            required
            autoComplete="off"
          />
          <BookOpen className={cn(
              "absolute top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400",
              locale === 'he' ? 'right-4' : 'left-4'
          )} />
          
          {isLoading && (
            <div className={cn(
                "absolute top-1/2 -translate-y-1/2 h-5 w-5",
                locale === 'he' ? 'left-4' : 'right-4'
            )}>
              <Loader2 className="h-full w-full animate-spin text-primary/50" />
            </div>
          )}
        </div>
        <Button 
          type="submit"
          size="lg" 
          className="h-14 px-8 text-xl font-black rounded-xl gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all"
        >
          {dictionary.home.searchBtn}
          <ArrowRight className={cn("h-6 w-6", locale === 'he' && "rotate-180")} />
        </Button>
      </form>

      {isOpen && filteredDepartments.length > 0 && (
        <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-[300px] overflow-auto py-2">
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
                    "w-full px-4 py-3 flex items-center justify-between hover:bg-primary/5 transition-colors group",
                    selectedIndex === index && "bg-primary/5",
                    locale === 'he' ? 'flex-row text-right' : 'flex-row-reverse text-left'
                  )}
                >
                  <span className="text-slate-400 dark:text-slate-500 text-sm font-medium group-hover:text-primary transition-colors">#{dept.id}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">{dept.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
