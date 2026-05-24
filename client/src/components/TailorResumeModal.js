// client/src/components/TailorResumeModal.js
// UPGRADE 3 — Custom JD Tailoring Modal
// Props:
//   resumeId  - MongoDB _id of the resume record
//   skills    - string[] of detected skills from analysis
//   onClose   - () => void
//   onTailored - (result, jobTitle, jobDescription) => void  <-- triggers template picker

import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import './TailorResumeModal.css';

const MAX_JD_CHARS = 5000;

const TailorResumeModal = ({ resumeId, skills = [], onClose, onTailored }) => {
  const [jobRole, setJobRole]           = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [charCount, setCharCount]       = useState(0);
  const textareaRef                     = useRef(null);
  const modalRef                        = useRef(null);

  // Focus first field on mount
  useEffect(() => {
    setTimeout(() => document.getElementById('tailor-job-role')?.focus(), 100);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleJdChange = (e) => {
    const val = e.target.value.slice(0, MAX_JD_CHARS);
    setJobDescription(val);
    setCharCount(val.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobRole.trim()) { setError('Please enter a job role / title.'); return; }
    if (!jobDescription.trim() || jobDescription.trim().length < 50) {
      setError('Please paste a full job description (at least 50 characters).');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Instead of calling /modify, we just pass the job details to the parent
      // The actual resume generation happens in the TemplatePickerModal
      // This gives users the template selection step first
      
      // Quick validation — verify resume is accessible
      const payload = {
        resumeId,
        jobTitle:       jobRole.trim(),
        jobDescription: jobDescription.trim(),
        missingSkills:  [],
        skills,
      };

      const { data } = await api.post('/resume/modify', payload);
      if (!data.success) throw new Error(data.error || 'Tailoring failed');

      // Pass result up — parent (Dashboard) will open template picker
      onTailored(data, jobRole.trim(), jobDescription.trim());
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const EXAMPLE_JDS = [
    {
      role: 'Senior Frontend Engineer',
      jd: 'We are looking for a Senior Frontend Engineer with 3+ years of experience in React.js, TypeScript, and modern CSS frameworks (Tailwind preferred). You will lead UI architecture decisions, mentor junior developers, and deliver pixel-perfect, accessible web experiences. Strong understanding of web performance, SEO, and CI/CD pipelines is required.',
    },
    {
      role: 'Data Scientist',
      jd: 'Seeking a Data Scientist with expertise in Python, Pandas, Scikit-learn, and SQL. You will build predictive models, perform A/B testing analysis, and collaborate with product teams to drive data-driven decisions. Experience with TensorFlow or PyTorch is a plus. Strong communication skills to present insights to non-technical stakeholders are essential.',
    },
    {
      role: 'Full Stack Developer',
      jd: 'Join our team as a Full Stack Developer. You must have hands-on experience with Node.js, Express, React, and MongoDB. Responsibilities include designing RESTful APIs, building responsive UIs, and deploying applications on AWS. Docker and Kubernetes experience is desirable. Agile methodology and code review participation are expected.',
    },
  ];

  const fillExample = (ex) => {
    setJobRole(ex.role);
    setJobDescription(ex.jd);
    setCharCount(ex.jd.length);
    setError('');
  };

  return (
    <div className="tailor-overlay" role="dialog" aria-modal="true" aria-label="Tailor Resume Modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tailor-modal" ref={modalRef}>

        {/* Header */}
        <div className="tailor-modal__header">
          <div className="tailor-modal__title-row">
            <span className="tailor-modal__icon">🎯</span>
            <div>
              <h2 className="tailor-modal__title">Tailor Resume to Job</h2>
              <p className="tailor-modal__subtitle">
                Our AI will rewrite your resume to match the exact requirements of this role.
              </p>
            </div>
          </div>
          <button className="tailor-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Quick Fill Examples */}
        <div className="tailor-modal__examples">
          <span className="tailor-modal__examples-label">Try an example:</span>
          {EXAMPLE_JDS.map((ex) => (
            <button key={ex.role} className="example-chip" onClick={() => fillExample(ex)}>
              {ex.role}
            </button>
          ))}
        </div>

        {/* Form */}
        <form className="tailor-modal__form" onSubmit={handleSubmit}>

          <div className="tailor-field">
            <label htmlFor="tailor-job-role" className="tailor-label">
              Job Role / Title <span className="required">*</span>
            </label>
            <input
              id="tailor-job-role"
              type="text"
              className="tailor-input"
              placeholder="e.g. Senior Frontend Engineer, Data Scientist, DevOps Lead…"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              maxLength={120}
              disabled={loading}
            />
          </div>

          <div className="tailor-field">
            <label htmlFor="tailor-jd" className="tailor-label">
              Job Description <span className="required">*</span>
            </label>
            <p className="tailor-field-hint">
              Paste the complete job posting. The more detail you include, the better the tailoring.
            </p>
            <textarea
              id="tailor-jd"
              ref={textareaRef}
              className="tailor-textarea"
              placeholder="Paste the full job description here — requirements, responsibilities, tech stack, soft skills…"
              value={jobDescription}
              onChange={handleJdChange}
              rows={9}
              disabled={loading}
            />
            <div className="tailor-char-count">
              <span className={charCount > MAX_JD_CHARS * 0.9 ? 'warn' : ''}>
                {charCount.toLocaleString()}
              </span>
              <span> / {MAX_JD_CHARS.toLocaleString()} chars</span>
            </div>
          </div>

          {error && (
            <div className="tailor-error" role="alert">
              ⚠ {error}
            </div>
          )}

          {/* Value Prop Banner */}
          <div className="tailor-value-banner">
            <span>✨</span>
            <p>After tailoring, you'll select a premium template and download a perfectly formatted PDF — ready to submit.</p>
          </div>

          <div className="tailor-modal__actions">
            <button type="button" className="tailor-btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="tailor-btn-primary" disabled={loading || !jobRole || !jobDescription}>
              {loading ? (
                <>
                  <span className="tailor-spinner" />
                  Tailoring Resume…
                </>
              ) : (
                <>🚀 Tailor My Resume</>
              )}
            </button>
          </div>

        </form>

        {/* Progress Steps (shown while loading) */}
        {loading && (
          <div className="tailor-progress">
            <div className="tailor-progress__step active">
              <span className="tailor-progress__dot" />
              Analyzing job requirements
            </div>
            <div className="tailor-progress__step">
              <span className="tailor-progress__dot" />
              Mapping skills & keywords
            </div>
            <div className="tailor-progress__step">
              <span className="tailor-progress__dot" />
              Rewriting resume sections
            </div>
            <div className="tailor-progress__step">
              <span className="tailor-progress__dot" />
              Preparing template preview
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TailorResumeModal;