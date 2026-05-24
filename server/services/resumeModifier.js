// server/services/resumeModifier.js
// Elite ATS Resume Tailoring — preserves truth, maximizes ATS score
// Uses Groq (Llama 3.3 70B) API

const axios = require('axios');

/**
 * Tailor a resume to match a specific job description
 * 
 * RULES:
 * - NEVER invent projects, companies, skills, achievements, or metrics
 * - NEVER create fake numbers or percentages
 * - NEVER change dates or education facts
 * - ONLY improve wording, structure, formatting, and keyword alignment
 * - Preserve ALL factual information from the original resume
 * - If no metrics exist in original, improve clarity and impact WITHOUT inventing metrics
 */
async function modifyResumeForJob(resumeText, jobTitle, jobDescription, missingSkills = []) {
  if (!process.env.XAI_API_KEY) {
    throw new Error('XAI_API_KEY not set in .env');
  }

  const prompt = `You are an elite ATS Resume Analyzer and Resume Tailoring Assistant used by recruiters, resume writers, and hiring platforms.

YOUR TASK: Analyze the candidate's resume against the job description and produce an optimized, ATS-friendly version.

=== ABSOLUTE RULES (NEVER BREAK THESE) ===
1. NEVER invent projects that don't exist in the original resume
2. NEVER invent companies or roles
3. NEVER invent skills the candidate doesn't have
4. NEVER invent achievements or create fake metrics
5. NEVER change dates or education facts
6. NEVER add percentages or numbers that aren't in the original
7. PRESERVE all factual information exactly as-is
8. ONLY improve wording, structure, formatting, and ATS keyword alignment

=== BULLET ENHANCEMENT RULES ===
If the original has metrics, keep them and improve the wording:
  Original: "Reduced load time by 30%"
  Improved: "Optimized application performance, reducing page load time by 30% through code splitting and lazy loading"

If the original has NO metrics, improve clarity WITHOUT inventing numbers:
  Original: "Worked on frontend"
  Improved: "Developed responsive frontend components using React, improving user interface consistency and cross-browser compatibility"
  
  WRONG (inventing metrics): "Developed frontend reducing load time by 25%" ← DO NOT DO THIS

=== ATS OPTIMIZATION RULES ===
- Match keywords from the JD naturally in context
- Use standard section titles: SUMMARY, SKILLS, EXPERIENCE, PROJECTS, EDUCATION, CERTIFICATIONS
- Use bullet points with action verbs
- Convert weak bullets into: [Action Verb] + [Task/Context] + [Impact/Result]
- Use strong action verbs: Developed, Architected, Implemented, Optimized, Designed, Led, Deployed
- Include both acronym and full term where natural: "Amazon Web Services (AWS)"
- Prioritize hard skills from the JD
- Keep content human-readable, avoid keyword stuffing

=== TARGET JOB ===
Title: ${jobTitle}
Description: ${jobDescription.slice(0, 2500)}

=== CANDIDATE'S CURRENT RESUME (from uploaded PDF) ===
${resumeText.slice(0, 4000)}

=== KEYWORDS MISSING FROM RESUME (found in JD) ===
${missingSkills.join(', ') || 'None identified'}

=== YOUR OUTPUT ===
Produce a tailored version that:
1. Rewrites the professional summary to align with the target role (using ONLY facts from the resume)
2. Suggests skills to highlight (only skills the candidate actually has or closely related ones)
3. Improves experience bullets (better wording, NOT fake metrics)
4. Identifies which JD keywords can be naturally incorporated

Return ONLY valid JSON:
{
  "professionalSummary": "Rewritten 3-4 sentence summary using ONLY facts from the resume, aligned to target role",
  "skillsToAdd": ["skills from JD that the candidate likely has based on their experience"],
  "skillCategories": {
    "Languages": ["from resume"],
    "Frameworks": ["from resume"],
    "Cloud & DevOps": ["from resume"],
    "Tools": ["from resume"],
    "Methodologies": ["from resume"]
  },
  "experienceBullets": [
    {
      "context": "Role/Company from their actual resume",
      "original": "The actual original bullet from their resume",
      "improved": "Better wording with action verb + context + impact (NO invented metrics)"
    }
  ],
  "changes": ["Description of each improvement made"],
  "atsImprovementEstimate": 12,
  "keywordsInjected": ["JD keywords naturally incorporated"],
  "atsConstraintsApplied": ["What was optimized"]
}`;

  try {
    const { callGroq } = require('../utils/groqClient');
    const data = await callGroq({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an elite ATS resume optimization expert. You NEVER invent facts, metrics, projects, or companies. You ONLY improve wording and keyword alignment using the candidate\'s actual data. Return ONLY valid JSON, no markdown fences.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2500,
      temperature: 0.5,
    }, 45000);

    const raw = data.choices?.[0]?.message?.content || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return {
      professionalSummary:    result.professionalSummary    || '',
      skillsToAdd:            result.skillsToAdd            || [],
      skillCategories:        result.skillCategories         || {},
      experienceBullets:      result.experienceBullets      || [],
      changes:                result.changes                || [],
      atsImprovementEstimate: result.atsImprovementEstimate || 0,
      keywordsInjected:       result.keywordsInjected       || [],
      atsConstraintsApplied:  result.atsConstraintsApplied  || [],
    };
  } catch (err) {
    if (err.response?.status === 429) {
      const retryAfter = err.response?.headers?.['retry-after'];
      const minutes = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 'a few';
      throw new Error(`AI service rate limit reached. Please try again in ${minutes} minutes.`);
    }
    if (err.response) {
      console.error('[resumeModifier] API error:', err.response.status, JSON.stringify(err.response.data));
    } else {
      console.error('[resumeModifier]', err.message);
    }
    throw new Error('Resume modification failed: ' + (err.response?.data?.error?.message || err.message));
  }
}

module.exports = { modifyResumeForJob };
