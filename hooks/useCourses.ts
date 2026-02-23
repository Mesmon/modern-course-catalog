import { useQuery } from '@tanstack/react-query';
import { Course } from '@/lib/courses';

export function useAllCourses() {
  return useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
    // Cache courses for 1 hour to prevent unnecessary DB hits
    staleTime: 60 * 60 * 1000, 
  });
}
