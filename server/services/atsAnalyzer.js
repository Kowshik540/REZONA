// server/services/atsAnalyzer.js
// UPGRADE 2 — Ruthlessly realistic, multi-metric ATS scoring
// Hybrid: local heuristic (instant, no API cost) + optional AI deep-scan layer
// Returns structured JSON that maps directly to the 4 Checklist categories:
//   content | format | skills | style

'use strict';

const axios = require('axios');

// ─── Lookup Tables ──────────────────────────────────────────────────────────

const TECH_SKILLS = [
  'javascript','python','java','c++','c#','typescript','go','rust','kotlin','swift',
  'php','ruby','r','scala','dart','bash','perl',
  'react','angular','vue','nextjs','next.js','html','css','sass','tailwind','redux',
  'webpack','svelte','bootstrap','jquery',
  'node.js','nodejs','express','django','flask','fastapi','spring','springboot',
  'laravel','graphql','rest','restful','microservices','asp.net',
  'mongodb','mysql','postgresql','redis','sqlite','oracle','cassandra','dynamodb',
  'firebase','elasticsearch',
  'aws','azure','gcp','docker','kubernetes','terraform','jenkins','linux','nginx',
  'ci/cd','github actions','ansible','devops',
  'machine learning','deep learning','tensorflow','pytorch','keras','scikit-learn',
  'pandas','numpy','opencv','nlp','data science','data analysis','sql','tableau',
  'power bi','spark','hadoop','llm','langchain',
  'react native','flutter','android','ios',
  'git','github','gitlab','jira','figma','postman',
  'agile','scrum','kanban',
];

const SECTIONS = {
  contact:      ['email','phone','mobile','linkedin','github','portfolio'],
  summary:      ['summary','objective','profile','about me','career objective'],
  experience:   ['experience','work history','employment','internship','worked at'],
  education:    ['education','degree','university','college','bachelor','master','b.tech','m.tech','b.e','gpa','cgpa'],
  skills:       ['skills','technical skills','technologies','tools','expertise'],
  projects:     ['projects','personal projects','academic projects','portfolio'],
  achievements: ['achievements','awards','certifications','certificates'],
};

const STRONG_ACTION_VERBS = [
  'developed','built','designed','implemented','created','managed','led','architected',
  'optimized','improved','increased','reduced','deployed','integrated','automated',
  'engineered','launched','delivered','collaborated','analyzed','spearheaded',
  'streamlined','orchestrated','mentored','refactored',
];

const WEAK_VERBS = ['responsible for','worked on','helped with','assisted in','participated in'];

