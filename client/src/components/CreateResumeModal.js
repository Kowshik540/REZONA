// client/src/components/CreateResumeModal.js
// Multi-step form to create a resume from scratch for users who don't have one

import React, { useState } from 'react';
import api from '../utils/api';

const STEPS = ['Personal', 'Education', 'Experience', 'Skills', 'Projects', 'Generate'];

const CreateResumeModal = ({ onClose, onCreated }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    summary: '',
    education: [{ degree: '', institution: '', year: '', details: '' }],
    experience: [{ role: '', company: '', duration: '', bullets: [''] }],
    skills: '',
    projects: [{ name: '', tech: '', description: '' }],
    certifications: '',
    achievements: '',
    targetRole: '',
  });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addEducation = () => setForm(prev => ({ ...prev, education: [...prev.education, { degree: '', institution: '', year: '', details: '' }] }));
  const addExperience = () => setForm(prev => ({ ...prev, experience: [...prev.experience, { role: '', company: '', duration: '', bullets: [''] }] }));
  const addProject = () => setForm(prev => ({ ...prev, projects: [...prev.projects, { name: '', tech: '', description: '' }] }));
  const addBullet = (expIdx) => {
    const exp = [...form.experience];
    exp[expIdx].bullets.push('');
    setForm(prev => ({ ...prev, experience: exp }));
  };

  const updateEducation = (idx, field, value) => {
    const edu = [...form.education];
    edu[idx][field] = value;
    setForm(prev => ({ ...prev, education: edu }));
  };

  const updateExperience = (idx, field, value) => {
    const exp = [...form.experience];
    exp[idx][field] = value;
    setForm(prev => ({ ...prev, experience: exp }));
  };

  const updateBullet = (expIdx, bulletIdx, value) => {
    const exp = [...form.experience];
    exp[expIdx].bullets[bulletIdx] = value;
    setForm(prev => ({ ...prev, experience: exp }));
  };

  const updateProject = (idx, field, value) => {
    const proj = [...form.projects];
    proj[idx][field] = value;
    setForm(prev => ({ ...prev, projects: proj }));
  };

  const handleGenerate = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/resume/create-from-scratch', {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        certifications: form.certifications.split(',').map(s => s.trim()).filter(Boolean),
        achievements: form.achievements.split('\n').map(s => s.trim()).filter(Boolean),
      }, { timeout: 90000, responseType: 'blob' });

      // Download the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resume_${form.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onCreated();
      onClose();
    } catch (err) {
      // If it's a blob error response, parse it
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          setError(json.error || 'Generation failed');
        } catch {
          setError('Generation failed. Please try again.');
        }
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to generate resume');
      }
    }
    setLoading(false);
  };

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.email.trim();
    if (step === 1) return form.education[0].degree.trim();
    return true;
  };

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>📝 Create Resume from Scratch</h2>
            <p style={styles.subtitle}>Fill in your details and we'll generate a professional ATS-friendly resume</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Progress */}
        <div style={styles.progress}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ ...styles.progressStep, ...(i <= step ? styles.progressActive : {}) }}>
              <span style={styles.progressDot}>{i < step ? '✓' : i + 1}</span>
              <span style={styles.progressLabel}>{s}</span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div style={styles.body}>
          {/* Step 0: Personal */}
          {step === 0 && (
            <div style={styles.formGrid}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Full Name *</label>
                <input style={styles.input} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Kowshik Thota" />
              </div>
              <div style={styles.fieldHalf}>
                <label style={styles.label}>Email *</label>
                <input style={styles.input} value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="you@email.com" />
              </div>
              <div style={styles.fieldHalf}>
                <label style={styles.label}>Phone</label>
                <input style={styles.input} value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+91 9876543210" />
              </div>
              <div style={styles.fieldHalf}>
                <label style={styles.label}>Location</label>
                <input style={styles.input} value={form.location} onChange={e => updateField('location', e.target.value)} placeholder="Hyderabad, India" />
              </div>
              <div style={styles.fieldHalf}>
                <label style={styles.label}>Target Role</label>
                <input style={styles.input} value={form.targetRole} onChange={e => updateField('targetRole', e.target.value)} placeholder="e.g. Full Stack Developer" />
              </div>
              <div style={styles.fieldHalf}>
                <label style={styles.label}>LinkedIn</label>
                <input style={styles.input} value={form.linkedin} onChange={e => updateField('linkedin', e.target.value)} placeholder="linkedin.com/in/yourname" />
              </div>
              <div style={styles.fieldHalf}>
                <label style={styles.label}>GitHub</label>
                <input style={styles.input} value={form.github} onChange={e => updateField('github', e.target.value)} placeholder="github.com/username" />
              </div>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Professional Summary (optional — AI will write one if blank)</label>
                <textarea style={styles.textarea} value={form.summary} onChange={e => updateField('summary', e.target.value)} placeholder="Brief 2-3 line summary of your background..." rows={3} />
              </div>
            </div>
          )}

          {/* Step 1: Education */}
          {step === 1 && (
            <div>
              {form.education.map((edu, idx) => (
                <div key={idx} style={styles.card}>
                  <h4 style={styles.cardTitle}>Education {idx + 1}</h4>
                  <div style={styles.formGrid}>
                    <div style={styles.fieldFull}>
                      <label style={styles.label}>Degree *</label>
                      <input style={styles.input} value={edu.degree} onChange={e => updateEducation(idx, 'degree', e.target.value)} placeholder="B.Tech in Computer Science" />
                    </div>
                    <div style={styles.fieldHalf}>
                      <label style={styles.label}>Institution</label>
                      <input style={styles.input} value={edu.institution} onChange={e => updateEducation(idx, 'institution', e.target.value)} placeholder="University name" />
                    </div>
                    <div style={styles.fieldHalf}>
                      <label style={styles.label}>Year</label>
                      <input style={styles.input} value={edu.year} onChange={e => updateEducation(idx, 'year', e.target.value)} placeholder="2020 - 2024" />
                    </div>
                    <div style={styles.fieldFull}>
                      <label style={styles.label}>Details (GPA, coursework, honors)</label>
                      <input style={styles.input} value={edu.details} onChange={e => updateEducation(idx, 'details', e.target.value)} placeholder="CGPA: 9.15 | Relevant coursework: DSA, DBMS, OS" />
                    </div>
                  </div>
                </div>
              ))}
              <button style={styles.addBtn} onClick={addEducation}>+ Add Education</button>
            </div>
          )}

          {/* Step 2: Experience */}
          {step === 2 && (
            <div>
              <p style={styles.hint}>Leave blank if you're a fresher — we'll optimize your resume around projects and skills instead.</p>
              {form.experience.map((exp, idx) => (
                <div key={idx} style={styles.card}>
                  <h4 style={styles.cardTitle}>Experience {idx + 1}</h4>
                  <div style={styles.formGrid}>
                    <div style={styles.fieldHalf}>
                      <label style={styles.label}>Role/Title</label>
                      <input style={styles.input} value={exp.role} onChange={e => updateExperience(idx, 'role', e.target.value)} placeholder="Web Development Intern" />
                    </div>
                    <div style={styles.fieldHalf}>
                      <label style={styles.label}>Company</label>
                      <input style={styles.input} value={exp.company} onChange={e => updateExperience(idx, 'company', e.target.value)} placeholder="Company name" />
                    </div>
                    <div style={styles.fieldFull}>
                      <label style={styles.label}>Duration</label>
                      <input style={styles.input} value={exp.duration} onChange={e => updateExperience(idx, 'duration', e.target.value)} placeholder="Nov 2025 - Feb 2026" />
                    </div>
                    <div style={styles.fieldFull}>
                      <label style={styles.label}>What did you do? (one point per line)</label>
                      {exp.bullets.map((b, bi) => (
                        <input key={bi} style={{ ...styles.input, marginBottom: 6 }} value={b} onChange={e => updateBullet(idx, bi, e.target.value)} placeholder={`Responsibility/achievement ${bi + 1}`} />
                      ))}
                      <button style={styles.addBtn} onClick={() => addBullet(idx)}>+ Add point</button>
                    </div>
                  </div>
                </div>
              ))}
              <button style={styles.addBtn} onClick={addExperience}>+ Add Experience</button>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div style={styles.formGrid}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Technical Skills (comma-separated) *</label>
                <textarea style={styles.textarea} value={form.skills} onChange={e => updateField('skills', e.target.value)} placeholder="JavaScript, React, Node.js, Python, MongoDB, SQL, Git, Docker, HTML, CSS" rows={4} />
                <p style={styles.hint}>List all programming languages, frameworks, tools, and technologies you know</p>
              </div>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Certifications (comma-separated, optional)</label>
                <input style={styles.input} value={form.certifications} onChange={e => updateField('certifications', e.target.value)} placeholder="AWS Cloud Practitioner, Google Analytics, HubSpot Marketing" />
              </div>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Achievements (one per line, optional)</label>
                <textarea style={styles.textarea} value={form.achievements} onChange={e => updateField('achievements', e.target.value)} placeholder="Top 15000 in Google BigCode&#10;Solved 200+ LeetCode problems&#10;Won college hackathon" rows={4} />
              </div>
            </div>
          )}

          {/* Step 4: Projects */}
          {step === 4 && (
            <div>
              {form.projects.map((proj, idx) => (
                <div key={idx} style={styles.card}>
                  <h4 style={styles.cardTitle}>Project {idx + 1}</h4>
                  <div style={styles.formGrid}>
                    <div style={styles.fieldHalf}>
                      <label style={styles.label}>Project Name</label>
                      <input style={styles.input} value={proj.name} onChange={e => updateProject(idx, 'name', e.target.value)} placeholder="College Canteen System" />
                    </div>
                    <div style={styles.fieldHalf}>
                      <label style={styles.label}>Tech Stack</label>
                      <input style={styles.input} value={proj.tech} onChange={e => updateProject(idx, 'tech', e.target.value)} placeholder="React, Node.js, MongoDB" />
                    </div>
                    <div style={styles.fieldFull}>
                      <label style={styles.label}>Description</label>
                      <textarea style={styles.textarea} value={proj.description} onChange={e => updateProject(idx, 'description', e.target.value)} placeholder="What does it do? What did you build? Any live link?" rows={3} />
                    </div>
                  </div>
                </div>
              ))}
              <button style={styles.addBtn} onClick={addProject}>+ Add Project</button>
            </div>
          )}

          {/* Step 5: Generate */}
          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              {!loading ? (
                <>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                  <h3 style={{ color: '#f0f0f8', marginBottom: 8 }}>Ready to Generate!</h3>
                  <p style={{ color: '#94a3b8', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                    Our AI will create a professional, ATS-optimized resume using your details. The output will be formatted for maximum recruiter compatibility.
                  </p>
                  <button style={styles.generateBtn} onClick={handleGenerate}>
                    ✨ Generate My Resume
                  </button>
                </>
              ) : (
                <>
                  <div style={styles.spinner}></div>
                  <p style={{ color: '#a5b4fc', marginTop: 16 }}>Creating your professional resume...</p>
                  <p style={{ color: '#64748b', fontSize: 13 }}>This takes 15-30 seconds</p>
                </>
              )}
            </div>
          )}

          {error && <div style={styles.error}>⚠ {error}</div>}
        </div>

        {/* Footer Navigation */}
        <div style={styles.footer}>
          {step > 0 && (
            <button style={styles.backBtn} onClick={() => setStep(step - 1)} disabled={loading}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < 5 && (
            <button style={styles.nextBtn} onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 },
  modal: { background: '#0f1019', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  title: { fontSize: 18, fontWeight: 700, color: '#f0f0f8', margin: 0 },
  subtitle: { fontSize: 13, color: '#7b7f9a', margin: '4px 0 0' },
  closeBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#7b7f9a', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  progress: { display: 'flex', gap: 4, padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto' },
  progressStep: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, color: '#4b5563', whiteSpace: 'nowrap' },
  progressActive: { color: '#a5b4fc', background: 'rgba(99,102,241,0.1)' },
  progressDot: { width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 },
  progressLabel: { fontSize: 11, fontWeight: 500 },
  body: { flex: 1, overflow: 'auto', padding: '20px 24px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  fieldFull: { gridColumn: '1 / -1' },
  fieldHalf: {},
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' },
  input: { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f8', fontSize: 14, outline: 'none' },
  textarea: { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f8', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: 600, color: '#a5b4fc', margin: '0 0 12px' },
  addBtn: { background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)', color: '#6366f1', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, marginTop: 8 },
  hint: { fontSize: 12, color: '#64748b', marginTop: 4 },
  footer: { display: 'flex', alignItems: 'center', padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  backBtn: { padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  nextBtn: { padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  generateBtn: { padding: '14px 32px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 700 },
  error: { marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#fca5a5', fontSize: 13 },
  spinner: { width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
};

export default CreateResumeModal;
