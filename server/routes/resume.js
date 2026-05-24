// server/routes/resume.js

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const pdfParse = require('pdf-parse');

const auth                  = require('../middleware/auth');
const { checkUsage, checkFeature } = require('../middleware/planLimits');
const { isAdmin }           = require('../utils/isAdmin');
const validateObjectId      = require('../utils/validateObjectId');
const Resume                = require('../models/Resume');
const { analyzeResume, deepAnalyzeWithAI } = require('../services/atsAnalyzer');
const { fetchJobs }         = require('../services/jobMatcher');
const { modifyResumeForJob} = require('../services/resumeModifier');
const { generateFullResume, buildPdf, TEMPLATES } = require('../services/resumeGenerator');
const { generateCoverLetter } = require('../services/coverLetterGenerator');
const logger                = require('../utils/logger');

const router = express.Router();

// ─── Input Validation Constants ───────────────────────────────────────────────
const MAX_JOB_TITLE_LENGTH = 200;
const MAX_JOB_DESC_LENGTH = 5000;

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf')
      return cb(new Error('Only PDF files are allowed'));
    cb(null, true);
  },
});

// ─── POST /api/resume/quick-scan (no auth – landing page) ────────────────────
router.post('/quick-scan', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large. Maximum allowed size is 10 MB.' });
      }
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a PDF' });

    const pdfData    = await pdfParse(fs.readFileSync(req.file.path));
    const resumeText = pdfData.text || '';

    if (resumeText.trim().length < 50) {
      return res.status(422).json({
        message: 'Cannot read text from this PDF. Make sure it is not a scanned image.',
      });
    }

    const analysis = await deepAnalyzeWithAI(resumeText, '', '');

    // Clean up the uploaded file (no user account to store it for)
    fs.unlink(req.file.path, () => {});

    res.json({
      score: analysis.score,
      skillsFound: (analysis.skills || analysis.skillsDetected || []).length,
      issuesCount: (analysis.formattingIssues || []).length,
    });
  } catch (err) {
    console.error('[quick-scan]', err);
    res.status(500).json({ message: err.message || 'Quick scan failed' });
  }
});

