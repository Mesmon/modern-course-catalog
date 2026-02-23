'use client';

import { CourseCard } from '@/components/CourseCard';
import { useAllCourses } from '@/hooks/useCourses';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

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
      {courses.map(course => {
        // Fallback extraction from id '202.1.1031' if params are missing
        const parts = course.id.split('.');
        const dept = (course as any).params?.dept || parts[0] || '202';
        const degree = (course as any).params?.degree || parts[1] || '1';
        const cId = (course as any).params?.course || parts[2] || course.id;
        const year = (course as any).params?.year || '2026';
        const semester = (course as any).params?.semester || '2';

        return (
          <Link 
            key={course.id} 
            href={`/courses/${cId}?dept=${dept}&deg=${degree}&year=${year}&sem=${semester}`} 
            className="block"
          >
            <CourseCard course={course} />
          </Link>
        );
      })}
    </>
  );
}
