// client/src/components/TailorResumeModal.js
// PRODUCTION GRADE — Custom JD Tailoring Modal
// Enterprise-ready with proper error handling, accessibility, and UX

import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import './TailorResumeModal.v2.css';

const MAX_JD_CHARS = 5000;
const MIN_JD_CHARS = 50;

const TailorResumeModal = ({ resumeId, skills = [], onClose, onTailored }) => {
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, loading]);

  const handleJdChange = (e) => {
    const val = e.target.value.slice(0, MAX_JD_CHARS);
    setJobDescription(val);
    setCharCount(val.length);
    if (error && val.trim().length >= MIN_JD_CHARS) {
      setError('');
    }
  };

  const handleJobRoleChange = (e) => {
    const val = e.target.value.slice(0, 120);
    setJobRole(val);
    if (error && val.trim().length > 0) {
      setError('');
    }
  };

  const validateForm = () => {
    const trimmedRole = jobRole.trim();
    const trimmedDesc = jobDescription.trim();

    if (!trimmedRole) {
      setError('Job role/title is required.');
      return false;
    }

    if (trimmedRole.length < 3) {
      setError('Job role must be at least 3 characters.');
      return false;
    }

    if (!trimmedDesc) {
      setError('Job description is required.');
      return false;
    }

    if (trimmedDesc.length < MIN_JD_CHARS) {
      setError(`Job description must be at least ${MIN_JD_CHARS} characters.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        resumeId,
        jobTitle: jobRole.trim(),
        jobDescription: jobDescription.trim(),
        skills: skills || [],
      };

      const { data } = await api.post('/resume/modify', payload);

      if (!data.success) {
        throw new Error(data.error || 'Tailoring failed');
      }

      // Pass result to parent (Dashboard will open template picker)
      onTailored(data, jobRole.trim(), jobDescription.trim());
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

  const fillExample = (example) => {
    setJobRole(example.role);
    setJobDescription(example.jd);
    setCharCount(example.jd.length);
    setError('');
  };

  const progressSteps = [
    'Analyzing job requirements',
    'Mapping skills & keywords',
    'Rewriting resume sections',
    'Preparing template preview',
  ];

  return (
    <div
      className="tailor-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tailor-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="tailor-modal" ref={modalRef}>
        {/* ── HEADER ── */}
        <div className="tailor-modal__header">
          <div className="tailor-modal__title-row">
            <span className="tailor-modal__icon" aria-hidden="true">
              🎯
            </span>
            <div>
              <h2 className="tailor-modal__title" id="tailor-modal-title">
                Tailor Resume to Job
              </h2>
              <p className="tailor-modal__subtitle">
                Our AI will rewrite your resume to match the exact requirements
                of this role.
              </p>
            </div>
          </div>
          <button
            className="tailor-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* ── QUICK EXAMPLES ── */}
        <div className="tailor-modal__examples">
          <span className="tailor-modal__examples-label">Try an example:</span>
          {EXAMPLE_JDS.map((example) => (
            <button
              key={example.role}
              className="example-chip"
              onClick={() => fillExample(example)}
              disabled={loading}
            >
              {example.role}
            </button>
          ))}
        </div>

        {/* ── FORM ── */}
        <form className="tailor-modal__form" onSubmit={handleSubmit}>
          {/* Job Role Field */}
          <div className="tailor-field">
            <label htmlFor="tailor-job-role" className="tailor-label">
              Job Role / Title <span className="required">*</span>
            </label>
            <input
              id="tailor-job-role"
              ref={inputRef}
              type="text"
              className="tailor-input"
              placeholder="e.g. Senior Frontend Engineer, Data Scientist, DevOps Lead…"
              value={jobRole}
              onChange={handleJobRoleChange}
              maxLength={120}
              disabled={loading}
              required
              aria-required="true"
              aria-describedby={error ? 'form-error' : undefined}
            />
          </div>

          {/* Job Description Field */}
          <div className="tailor-field">
            <label htmlFor="tailor-jd" className="tailor-label">
              Job Description <span className="required">*</span>
            </label>
            <p className="tailor-field-hint">
              Paste the complete job posting. The more detail you include, the
              better the tailoring.
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
              required
              aria-required="true"
              aria-describedby="jd-char-count"
            />
            <div className="tailor-char-count" id="jd-char-count">
              <span className={charCount > MAX_JD_CHARS * 0.9 ? 'warn' : ''}>
                {charCount.toLocaleString()}
              </span>
              <span> / {MAX_JD_CHARS.toLocaleString()} characters</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="tailor-error"
              id="form-error"
              role="alert"
              aria-live="polite"
            >
              <span className="error-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Value Proposition */}
          <div className="tailor-value-banner">
            <span aria-hidden="true">✨</span>
            <p>
              After tailoring, you'll select a premium template and download a
              perfectly formatted PDF — ready to submit.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="tailor-modal__actions">
            <button
              type="button"
              className="tailor-btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tailor-btn-primary"
              disabled={
                loading || !jobRole.trim() || !jobDescription.trim()
              }
            >
              {loading ? (
                <>
                  <span className="tailor-spinner" aria-hidden="true" />
                  Tailoring Resume…
                </>
              ) : (
                <>
                  <span aria-hidden="true">🚀</span>
                  Tailor My Resume
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── LOADING PROGRESS ── */}
        {loading && (
          <div className="tailor-progress" aria-live="polite" aria-label="Tailoring progress">
            {progressSteps.map((step, index) => (
              <div
                key={index}
                className={`tailor-progress__step ${
                  index === 0 ? 'active' : ''
                }`}
              >
                <span className="tailor-progress__dot" aria-hidden="true" />
                {step}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TailorResumeModal;