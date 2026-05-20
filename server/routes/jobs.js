const express = require('express');
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const jobMatcher = require('../services/jobMatcher');
const router = express.Router();

// GET /api/jobs/suggestions/:resumeId?location=India
router.get('/suggestions/:resumeId', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const skills = resume.analysis?.skillsDetected || [];
    // Default to India — pass ?location=... in query to override
    const location = req.query.location || 'India';
    const limit = parseInt(req.query.limit) || 20;

    console.log(`🔍 Finding jobs for skills: [${skills.join(', ')}] | location: ${location}`);

    const jobs = await jobMatcher.getJobRecommendations(skills, location, limit);

    // Save to resume for caching
    resume.suggestedJobs = jobs;
    await resume.save();

    res.json({
      success: true,
      count: jobs.length,
      jobs,
      message: `Found ${jobs.length} real job matches!`
    });
  } catch (error) {
    console.error('Job suggestions error:', error.message);
    res.status(500).json({
      error: 'Job search failed',
      jobs: jobMatcher.getFallbackJobs()
    });
  }
});

// GET /api/jobs/search?q=react,nodejs&location=India&limit=20
router.get('/search', auth, async (req, res) => {
  try {
    const { q = 'developer', location = 'India', limit = 20 } = req.query;
    const skills = q.split(',').map(s => s.trim()).filter(Boolean);

    const jobs = await jobMatcher.getJobRecommendations(skills, location, parseInt(limit));
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;