// ─── POST /api/resume/analyze ─────────────────────────────────────────────────
router.post('/analyze', auth, checkUsage('scan'), (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum allowed size is 10 MB.' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Please upload a PDF' });

    const pdfData    = await pdfParse(fs.readFileSync(req.file.path));
    const resumeText = pdfData.text || '';

    if (resumeText.trim().length < 50) {
      return res.status(422).json({
        error: 'Cannot read text from this PDF. Make sure it is not a scanned image.',
      });
    }

    const { jobTitle = '', jobDescription = '', city = 'India' } = req.body;

    // Use AI-powered analysis (falls back to local if API fails)
    const analysis = await deepAnalyzeWithAI(resumeText, jobTitle, jobDescription);
    const jobs     = await fetchJobs(analysis.skills || analysis.skillsDetected || [], jobTitle, city);

    const record = await Resume.create({
      userId:     req.user.id,
      filename:   req.file.originalname,
      filepath:   req.file.path,
      resumeText, // ✅ stored in schema now
      atsScore:   analysis.score,
      skills:     analysis.skills,
      analysis,
      jobs: jobs.slice(0, 10),
    });

    // Increment usage counter
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'usage.scansThisMonth': 1, 'usage.totalScans': 1 }
    });

    res.json({ success: true, resumeId: record._id, analysis, jobs });
  } catch (err) {
    console.error('[analyze]', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// ─── POST /api/resume/create-from-scratch ─────────────────────────────────────
// Generate a complete resume from user-provided details (no PDF upload needed)
router.post('/create-from-scratch', auth, checkUsage('tailor'), async (req, res) => {
  try {
    const { name, email, phone, location, linkedin, github, summary, education, experience, skills, projects, certifications, achievements, targetRole } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Build resume text from user input for AI processing
    const resumeText = [
      `${name}`,
      [phone, email, location, linkedin, github].filter(Boolean).join(' | '),
      summary ? `\nSummary: ${summary}` : '',
      education?.length ? `\nEducation:\n${education.map(e => `${e.degree} - ${e.institution} (${e.year}) ${e.details || ''}`).join('\n')}` : '',
      experience?.length ? `\nExperience:\n${experience.filter(e => e.role).map(e => `${e.role} at ${e.company} (${e.duration})\n${e.bullets?.filter(Boolean).map(b => '- ' + b).join('\n')}`).join('\n\n')}` : '',
      skills?.length ? `\nSkills: ${skills.join(', ')}` : '',
      projects?.length ? `\nProjects:\n${projects.filter(p => p.name).map(p => `${p.name} [${p.tech}] - ${p.description}`).join('\n')}` : '',
      certifications?.length ? `\nCertifications: ${certifications.join(', ')}` : '',
      achievements?.length ? `\nAchievements:\n${achievements.map(a => '- ' + a).join('\n')}` : '',
    ].filter(Boolean).join('\n');

    const jobTitle = targetRole || 'Software Developer';
    const jobDescription = `Create a highly ATS-optimized resume for a ${jobTitle} role. Focus on strong action verbs, proper section structure, keyword density, and professional formatting. Tailor the content to be suitable for ${jobTitle} positions.`;

    // Generate structured resume using AI
    const resumeData = await generateFullResume(resumeText, jobTitle, jobDescription, 'clean-entry');

    // Override with user-provided contact details
    resumeData.name = name;
    if (email) resumeData.email = email;
    if (phone) resumeData.phone = phone;
    if (location) resumeData.location = location;
    if (linkedin) resumeData.linkedin = linkedin;
    if (github) resumeData.github = github;

    // Build PDF
    const pdfBuffer = await buildPdf(resumeData, 'clean-entry');

    // Save to DB
    const record = await Resume.create({
      userId: req.user.id,
      filename: `${name.replace(/\s+/g, '_')}_Resume.pdf`,
      resumeText,
      atsScore: 75, // Generated resumes start with good score
      skills: skills || [],
      analysis: { skillsDetected: skills || [], wordCount: resumeText.split(/\s+/).length },
    });

    // Increment usage
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'usage.tailorsThisMonth': 1, 'usage.totalTailors': 1 }
    });

    // Send PDF
    const safeName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Resume_${safeName}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    logger.error('[create-from-scratch] ' + err.message);
    res.status(500).json({ error: err.message || 'Resume creation failed' });
  }
});

// ─── POST /api/resume/jobs ────────────────────────────────────────────────────
router.post('/jobs', auth, async (req, res) => {
  try {
    const { skills = [], jobTitle = '', city = 'India', filters = {} } = req.body;
    logger.info('[resume/jobs] Fetching jobs', { skillCount: skills.length, jobTitle, city });
    const jobs = await fetchJobs(skills, jobTitle, city, filters);
    res.json({ success: true, jobs });
  } catch (err) {
    logger.error('[resume/jobs] ' + err.message, { stack: err.stack?.split('\n')[1] });
    res.status(500).json({ error: 'Could not fetch jobs. Please try again.' });
  }
});

