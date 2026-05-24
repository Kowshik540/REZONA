const express = require('express');
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const { fetchJobs } = require('../services/jobMatcher');
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
    const location = req.query.location || 'India';

    const jobs = await fetchJobs(skills, '', location);

    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Job suggestions error:', error.message);
    res.status(500).json({
      error: 'Could not fetch jobs. Please try again.',
      jobs: [],
    });
  }
});

// GET /api/jobs/search?q=react,nodejs&location=India
router.get('/search', auth, async (req, res) => {
  try {
    const { q = 'developer', location = 'India' } = req.query;
    const skills = q.split(',').map(s => s.trim()).filter(Boolean);

    const jobs = await fetchJobs(skills, '', location);
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch jobs. Please try again.', jobs: [] });
  }
});

module.exports = router;
