import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { CourseDetail, RelatedCourse } from '@/types/course';

export async function fetchCourseList(dept: string, degree: string = '1', year: string = '2026', semester: string = '2') {
  const url = 'https://bgu4u.bgu.ac.il/pls/scwp/!app.ann';
  const body = `rc_rowid=&lang=he&st=s&step=2&oc_course_name=&on_course_ins=0&on_course_ins_list=0&on_course_department=${dept}&on_course_department_list=${dept}&on_course_degree_level=${degree}&on_course_degree_level_list=${degree}&on_course=&on_semester=&on_year=0&on_hours=&on_credit_points=&oc_lecturer_first_name=&oc_lecturer_last_name=&on_common=&on_lang=&oc_end_time=&oc_start_time=&on_campus=`;

  const response = await fetch(url, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    },
  });

  const buffer = await response.arrayBuffer();
  const html = iconv.decode(Buffer.from(buffer), 'win1255');
  const $ = cheerio.load(html);
  const courses: any[] = [];

  $('#courseTable tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 3) {
      courses.push({
        id: $(cells.eq(0)).text().trim(),
        activeIn: $(cells.eq(1)).text().trim(),
        name: $(cells.eq(2)).text().trim(),
        params: { dept, degree, year, semester }
      });
    }
  });

  return courses;
}

export async function fetchCourseDetail(params: {
  courseId: string;
  dept: string;
  degree: string;
  year: string;
  semester: string;
}): Promise<CourseDetail> {
  const url = 'https://bgu4u.bgu.ac.il/pls/scwp/!app.ann';
  
  const body = new URLSearchParams({
    rc_rowid: '',
    lang: 'he',
    st: 's',
    step: '3',
    rn_course: params.courseId,
    rn_course_department: params.dept,
    rn_course_degree_level: params.degree,
    rn_year: params.year,
    rn_semester: params.semester,
    rn_course_ins: '0',
    rn_course_details: '',
  }).toString();

  const response = await fetch(url, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Referer': 'https://bgu4u.bgu.ac.il/pls/scwp/!app.ann',
    },
  });

  const buffer = await response.arrayBuffer();
  const html = iconv.decode(Buffer.from(buffer), 'win1255');
  const $ = cheerio.load(html);

  const getVal = (keyText: string) => {
    return $(`.props li:has(.key:contains("${keyText}")) .val`).first().text().trim();
  };

  const extractParams = (attr: string | undefined) => {
    if (!attr) return null;
    const match = attr.match(/\((.*?)\)/);
    return match ? match[1].split(',').map(s => s.replace(/'/g, '').trim()) : null;
  };

  const courseDetail: CourseDetail = {
    id: getVal('מספר קורס') || params.courseId,
    name: getVal('שם הקורס'),
    type: getVal('סוג המסגרת') || getVal('סוג קורס') || '',
    exam: getVal('אופן בחינה') || getVal('מבחן') || '',
    gradeType: getVal('סוג ציון') || getVal('סוג הציון') || '',
    points: getVal('נקודות זכות').split('\n')[0].trim(),
    hours: getVal('שעות'),
    abstract: getVal('תקציר') || 'אין תקציר זמין לקורס זה.',
    semesterName: $('.CourseName').text().trim(),
    syllabusParams: extractParams($(`.props li:has(.key:contains("קובץ סילבוס")) a`).attr('href')),
    relatedCourses: [],
    lecturers: [],
  };

  // Extract lecturers
  $(`.CourseStaff tbody tr`).each((_, row) => {
    const cols = $(row).find('td');
    if (cols.length >= 2) {
      const role = $(cols[0]).text().trim();
      const name = $(cols[1]).text().trim();
      if (name && !courseDetail.lecturers.includes(`${role} ${name}`.trim())) {
        courseDetail.lecturers.push(`${role}: ${name}`.trim());
      }
    }
  });

  $(`.props li:has(.key:contains("קורסים קשורים")) .val`).contents().each((_, node) => {
    if (node.type === 'tag' && node.name === 'a') {
      const $node = $(node);
      const name = $node.text().trim();
      const href = $node.attr('href');
      const paramsArr = extractParams(href);
      
      const prevText = (node.prev as any)?.data || '';
      const courseId = prevText.match(/\d{3}\.\d\.\d{4}/)?.[0] || '';
      
      const nextText = (node.next as any)?.data || '';
      // Sometimes there's another node or just empty space, we need a robust regex to clean up relation
      const relationRaw = nextText.split('\n')[0].trim();
      // Relation text might be directly after the </a> tag. Clean up &nbsp; and spacing:
      const relation = relationRaw.replace(/^&nbsp;|\s+/g, ' ').replace(/&nbsp;/g, ' ').trim();

      if (courseId && paramsArr) {
        // Also check if valid JS params were extracted (paramsArr is not null and has length)
        if (paramsArr.length >= 5) {
          courseDetail.relatedCourses.push({
            id: courseId,
            name,
            relation,
            params: {
              dept: paramsArr[0],
              degree: paramsArr[1],
              course: paramsArr[2],
              year: paramsArr[3],
              semester: paramsArr[4],
            }
          });
        }
      }
    }
  });

  return courseDetail;
}

export async function fetchDepartments() {
  const url = 'https://bgu4u.bgu.ac.il/pls/scwp/!app.ann';
  const body = 'rc_rowid=&lang=he&st=s&step=1';

  const response = await fetch(url, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    },
  });

  const buffer = await response.arrayBuffer();
  const html = iconv.decode(Buffer.from(buffer), 'win1255');
  const $ = cheerio.load(html);
  
  const departments: { id: string, name: string }[] = [];
  $('#on_course_department_list option').each((_, el) => {
    const value = $(el).val() as string;
    const text = $(el).text().trim();
    if (value && text) {
      departments.push({ id: value, name: text });
    }
  });

  return departments;
}

