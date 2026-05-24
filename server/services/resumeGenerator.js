// server/services/resumeGenerator.js
// Generates a professional PDF resume from tailored content + selected template
// Uses PDFKit for server-side PDF generation — clean, ATS-friendly output

'use strict';

const PDFDocument = require('pdfkit');
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

  const prompt = `You are the world's #1 resume generation engine used by top career services at Harvard, Stanford, and McKinsey. You produce resumes that score 90+ on ATS systems and get candidates interviews at FAANG companies.

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

=== INTEGRITY RULES ===
- NEVER invent companies, roles, or projects not in the original
- NEVER fabricate specific metrics/numbers not in the original
- If original has metrics → KEEP them and enhance the surrounding context
- If original has NO metrics → write rich descriptive bullets WITHOUT fake numbers
- You CAN and SHOULD expand on technologies mentioned (if they use React, add Hooks, Redux, Context API)
- You CAN and SHOULD add implied sub-skills from their tech stack
- You CAN and SHOULD add JD keywords naturally into bullets where the candidate's experience supports it

=== TARGET ROLE ===
Title: ${jobTitle}
Description: ${jobDescription.slice(0, 2000)}

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
  const data = await callGroq({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are the world\'s best resume writer. You produce resumes that score 90+ on ATS systems. Every bullet you write is 25-40 words, rich with technical detail, and uses power verbs. You NEVER invent facts but you MAXIMIZE the impact of existing content. You MUST include ALL sections and NEVER truncate. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 4000,
    temperature: 0.4,
  }, 60000);

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

/**
 * Build a PDF buffer from structured resume data + template
 * Returns a Buffer containing the PDF
 */
function buildPdf(resumeData, templateId) {
  const t = TEMPLATES[templateId] || TEMPLATES['clean-entry'];
  const style = t.style || 'colored';
  // Map templates to 10 different format layouts
  const formatNum = getFormatNumber(templateId, style);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 36, bottom: 36, left: 50, right: 50 }, bufferPages: true, info: { Title: resumeData.name || 'Resume' } });
      const buffers = [];
      doc.on('data', c => buffers.push(c));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const W = doc.page.width - 100, L = 50;
      let y = 36;
      function col(c) { return Array.isArray(c) ? c : [0,0,0]; }
      const contact = [resumeData.phone, resumeData.email, resumeData.location, resumeData.linkedin, resumeData.github].filter(Boolean);

      // ── HEADER by format ──
      y = renderHeader(doc, resumeData, contact, formatNum, t, L, W);

      // ── SECTIONS ──
      renderAllSections(doc, resumeData, formatNum, t, L, W, y);

      doc.end();
    } catch (err) { reject(err); }
  });
}

function getFormatNumber(templateId, style) {
  if (style === 'clean') return 1;
  if (style === 'classic') return 2;
  if (style === 'harvard') return 3;
  if (style === 'wallstreet') return 4;
  // Colored templates cycle through formats 5-10
  const colored = Object.entries(TEMPLATES).filter(([,v]) => !v.style).map(([k]) => k);
  const idx = colored.indexOf(templateId);
  return 5 + (Math.max(0, idx) % 6);
}

function renderHeader(doc, data, contact, fmt, t, L, W) {
  function col(c) { return Array.isArray(c) ? c : [0,0,0]; }
  let y = 36;

  if (fmt === 1) { // Centered sans, thin line
    doc.font('Helvetica-Bold').fontSize(22).fillColor([10,10,10]).text(data.name||'', L, y, {width:W, align:'center'}); y+=28;
    if (contact.length) { doc.font('Helvetica').fontSize(8.5).fillColor([80,80,80]).text(contact.join('  •  '), L, y, {width:W, align:'center'}); y+=14; }
    doc.moveTo(L,y).lineTo(L+W,y).strokeColor([40,40,40]).lineWidth(0.6).stroke(); y+=14;
  } else if (fmt === 2) { // Left serif, thick line
    doc.font('Times-Bold').fontSize(24).fillColor([0,0,0]).text(data.name||'', L, y, {width:W}); y+=30;
    if (contact.length) { doc.font('Times-Roman').fontSize(9).fillColor([50,50,50]).text(contact.join('  |  '), L, y, {width:W}); y+=14; }
    doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.2).stroke(); y+=16;
  } else if (fmt === 3) { // Centered small, gray line
    doc.font('Helvetica-Bold').fontSize(18).fillColor([20,20,20]).text(data.name||'', L, y, {width:W, align:'center'}); y+=24;
    if (contact.length) { doc.font('Helvetica').fontSize(8).fillColor([100,100,100]).text(contact.join('   |   '), L, y, {width:W, align:'center'}); y+=13; }
    doc.moveTo(L,y).lineTo(L+W,y).strokeColor([200,200,200]).lineWidth(0.3).stroke(); y+=12;
  } else if (fmt === 4) { // Dense serif
    doc.font('Times-Bold').fontSize(20).fillColor([10,10,10]).text(data.name||'', L, y, {width:W}); y+=24;
    if (contact.length) { doc.font('Times-Roman').fontSize(8.5).fillColor([60,60,60]).text(contact.join(' | '), L, y, {width:W}); y+=12; }
    doc.moveTo(L,y).lineTo(L+W,y).strokeColor([30,30,30]).lineWidth(0.8).stroke(); y+=12;
  } else if (fmt === 5) { // Color block header
    doc.rect(0,0,doc.page.width,85).fill(col(t.headerBg));
    doc.font('Helvetica-Bold').fontSize(20).fillColor(col(t.headerText)).text(data.name||'', L, 22, {width:W});
    if (contact.length) doc.font('Helvetica').fontSize(8.5).fillColor(col(t.headerText)).text(contact.join('  |  '), L, 48, {width:W});
    y = 98;
  } else if (fmt === 6) { // Thin top accent bar
    doc.rect(0,0,doc.page.width,5).fill(col(t.accentColor)); y=20;
    doc.font('Helvetica-Bold').fontSize(22).fillColor(col(t.bodyText)).text(data.name||'', L, y, {width:W}); y+=28;
    if (contact.length) { doc.font('Helvetica').fontSize(8.5).fillColor([100,100,100]).text(contact.join('  •  '), L, y, {width:W}); y+=16; }
  } else if (fmt === 7) { // Bold colored name, no header bg
    doc.font('Helvetica-Bold').fontSize(24).fillColor(col(t.sectionColor)).text(data.name||'', L, y, {width:W}); y+=30;
    if (contact.length) { doc.font('Helvetica').fontSize(8.5).fillColor([80,80,80]).text(contact.join('  |  '), L, y, {width:W}); y+=16; }
  } else if (fmt === 8) { // Name + short accent underline
    doc.font('Helvetica-Bold').fontSize(18).fillColor(col(t.bodyText)).text(data.name||'', L, y, {width:W}); y+=22;
    doc.moveTo(L,y).lineTo(L+80,y).strokeColor(col(t.accentColor)).lineWidth(2.5).stroke(); y+=8;
    if (contact.length) { doc.font('Helvetica').fontSize(8).fillColor([100,100,100]).text(contact.join('  |  '), L, y, {width:W}); y+=14; }
  } else if (fmt === 9) { // Large dark header
    doc.rect(0,0,doc.page.width,100).fill(col(t.headerBg));
    doc.font('Helvetica-Bold').fontSize(26).fillColor(col(t.headerText)).text(data.name||'', L, 28, {width:W});
    if (contact.length) doc.font('Helvetica').fontSize(9).fillColor(col(t.headerText)).text(contact.join('   •   '), L, 62, {width:W});
    y = 115;
  } else { // fmt 10: Two-tone header
    doc.rect(0,0,doc.page.width,60).fill(col(t.headerBg));
    doc.font('Helvetica-Bold').fontSize(20).fillColor(col(t.headerText)).text(data.name||'', L, 18, {width:W});
    doc.rect(0,60,doc.page.width,22).fill(col(t.accentColor));
    if (contact.length) doc.font('Helvetica').fontSize(8).fillColor([255,255,255]).text(contact.join('   |   '), L, 64, {width:W});
    y = 95;
  }
  return y;
}

function renderAllSections(doc, data, fmt, t, L, W, startY) {
  let y = startY;
  function col(c) { return Array.isArray(c) ? c : [0,0,0]; }
  function cp() { if (y > 740) { doc.addPage(); y = 36; } }

  const isSerif = (fmt === 2 || fmt === 4);
  const font = isSerif ? 'Times-Roman' : 'Helvetica';
  const bFont = isSerif ? 'Times-Bold' : 'Helvetica-Bold';
  const tColor = (fmt <= 4) ? [0,0,0] : col(t.sectionColor);
  const bColor = (fmt <= 4) ? [25,25,25] : col(t.bodyText);
  const lColor = (fmt <= 4) ? [0,0,0] : col(t.accentColor);

  function secTitle(title) {
    cp(); y += 5;
    if (fmt === 7) { // Left border style
      doc.rect(L, y, 3, 13).fill(col(t.accentColor));
      doc.font(bFont).fontSize(10).fillColor(tColor).text(title.toUpperCase(), L+10, y+1, {width:W-10}); y+=17;
    } else if (fmt === 8) { // Dot style
      doc.circle(L+4, y+5, 2.5).fill(col(t.accentColor));
      doc.font(bFont).fontSize(10).fillColor(tColor).text(title.toUpperCase(), L+14, y, {width:W-14}); y+=15;
    } else { // Line style (all others)
      doc.font(bFont).fontSize(fmt<=4?11:10).fillColor(tColor).text(title.toUpperCase(), L, y, {width:W}); y+=14;
      const lw = fmt===1?0.4 : fmt===2?0.5 : fmt===3?0.3 : fmt===4?0.3 : 0.6;
      doc.moveTo(L,y).lineTo(L+W,y).strokeColor(fmt<=4?[0,0,0]:lColor).lineWidth(lw).stroke(); y+=7;
    }
  }

  function body(text, opts={}) { cp(); doc.font(opts.bold?bFont:font).fontSize(opts.size||9.3).fillColor(bColor); const h=doc.heightOfString(text,{width:W}); doc.text(text,L,y,{width:W}); y+=h+(opts.gap||4); }
  function bullet(text) { cp(); doc.font(font).fontSize(9.2).fillColor(bColor); doc.text('•',L+6,y); const h=doc.heightOfString(text,{width:W-18}); doc.text(text,L+16,y,{width:W-18}); y+=h+3; }

  if (data.summary) { secTitle('Professional Summary'); body(data.summary, {gap:8}); }
  if (data.skills?.length) { secTitle('Skills'); body(data.skills.join('  •  '), {gap:8}); }
  if (data.experience?.length) {
    secTitle('Experience');
    for (const exp of data.experience) {
      cp();
      const role = exp.company ? `${exp.role||''} | ${exp.company}` : (exp.role||'');
      doc.font(bFont).fontSize(9.5).fillColor(bColor).text(role, L, y, {width:W*0.72});
      if (exp.duration) doc.font(font).fontSize(8.5).fillColor([110,110,110]).text(exp.duration, L, y, {width:W, align:'right'});
      y += 13;
      if (exp.bullets?.length) for (const b of exp.bullets) { if(b) bullet(b); }
      y += 4;
    }
  }
  if (data.projects?.length) {
    secTitle('Projects');
    for (const p of data.projects) { cp(); doc.font(bFont).fontSize(9.3).fillColor(bColor).text(p.tech?`${p.name||''} | ${p.tech}`:(p.name||''), L, y, {width:W}); y+=12; if(p.description) bullet(p.description); y+=2; }
  }
  if (data.education?.length) {
    secTitle('Education');
    for (const e of data.education) { cp(); doc.font(bFont).fontSize(9.3).fillColor(bColor).text(e.degree||'', L, y, {width:W*0.72}); if(e.year) doc.font(font).fontSize(8.5).fillColor([110,110,110]).text(e.year, L, y, {width:W, align:'right'}); y+=12; if(e.institution){doc.font(font).fontSize(8.5).fillColor([80,80,80]).text(e.institution,L,y,{width:W});y+=10;} if(e.details){doc.font(font).fontSize(8).fillColor([110,110,110]).text(e.details,L,y,{width:W});y+=10;} y+=2; }
  }
  if (data.achievements?.length) { secTitle('Achievements'); for (const a of data.achievements) bullet(a); }
  if (data.certifications?.length) { secTitle('Certifications'); for (const c of data.certifications) bullet(c); }
}

module.exports = { generateFullResume, buildPdf, TEMPLATES };
