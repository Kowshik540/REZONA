// server/services/coverLetterGenerator.js
// AI-powered cover letter generation based on resume + job description

const { callGroq } = require('../utils/groqClient');

async function generateCoverLetter(resumeText, jobTitle, jobDescription, companyName = '', candidateName = '') {
  const prompt = `You are an expert career coach and professional writer. Write a compelling, personalized cover letter.

RULES:
1. Keep it to 3-4 paragraphs (250-350 words)
2. Reference specific skills from the resume that match the job
3. Show enthusiasm for the company and role
4. Include a strong opening hook
5. End with a clear call to action
6. Do NOT fabricate experience — only reference what's in the resume
7. Use professional but warm tone
8. Make it ATS-friendly (no tables, no special formatting)
9. The candidate's name is: ${candidateName || 'the candidate'}. Use their name naturally in the closing.
10. Do NOT include "[Your Name]" placeholder — use the actual name provided.

=== JOB DETAILS ===
Title: ${jobTitle}
Company: ${companyName || 'the company'}
Description: ${jobDescription.slice(0, 1500)}

=== CANDIDATE'S RESUME ===
${resumeText.slice(0, 2500)}

Return ONLY a valid JSON object:
{
  "coverLetter": "The full cover letter text with proper paragraph breaks (use \\n\\n between paragraphs). End with 'Sincerely,\\n${candidateName || 'Candidate'}'",
  "subject": "Suggested email subject line",
  "keyPoints": ["Key selling point 1", "Key selling point 2", "Key selling point 3"]
}`;

  const data = await callGroq({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are an expert cover letter writer. Return ONLY valid JSON, no markdown fences.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1200,
    temperature: 0.7,
  }, 45000);

  const raw = data.choices?.[0]?.message?.content || '{}';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { generateCoverLetter };
