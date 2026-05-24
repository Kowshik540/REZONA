// client/src/pages/CoverLetter.js
// Enhanced: Full preview modal + PDF download for cover letters

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function buildCoverLetterHtml(result, jobTitle, companyName, candidateName, candidateEmail, candidatePhone) {
  const paragraphs = (result.coverLetter || '').split('\n\n')
    .map(p => `<p style="margin-bottom:18px;line-height:1.85;font-size:13.5px;color:#1e293b;">${p}</p>`)
    .join('');

  const contactLine = [candidateEmail, candidatePhone].filter(Boolean).join(' | ');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', 'Times New Roman', serif; background: #f0f2f5; padding: 32px; }
    .page { background: #fff; max-width: 720px; margin: 0 auto; padding: 56px 60px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); border-radius: 2px; }
    .header { margin-bottom: 36px; padding-bottom: 20px; border-bottom: 2px solid #1e293b; }
    .date { font-size: 12px; color: #64748b; margin-bottom: 16px; font-family: 'Segoe UI', sans-serif; }
    .to { font-size: 13px; color: #475569; line-height: 1.7; margin-bottom: 8px; font-family: 'Segoe UI', sans-serif; }
    .subject { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 16px; font-family: 'Segoe UI', sans-serif; }
    .body { margin-bottom: 32px; }
    .closing { font-size: 13.5px; color: #1e293b; line-height: 1.8; }
    .signature { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .sig-name { font-size: 15px; font-weight: 700; color: #0f172a; font-family: 'Segoe UI', sans-serif; }
    .sig-contact { font-size: 12px; color: #64748b; margin-top: 4px; font-family: 'Segoe UI', sans-serif; }
    @media print { body { background: white; padding: 0; } .page { box-shadow: none; padding: 40px 48px; } @page { margin: 0; } }
  </style></head><body><div class="page">
    <div class="header">
      <div class="date">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div class="to">
        Hiring Manager<br/>
        ${companyName || 'Company'}<br/>
        Re: Application for ${jobTitle}
      </div>
      ${result.subject ? `<div class="subject">Subject: ${result.subject}</div>` : ''}
    </div>
    <div class="body">
      ${paragraphs}
    </div>
    <div class="signature">
      <div class="sig-name">${candidateName || 'Candidate'}</div>
      ${contactLine ? `<div class="sig-contact">${contactLine}</div>` : ''}
    </div>
  </div></body></html>`;
}

const CoverLetter = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    api.get('/resume/history').then(({ data }) => {
      const list = data.resumes || [];
      setResumes(list);
      if (list.length > 0) setSelectedResumeId(list[0]._id);
    }).catch(() => {});
    // Pre-fill name/email from user context
    if (user?.name) setCandidateName(user.name);
    if (user?.email) setCandidateEmail(user.email);
  }, [user]);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!candidateName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!jobTitle || !jobDescription) {
      setError('Job title and description are required');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/resume/cover-letter', {
        resumeId: selectedResumeId,
        jobTitle,
        jobDescription,
        companyName,
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        candidatePhone: candidatePhone.trim(),
      }, { timeout: 60000 });
      if (data.success) setResult(data);
      else throw new Error(data.error);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.limitReached) {
        setError(`⚠️ ${errData.error}`);
      } else {
        setError(errData?.error || err.message || 'Generation failed');
      }
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (result?.coverLetter) {
      await navigator.clipboard.writeText(result.coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const html = buildCoverLetterHtml(result, jobTitle, companyName, candidateName, candidateEmail, candidatePhone);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 600);
      };
    }
  };

  const handlePrintFromPreview = () => {
    const iframe = document.getElementById('cl-preview-frame');
    if (iframe) { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
  };

  return (
    <div style={st.page}>
      <div style={st.container}>
        <h1 style={st.title}>📝 Cover Letter Generator</h1>
        <p style={st.subtitle}>Generate a personalized, professional cover letter based on your resume and the target job.</p>

        <div style={st.grid}>
          {/* Form */}
          <div style={st.formCard}>
            <form onSubmit={handleGenerate}>
              <div style={st.field}>
                <label style={st.label}>Select Resume</label>
                <select style={st.select} value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)}>
                  {resumes.map(r => (
                    <option key={r._id} value={r._id}>{r.filename}</option>
                  ))}
                </select>
              </div>
              <div style={st.field}>
                <label style={st.label}>Job Title *</label>
                <input style={st.input} value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div style={st.field}>
                <label style={st.label}>Company Name</label>
                <input style={st.input} value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Google, Razorpay, Flipkart" />
              </div>

              <div style={{ borderTop: '1px solid #2d2d3d', margin: '16px 0', paddingTop: 16 }}>
                <label style={{ ...st.label, color: '#a5b4fc', marginBottom: 12 }}>Your Details (will appear on the cover letter)</label>
                <div style={{ display: 'grid', gap: 10 }}>
                  <input style={st.input} value={candidateName} onChange={e => setCandidateName(e.target.value)}
                    placeholder="Your Full Name *" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input style={st.input} value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)}
                      placeholder="Email" />
                    <input style={st.input} value={candidatePhone} onChange={e => setCandidatePhone(e.target.value)}
                      placeholder="Phone (e.g. +91 9876543210)" />
                  </div>
                </div>
              </div>
              <div style={st.field}>
                <label style={st.label}>Job Description *</label>
                <textarea style={st.textarea} value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..." rows={8} />
              </div>
              {error && <div style={st.error}>{error}</div>}
              <button type="submit" style={st.generateBtn} disabled={loading}>
                {loading ? '⏳ Generating...' : '✨ Generate Cover Letter'}
              </button>
            </form>
          </div>

          {/* Result */}
          <div style={st.resultCard}>
            {!result && !loading && (
              <div style={st.placeholder}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
                <p style={{ fontSize: 15, fontWeight: 600 }}>Your cover letter will appear here</p>
                <small style={{ color: '#64748b', marginTop: 4 }}>Fill in the form and click Generate</small>
              </div>
            )}
            {loading && (
              <div style={st.placeholder}>
                <div style={st.spinner}></div>
                <p style={{ marginTop: 8 }}>Writing your cover letter...</p>
                <small style={{ color: '#64748b' }}>This takes 10-20 seconds</small>
              </div>
            )}
            {result && (
              <div>
                {result.subject && (
                  <div style={st.subjectLine}>
                    <span style={{ fontWeight: 700, color: '#6366f1' }}>Subject:</span> {result.subject}
                  </div>
                )}
                <div style={st.letterContent}>
                  {result.coverLetter.split('\n\n').map((para, i) => (
                    <p key={i} style={{ marginBottom: 14, lineHeight: 1.8 }}>{para}</p>
                  ))}
                </div>
                {result.keyPoints && result.keyPoints.length > 0 && (
                  <div style={st.keyPoints}>
                    <strong style={{ color: '#e2e8f0' }}>Key Selling Points:</strong>
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                      {result.keyPoints.map((p, i) => <li key={i} style={{ marginBottom: 4, color: '#94a3b8' }}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {/* Action Buttons */}
                <div style={st.actionRow}>
                  <button style={st.previewBtn} onClick={() => setShowPreview(true)}>
                    👁 Preview & Print
                  </button>
                  <button style={st.downloadBtn} onClick={handleDownload}>
                    📥 Download PDF
                  </button>
                  <button style={st.copyBtn} onClick={handleCopy}>
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                  <button style={st.regenBtn} onClick={handleGenerate} disabled={loading}>
                    🔄
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── FULLSCREEN PREVIEW MODAL ─── */}
      {showPreview && result && (
        <div style={st.previewOverlay} onClick={e => { if (e.target === e.currentTarget) setShowPreview(false); }}>
          <div style={st.previewModal}>
            <div style={st.previewHeader}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f8', margin: 0 }}>Cover Letter Preview</h3>
                <p style={{ fontSize: 12, color: '#7b7f9a', margin: '4px 0 0' }}>For: {jobTitle} at {companyName || 'Company'}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button style={st.previewActionBtn} onClick={handlePrintFromPreview}>🖨 Print / Save PDF</button>
                <button style={st.previewActionBtn} onClick={handleDownload}>📥 Download</button>
                <button style={st.previewCloseBtn} onClick={() => setShowPreview(false)}>✕</button>
              </div>
            </div>
            <div style={st.previewIframeWrap}>
              <iframe
                id="cl-preview-frame"
                srcDoc={buildCoverLetterHtml(result, jobTitle, companyName, candidateName, candidateEmail, candidatePhone)}
                title="Cover Letter Preview"
                style={st.previewIframe}
                sandbox="allow-same-origin allow-modals"
              />
            </div>
            <div style={st.previewFooter}>
              💡 Click "Print / Save PDF" → in the print dialog choose "Save as PDF" as destination.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const st = {
  page: { minHeight: '100vh', background: '#0a0a1a', padding: '40px 20px', color: '#fff' },
  container: { maxWidth: 1100, margin: '0 auto' },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 15, marginBottom: 32 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, alignItems: 'start' },
  formCard: { background: '#1e1e2e', borderRadius: 12, padding: 24, border: '1px solid #2d2d3d' },
  resultCard: { background: '#1e1e2e', borderRadius: 12, padding: 24, border: '1px solid #2d2d3d', minHeight: 420 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: 600 },
  input: { width: '100%', padding: '10px 14px', background: '#0f0f1a', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' },
  select: { width: '100%', padding: '10px 14px', background: '#0f0f1a', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' },
  textarea: { width: '100%', padding: '10px 14px', background: '#0f0f1a', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  generateBtn: { width: '100%', padding: '14px 0', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  error: { background: '#7f1d1d', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, color: '#64748b', textAlign: 'center' },
  spinner: { width: 36, height: 36, border: '3px solid #374151', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  subjectLine: { background: '#0f0f1a', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#e2e8f0', border: '1px solid #2d2d3d' },
  letterContent: { fontSize: 14, color: '#e2e8f0', lineHeight: 1.8, padding: '0 4px' },
  keyPoints: { marginTop: 20, padding: '14px 16px', background: '#0f0f1a', borderRadius: 8, fontSize: 13, border: '1px solid #2d2d3d' },
  actionRow: { display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' },
  previewBtn: { padding: '10px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  downloadBtn: { padding: '10px 18px', background: '#1e293b', color: '#fff', border: '1px solid #374151', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  copyBtn: { padding: '10px 18px', background: 'transparent', color: '#94a3b8', border: '1px solid #374151', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  regenBtn: { padding: '10px 14px', background: 'transparent', color: '#94a3b8', border: '1px solid #374151', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  // Preview Modal
  previewOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 },
  previewModal: { background: '#0f1019', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: '92vw', height: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' },
  previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
  previewActionBtn: { padding: '8px 16px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  previewCloseBtn: { width: 34, height: 34, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#7b7f9a', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  previewIframeWrap: { flex: 1, overflow: 'hidden', background: '#e8eaed' },
  previewIframe: { width: '100%', height: '100%', border: 'none' },
  previewFooter: { padding: '10px 24px', fontSize: 12, color: '#6b7280', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
};

export default CoverLetter;
