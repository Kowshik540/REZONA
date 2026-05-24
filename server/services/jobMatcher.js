// server/services/jobMatcher.js
// India Job Aggregator with deep skill-match scoring and filtration support

const axios = require('axios');

const ADZUNA_APP_ID  = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const JSEARCH_KEY    = process.env.JSEARCH_API_KEY;

// Skill weights — higher = more in demand / harder to fake
const SKILL_WEIGHTS = {
  // High weight: specialized, hard skills
  'machine learning': 5, 'deep learning': 5, 'tensorflow': 5, 'pytorch': 5,
  'kubernetes': 5, 'aws': 4, 'azure': 4, 'gcp': 4, 'docker': 4,
  'react': 4, 'angular': 4, 'vue': 4, 'node.js': 4, 'nodejs': 4,
  'python': 4, 'java': 4, 'typescript': 4, 'go': 4, 'rust': 4,
  'graphql': 4, 'postgresql': 4, 'mongodb': 3, 'redis': 3,
  // Medium weight: common but important
  'javascript': 3, 'express': 3, 'django': 3, 'flask': 3, 'fastapi': 3,
  'sql': 3, 'mysql': 3, 'pandas': 3, 'numpy': 3, 'scikit-learn': 3,
  'ci/cd': 3, 'devops': 3, 'linux': 3, 'nginx': 3, 'terraform': 3,
  'react native': 3, 'flutter': 3, 'kotlin': 3, 'swift': 3,
  // Lower weight: very common, easy to list
  'html': 1, 'css': 1, 'git': 2, 'github': 2, 'jira': 2,
  'agile': 2, 'scrum': 2, 'figma': 2, 'postman': 2,
};

/**
 * Main export
 * @param {string[]} resumeSkills  - skills from resume
 * @param {string}   jobTitle      - target job title
 * @param {string}   city          - city filter
 * @param {object}   filters       - { jobType, remote, minMatch, sortBy }
 */
