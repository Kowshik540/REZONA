// server/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('../middleware/rateLimit');
const { isAdmin } = require('../utils/isAdmin');
const router = express.Router();

// Rate limit auth endpoints — 10 attempts per 15 minutes
const authLimiter = rateLimit({ windowMs: 900000, max: 10, message: 'Too many attempts. Please try again in 15 minutes.' });

// Helper to generate token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Input validation helpers
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[a-zA-Z\s'-]+$/;

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Name validation
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    }
    if (!nameRegex.test(trimmedName)) {
      return res.status(400).json({ error: 'Name can only contain letters, spaces, hyphens, and apostrophes' });
    }

    // Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const user = new User({ name: trimmedName, email, password });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        plan: user.plan || 'free',
        isAdmin: isAdmin(user),
        usage: user.usage || { scansThisMonth: 0, tailorsThisMonth: 0, coverLettersThisMonth: 0 },
      }
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(400).json({ error: isDev ? error.message : 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        plan: user.plan || 'free',
        isAdmin: isAdmin(user),
        usage: user.usage || { scansThisMonth: 0, tailorsThisMonth: 0, coverLettersThisMonth: 0 },
      }
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(400).json({ error: isDev ? error.message : 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me — verify token & get user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  res.json({
    user: {
      id: req.user._id, name: req.user.name, email: req.user.email,
      plan: req.user.plan || 'free',
      isAdmin: isAdmin(req.user),
      usage: req.user.usage || { scansThisMonth: 0, tailorsThisMonth: 0, coverLettersThisMonth: 0 },
    }
  });
});

module.exports = router;
