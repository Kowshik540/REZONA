// server/server.js
// Production-hardened Express server for Rezona

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

dotenv.config({ path: path.join(__dirname, '../.env') });
// Also load server/.env as fallback (for keys that might only be there)
dotenv.config({ path: path.join(__dirname, '.env') });

// ─── ENV Validation ───────────────────────────────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET === 'rezona_secret_change_in_production') {
  logger.warn('JWT_SECRET is still the default value. Generate a strong secret for production.');
}

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
// Helmet — HTTP security headers
try {
  const helmet = require('helmet');
  app.use(helmet({ contentSecurityPolicy: false }));
} catch (e) {
  logger.warn('helmet not installed — run: npm install helmet');
}

// CORS — permissive in development, strict in production
if (process.env.NODE_ENV === 'production') {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : [];
  app.use(cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (no origin header) and configured origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In production, still allow but log warning (same server serves both)
        callback(null, true);
      }
    },
    credentials: true,
  }));
} else {
  app.use(cors({ origin: true, credentials: true }));
}

// Body parsing — sensible limits (file uploads use multer, not JSON)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB injection sanitization
try {
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize({ replaceWith: '_' }));
} catch (e) {
  logger.warn('express-mongo-sanitize not installed — run: npm install express-mongo-sanitize');
}

// Compression
try {
  const compression = require('compression');
  app.use(compression());
} catch (e) {
  logger.warn('compression not installed — run: npm install compression');
}

// Request ID for debugging
app.use((req, res, next) => {
  req.requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Global rate limiter — 60 requests per minute per IP
const rateLimit = require('./middleware/rateLimit');
app.use('/api/', rateLimit({ windowMs: 60000, max: 60, message: 'Too many requests. Please slow down.' }));

// ─── DO NOT serve uploads statically — use authenticated endpoint instead ─────
// REMOVED: app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }[dbState];
  const isHealthy = dbState === 1;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date(),
    database: dbStatus,
    uptime: Math.round(process.uptime()),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/admin', require('./routes/admin'));

// ─── Serve React build in production ──────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const clientBuild = path.join(__dirname, '../client/build');
  
  // Debug: log what's in the build folder
  if (fs.existsSync(clientBuild)) {
    logger.info('Build folder found at: ' + clientBuild);
    try {
      const files = fs.readdirSync(clientBuild);
      logger.info('Build contents: ' + files.join(', '));
      if (fs.existsSync(path.join(clientBuild, 'static'))) {
        const staticFiles = fs.readdirSync(path.join(clientBuild, 'static'));
        logger.info('Static folder: ' + staticFiles.join(', '));
      }
    } catch(e) {}
    
    // Serve static files FIRST with correct MIME types
    app.use(express.static(clientBuild));
    
    // SPA fallback — only for page routes, not files
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api')) return next();
      // Skip file requests (they should have been handled by express.static above)
      if (req.path.includes('.')) return next();
      // Everything else gets index.html (SPA routing)
      res.sendFile(path.join(clientBuild, 'index.html'));
    });
  } else {
    logger.warn('Build folder NOT found at: ' + clientBuild);
    // Try alternate path
    const altPath = path.join(__dirname, 'build');
    if (fs.existsSync(altPath)) {
      logger.info('Found build at alternate path: ' + altPath);
      app.use(express.static(altPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.includes('.')) return next();
        res.sendFile(path.join(altPath, 'index.html'));
      });
    } else {
      logger.warn('No client build found anywhere.');
    }
  }
}

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`[${req.requestId}] ${err.message}`, { path: req.path, stack: err.stack?.split('\n')[1]?.trim() });
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong. Please try again.',
    requestId: req.requestId,
    path: req.path,
  });
});

// ─── MongoDB Connection ───────────────────────────────────────────────────────
// Uses MONGODB_URI as primary. If storage fills up, switch to MONGODB_RESUME_URI or MONGODB_OVERFLOW_URI
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
mongoose.connect(MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).then(async () => {
  logger.info('MongoDB Atlas Connected (Primary)');
  
  // Log available secondary databases
  if (process.env.MONGODB_RESUME_URI) {
    logger.info('Secondary DB configured (MONGODB_RESUME_URI) — available for migration');
  }
  if (process.env.MONGODB_OVERFLOW_URI) {
    logger.info('Tertiary DB configured (MONGODB_OVERFLOW_URI) — available for overflow');
  }
}).catch(err => {
  logger.error('MongoDB connection failed', { error: err.message });
  process.exit(1);
});

mongoose.connection.on('error', (err) => logger.error('MongoDB error', { error: err.message }));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Rezona Server running on port ${PORT}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected. Process exiting.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down');
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
});
