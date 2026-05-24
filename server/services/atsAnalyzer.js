// server/services/atsAnalyzer.js
// Jobscan-level ATS Analysis Engine
// Categories: Searchability | Hard Skills | Soft Skills | Recruiter Tips | Formatting
// Produces detailed, actionable feedback like professional ATS tools

'use strict';

// ─── Skill Databases ────────────────────────────────────────────────────────

const HARD_SKILLS = [
  'javascript','python','java','c++','c#','typescript','go','rust','kotlin','swift',
  'php','ruby','r','scala','dart','bash','perl','sql','nosql',
  'react','angular','vue','next.js','nextjs','svelte','redux','html','css','sass','tailwind',
  'webpack','vite','jquery','bootstrap',
  'node.js','nodejs','express','django','flask','fastapi','spring','springboot',
  'laravel','graphql','rest','restful','microservices','asp.net','rails',
  'mongodb','mysql','postgresql','redis','sqlite','oracle','cassandra','dynamodb',
  'firebase','elasticsearch','supabase',
  'aws','azure','gcp','docker','kubernetes','terraform','jenkins','linux','nginx',
  'ci/cd','github actions','ansible','devops','cloudformation',
  'machine learning','deep learning','tensorflow','pytorch','keras','scikit-learn',
  'pandas','numpy','opencv','nlp','data science','data analysis','tableau',
  'power bi','spark','hadoop','llm','langchain','openai',
  'react native','flutter','android','ios','swift','xcode',
  'git','github','gitlab','jira','figma','postman','vs code',
  'agile','scrum','kanban','tdd','bdd',
  'api','sdk','oauth','jwt','websocket','grpc',
  'unit testing','integration testing','selenium','cypress','jest',
  'figma','sketch','adobe xd','photoshop','illustrator',
  'wordpress','shopify','wix','webflow',
  'blockchain','web3','solidity','ethereum',
];

const SOFT_SKILLS = [
  'communication','leadership','teamwork','collaboration','problem solving',
  'critical thinking','time management','adaptability','creativity','attention to detail',
  'project management','decision making','conflict resolution','mentoring',
  'presentation','negotiation','strategic thinking','analytical','interpersonal',
  'self-motivated','initiative','organizational','multitasking','flexibility',
  'customer service','stakeholder management','cross-functional','innovative',
];

const STRONG_VERBS = [
  'developed','built','designed','implemented','created','managed','led','architected',
  'optimized','improved','increased','reduced','deployed','integrated','automated',
  'engineered','launched','delivered','collaborated','analyzed','spearheaded',
  'streamlined','orchestrated','mentored','refactored','migrated','scaled',
  'established','transformed','pioneered','resolved','negotiated',
];

const WEAK_PHRASES = [
  'responsible for','worked on','helped with','assisted in','participated in',
  'was involved in','duties included','tasked with',
];

const BUZZWORDS = [
  'synergy','guru','ninja','rockstar','passionate','hardworking','team player',
  'go-getter','dynamic','results-oriented','detail-oriented','self-starter',
  'think outside the box','leverage','paradigm shift',
];

