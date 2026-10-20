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
    activeIn: 'פעיל ב',
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
    master: 'שני',
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
    copiedToClipboard: 'מזהה הקורס הועתק',
    prerequisiteFor: 'דרישת קדם עבור / חוסם'
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
    filterRelations: 'סינון קשרים',
    addToMap: 'הוסף למפה',
    suggestDepartment: 'הקורס לא נמצא? נסה להזין מספר מחלקה (לדוגמה 202) בחיפוש הראשי כדי למשוך את הקורסים שלה.',
    searchDeptBtn: 'משוך מחלקה',
    fetchingDept: 'מושך נתונים...',
    deptNotFound: 'לא נמצאו קורסים במחלקה זו.',
    deptFound: 'קורסי המחלקה נמשכו בהצלחה!',
    fetchDeptTitle: 'משיכת קורסי מחלקה',
    fetchDeptDesc: 'הזן את מספר המחלקה כדי למשוך את הקורסים שלה.',
    fetchDeptPlaceholder: 'לדוגמה: 202',
    cancel: 'ביטול',
    chronologicalLayout: 'סידור כרונולוגי'
  },
  onboarding: {
    title: 'ברוכים הבאים לקטלוג הקורסים של בן גוריון! 👋',
    description: 'בנינו את המערכת כדי להפוך את חיפוש הקורסים למהיר וקל יותר. הנה מה שאפשר לעשות:',
    features: {
      search: {
        title: 'חיפוש מהיר במיוחד',
        desc: 'מצאו כל קורס באופן מיידי ללא המתנה למערכות הישנות.'
      },
      map: {
        title: 'מפת תלויות אינטראקטיבית',
        desc: 'ויזואליזציה של דרישות קדם וקורסים קשורים במפת צמתים יפהפייה.'
      },
      offline: {
        title: 'שמירה חכמה',
        desc: 'הנתונים נשמרים מקומית כך שהם נטענים מיד בביקור הבא שלכם.'
      }
    },
    getStarted: 'הבנתי, בואו נתחיל!'
  },
  tour: {
    next: 'הבא',
    prev: 'הקודם',
    done: 'סיום',
    progressText: '{{current}} מתוך {{total}}',
    home: {
      searchTitle: 'חיפוש קורסים מהיר',
      searchDesc: 'הקלידו שם מחלקה או מספר כאן כדי לראות מיד את כל הקורסים הזמינים.',
      mapTitle: 'מפה אינטראקטיבית',
      mapDesc: 'לחצו כאן כדי לראות ויזואליזציה של דרישות הקדם ואיך קורסים מתקשרים זה לזה.',
      catalogTitle: 'קטלוג מלא',
      catalogDesc: 'עיינו ברשימה המלאה של הקורסים הזמינים וסננו אותם לפי הצורך.'
    },
    map: {
      searchTitle: 'הוספה למפה',
      searchDesc: 'חפשו מזהה קורס או שם כדי להוסיף אותו למפת התלויות שלכם.',
      addTitle: 'אישור הוספה',
      addDesc: 'לחצו על כפתור זה כדי להציב את הקורס הנבחר על לוח העבודה.',
      canvasTitle: 'לוח עבודה (Canvas)',
      canvasDesc: 'גררו קורסים, התקרבו/התרחקו, ולחצו על צמתים כדי לראות מידע מפורט וקשרים.'
    }
  },
  schedule: {
    title: 'מערכת שעות',
    subtitle: 'תכננו את מערכת השעות השבועית שלכם, בחרו קבוצות לימוד ועקבו אחר חפיפות.',
    addCourse: 'הוסף קורס',
    addToSchedule: 'הוסף למערכת שעות',
    editInSchedule: 'ערוך קבוצות במערכת',
    inSchedule: 'במערכת השעות',
    clearSchedule: 'נקה מערכת',
    searchPlaceholder: 'חפש קורס לפי שם או מספר להוספה...',
    selectGroupsTitle: 'בחירת קבוצות לימוד',
    selectGroupsDesc: 'בחרו את הקבוצות שברצונכם להוסיף למערכת השעות (ניתן לבחור גם עם חפיפה).',
    group: 'קבוצה',
    noGroupsAvailable: 'לא נמצאו קבוצות לימוד עם שעות קבועות לקורס זה בסמסטר הנוכחי.',
    noMeetings: 'ללא שעה שבועית קבועה',
    saveSelection: 'שמור במערכת',
    removeFromSchedule: 'הסר מהמערכת',
    cancel: 'ביטול',
    overlapWarning: 'חפיפה',
    totalCredits: 'נק"ז',
    totalCourses: 'קורסים',
    myCourses: 'קורסים במערכת',
    noCoursesScheduled: 'מערכת השעות ריקה',
    noCoursesScheduledDesc: 'חפשו קורס למעלה או הוסיפו קורסים ישירות מדף הקורס.',
    days: {
      'א': 'יום ראשון',
      'ב': 'יום שני',
      'ג': 'יום שלישי',
      'ד': 'יום רביעי',
      'ה': 'יום חמישי',
      'ו': 'יום שישי',
    },
    daysShort: {
      'א': "א'",
      'ב': "ב'",
      'ג': "ג'",
      'ד': "ד'",
      'ה': "ה'",
      'ו': "ו'",
    },
    addedToast: 'הקורס נוסף למערכת השעות',
    updatedToast: 'מערכת השעות עודכנה',
    removedToast: 'הקורס הוסר ממערכת השעות',
    fetchDeptBtn: 'משוך קורסי מחלקה',
    yearLabel: 'שנה',
    semesterLabel: 'סמסטר',
    semesters: {
      '1': "סמסטר א' (סתיו)",
      '2': "סמסטר ב' (אביב)",
      '3': 'סמסטר קיץ',
    },
    semestersShort: {
      '1': "סמסטר א'",
      '2': "סמסטר ב'",
      '3': 'קיץ',
    },
    onlyOfferedInTermHint: 'מוצגים רק קורסים המוצעים ב-',
    noCoursesInTerm: 'לא נמצאו קורסים המוצעים בסמסטר זה',
    notOfferedInTermToast: 'קורס זה אינו מוצע בסמסטר הנבחר.',
    addToGoogleCalendar: 'Google Calendar',
    addToAppleCalendar: 'Apple Calendar',
    googleCalendarTitle: 'ייצוא מערכת ליומן (Google / Apple)',
    googleCalendarDesc: 'הוסיפו כל שיעור כאירוע שבועי חוזר כולל בניין וכיתה ל-Google Calendar או ל-Apple Calendar.',
    openInGoogleCalendar: 'Google',
    openInAppleCalendar: 'Apple',
    downloadIcsAll: 'הוסף את כל המערכת ל-Apple Calendar / קובץ .ics',
    icsDownloadedToast: 'קובץ היומן (.ics) ירד! פתיחתו תוסיף את כל השיעורים החוזרים ל-Apple Calendar (או לייבוא ב-Google Calendar).',
  },
  auth: {
    signInWithGoogle: 'התחברות עם Google',
    signInSubtitle: 'לסטודנטים של בן-גוריון בלבד (@post.bgu.ac.il)',
    bguOnlyBadge: 'post.bgu.ac.il בלבד',
    signedInAs: 'מחובר כ-',
    cloudSynced: 'מסונכרן לענן (מערכת שעות ומפת קשרים)',
    syncing: 'מסנכרן...',
    syncNow: 'סנכרן עכשיו',
    signOut: 'התנתק',
    loginSuccessToast: 'התחברת בהצלחה! מערכת השעות ומפת הקשרים מסונכרנות לחשבונך.',
    logoutToast: 'התנתקת מהחשבון.',
    invalidDomainToast: 'ההתחברות מותרת אך ורק עם חשבון סטודנט של אוניברסיטת בן-גוריון (@post.bgu.ac.il).',
    authErrorToast: 'ההתחברות עם Google נכשלה. אנא נסו שוב.',
    syncedToast: 'הנתונים סונכרנו עם החשבון שלך.',
    missingConfigTitle: 'נדרשת הגדרת Google OAuth',
    missingConfigDesc: 'כדי להפעיל התחברות עם Google (@post.bgu.ac.il), יש להגדיר את משתני הסביבה הבאים בקובץ .env.local:',
  }
};

