import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

export interface ScrapedJob {
  title: string;
  link: string;
  organization: string;
  lastDate: string;
  content: string;
  source: string;
  postedDate: string;
}

async function fetchPage(url: string, timeout = 20000): Promise<string> {
  const { data } = await axios.get(url, {
    timeout,
    headers: HEADERS,
    maxRedirects: 5,
  });
  return typeof data === 'string' ? data : JSON.stringify(data);
}

// =========================================================================
// 1. SarkariResult.com - Govt job results & notifications
// =========================================================================
export async function scrapeSarkariResult(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage('https://www.sarkariresult.com/');
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    // Latest jobs section
    $('#post li a, .post li a, .job_listing li a').each((_, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr('href') || '';
      if (title && link) {
        if (!link.startsWith('http')) link = `https://www.sarkariresult.com${link}`;
        jobs.push({ title, link, organization: '', lastDate: '', content: title, source: 'sarkariresult.com', postedDate: new Date().toISOString() });
      }
    });

    // Table format
    $('table.job_table tr, table tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const anchor = cells.first().find('a');
        const title = anchor.text().trim() || cells.first().text().trim();
        let link = anchor.attr('href') || '';
        const lastDate = cells.last().text().trim();
        if (title && title.length > 5) {
          if (link && !link.startsWith('http')) link = `https://www.sarkariresult.com${link}`;
          jobs.push({ title, link: link || 'https://www.sarkariresult.com', organization: '', lastDate, content: title, source: 'sarkariresult.com', postedDate: new Date().toISOString() });
        }
      }
    });

    console.log(`[Scraper] SarkariResult: ${jobs.length} jobs found`);
    return jobs;
  } catch (error) {
    console.error('[Scraper] SarkariResult failed:', (error as Error).message);
    return [];
  }
}

// =========================================================================
// 2. FreeJobAlert.com - Latest Notifications
// =========================================================================
export async function scrapeFreeJobAlert(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage('https://www.freejobalert.com/latest-notifications/');
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    $('table tbody tr, .entry-content table tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const anchor = cells.eq(0).find('a');
        const title = anchor.text().trim() || cells.eq(0).text().trim();
        const link = anchor.attr('href') || '';
        const lastDate = cells.eq(cells.length - 1).text().trim();
        if (title && title.length > 5 && link) {
          jobs.push({ title, link, organization: '', lastDate, content: title, source: 'freejobalert.com', postedDate: new Date().toISOString() });
        }
      }
    });

    if (jobs.length === 0) {
      $('article a, .entry-content a, .post a').each((_, el) => {
        const title = $(el).text().trim();
        const link = $(el).attr('href') || '';
        if (title && title.length > 10 && link && link.includes('freejobalert.com') && !link.includes('#') && !title.includes('Read More')) {
          jobs.push({ title, link, organization: '', lastDate: '', content: title, source: 'freejobalert.com', postedDate: new Date().toISOString() });
        }
      });
    }

    console.log(`[Scraper] FreeJobAlert: ${jobs.length} jobs found`);
    return jobs;
  } catch (error) {
    console.error('[Scraper] FreeJobAlert failed:', (error as Error).message);
    return [];
  }
}

// =========================================================================
// 3. SarkariExam.com
// =========================================================================
export async function scrapeSarkariExam(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage('https://www.sarkariexam.com/');
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    $('a').each((_, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr('href') || '';
      if (title && title.length > 10 && link && (
        link.includes('/recruitment') || link.includes('/result') ||
        link.includes('/admit-card') || link.includes('/notification') ||
        title.toLowerCase().includes('recruitment') ||
        title.toLowerCase().includes('vacancy') ||
        title.toLowerCase().includes('notification') ||
        title.toLowerCase().includes('apply')
      )) {
        if (!link.startsWith('http')) link = `https://www.sarkariexam.com${link}`;
        if (!jobs.some(j => j.title === title)) {
          jobs.push({ title, link, organization: '', lastDate: '', content: title, source: 'sarkariexam.com', postedDate: new Date().toISOString() });
        }
      }
    });

    console.log(`[Scraper] SarkariExam: ${jobs.length} jobs found`);
    return jobs;
  } catch (error) {
    console.error('[Scraper] SarkariExam failed:', (error as Error).message);
    return [];
  }
}

