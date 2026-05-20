// server/services/resumeModifier.js
// Uses Claude AI to rewrite resume sections tailored to a specific job description

const axios = require('axios');

/**
 * Auto-modify a resume to match a specific job
 * @param {string} resumeText     - original resume text
 * @param {string} jobTitle       - job title
 * @param {string} jobDescription - full job description
 * @param {string[]} missingSkills - skills in JD not found in resume
 * @returns {object} { professionalSummary, skillsToAdd, experienceBullets, changes, atsImprovementEstimate }
 */
async function modifyResumeForJob(resumeText, jobTitle, jobDescription, missingSkills = []) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY; // read fresh each call so .env reloads work

  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set in .env');
  }

  const prompt = `You are an expert resume writer and ATS optimization specialist.

A candidate has applied for the following job and needs their resume tailored to maximize ATS score and relevance.

=== JOB TITLE ===
${jobTitle}

=== JOB DESCRIPTION ===
${jobDescription.slice(0, 2000)}

=== CANDIDATE'S CURRENT RESUME ===
${resumeText.slice(0, 3000)}

=== MISSING SKILLS IN RESUME (from JD) ===
${missingSkills.join(', ') || 'None identified'}

Your task: Rewrite key resume sections to better match this job. Follow these strict rules:
1. NEVER fabricate experience, companies, degrees, or projects the candidate did not have
2. DO rephrase existing experience using keywords from the job description
3. DO strengthen the professional summary to align with this role
4. DO add any legitimately implied skills (e.g. if they used React, they know JSX/hooks)
5. DO quantify achievements where possible using numbers already present
6. Keep tone professional and ATS-friendly (no tables, no columns, no special chars)

Respond with ONLY a valid JSON object (no markdown, no explanation) in this exact structure:
{
  "professionalSummary": "2-3 sentence rewritten summary targeting this job",
  "skillsToAdd": ["skill1", "skill2"],
  "experienceBullets": [
    {
      "context": "Brief note on which job/project this applies to",
      "original": "original bullet point text",
      "improved": "rewritten bullet using JD keywords and stronger action verbs"
    }
  ],
  "changes": [
    "Short plain-English description of each change made"
  ],
  "atsImprovementEstimate": 15
}`;

  try {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model:      'claude-haiku-4-5-20251001',  // ✅ valid model — fast & cheap for this task
        max_tokens: 1500,
        messages:   [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-api-key':         ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json',
        },
        timeout: 30000,
      }
    );

    const raw   = res.data.content?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return {
      professionalSummary:    result.professionalSummary    || '',
      skillsToAdd:            result.skillsToAdd            || [],
      experienceBullets:      result.experienceBullets      || [],
      changes:                result.changes                || [],
      atsImprovementEstimate: result.atsImprovementEstimate || 0,
    };
  } catch (err) {
    // Log the actual Anthropic error response body for easier debugging
    if (err.response) {
      console.error('[resumeModifier] Anthropic API error:', err.response.status, JSON.stringify(err.response.data));
    } else {
      console.error('[resumeModifier]', err.message);
    }
    throw new Error('Resume modification failed: ' + (err.response?.data?.error?.message || err.message));
  }
}

module.exports = { modifyResumeForJob };