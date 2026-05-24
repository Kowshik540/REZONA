// client/src/components/TemplatePickerModal.js
// Enhanced: Full resume generation with template selection, live preview, and PDF download

import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import './TemplatePickerModal.css';

// All 30 templates — 6 free + 24 premium (elite/exclusive/admin)
const ALL_RESUME_TEMPLATES = [
  // ─── FREE TEMPLATES (7) ─────────────────────────────────────────────────────
  { id: 'clean-entry', name: 'Clean Entry Level', description: 'Minimal single-column — perfect for freshers & entry-level', tier: 'free', accentColor: '#323232', headerBg: '#ffffff', headerText: '#141414', bodyBg: '#ffffff', bodyText: '#1e1e1e', sectionColor: '#141414' },
  { id: 'modern-blue', name: 'Modern Blue', description: 'Clean with indigo accents — ideal for tech roles', tier: 'free', accentColor: '#6366f1', headerBg: '#6366f1', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#1a1a2e', sectionColor: '#6366f1' },
  { id: 'elegant-green', name: 'Elegant Green', description: 'Sophisticated & professional — great for senior roles', tier: 'free', accentColor: '#10b981', headerBg: '#064e3b', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#1a1a1a', sectionColor: '#059669' },
  { id: 'minimal-white', name: 'Minimal White', description: 'Timeless, maximum ATS compatibility', tier: 'free', accentColor: '#374151', headerBg: '#f9fafb', headerText: '#111827', bodyBg: '#ffffff', bodyText: '#374151', sectionColor: '#111827' },
  { id: 'executive-dark', name: 'Executive Dark', description: 'Bold & authoritative — leadership positions', tier: 'free', accentColor: '#f59e0b', headerBg: '#1e1b4b', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#1e1b4b', sectionColor: '#d97706' },
  { id: 'creative-pink', name: 'Creative Edge', description: 'Bold for creative & design roles', tier: 'free', accentColor: '#ec4899', headerBg: '#831843', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#1f2937', sectionColor: '#db2777' },
  { id: 'tech-cyan', name: 'Tech Minimal', description: 'Developer-focused — clean code aesthetic', tier: 'free', accentColor: '#06b6d4', headerBg: '#0c4a6e', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#0f172a', sectionColor: '#0284c7' },
  // ─── ELITE TEMPLATES (8) ────────────────────────────────────────────────────
  { id: 'corporate-navy', name: 'Corporate Navy', description: 'Enterprise-grade for Fortune 500 applications', tier: 'elite', accentColor: '#3b82f6', headerBg: '#0f172a', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#1e293b', sectionColor: '#2563eb' },
  { id: 'slate-professional', name: 'Slate Professional', description: 'Understated elegance for consulting roles', tier: 'elite', accentColor: '#64748b', headerBg: '#334155', headerText: '#f8fafc', bodyBg: '#ffffff', bodyText: '#1e293b', sectionColor: '#475569' },
  { id: 'ruby-bold', name: 'Ruby Bold', description: 'High-impact design for sales & marketing', tier: 'elite', accentColor: '#dc2626', headerBg: '#7f1d1d', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#1c1917', sectionColor: '#b91c1c' },
  { id: 'emerald-classic', name: 'Emerald Classic', description: 'Refined green for finance & banking', tier: 'elite', accentColor: '#10b981', headerBg: '#065f46', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#141414', sectionColor: '#047857' },
  { id: 'sunset-warm', name: 'Sunset Warm', description: 'Warm tones for product & UX roles', tier: 'elite', accentColor: '#ea580c', headerBg: '#7c2d12', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#292524', sectionColor: '#c2410c' },
  { id: 'violet-luxe', name: 'Violet Luxe', description: 'Premium purple for creative directors', tier: 'elite', accentColor: '#8b5cf6', headerBg: '#4c1d95', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#1e1b4b', sectionColor: '#6d28d9' },
  { id: 'midnight-gold', name: 'Midnight Gold', description: 'Luxury dark with gold accents — C-suite ready', tier: 'elite', accentColor: '#ca8a04', headerBg: '#111827', headerText: '#fde68a', bodyBg: '#ffffff', bodyText: '#1c1917', sectionColor: '#a16207' },
  { id: 'arctic-frost', name: 'Arctic Frost', description: 'Light & airy for healthcare & education', tier: 'elite', accentColor: '#0ea5e9', headerBg: '#e0f2fe', headerText: '#0c4a6e', bodyBg: '#ffffff', bodyText: '#0f172a', sectionColor: '#0369a1' },
  // ─── EXCLUSIVE TEMPLATES (8) ────────────────────────────────────────────────
  { id: 'charcoal-sharp', name: 'Charcoal Sharp', description: 'Monochrome precision for architects & engineers', tier: 'exclusive', accentColor: '#a1a1aa', headerBg: '#18181b', headerText: '#fafafa', bodyBg: '#ffffff', bodyText: '#27272a', sectionColor: '#3f3f46' },
  { id: 'ocean-deep', name: 'Ocean Deep', description: 'Deep blue for data science & analytics', tier: 'exclusive', accentColor: '#38bdf8', headerBg: '#075985', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#0c4a6e', sectionColor: '#0e7490' },
  { id: 'forest-earth', name: 'Forest Earth', description: 'Natural tones for sustainability & NGO roles', tier: 'exclusive', accentColor: '#22c55e', headerBg: '#14532d', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#164e63', sectionColor: '#15803d' },
  { id: 'rose-elegant', name: 'Rose Elegant', description: 'Sophisticated rose for fashion & luxury brands', tier: 'exclusive', accentColor: '#f43f5e', headerBg: '#881337', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#404040', sectionColor: '#be123c' },
  { id: 'platinum-exec', name: 'Platinum Executive', description: 'Ultra-clean for VP & Director positions', tier: 'exclusive', accentColor: '#475569', headerBg: '#f1f5f9', headerText: '#0f172a', bodyBg: '#ffffff', bodyText: '#1e293b', sectionColor: '#334155' },
  { id: 'indigo-night', name: 'Indigo Night', description: 'Deep indigo for AI & ML researchers', tier: 'exclusive', accentColor: '#818cf8', headerBg: '#312e81', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#1e1b4b', sectionColor: '#4338ca' },
  { id: 'copper-vintage', name: 'Copper Vintage', description: 'Warm copper for media & journalism', tier: 'exclusive', accentColor: '#b45309', headerBg: '#451a03', headerText: '#fdba74', bodyBg: '#ffffff', bodyText: '#292524', sectionColor: '#92400e' },
  { id: 'teal-modern', name: 'Teal Modern', description: 'Fresh teal for startup & growth roles', tier: 'exclusive', accentColor: '#14b8a6', headerBg: '#134e4a', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#111827', sectionColor: '#0f766e' },
  // ─── ADMIN TEMPLATES (8) ────────────────────────────────────────────────────
  { id: 'sapphire-royal', name: 'Sapphire Royal', description: 'Royal blue for government & defense', tier: 'admin', accentColor: '#60a5fa', headerBg: '#1e3a8a', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#172554', sectionColor: '#1d4ed8' },
  { id: 'obsidian-elite', name: 'Obsidian Elite', description: 'Pure black for maximum authority', tier: 'admin', accentColor: '#d4d4d8', headerBg: '#09090b', headerText: '#fafafa', bodyBg: '#ffffff', bodyText: '#18181b', sectionColor: '#71717a' },
  { id: 'crimson-power', name: 'Crimson Power', description: 'Deep red for executive leadership', tier: 'admin', accentColor: '#ef4444', headerBg: '#67070f', headerText: '#ffffff', bodyBg: '#ffffff', bodyText: '#1c1917', sectionColor: '#991b1b' },
  { id: 'aurora-gradient', name: 'Aurora Gradient', description: 'Vibrant purple for creative tech leads', tier: 'admin', accentColor: '#a855f7', headerBg: '#310a65', headerText: '#e879f9', bodyBg: '#ffffff', bodyText: '#1e1b4b', sectionColor: '#7e22ce' },
  { id: 'titanium-pro', name: 'Titanium Pro', description: 'Industrial strength for engineering managers', tier: 'admin', accentColor: '#a1a1aa', headerBg: '#3f3f46', headerText: '#e4e4e7', bodyBg: '#ffffff', bodyText: '#27272a', sectionColor: '#52525b' },
  { id: 'jade-harmony', name: 'Jade Harmony', description: 'Balanced green for wellness & biotech', tier: 'admin', accentColor: '#4ade80', headerBg: '#052e16', headerText: '#bbf7d0', bodyBg: '#ffffff', bodyText: '#14532d', sectionColor: '#16a34a' },
  { id: 'steel-minimal', name: 'Steel Minimal', description: 'Ultra-minimal for principal engineers', tier: 'admin', accentColor: '#334155', headerBg: '#e2e8f0', headerText: '#0f172a', bodyBg: '#ffffff', bodyText: '#1e293b', sectionColor: '#1e293b' },
  { id: 'amber-prestige', name: 'Amber Prestige', description: 'Golden amber for luxury & hospitality', tier: 'admin', accentColor: '#f59e0b', headerBg: '#422006', headerText: '#fcd34d', bodyBg: '#ffffff', bodyText: '#292524', sectionColor: '#b45309' },
  // ─── CLEAN PROFESSIONAL TEMPLATES ───────────────────────────────────────────
  { id: 'classic-serif', name: 'Classic Professional', description: 'Serif font, horizontal rules — traditional corporate style', tier: 'elite', accentColor: '#505050', headerBg: '#ffffff', headerText: '#191919', bodyBg: '#ffffff', bodyText: '#232323', sectionColor: '#191919' },
  { id: 'harvard-clean', name: 'Harvard Clean', description: 'Clean sans-serif with bold headers — academic & consulting', tier: 'elite', accentColor: '#282828', headerBg: '#ffffff', headerText: '#0f0f0f', bodyBg: '#ffffff', bodyText: '#1e1e1e', sectionColor: '#0f0f0f' },
  { id: 'wall-street', name: 'Wall Street', description: 'Serif, dense, professional — finance & investment banking', tier: 'exclusive', accentColor: '#3c3c3c', headerBg: '#ffffff', headerText: '#0a0a0a', bodyBg: '#ffffff', bodyText: '#191919', sectionColor: '#0a0a0a' },
];

// ─── Build preview HTML from resume data ─────────────────────────────────────
function buildPreviewHtml(template, resumeData) {
  const t = template;
  if (!resumeData) return '<p style="padding:40px;color:#888;">Generating preview...</p>';

  const contactParts = [
    resumeData.email, resumeData.phone, resumeData.location,
    resumeData.linkedin, resumeData.github
  ].filter(Boolean);

  const skillsHtml = (resumeData.skills || [])
    .map(s => `<span class="skill-tag">${s}</span>`).join('');

  const expHtml = (resumeData.experience || []).map(exp => `
    <div class="exp-item">
      <div class="exp-header">
        <span class="exp-role">${exp.role || ''}</span>
        ${exp.company ? `<span class="exp-company"> — ${exp.company}</span>` : ''}
      </div>
      ${exp.duration ? `<div class="exp-duration">${exp.duration}</div>` : ''}
      ${exp.bullets ? `<ul class="exp-bullets">${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const projHtml = (resumeData.projects || []).map(p => `
    <div class="proj-item">
      <span class="proj-name">${p.name || ''}</span>
      ${p.tech ? `<span class="proj-tech">[${p.tech}]</span>` : ''}
      ${p.description ? `<p class="proj-desc">${p.description}</p>` : ''}
    </div>
  `).join('');

  const eduHtml = (resumeData.education || []).map(e => `
    <div class="edu-item">
      <div class="edu-degree">${e.degree || ''}</div>
      <div class="edu-inst">${[e.institution, e.year].filter(Boolean).join(' — ')}</div>
      ${e.details ? `<div class="edu-details">${e.details}</div>` : ''}
    </div>
  `).join('');

  const certHtml = (resumeData.certifications || [])
    .map(c => `<li>${c}</li>`).join('');

  return `<!DOCTYPE html><html><head><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', -apple-system, sans-serif; background: #f0f2f5; padding: 24px; }
    .page { background: ${t.bodyBg}; max-width: 800px; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 2px; }
    .header { background: ${t.headerBg}; color: ${t.headerText}; padding: 36px 40px 28px; }
    .name { font-size: 28px; font-weight: 800; margin-bottom: 6px; letter-spacing: -0.3px; }
    .contact { font-size: 10px; opacity: 0.85; letter-spacing: 0.02em; }
    .body { padding: 32px 40px; color: ${t.bodyText}; }
    .section { margin-bottom: 26px; }
    .section-title { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; color: ${t.sectionColor}; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid ${t.accentColor}30; }
    .summary { font-size: 13px; line-height: 1.75; color: ${t.bodyText}; }
    .skills-wrap { display: flex; flex-wrap: wrap; gap: 7px; }
    .skill-tag { padding: 4px 11px; border-radius: 4px; font-size: 11.5px; font-weight: 600; background: ${t.accentColor}12; color: ${t.accentColor}; border: 1px solid ${t.accentColor}35; }
    .exp-item { margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #f0f0f0; }
    .exp-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .exp-header { display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px; }
    .exp-role { font-size: 14px; font-weight: 700; color: ${t.bodyText}; }
    .exp-company { color: ${t.sectionColor}; font-weight: 600; font-size: 13px; }
    .exp-duration { font-size: 11px; color: #888; margin: 3px 0 8px; }
    .exp-bullets { padding-left: 18px; margin: 0; }
    .exp-bullets li { font-size: 12.5px; line-height: 1.7; margin-bottom: 4px; color: ${t.bodyText}; }
    .proj-item { margin-bottom: 12px; }
    .proj-name { font-weight: 700; font-size: 13px; color: ${t.bodyText}; }
    .proj-tech { font-size: 11px; color: #888; margin-left: 8px; }
    .proj-desc { font-size: 12px; line-height: 1.6; margin-top: 3px; color: #555; }
    .edu-item { margin-bottom: 12px; }
    .edu-degree { font-weight: 700; font-size: 13px; color: ${t.bodyText}; }
    .edu-inst { font-size: 12px; color: #666; margin-top: 2px; }
    .edu-details { font-size: 11px; color: #888; margin-top: 2px; }
    @media print { body { background: white; padding: 0; } .page { box-shadow: none; } }
  </style></head><body><div class="page">
    <div class="header">
      <div class="name">${resumeData.name || 'Candidate'}</div>
      <div class="contact">${contactParts.join('  •  ')}</div>
    </div>
    <div class="body">
      ${resumeData.summary ? `<div class="section"><div class="section-title">Professional Summary</div><p class="summary">${resumeData.summary}</p></div>` : ''}
      ${skillsHtml ? `<div class="section"><div class="section-title">Technical Skills</div><div class="skills-wrap">${skillsHtml}</div></div>` : ''}
      ${expHtml ? `<div class="section"><div class="section-title">Professional Experience</div>${expHtml}</div>` : ''}
      ${projHtml ? `<div class="section"><div class="section-title">Projects</div>${projHtml}</div>` : ''}
      ${eduHtml ? `<div class="section"><div class="section-title">Education</div>${eduHtml}</div>` : ''}
      ${certHtml ? `<div class="section"><div class="section-title">Certifications</div><ul style="padding-left:18px;margin:0;">${certHtml}</ul></div>` : ''}
    </div>
  </div></body></html>`;
}

// ─── Template Card Mockup ─────────────────────────────────────────────────────
function TemplateMockup({ template, selected, onSelect }) {
  const t = template;
  const tierLabel = t.tier !== 'free' ? t.tier.charAt(0).toUpperCase() + t.tier.slice(1) : null;
  const tierColors = { elite: '#f59e0b', exclusive: '#8b5cf6', admin: '#ef4444' };

  return (
    <button
      className={`tpicker-card ${selected ? 'tpicker-card--active' : ''}`}
      onClick={() => onSelect(t.id)}
      style={{ '--tmpl-accent': t.accentColor }}
      aria-pressed={selected}
    >
      {selected && <div className="tpicker-card__check">✓</div>}
      {tierLabel && (
        <div className="tpicker-card__tag" style={{ background: tierColors[t.tier] || '#6366f1' }}>
          {tierLabel}
        </div>
      )}
      {/* Realistic resume mockup */}
      <div className="tpicker-mock" style={{ background: '#fff', padding: '12px 10px' }}>
        {/* Header area */}
        <div style={{ marginBottom: 8, paddingBottom: 6, borderBottom: `2px solid ${t.accentColor}` }}>
          <div style={{ height: 8, borderRadius: 2, background: t.headerBg === '#ffffff' ? '#1a1a1a' : t.headerBg, width: '55%', marginBottom: 4 }} />
          <div style={{ height: 4, borderRadius: 1, background: '#ccc', width: '80%' }} />
        </div>
        {/* Summary */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ height: 3, background: '#e5e7eb', width: '100%', marginBottom: 2 }} />
          <div style={{ height: 3, background: '#e5e7eb', width: '90%', marginBottom: 2 }} />
          <div style={{ height: 3, background: '#e5e7eb', width: '70%' }} />
        </div>
        {/* Skills */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ height: 5, borderRadius: 1, background: t.accentColor + '40', width: '30%', marginBottom: 4 }} />
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {[28, 35, 22, 30, 25].map((w, i) => (
              <div key={i} style={{ height: 8, borderRadius: 2, background: t.accentColor + '20', border: `1px solid ${t.accentColor}30`, width: w }} />
            ))}
          </div>
        </div>
        {/* Experience */}
        <div>
          <div style={{ height: 5, borderRadius: 1, background: t.accentColor + '40', width: '35%', marginBottom: 4 }} />
          <div style={{ height: 4, background: '#374151', width: '50%', marginBottom: 3, borderRadius: 1 }} />
          <div style={{ paddingLeft: 6 }}>
            <div style={{ height: 3, background: '#e5e7eb', width: '95%', marginBottom: 2 }} />
            <div style={{ height: 3, background: '#e5e7eb', width: '85%', marginBottom: 2 }} />
            <div style={{ height: 3, background: '#e5e7eb', width: '90%' }} />
          </div>
        </div>
      </div>
      <div className="tpicker-card__info">
        <h3>{t.name}</h3>
        <p>{t.description}</p>
      </div>
    </button>
  );
}

// ─── Animated Generating Step ─────────────────────────────────────────────────
function GeneratingStep({ index, label }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setActive(true), index * 2200);
    return () => clearTimeout(timer);
  }, [index]);
  return (
    <div className={`gen-step ${active ? 'active' : ''}`}>
      <span className="gen-dot"></span> {label}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const TemplatePickerModal = ({ resumeId, jobTitle, jobDescription, skills, onClose }) => {
  const [selectedId, setSelectedId] = useState('clean-entry');
  const [step, setStep] = useState('pick'); // 'pick' | 'details' | 'generating' | 'preview'
  const [resumeData, setResumeData] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState(ALL_RESUME_TEMPLATES.filter(t => t.tier === 'free'));
  const [userPlan, setUserPlan] = useState('free');
  const [totalTemplates, setTotalTemplates] = useState(30);

  // Contact details form
  const [contactDetails, setContactDetails] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
  });

  const selectedTemplate = availableTemplates.find(t => t.id === selectedId) || ALL_RESUME_TEMPLATES[0];

  // Fetch available templates based on user plan
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await api.get('/resume/templates');
        if (data.success && data.templates) {
          const templateIds = data.templates.map(t => t.id);
          const filtered = ALL_RESUME_TEMPLATES.filter(t => templateIds.includes(t.id));
          setAvailableTemplates(filtered.length > 0 ? filtered : ALL_RESUME_TEMPLATES.filter(t => t.tier === 'free'));
          setUserPlan(data.plan || 'free');
          setTotalTemplates(data.totalAvailable || 30);
        }
      } catch (err) {
        setAvailableTemplates(ALL_RESUME_TEMPLATES.filter(t => t.tier === 'free'));
      }
    };
    fetchTemplates();
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Rebuild preview when template or data changes
  useEffect(() => {
    if (resumeData && selectedTemplate) {
      setPreviewHtml(buildPreviewHtml(selectedTemplate, resumeData));
    }
  }, [selectedId, resumeData, selectedTemplate]);

  const isGeneralOptimize = !jobTitle && !jobDescription;

  // After template selection, go to details step
  const handleNextToDetails = () => {
    setStep('details');
  };

  // Generate the resume with user-provided contact details
  const handleGenerate = async () => {
    if (!contactDetails.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    setStep('generating');
    setError('');
    try {
      const payload = {
        resumeId,
        jobTitle: jobTitle || 'General ATS-Optimized Resume',
        jobDescription: jobDescription || 'Create a highly ATS-optimized version of this resume. Focus on strong action verbs, quantified achievements, proper section structure, and keyword density. Make it suitable for any software/tech role the candidate is qualified for based on their existing experience.',
        templateId: selectedId,
        contactDetails, // Send user's contact info to server
      };

      const { data } = await api.post('/resume/generate-preview', payload, { timeout: 60000 });

      if (!data.success) throw new Error(data.error || 'Generation failed');
      
      // Override AI-extracted contact info with user-provided details
      const finalData = { ...data.resumeData };
      if (contactDetails.name.trim()) finalData.name = contactDetails.name.trim();
      if (contactDetails.email.trim()) finalData.email = contactDetails.email.trim();
      if (contactDetails.phone.trim()) finalData.phone = contactDetails.phone.trim();
      if (contactDetails.location.trim()) finalData.location = contactDetails.location.trim();
      if (contactDetails.linkedin.trim()) finalData.linkedin = contactDetails.linkedin.trim();
      if (contactDetails.github.trim()) finalData.github = contactDetails.github.trim();
      
      setResumeData(finalData);
      setStep('preview');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.limitReached) {
        setError(`⚠️ ${errData.error}`);
      } else {
        setError(errData?.error || err.message || 'Failed to generate resume');
      }
      setStep('details');
    }
  };

  // Download PDF from server
  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await api.post('/resume/generate', {
        resumeId,
        jobTitle: jobTitle || 'ATS-Optimized Resume',
        jobDescription: jobDescription || 'Create a highly ATS-optimized version of this resume. Focus on strong action verbs, quantified achievements, proper section structure, and keyword density. Make it suitable for any software/tech role the candidate is qualified for based on their existing experience.',
        templateId: selectedId,
        contactDetails,
      }, {
        responseType: 'blob',
        timeout: 60000,
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (contactDetails.name || jobTitle || 'ATS_Optimized_Resume').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      a.download = `Resume_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('PDF download failed. Please try again.');
    }
    setDownloading(false);
  };

  // Print from iframe
  const handlePrint = () => {
    const iframe = document.getElementById('tpicker-preview-frame');
    if (iframe) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="tpicker-overlay" role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`tpicker-modal ${step === 'preview' ? 'tpicker-modal--wide' : ''}`}>

        {/* Header */}
        <div className="tpicker-header">
          <div className="tpicker-header__left">
            {step === 'preview' && (
              <button className="tpicker-back" onClick={() => setStep('pick')}>← Templates</button>
            )}
            <div>
              <h2 className="tpicker-title">
                {step === 'pick' && 'Choose a Resume Template'}
                {step === 'details' && 'Confirm Your Details'}
                {step === 'generating' && 'Generating Your Resume...'}
                {step === 'preview' && `Preview — ${selectedTemplate?.name}`}
              </h2>
              <p className="tpicker-subtitle">
                {step === 'pick' && (isGeneralOptimize
                  ? 'Your resume will be rebuilt with maximum ATS compatibility — strong verbs, metrics, proper structure, and keyword density.'
                  : `Your resume will be rebuilt from scratch using your original content, optimized for "${jobTitle}"`)}
                {step === 'details' && 'These details will appear at the top of your resume PDF. Please verify they are correct.'}
                {step === 'generating' && 'AI is restructuring your resume with ATS-optimized formatting and targeted keywords...'}
                {step === 'preview' && 'Your new resume is ready. Download as PDF or print directly.'}
              </p>
            </div>
          </div>
          <button className="tpicker-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Step: Template Selection */}
        {step === 'pick' && (
          <>

            <div className="tpicker-body">
              <div className="tpicker-grid">
                {availableTemplates.map(t => (
                  <TemplateMockup
                    key={t.id}
                    template={t}
                    selected={selectedId === t.id}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
              {availableTemplates.length < totalTemplates && (
                <div className="tpicker-upgrade-banner">
                  <span>🔒</span>
                  <p>
                    You have access to <strong>{availableTemplates.length}</strong> of <strong>{totalTemplates}</strong> templates.
                    Upgrade to <strong>{userPlan === 'free' || userPlan === 'starter' || userPlan === 'pro' || userPlan === 'growth' ? 'Elite' : 'Exclusive'}</strong> to unlock {totalTemplates - availableTemplates.length} more premium templates with advanced layouts.
                  </p>
                </div>
              )}
            </div>

            {error && <div className="tpicker-error">⚠ {error}</div>}

            <div className="tpicker-actions">
              <button className="tpicker-btn-ghost" onClick={onClose}>Cancel</button>
              <button className="tpicker-btn-primary" onClick={handleNextToDetails}>
                Next: Enter Your Details →
              </button>
            </div>
          </>
        )}

        {/* Step: Contact Details */}
        {step === 'details' && (
          <div className="tpicker-body" style={{ padding: '24px 32px' }}>
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kowshik Thota"
                    value={contactDetails.name}
                    onChange={(e) => setContactDetails(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f0f0f8', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={contactDetails.email}
                      onChange={(e) => setContactDetails(prev => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f0f0f8', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={contactDetails.phone}
                      onChange={(e) => setContactDetails(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f0f0f8', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad, India"
                    value={contactDetails.location}
                    onChange={(e) => setContactDetails(prev => ({ ...prev, location: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f0f0f8', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      LinkedIn URL
                    </label>
                    <input
                      type="text"
                      placeholder="linkedin.com/in/yourname"
                      value={contactDetails.linkedin}
                      onChange={(e) => setContactDetails(prev => ({ ...prev, linkedin: e.target.value }))}
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f0f0f8', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      GitHub URL
                    </label>
                    <input
                      type="text"
                      placeholder="github.com/username"
                      value={contactDetails.github}
                      onChange={(e) => setContactDetails(prev => ({ ...prev, github: e.target.value }))}
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f0f0f8', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {error && <div className="tpicker-error" style={{ marginTop: 16 }}>⚠ {error}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button className="tpicker-btn-ghost" onClick={() => setStep('pick')}>
                  ← Back
                </button>
                <button className="tpicker-btn-primary" onClick={handleGenerate}>
                  {isGeneralOptimize ? '⚡ Generate Resume' : '🚀 Generate Resume'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="tpicker-generating">
            <div className="tpicker-generating__spinner"></div>
            <div className="tpicker-generating__steps">
              <GeneratingStep index={0} label="Analyzing your original resume content" />
              <GeneratingStep index={1} label="Matching keywords to job description" />
              <GeneratingStep index={2} label="Restructuring sections for ATS optimization" />
              <GeneratingStep index={3} label={`Applying ${selectedTemplate?.name} template`} />
              <GeneratingStep index={4} label="Generating professional PDF layout" />
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="tpicker-preview-wrap">
            <div className="tpicker-preview-toolbar">
              <div className="tpicker-template-switcher">
                <label>Template:</label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  {availableTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}{t.tier !== 'free' ? ` (${t.tier})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="tpicker-preview-btns">
                <button className="tpicker-btn-ghost" onClick={handlePrint}>
                  🖨 Print
                </button>
                <button
                  className="tpicker-btn-primary"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                >
                  {downloading ? '⏳ Generating PDF...' : '📥 Download PDF'}
                </button>
              </div>
            </div>

            <div className="tpicker-iframe-wrap">
              {previewHtml && (
                <iframe
                  id="tpicker-preview-frame"
                  className="tpicker-iframe"
                  srcDoc={previewHtml}
                  title="Resume Preview"
                  sandbox="allow-same-origin allow-modals"
                />
              )}
            </div>

            {error && <div className="tpicker-error">⚠ {error}</div>}

            <div className="tpicker-download-note">
              💡 The PDF is generated server-side with professional formatting. No AI markers or watermarks — ready to submit directly to employers.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TemplatePickerModal;
