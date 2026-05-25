// server/middleware/planLimits.js
// Enforces usage limits based on user's subscription plan
// Validates subscription status (active, not expired)
// Supports per-user overrides (admin sets maxScans/maxTailors on each user)
// Admin (kowshikthota43@gmail.com) gets unlimited access

const User = require('../models/User');
const { isAdmin: checkIsAdmin, ADMIN_EMAIL } = require('../utils/isAdmin');

// ─── Plan Feature Matrix ──────────────────────────────────────────────────────
// Each plan defines: scans, tailors, cover letters, templates tier, and features
const PLAN_LIMITS = {
  free: {
    scansPerMonth: 3,
    tailorsPerMonth: 3,
    coverLettersPerMonth: 1,
    templateTier: ['free'],
    maxTemplates: 6,
    features: ['upload', 'basicScan'],
  },
  starter: {
    scansPerMonth: 10,
    tailorsPerMonth: 10,
    coverLettersPerMonth: 10,
    templateTier: ['free'],
    maxTemplates: 6,
    features: ['upload', 'scan', 'tailor', 'templates', 'coverLetter', 'jobs'],
  },
  pro: {
    scansPerMonth: 25,
    tailorsPerMonth: 25,
    coverLettersPerMonth: 25,
    templateTier: ['free'],
    maxTemplates: 6,
    features: ['upload', 'scan', 'tailor', 'templates', 'coverLetter', 'jobs', 'jdMatch', 'pdfDownload'],
  },
  growth: {
    scansPerMonth: 50,
    tailorsPerMonth: 50,
    coverLettersPerMonth: 50,
    templateTier: ['free'],
    maxTemplates: 6,
    features: ['upload', 'scan', 'tailor', 'templates', 'coverLetter', 'jobs', 'jdMatch', 'pdfDownload', 'keywordMatrix'],
  },
  elite: {
    scansPerMonth: 150,
    tailorsPerMonth: 150,
    coverLettersPerMonth: 999999, // unlimited
    templateTier: ['free', 'elite'],
    maxTemplates: 14,
    features: ['upload', 'scan', 'tailor', 'templates', 'coverLetter', 'jobs', 'jdMatch', 'pdfDownload', 'keywordMatrix', 'atsConstraints', 'keywordDensity', 'exactMatch', 'skillCategories'],
  },
  exclusive: {
    scansPerMonth: 500,
    tailorsPerMonth: 500,
    coverLettersPerMonth: 999999, // unlimited
    templateTier: ['free', 'elite', 'exclusive'],
    maxTemplates: 22,
    features: ['upload', 'scan', 'tailor', 'templates', 'coverLetter', 'jobs', 'jdMatch', 'pdfDownload', 'keywordMatrix', 'atsConstraints', 'keywordDensity', 'exactMatch', 'skillCategories', 'verbContext', 'acronymExpansion', 'timelineFormat', 'atsCompliance'],
  },
  admin: {
    scansPerMonth: 999999,
    tailorsPerMonth: 999999,
    coverLettersPerMonth: 999999,
    templateTier: ['free', 'elite', 'exclusive', 'admin'],
    maxTemplates: 30,
    features: ['all'],
  },
};

// ─── Subscription Validation ──────────────────────────────────────────────────
function isSubscriptionActive(user) {
  // Free plan doesn't need subscription
  if (!user.plan || user.plan === 'free') return true;
  // Admin always active
  if (checkIsAdmin(user)) return true;
  // Check subscription status
  if (!user.subscription || user.subscription.status !== 'active') return false;
  // Check expiry
  if (user.subscription.currentPeriodEnd) {
    const now = new Date();
    const expiry = new Date(user.subscription.currentPeriodEnd);
    if (now > expiry) return false;
  }
  return true;
}

