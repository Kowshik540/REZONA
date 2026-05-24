// server/routes/admin.js
// Admin-only routes for managing users, subscriptions, and usage limits
// Only accessible by kowshikthota43@gmail.com

const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Resume = require('../models/Resume');

const router = express.Router();
const ADMIN_EMAIL = 'kowshikthota43@gmail.com';

// Admin check middleware
function adminOnly(req, res, next) {
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ─── GET /api/admin/users — List all users with usage stats ───────────────────
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

    const usersWithStats = users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      plan: u.plan || 'free',
      maxScans: u.maxScans,
      maxTailors: u.maxTailors,
      usage: u.usage || { scansThisMonth: 0, tailorsThisMonth: 0, totalScans: 0, totalTailors: 0 },
      subscription: u.subscription,
      createdAt: u.createdAt,
    }));

    res.json({ success: true, count: usersWithStats.length, users: usersWithStats });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch users' });
  }
});

// ─── PUT /api/admin/users/:id — Update a user's plan, limits, usage ───────────
router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { plan, maxScans, maxTailors, resetUsage } = req.body;
    const updates = {};

    if (plan && ['free', 'starter', 'pro', 'growth', 'elite', 'exclusive', 'admin'].includes(plan)) {
      updates.plan = plan;
    }
    if (maxScans !== undefined) {
      updates.maxScans = maxScans === null ? null : parseInt(maxScans);
    }
    if (maxTailors !== undefined) {
      updates.maxTailors = maxTailors === null ? null : parseInt(maxTailors);
    }
    if (resetUsage) {
      updates['usage.scansThisMonth'] = 0;
      updates['usage.tailorsThisMonth'] = 0;
      updates['usage.lastResetDate'] = new Date();
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        maxScans: user.maxScans,
        maxTailors: user.maxTailors,
        usage: user.usage,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not update user' });
  }
});

// ─── GET /api/admin/users/:id — Get single user details ──────────────────────
router.get('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resumeCount = await Resume.countDocuments({ userId: user._id });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        maxScans: user.maxScans,
        maxTailors: user.maxTailors,
        usage: user.usage,
        subscription: user.subscription,
        resumeCount,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user' });
  }
});

// ─── DELETE /api/admin/users/:id — Delete a user ─────────────────────────────
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email === ADMIN_EMAIL) return res.status(400).json({ error: 'Cannot delete admin' });

    await Resume.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: `User ${user.email} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete user' });
  }
});

// ─── GET /api/admin/stats — Dashboard stats ──────────────────────────────────
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const paidUsers = await User.countDocuments({ plan: { $ne: 'free' } });
    const totalResumes = await Resume.countDocuments();

    const planDist = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);

    const topUsers = await User.find()
      .sort({ 'usage.totalScans': -1 })
      .limit(10)
      .select('name email plan usage.totalScans usage.totalTailors usage.scansThisMonth usage.tailorsThisMonth');

    res.json({
      success: true,
      stats: {
        totalUsers,
        paidUsers,
        totalResumes,
        planDistribution: planDist.reduce((acc, p) => { acc[p._id || 'free'] = p.count; return acc; }, {}),
        topUsers: topUsers.map(u => ({
          name: u.name, email: u.email, plan: u.plan,
          totalScans: u.usage?.totalScans || 0,
          totalTailors: u.usage?.totalTailors || 0,
          thisMonth: { scans: u.usage?.scansThisMonth || 0, tailors: u.usage?.tailorsThisMonth || 0 },
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch stats' });
  }
});

module.exports = router;
