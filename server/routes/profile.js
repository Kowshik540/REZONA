// server/routes/profile.js
// User profile management — update name, email, password, view subscription

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Resume = require('../models/Resume');

const router = express.Router();

// ─── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resumeCount = await Resume.countDocuments({ userId: user._id });

    res.json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan || 'free',
        subscription: user.subscription || {},
        usage: user.usage || { scansThisMonth: 0, tailorsThisMonth: 0 },
        resumeCount,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not load profile' });
  }
});

// ─── PUT /api/profile ─────────────────────────────────────────────────────────
router.put('/', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name && name.trim().length >= 2) updates.name = name.trim();
    if (email && email.trim()) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user.id } });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
      updates.email = email.toLowerCase().trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, plan: user.plan } });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ─── PUT /api/profile/password ────────────────────────────────────────────────
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save(); // triggers pre-save hash

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password update failed' });
  }
});

// ─── POST /api/profile/forgot-password ────────────────────────────────────────
// Generates a reset token (in production, send via email)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production: send email with reset link containing resetToken
    // For now, log it (development mode)
    console.log(`[Password Reset] Token for ${email}: ${resetToken}`);

    res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not process reset request' });
  }
});

// ─── POST /api/profile/reset-password ─────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset. You can now login.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// ─── DELETE /api/profile ──────────────────────────────────────────────────────
router.delete('/', auth, async (req, res) => {
  try {
    // Delete all user's resumes
    await Resume.deleteMany({ userId: req.user.id });
    // Delete user
    await User.findByIdAndDelete(req.user.id);
    res.json({ success: true, message: 'Account deleted permanently' });
  } catch (err) {
    res.status(500).json({ error: 'Account deletion failed' });
  }
});

module.exports = router;
