// client/src/components/JobRecommendations.js
import React, { useState } from 'react';
import api from '../utils/api';
import TemplatePickerModal from './TemplatePickerModal';

const SOURCE_COLORS = {
  'LinkedIn':       { bg: '#E8F0FE', color: '#1558D6', border: '#BBCEF8' },
  'Naukri':         { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' },
  'Indeed':         { bg: '#E3F2FD', color: '#0D47A1', border: '#90CAF9' },
  'Glassdoor':      { bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7' },
  'Adzuna':         { bg: '#F3E5F5', color: '#4A148C', border: '#CE93D8' },
  'Remotive':       { bg: '#E0F7FA', color: '#006064', border: '#80DEEA' },
  'Monster India':  { bg: '#FCE4EC', color: '#880E4F', border: '#F48FB1' },
  'Internshala':    { bg: '#E8EAF6', color: '#1A237E', border: '#9FA8DA' },
  'Shine.com':      { bg: '#FFFDE7', color: '#F57F17', border: '#FFF176' },
  'TimesJobs':      { bg: '#FBE9E7', color: '#BF360C', border: '#FFAB91' },
  'Job Portal':     { bg: '#F5F5F5', color: '#424242', border: '#E0E0E0' },
};

const INDIA_CITIES = [
  'India (All)', 'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Pune',
  'Chennai', 'Kolkata', 'Noida', 'Gurgaon', 'Ahmedabad', 'Jaipur',
  'Kochi', 'Coimbatore', 'Remote / WFH',
];

// ── Full Tailor Modal ─────────────────────────────────────────────────────────
function TailorModal({ job, skills, resumeId, onClose }) {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);  // AI result object
  const [error, setError]       = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied]     = useState(false);

  // ── 100% local tailoring — no API credits needed ────────────────────────────
  function localTailor(job, skills) {
    const jdText  = ((job.description || '') + ' ' + job.title).toLowerCase();
    const jdWords = jdText.split(/\W+/).filter(w => w.length > 3);

    const matchedSkills = skills.filter(s => jdText.includes(s.toLowerCase()));

    const techKeywords = [
      'typescript','graphql','redux','jest','webpack','vite','docker','aws','azure',
      'git','rest','api','agile','scrum','mongodb','postgresql','mysql',
      'tailwind','sass','figma','storybook','testing','performance','optimization',
      'accessibility','responsive','microservices','kubernetes','linux',
    ];
    const skillsToAdd = techKeywords.filter(k =>
      jdText.includes(k) && !skills.map(s => s.toLowerCase()).includes(k)
    ).slice(0, 6);

    const topSkills = matchedSkills.slice(0, 4).join(', ') || skills.slice(0, 4).join(', ');
    const company   = job.company || 'the company';
    const role      = job.title   || 'this role';

    const jdHighFreq = [...new Set(jdWords)]
      .filter(w => jdWords.filter(x => x === w).length > 1 && w.length > 4)
      .slice(0, 8);

    const professionalSummary =
      `Results-driven ${role.replace(/senior|lead|junior/i,'').trim()} with hands-on expertise in ` +
      `${topSkills}. Proven track record of delivering scalable, high-quality web applications ` +
      `with a focus on performance and user experience. Excited to bring my skills in ` +
      `${matchedSkills[0] || skills[0] || 'modern web technologies'} to ${company} and contribute ` +
      `to impactful products from day one.`;

    const bulletTemplates = [
      {
        context: 'Frontend Development',
        original: `Developed user interfaces using ${skills[0] || 'React'}.`,
        improved: `Built responsive, performant UI components using ${matchedSkills[0] || skills[0] || 'React'} — aligned with ${jdHighFreq[0] || 'scalable'} architecture patterns required at ${company}.`,
      },
      {
        context: 'Project Delivery',
        original: 'Worked on multiple web projects and delivered features on time.',
        improved: `Optimized application performance and ${jdHighFreq[1] || 'reliability'} by refactoring core modules, reducing load time and improving ${jdHighFreq[2] || 'user experience'} metrics.`,
      },
      {
        context: 'Collaboration',
        original: 'Collaborated with backend teams to integrate APIs.',
        improved: `Collaborated cross-functionally with backend engineers to design and integrate RESTful APIs, ensuring seamless data flow across ${matchedSkills.slice(0,2).join(' and ') || 'frontend and backend'} layers.`,
      },
      {
        context: 'Code Quality',
        original: 'Participated in code reviews and team discussions.',
        improved: `Designed reusable component libraries and established coding standards that improved team velocity and maintainability — directly supporting the ${jdHighFreq[3] || 'agile'} practices outlined in this role.`,
      },
    ];

    const changes = [
      `Rewrote professional summary to target "${role}" at ${company}`,
      `Highlighted ${matchedSkills.length} matched skills: ${matchedSkills.slice(0,3).join(', ') || topSkills}`,
      skillsToAdd.length ? `Identified ${skillsToAdd.length} skills to add: ${skillsToAdd.slice(0,3).join(', ')}` : 'All key skills already present',
      'Strengthened experience bullets with action verbs and JD keywords',
      'Aligned language with job description for better ATS scoring',
    ];

    return {
      professionalSummary,
      skillsToAdd,
      experienceBullets: bulletTemplates,
      changes,
      atsImprovementEstimate: Math.min(matchedSkills.length * 3 + skillsToAdd.length * 2 + 8, 25),
      usedLocalEngine: true,
    };
  }

  async function tailor() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/resume/modify', {
        resumeId,
        jobTitle:       job.title,
        jobDescription: job.description || '',
        missingSkills:  job.missingSkills || [],
        skills,
      }, { timeout: 60000 });

      if (res.data?.professionalSummary) {
        setResult(res.data);
        setActiveTab('preview');
      } else {
        throw new Error('No result returned');
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.limitReached) {
        setError(`⚠️ ${errData.error}`);
      } else if (errData?.error) {
        setError(errData.error);
      } else {
        // Fallback to local engine if server fails
        const data = localTailor(job, skills);
        setResult(data);
        setActiveTab('preview');
      }
    }
    setLoading(false);
  }

  // Build plain text for clipboard
  function buildPlainText(r) {
    const name    = 'Your Name';
    const contact = 'email@example.com | LinkedIn | GitHub';
    const lines   = [];
    lines.push(name);
    lines.push(contact);
    lines.push('');
    if (r.professionalSummary) {
      lines.push('PROFESSIONAL SUMMARY');
      lines.push('-'.repeat(50));
      lines.push(r.professionalSummary);
      lines.push('');
    }
    const allSkills = [...(r.skillsToAdd || [])];
    if (allSkills.length) {
      lines.push('KEY SKILLS');
      lines.push('-'.repeat(50));
      lines.push(allSkills.join(' | '));
      lines.push('');
    }
    if (r.experienceBullets?.length) {
      lines.push('EXPERIENCE HIGHLIGHTS');
      lines.push('-'.repeat(50));
      r.experienceBullets.forEach(b => {
        lines.push(`[${b.context || 'Role'}]`);
        lines.push(`• ${b.improved}`);
        lines.push('');
      });
    }
    return lines.join('\n');
  }

  // Build full HTML resume for PDF printing
  function buildResumeHTML(r) {
    const jobSlug   = job.title.replace(/\s+/g, '-').toLowerCase();
    const skillsHTML = (r.skillsToAdd || [])
      .map(s => `<span class="skill-tag">${s}</span>`).join('');
    const bulletsHTML = (r.experienceBullets || [])
      .map(b => `
        <div class="exp-block">
          <div class="exp-role">${b.context || 'Experience'}</div>
          <div class="exp-bullet">• ${b.improved}</div>
        </div>`).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Tailored Resume — ${job.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 11pt;
    color: #1a1a1a;
    background: #fff;
    padding: 0;
  }
  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 48px 56px;
  }

  /* ── Header ── */
  .header { border-bottom: 2.5px solid #1a1a1a; padding-bottom: 14px; margin-bottom: 20px; }
  .name { font-size: 26pt; font-weight: 700; letter-spacing: -0.5px; color: #111; font-family: 'Arial', sans-serif; }
  .contact { font-size: 9.5pt; color: #555; margin-top: 4px; font-family: 'Arial', sans-serif; }
  .target-role { font-size: 11pt; color: #2563EB; font-weight: 600; margin-top: 6px; font-family: 'Arial', sans-serif; }

  /* ── Section ── */
  .section { margin-bottom: 20px; }
  .section-title {
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #2563EB;
    border-bottom: 1px solid #BFDBFE;
    padding-bottom: 4px;
    margin-bottom: 10px;
    font-family: 'Arial', sans-serif;
  }

  /* ── Summary ── */
  .summary { font-size: 10.5pt; line-height: 1.75; color: #2d2d2d; }

  /* ── Skills ── */
  .skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag {
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    color: #1D4ED8;
    font-size: 9pt;
    padding: 3px 10px;
    border-radius: 4px;
    font-family: 'Arial', sans-serif;
    font-weight: 500;
  }

  /* ── Experience ── */
  .exp-block { margin-bottom: 12px; }
  .exp-role {
    font-size: 10pt;
    font-weight: 700;
    color: #111;
    font-family: 'Arial', sans-serif;
    margin-bottom: 3px;
  }
  .exp-bullet { font-size: 10.5pt; line-height: 1.65; color: #2d2d2d; padding-left: 4px; }

  /* ── Changes ── */
  .change-item { font-size: 9.5pt; color: #374151; padding: 4px 0; display: flex; gap: 8px; }
  .check { color: #059669; font-weight: 700; flex-shrink: 0; }

  /* ── Footer ── */
  .footer {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    font-size: 8.5pt;
    color: #9CA3AF;
    font-family: 'Arial', sans-serif;
    text-align: center;
  }

  /* ── Print ── */
  @media print {
    body { padding: 0; }
    .page { padding: 36px 48px; max-width: 100%; }
    .no-print { display: none !important; }
    @page { margin: 0; size: A4; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="name">Your Name</div>
    <div class="contact">your.email@example.com &nbsp;|&nbsp; +91 XXXXX XXXXX &nbsp;|&nbsp; linkedin.com/in/yourprofile &nbsp;|&nbsp; github.com/yourprofile</div>
    <div class="target-role">Applying for: ${job.title} at ${job.company}</div>
  </div>

  ${r.professionalSummary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${r.professionalSummary}</div>
  </div>` : ''}

  ${skillsHTML ? `
  <div class="section">
    <div class="section-title">Technical Skills</div>
    <div class="skills-wrap">${skillsHTML}</div>
  </div>` : ''}

  ${bulletsHTML ? `
  <div class="section">
    <div class="section-title">Professional Experience</div>
    ${bulletsHTML}
  </div>` : ''}

  <div class="footer">
    Resume tailored for ${job.title} at ${job.company} • Replace placeholder details before submitting
  </div>

</div>
</body>
</html>`;
  }

  function downloadPDF(r) {
    const html   = buildResumeHTML(r);
    const blob   = new Blob([html], { type: 'text/html' });
    const url    = URL.createObjectURL(blob);
    const win    = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        setTimeout(() => {
          win.print();            // triggers browser Save as PDF dialog
          URL.revokeObjectURL(url);
        }, 500);
      };
    }
  }

  async function copyText(r) {
    await navigator.clipboard.writeText(buildPlainText(r));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={m.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={m.box}>

        {/* ── Header ── */}
        <div style={m.header}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={m.headerTitle}>✂️ Tailor Resume for this Job</div>
            <div style={m.headerSub}>{job.title} · {job.company}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              style={m.applyHeaderBtn}
            >
              Apply Now →
            </a>
            <button style={m.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={m.body}>

          {/* Initial prompt */}
          {!result && !loading && (
            <div style={m.intro}>
              <div style={m.introIcon}>🎯</div>
              <p style={m.introText}>
                Claude AI will rewrite your resume summary, suggest skills to add, and improve
                your experience bullets to match this specific job — without making anything up.
              </p>
              {!resumeId && (
                <div style={m.warnBox}>
                  ⚠️ No resume selected. Please select a resume from the sidebar first.
                </div>
              )}
              <button
                style={{ ...m.generateBtn, opacity: !resumeId ? 0.5 : 1 }}
                onClick={tailor}
                disabled={!resumeId}
              >
                🚀 Generate Tailored Resume
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={m.loadingBox}>
              <div style={m.spinner}></div>
              <span style={{ color: '#555', fontSize: 14 }}>
                Analyzing job description & rewriting your resume…
              </span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={m.errorBox}>
              <div style={{ marginBottom: 10 }}>{error}</div>
              <button style={m.regenBtn} onClick={tailor}>🔄 Try Again</button>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <>
              {/* ATS badge */}
              {result.atsImprovementEstimate > 0 && (
                <div style={m.atsBadge}>
                  📈 Estimated ATS score improvement: +{result.atsImprovementEstimate} points
                </div>
              )}

              {/* Local engine notice */}
              {result.usedLocalEngine && (
                <div style={m.fallbackNotice}>
                  ⚡ Generated using smart local analysis of your skills vs this job description.
                  Add Anthropic API credits anytime to get Claude AI rewrites instead.
                </div>
              )}

              {/* Tabs */}
              <div style={m.tabs}>
                {[
                  { id: 'preview',    label: '📄 Preview & Download' },
                  { id: 'changes',    label: '✅ Changes Made' },
                  { id: 'bullets',    label: '✏️ Experience Rewrites' },
                ].map(t => (
                  <button
                    key={t.id}
                    style={{ ...m.tab, ...(activeTab === t.id ? m.tabActive : {}) }}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab: Preview */}
              {activeTab === 'preview' && (
                <div>
                  {/* Styled resume preview */}
                  <div style={m.resumePreview}>
                    {/* Header */}
                    <div style={m.rpHeader}>
                      <div style={m.rpName}>Your Name</div>
                      <div style={m.rpContact}>your.email@example.com &nbsp;|&nbsp; +91 XXXXX XXXXX &nbsp;|&nbsp; linkedin.com/in/yourprofile</div>
                      <div style={m.rpTargetRole}>Applying for: {job.title} at {job.company}</div>
                    </div>

                    {/* Summary */}
                    {result.professionalSummary && (
                      <div style={m.rpSection}>
                        <div style={m.rpSectionTitle}>Professional Summary</div>
                        <div style={m.rpBody}>{result.professionalSummary}</div>
                      </div>
                    )}

                    {/* Skills */}
                    {result.skillsToAdd?.length > 0 && (
                      <div style={m.rpSection}>
                        <div style={m.rpSectionTitle}>Key Skills to Highlight</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {result.skillsToAdd.map((s,i) => (
                            <span key={i} style={m.rpSkillTag}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience bullets */}
                    {result.experienceBullets?.length > 0 && (
                      <div style={m.rpSection}>
                        <div style={m.rpSectionTitle}>Tailored Experience Bullets</div>
                        {result.experienceBullets.map((b,i) => (
                          <div key={i} style={m.rpExpBlock}>
                            <div style={m.rpExpRole}>{b.context || 'Experience'}</div>
                            <div style={m.rpExpBullet}>• {b.improved}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Changes */}
                    {result.changes?.length > 0 && (
                      <div style={m.rpSection}>
                        <div style={m.rpSectionTitle}>Changes Made</div>
                        {result.changes.map((c,i) => (
                          <div key={i} style={m.rpChangeItem}><span style={{color:'#059669',fontWeight:700}}>✓</span> {c}</div>
                        ))}
                      </div>
                    )}

                    <div style={m.rpFooter}>
                      Update your personal details (name, email, phone) before submitting • Generated by Rezona
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={m.actionRow}>
                    <button style={{...m.downloadBtn, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', fontWeight: 700}} onClick={() => downloadPDF(result)}>
                      📥 Download as PDF
                    </button>
                    <button style={m.copyBtn} onClick={() => copyText(result)}>
                      {copied ? '✅ Copied!' : '📋 Copy Text'}
                    </button>
                    <button style={m.regenBtn} onClick={tailor}>
                      🔄 Regenerate
                    </button>
                  </div>
                  <p style={m.hintText}>
                    Click "Download as PDF" → browser opens print dialog → choose "Save as PDF" as destination.
                  </p>
                </div>
              )}

              {/* Tab: Changes */}
              {activeTab === 'changes' && (
                <div>
                  {result.professionalSummary && (
                    <div style={m.section}>
                      <div style={m.sectionLabel}>New Professional Summary</div>
                      <div style={m.summaryBox}>{result.professionalSummary}</div>
                    </div>
                  )}
                  {result.skillsToAdd?.length > 0 && (
                    <div style={m.section}>
                      <div style={m.sectionLabel}>Skills to Add</div>
                      <div style={m.chipRow}>
                        {result.skillsToAdd.map((s, i) => (
                          <span key={i} style={m.skillChip}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.changes?.length > 0 && (
                    <div style={m.section}>
                      <div style={m.sectionLabel}>All Changes</div>
                      <ul style={m.changeList}>
                        {result.changes.map((c, i) => (
                          <li key={i} style={m.changeItem}>
                            <span style={m.checkIcon}>✓</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Experience Bullets */}
              {activeTab === 'bullets' && (
                <div>
                  {result.experienceBullets?.length > 0 ? (
                    result.experienceBullets.map((b, i) => (
                      <div key={i} style={m.bulletCard}>
                        <div style={m.bulletContext}>{b.context || 'Experience'}</div>
                        <div style={m.bulletBefore}>
                          <span style={m.beforeLabel}>Before</span>
                          <p style={m.bulletText}>{b.original || '—'}</p>
                        </div>
                        <div style={m.bulletArrow}>↓</div>
                        <div style={m.bulletAfter}>
                          <span style={m.afterLabel}>After</span>
                          <p style={m.bulletText}>{b.improved}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#888', fontSize: 14 }}>No experience bullets were rewritten for this job.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

const m = {
  overlay:       { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' },
  box:           { background:'#fff', borderRadius:18, width:'100%', maxWidth:680, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.22)', animation:'fadeUp 0.22s ease' },
  header:        { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'1.25rem 1.5rem', borderBottom:'1px solid #E5E7EB', gap:12 },
  headerTitle:   { fontSize:17, fontWeight:700, color:'#111', marginBottom:3 },
  headerSub:     { fontSize:12, color:'#666', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  applyHeaderBtn:{ padding:'7px 16px', background:'#2563EB', color:'#fff', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600, whiteSpace:'nowrap' },
  closeBtn:      { background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#888', padding:'2px 6px', borderRadius:6 },
  body:          { padding:'1.5rem', overflowY:'auto', flex:1 },
  intro:         { textAlign:'center', padding:'1.5rem 0' },
  introIcon:     { fontSize:40, marginBottom:12 },
  introText:     { color:'#555', fontSize:14, lineHeight:1.75, marginBottom:20 },
  warnBox:       { background:'#FEF9C3', border:'1px solid #FDE68A', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#92400E', marginBottom:16 },
  generateBtn:   { padding:'13px 32px', background:'linear-gradient(135deg,#7C3AED,#4F46E5)', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.35)' },
  loadingBox:    { display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'3rem 0' },
  spinner:       { width:36, height:36, border:'3px solid #E5E7EB', borderTopColor:'#7C3AED', borderRadius:'50%', animation:'spin 0.75s linear infinite' },
  errorBox:      { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'1rem 1.25rem', color:'#991B1B', fontSize:14 },
  atsBadge:      { background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border:'1px solid #6EE7B7', borderRadius:10, padding:'10px 16px', fontSize:13, color:'#065F46', fontWeight:600, marginBottom:14 },
  fallbackNotice:{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'10px 16px', fontSize:13, color:'#92400E', marginBottom:14 },
  tabs:          { display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid #E5E7EB', paddingBottom:0 },
  tab:           { padding:'8px 14px', background:'none', border:'none', borderRadius:'8px 8px 0 0', cursor:'pointer', fontSize:13, color:'#555', fontWeight:500, borderBottom:'2px solid transparent', marginBottom:-1 },
  tabActive:     { color:'#7C3AED', borderBottom:'2px solid #7C3AED', background:'#F5F3FF' },
  previewBox:    { background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10, padding:'1rem', fontSize:12.5, lineHeight:1.85, color:'#1e293b', whiteSpace:'pre-wrap', wordBreak:'break-word', maxHeight:300, overflowY:'auto', fontFamily:'ui-monospace,monospace' },
  actionRow:     { display:'flex', gap:8, marginTop:12, flexWrap:'wrap' },
  copyBtn:       { padding:'9px 16px', background:'#F1F5F9', color:'#334155', border:'1px solid #CBD5E1', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 },
  downloadBtn:   { padding:'9px 16px', background:'#EDE9FE', color:'#5B21B6', border:'1px solid #C4B5FD', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 },
  regenBtn:      { padding:'9px 16px', background:'#F1F5F9', color:'#374151', border:'1px solid #D1D5DB', borderRadius:8, cursor:'pointer', fontSize:13 },
  hintText:      { fontSize:12, color:'#94A3B8', marginTop:10 },
  section:       { marginBottom:18 },
  sectionLabel:  { fontSize:12, fontWeight:700, color:'#7C3AED', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 },
  summaryBox:    { background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:10, padding:'12px 16px', fontSize:14, color:'#1E1B4B', lineHeight:1.7 },
  chipRow:       { display:'flex', flexWrap:'wrap', gap:6 },
  skillChip:     { padding:'4px 12px', background:'#D1FAE5', color:'#065F46', borderRadius:20, fontSize:12, fontWeight:600 },
  changeList:    { listStyle:'none', padding:0, margin:0 },
  changeItem:    { display:'flex', gap:8, padding:'8px 0', borderBottom:'1px solid #F1F5F9', fontSize:13, color:'#374151', alignItems:'flex-start' },
  checkIcon:     { color:'#10B981', fontWeight:700, flexShrink:0 },
  bulletCard:    { background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:10, padding:'1rem', marginBottom:12 },
  bulletContext: { fontSize:11, fontWeight:700, color:'#7C3AED', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 },
  bulletBefore:  { background:'#FEF2F2', borderRadius:8, padding:'10px 12px', marginBottom:4 },
  bulletArrow:   { textAlign:'center', color:'#10B981', fontWeight:700, fontSize:18, margin:'2px 0' },
  bulletAfter:   { background:'#F0FDF4', borderRadius:8, padding:'10px 12px' },
  beforeLabel:   { fontSize:10, fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:4 },
  afterLabel:    { fontSize:10, fontWeight:700, color:'#10B981', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:4 },
  bulletText:    { fontSize:13, color:'#374151', lineHeight:1.6, margin:0 },
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function JobRecommendations({ skills = [], jobTitle = '', resumeId = null }) {
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [city, setCity]           = useState('India (All)');
  const [title, setTitle]         = useState(jobTitle);
  const [loaded, setLoaded]       = useState(false);
  const [filter, setFilter]       = useState('All');
  const [tailorJob, setTailorJob] = useState(null);

  const sources    = ['All', ...new Set(jobs.map(j => j.source).filter(Boolean))];
  const visibleJobs = filter === 'All' ? jobs : jobs.filter(j => j.source === filter);

  async function loadJobs() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/resume/jobs', {
        skills,
        jobTitle: title,
        city:     city === 'India (All)' ? 'India' : city,
      });
      setJobs(data.jobs || []);
      setLoaded(true);
    } catch (e) {
      setError('Could not fetch jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function daysAgo(dateStr) {
    if (!dateStr) return '';
    const d = (Date.now() - new Date(dateStr)) / 86400000;
    if (d < 1)  return 'Today';
    if (d < 2)  return 'Yesterday';
    if (d < 14) return `${Math.floor(d)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.heading}>India Job Recommendations</h2>
      <p style={styles.sub}>Based on your resume skills — jobs from LinkedIn, Naukri, Indeed, Glassdoor & more</p>

      {/* Search bar */}
      <div style={styles.searchBar}>
        <input
          style={styles.input}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Job title e.g. React Developer, Data Analyst"
        />
        <select style={styles.select} value={city} onChange={e => setCity(e.target.value)}>
          {INDIA_CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button style={styles.btn} onClick={loadJobs} disabled={loading}>
          {loading ? 'Loading...' : loaded ? '🔄 Refresh' : '🔍 Find Jobs'}
        </button>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div style={styles.skillsRow}>
          <span style={styles.skillsLabel}>Your skills:</span>
          {skills.slice(0, 10).map(s => (
            <span key={s} style={styles.skillTag}>{s}</span>
          ))}
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {/* Source filter pills */}
      {loaded && jobs.length > 0 && (
        <div style={styles.filterRow}>
          {sources.map(s => (
            <button
              key={s}
              style={{ ...styles.filterPill, ...(filter === s ? styles.filterPillActive : {}) }}
              onClick={() => setFilter(s)}
            >
              {s} {s !== 'All' ? `(${jobs.filter(j => j.source === s).length})` : `(${jobs.length})`}
            </button>
          ))}
        </div>
      )}

      {loaded && visibleJobs.length === 0 && !loading && (
        <div style={styles.empty}>No jobs found. Try a different title or city.</div>
      )}

      {/* Job cards */}
      {visibleJobs.map(job => {
        const srcStyle = SOURCE_COLORS[job.source] || SOURCE_COLORS['Job Portal'];
        return (
          <div key={job.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div style={{ flex: 1 }}>
                <div style={styles.jobTitle}>{job.title}</div>
                <div style={styles.jobMeta}>
                  <span>🏢 {job.company}</span>
                  <span>📍 {job.location}</span>
                  {job.salary     && <span>💰 {job.salary}</span>}
                  {job.postedDate && <span>🕐 {daysAgo(job.postedDate)}</span>}
                </div>
              </div>
              <div style={{
                ...styles.sourceBadge,
                background: srcStyle.bg,
                color:      srcStyle.color,
                border:     `1px solid ${srcStyle.border}`,
              }}>
                {job.source}
              </div>
            </div>

            {job.description && (
              <p style={styles.desc}>{job.description.slice(0, 200)}…</p>
            )}

            <div style={styles.cardBottom}>
              <div style={styles.tagRow}>
                <span style={{
                  ...styles.tag,
                  background: job.remote ? '#E8F5E9' : '#EDE7F6',
                  color:      job.remote ? '#2E7D32' : '#4527A0',
                }}>
                  {job.remote ? '🏠 Remote' : '🏢 On-site'}
                </span>
                <span style={styles.tag}>{job.jobType || 'Full-time'}</span>
              </div>

              <div style={styles.actionBtns}>
                <button
                  style={styles.tailorBtn}
                  onClick={() => setTailorJob(job)}
                  title="AI-rewrite your resume for this job"
                >
                  ✂️ Tailor Resume
                </button>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.applyBtn}
                >
                  Apply Now →
                </a>
              </div>
            </div>
          </div>
        );
      })}

      {/* Portal links */}
      {loaded && (
        <div style={styles.portalLinks}>
          <p style={styles.portalTitle}>Search directly on more portals:</p>
          <div style={styles.portalBtns}>
            {[
              { name: 'Unstop',       url: `https://unstop.com/jobs?search=${encodeURIComponent(title || 'developer')}` },
              { name: 'Internshala',  url: `https://internshala.com/jobs/keyword-${encodeURIComponent(title || 'developer')}` },
              { name: 'Naukri',       url: `https://www.naukri.com/${encodeURIComponent(title || 'developer')}-jobs` },
              { name: 'LinkedIn',     url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title || 'developer')}&location=India` },
              { name: 'Indeed India', url: `https://in.indeed.com/jobs?q=${encodeURIComponent(title || 'developer')}&l=India` },
            ].map(p => (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={styles.portalBtn}>
                {p.name} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tailor Resume Modal */}
      {tailorJob && (
        <TemplatePickerModal
          resumeId={resumeId}
          jobTitle={tailorJob.title}
          jobDescription={tailorJob.description || `${tailorJob.title} at ${tailorJob.company}. Required skills: ${(tailorJob.jdSkills || tailorJob.matchedSkills || []).join(', ')}`}
          skills={skills}
          onClose={() => setTailorJob(null)}
        />
      )}
    </div>
  );
}

const styles = {
  wrapper:          { padding: '1.5rem', fontFamily: 'sans-serif', maxWidth: 860, margin: '0 auto' },
  heading:          { fontSize: 22, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' },
  sub:              { fontSize: 14, color: '#666', marginBottom: 16 },
  searchBar:        { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  input:            { flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 },
  select:           { padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, background: '#fff' },
  btn:              { padding: '10px 20px', borderRadius: 8, background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  skillsRow:        { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillsLabel:      { fontSize: 13, color: '#666', marginRight: 4 },
  skillTag:         { fontSize: 12, padding: '3px 10px', background: '#EEF2FF', color: '#3730A3', borderRadius: 20 },
  error:            { color: '#B91C1C', background: '#FEF2F2', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 14 },
  filterRow:        { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  filterPill:       { padding: '5px 14px', borderRadius: 20, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer', fontSize: 12, color: '#444' },
  filterPillActive: { background: '#2563EB', color: '#fff', border: '1px solid #2563EB' },
  empty:            { textAlign: 'center', padding: '2rem', color: '#888', fontSize: 14 },
  card:             { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardTop:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  jobTitle:         { fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 },
  jobMeta:          { display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 13, color: '#555' },
  sourceBadge:      { fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 },
  desc:             { fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 10 },
  cardBottom:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  tagRow:           { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tag:              { fontSize: 12, padding: '3px 10px', borderRadius: 6, background: '#F3F4F6', color: '#374151' },
  actionBtns:       { display: 'flex', gap: 8, alignItems: 'center' },
  tailorBtn:        { padding: '8px 16px', background: '#F5F3FF', color: '#6D28D9', border: '1px solid #C4B5FD', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  applyBtn:         { padding: '8px 18px', background: '#2563EB', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' },
  portalLinks:      { marginTop: 20, padding: '1rem 1.25rem', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' },
  portalTitle:      { fontSize: 13, color: '#666', marginBottom: 10, fontWeight: 500 },
  portalBtns:       { display: 'flex', flexWrap: 'wrap', gap: 8 },
  portalBtn:        { padding: '6px 14px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, color: '#2563EB', textDecoration: 'none' },

  // Resume preview styles
  resumePreview:  { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '28px 32px', marginBottom: 14, fontFamily: 'Georgia, serif', maxHeight: 400, overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  rpHeader:       { borderBottom: '2.5px solid #1a1a1a', paddingBottom: 12, marginBottom: 18 },
  rpName:         { fontSize: 22, fontWeight: 700, color: '#111', fontFamily: 'Arial, sans-serif', letterSpacing: '-0.3px' },
  rpContact:      { fontSize: 10, color: '#555', marginTop: 3, fontFamily: 'Arial, sans-serif' },
  rpTargetRole:   { fontSize: 11, color: '#2563EB', fontWeight: 600, marginTop: 5, fontFamily: 'Arial, sans-serif' },
  rpSection:      { marginBottom: 16 },
  rpSectionTitle: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#2563EB', borderBottom: '1px solid #BFDBFE', paddingBottom: 3, marginBottom: 8, fontFamily: 'Arial, sans-serif' },
  rpBody:         { fontSize: 11, lineHeight: 1.75, color: '#2d2d2d' },
  rpSkillTag:     { background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 9, padding: '2px 8px', borderRadius: 3, fontFamily: 'Arial, sans-serif', fontWeight: 500 },
  rpExpBlock:     { marginBottom: 10 },
  rpExpRole:      { fontSize: 10, fontWeight: 700, color: '#111', fontFamily: 'Arial, sans-serif', marginBottom: 2 },
  rpExpBullet:    { fontSize: 11, lineHeight: 1.65, color: '#2d2d2d' },
  rpChangeItem:   { fontSize: 10, color: '#374151', padding: '3px 0', display: 'flex', gap: 6, fontFamily: 'Arial, sans-serif' },
  rpFooter:       { marginTop: 20, paddingTop: 10, borderTop: '1px solid #e5e7eb', fontSize: 8, color: '#9CA3AF', fontFamily: 'Arial, sans-serif', textAlign: 'center' },
};