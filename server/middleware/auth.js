// server/middleware/auth.js
// JWT authentication — searches user across ALL databases

const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || req.headers['x-access-token'];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Search across all databases for the user
    const { findUserById } = require('../utils/dbConnections');
    const result = await findUserById(decoded.id);

    if (!result) {
      return res.status(401).json({ error: 'User not found. Token invalid.' });
    }

    req.user = result.user;
    req.userDbNum = result.dbNum; // Track which DB this user is in
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth;