// ─── POST /api/resume/modify ──────────────────────────────────────────────────
// Auto-modify resume text for a specific job using Claude AI
// Body: { resumeId, jobTitle, jobDescription, missingSkills, skills? }
// 3-tier fallback: DB resumeText → PDF re-parse → skills stub
router.post('/modify', auth, checkUsage('tailor'), async (req, res) => {
  try {
    const { resumeId, jobTitle, jobDescription, missingSkills = [], skills = [] } = req.body;

    if (!jobTitle || !jobDescription) {
      return res.status(400).json({ error: 'jobTitle and jobDescription are required' });
    }
    if (jobTitle.length > MAX_JOB_TITLE_LENGTH) {
      return res.status(400).json({ error: `Job title too long (max ${MAX_JOB_TITLE_LENGTH} chars)` });
    }
    if (jobDescription.length > MAX_JOB_DESC_LENGTH) {
      return res.status(400).json({ error: `Job description too long (max ${MAX_JOB_DESC_LENGTH} chars)` });
    }

    let resumeText = '';
    let usedFallback = false;

    if (resumeId) {
      const record = await Resume.findOne({ _id: resumeId, userId: req.user.id });

      if (record?.resumeText && record.resumeText.trim().length > 50) {
        // ✅ Tier 1 — best case: text already stored in DB
        resumeText = record.resumeText;

      } else if (record?.filepath && fs.existsSync(record.filepath)) {
        // ✅ Tier 2 — re-parse the PDF file for records uploaded before schema fix
        console.log('[modify] Tier 2: re-parsing PDF from', record.filepath);
        try {
          const pdfData = await pdfParse(fs.readFileSync(record.filepath));
          resumeText = pdfData.text || '';
          if (resumeText.trim().length > 50) {
            // Backfill so next call is instant
            await Resume.updateOne({ _id: record._id }, { $set: { resumeText } });
            console.log('[modify] Backfilled resumeText for record', record._id);
          }
        } catch (parseErr) {
          console.error('[modify] PDF re-parse failed:', parseErr.message);
        }

      } else if (record?.skills?.length) {
        // ✅ Tier 3 — file missing, build a minimal stub from stored skills
        console.log('[modify] Tier 3: building stub from stored skills');
        usedFallback = true;
        resumeText = `Candidate Profile\n\nSkills: ${record.skills.join(', ')}\n\nExperience: Software developer with experience in ${record.skills.slice(0, 5).join(', ')}.`;
      }
    }

    // Last resort — use skills array sent from client
    if ((!resumeText || resumeText.trim().length < 50) && skills.length) {
      console.log('[modify] Tier 3b: building stub from client skills');
      usedFallback = true;
      resumeText = `Candidate Profile\n\nSkills: ${skills.join(', ')}\n\nExperience: Software developer with experience in ${skills.slice(0, 5).join(', ')}.`;
    }

    if (!resumeText || resumeText.trim().length < 10) {
      return res.status(400).json({
        error: 'Could not load resume content. Please re-upload your resume PDF and try again.',
      });
    }

    const result = await modifyResumeForJob(resumeText, jobTitle, jobDescription, missingSkills);

    // Increment tailor usage
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'usage.tailorsThisMonth': 1, 'usage.totalTailors': 1 }
    });

    res.json({ success: true, ...result, usedFallback });
  } catch (err) {
    console.error('[modify]', err);
    res.status(500).json({ error: err.message || 'Modification failed' });
  }
});