// =========================================================================
// 4. SSC Online (ssconline.nic.in) - SSC Official Notifications
// =========================================================================
export async function scrapeSSCOnline(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage('https://ssc.gov.in/', 25000);
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    // SSC notice board / latest updates
    $('a').each((_, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr('href') || '';
      if (title && title.length > 10 && (
        title.toLowerCase().includes('recruitment') ||
        title.toLowerCase().includes('notification') ||
        title.toLowerCase().includes('examination') ||
        title.toLowerCase().includes('cgl') ||
        title.toLowerCase().includes('chsl') ||
        title.toLowerCase().includes('mts') ||
        title.toLowerCase().includes('gd constable') ||
        title.toLowerCase().includes('steno') ||
        title.toLowerCase().includes('je') ||
        title.toLowerCase().includes('apply') ||
        title.toLowerCase().includes('admit card') ||
        title.toLowerCase().includes('result') ||
        title.toLowerCase().includes('vacancy') ||
        title.toLowerCase().includes('selection post')
      )) {
        if (!link.startsWith('http')) link = `https://ssc.gov.in${link.startsWith('/') ? '' : '/'}${link}`;
        if (!jobs.some(j => j.title === title)) {
          jobs.push({ title, link, organization: 'Staff Selection Commission (SSC)', lastDate: '', content: title, source: 'ssc.gov.in', postedDate: new Date().toISOString() });
        }
      }
    });

    // Try the notice board table
    $('table tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 1) {
        const anchor = cells.find('a').first();
        const title = anchor.text().trim() || cells.first().text().trim();
        let link = anchor.attr('href') || '';
        if (title && title.length > 10) {
          if (link && !link.startsWith('http')) link = `https://ssc.gov.in/${link}`;
          if (!jobs.some(j => j.title === title)) {
            jobs.push({ title, link: link || 'https://ssc.gov.in', organization: 'Staff Selection Commission (SSC)', lastDate: '', content: title, source: 'ssc.gov.in', postedDate: new Date().toISOString() });
          }
        }
      }
    });

    console.log(`[Scraper] SSC: ${jobs.length} items found`);
    return jobs;
  } catch (error) {
    console.error('[Scraper] SSC failed:', (error as Error).message);
    return [];
  }
}

// =========================================================================
// 5. UPSC (upsc.gov.in) - UPSC Exam Notifications
// =========================================================================
export async function scrapeUPSC(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage('https://upsc.gov.in/', 25000);
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    $('a').each((_, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr('href') || '';
      if (title && title.length > 10 && (
        title.toLowerCase().includes('examination') ||
        title.toLowerCase().includes('recruitment') ||
        title.toLowerCase().includes('notification') ||
        title.toLowerCase().includes('civil services') ||
        title.toLowerCase().includes('ias') ||
        title.toLowerCase().includes('ips') ||
        title.toLowerCase().includes('nda') ||
        title.toLowerCase().includes('cds') ||
        title.toLowerCase().includes('capf') ||
        title.toLowerCase().includes('engineering') ||
        title.toLowerCase().includes('medical') ||
        title.toLowerCase().includes('apply') ||
        title.toLowerCase().includes('vacancy')
      )) {
        if (!link.startsWith('http')) link = `https://upsc.gov.in${link.startsWith('/') ? '' : '/'}${link}`;
        if (!jobs.some(j => j.title === title)) {
          jobs.push({ title, link, organization: 'Union Public Service Commission (UPSC)', lastDate: '', content: title, source: 'upsc.gov.in', postedDate: new Date().toISOString() });
        }
      }
    });

    console.log(`[Scraper] UPSC: ${jobs.length} items found`);
    return jobs;
  } catch (error) {
    console.error('[Scraper] UPSC failed:', (error as Error).message);
    return [];
  }
}

