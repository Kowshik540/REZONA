// server/routes/payment.js
// Razorpay payment gateway integration for subscriptions

const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Initialize Razorpay instance
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Plan configuration (amounts in paise — ₹1 = 100 paise)
const PLANS = {
  starter: {
    monthly: { amount: 9900, name: 'Starter Monthly', description: 'Rezona Starter Plan - Monthly' },
    yearly:  { amount: 94800, name: 'Starter Yearly', description: 'Rezona Starter Plan - Yearly (Save 20%)' },
  },
  pro: {
    monthly: { amount: 24900, name: 'Pro Monthly', description: 'Rezona Pro Plan - Monthly' },
    yearly:  { amount: 214800, name: 'Pro Yearly', description: 'Rezona Pro Plan - Yearly (Save 28%)' },
  },
  growth: {
    monthly: { amount: 49900, name: 'Growth Monthly', description: 'Rezona Growth Plan - Monthly' },
    yearly:  { amount: 406800, name: 'Growth Yearly', description: 'Rezona Growth Plan - Yearly (Save 32%)' },
  },
  elite: {
    monthly: { amount: 99900, name: 'Elite Monthly', description: 'Rezona Elite Plan - Monthly' },
    yearly:  { amount: 838800, name: 'Elite Yearly', description: 'Rezona Elite Plan - Yearly (Save 30%)' },
  },
  exclusive: {
    monthly: { amount: 199900, name: 'Exclusive Monthly', description: 'Rezona Exclusive Plan - Monthly' },
    yearly:  { amount: 1678800, name: 'Exclusive Yearly', description: 'Rezona Exclusive Plan - Yearly (Save 30%)' },
  },
};

// Plan tier ordering for upgrade/downgrade detection
const PLAN_ORDER = { free: 0, starter: 1, pro: 2, growth: 3, elite: 4, exclusive: 5 };

// ─── POST /api/payment/create-order ───────────────────────────────────────────
// Creates a Razorpay order for one-time payment (subscription activation)
router.post('/create-order', auth, async (req, res) => {
  try {
    const { planId, billing = 'monthly' } = req.body;

    if (!planId || !PLANS[planId]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    if (!['monthly', 'yearly'].includes(billing)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Payment gateway not configured. Contact support.' });
    }

    // Check for downgrade attempt
    const user = await User.findById(req.user.id);
    const currentPlan = user?.plan || 'free';
    const { isSubscriptionActive } = require('../middleware/planLimits');
    
    if (currentPlan !== 'free' && isSubscriptionActive(user)) {
      const currentTier = PLAN_ORDER[currentPlan] || 0;
      const requestedTier = PLAN_ORDER[planId] || 0;
      
      if (requestedTier < currentTier) {
        return res.status(400).json({ 
          error: `You cannot downgrade from ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} to ${planId.charAt(0).toUpperCase() + planId.slice(1)} while your current plan is active. You can downgrade after your current plan expires on ${new Date(user.subscription?.currentPeriodEnd).toLocaleDateString()}.`,
          isDowngrade: true,
        });
      }
      
      if (requestedTier === currentTier) {
        return res.status(400).json({ 
          error: `You are already on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.`,
          isSamePlan: true,
        });
      }
    }

    const plan = PLANS[planId][billing];
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: 'INR',
      receipt: `rzn_${Date.now()}`,
      notes: {
        userId: (req.user._id || req.user.id).toString(),
        planId,
        billing,
        userName: req.user.name || '',
        userEmail: req.user.email || '',
      },
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      plan: {
        id: planId,
        billing,
        name: plan.name,
        description: plan.description,
      },
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[payment/create-order]', err.message || err);
    res.status(500).json({ error: err.message || 'Could not create payment order' });
  }
});

// ─── POST /api/payment/verify ─────────────────────────────────────────────────
// Verifies Razorpay payment signature and activates subscription
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billing } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed — signature mismatch' });
    }

    // Calculate period end
    const now = new Date();
    const periodEnd = new Date(now);
    if (billing === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Update user subscription
    const { updateUserById } = require('../utils/dbConnections');
    const updatedUser = await updateUserById(req.user.id, {
      plan: planId,
      subscription: {
        razorpaySubscriptionId: razorpay_payment_id,
        razorpayCustomerId: null,
        planId,
        status: 'active',
        currentPeriodEnd: periodEnd,
        billing,
      },
      'usage.scansThisMonth': 0,
      'usage.tailorsThisMonth': 0,
      'usage.lastResetDate': now,
    });

    // Replicate updated user to secondary databases
    try { const { replicateUser } = require('../utils/dbConnections'); replicateUser(updatedUser); } catch(e) {}

    res.json({
      success: true,
      message: 'Payment verified and subscription activated!',
      plan: planId,
      billing,
      expiresAt: periodEnd,
    });
  } catch (err) {
    console.error('[payment/verify]', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// ─── GET /api/payment/status ──────────────────────────────────────────────────
// Returns current subscription status for the logged-in user
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('plan subscription usage email');
    const { PLAN_LIMITS, ADMIN_EMAIL, isSubscriptionActive } = require('../middleware/planLimits');
    const plan = user.plan || 'free';
    const isAdmin = user.email === ADMIN_EMAIL || plan === 'admin';
    const planConfig = isAdmin ? PLAN_LIMITS.admin : (PLAN_LIMITS[plan] || PLAN_LIMITS.free);
    const subscriptionActive = isSubscriptionActive(user);

    res.json({
      success: true,
      plan,
      isAdmin,
      subscriptionActive,
      subscription: user.subscription,
      usage: user.usage || { scansThisMonth: 0, tailorsThisMonth: 0, coverLettersThisMonth: 0 },
      limits: {
        scansPerMonth: isAdmin ? 'Unlimited' : planConfig.scansPerMonth,
        tailorsPerMonth: isAdmin ? 'Unlimited' : planConfig.tailorsPerMonth,
        coverLettersPerMonth: isAdmin ? 'Unlimited' : planConfig.coverLettersPerMonth,
        maxTemplates: planConfig.maxTemplates,
        templateTiers: planConfig.templateTier,
        features: planConfig.features,
      },
      remaining: {
        scans: isAdmin ? 'Unlimited' : Math.max(0, planConfig.scansPerMonth - (user.usage?.scansThisMonth || 0)),
        tailors: isAdmin ? 'Unlimited' : Math.max(0, planConfig.tailorsPerMonth - (user.usage?.tailorsThisMonth || 0)),
        coverLetters: isAdmin ? 'Unlimited' : Math.max(0, planConfig.coverLettersPerMonth - (user.usage?.coverLettersThisMonth || 0)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch subscription status' });
  }
});

// ─── POST /api/payment/cancel ─────────────────────────────────────────────────
router.post('/cancel', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      'subscription.status': 'cancelled',
    });
    res.json({ success: true, message: 'Subscription cancelled. Access continues until period end.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not cancel subscription' });
  }
});

module.exports = router;
