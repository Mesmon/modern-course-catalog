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
    }
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
    register: 'הרשמה במערכת'
  },
  navbar: {
    title: 'קטלוג BGU',
    searchPlaceholder: 'חיפוש קורס לפי שם או מזהה...',
    noResults: 'לא נמצאו קורסים',
  }
};
