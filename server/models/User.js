const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  resumes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  }],
  // Subscription fields
  plan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'growth', 'elite', 'exclusive', 'admin'],
    default: 'free'
  },
  subscription: {
    razorpaySubscriptionId: { type: String, default: null },
    razorpayCustomerId: { type: String, default: null },
    planId: { type: String, default: null },
    status: { type: String, enum: ['active', 'cancelled', 'expired', 'pending', null], default: null },
    currentPeriodEnd: { type: Date, default: null },
    billing: { type: String, enum: ['monthly', 'yearly', null], default: null },
  },
  // Usage tracking
  usage: {
    scansThisMonth: { type: Number, default: 0 },
    tailorsThisMonth: { type: Number, default: 0 },
    coverLettersThisMonth: { type: Number, default: 0 },
    totalScans: { type: Number, default: 0 },
    totalTailors: { type: Number, default: 0 },
    totalCoverLetters: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
  },
  // Per-user limits (admin can override these per user)
  maxScans: { type: Number, default: null },   // null = use plan default
  maxTailors: { type: Number, default: null }, // null = use plan default
  // Password reset
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if subscription is active
userSchema.methods.hasActivePlan = function () {
  if (this.plan === 'free') return false;
  if (!this.subscription?.status) return false;
  if (this.subscription.status !== 'active') return false;
  if (this.subscription.currentPeriodEnd && new Date() > this.subscription.currentPeriodEnd) return false;
  return true;
};

// Check if user is admin
userSchema.methods.isAdmin = function () {
  return this.email === 'kowshikthota43@gmail.com';
};

module.exports = mongoose.model('User', userSchema);