// =========================================================================
// 6. IBPS (ibps.in) - Bank Jobs
// =========================================================================
export async function scrapeIBPS(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage('https://www.ibps.in/', 25000);
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    $('a').each((_, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr('href') || '';
      if (title && title.length > 10 && (
        title.toLowerCase().includes('po') ||
        title.toLowerCase().includes('clerk') ||
        title.toLowerCase().includes('specialist') ||
        title.toLowerCase().includes('officer') ||
        title.toLowerCase().includes('recruitment') ||
        title.toLowerCase().includes('notification') ||
        title.toLowerCase().includes('crp') ||
        title.toLowerCase().includes('rrb') ||
        title.toLowerCase().includes('apply') ||
        title.toLowerCase().includes('exam') ||
        title.toLowerCase().includes('admit card') ||
        title.toLowerCase().includes('result') ||
        title.toLowerCase().includes('vacancy')
      )) {
        if (!link.startsWith('http')) link = `https://www.ibps.in${link.startsWith('/') ? '' : '/'}${link}`;
        if (!jobs.some(j => j.title === title)) {
          jobs.push({ title, link, organization: 'IBPS', lastDate: '', content: title, source: 'ibps.in', postedDate: new Date().toISOString() });
        }
      }
    });

    console.log(`[Scraper] IBPS: ${jobs.length} items found`);
    return jobs;
  } catch (error) {
    console.error('[Scraper] IBPS failed:', (error as Error).message);
    return [];
  }
}

// =========================================================================
// 7. SBI Careers (sbi.co.in/careers) - SBI Bank Jobs
// =========================================================================
export async function scrapeSBICareers(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage('https://www.sbi.co.in/web/careers', 25000);
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    $('a').each((_, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr('href') || '';
      if (title && title.length > 10 && (
        title.toLowerCase().includes('recruitment') ||
        title.toLowerCase().includes('vacancy') ||
        title.toLowerCase().includes('notification') ||
        title.toLowerCase().includes('clerk') ||
        title.toLowerCase().includes('po') ||
        title.toLowerCase().includes('specialist') ||
        title.toLowerCase().includes('officer') ||
        title.toLowerCase().includes('apply') ||
        title.toLowerCase().includes('junior associate') ||
        title.toLowerCase().includes('sco') ||
        title.toLowerCase().includes('engagement')
      )) {
        if (!link.startsWith('http')) link = `https://www.sbi.co.in${link.startsWith('/') ? '' : '/'}${link}`;
        if (!jobs.some(j => j.title === title)) {
          jobs.push({ title, link, organization: 'State Bank of India (SBI)', lastDate: '', content: title, source: 'sbi.co.in', postedDate: new Date().toISOString() });
        }
      }
    });

    console.log(`[Scraper] SBI: ${jobs.length} items found`);
    return jobs;
  } catch (error) {
    console.error('[Scraper] SBI failed:', (error as Error).message);
    return [];
  }
}

