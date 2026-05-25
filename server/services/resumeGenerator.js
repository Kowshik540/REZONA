// server/services/resumeGenerator.js
// Generates a professional PDF resume from tailored content + selected template
// Uses PDFKit for server-side PDF generation — clean, ATS-friendly output

'use strict';

const axios = require('axios');

// Template configurations
// 6 free templates + 24 premium templates (total 30)
// Premium templates available for: elite, exclusive, admin plans
const TEMPLATES = {
  // ─── FREE TEMPLATES (6) ─────────────────────────────────────────────────────
  'modern-blue': {
    name: 'Modern Blue',
    tier: 'free',
    headerBg: [99, 102, 241],    // #6366f1
    headerText: [255, 255, 255],
    accentColor: [99, 102, 241],
    bodyText: [26, 26, 46],
    sectionColor: [99, 102, 241],
    fontFamily: 'Helvetica',
  },
  'elegant-green': {
    name: 'Elegant Green',
    tier: 'free',
    headerBg: [6, 78, 59],
    headerText: [255, 255, 255],
    accentColor: [16, 185, 129],
    bodyText: [26, 26, 26],
    sectionColor: [5, 150, 105],
    fontFamily: 'Helvetica',
  },
  'minimal-white': {
    name: 'Minimal White',
    tier: 'free',
    headerBg: [249, 250, 251],
    headerText: [17, 24, 39],
    accentColor: [55, 65, 81],
    bodyText: [55, 65, 81],
    sectionColor: [17, 24, 39],
    fontFamily: 'Helvetica',
  },
  'executive-dark': {
    name: 'Executive Dark',
    tier: 'free',
    headerBg: [30, 27, 75],
    headerText: [255, 255, 255],
    accentColor: [245, 158, 11],
    bodyText: [30, 27, 75],
    sectionColor: [217, 119, 6],
    fontFamily: 'Helvetica',
  },
  'creative-pink': {
    name: 'Creative Edge',
    tier: 'free',
    headerBg: [131, 24, 67],
    headerText: [255, 255, 255],
    accentColor: [236, 72, 153],
    bodyText: [31, 41, 55],
    sectionColor: [219, 39, 119],
    fontFamily: 'Helvetica',
  },
  'tech-cyan': {
    name: 'Tech Minimal',
    tier: 'free',
    headerBg: [12, 74, 110],
    headerText: [255, 255, 255],
    accentColor: [6, 182, 212],
    bodyText: [15, 23, 42],
    sectionColor: [2, 132, 199],
    fontFamily: 'Helvetica',
  },

  // ─── PREMIUM TEMPLATES (24) — elite / exclusive / admin ─────────────────────
  'corporate-navy': {
    name: 'Corporate Navy',
    tier: 'elite',
    headerBg: [15, 23, 42],
    headerText: [255, 255, 255],
    accentColor: [59, 130, 246],
    bodyText: [30, 41, 59],
    sectionColor: [37, 99, 235],
    fontFamily: 'Helvetica',
  },
  'slate-professional': {
    name: 'Slate Professional',
    tier: 'elite',
    headerBg: [51, 65, 85],
    headerText: [248, 250, 252],
    accentColor: [100, 116, 139],
    bodyText: [30, 41, 59],
    sectionColor: [71, 85, 105],
    fontFamily: 'Helvetica',
  },
  'ruby-bold': {
    name: 'Ruby Bold',
    tier: 'elite',
    headerBg: [127, 29, 29],
    headerText: [255, 255, 255],
    accentColor: [220, 38, 38],
    bodyText: [28, 25, 23],
    sectionColor: [185, 28, 28],
    fontFamily: 'Helvetica',
  },
  'emerald-classic': {
    name: 'Emerald Classic',
    tier: 'elite',
    headerBg: [6, 95, 70],
    headerText: [255, 255, 255],
    accentColor: [16, 185, 129],
    bodyText: [20, 20, 20],
    sectionColor: [4, 120, 87],
    fontFamily: 'Helvetica',
  },
  'sunset-warm': {
    name: 'Sunset Warm',
    tier: 'elite',
    headerBg: [124, 45, 18],
    headerText: [255, 255, 255],
    accentColor: [234, 88, 12],
    bodyText: [41, 37, 36],
    sectionColor: [194, 65, 12],
    fontFamily: 'Helvetica',
  },
  'violet-luxe': {
    name: 'Violet Luxe',
    tier: 'elite',
    headerBg: [76, 29, 149],
    headerText: [255, 255, 255],
    accentColor: [139, 92, 246],
    bodyText: [30, 27, 75],
    sectionColor: [109, 40, 217],
    fontFamily: 'Helvetica',
  },
  'midnight-gold': {
    name: 'Midnight Gold',
    tier: 'elite',
    headerBg: [17, 24, 39],
    headerText: [253, 230, 138],
    accentColor: [202, 138, 4],
    bodyText: [28, 25, 23],
    sectionColor: [161, 98, 7],
    fontFamily: 'Helvetica',
  },
  'arctic-frost': {
    name: 'Arctic Frost',
    tier: 'elite',
    headerBg: [224, 242, 254],
    headerText: [12, 74, 110],
    accentColor: [14, 165, 233],
    bodyText: [15, 23, 42],
    sectionColor: [3, 105, 161],
    fontFamily: 'Helvetica',
  },
  'charcoal-sharp': {
    name: 'Charcoal Sharp',
    tier: 'exclusive',
    headerBg: [24, 24, 27],
    headerText: [250, 250, 250],
    accentColor: [161, 161, 170],
    bodyText: [39, 39, 42],
    sectionColor: [63, 63, 70],
    fontFamily: 'Helvetica',
  },
  'ocean-deep': {
    name: 'Ocean Deep',
    tier: 'exclusive',
    headerBg: [7, 89, 133],
    headerText: [255, 255, 255],
    accentColor: [56, 189, 248],
    bodyText: [12, 74, 110],
    sectionColor: [14, 116, 144],
    fontFamily: 'Helvetica',
  },
  'forest-earth': {
    name: 'Forest Earth',
    tier: 'exclusive',
    headerBg: [20, 83, 45],
    headerText: [255, 255, 255],
    accentColor: [34, 197, 94],
    bodyText: [22, 78, 99],
    sectionColor: [21, 128, 61],
    fontFamily: 'Helvetica',
  },
  'rose-elegant': {
    name: 'Rose Elegant',
    tier: 'exclusive',
    headerBg: [136, 19, 55],
    headerText: [255, 255, 255],
    accentColor: [244, 63, 94],
    bodyText: [64, 64, 64],
    sectionColor: [190, 18, 60],
    fontFamily: 'Helvetica',
  },
  'platinum-exec': {
    name: 'Platinum Executive',
    tier: 'exclusive',
    headerBg: [241, 245, 249],
    headerText: [15, 23, 42],
    accentColor: [71, 85, 105],
    bodyText: [30, 41, 59],
    sectionColor: [51, 65, 85],
    fontFamily: 'Helvetica',
  },
  'indigo-night': {
    name: 'Indigo Night',
    tier: 'exclusive',
    headerBg: [49, 46, 129],
    headerText: [255, 255, 255],
    accentColor: [129, 140, 248],
    bodyText: [30, 27, 75],
    sectionColor: [67, 56, 202],
    fontFamily: 'Helvetica',
  },
  'copper-vintage': {
    name: 'Copper Vintage',
    tier: 'exclusive',
    headerBg: [69, 26, 3],
    headerText: [253, 186, 116],
    accentColor: [180, 83, 9],
    bodyText: [41, 37, 36],
    sectionColor: [146, 64, 14],
    fontFamily: 'Helvetica',
  },
  'teal-modern': {
    name: 'Teal Modern',
    tier: 'exclusive',
    headerBg: [19, 78, 74],
    headerText: [255, 255, 255],
    accentColor: [20, 184, 166],
    bodyText: [17, 24, 39],
    sectionColor: [15, 118, 110],
    fontFamily: 'Helvetica',
  },
  'sapphire-royal': {
    name: 'Sapphire Royal',
    tier: 'admin',
    headerBg: [30, 58, 138],
    headerText: [255, 255, 255],
    accentColor: [96, 165, 250],
    bodyText: [23, 37, 84],
    sectionColor: [29, 78, 216],
    fontFamily: 'Helvetica',
  },
  'obsidian-elite': {
    name: 'Obsidian Elite',
    tier: 'admin',
    headerBg: [9, 9, 11],
    headerText: [250, 250, 250],
    accentColor: [212, 212, 216],
    bodyText: [24, 24, 27],
    sectionColor: [113, 113, 122],
    fontFamily: 'Helvetica',
  },
  'crimson-power': {
    name: 'Crimson Power',
    tier: 'admin',
    headerBg: [103, 7, 15],
    headerText: [255, 255, 255],
    accentColor: [239, 68, 68],
    bodyText: [28, 25, 23],
    sectionColor: [153, 27, 27],
    fontFamily: 'Helvetica',
  },
  'aurora-gradient': {
    name: 'Aurora Gradient',
    tier: 'admin',
    headerBg: [49, 10, 101],
    headerText: [232, 121, 249],
    accentColor: [168, 85, 247],
    bodyText: [30, 27, 75],
    sectionColor: [126, 34, 206],
    fontFamily: 'Helvetica',
  },
  'titanium-pro': {
    name: 'Titanium Pro',
    tier: 'admin',
    headerBg: [63, 63, 70],
    headerText: [228, 228, 231],
    accentColor: [161, 161, 170],
    bodyText: [39, 39, 42],
    sectionColor: [82, 82, 91],
    fontFamily: 'Helvetica',
  },
  'jade-harmony': {
    name: 'Jade Harmony',
    tier: 'admin',
    headerBg: [5, 46, 22],
    headerText: [187, 247, 208],
    accentColor: [74, 222, 128],
    bodyText: [20, 83, 45],
    sectionColor: [22, 163, 74],
    fontFamily: 'Helvetica',
  },
  'steel-minimal': {
    name: 'Steel Minimal',
    tier: 'admin',
    headerBg: [226, 232, 240],
    headerText: [15, 23, 42],
    accentColor: [51, 65, 85],
    bodyText: [30, 41, 59],
    sectionColor: [30, 41, 59],
    fontFamily: 'Helvetica',
  },
  'amber-prestige': {
    name: 'Amber Prestige',
    tier: 'admin',
    headerBg: [66, 32, 6],
    headerText: [252, 211, 77],
    accentColor: [245, 158, 11],
    bodyText: [41, 37, 36],
    sectionColor: [180, 83, 9],
    fontFamily: 'Helvetica',
  },
  // ─── CLEAN PROFESSIONAL TEMPLATES (entry-level & experienced) ────────────────
  'clean-entry': {
    name: 'Clean Entry Level',
    tier: 'free',
    headerBg: [255, 255, 255],
    headerText: [20, 20, 20],
    accentColor: [50, 50, 50],
    bodyText: [30, 30, 30],
    sectionColor: [20, 20, 20],
    fontFamily: 'Helvetica',
    style: 'clean',
  },
  'classic-serif': {
    name: 'Classic Professional',
    tier: 'elite',
    headerBg: [255, 255, 255],
    headerText: [25, 25, 25],
    accentColor: [80, 80, 80],
    bodyText: [35, 35, 35],
    sectionColor: [25, 25, 25],
    fontFamily: 'Times-Roman',
    style: 'classic',
  },
  'harvard-clean': {
    name: 'Harvard Clean',
    tier: 'elite',
    headerBg: [255, 255, 255],
    headerText: [15, 15, 15],
    accentColor: [40, 40, 40],
    bodyText: [30, 30, 30],
    sectionColor: [15, 15, 15],
    fontFamily: 'Helvetica',
    style: 'harvard',
  },
  'wall-street': {
    name: 'Wall Street',
    tier: 'exclusive',
    headerBg: [255, 255, 255],
    headerText: [10, 10, 10],
    accentColor: [60, 60, 60],
    bodyText: [25, 25, 25],
    sectionColor: [10, 10, 10],
    fontFamily: 'Times-Roman',
    style: 'wallstreet',
  },
};