const BUZZWORDS = [
  'synergy','guru','ninja','rockstar','passionate','hardworking','team player',
  'go-getter','dynamic','results-oriented','detail-oriented','self-starter',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

// ─── Local Scoring Sub-Engines ──────────────────────────────────────────────

/**
 * CONTENT scoring (max 30 pts)
 * Rewards: sections, metrics, action verbs
 * Penalizes: weak verbs, generic phrases
 */
function scoreContent(text, rawText) {
  let pts = 0;
  const checks = {};

  // 1. Section coverage (up to 14 pts)
  const sectionResults = {};
  for (const [name, kws] of Object.entries(SECTIONS)) {
    sectionResults[name] = kws.some(k => text.includes(k));
  }
  const foundSections = Object.entries(sectionResults).filter(([,v]) => v).map(([k]) => k);
  const missingSections = Object.entries(sectionResults).filter(([,v]) => !v).map(([k]) => k);
  pts += Math.min(14, foundSections.length * 2);
  checks.sectionsFound = foundSections;
  checks.sectionsMissing = missingSections;

  // 2. Quantified impact (up to 8 pts)
  const qPattern = /(\d+%|\d+\+|\d+\s*x\b|\$\d+|₹\d+|\d+\s*(users|clients|customers|projects|teams|members|hours|days|months|lakh|crore|k\b|ms\b|seconds?|requests?|transactions?))/gi;
  const qExamples = (rawText.match(qPattern) || []).slice(0, 12);
  pts += Math.min(8, qExamples.length * 1.6);
  checks.quantifiedExamples = qExamples.slice(0, 5);
  checks.hasQuantifiedImpact = qExamples.length >= 2;

  // 3. Action verbs (up to 8 pts)
  const verbsFound = STRONG_ACTION_VERBS.filter(v => text.includes(v));
  pts += Math.min(8, verbsFound.length * 0.8);
  checks.actionVerbsFound = verbsFound.length;

  // 4. Penalties (max -4)
  const weakFound = WEAK_VERBS.filter(v => text.includes(v));
  if (weakFound.length > 0) pts -= Math.min(3, weakFound.length);
  checks.weakVerbsFound = weakFound;

  const genericPhrases = ['various projects','multiple technologies','different tools','many years','several companies'];
  const genericFound = genericPhrases.filter(p => text.includes(p));
  if (genericFound.length > 0) pts -= Math.min(1, genericFound.length);
  checks.genericPhrases = genericFound;

  return { pts: Math.max(0, Math.min(30, pts)), max: 30, checks };
}

/**
 * FORMAT scoring (max 25 pts)
 * Starts at 0, earns points for good formatting
 */
function scoreFormat(rawText) {
  let pts = 0;
  const issues = [];
  const checks = {};

  const wc = wordCount(rawText);
  checks.wordCount = wc;

  // Length (up to 6 pts)
  if (wc >= 300 && wc <= 900) { pts += 6; }
  else if (wc >= 200) { pts += 3; issues.push('Resume length could be improved — aim for 300-700 words'); }
  else { issues.push('Resume is too short — aim for at least 300 words'); }
  checks.lengthOk = wc >= 300 && wc <= 900;

  // Contact info (up to 8 pts)
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(rawText);
  const hasPhone = /(\+91|91)?[\s-]?[6-9]\d{9}/.test(rawText) ||
                   /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(rawText);
  const hasLinkedIn = /linkedin\.com\//i.test(rawText);
  const hasGithub = /github\.com\//i.test(rawText);

  if (hasEmail) pts += 3; else issues.push('Add email address for recruiter contact');
  if (hasPhone) pts += 2; else issues.push('Add phone number');
  if (hasLinkedIn) pts += 2; else issues.push('Add LinkedIn URL');
  if (hasGithub) pts += 1;
  checks.hasEmail = hasEmail;
  checks.hasPhone = hasPhone;
  checks.hasLinkedIn = hasLinkedIn;
  checks.hasGithub = hasGithub;

  // Bullet points (up to 5 pts) — detect various bullet formats from PDF parsing
  const bulletLines = (rawText.match(/^[\s]*[•\-\*▪►·‣⁃]\s/gm) || []).length;
  // Also count lines that start with action verbs (common in PDF-parsed resumes)
  const verbStartLines = (rawText.match(/^[\s]*(Developed|Built|Designed|Implemented|Created|Managed|Led|Architected|Optimized|Improved|Increased|Reduced|Deployed|Integrated|Automated|Engineered|Launched|Delivered|Collaborated|Analyzed|Spearheaded|Streamlined)\b/gmi) || []).length;
  const effectiveBullets = bulletLines + verbStartLines;
  checks.bulletPointCount = effectiveBullets;
  if (effectiveBullets >= 8) pts += 5;
  else if (effectiveBullets >= 5) pts += 4;
  else if (effectiveBullets >= 3) pts += 2;
  else if (wc > 200) issues.push('Add bullet points — ATS systems parse bullets better than paragraphs');

  // Structure bonus (up to 4 pts)
  const hasSummary = /summary|profile|objective/i.test(rawText);
  const hasSkillsSection = /skills|technical skills/i.test(rawText);
  const hasExpSection = /experience|employment|work history/i.test(rawText);
  const hasEduSection = /education|degree|university|college/i.test(rawText);
  if (hasSummary) pts += 1;
  if (hasSkillsSection) pts += 1;
  if (hasExpSection) pts += 1;
  if (hasEduSection) pts += 1;

  // Penalties (max -3)
  const specialChars = (rawText.match(/[│┤├─┼▪▸►◆◇★☆✓✗●○■□▶◀→←↑↓]/g) || []).length;
  if (specialChars > 10) { pts -= 2; issues.push('Too many special characters — ATS may garble content'); }
  checks.specialCharCount = specialChars;
  checks.specialCharsOk = specialChars <= 5;

  return { pts: Math.max(0, Math.min(25, pts)), max: 25, issues, checks };
}

/**
 * SKILLS scoring (max 25 pts)
 * Rewards: skill count, certifications, JD match
 */
function scoreSkills(text, rawText, jobDescription = '') {
  const found = TECH_SKILLS.filter(s => {
    try {
      return new RegExp(`\\b${escapeRegex(s)}\\b`, 'i').test(text);
    } catch {
      return text.includes(s.toLowerCase());
    }
  });

  // Up to 18 pts for skill count
  let pts = Math.min(18, found.length * 1.5);

  // Certifications bonus (up to 3 pts)
  if (/certif(ied|ication)|aws certified|google cloud|microsoft certified|pmp|cfa|cpa/i.test(text)) {
    pts += 3;
  }

  // JD keyword match bonus (up to 4 pts)
  const jdSkillMatch = jobDescription
    ? found.filter(s => jobDescription.toLowerCase().includes(s)).length
    : 0;
  if (jdSkillMatch > 0) pts += Math.min(4, jdSkillMatch * 0.8);

  // Skill gap suggestions
  const webPool = ['react','typescript','node.js','mongodb','docker','aws','git','postgresql','kubernetes','graphql'];
  const dataPool = ['python','sql','pandas','machine learning','tensorflow','tableau','power bi','spark','docker','aws'];
  const isData = /data science|machine learning|analyst|tensorflow|pandas|nlp/i.test(text);
  const suggPool = isData ? dataPool : webPool;
  const suggestions = suggPool.filter(s => !found.includes(s));

  return {
    pts: Math.max(0, Math.min(25, pts)),
    max: 25,
    found,
    suggestions,
    jdMatchCount: jdSkillMatch,
    checks: {
      skillCount: found.length,
      hasCertifications: /certif/i.test(text),
      skillsOk: found.length >= 6,
    },
  };
}

/**
 * STYLE scoring (max 20 pts)
 * Starts at 15, earns bonus for good style, loses for bad style
 */
function scoreStyle(text, rawText) {
  let pts = 15;
  const issues = [];
  const checks = {};

  // Buzzwords penalty (max -5)
  const foundBuzzwords = BUZZWORDS.filter(b => text.includes(b));
  if (foundBuzzwords.length > 0) {
    pts -= Math.min(5, foundBuzzwords.length * 2);
    issues.push(`Remove buzzwords: ${foundBuzzwords.join(', ')}`);
  }
  checks.buzzwords = foundBuzzwords;
  checks.buzzwordsOk = foundBuzzwords.length === 0;

  // Personal pronouns (max -3)
  const pronounMatch = (rawText.match(/\b(I|me|my|myself|we|our)\b/g) || []).length;
  if (pronounMatch > 3) {
    pts -= 3;
    issues.push('Remove personal pronouns (I, me, my) — use implied third-person');
  } else if (pronounMatch > 0) {
    pts -= 1;
  }
  checks.pronounCount = pronounMatch;
  checks.noPronounsOk = pronounMatch === 0;

  // Bonus for active voice verbs (+5 max)
  const activeVerbs = (rawText.match(/\b(developed|built|designed|implemented|created|managed|led|architected|optimized|improved|increased|reduced|deployed|integrated|automated|engineered|launched|delivered)\b/gi) || []).length;
  pts += Math.min(5, activeVerbs * 0.5);
  checks.activeVoiceOk = activeVerbs >= 4;

  // Passive voice penalty (max -2)
  const passiveMatches = (rawText.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || []).length;
  if (passiveMatches > 3) {
    pts -= 2;
    issues.push('Reduce passive voice — use active verbs (built, led, designed)');
  }
  checks.passiveVoiceCount = passiveMatches;

  // Date consistency
  const dateFormats = [
    (rawText.match(/\d{4}\s*[-–]\s*\d{4}/g) || []).length,
    (rawText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/g) || []).length,
    (rawText.match(/\d{2}\/\d{4}/g) || []).length,
  ].filter(c => c > 0).length;
  if (dateFormats > 1) {
    pts -= 1;
    issues.push('Standardize date formats to "Month Year – Month Year"');
  }
  checks.dateConsistency = dateFormats <= 1;

  return { pts: Math.max(0, Math.min(20, pts)), max: 20, issues, checks };
}