// =========================================================================
// 8. RRB Apply (rrbapply.gov.in) - Railway Jobs
// =========================================================================
export async function scrapeRRB(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage('https://www.rrbapply.gov.in/', 25000);
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    $('a').each((_, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr('href') || '';
      if (title && title.length > 10 && (
        title.toLowerCase().includes('recruitment') ||
        title.toLowerCase().includes('ntpc') ||
        title.toLowerCase().includes('group d') ||
        title.toLowerCase().includes('alp') ||
        title.toLowerCase().includes('technician') ||
        title.toLowerCase().includes('je') ||
        title.toLowerCase().includes('notification') ||
        title.toLowerCase().includes('vacancy') ||
        title.toLowerCase().includes('apply') ||
        title.toLowerCase().includes('railway')
      )) {
        if (!link.startsWith('http')) link = `https://www.rrbapply.gov.in${link.startsWith('/') ? '' : '/'}${link}`;
        if (!jobs.some(j => j.title === title)) {
          jobs.push({ title, link, organization: 'Railway Recruitment Board (RRB)', lastDate: '', content: title, source: 'rrbapply.gov.in', postedDate: new Date().toISOString() });
        }
      }
    });

    // Also try rrbcdg.gov.in as alternative
    try {
      const html2 = await fetchPage('https://www.rrbcdg.gov.in/', 15000);
      const $2 = cheerio.load(html2);
      $2('a').each((_, el) => {
        const title = $2(el).text().trim();
        let link = $2(el).attr('href') || '';
        if (title && title.length > 10 && (
          title.toLowerCase().includes('recruitment') ||
          title.toLowerCase().includes('notification') ||
          title.toLowerCase().includes('vacancy') ||
          title.toLowerCase().includes('apply')
        )) {
          if (!link.startsWith('http')) link = `https://www.rrbcdg.gov.in${link.startsWith('/') ? '' : '/'}${link}`;
          if (!jobs.some(j => j.title === title)) {
            jobs.push({ title, link, organization: 'Railway Recruitment Board (RRB)', lastDate: '', content: title, source: 'rrbcdg.gov.in', postedDate: new Date().toISOString() });
          }
        }
      });
    } catch {
      // Secondary source failed, continue
    }

    console.log(`[Scraper] RRB: ${jobs.length} items found`);
    return jobs;
  } catch (error) {
    console.error('[Scraper] RRB failed:', (error as Error).message);
    return [];
  }
}

// =========================================================================
// 9. NCS Portal (ncs.gov.in) - National Career Service
// =========================================================================
export async function scrapeNCS(): Promise<ScrapedJob[]> {
  try {
    // NCS has a public API endpoint for government jobs
    const { data } = await axios.get('https://www.ncs.gov.in/api/govt-jobs', {
      timeout: 20000,
      headers: HEADERS,
      maxRedirects: 5,
    }).catch(() => ({ data: null }));

    const jobs: ScrapedJob[] = [];

    if (data && Array.isArray(data)) {
      for (const item of data.slice(0, 50)) {
        const title = item.title || item.jobTitle || '';
        const link = item.url || item.link || 'https://www.ncs.gov.in';
        if (title && title.length > 5) {
          jobs.push({
            title,
            link: link.startsWith('http') ? link : `https://www.ncs.gov.in${link}`,
            organization: item.organization || item.ministry || 'Government of India',
            lastDate: item.lastDate || item.closingDate || '',
            content: item.description || title,
            source: 'ncs.gov.in',
            postedDate: item.postedDate || new Date().toISOString(),
          });
        }
      }
    }

    // Fallback: scrape the HTML page
    if (jobs.length === 0) {
      const html = await fetchPage('https://www.ncs.gov.in/government-jobs', 25000).catch(() => '');
      if (html) {
        const $ = cheerio.load(html);
        $('a').each((_, el) => {
          const title = $(el).text().trim();
          let link = $(el).attr('href') || '';
          if (title && title.length > 10 && (
            title.toLowerCase().includes('recruitment') ||
            title.toLowerCase().includes('vacancy') ||
            title.toLowerCase().includes('notification') ||
            title.toLowerCase().includes('apply')
          )) {
            if (!link.startsWith('http')) link = `https://www.ncs.gov.in${link}`;
            if (!jobs.some(j => j.title === title)) {
              jobs.push({ title, link, organization: 'Government of India', lastDate: '', content: title, source: 'ncs.gov.in', postedDate: new Date().toISOString() });
            }
          }
        });
      }
    }

    console.log(`[Scraper] NCS: ${jobs.length} items found`);
    return jobs;
  } catch (error) {
    console.error('[Scraper] NCS failed:', (error as Error).message);
    return [];
  }
}

