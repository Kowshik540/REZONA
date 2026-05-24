// server/routes/stats.js
// Basic analytics endpoint — admin/internal use

const express = require('express');
const User = require('../models/User');
const Resume = require('../models/Resume');
const router = express.Router();

// GET /api/stats — public health/stats endpoint
router.get('/', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalResumes = await Resume.countDocuments();
    const paidUsers = await User.countDocuments({ plan: { $ne: 'free' } });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayUsers = await User.countDocuments({ createdAt: { $gte: todayStart } });
    const todayResumes = await Resume.countDocuments({ createdAt: { $gte: todayStart } });

    // Average ATS score
    const avgResult = await Resume.aggregate([
      { $match: { atsScore: { $exists: true, $gt: 0 } } },
      { $group: { _id: null, avgScore: { $avg: '$atsScore' } } },
    ]);
    const avgAtsScore = Math.round(avgResult[0]?.avgScore || 0);

    // Plan distribution
    const planDist = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalResumes,
        paidUsers,
        todayUsers,
        todayResumes,
        avgAtsScore,
        planDistribution: planDist.reduce((acc, p) => {
          acc[p._id || 'free'] = p.count;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch stats' });
  }
});

module.exports = router;
