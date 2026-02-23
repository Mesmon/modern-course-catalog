export const en = {
  common: {
    search: 'Search',
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    back: 'Back',
  },
  home: {
    tagline: 'The Modern Way to Explore Courses',
    title: 'The Modern',
    titleSuffix: 'Course Catalog',
    description: 'Fast search, clean interface, and seamless user experience for the Ben-Gurion University course catalog.',
    searchTitle: 'Search by Department',
    searchDesc: 'Enter the department number to view all offered courses.',
    searchPlaceholder: 'e.g., 202',
    searchBtn: 'Search Now',
    features: {
      speed: {
        title: 'Lightning Fast',
        desc: 'Instant access to course data without waiting for legacy interfaces.'
      },
      data: {
        title: 'Data Preservation',
        desc: 'The system intelligently saves data for future use.'
      },
      design: {
        title: 'Modern Design',
        desc: 'Clean interface optimized for any device, with full Hebrew and English support.'
      }
    },
    fullCatalog: 'Full Course Catalog',
  },
  department: {
    back: 'Back to Catalog',
    title: 'Department',
    stats: {
      courses: 'Courses',
      credits: 'Credits',
      hours: 'Hours'
    },
    noCourses: 'No courses found for this department.',
    filters: {
      all: 'All',
      fall: 'Fall',
      spring: 'Spring',
      summer: 'Summer',
      search: 'Search courses...'
    }
  },
  course: {
    points: 'Credits',
    hours: 'Hours',
    lecturer: 'Lecturer',
    semester: 'Semester',
    type: 'Course Type',
    exam: 'Exam',
    work: 'Work',
    noExam: 'No Exam',
    unknown: 'Unknown',
    gradeType: 'Grade Type',
    numeric: 'Numeric',
    passFail: 'Pass/Fail',
    description: 'Course Description',
    prerequisites: 'Prerequisites',
    register: 'Register in System'
  },
  navbar: {
    title: 'BGU Catalog',
    searchPlaceholder: 'Search course by name or ID...',
    noResults: 'No courses found',
  }
};

export type Dictionary = typeof en;
