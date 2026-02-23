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
    },
    semesterPrefix: 'Semester',
    yearPrefix: 'Year',
    coursesFound: 'Courses Found',
    filterResults: 'Filter Results',
    degree: 'Degree',
    bachelor: 'Bachelor',
    master: 'Master',
    courseDetails: 'Course Details',
    noCoursesTitle: 'No Courses Found',
    noCoursesDesc: 'We didn\'t find courses for this department in the current semester. Try checking another semester or department number.',
    backToSearch: 'Back to Search'
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
    register: 'Register in System',
    availableIn: 'Available in',
    computerScience: 'Computer Science',
    degreeLevel: 'Degree Level',
    bachelor: 'Bachelor',
    noAbstract: 'No abstract available.',
    quickInfo: 'Quick Info',
    courseId: 'Course ID',
    viewFullSyllabus: 'View Full Syllabus',
    syllabusNotAvailable: 'Syllabus Not Available',
    teachingStaff: 'Teaching Staff',
    relatedCourses: 'Related Courses',
    degree: 'Degree',
    syllabus: 'Syllabus',
    noSyllabus: 'No Syllabus',
    copiedToClipboard: 'Course ID copied to clipboard'
  },
  navbar: {
    title: 'BGU Catalog',
    searchPlaceholder: 'Search course by name or ID...',
    noResults: 'No courses found',
    logoText1: 'BGU',
    logoText2: 'Catalog'
  },
  map: {
    title: 'Dependency Map',
    addCourse: 'Add Course',
    clearMap: 'Clear Map',
    searchPlaceholder: 'Search to add course...',
    noConnections: 'No related courses found',
    loadingDetails: 'Loading details...',
    removeFromMap: 'Remove',
    relatedCourses: 'Related Courses',
    addToMap: 'Add to Map'
  }
};

export type Dictionary = typeof en;
