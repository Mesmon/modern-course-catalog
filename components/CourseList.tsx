'use client';

import { CourseCard } from '@/components/CourseCard';
import { useAllCourses } from '@/hooks/useCourses';
import { Loader2 } from 'lucide-react';

export function CourseList() {
  const { data: courses, isLoading, error } = useAllCourses();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 col-span-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !courses) {
    return (
      <div className="text-center py-20 text-red-500 col-span-full font-bold">
        Failed to load courses. Please try again later.
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground col-span-full">
        No courses found.
      </div>
    );
  }

  return (
    <>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </>
  );
}
