const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const fs = require('fs');

async function scrape() {
  const url = 'https://bgu4u.bgu.ac.il/pls/scwp/!app.ann';
  const body = 'rc_rowid=&lang=he&st=s&step=2&oc_course_name=&on_course_ins=0&on_course_ins_list=0&on_course_department=202&on_course_department_list=202&on_course_degree_level=1&on_course_degree_level_list=1&on_course=&on_semester=&on_year=0&on_hours=&on_credit_points=&oc_lecturer_first_name=&oc_lecturer_last_name=&on_common=&on_lang=&oc_end_time=&oc_start_time=&on_campus=';

  try {
    console.log('Fetching course data...');
    const response = await axios.post(url, body, {
      responseType: 'arraybuffer',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,he;q=0.8,ru;q=0.7',
        'cache-control': 'max-age=0',
        'content-type': 'application/x-www-form-urlencoded',
        'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'cookie': 'bgush_nam=; bgush_ins=0; bgush_dpt=202; bgush_dgr=1; bgush_crs=; bgush_y=0; bgush_s=; bgush_h=; bgush_c=; bgush_fn=; bgush_ln=; bgush_cm=; _fbp=fb.2.1743024854264.48643726332473289; _tt_enable_cookie=1; _ttp=01JQA615BAG7HCVKZMTATSXHSS_.tt.2; _ga_SG20ZC32TC=GS2.3.s1749463910$o2$g1$t1749463918$j52$l0$h0; _ga_0ZQQBV2CGP=GS2.1.s1749502415$o2$g0$t1749502415$j60$l0$h1902191196; _gcl_au=1.1.1464321218.1769533465; _ga_VRLN2MJG9J=GS2.3.s1769533465$o31$g0$t1769533465$j60$l0$h0; ttcsid=1769533465326::TEZv9DWyyuivFesC7O3q.30.1769533475330.0; ttcsid_CGIKESRC77UDC08Q21B0=1769533465326::Vc652HX0JNTNvyG2bCyf.30.1769533475332.1; _ga_ELKYCMTE33=GS2.1.s1769533465$o68$g0$t1769533479$j46$l0$h0; _ga=GA1.1.107730129.1743024854; _ga_6K4BTCN258=GS2.1.s1771683038$o315$g1$t1771683038$j60$l0$h0; BIGipServerp_bgu4u=226314372.20480.0000; TS01f24ca7=019949e41a875681de02aa481fd9d70406a807b818600d3939996c16703291e2eebed9112d4713a530dcaa252e75b498895f2e9dfa',
        'Referer': 'https://bgu4u.bgu.ac.il/pls/scwp/!app.ann',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });

    console.log('Status:', response.status);
    const decodedHtml = iconv.decode(Buffer.from(response.data), 'win1255');
    fs.writeFileSync('debug.html', decodedHtml, 'utf8');

    const $ = cheerio.load(decodedHtml);
    const courses = [];

    // The table has id="courseTable". 
    // Column 0: Course ID (e.g., 202.1.2011)
    // Column 1: Active In (e.g., 2026-2)
    // Column 2: Course Name (e.g., מודלים חישוביים)
    
    $('#courseTable tbody tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 3) {
            const id = $(cells.eq(0)).text().trim();
            const activeIn = $(cells.eq(1)).text().trim();
            const name = $(cells.eq(2)).text().trim();
            
            if (id && name) {
                courses.push({ id, name, activeIn });
            }
        }
    });

    if (courses.length > 0) {
        fs.writeFileSync('courses.json', JSON.stringify(courses, null, 2), 'utf8');
        console.log(`Success! Found ${courses.length} courses.`);
    } else {
        console.log('No courses found.');
        console.log('Body length:', decodedHtml.length);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

scrape();
