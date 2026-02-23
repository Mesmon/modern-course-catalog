import { Dictionary } from './en';

export const he: Dictionary = {
  common: {
    search: 'חיפוש',
    loading: 'טוען...',
    error: 'אירעה שגיאה',
    retry: 'נסה שוב',
    back: 'חזור',
  },
  home: {
    tagline: 'הדרך החדשה לחקור קורסים',
    title: 'קטלוג הקורסים',
    titleSuffix: 'המודרני',
    description: 'חיפוש מהיר, ממשק נקי וחוויית משתמש חלקה עבור קטלוג הקורסים של אוניברסיטת בן-גוריון.',
    searchTitle: 'חיפוש לפי מחלקה',
    searchDesc: 'הזן את מספר המחלקה כדי לצפות בכל הקורסים המוצעים.',
    searchPlaceholder: 'לדוגמה: 202',
    searchBtn: 'חפש עכשיו',
    features: {
      speed: {
        title: 'מהירות שיא',
        desc: 'גישה מיידית לנתוני קורסים ללא המתנה לממשקים ישנים.'
      },
      data: {
        title: 'שימור נתונים',
        desc: 'המערכת שומרת נתונים באופן חכם לשימוש עתידי.'
      },
      design: {
        title: 'עיצוב מודרני',
        desc: 'ממשק נקי ומותאם לכל מכשיר, עם תמיכה מלאה בעברית.'
      }
    },
    fullCatalog: 'קטלוג הקורסים המלא',
  },
  department: {
    back: 'חזרה לקטלוג',
    title: 'מחלקה',
    stats: {
      courses: 'קורסים',
      credits: 'נק"ז',
      hours: 'שעות'
    },
    noCourses: 'לא נמצאו קורסים למחלקה זו.',
    filters: {
      all: 'הכל',
      fall: 'סמסטר א׳',
      spring: 'סמסטר ב׳',
      summer: 'סמסטר קיץ',
      search: 'חיפוש קורסים...'
    },
    semesterPrefix: 'סמסטר',
    yearPrefix: 'שנת',
    coursesFound: 'קורסים נמצאו',
    filterResults: 'סינון תוצאות',
    degree: 'תואר',
    bachelor: 'ראשון',
    master: 'שני',
    courseDetails: 'פרטי קורס',
    noCoursesTitle: 'לא נמצאו קורסים',
    noCoursesDesc: 'לא מצאנו קורסים עבור מחלקה זו בסמסטר הנוכחי. נסה לבדוק סמסטר אחר או מספר מחלקה שונה.',
    backToSearch: 'חזרה לחיפוש'
  },
  course: {
    points: 'נק"ז',
    hours: 'שעות',
    lecturer: 'מרצה',
    semester: 'סמסטר',
    type: 'סוג קורס',
    exam: 'מבחן',
    work: 'עבודה',
    noExam: 'ללא מבחן',
    unknown: 'לא ידוע',
    gradeType: 'סוג ציון',
    numeric: 'מספרי',
    passFail: 'עובר/נכשל',
    description: 'תיאור הקורס',
    prerequisites: 'דרישות קדם',
    register: 'הרשמה במערכת',
    availableIn: 'זמין ב',
    computerScience: 'מדעי המחשב',
    degreeLevel: 'רמת תואר',
    bachelor: 'ראשון',
    noAbstract: 'לא נמצא תקציר לקורס זה.',
    quickInfo: 'מידע מהיר',
    courseId: 'מזהה קורס',
    viewFullSyllabus: 'צפה בסילבוס המלא',
    syllabusNotAvailable: 'סילבוס לא זמין',
    teachingStaff: 'סגל הוראה',
    relatedCourses: 'קורסים קשורים',
    degree: 'תואר',
    syllabus: 'סילבוס',
    noSyllabus: 'אין סילבוס',
    copiedToClipboard: 'מזהה הקורס הועתק'
  },
  navbar: {
    title: 'קטלוג BGU',
    searchPlaceholder: 'חיפוש קורס לפי שם או מזהה...',
    noResults: 'לא נמצאו קורסים',
    logoText1: 'קטלוג',
    logoText2: 'קורסים'
  },
  map: {
    title: 'מפת תלויות',
    addCourse: 'הוסף קורס',
    clearMap: 'נקה מפה',
    searchPlaceholder: 'חפש להוספת קורס...',
    noConnections: 'לא נמצאו קורסים קשורים',
    loadingDetails: 'טוען פרטים...',
    removeFromMap: 'הסר',
    relatedCourses: 'קורסים קשורים',
    addToMap: 'הוסף למפה'
  }
};
