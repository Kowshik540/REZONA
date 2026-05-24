// server/utils/validateObjectId.js
// Middleware to validate MongoDB ObjectId params

const mongoose = require('mongoose');

function validateObjectId(req, res, next) {
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}

module.exports = validateObjectId;
