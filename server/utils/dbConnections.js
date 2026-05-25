// server/utils/dbConnections.js
// Multi-database DISTRIBUTION manager (not replication)
// Each user and their resumes go to ONE database only
// Distribution: round-robin across available databases
// This gives 1.5GB total with NO duplicate data

const mongoose = require('mongoose');
const logger = require('./logger');

let db2 = null; // Secondary connection
let db3 = null; // Tertiary connection

// Models on secondary connections
let UserDb2 = null, ResumeDb2 = null;
let UserDb3 = null, ResumeDb3 = null;

/**
 * Initialize secondary database connections and register models
 */
async function initSecondaryDatabases() {
  const uri2 = process.env.MONGODB_RESUME_URI;
  const uri3 = process.env.MONGODB_OVERFLOW_URI;

  const UserSchema = require('../models/User').schema;
  const ResumeSchema = require('../models/Resume').schema;

  if (uri2) {
    try {
      db2 = mongoose.createConnection(uri2, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });
      await db2.asPromise();
      UserDb2 = db2.model('User', UserSchema);
      ResumeDb2 = db2.model('Resume', ResumeSchema);
      logger.info('DB2 connected — distributing users & resumes');
    } catch (err) {
      logger.warn('DB2 connection failed: ' + err.message);
      db2 = null;
    }
  }

  if (uri3) {
    try {
      db3 = mongoose.createConnection(uri3, {
        maxPoolSize: 3,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });
      await db3.asPromise();
      UserDb3 = db3.model('User', UserSchema);
      ResumeDb3 = db3.model('Resume', ResumeSchema);
      logger.info('DB3 connected — distributing users & resumes');
    } catch (err) {
      logger.warn('DB3 connection failed: ' + err.message);
      db3 = null;
    }
  }
}

// ─── Database Selection Logic ─────────────────────────────────────────────────
// New users are assigned to the least-loaded DB using round-robin
let nextDbIndex = 0;

/**
 * Get the number of available databases (1 = primary only, 2 or 3 with secondaries)
 */
function getDbCount() {
  let count = 1; // primary always available
  if (db2 && db2.readyState === 1) count++;
  if (db3 && db3.readyState === 1) count++;
  return count;
}

/**
 * Pick which database a NEW user should be stored in
 * Returns 1, 2, or 3
 */
function pickDbForNewUser() {
  const count = getDbCount();
  nextDbIndex = (nextDbIndex % count) + 1;
  return nextDbIndex;
}

/**
 * Get User model for a specific database number
 */
function getUserModel(dbNum) {
  if (dbNum === 2 && UserDb2) return UserDb2;
  if (dbNum === 3 && UserDb3) return UserDb3;
  return require('../models/User'); // primary (db1)
}

/**
 * Get Resume model for a specific database number
 */
function getResumeModel(dbNum) {
  if (dbNum === 2 && ResumeDb2) return ResumeDb2;
  if (dbNum === 3 && ResumeDb3) return ResumeDb3;
  return require('../models/Resume'); // primary (db1)
}

// ─── User Operations (search across all DBs) ─────────────────────────────────

/**
 * Find a user by email across ALL databases
 * Returns { user, dbNum } or null
 */
async function findUserByEmail(email) {
  const User = require('../models/User');
  
  // Check primary first
  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) return { user, dbNum: 1 };

  // Check DB2
  if (UserDb2) {
    user = await UserDb2.findOne({ email: email.toLowerCase() });
    if (user) return { user, dbNum: 2 };
  }

  // Check DB3
  if (UserDb3) {
    user = await UserDb3.findOne({ email: email.toLowerCase() });
    if (user) return { user, dbNum: 3 };
  }

  return null;
}

/**
 * Find a user by ID across ALL databases
 * Returns { user, dbNum } or null
 */
async function findUserById(id) {
  const User = require('../models/User');

  let user = await User.findById(id);
  if (user) return { user, dbNum: 1 };

  if (UserDb2) {
    user = await UserDb2.findById(id);
    if (user) return { user, dbNum: 2 };
  }

  if (UserDb3) {
    user = await UserDb3.findById(id);
    if (user) return { user, dbNum: 3 };
  }

  return null;
}

/**
 * Create a new user in the next available database (round-robin)
 * Returns { user, dbNum }
 */
async function createUser(userData) {
  const dbNum = pickDbForNewUser();
  const Model = getUserModel(dbNum);
  const user = new Model(userData);
  await user.save();
  logger.info(`User created in DB${dbNum}: ${userData.email}`);
  return { user, dbNum };
}

/**
 * Update a user by ID (finds which DB they're in, then updates)
 */