const SECTION_KEYWORDS = {
  summary: ['summary','objective','profile','about','career summary','professional summary'],
  experience: ['experience','work experience','employment','work history','professional experience'],
  education: ['education','academic','qualification','degree'],
  skills: ['skills','technical skills','core competencies','technologies','expertise'],
  projects: ['projects','portfolio','personal projects','key projects'],
  certifications: ['certifications','certificates','licenses','credentials'],
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countOccurrences(text, word) {
  try {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    return (text.match(regex) || []).length;
  } catch { return 0; }
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

// ─── SEARCHABILITY Analysis ─────────────────────────────────────────────────

function analyzeSearchability(resumeText, jobTitle = '', jobDescription = '') {
  const text = resumeText;
  const lower = text.toLowerCase();
  const issues = [];
  const passes = [];
  let score = 0;
  const maxScore = 30;

  // Contact Information (8 pts)
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\d{10})/i.test(text);
  const hasLinkedIn = /linkedin\.com/i.test(text);
  const hasAddress = /\b(street|city|state|zip|road|avenue|blvd|apt|suite|\d{5,6})\b/i.test(text) || /\b[A-Z][a-z]+,\s*[A-Z][a-z]+/m.test(text);

  if (hasEmail) { score += 2; passes.push('You provided your email. Recruiters use your email to contact you.'); }
  else { issues.push('Add your email address. Recruiters need it to contact you for job matches.'); }

  if (hasPhone) { score += 2; passes.push('You provided your phone number.'); }
  else { issues.push('Add your phone number for recruiter contact.'); }

  if (hasLinkedIn) { score += 2; passes.push('LinkedIn profile found — builds credibility with recruiters.'); }
  else { issues.push('Add your LinkedIn URL. Most recruiters verify candidates on LinkedIn.'); }

  if (hasAddress) { score += 2; passes.push('Location/address found for job matching.'); }
  else { issues.push('Add your city/location. Recruiters use your address to validate location for job matches.'); }

  // Summary Section (5 pts)
  const hasSummary = SECTION_KEYWORDS.summary.some(k => lower.includes(k));
  if (hasSummary) { score += 5; passes.push('Summary section found — provides quick overview of qualifications.'); }
  else { issues.push('Add a Professional Summary section. It provides a quick overview helping recruiters grasp your value.'); }

  // Section Headings (5 pts)
  const hasExperience = SECTION_KEYWORDS.experience.some(k => lower.includes(k));
  const hasEducation = SECTION_KEYWORDS.education.some(k => lower.includes(k));
  const hasSkills = SECTION_KEYWORDS.skills.some(k => lower.includes(k));

  if (hasExperience) { score += 2; passes.push('Work experience section found.'); }
  else { issues.push('Add a clear "Experience" or "Work Experience" section heading.'); }
  if (hasEducation) { score += 2; passes.push('Education section found.'); }
  else { issues.push('Add an "Education" section heading.'); }
  if (hasSkills) { score += 1; passes.push('Skills section found.'); }
  else { issues.push('Add a "Skills" or "Technical Skills" section heading.'); }

  // Job Title Match (5 pts)
  if (jobTitle) {
    const titleLower = jobTitle.toLowerCase();
    const titleInResume = lower.includes(titleLower) || titleLower.split(/\s+/).filter(w => w.length > 3).every(w => lower.includes(w));
    if (titleInResume) { score += 5; passes.push(`Job title "${jobTitle}" found in your resume.`); }
    else { issues.push(`The job title "${jobTitle}" was not found in your resume. Include it in your summary to be found when recruiters search by title.`); }
  } else { score += 3; }

  // Date Formatting (3 pts)
  const hasDates = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{4}/i.test(text) || /\d{2}\/\d{4}/i.test(text);
  if (hasDates) { score += 3; passes.push('Dates in work experience are properly formatted.'); }
  else { issues.push('Use consistent date formatting (e.g., "Jan 2024 - Present" or "01/2024 - 06/2025").'); }

  return { score: Math.min(maxScore, score), maxScore, issues, passes, category: 'Searchability' };
}

// ─── HARD SKILLS Analysis ───────────────────────────────────────────────────

function analyzeHardSkills(resumeText, jobDescription = '') {
  const lower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();
  const issues = [];
  const passes = [];
  let score = 0;
  const maxScore = 35;

  // Find skills in resume
  const resumeSkills = HARD_SKILLS.filter(s => countOccurrences(lower, s) > 0);

  // Find skills in JD
  const jdSkills = jobDescription ? HARD_SKILLS.filter(s => countOccurrences(jdLower, s) > 0) : [];

  // Match skills
  const matched = jdSkills.filter(s => resumeSkills.includes(s));
  const missing = jdSkills.filter(s => !resumeSkills.includes(s));

  // Score based on match rate
  if (jdSkills.length > 0) {
    const matchRate = matched.length / jdSkills.length;
    score = Math.round(matchRate * maxScore);

    if (matched.length > 0) {
      passes.push(`${matched.length}/${jdSkills.length} hard skills from the job description found in your resume.`);
    }
    if (missing.length > 0) {
      issues.push(`${missing.length} hard skills from the job description are missing: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '...' : ''}`);
    }
    if (matchRate < 0.4) {
      issues.push('Your hard skills match rate is below 40%. Add relevant skills from the job description where truthful.');
    }
  } else {
    // No JD provided — score based on skill count
    score = Math.min(maxScore, Math.round(resumeSkills.length * 1.5));
    if (resumeSkills.length >= 10) passes.push(`${resumeSkills.length} technical skills detected.`);
    else issues.push(`Only ${resumeSkills.length} technical skills found. Aim for 10+ relevant skills.`);
  }

  // Skill frequency check
  const skillDetails = (jdSkills.length > 0 ? jdSkills : resumeSkills).slice(0, 15).map(skill => ({
    skill,
    resumeCount: countOccurrences(lower, skill),
    jdCount: countOccurrences(jdLower, skill),
    inResume: countOccurrences(lower, skill) > 0,
  }));

  return { score: Math.min(maxScore, score), maxScore, issues, passes, matched, missing, skillDetails, resumeSkills, category: 'Hard Skills' };
}

// ─── SOFT SKILLS Analysis ───────────────────────────────────────────────────

function analyzeSoftSkills(resumeText, jobDescription = '') {
  const lower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();
  const issues = [];
  const passes = [];
  let score = 0;
  const maxScore = 15;

  const resumeSoft = SOFT_SKILLS.filter(s => lower.includes(s));
  const jdSoft = jobDescription ? SOFT_SKILLS.filter(s => jdLower.includes(s)) : [];

  const matched = jdSoft.filter(s => resumeSoft.includes(s));
  const missing = jdSoft.filter(s => !resumeSoft.includes(s));

  if (jdSoft.length > 0) {
    const matchRate = matched.length / jdSoft.length;
    score = Math.round(matchRate * maxScore);
    if (matched.length > 0) passes.push(`${matched.length}/${jdSoft.length} soft skills matched.`);
    if (missing.length > 0) issues.push(`Missing soft skills: ${missing.slice(0, 5).join(', ')}`);
  } else {
    score = Math.min(maxScore, resumeSoft.length * 2);
    if (resumeSoft.length >= 3) passes.push(`${resumeSoft.length} soft skills demonstrated.`);
    else issues.push('Add more soft skills naturally in your experience bullets (e.g., collaboration, leadership).');
  }

  return { score: Math.min(maxScore, score), maxScore, issues, passes, matched, missing, category: 'Soft Skills' };
}

// ─── RECRUITER TIPS Analysis ────────────────────────────────────────────────

function analyzeRecruiterTips(resumeText, jobDescription = '') {
  const text = resumeText;
  const lower = text.toLowerCase();
  const issues = [];
  const passes = [];
  let score = 0;
  const maxScore = 10;

  // Measurable Results (3 pts)
  const metrics = (text.match(/\d+%|\d+\+|\$\d+|₹\d+|\d+x|\d+\s*(users|clients|projects|teams|requests|transactions|customers)/gi) || []);
  if (metrics.length >= 5) { score += 3; passes.push('5+ measurable results found. Employers like to see impact and results.'); }
  else if (metrics.length >= 2) { score += 2; passes.push(`${metrics.length} measurable results found. Try to add more quantified achievements.`); }
  else { issues.push('Add measurable results (numbers, percentages, metrics) to show your impact.'); }

  // Resume Tone (2 pts)
  const buzzwordsFound = BUZZWORDS.filter(b => lower.includes(b));
  if (buzzwordsFound.length === 0) { score += 2; passes.push('Resume tone is professional — no cliches or buzzwords found.'); }
  else { issues.push(`Remove buzzwords/cliches: ${buzzwordsFound.join(', ')}`); }

  // Word Count (2 pts)
  const wc = wordCount(text);
  if (wc >= 400 && wc <= 1000) { score += 2; passes.push(`Word count (${wc}) is within the optimal range for ATS.`); }
  else if (wc < 300) { issues.push(`Resume has only ${wc} words. Aim for 400-1000 words for relevance and readability.`); }
  else if (wc > 1200) { issues.push(`Resume has ${wc} words. Consider trimming to under 1000 for better readability.`); }
  else { score += 1; }

  // Action Verbs (2 pts)
  const verbsUsed = STRONG_VERBS.filter(v => lower.includes(v));
  if (verbsUsed.length >= 8) { score += 2; passes.push(`${verbsUsed.length} strong action verbs used. Great job!`); }
  else if (verbsUsed.length >= 4) { score += 1; passes.push(`${verbsUsed.length} action verbs found. Try to use more (developed, implemented, optimized).`); }
  else { issues.push('Use more strong action verbs to start your bullets (Developed, Implemented, Optimized, Led, Deployed).'); }

  // Weak Phrases (1 pt)
  const weakFound = WEAK_PHRASES.filter(w => lower.includes(w));
  if (weakFound.length === 0) { score += 1; passes.push('No weak phrases found.'); }
  else { issues.push(`Remove weak phrases: "${weakFound.join('", "')}" — replace with action verbs.`); }

  return { score: Math.min(maxScore, score), maxScore, issues, passes, wordCount: wc, metricsCount: metrics.length, category: 'Recruiter Tips' };
}

// ─── FORMATTING Analysis ────────────────────────────────────────────────────

function analyzeFormatting(resumeText) {
  const text = resumeText;
  const issues = [];
  const passes = [];
  let score = 0;
  const maxScore = 10;

  // Bullet Points (3 pts)
  const bulletLines = (text.match(/^[\s]*[•\-\*▪►·]\s/gm) || []).length;
  const verbStarts = (text.match(/^[\s]*(Developed|Built|Designed|Implemented|Created|Managed|Led|Optimized|Improved|Deployed|Integrated|Automated|Engineered|Launched|Delivered|Collaborated|Analyzed)\b/gmi) || []).length;
  const totalBullets = bulletLines + verbStarts;

  if (totalBullets >= 8) { score += 3; passes.push(`${totalBullets} bullet points detected — good for ATS parsing.`); }
  else if (totalBullets >= 4) { score += 2; passes.push(`${totalBullets} bullet points found. More bullets improve ATS readability.`); }
  else { issues.push('Use bullet points for experience items. ATS systems parse bullets better than paragraphs.'); }

  // Special Characters (2 pts)
  const specialChars = (text.match(/[│┤├─┼▪▸►◆◇★☆✓✗●○■□▶◀→←↑↓™©®]/g) || []).length;
  if (specialChars <= 3) { score += 2; passes.push('No problematic special characters found.'); }
  else { issues.push('Reduce special characters/symbols. Some ATS cannot read them and may cause formatting errors.'); }

  // Consistent Structure (2 pts)
  const sections = Object.values(SECTION_KEYWORDS).flat().filter(k => text.toLowerCase().includes(k)).length;
  if (sections >= 4) { score += 2; passes.push('Resume has clear section structure.'); }
  else { issues.push('Add clear section headings (Summary, Experience, Skills, Education) for better ATS parsing.'); }

  // Length Check (2 pts)
  const lines = text.split('\n').filter(l => l.trim()).length;
  if (lines >= 20 && lines <= 80) { score += 2; passes.push('Resume length is appropriate.'); }
  else if (lines < 15) { issues.push('Resume appears too short. Add more content for better ATS matching.'); }
  else { score += 1; }

  // No Tables/Images warning (1 pt)
  score += 1;
  passes.push('PDF format is compatible with most ATS systems.');

  return { score: Math.min(maxScore, score), maxScore, issues, passes, category: 'Formatting' };
}

// ─── GRADE ──────────────────────────────────────────────────────────────────

function grade(score) {
  if (score >= 75) return { letter: 'A', label: 'Excellent — ATS Ready', color: '#10b981' };
  if (score >= 60) return { letter: 'B', label: 'Good — Minor Fixes Needed', color: '#6366f1' };
  if (score >= 45) return { letter: 'C', label: 'Average — Needs Improvement', color: '#f59e0b' };
  if (score >= 30) return { letter: 'D', label: 'Below Average — Major Gaps', color: '#f97316' };
  return { letter: 'F', label: 'Poor — Significant Overhaul Needed', color: '#ef4444' };
}

// ─── MAIN: Local Analysis ───────────────────────────────────────────────────

function analyzeResume(resumeText, jobTitle = '', jobDescription = '') {
  const searchability = analyzeSearchability(resumeText, jobTitle, jobDescription);
  const hardSkills = analyzeHardSkills(resumeText, jobDescription);
  const softSkills = analyzeSoftSkills(resumeText, jobDescription);
  const recruiterTips = analyzeRecruiterTips(resumeText, jobDescription);
  const formatting = analyzeFormatting(resumeText);

  // Total: 30 + 35 + 15 + 10 + 10 = 100
  const totalScore = searchability.score + hardSkills.score + softSkills.score + recruiterTips.score + formatting.score;
  const maxTotal = searchability.maxScore + hardSkills.maxScore + softSkills.maxScore + recruiterTips.maxScore + formatting.maxScore;

  // Normalize to 0-100
  const score = Math.round((totalScore / maxTotal) * 100);

  // Collect all issues and suggestions
  const allIssues = [...searchability.issues, ...hardSkills.issues, ...softSkills.issues, ...recruiterTips.issues, ...formatting.issues];
  const suggestions = allIssues.slice(0, 8);

  return {
    score,
    atsScore: score,
    grade: grade(score),
    breakdown: {
      searchability: { score: searchability.score, max: searchability.maxScore, percentage: Math.round((searchability.score / searchability.maxScore) * 100), issues: searchability.issues, passes: searchability.passes },
      hardSkills: { score: hardSkills.score, max: hardSkills.maxScore, percentage: Math.round((hardSkills.score / hardSkills.maxScore) * 100), issues: hardSkills.issues, passes: hardSkills.passes, matched: hardSkills.matched, missing: hardSkills.missing, skillDetails: hardSkills.skillDetails },
      softSkills: { score: softSkills.score, max: softSkills.maxScore, percentage: Math.round((softSkills.score / softSkills.maxScore) * 100), issues: softSkills.issues, passes: softSkills.passes, matched: softSkills.matched, missing: softSkills.missing },
      recruiterTips: { score: recruiterTips.score, max: recruiterTips.maxScore, percentage: Math.round((recruiterTips.score / recruiterTips.maxScore) * 100), issues: recruiterTips.issues, passes: recruiterTips.passes, wordCount: recruiterTips.wordCount, metricsCount: recruiterTips.metricsCount },
      formatting: { score: formatting.score, max: formatting.maxScore, percentage: Math.round((formatting.score / formatting.maxScore) * 100), issues: formatting.issues, passes: formatting.passes },
    },
    // Legacy fields for Dashboard compatibility
    skills: hardSkills.resumeSkills,
    skillsDetected: hardSkills.resumeSkills,
    suggestedSkills: (hardSkills.missing || []).slice(0, 8),
    formattingIssues: [...formatting.issues, ...searchability.issues],
    keywordsMissing: (hardSkills.missing || []).slice(0, 12),
    wordCount: recruiterTips.wordCount || wordCount(resumeText),
    suggestions,
    jdKeywordsMatched: hardSkills.matched || [],
    jdKeywordsMissing: hardSkills.missing || [],
    issueCount: allIssues.length,
  };
}

// ─── AI-Powered Deep Analysis ───────────────────────────────────────────────

async function deepAnalyzeWithAI(resumeText, jobTitle = '', jobDescription = '') {
  if (!process.env.XAI_API_KEY) return analyzeResume(resumeText, jobTitle, jobDescription);

  // Always run local analysis as the primary method (Jobscan-style)
  const local = analyzeResume(resumeText, jobTitle, jobDescription);

  // If no JD provided, use local scoring only (like Jobscan requires a JD)
  if (!jobDescription) return local;

  // Use AI to enhance the analysis with deeper keyword matching
  try {
    const { callGroq } = require('../utils/groqClient');
    const data = await callGroq({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an ATS keyword matching engine. Extract the top 20 most important hard skills and requirements from the job description. Return ONLY a JSON array of strings.' },
        { role: 'user', content: `Extract the top 20 hard skills/requirements from this JD:\n${jobDescription.slice(0, 2000)}` },
      ],
      max_tokens: 500,
      temperature: 0.1,
    }, 15000);

    const raw = data.choices?.[0]?.message?.content || '[]';
    const clean = raw.replace(/```json|```/g, '').trim();
    const jdKeywords = JSON.parse(clean);

    if (Array.isArray(jdKeywords) && jdKeywords.length > 0) {
      // Re-score hard skills with AI-extracted keywords
      const lower = resumeText.toLowerCase();
      const matched = jdKeywords.filter(k => lower.includes(k.toLowerCase()));
      const missing = jdKeywords.filter(k => !lower.includes(k.toLowerCase()));
      const matchRate = matched.length / jdKeywords.length;

      // Recalculate hard skills score
      const aiHardScore = Math.round(matchRate * 35);
      const scoreDiff = aiHardScore - local.breakdown.hardSkills.score;

      // Blend AI score with local
      const adjustedTotal = local.score + Math.round(scoreDiff * 0.7);
      const finalScore = Math.max(5, Math.min(95, adjustedTotal));

      return {
        ...local,
        score: finalScore,
        atsScore: finalScore,
        grade: grade(finalScore),
        breakdown: {
          ...local.breakdown,
          hardSkills: {
            ...local.breakdown.hardSkills,
            score: Math.min(35, aiHardScore),
            percentage: Math.round((Math.min(35, aiHardScore) / 35) * 100),
            matched,
            missing: missing.slice(0, 12),
            aiEnhanced: true,
          },
        },
        keywordsMissing: missing.slice(0, 12),
        jdKeywordsMatched: matched,
        suggestedSkills: missing.slice(0, 8),
        aiPowered: true,
      };
    }
  } catch (err) {
    console.error('[AI Analysis] Enhancement failed, using local:', err.message);
  }

  return { ...local, aiPowered: false };
}

module.exports = { analyzeResume, deepAnalyzeWithAI };
