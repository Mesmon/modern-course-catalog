import { useQuery } from '@tanstack/react-query';
import type { Course, DepartmentItem } from '@/lib/courses';

export type { Course, DepartmentItem };

export const COURSES_QUERY_KEY = ['courses'] as const;
export const DEPARTMENTS_QUERY_KEY = ['departments'] as const;

export async function fetchCoursesCatalog(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
}

export async function fetchDepartmentsCatalog(): Promise<DepartmentItem[]> {
  const res = await fetch('/api/departments');
  if (!res.ok) {
    throw new Error('Failed to fetch departments');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function useAllCourses(options?: {
  enabled?: boolean;
  initialData?: Course[];
}) {
  return useQuery<Course[]>({
    queryKey: COURSES_QUERY_KEY,
    queryFn: fetchCoursesCatalog,
    // Cache courses for 1 hour to prevent unnecessary DB hits
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    enabled: options?.enabled ?? true,
    ...(options?.initialData ? { initialData: options.initialData } : {}),
  });
}

export function useDepartments(options?: {
  enabled?: boolean;
  initialData?: DepartmentItem[];
}) {
  return useQuery<DepartmentItem[]>({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: fetchDepartmentsCatalog,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    enabled: options?.enabled ?? true,
    ...(options?.initialData ? { initialData: options.initialData } : {}),
  });
}

/**
 * Fast, allocation-light multi-token filter for BGU course IDs & Hebrew/English names.
 * Replaces rendering thousands of DOM nodes inside `cmdk` and cuts keystroke latency to <1ms.
 */
export function filterCoursesFast<T extends { id: string; name?: string }>(
  courses: T[],
  rawQuery: string,
  limit = 60,
  getDisplayName?: (course: T) => string
): { items: T[]; totalMatches: number } {
  if (!courses || courses.length === 0) {
    return { items: [], totalMatches: 0 };
  }

  const trimmed = rawQuery.trim().toLowerCase();
  if (!trimmed) {
    return {
      items: courses.slice(0, limit),
      totalMatches: courses.length,
    };
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const exactOrPrefixMatches: T[] = [];
  const substringMatches: T[] = [];

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const idLower = course.id.toLowerCase();
    const displayName = getDisplayName ? getDisplayName(course) : course.name || '';
    const nameLower = displayName.toLowerCase();

    let matchesAll = true;
    for (let t = 0; t < tokens.length; t++) {
      const tok = tokens[t];
      if (!idLower.includes(tok) && !nameLower.includes(tok)) {
        matchesAll = false;
        break;
      }
    }

    if (!matchesAll) continue;

    if (
      idLower.startsWith(trimmed) ||
      idLower.endsWith(`.${trimmed}`) ||
      nameLower.startsWith(trimmed)
    ) {
      exactOrPrefixMatches.push(course);
    } else {
      substringMatches.push(course);
    }
  }

  const totalMatches = exactOrPrefixMatches.length + substringMatches.length;
  const combined =
    exactOrPrefixMatches.length >= limit
      ? exactOrPrefixMatches.slice(0, limit)
      : [
          ...exactOrPrefixMatches,
          ...substringMatches.slice(0, limit - exactOrPrefixMatches.length),
        ];

  return { items: combined, totalMatches };
}
