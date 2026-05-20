// server/models/Resume.js

const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },
  filename: { type: String, required: true },
  filepath: { type: String },

  // ✅ ADDED: store parsed text so /modify can read it without re-parsing the PDF
  resumeText: { type: String, default: '' },

  atsScore: { type: Number, min: 0, max: 100 },
  skills:   [{ type: String }],

  // Full analysis object from atsAnalyzer
  analysis: { type: mongoose.Schema.Types.Mixed },

  // Top 10 jobs stored for history view
  jobs: [{ type: mongoose.Schema.Types.Mixed }],

}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
