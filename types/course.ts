export interface RelatedCourse {
  id: string;
  name: string;
  relation: string;
  params: {
    dept: string;
    degree: string;
    course: string;
    year: string;
    semester: string;
  };
}

export interface CourseDetail {
  id: string;
  name: string;
  type?: string;
  exam?: string;
  gradeType?: string;
  points: string;
  hours: string;
  abstract: string;
  syllabusParams: string[] | null;
  relatedCourses: RelatedCourse[];
  semesterName: string;
  lecturers: string[];
  year?: string;
  semester?: string;
  offerings?: { year: string; semester: string; activeIn: string; name: string }[];
}
