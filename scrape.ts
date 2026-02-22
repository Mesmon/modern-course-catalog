import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import fs from 'fs';

async function scrape() {
  const url = 'https://bgu4u.bgu.ac.il/pls/scwp/!app.ann';
  const params = new URLSearchParams();
  params.append('step', '2');
  params.append('lang', 'he');
  params.append('on_course_department', '202');
  params.append('on_course_degree_level', '1');

  try {
    console.log('Fetching data...');
    const response = await axios.post(url, params.toString(), {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('Decoding content...');
    const decodedHtml = iconv.decode(Buffer.from(response.data), 'win1255');
    const $ = cheerio.load(decodedHtml);

    const courses: any[] = [];

    // PL/SQL apps usually use tables. We'll look for rows that look like course entries.
    // This is a common pattern for these older systems. 
    // We'll iterate through tables and rows.
    $('table tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const id = $(cells[0]).text().trim();
        const name = $(cells[1]).text().trim();
        const points = $(cells[2]).text().trim();

        // Basic heuristic: ID is usually numeric or has a specific format
        // And we want to avoid header rows.
        if (id && name && !isNaN(parseFloat(points))) {
          courses.push({ id, name, points });
        }
      }
    });

    if (courses.length === 0) {
      console.log('No courses found with current selectors. Dumping HTML snippet for inspection...');
      console.log(decodedHtml.substring(0, 1000));
      // Save the full HTML for manual inspection if needed
      fs.writeFileSync('debug.html', decodedHtml, 'utf8');
    } else {
      console.log(`Found ${courses.length} courses.`);
      fs.writeFileSync('courses.json', JSON.stringify(courses, null, 2), 'utf8');
      console.log('Saved to courses.json');
    }
  } catch (error) {
    console.error('Error scraping:', error);
  }
}

console.log('Starting script...');
scrape().then(() => console.log('Script finished.')).catch(err => console.error('Unhandled error:', err));