/**
 * Generate a complete tailored resume using Groq API
 * Takes original resume text + job details and produces a full structured resume
 * 
 * INTEGRITY RULES:
 * - NEVER invent projects, companies, skills, achievements, or metrics
 * - NEVER create fake numbers or percentages not in the original
 * - NEVER change dates or education facts
 * - ONLY improve wording, structure, and keyword alignment
 * - Preserve ALL factual information from the original resume
 */
async function generateFullResume(resumeText, jobTitle, jobDescription, templateId) {
  if (!process.env.XAI_API_KEY) {
    throw new Error('XAI_API_KEY not set');
  }

  // Detect if this is a real JD tailoring or generic optimization
  const isRealJD = jobDescription && jobDescription.length > 100 && !jobDescription.includes('Create a highly ATS-optimized');
  
  const tailoringInstruction = isRealJD 
    ? `CRITICAL: This resume is being TAILORED for a SPECIFIC job. You MUST:
- Rewrite the summary to directly address the requirements in the job description below
- Reorder skills to put JD-matching skills FIRST
- Rewrite experience bullets to emphasize skills/technologies mentioned in the JD
- Use EXACT phrases from the job description in your bullets
- The resume should read as if written SPECIFICALLY for this one job posting
- A recruiter should immediately see this candidate is a PERFECT match for THIS role
- The professional summary MUST mention the company name or role title from the JD
- At least 60% of the skills listed should come directly from the JD requirements
- Every experience bullet should contain at least one keyword from the JD`
    : `This is a GENERAL optimization. Make the resume strong for any role in the candidate's field.
- Write a broad professional summary highlighting their strongest skills
- Keep skills in logical order (languages, frameworks, tools, methodologies)
- Write impactful bullets that showcase versatility
- Do NOT target any specific company or role — keep it general-purpose`;

  const prompt = `You are the world's #1 resume generation engine used by top career services at Harvard, Stanford, and McKinsey. You produce resumes that score 90+ on ATS systems and get candidates interviews at FAANG companies.

${tailoringInstruction}

=== YOUR MISSION ===
Take the candidate's raw resume data and produce a COMPLETE, RICH, PROFESSIONAL resume that fills an entire A4 page. The output must be significantly more detailed and polished than the input.

=== CONTENT RULES ===
1. PROFESSIONAL SUMMARY: Write 4-5 powerful sentences. Include years of experience, top 3-4 technologies, biggest achievement, and target role alignment.
2. SKILLS: List 15-25 skills organized by category. Include both the technology and its ecosystem (React → React.js, Hooks, Redux, Context API).
3. EXPERIENCE: For each role, write 4-6 DETAILED bullets (25-40 words each). Each bullet must follow: [Power Verb] + [Specific Task] + [Technology/Method] + [Impact/Scope]
4. PROJECTS: Expand each project into 2-3 rich sentences covering: what it does, tech stack used, key features built, and scale/impact.
5. EDUCATION: Keep exactly as-is from original.
6. ACHIEVEMENTS: Keep exactly as-is from original.
7. CERTIFICATIONS: Keep exactly as-is from original.

=== BULLET WRITING FORMULA ===
WEAK: "Built a web app"
STRONG: "Architected and deployed a production-grade full-stack web application using React.js and Node.js, implementing user authentication, real-time order tracking, and RESTful API integration with MongoDB for persistent data storage"

WEAK: "Improved performance"  
STRONG: "Optimized application performance through implementation of code splitting, lazy loading, and efficient state management, resulting in significantly improved page load times and enhanced user experience across all devices"

=== ATS SCORE BOOSTING (what you MUST do) ===
- If the JD mentions skills that the candidate likely has based on their tech stack, ADD them to the skills section
  Example: If they use React and the JD wants "component architecture, state management, hooks" → ADD those
- If the JD mentions methodologies the candidate likely follows, ADD them: Agile, Scrum, CI/CD, Code Review, Git Flow
- Mirror EXACT phrases from the job description in the summary and bullets where contextually appropriate
- Add both the acronym AND full term: "AWS (Amazon Web Services)", "CI/CD (Continuous Integration/Deployment)"
- Include industry-standard tools implied by their stack: React dev → likely uses VS Code, npm, Chrome DevTools
- Add soft skills demonstrated by their experience: collaboration, problem-solving, communication
- The goal is to MAXIMIZE keyword match rate against the JD while keeping content truthful

=== CONTENT EXPANSION (CRITICAL — fill the full page) ===
- If the resume has only 1-2 experience entries, write 5-6 DETAILED bullets per role (30-50 words each)
- If the resume has few skills, expand to 20-25 skills including sub-technologies and related tools
- If there's no summary, WRITE a powerful 5-sentence summary using facts from the resume
- If projects are brief, expand each to 3-4 sentences describing features, tech decisions, and scope
- Add a "Relevant Coursework" line under education if the candidate is a student
- The final resume MUST have enough content to fill at least 80% of an A4 page
- NEVER leave the resume looking empty — add context, expand descriptions, include implied skills
- If the candidate has internships, treat them as full experience entries with detailed bullets

=== INTEGRITY RULES ===
- NEVER invent companies, roles, or projects not in the original
- NEVER fabricate specific metrics/numbers not in the original
- If original has metrics → KEEP them and enhance the surrounding context
- If original has NO metrics → write rich descriptive bullets WITHOUT fake numbers
- You CAN and SHOULD expand on technologies mentioned (if they use React, add Hooks, Redux, Context API)
- You CAN and SHOULD add implied sub-skills from their tech stack
- You CAN and SHOULD add JD keywords naturally into bullets where the candidate's experience supports it
- You CAN add reasonable scope descriptions (e.g., "cross-browser compatible", "responsive design", "RESTful architecture")

=== TARGET ROLE (CRITICAL — tailor everything to this) ===
Title: ${jobTitle}
Job Description: ${jobDescription.slice(0, 2000)}

TAILORING INSTRUCTIONS:
- Read the job description above CAREFULLY
- Your summary MUST mention the target role title and key requirements from the JD
- Your skills section MUST prioritize skills mentioned in the JD (put them first)
- Your experience bullets MUST use keywords and phrases from the JD
- If the JD mentions specific technologies, frameworks, or methodologies — include them in bullets where the candidate's experience supports it
- The resume should read as if it was WRITTEN SPECIFICALLY for this exact job posting
- A recruiter reading this resume should immediately see the candidate is a strong match for THIS specific role

=== CANDIDATE'S ORIGINAL RESUME ===
${resumeText.slice(0, 4500)}

=== OUTPUT (valid JSON, complete, never truncate) ===
{
  "name": "exact name from resume",
  "email": "exact email from resume",
  "phone": "exact phone from resume",
  "linkedin": "exact linkedin from resume or empty",
  "github": "exact github from resume or empty",
  "location": "exact location from resume or empty",
  "summary": "4-5 sentence powerful professional summary with keywords",
  "skills": ["15-25 skills, JD-relevant first, include sub-skills"],
  "experience": [
    {
      "role": "exact role from resume",
      "company": "exact company from resume",
      "duration": "exact dates from resume",
      "bullets": ["rich detailed bullet 1 (25-40 words)", "bullet 2", "bullet 3", "bullet 4", "bullet 5"]
    }
  ],
  "education": [{"degree": "exact", "institution": "exact", "year": "exact", "details": "exact GPA/details"}],
  "projects": [{"name": "exact name", "tech": "full tech stack", "description": "2-3 sentence rich description"}],
  "certifications": ["exact from resume"],
  "achievements": ["exact from resume"]
}`;

  let res;
  const { callGroq } = require('../utils/groqClient');
  const systemMessage = isRealJD
    ? 'You are the world\'s best resume tailoring specialist. You customize resumes to PERFECTLY match specific job descriptions. Every section you write is laser-focused on the target role. You use EXACT keywords from the JD. The resume you produce will score 90+ on ATS systems for THIS specific job. You NEVER invent facts but you AGGRESSIVELY align existing experience to the JD. Return ONLY valid JSON.'
    : 'You are the world\'s best resume writer. You produce resumes that score 90+ on ATS systems. Every bullet you write is 25-40 words, rich with technical detail, and uses power verbs. You NEVER invent facts but you MAXIMIZE the impact of existing content. You MUST include ALL sections and NEVER truncate. Return ONLY valid JSON.';
  
  // Retry once if first attempt fails (AI services can be flaky)
  let data;
  let lastErr;
  
  // Try with fast 8b model first (higher rate limits on Groq free tier)
  // Falls back to 70b if 8b produces bad output, but 8b is usually sufficient
  const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
  
  for (const model of models) {
    try {
      data = await callGroq({
        model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
        max_tokens: 3500,
        temperature: isRealJD ? 0.6 : 0.4,
      }, 55000);
      
      // Verify the response has actual content
      const content = data.choices?.[0]?.message?.content || '';
      if (content.length > 100) {
        break; // Good response
      }
      // Too short — try next model
      data = null;
    } catch (e) {
      lastErr = e;
      data = null;
      // If it's a rate limit on this model, try next model
      if (e.message.includes('overloaded') || e.message.includes('rate limit') || e.message.includes('temporarily')) {
        continue;
      }
      // For other errors, also try next model
      continue;
    }
  }
  
  if (!data) {
    throw lastErr || new Error('AI service unavailable. Please try again.');
  }

  const raw = data.choices?.[0]?.message?.content || '{}';
  const clean = raw.replace(/```json|```/g, '').trim();
  
  // Handle truncated JSON — if the AI ran out of tokens
  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    // Try to fix truncated JSON by closing open arrays/objects
    let fixed = clean;
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    fixed = fixed.replace(/,\s*$/, '');
    if (fixed.match(/"[^"]*$/)) {
      fixed = fixed.replace(/"[^"]*$/, '""');
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
    
    try {
      parsed = JSON.parse(fixed);
      console.log('[resumeGenerator] Fixed truncated JSON successfully');
    } catch (e2) {
      console.error('[resumeGenerator] Could not parse AI response:', e2.message);
      throw new Error('AI generated invalid resume data. Please try again.');
    }
  }
  
  return parsed;
}