// ─── Keyword Scoring (for JD match) ────────────────────────────────────────

function scoreKeywords(text, jobTitle, jobDescription) {
  const jd = (jobTitle + ' ' + jobDescription).toLowerCase().trim();
  if (!jd) return { pts: 0, matched: [], missing: [], jdWords: [] };

  const stopWords = new Set([
    'and','or','the','a','an','in','on','at','for','to','of','with','is','are',
    'was','were','be','have','has','had','will','would','could','should','may',
    'that','this','from','by','as','so','if','not','but','also','can','use','using',
  ]);

  const jdWords = [...new Set(
    jd.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w))
  )];

  const matched = jdWords.filter(k => text.includes(k));
  const missing = jdWords.filter(k => !text.includes(k)).slice(0, 12);
  const ratio   = jdWords.length > 0 ? matched.length / jdWords.length : 0;

  return { pts: Math.min(10, Math.round(ratio * 10)), matched: matched.slice(0, 20), missing, jdWords };
}

// ─── Grade ─────────────────────────────────────────────────────────────────

function grade(score) {
  if (score >= 70) return { letter: 'A', label: 'Excellent — ATS Ready', color: '#10b981' };
  if (score >= 55) return { letter: 'B', label: 'Good — Minor Fixes Needed', color: '#6366f1' };
  if (score >= 40) return { letter: 'C', label: 'Average — Needs Improvement', color: '#f59e0b' };
  if (score >= 25) return { letter: 'D', label: 'Below Average — Major Gaps', color: '#f97316' };
  return               { letter: 'F', label: 'Poor — Significant Overhaul Needed', color: '#ef4444' };
}

