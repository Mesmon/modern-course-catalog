import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dept = searchParams.get('dept');
  const degree = searchParams.get('degree');
  const course = searchParams.get('course');
  const year = searchParams.get('year');
  const semester = searchParams.get('semester');
  const courseName = searchParams.get('courseName') || course;

  if (!dept || !degree || !course || !year || !semester) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  const bodyParams = new URLSearchParams({
    rc_rowid: '',
    lang: 'he',
    st: 's',
    step: '6',
    rn_course_department: dept,
    rn_course_degree_level: degree,
    rn_course: course,
    rn_course_details: '',
    rn_year: year,
    rn_semester: semester,
    rn_course_ins: '0',
    rn_group_number: '',
  });

  try {
    const response = await fetch("https://bgu4u.bgu.ac.il/pls/scwp/!app.ann", {
      method: "POST",
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,he;q=0.8,ru;q=0.7",
        "cache-control": "max-age=0",
        "content-type": "application/x-www-form-urlencoded",
        "upgrade-insecure-requests": "1",
        "Referer": "https://bgu4u.bgu.ac.il/pls/scwp/!app.ann",
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch syllabus: ${response.status} ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/pdf';
    
    const safeName = encodeURIComponent(courseName as string);
    
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${course}_${safeName}.pdf"; filename*=UTF-8''${course}_${safeName}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