async function updateUserById(id, updateData) {
  const User = require('../models/User');

  let user = await User.findByIdAndUpdate(id, updateData, { new: true });
  if (user) return user;

  if (UserDb2) {
    user = await UserDb2.findByIdAndUpdate(id, updateData, { new: true });
    if (user) return user;
  }

  if (UserDb3) {
    user = await UserDb3.findByIdAndUpdate(id, updateData, { new: true });
    if (user) return user;
  }

  return null;
}

// ─── Resume Operations (search across all DBs) ───────────────────────────────

/**
 * Find resumes by userId across ALL databases
 */
async function findResumesByUserId(userId, options = {}) {
  const Resume = require('../models/Resume');
  const { sort, select, limit: lim } = options;

  let query = Resume.find({ userId });
  if (sort) query = query.sort(sort);
  if (select) query = query.select(select);
  if (lim) query = query.limit(lim);
  let results = await query;

  if (ResumeDb2) {
    let q2 = ResumeDb2.find({ userId });
    if (sort) q2 = q2.sort(sort);
    if (select) q2 = q2.select(select);
    if (lim) q2 = q2.limit(lim);
    const r2 = await q2;
    results = results.concat(r2);
  }

  if (ResumeDb3) {
    let q3 = ResumeDb3.find({ userId });
    if (sort) q3 = q3.sort(sort);
    if (select) q3 = q3.select(select);
    if (lim) q3 = q3.limit(lim);
    const r3 = await q3;
    results = results.concat(r3);
  }

  // Sort combined results
  if (sort && sort.createdAt === -1) {
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  if (lim) results = results.slice(0, lim);

  return results;
}

/**
 * Find a single resume by ID and userId across ALL databases
 */
async function findResumeById(id, userId) {
  const Resume = require('../models/Resume');

  let resume = await Resume.findOne({ _id: id, userId });
  if (resume) return { resume, dbNum: 1 };

  if (ResumeDb2) {
    resume = await ResumeDb2.findOne({ _id: id, userId });
    if (resume) return { resume, dbNum: 2 };
  }

  if (ResumeDb3) {
    resume = await ResumeDb3.findOne({ _id: id, userId });
    if (resume) return { resume, dbNum: 3 };
  }

  return null;
}

/**
 * Create a resume in the SAME database as the user
 * Finds which DB the user is in, creates resume there
 */
async function createResume(resumeData) {
  const userId = resumeData.userId;
  const result = await findUserById(userId);
  const dbNum = result ? result.dbNum : 1;
  const Model = getResumeModel(dbNum);
  const resume = await Model.create(resumeData);
  return resume;
}

/**
 * Delete a resume by ID and userId across ALL databases
 */
async function deleteResume(id, userId) {
  const Resume = require('../models/Resume');

  let resume = await Resume.findOne({ _id: id, userId });
  if (resume) { await resume.deleteOne(); return resume; }

  if (ResumeDb2) {
    resume = await ResumeDb2.findOne({ _id: id, userId });
    if (resume) { await resume.deleteOne(); return resume; }
  }

  if (ResumeDb3) {
    resume = await ResumeDb3.findOne({ _id: id, userId });
    if (resume) { await resume.deleteOne(); return resume; }
  }

  return null;
}

/**
 * Update a resume field across all databases (finds it first)
 */
async function updateResume(id, updateData) {
  const Resume = require('../models/Resume');

  let result = await Resume.updateOne({ _id: id }, { $set: updateData });
  if (result.matchedCount > 0) return true;

  if (ResumeDb2) {
    result = await ResumeDb2.updateOne({ _id: id }, { $set: updateData });
    if (result.matchedCount > 0) return true;
  }

  if (ResumeDb3) {
    result = await ResumeDb3.updateOne({ _id: id }, { $set: updateData });
    if (result.matchedCount > 0) return true;
  }

  return false;
}

// ─── Cleanup & Status ─────────────────────────────────────────────────────────

async function closeSecondaryDatabases() {
  if (db2) await db2.close().catch(() => {});
  if (db3) await db3.close().catch(() => {});
  logger.info('Secondary databases closed');
}

function getDbStatus() {
  return {
    primary: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    db2: db2?.readyState === 1 ? 'connected' : 'not connected',
    db3: db3?.readyState === 1 ? 'connected' : 'not connected',
    totalDbs: getDbCount(),
  };
}

module.exports = {
  initSecondaryDatabases,
  closeSecondaryDatabases,
  getDbStatus,
  // User operations
  findUserByEmail,
  findUserById,
  createUser,
  updateUserById,
  getUserModel,
  // Resume operations
  findResumesByUserId,
  findResumeById,
  createResume,
  deleteResume,
  updateResume,
  getResumeModel,
};
