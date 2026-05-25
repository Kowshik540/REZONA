// server/utils/dbConnections.js
// Multi-database connection manager
// Primary DB: Users & Auth | Secondary DB: Resumes & Analysis | Tertiary: Overflow
// This distributes storage across multiple free-tier MongoDB Atlas clusters (512MB each)

const mongoose = require('mongoose');
const logger = require('./logger');

let resumeConnection = null;
let overflowConnection = null;

/**
 * Initialize secondary database connections
 * Called once during server startup
 */
async function initSecondaryDatabases() {
  const resumeUri = process.env.MONGODB_RESUME_URI;
  const overflowUri = process.env.MONGODB_OVERFLOW_URI;

  // Connect to Resume DB
  if (resumeUri) {
    try {
      resumeConnection = await mongoose.createConnection(resumeUri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }).asPromise();
      logger.info('Resume DB connected (secondary cluster)');
    } catch (err) {
      logger.warn('Resume DB connection failed, using primary DB for resumes: ' + err.message);
      resumeConnection = null;
    }
  }

  // Connect to Overflow DB
  if (overflowUri) {
    try {
      overflowConnection = await mongoose.createConnection(overflowUri, {
        maxPoolSize: 3,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }).asPromise();
      logger.info('Overflow DB connected (tertiary cluster)');
    } catch (err) {
      logger.warn('Overflow DB connection failed: ' + err.message);
      overflowConnection = null;
    }
  }
}

/**
 * Get the resume database connection
 * Falls back to primary mongoose connection if secondary is unavailable
 */
function getResumeConnection() {
  if (resumeConnection && resumeConnection.readyState === 1) {
    return resumeConnection;
  }
  // Fallback to primary
  return mongoose.connection;
}

/**
 * Get the overflow database connection
 * Falls back to resume DB, then primary
 */
function getOverflowConnection() {
  if (overflowConnection && overflowConnection.readyState === 1) {
    return overflowConnection;
  }
  return getResumeConnection();
}

/**
 * Close all secondary connections (for graceful shutdown)
 */
async function closeSecondaryDatabases() {
  if (resumeConnection) {
    await resumeConnection.close();
    logger.info('Resume DB disconnected');
  }
  if (overflowConnection) {
    await overflowConnection.close();
    logger.info('Overflow DB disconnected');
  }
}

module.exports = {
  initSecondaryDatabases,
  getResumeConnection,
  getOverflowConnection,
  closeSecondaryDatabases,
};