// ─── POST /api/resume/generate ────────────────────────────────────────────────
// Generate a full tailored resume PDF using AI + selected template
// Body: { resumeId, jobTitle, jobDescription, templateId }
router.post('/generate', auth, checkUsage('tailor'), async (req, res) => {
  try {
    const { resumeId, jobTitle, jobDescription, templateId = 'modern-blue', contactDetails = {} } = req.body;

    if (!jobTitle || !jobDescription) {
      return res.status(400).json({ error: 'jobTitle and jobDescription are required' });
    }
    if (jobTitle.length > MAX_JOB_TITLE_LENGTH) {
      return res.status(400).json({ error: `Job title too long (max ${MAX_JOB_TITLE_LENGTH} chars)` });
    }
    if (jobDescription.length > MAX_JOB_DESC_LENGTH) {
      return res.status(400).json({ error: `Job description too long (max ${MAX_JOB_DESC_LENGTH} chars)` });
    }

    if (!TEMPLATES[templateId]) {
      return res.status(400).json({ error: 'Invalid template selected' });
    }

    // Validate template access based on user plan
    const User = require('../models/User');
    const userRecord = await User.findById(req.user.id);
    const userPlan = userRecord?.plan || 'free';
    
    if (!isAdmin(userRecord)) {
      const templateTier = TEMPLATES[templateId].tier;
      const tierAccess = {
        free:      ['free'],
        starter:   ['free'],
        pro:       ['free'],
        growth:    ['free'],
        elite:     ['free', 'elite'],
        exclusive: ['free', 'elite', 'exclusive'],
        admin:     ['free', 'elite', 'exclusive', 'admin'],
      };
      const allowedTiers = tierAccess[userPlan] || ['free'];
      if (!allowedTiers.includes(templateTier)) {
        return res.status(403).json({ error: `Template "${TEMPLATES[templateId].name}" requires ${templateTier} plan or higher. Upgrade to access premium templates.` });
      }
    }

    // Get original resume text
    let resumeText = '';
    if (resumeId) {
      const record = await Resume.findOne({ _id: resumeId, userId: req.user.id });
      if (record?.resumeText && record.resumeText.trim().length > 50) {
        resumeText = record.resumeText;
      } else if (record?.filepath && fs.existsSync(record.filepath)) {
        const pdfData = await pdfParse(fs.readFileSync(record.filepath));
        resumeText = pdfData.text || '';
      }
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not load resume content. Please re-upload your resume.' });
    }

    // Generate structured resume data using AI
    const resumeData = await generateFullResume(resumeText, jobTitle, jobDescription, templateId);

    // Override with user-provided contact details
    if (contactDetails.name) resumeData.name = contactDetails.name;
    if (contactDetails.email) resumeData.email = contactDetails.email;
    if (contactDetails.phone) resumeData.phone = contactDetails.phone;
    if (contactDetails.location) resumeData.location = contactDetails.location;
    if (contactDetails.linkedin) resumeData.linkedin = contactDetails.linkedin;
    if (contactDetails.github) resumeData.github = contactDetails.github;

    // Build PDF
    const pdfBuffer = await buildPdf(resumeData, templateId);

    // Send PDF as response
    const safeName = (jobTitle || 'resume').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Resume_${safeName}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    // Increment tailor usage
    const UserModel = require('../models/User');
    await UserModel.findByIdAndUpdate(req.user.id, {
      $inc: { 'usage.tailorsThisMonth': 1, 'usage.totalTailors': 1 }
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('[generate]', err);
    res.status(500).json({ error: err.message || 'Resume generation failed' });
  }
});

// ─── POST /api/resume/generate-preview ────────────────────────────────────────
// Same as generate but returns JSON data for client-side preview
router.post('/generate-preview', auth, checkUsage('tailor'), async (req, res) => {
  try {
    const { resumeId, jobTitle, jobDescription, templateId = 'modern-blue' } = req.body;

    if (!jobTitle || !jobDescription) {
      return res.status(400).json({ error: 'jobTitle and jobDescription are required' });
    }

    // Validate template access based on user plan
    if (TEMPLATES[templateId]) {
      const User = require('../models/User');
      const userRecord = await User.findById(req.user.id);
      const userPlan = userRecord?.plan || 'free';
      
      if (!isAdmin(userRecord)) {
        const templateTier = TEMPLATES[templateId].tier;
        const tierAccess = {
          free:      ['free'],
          starter:   ['free'],
          pro:       ['free'],
          growth:    ['free'],
          elite:     ['free', 'elite'],
          exclusive: ['free', 'elite', 'exclusive'],
          admin:     ['free', 'elite', 'exclusive', 'admin'],
        };
        const allowedTiers = tierAccess[userPlan] || ['free'];
        if (!allowedTiers.includes(templateTier)) {
          return res.status(403).json({ error: `Template "${TEMPLATES[templateId].name}" requires ${templateTier} plan or higher. Upgrade to access premium templates.` });
        }
      }
    }

    let resumeText = '';
    if (resumeId) {
      const record = await Resume.findOne({ _id: resumeId, userId: req.user.id });
      if (record?.resumeText && record.resumeText.trim().length > 50) {
        resumeText = record.resumeText;
      } else if (record?.filepath && fs.existsSync(record.filepath)) {
        const pdfData = await pdfParse(fs.readFileSync(record.filepath));
        resumeText = pdfData.text || '';
      }
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not load resume content. Please re-upload your resume.' });
    }

    const resumeData = await generateFullResume(resumeText, jobTitle, jobDescription, templateId);

    // Increment tailor usage
    const UserModel = require('../models/User');
    await UserModel.findByIdAndUpdate(req.user.id, {
      $inc: { 'usage.tailorsThisMonth': 1, 'usage.totalTailors': 1 }
    });

    res.json({ success: true, resumeData, templateId });
  } catch (err) {
    console.error('[generate-preview]', err);
    res.status(500).json({ error: err.message || 'Preview generation failed' });
  }
});

// ─── GET /api/resume/templates ────────────────────────────────────────────────
// Returns templates available for the user's plan tier
// Free/starter/pro/growth: 6 templates | elite: 14 | exclusive: 22 | admin: 30
router.get('/templates', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const { isSubscriptionActive, PLAN_LIMITS } = require('../middleware/planLimits');
    const user = await User.findById(req.user.id);
    let plan = user?.plan || 'free';

    // Admin bypass — full access to all templates
    if (isAdmin(user)) {
      plan = 'admin';
    }
    // If subscription expired, treat as free
    else if (plan !== 'free' && !isSubscriptionActive(user)) {
      plan = 'free';
    }

    const planConfig = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    const allowedTiers = planConfig.templateTier || ['free'];

    const templates = Object.entries(TEMPLATES)
      .filter(([, t]) => allowedTiers.includes(t.tier))
      .map(([id, t]) => ({
        id,
        name: t.name,
        tier: t.tier,
        accentColor: `rgb(${t.accentColor.join(',')})`,
        headerBg: `rgb(${t.headerBg.join(',')})`,
      }));

    res.json({ success: true, templates, plan, totalAvailable: Object.keys(TEMPLATES).length });
  } catch (err) {
    // Fallback: return free templates without auth
    const templates = Object.entries(TEMPLATES)
      .filter(([, t]) => t.tier === 'free')
      .map(([id, t]) => ({
        id,
        name: t.name,
        tier: t.tier,
        accentColor: `rgb(${t.accentColor.join(',')})`,
        headerBg: `rgb(${t.headerBg.join(',')})`,
      }));
    res.json({ success: true, templates, plan: 'free', totalAvailable: Object.keys(TEMPLATES).length });
  }
});

