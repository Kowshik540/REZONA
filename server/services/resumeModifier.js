// server/services/resumeModifier.js
// Elite ATS Resume Tailoring Engine — Maximum optimization while preserving truth

const { callGroq } = require('../utils/groqClient');

async function modifyResumeForJob(resumeText, jobTitle, jobDescription, missingSkills = []) {
  if (!process.env.XAI_API_KEY) {
    throw new Error('XAI_API_KEY not set in .env');
  }

  const prompt = `You are the world's #1 ATS Resume Optimization Engine, used by career coaches at McKinsey, Google, and Goldman Sachs. Your optimized resumes consistently score 85-95 on ATS systems.

=== YOUR MISSION ===
Take this candidate's resume and TRANSFORM it for the target role. Make it so compelling that both ATS algorithms AND human recruiters immediately shortlist it.

=== WHAT YOU MUST DO ===
1. REWRITE the professional summary (4-5 powerful sentences) — weave in exact JD keywords naturally
2. REORGANIZE skills to front-load JD-matching ones
3. TRANSFORM every experience bullet using the STAR method: Situation → Task → Action → Result
4. INJECT exact phrases from the JD into bullets where the candidate has relevant experience
5. ADD implied technical sub-skills (React → React.js, Hooks, Context API, Component Architecture)
6. EXPAND short bullets into rich, detailed achievements (minimum 20 words per bullet)
7. USE power verbs: Spearheaded, Architected, Orchestrated, Pioneered, Streamlined, Accelerated

=== WHAT YOU MUST NEVER DO ===
- NEVER invent companies, roles, or projects that don't exist
- NEVER fabricate metrics/percentages not in the original
- NEVER add skills completely unrelated to their background
- If original has "reduced load time by 30%" → KEEP the 30%
- If original has NO metric → improve wording WITHOUT inventing numbers

=== ADVANCED OPTIMIZATION TECHNIQUES ===
- Mirror the JD's exact terminology (if JD says "cross-functional collaboration" use that exact phrase)
- Front-load each bullet with the most impactful word
- Include industry-standard acronyms with expansions: "CI/CD (Continuous Integration/Continuous Deployment)"
- Group skills by category: Languages | Frameworks | Cloud & DevOps | Databases | Tools
- Ensure keyword density of 2-3% for top 5 JD keywords
- Use present tense for current role, past tense for previous roles

=== TARGET ROLE ===
Title: ${jobTitle}

=== JOB DESCRIPTION (analyze every requirement) ===
${jobDescription.slice(0, 3000)}

=== CANDIDATE'S CURRENT RESUME ===
${resumeText.slice(0, 4000)}

=== MISSING KEYWORDS (from JD, not in resume) ===
${missingSkills.join(', ') || 'None identified'}

=== OUTPUT FORMAT (JSON only) ===
{
  "professionalSummary": "4-5 sentence POWERFUL summary. Start with years of experience + core expertise. Include 3-4 exact JD keywords. End with a value proposition for this specific role.",
  "skillsToAdd": ["skills the candidate likely has based on their tech stack that match the JD"],
  "skillCategories": {
    "Languages": ["from resume, JD-relevant first"],
    "Frameworks & Libraries": ["from resume"],
    "Cloud & DevOps": ["from resume"],
    "Databases": ["from resume"],
    "Tools & Platforms": ["from resume"],
    "Methodologies": ["Agile, Scrum, etc from resume"]
  },
  "experienceBullets": [
    {
      "context": "Role | Company",
      "original": "the actual original bullet",
      "improved": "TRANSFORMED bullet: Power verb + specific task + technology used + impact/scope (20-40 words minimum)"
    }
  ],
  "changes": ["Specific optimization made and why it improves ATS score"],
  "atsImprovementEstimate": 18,
  "keywordsInjected": ["exact JD phrases incorporated into the resume"],
  "atsConstraintsApplied": ["optimization technique applied"]
}`;

  try {
    // Try 8b model first (higher rate limits), fall back to 70b
    let data;
    const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
    let lastErr;
    
    for (const model of models) {
      try {
        data = await callGroq({
          model,
          messages: [
            { role: 'system', content: 'You are the world\'s best ATS resume optimizer. You produce resumes that score 85-95 on ATS systems. You NEVER invent facts but you AGGRESSIVELY optimize wording, structure, and keyword placement. Every bullet you write is rich, detailed, and keyword-dense. Return ONLY valid JSON.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2500,
          temperature: 0.6,
        }, 50000);
        
        if (data.choices?.[0]?.message?.content?.length > 50) break;
        data = null;
      } catch (e) {
        lastErr = e;
        data = null;
        continue;
      }
    }
    
    if (!data) throw lastErr || new Error('AI service unavailable');

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
    console.error('[resumeModifier]', err.message);
    throw new Error(err.message || 'Resume modification failed');
  }
}

module.exports = { modifyResumeForJob };