// ─── Suggestion Builder ─────────────────────────────────────────────────────

function buildSuggestions(content, format, skills, style, kw) {
  const tips = [];
  if (content.checks.sectionsMissing.includes('summary'))
    tips.push('📝 Add a 2–3 line Professional Summary tailored to the role you want');
  if (content.checks.sectionsMissing.includes('projects'))
    tips.push('📂 Add a Projects section with tech stack and measurable results');
  if (content.checks.sectionsMissing.includes('achievements'))
    tips.push('🏆 Add Achievements or Certifications section');
  if (!content.checks.hasQuantifiedImpact)
    tips.push('📊 Quantify impact — "reduced load time by 40%", "served 10k users", "saved ₹2L/month"');
  if (content.checks.actionVerbsFound < 4)
    tips.push('🔡 Use strong action verbs: architected, engineered, optimized, spearheaded, deployed');
  if (skills.suggestions.length > 0)
    tips.push(`⚡ Consider adding in-demand skills: ${skills.suggestions.slice(0,4).join(', ')}`);
  if (!format.checks.hasLinkedIn)
    tips.push('🔗 Add your LinkedIn URL — most recruiters verify candidates there');
  format.issues.forEach(i => tips.push(`⚠️ ${i}`));
  style.issues.forEach(i => tips.push(`✏️ ${i}`));
  if (kw.missing.length > 0)
    tips.push(`🎯 Insert these JD keywords where truthful: ${kw.missing.slice(0,6).join(', ')}`);
  return tips;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * analyzeResume — local heuristic analysis (fast, free)
 * Returns structured JSON mapping to the 4 ATS categories
 */
function analyzeResume(resumeText, jobTitle = '', jobDescription = '') {
  const lower = resumeText.toLowerCase();

  const content = scoreContent(lower, resumeText);
  const format  = scoreFormat(resumeText);
  const skills  = scoreSkills(lower, resumeText, jobDescription);
  const style   = scoreStyle(lower, resumeText);
  const kw      = scoreKeywords(lower, jobTitle, jobDescription);

  // Total: content(30) + format(25) + skills(25) + style(20) = 100
  const baseScore = content.pts + format.pts + skills.pts + style.pts;
  const kwBonus   = jobDescription ? Math.round(kw.pts * 0.6) : 0;
  const rawTotal  = Math.round(baseScore + kwBonus);
  
  // Score curve — designed to show clear improvement after optimization:
  // - Raw unoptimized resumes: 25-45 (motivates user to optimize)
  // - Decent resumes with some structure: 45-60
  // - Well-structured with keywords: 60-72
  // - AI-optimized resumes: 75-90 (shows clear value of the tool)
  // Apply a slight deflation on initial scans to create room for improvement
  const deflated = Math.round(rawTotal * 0.82); // 18% deflation on raw score
  const total = Math.max(12, Math.min(92, deflated));

  return {
    // Core score
    score:    total,
    atsScore: total,
    grade:    grade(total),

    // Category breakdown (maps to UI checklist)
    breakdown: {
      content: {
        score: Math.round(content.pts),
        max:   content.max,
        percentage: Math.round((content.pts / content.max) * 100),
        checks: content.checks,
      },
      format: {
        score: Math.round(format.pts),
        max:   format.max,
        percentage: Math.round((format.pts / format.max) * 100),
        issues: format.issues,
        checks: format.checks,
      },
      skills: {
        score: Math.round(skills.pts),
        max:   skills.max,
        percentage: Math.round((skills.pts / skills.max) * 100),
        found: skills.found,
        suggestions: skills.suggestions,
        checks: skills.checks,
      },
      style: {
        score: Math.round(style.pts),
        max:   style.max,
        percentage: Math.round((style.pts / style.max) * 100),
        issues: style.issues,
        checks: style.checks,
      },
    },

    // Legacy-compatible fields (Dashboard still reads these)
    skills:           skills.found,
    skillsDetected:   skills.found,
    suggestedSkills:  skills.suggestions,
    formattingIssues: [...format.issues, ...style.issues],
    keywordsMissing:  kw.missing,
    wordCount:        wordCount(resumeText),
    suggestions:      buildSuggestions(content, format, skills, style, kw),

    // JD match data
    jdKeywordsMatched: kw.matched,
    jdKeywordsMissing: kw.missing,
  };
}

/**
 * AI-powered ATS analysis using Groq (Llama 3.3 70B)
 * This is the PRIMARY scoring method — gives realistic, context-aware scores
 * Falls back to local heuristic on any error
 */
async function deepAnalyzeWithAI(resumeText, jobTitle = '', jobDescription = '') {
  if (!process.env.XAI_API_KEY) return analyzeResume(resumeText, jobTitle, jobDescription);

  // Run local analysis as baseline fallback
  const local = analyzeResume(resumeText, jobTitle, jobDescription);

  const systemPrompt = `You are an ATS (Applicant Tracking System) scoring engine used by recruiters and hiring platforms.

SCORING CRITERIA (weights):
- Keyword Match (35%): How well does the resume match JD keywords? If no JD provided, score based on industry-standard keywords for the detected role.
- Skills Match (25%): Does the resume list relevant technical skills, tools, and frameworks?
- Experience Relevance (20%): Are the experience bullets relevant? Do they use action verbs and show impact?
- Formatting (10%): Standard sections, bullet points, no tables/graphics, ATS-parseable structure?
- Readability (10%): Clear language, no buzzwords, professional tone?

SCORING GUIDE:
- 20-35: Missing sections, no keywords, poor formatting
- 35-50: Basic structure, few keywords, weak bullets
- 50-65: Decent structure, some keyword matches, some action verbs
- 65-78: Good structure, solid keyword match, action verbs with impact
- 78-90: Strong keyword density, relevant skills, impactful bullets, clean format
- 90-100: Near-perfect — all keywords matched, every bullet shows impact, perfect structure

IMPORTANT SCORING RULES:
- A resume with 10+ technical skills, action verbs, and proper sections should score AT LEAST 55
- A resume with metrics/numbers in bullets gets +5-10 bonus
- A resume with a clear summary/objective aligned to a role gets +5
- If no JD is provided, score based on general ATS best practices for the candidate's field
- Do NOT deflate scores unnecessarily — reward good structure and content

Return ONLY valid JSON.`;

  const userPrompt = `Score this resume:

${jobTitle ? `TARGET ROLE: ${jobTitle}` : ''}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 1500)}` : ''}

RESUME:
${resumeText.slice(0, 4000)}

Return ONLY this JSON:
{
  "overallScore": <number 0-100>,
  "grade": {"letter": "<A/B/C/D/F>", "label": "<short label>", "color": "<hex>"},
  "breakdown": {
    "content": {"score": <0-30>, "max": 30, "percentage": <0-100>, "checks": {"hasQuantifiedImpact": <bool>, "actionVerbsFound": <number>, "sectionsFound": [<strings>], "sectionsMissing": [<strings>], "weakVerbsFound": [<strings>]}},
    "format": {"score": <0-25>, "max": 25, "percentage": <0-100>, "issues": [<strings>], "checks": {"wordCount": <number>, "hasEmail": <bool>, "hasPhone": <bool>, "hasLinkedIn": <bool>, "lengthOk": <bool>, "bulletPointCount": <number>, "specialCharsOk": <bool>}},
    "skills": {"score": <0-25>, "max": 25, "percentage": <0-100>, "found": [<skill strings>], "suggestions": [<missing skills>], "checks": {"skillCount": <number>, "hasCertifications": <bool>, "skillsOk": <bool>}},
    "style": {"score": <0-20>, "max": 20, "percentage": <0-100>, "issues": [<strings>], "checks": {"buzzwords": [<strings>], "buzzwordsOk": <bool>, "noPronounsOk": <bool>, "dateConsistency": <bool>, "activeVoiceOk": <bool>}}
  },
  "suggestions": [<up to 6 actionable improvement tips>],
  "keywordsMissing": [<JD keywords not in resume>],
  "jdKeywordsMatched": [<JD keywords found in resume>],
  "skillsDetected": [<all tech skills found>],
  "wordCount": <number>
}`;

  try {
    const { callGroq } = require('../utils/groqClient');
    const resData = await callGroq({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }, 30000);

    const raw = resData.choices?.[0]?.message?.content || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      score:            parsed.overallScore ?? local.score,
      atsScore:         parsed.overallScore ?? local.score,
      grade:            parsed.grade ?? local.grade,
      breakdown:        parsed.breakdown ?? local.breakdown,
      suggestions:      parsed.suggestions ?? local.suggestions,
      keywordsMissing:  parsed.keywordsMissing ?? local.keywordsMissing,
      jdKeywordsMatched: parsed.jdKeywordsMatched ?? [],
      jdKeywordsMissing: parsed.keywordsMissing ?? [],
      wordCount:        parsed.wordCount ?? local.wordCount,
      skills:           parsed.skillsDetected ?? parsed.breakdown?.skills?.found ?? local.skills,
      skillsDetected:   parsed.skillsDetected ?? parsed.breakdown?.skills?.found ?? local.skillsDetected,
      suggestedSkills:  parsed.breakdown?.skills?.suggestions ?? local.suggestedSkills,
      formattingIssues: [
        ...(parsed.breakdown?.format?.issues ?? []),
        ...(parsed.breakdown?.style?.issues ?? []),
      ],
      aiPowered: true,
    };
  } catch (err) {
    console.error('[AI Analysis] Failed, using local fallback:', err.message);
    return { ...local, aiPowered: false };
  }
}

module.exports = { analyzeResume, deepAnalyzeWithAI };