// ─── Main Middleware ──────────────────────────────────────────────────────────
function checkUsage(type) {
  return async (req, res, next) => {
    try {
      // Use the user already loaded by auth middleware (searches all DBs)
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'User not found' });

      // Admin bypass — unlimited access (admin plan or admin email)
      if (checkIsAdmin(user)) {
        req.planLimits = PLAN_LIMITS.admin;
        req.userPlan = 'admin';
        req.isAdmin = true;
        return next();
      }

      const plan = user.plan || 'free';
      const planConfig = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

      // ─── Subscription expiry check ─────────────────────────────────────
      if (!isSubscriptionActive(user)) {
        // Downgrade to free limits if subscription expired
        const effectivePlan = 'free';
        const effectiveConfig = PLAN_LIMITS.free;

        // If they're trying to use a paid feature beyond free limits
        if (type === 'scan' && user.usage.scansThisMonth >= effectiveConfig.scansPerMonth) {
          return res.status(403).json({
            error: 'Your subscription has expired. Please renew to continue using premium features.',
            limitReached: true,
            subscriptionExpired: true,
            currentPlan: plan,
            effectivePlan: 'free',
          });
        }
        if (type === 'tailor' && user.usage.tailorsThisMonth >= effectiveConfig.tailorsPerMonth) {
          return res.status(403).json({
            error: 'Your subscription has expired. Please renew to continue using premium features.',
            limitReached: true,
            subscriptionExpired: true,
            currentPlan: plan,
            effectivePlan: 'free',
          });
        }
        if (type === 'coverLetter') {
          const coverLettersUsed = user.usage?.coverLettersThisMonth || 0;
          if (coverLettersUsed >= PLAN_LIMITS.free.coverLettersPerMonth) {
            return res.status(403).json({
              error: 'Your subscription has expired. You have used your free cover letter limit.',
              limitReached: true,
              subscriptionExpired: true,
              currentPlan: plan,
              effectivePlan: 'free',
            });
          }
        }

        req.planLimits = effectiveConfig;
        req.userPlan = effectivePlan;
        return next();
      }

      // Per-user override: if admin has set maxScans/maxTailors on this user, use those
      const effectiveScanLimit = user.maxScans != null ? user.maxScans : planConfig.scansPerMonth;
      const effectiveTailorLimit = user.maxTailors != null ? user.maxTailors : planConfig.tailorsPerMonth;
      const effectiveCoverLetterLimit = planConfig.coverLettersPerMonth;

      // Reset monthly counters if new month
      const now = new Date();
      const lastReset = user.usage?.lastResetDate ? new Date(user.usage.lastResetDate) : new Date(0);
      if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        user.usage.scansThisMonth = 0;
        user.usage.tailorsThisMonth = 0;
        user.usage.coverLettersThisMonth = 0;
        user.usage.lastResetDate = now;
        try { await user.save(); } catch(e) {
          // If save fails (e.g. user on different DB), use updateUserById
          const { updateUserById } = require('../utils/dbConnections');
          await updateUserById(user._id, { 'usage.scansThisMonth': 0, 'usage.tailorsThisMonth': 0, 'usage.coverLettersThisMonth': 0, 'usage.lastResetDate': now });
        }
      }

      // ─── Check limits by type ──────────────────────────────────────────
      if (type === 'scan') {
        if (user.usage.scansThisMonth >= effectiveScanLimit) {
          return res.status(403).json({
            error: plan === 'free'
              ? 'You have used your free ATS scan. Upgrade to a paid plan to continue analyzing resumes.'
              : `You've reached your monthly scan limit (${effectiveScanLimit}). Upgrade your plan for more.`,
            limitReached: true,
            currentPlan: plan,
            limit: effectiveScanLimit,
            used: user.usage.scansThisMonth,
          });
        }
      }

      if (type === 'tailor') {
        if (user.usage.tailorsThisMonth >= effectiveTailorLimit) {
          return res.status(403).json({
            error: plan === 'free'
              ? 'You have used your free resume tailoring. Upgrade to a paid plan to tailor more resumes.'
              : `You've reached your monthly tailoring limit (${effectiveTailorLimit}). Upgrade for more.`,
            limitReached: true,
            currentPlan: plan,
            limit: effectiveTailorLimit,
            used: user.usage.tailorsThisMonth,
          });
        }
      }

      if (type === 'coverLetter') {
        const coverLettersUsed = user.usage.coverLettersThisMonth || 0;
        if (coverLettersUsed >= effectiveCoverLetterLimit) {
          return res.status(403).json({
            error: plan === 'free'
              ? 'You have used your free cover letter. Upgrade to a paid plan for more.'
              : `You've reached your monthly cover letter limit (${effectiveCoverLetterLimit}). Upgrade for more.`,
            limitReached: true,
            currentPlan: plan,
            limit: effectiveCoverLetterLimit,
            used: coverLettersUsed,
          });
        }
      }

      req.planLimits = planConfig;
      req.userPlan = plan;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── Feature Access Check ─────────────────────────────────────────────────────
// Middleware to check if a user's plan includes a specific feature
function checkFeature(featureName) {
  return async (req, res, next) => {
    try {
      // Use the user already loaded by auth middleware
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'User not found' });

      // Admin bypass
      if (checkIsAdmin(user)) {
        req.userPlan = 'admin';
        return next();
      }

      const plan = user.plan || 'free';
      const planConfig = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

      // Check subscription is active
      if (!isSubscriptionActive(user)) {
        return res.status(403).json({
          error: 'Your subscription has expired. Please renew to access this feature.',
          subscriptionExpired: true,
          currentPlan: plan,
        });
      }

      // Check feature access
      if (!planConfig.features.includes('all') && !planConfig.features.includes(featureName)) {
        return res.status(403).json({
          error: `This feature requires a higher plan. Your current plan (${plan}) does not include "${featureName}".`,
          featureRequired: featureName,
          currentPlan: plan,
          upgradeRequired: true,
        });
      }

      req.userPlan = plan;
      req.planLimits = planConfig;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { checkUsage, checkFeature, isSubscriptionActive, PLAN_LIMITS, ADMIN_EMAIL };
