// server/middleware/rateLimit.js
// Simple in-memory rate limiter (use Redis in production)

const rateLimitStore = new Map();

function rateLimit({ windowMs = 60000, max = 30, message = 'Too many requests. Please try again later.' } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    const entry = rateLimitStore.get(key);

    if (now > entry.resetAt) {
      entry.count = 1;
      entry.resetAt = now + windowMs;
      return next();
    }

    entry.count++;

    if (entry.count > max) {
      return res.status(429).json({ error: message });
    }

    next();
  };
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt + 60000) rateLimitStore.delete(key);
  }
}, 300000);

module.exports = rateLimit;
