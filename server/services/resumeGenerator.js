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

  const prompt = `You are an elite ATS Resume Optimizer. Your job is to restructure and reword the candidate's resume for maximum ATS compatibility while being COMPLETELY TRUTHFUL.

=== ABSOLUTE RULES (NEVER BREAK) ===
1. NEVER invent projects, companies, roles, or achievements
2. NEVER create fake metrics, percentages, or numbers not in the original
3. NEVER add skills the candidate doesn't demonstrate in their resume
4. NEVER change dates, education details, or company names
5. PRESERVE all factual information exactly
6. If the original has metrics (e.g., "reduced load time by 30%"), KEEP them
7. If the original has NO metrics for a bullet, improve wording WITHOUT inventing numbers
   CORRECT: "Developed responsive UI components using React, ensuring cross-browser compatibility"
   WRONG: "Developed UI components reducing load time by 40%" ← NEVER invent this

=== ATS OPTIMIZATION (what you CAN do) ===
- Reword bullets into: [Action Verb] + [Task/Technology] + [Impact/Result]
- Match keywords from the JD naturally in context
- Use standard section titles: SUMMARY, SKILLS, EXPERIENCE, PROJECTS, EDUCATION, CERTIFICATIONS
- Reorder skills to prioritize JD-relevant ones first
- Expand acronyms where natural: "AWS (Amazon Web Services)"
- Remove buzzwords: synergy, guru, ninja, rockstar, passionate
- Use strong action verbs: Developed, Architected, Implemented, Optimized, Designed, Led, Deployed
- Improve sentence clarity and professional tone
- Group skills by category
- EXPAND weak/short bullets into fuller sentences with more technical detail from context
- If a bullet says "Built web app" and the skills show React/Node, expand to "Developed full-stack web application using React and Node.js with RESTful API integration"
- Add implied sub-skills: if they list React, you can mention component architecture, state management
- Make bullets LONGER and more detailed (20-40 words each) — add technical context from their skill set
- The resume should fill a full page — never leave it half-empty

=== SECTION REQUIREMENTS (include ALL, never skip) ===
1. Contact: name, email, phone, linkedin, github, location — extract from resume
2. Summary: 4-5 sentences using ONLY facts from the resume, aligned to target role, keyword-rich
3. Skills: ALL skills from the resume (reordered to match JD priority) — list 12-20 skills
4. Experience: ALL roles from resume with improved bullet wording (4-5 detailed bullets each)
5. Education: EXACTLY as in original — never modify
6. Projects: ALL projects from resume with expanded descriptions (2-3 sentences each)
7. Certifications: ALL certifications from resume
8. Achievements: ALL achievements from resume

=== TARGET JOB ===
Title: ${jobTitle}
Description: ${jobDescription.slice(0, 2000)}

=== CANDIDATE'S ORIGINAL RESUME (FROM UPLOADED PDF) ===
${resumeText.slice(0, 4000)}

Return ONLY valid JSON (complete, never truncate):
{
  "name": "exact name from resume",
  "email": "exact email from resume or empty",
  "phone": "exact phone from resume or empty",
  "linkedin": "exact linkedin from resume or empty",
  "github": "exact github from resume or empty",
  "location": "exact location from resume or empty",
  "summary": "4-5 sentence professional summary using facts from the resume, keyword-rich",
  "skills": ["all skills from resume reordered by JD relevance, 12-20 items"],
  "experience": [
    {
      "role": "exact role title from resume",
      "company": "exact company name from resume",
      "duration": "exact dates from resume",
      "bullets": ["detailed expanded bullet 1 (20-40 words)", "bullet 2", "bullet 3", "bullet 4"]
    }
  ],
  "education": [{"degree": "exact from resume", "institution": "exact from resume", "year": "exact from resume", "details": "exact GPA/details from resume or empty"}],
  "projects": [{"name": "exact project name", "tech": "exact tech stack", "description": "expanded 2-3 sentence description using facts from resume"}],
  "certifications": ["exact certifications from resume"],
  "achievements": ["exact achievements from resume"]
}`;

  let res;
  const { callGroq } = require('../utils/groqClient');
  const data = await callGroq({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are an elite ATS resume optimizer. You NEVER invent facts, metrics, projects, or companies. You ONLY improve wording and keyword alignment using the candidate\'s actual data. You MUST include ALL sections (summary, skills, experience, education, projects, certifications) — never skip any. Return ONLY valid JSON, no markdown fences.' },
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