async function fetchJobs(resumeSkills = [], jobTitle = '', city = '', filters = {}) {
  const query = buildQuery(resumeSkills, jobTitle);

  const [adzuna, jsearch, remotive, unstop, arbeitnow] = await Promise.allSettled([
    fetchAdzuna(query, city),
    fetchJSearch(query, city),
    fetchRemotive(query),
    fetchUnstop(query),
    fetchArbeitnow(query),
  ]);

  const all = [
    ...(adzuna.status   === 'fulfilled' ? adzuna.value   : []),
    ...(jsearch.status  === 'fulfilled' ? jsearch.value  : []),
    ...(remotive.status === 'fulfilled' ? remotive.value : []),
    ...(unstop.status   === 'fulfilled' ? unstop.value   : []),
    ...(arbeitnow.status === 'fulfilled' ? arbeitnow.value : []),
  ];

  // Deduplicate
  const seen = new Set();
  const unique = all.filter(j => {
    const key = `${(j.title||'').toLowerCase().trim()}|${(j.company||'').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Compute deep match score for every job
  const scored = unique.map(j => ({
    ...j,
    ...computeMatchScore(j, resumeSkills),
  }));

  // Apply filters
  let filtered = applyFilters(scored, filters);

  // Sort
  const sortBy = filters.sortBy || 'match';
  if (sortBy === 'match')  filtered.sort((a, b) => b.matchScore - a.matchScore);
  if (sortBy === 'date')   filtered.sort((a, b) => new Date(b.postedDate||0) - new Date(a.postedDate||0));
  if (sortBy === 'salary') filtered.sort((a, b) => (b.salaryNum||0) - (a.salaryNum||0));

  return filtered.slice(0, 50);
}

// ─── Deep Match Scorer ────────────────────────────────────────────────────────
function computeMatchScore(job, resumeSkills) {
  const jdText = `${job.title} ${job.description}`.toLowerCase();

  // Extract skills mentioned in job description
  const allSkills = Object.keys(SKILL_WEIGHTS);
  const jdSkills = allSkills.filter(s =>
    new RegExp(`\\b${s.replace(/\./g,'\\.')}\\b`, 'i').test(jdText)
  );

  if (jdSkills.length === 0) {
    // No skills found in JD — do basic title match
    const titleWords = (job.title||'').toLowerCase().split(/\s+/);
    const resumeWords = resumeSkills.map(s => s.toLowerCase());
    const overlap = titleWords.filter(w => resumeWords.some(r => r.includes(w) || w.includes(r)));
    const basic = Math.min(60, overlap.length * 15);
    return { matchScore: basic, matchedSkills: [], missingSkills: [], jdSkills: [] };
  }

  // Weighted score
  const totalWeight  = jdSkills.reduce((sum, s) => sum + (SKILL_WEIGHTS[s]||2), 0);
  const resumeLower  = resumeSkills.map(s => s.toLowerCase());

  const matchedSkills  = jdSkills.filter(s => resumeLower.includes(s));
  const missingSkills  = jdSkills.filter(s => !resumeLower.includes(s));

  const earnedWeight = matchedSkills.reduce((sum, s) => sum + (SKILL_WEIGHTS[s]||2), 0);
  const skillRatio   = totalWeight > 0 ? earnedWeight / totalWeight : 0;

  // Recency bonus (up to 10 pts)
  let recencyBonus = 0;
  if (job.postedDate) {
    const days = (Date.now() - new Date(job.postedDate)) / 86400000;
    if (days < 2)  recencyBonus = 10;
    else if (days < 5)  recencyBonus = 7;
    else if (days < 10) recencyBonus = 4;
    else if (days < 14) recencyBonus = 2;
  }

  // Title match bonus (up to 10 pts)
  const titleBonus = (job.title||'').toLowerCase().split(/\s+/)
    .some(w => resumeSkills.some(s => s.toLowerCase().includes(w))) ? 5 : 0;

  const raw = Math.round(skillRatio * 80 + recencyBonus + titleBonus);
  const matchScore = Math.min(99, Math.max(5, raw));

  return { matchScore, matchedSkills, missingSkills, jdSkills };
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function applyFilters(jobs, filters = {}) {
  let result = jobs;

  // Minimum match score
  if (filters.minMatch && filters.minMatch > 0) {
    result = result.filter(j => j.matchScore >= filters.minMatch);
  }

  // Job type
  if (filters.jobType && filters.jobType !== 'All') {
    result = result.filter(j =>
      (j.jobType||'').toLowerCase().includes(filters.jobType.toLowerCase())
    );
  }

  // Remote only
  if (filters.remote === true) {
    result = result.filter(j => j.remote === true);
  }

  // Source filter
  if (filters.source && filters.source !== 'All') {
    result = result.filter(j => j.source === filters.source);
  }

  return result;
}

// ─── Adzuna India ─────────────────────────────────────────────────────────────
async function fetchAdzuna(query, city) {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) return [];
  const params = {
    app_id: ADZUNA_APP_ID, app_key: ADZUNA_APP_KEY,
    results_per_page: 12, what: query, sort_by: 'date',
  };
  if (city && !city.toLowerCase().includes('remote') && !city.toLowerCase().includes('india')) {
    params.where = city;
  }
  try {
    const res = await axios.get('https://api.adzuna.com/v1/api/jobs/in/search/1', { params, timeout: 10000 });
    return (res.data.results || []).map(j => ({
      id:          `adzuna-${j.id}`,
      title:       j.title || '',
      company:     j.company?.display_name || '',
      location:    j.location?.display_name || 'India',
      description: (j.description || '').replace(/<[^>]*>/g,'').slice(0,500),
      url:         j.redirect_url,
      salary:      adzunaSalary(j.salary_min, j.salary_max),
      salaryNum:   j.salary_min || 0,
      postedDate:  j.created,
      source:      'Adzuna',
      jobType:     j.contract_time === 'part_time' ? 'Part-time' : 'Full-time',
      remote:      false,
    }));
  } catch(e) { console.error('[Adzuna]', e.message); return []; }
}

// ─── JSearch (LinkedIn, Indeed, Naukri, Glassdoor) ────────────────────────────
async function fetchJSearch(query, city) {
  if (!JSEARCH_KEY) return [];
  const location = city && !city.toLowerCase().includes('india') ? `${city}, India` : 'India';
  try {
    const res = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: { query: `${query} ${location}`, page:'1', num_pages:'1', date_posted:'week', country:'in' },
      headers: { 'X-RapidAPI-Key': JSEARCH_KEY, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' },
      timeout: 12000,
    });
    return (res.data.data || []).slice(0, 12).map(j => ({
      id:          `jsearch-${j.job_id}`,
      title:       j.job_title || '',
      company:     j.employer_name || '',
      location:    j.job_is_remote ? 'Remote / WFH'
        : [j.job_city, j.job_state, 'India'].filter(Boolean).join(', '),
      description: (j.job_description || '').slice(0, 500),
      url:         j.job_apply_link || j.job_google_link,
      salary:      jsearchSalary(j),
      salaryNum:   j.job_min_salary || 0,
      postedDate:  j.job_posted_at_datetime_utc,
      source:      detectPortal(j.job_apply_link || ''),
      companyLogo: j.employer_logo || null,
      jobType:     j.job_employment_type || 'Full-time',
      remote:      j.job_is_remote || false,
    }));
  } catch(e) { console.error('[JSearch]', e.message); return []; }
}

// ─── Remotive ─────────────────────────────────────────────────────────────────
async function fetchRemotive(query) {
  try {
    const res = await axios.get('https://remotive.com/api/remote-jobs', {
      params: { search: query, limit: 6 }, timeout: 8000,
    });
    return (res.data.jobs || []).map(j => ({
      id:          `remotive-${j.id}`,
      title:       j.title || '',
      company:     j.company_name || '',
      location:    'Remote / WFH',
      description: (j.description||'').replace(/<[^>]*>/g,'').slice(0,500),
      url:         j.url,
      salary:      j.salary || null,
      salaryNum:   0,
      postedDate:  j.publication_date,
      source:      'Remotive',
      jobType:     'Full-time',
      remote:      true,
    }));
  } catch(e) { console.error('[Remotive]', e.message); return []; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildQuery(skills, jobTitle) {
  if (jobTitle && jobTitle.trim().length > 2) return jobTitle.trim();
  return skills.slice(0, 2).join(' ') || 'software developer';
}

function adzunaSalary(min, max) {
  if (!min && !max) return null;
  const toL = v => (v / 100000).toFixed(1);
  if (min && max) return `₹${toL(min)}L – ₹${toL(max)}L PA`;
  return min ? `₹${toL(min)}L+ PA` : null;
}

function jsearchSalary(j) {
  if (!j.job_min_salary && !j.job_max_salary) return null;
  const sym = j.job_salary_currency === 'INR' ? '₹' : (j.job_salary_currency || '');
  if (j.job_min_salary && j.job_max_salary)
    return `${sym}${Number(j.job_min_salary).toLocaleString('en-IN')} – ${sym}${Number(j.job_max_salary).toLocaleString('en-IN')} PA`;
  return null;
}

function detectPortal(url) {
  url = url.toLowerCase();
  if (url.includes('linkedin'))    return 'LinkedIn';
  if (url.includes('naukri'))      return 'Naukri';
  if (url.includes('indeed'))      return 'Indeed';
  if (url.includes('glassdoor'))   return 'Glassdoor';
  if (url.includes('monster'))     return 'Monster India';
  if (url.includes('shine'))       return 'Shine.com';
  if (url.includes('timesjobs'))   return 'TimesJobs';
  if (url.includes('internshala')) return 'Internshala';
  if (url.includes('unstop'))      return 'Unstop';
  return 'Job Portal';
}

// ─── Unstop (Internships & Jobs for students) ─────────────────────────────────
async function fetchUnstop(query) {
  try {
    const res = await axios.get('https://unstop.com/api/public/opportunity/search-new', {
      params: { search: query, opportunity: 'jobs', per_page: 10 },
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    const items = res.data?.data?.data || res.data?.data || [];
    return items.slice(0, 10).map(j => ({
      id:          `unstop-${j.id || j.slug}`,
      title:       j.title || j.name || '',
      company:     j.organisation?.name || j.company_name || 'Company',
      location:    j.city || j.location || 'India',
      description: (j.short_desc || j.description || '').replace(/<[^>]*>/g, '').slice(0, 500),
      url:         j.public_url || `https://unstop.com/jobs/${j.slug || j.id}`,
      salary:      j.stipend || j.salary || null,
      salaryNum:   0,
      postedDate:  j.start_date || j.created_at,
      source:      'Unstop',
      jobType:     j.type || 'Full-time',
      remote:      (j.location || '').toLowerCase().includes('remote'),
    }));
  } catch (e) { return []; }
}

// ─── Arbeitnow (Free job board API — tech jobs worldwide) ─────────────────────
async function fetchArbeitnow(query) {
  try {
    const res = await axios.get('https://www.arbeitnow.com/api/job-board-api', {
      params: { search: query, page: 1 },
      timeout: 8000,
    });
    return (res.data?.data || []).slice(0, 10).map(j => ({
      id:          `arbeitnow-${j.slug}`,
      title:       j.title || '',
      company:     j.company_name || '',
      location:    j.location || 'Remote',
      description: (j.description || '').replace(/<[^>]*>/g, '').slice(0, 500),
      url:         j.url,
      salary:      null,
      salaryNum:   0,
      postedDate:  j.created_at,
      source:      'Arbeitnow',
      jobType:     'Full-time',
      remote:      j.remote || false,
    }));
  } catch (e) { return []; }
}

module.exports = { fetchJobs };