// ─── POST /api/resume/cover-letter ───────────────────────────────────────────
router.post('/cover-letter', auth, checkUsage('coverLetter'), async (req, res) => {
  try {
    const { resumeId, jobTitle, jobDescription, companyName, candidateName, candidateEmail, candidatePhone } = req.body;

    if (!jobTitle || !jobDescription) {
      return res.status(400).json({ error: 'jobTitle and jobDescription are required' });
    }

    let resumeText = '';
    if (resumeId) {
      const record = await Resume.findOne({ _id: resumeId, userId: req.user.id });
      if (record?.resumeText && record.resumeText.trim().length > 50) {
        resumeText = record.resumeText;
      } else if (record?.filepath && fs.existsSync(record.filepath)) {
        const pdfData = await pdfParse(fs.readFileSync(record.filepath));
        resumeText = pdfData.text || '';
      }
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not load resume content. Please re-upload your resume.' });
    }

    const result = await generateCoverLetter(resumeText, jobTitle, jobDescription, companyName, candidateName);

    // Increment cover letter usage
    const UserModel = require('../models/User');
    await UserModel.findByIdAndUpdate(req.user.id, {
      $inc: { 'usage.coverLettersThisMonth': 1, 'usage.totalCoverLetters': 1 }
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[cover-letter]', err);
    res.status(500).json({ error: err.message || 'Cover letter generation failed' });
  }
});

// ─── GET /api/resume/history ──────────────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const resumes = await Resume
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-resumeText') // don't send raw text in list
      .limit(20);
    res.json({ success: true, resumes });
  } catch (err) {
    res.status(500).json({ error: 'Could not load history' });
  }
});

// ─── GET /api/resume/:id ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id })
      .select('-resumeText');
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ error: 'Could not load resume' });
  }
});

// ─── DELETE /api/resume/:id ───────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ error: 'Not found' });
    if (resume.filepath && fs.existsSync(resume.filepath)) fs.unlinkSync(resume.filepath);
    await resume.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