// Template-to-format mapping — each template maps to a unique format (1-34)
// pdfBuilder uses: 1-4=style1, 5-8=style2, 9-12=style3, 13-16=style4, 17-20=style5, 21-24=style6, 25-28=style7, 29-31=style8, 32-34=style9
const TEMPLATE_FORMAT_MAP = {
  'clean-entry':1,'minimal-white':2,'harvard-clean':3,'steel-minimal':4,
  'modern-blue':5,'tech-cyan':6,'corporate-navy':7,'slate-professional':8,
  'elegant-green':9,'emerald-classic':10,'forest-earth':11,'wall-street':12,
  'executive-dark':13,'midnight-gold':14,'charcoal-sharp':15,'obsidian-elite':16,
  'creative-pink':17,'violet-luxe':18,'aurora-gradient':19,'rose-elegant':20,
  'arctic-frost':21,'ocean-deep':22,'indigo-night':23,'teal-modern':24,
  'ruby-bold':25,'sunset-warm':26,'copper-vintage':27,'jade-harmony':28,
  'sapphire-royal':29,'crimson-power':30,'titanium-pro':31,
  'classic-serif':32,'amber-prestige':33,'platinum-exec':34,
};

function buildPdf(resumeData, templateId, fmtIndex) {
  const { buildResumePdf } = require('./pdfBuilder');
  const fmt = fmtIndex || TEMPLATE_FORMAT_MAP[templateId] || 1;
  return buildResumePdf(resumeData, fmt);
}

module.exports = { generateFullResume, buildPdf, TEMPLATES };