// =========================================================================
// 10. Employment News (employmentnews.gov.in) - Govt Employment News
// =========================================================================
export async function scrapeEmploymentNews(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage('https://www.employmentnews.gov.in/', 25000);
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    $('a').each((_, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr('href') || '';
      if (title && title.length > 10 && (
        title.toLowerCase().includes('recruitment') ||
        title.toLowerCase().includes('vacancy') ||
        title.toLowerCase().includes('notification') ||
        title.toLowerCase().includes('job') ||
        title.toLowerCase().includes('walk-in') ||
        title.toLowerCase().includes('apply') ||
        title.toLowerCase().includes('openings') ||
        title.toLowerCase().includes('post')
      )) {
        if (!link.startsWith('http')) link = `https://www.employmentnews.gov.in${link.startsWith('/') ? '' : '/'}${link}`;
        if (!jobs.some(j => j.title === title)) {
          jobs.push({ title, link, organization: '', lastDate: '', content: title, source: 'employmentnews.gov.in', postedDate: new Date().toISOString() });
        }
      }
    });

    // Also check employment.gov.in (Ministry of Labour)
    try {
      const html2 = await fetchPage('https://www.employment.gov.in/', 15000);
      const $2 = cheerio.load(html2);
      $2('a').each((_, el) => {
        const title = $2(el).text().trim();
        let link = $2(el).attr('href') || '';
        if (title && title.length > 10 && (
          title.toLowerCase().includes('recruitment') ||
          title.toLowerCase().includes('vacancy') ||
          title.toLowerCase().includes('notification')
        )) {
          if (!link.startsWith('http')) link = `https://www.employment.gov.in${link}`;
          if (!jobs.some(j => j.title === title)) {
            jobs.push({ title, link, organization: '', lastDate: '', content: title, source: 'employment.gov.in', postedDate: new Date().toISOString() });
          }
        }
      });
    } catch {
      // Secondary source failed
    }

    console.log(`[Scraper] EmploymentNews: ${jobs.length} items found`);
    return jobs;
  } catch (error) {
    console.error('[Scraper] EmploymentNews failed:', (error as Error).message);
    return [];
  }
}

// =========================================================================
// Scrape individual job detail page to get more info
// =========================================================================
export async function scrapeJobDetail(url: string): Promise<string> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // Remove scripts, styles, nav, footer
    $('script, style, nav, footer, header, .sidebar, .comment, .widget').remove();

    // Get main content
    const content = $('article, .entry-content, .post-content, .job-detail, main, #content, .content').first().text().trim();
    if (content && content.length > 100) {
      return content.substring(0, 5000);
    }

    // Fallback to body text
    return $('body').text().trim().substring(0, 5000);
  } catch (error) {
    console.error(`[Scraper] Detail page failed for ${url}:`, (error as Error).message);
    return '';
  }
}

// =========================================================================
// Scrape ALL sources (called by job-fetcher pipeline)
// =========================================================================
export async function scrapeAllSources(): Promise<ScrapedJob[]> {
  console.log('[Scraper] Starting scrape of all sources...');

  const results = await Promise.allSettled([
    // Primary aggregator sites (most reliable)
    scrapeSarkariResult(),
    scrapeFreeJobAlert(),
    scrapeSarkariExam(),
    // Official government websites
    scrapeSSCOnline(),
    scrapeUPSC(),
    scrapeIBPS(),
    scrapeSBICareers(),
    scrapeRRB(),
    scrapeNCS(),
    scrapeEmploymentNews(),
  ]);

  const jobs: ScrapedJob[] = [];
  const sourceNames = [
    'SarkariResult', 'FreeJobAlert', 'SarkariExam',
    'SSC', 'UPSC', 'IBPS', 'SBI', 'RRB', 'NCS', 'EmploymentNews'
  ];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      jobs.push(...result.value);
      console.log(`[Scraper] ${sourceNames[i]}: ${result.value.length} jobs`);
    } else {
      console.error(`[Scraper] ${sourceNames[i]}: FAILED - ${result.reason}`);
    }
  }

  // Deduplicate by title similarity
  const unique: ScrapedJob[] = [];
  const seen = new Set<string>();
  for (const job of jobs) {
    const key = job.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
    if (!seen.has(key) && key.length > 5) {
      seen.add(key);
      unique.push(job);
    }
  }

  console.log(`[Scraper] Total: ${jobs.length} raw, ${unique.length} unique jobs from ${sourceNames.length} sources`);
  return unique;
}
