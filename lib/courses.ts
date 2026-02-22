import coursesData from '@/courses.json';

export interface Course {
  id: string;
  name: string;
  activeIn: string;
}

const courses: Course[] = coursesData as Course[];

export function getAllCourses(): Course[] {
  return courses;
}

export function searchCourses(query: string): Course[] {
  if (!query) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return courses.filter((course) => 
    course.name.toLowerCase().includes(lowerQuery) || 
    course.id.includes(lowerQuery)
  );
}

export function getCoursesByDepartment(deptId: string): Course[] {
  if (!deptId) return [];
  
  return courses.filter((course) => course.id.startsWith(deptId + '.'));
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((course) => course.id === id);
}
