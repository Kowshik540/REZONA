// client/src/pages/Home.js
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Home.v2.css';

const PLANS = [
  {
    id: 'starter',
    label: 'Starter Plan',
    price: { monthly: 99, yearly: 79 },
    yearlyTotal: 948,
    saving: 20,
    tag: null,
    color: '#6366f1',
    features: [
      'ATS Score Check — 10 scans/month',
      'Resume Tailoring — 10 times/month',
      'Resume Upload (PDF)',
      '6 Resume Templates',
      'Cover Letter Generator (10/mo)',
      'Job Recommendations',
    ],
  },
  {
    id: 'pro',
    label: 'Pro Developer',
    price: { monthly: 249, yearly: 179 },
    yearlyTotal: 2148,
    saving: 28,
    tag: null,
    color: '#f59e0b',
    features: [
      'ATS Score Check — 25 scans/month',
      'Resume Tailoring — 25 times/month',
      '6 Resume Templates',
      'Cover Letter Generator (25/mo)',
      'Job Recommendations',
      'PDF Download',
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    price: { monthly: 499, yearly: 339 },
    yearlyTotal: 4068,
    saving: 32,
    tag: null,
    color: '#10b981',
    features: [
      'ATS Score Check — 50 scans/month',
      'Resume Tailoring — 50 times/month',
      '6 Resume Templates',
      'Cover Letter Generator (50/mo)',
      'Job Recommendations',
      'PDF Download',
    ],
  },
  {
    id: 'elite',
    label: 'Elite',
    price: { monthly: 999, yearly: 699 },
    yearlyTotal: 8388,
    saving: 30,
    tag: 'Most Popular',
    color: '#ec4899',
    features: [
      'ATS Score Check — 150 scans/month',
      'Resume Tailoring — 150 times/month',
      '14 Premium Resume Templates',
      'Cover Letter Generator (Unlimited)',
      'ATS Constraint Optimization',
      'Keyword Density Analysis',
      'Exact-Match JD Phrase Injection',
      'Skills Categorization (by type)',
    ],
  },
  {
    id: 'exclusive',
    label: 'Exclusive',
    price: { monthly: 1999, yearly: 1399 },
    yearlyTotal: 16788,
    saving: 30,
    tag: 'Best Value',
    color: '#8b5cf6',
    features: [
      'ATS Score Check — 500 scans/month',
      'Resume Tailoring — 500 times/month',
      '22 Premium Resume Templates',
      'All Elite Features +',
      'Verb+Context Syntax Optimization',
      'Acronym & Full-Term Expansion',
      'Timeline Format Correction',
      'ATS Parser Constraint Compliance',
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: "How does the ATS scoring work?",
    a: "We parse your PDF text lines using standard structural checking algorithms to match text formatting, header definitions, and skill tags against common applicant tracking systems criteria."
  },
  {
    q: "Can I cancel or change my plan anytime?",
    a: "Yes, monthly accounts can be stopped whenever you want. Yearly choices are processed as single upfront cycles but secure the highest discount rate."
  },
  {
    q: "Why is PDF the only supported format for scanning?",
    a: "PDF files preserve strict typography bounds and positioning metrics. Testing this ensures layout boundaries remain intact across automated reader engines."
  }
];

const PricingCard = ({ plan, billing }) => {
  const currentPrice = billing === 'monthly' ? plan.price.monthly : plan.price.yearly;

  return (
    <div className={`pricing-card ${plan.tag ? 'featured' : ''}`}>
      {plan.tag && (
        <span className="plan-badge" style={{ backgroundColor: plan.color }}>
          {plan.tag}
        </span>
      )}
      <h3 className="plan-title">{plan.label}</h3>
      <div className="price-row">
        <span className="currency">₹</span>
        <span className="amount">{currentPrice}</span>
        <span className="period">/month</span>
      </div>

      <div className="billing-meta">
        {billing === 'yearly' ? (
          <>
            <span className="discount-tag">Save {plan.saving}%</span>
            <span>Billed annually (₹{plan.yearlyTotal})</span>
          </>
        ) : (
          <span className="cancel-note">Flexible month-to-month billing</span>
        )}
      </div>

      <ul className="plan-features-list">
        {plan.features.map((feature, idx) => (
          <li key={idx}>
            <span className="check-icon" style={{ color: plan.color }}>✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <Link
        to="/pricing"
        className="plan-action-btn"
        style={{ 
          backgroundColor: plan.tag ? plan.color : 'var(--bg-surface-card)',
          border: plan.tag ? 'none' : '1px solid var(--border-medium)'
        }}
      >
        Get Started with {plan.label}
      </Link>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quickResult, setQuickResult] = useState(null);
  const [billing, setBilling] = useState('yearly');
  const [activeFaq, setActiveFaq] = useState(null);

  const fileInputRef = useRef(null);

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    if (file.type !== 'application/pdf') {
      setError('Please upload your resume in standard PDF format.');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setQuickResult(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/resume/quick-scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setQuickResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'The upload process failed. Please check the file size and retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const triggerBrowse = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className="home-page-container">
      
      {/* ── HERO BANNER SECTION ── */}
      <header className="hero-section">
        <div className="hero-main-content">
          <div className="hero-status-tag">
            <span className="tag-pulse"></span> Intelligent Automation Engine
          </div>
          <h1 className="hero-display-title">
            Match your resume to any job description instantly
          </h1>
          <p className="hero-description-text">
            Rezona helps you fix layout formatting errors, run background ATS compatibility tests, and inject matching context phrases so your profile stays at the top of candidate shortlists.
          </p>

          {error && <div className="validation-error-alert">{error}</div>}

          {/* Upload Dropzone Container */}
          <div 
            {...getRootProps()} 
            className={`upload-dropzone-block ${isDragActive ? 'drag-hover' : ''} ${isAnalyzing ? 'processing' : ''}`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            
            {isAnalyzing ? (
              <div className="dropzone-loading-view">
                <div className="spinner-loader"></div>
                <p>Analyzing document syntax patterns...</p>
                <small>Reading character layouts and validating metadata headers</small>
              </div>
            ) : isDragActive ? (
              <div className="dropzone-active-view">
                <span className="drop-arrow-icon">📥</span>
                <p>Drop the PDF file here to begin</p>
              </div>
            ) : (
              <div className="dropzone-default-view">
                <div className="document-icon">📄</div>
                <p className="primary-text"><strong>Drag and drop your resume file</strong> or browse local directories</p>
                <p className="secondary-text">Accepts PDF files up to 10MB</p>
                <button type="button" className="browse-trigger-btn" onClick={triggerBrowse}>Select Document</button>
              </div>
            )}
          </div>

          {/* Quick Result Drawer */}
          {quickResult && (
            <div className="quick-analysis-drawer">
              <div className="drawer-metric-badge">
                <span className="metric-score">{quickResult.score}</span>
                <span className="metric-base">ATS SCORE</span>
              </div>
              <div className="drawer-feedback-copy">
                <h5>Scan Complete! Overall Score: {quickResult.score}/100</h5>
                <p>Located {quickResult.skillsFound} core professional skills and marked {quickResult.issuesCount} styling alerts.</p>
                <Link to="/register" className="drawer-navigation-link">
                  Setup an account to see your full content report and keyword recommendations →
                </Link>
              </div>
            </div>
          )}

          <div className="hero-buttons-row">
            <Link to={user ? "/dashboard" : "/register"} className="btn-solid-cta">
              Access My Workspace
            </Link>
            <a href="#features" className="btn-outline-cta">
              Explore Core Features
            </a>
          </div>
        </div>

        {/* Hero Sidebar Graphic Card */}
        <div className="hero-side-graphic">
          <div className="mockup-panel-card">
            <div className="mockup-header">
              <span className="mockup-title">Active Analyzer Logging</span>
              <span className="mockup-status-indicator">Ready</span>
            </div>
            <div className="mockup-body-row">
              <div className="mockup-radial-score">81</div>
              <div className="mockup-meta-text">
                <span className="filename-label">Software_Engineer_Resume.pdf</span>
                <span className="status-label">Overall Match: Good</span>
              </div>
            </div>
            <div className="mockup-progress-track">
              <div className="mockup-progress-fill" style={{ width: '81%' }}></div>
            </div>
            <div className="mockup-bullet-logs">
              <p>✓ Section structure successfully parsed.</p>
              <p>✓ Verified standard typography layers.</p>
              <p className="warn">⚠️ Target keywords missing relative to sector description.</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── METRICS STRIP SECTION ── */}
      <section className="metrics-strip-banner">
        <div className="container-inner">
          <div className="metrics-layout-grid">
            <div className="metric-data-block">
              <span className="metric-number text-indigo">81%</span>
              <span className="metric-explanation">Increase in interview responses recorded</span>
            </div>
            <div className="metric-data-block">
              <span className="metric-number text-amber">3.2M+</span>
              <span className="metric-explanation">Job listings indexed and cross-referenced</span>
            </div>
            <div className="metric-data-block">
              <span className="metric-number text-emerald">140k+</span>
              <span className="metric-explanation">Individual resume optimization cycles complete</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES LIST SECTION ── */}
      <section id="features" className="features-showcase-section">
        <div className="container-inner">
          <span className="section-preheadline">Platform Overview</span>
          <h2 className="section-main-headline">Engineered to optimize your job application conversion rates</h2>
          <p className="section-intro-paragraph">
            Blasting an identical layout file to hundreds of listings creates roadblocks. Rezona crawls your text hierarchy against open roles to show you exactly what to adjust.
          </p>

          <div className="features-cards-grid">
            <div className="feature-item-card">
              <div className="card-top-header">
                <span className="card-icon-badge">🎯</span>
                <h4 className="card-heading-title">1. ATS Parsing Audits</h4>
              </div>
              <ul className="card-bullet-points">
                <li>Validates whether enterprise automated parsers read your file clean</li>
                <li>Flags dual-column patterns or graphics that disrupt text parsing workflows</li>
                <li>Ensures all characters decode into readable content blocks</li>
              </ul>
            </div>

            <div className="feature-item-card">
              <div className="card-top-header">
                <span className="card-icon-badge">✂️</span>
                <h4 className="card-heading-title">2. Target Role Tailoring</h4>
              </div>
              <ul className="card-bullet-points">
                <li>Compares experiences directly with targeted job post parameters</li>
                <li>Recommends explicit metrics formats and action verbs to utilize</li>
                <li>Rewrites weak background summaries to capture key requirements</li>
              </ul>
            </div>

            <div className="feature-item-card">
              <div className="card-top-header">
                <span className="card-icon-badge">💼</span>
                <h4 className="card-heading-title">3. Smart Matching Pipeline</h4>
              </div>
              <ul className="card-bullet-points">
                <li>Indexes live job openings matching your custom technical profiles</li>
                <li>Displays compatibility indexing scores alongside active listings</li>
                <li>Allows side-by-side verification before completing exports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING TIER MATRIX SECTION ── */}
      <section className="pricing-matrix-section">
        <div className="container-inner" style={{ textAlign: 'center' }}>
          <span className="section-preheadline">Pricing Tiers</span>
          <h2 className="section-main-headline">Flexible plans for every career step</h2>
          <p className="section-intro-paragraph" style={{ margin: '0 auto 32px' }}>
            Get deep engineering insight into your application files. Pick a plan suited to your active pipeline.
          </p>

          <div className="pricing-toggle-widget">
            <button 
              type="button" 
              className={billing === 'monthly' ? 'active-toggle' : ''} 
              onClick={() => setBilling('monthly')}
            >
              Monthly Term
            </button>
            <button 
              type="button" 
              className={billing === 'yearly' ? 'active-toggle' : ''} 
              onClick={() => setBilling('yearly')}
            >
              Yearly Access <span className="green-discount-badge">Save up to 32%</span>
            </button>
          </div>

          <p className="billing-frequency-text">
            {billing === 'monthly'
              ? 'Billed monthly. Pause or adjust tier configuration at any point.'
              : 'Billed annually — gives you access to full optimization cycles.'}
          </p>

          <div className="pricing-cards-wrapper-grid">
            {PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} billing={billing} />
            ))}
          </div>
        </div>
      </section>

      {/* ── NEW HANDCRAFTED FAQ ACCORDION SECTION ── */}
      <section className="faq-accordion-section">
        <div className="container-inner" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <span className="section-preheadline" style={{ textAlign: 'center', display: 'block' }}>Common Questions</span>
          <h2 className="section-main-headline" style={{ textAlign: 'center', marginBottom: '40px' }}>Frequently Asked Questions</h2>
          
          <div className="faq-stack-container">
            {FAQ_ITEMS.map((item, idx) => {
              const isCurrent = activeFaq === idx;
              return (
                <div key={idx} className={`faq-row-item ${isCurrent ? 'open' : ''}`}>
                  <div className="faq-question-bar" onClick={() => setActiveFaq(isCurrent ? null : idx)}>
                    <span>{item.q}</span>
                    <span className="faq-chevron">{isCurrent ? '−' : '+'}</span>
                  </div>
                  {isCurrent && (
                    <div className="faq-answer-panel">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONCLUDING CTA FOOTER SECTION ── */}
      <section className="final-action-footer">
        <div className="container-inner" style={{ textAlign: 'center' }}>
          <h2>Fix your structural layout issues in less than 30 seconds</h2>
          <p>Analyze your background document to resolve hidden text parser conflicts and catch missing keyword metrics.</p>
          <Link to="/register" className="btn-solid-cta large-cta-variant">
            Run Initial Resume Scan Now
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;