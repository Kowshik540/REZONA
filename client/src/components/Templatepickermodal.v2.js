// client/src/components/TemplatePickerModal.js
// PRODUCTION GRADE — Template selection and preview modal
// Enterprise-ready with proper state management and accessibility

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './TemplatePickerModal.v2.css';

const RESUME_TEMPLATES = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Clean, contemporary design with accent colors',
    isPremium: false,
    accentColor: '#6366f1',
  },
  {
    id: 'elegant-dark',
    name: 'Elegant Dark',
    description: 'Sophisticated dark mode for tech professionals',
    isPremium: false,
    accentColor: '#ec4899',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Timeless minimal design with maximum clarity',
    isPremium: false,
    accentColor: '#10b981',
  },
  {
    id: 'executive-pro',
    name: 'Executive Pro',
    description: 'Premium corporate template with premium features',
    isPremium: true,
    accentColor: '#f59e0b',
  },
  {
    id: 'creative-edge',
    name: 'Creative Edge',
    description: 'Bold, modern design for creative professionals',
    isPremium: true,
    accentColor: '#f97316',
  },
  {
    id: 'tech-minimal',
    name: 'Tech Minimal',
    description: 'Developer-focused template with code styling',
    isPremium: true,
    accentColor: '#06b6d4',
  },
];

const TemplatePickerModal = ({
  tailoredResult,
  jobTitle,
  jobDescription,
  originalResume,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('modern-blue');
  const [previewHtml, setPreviewHtml] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Load template preview on mount or selection change
  useEffect(() => {
    loadPreview();
  }, [selectedTemplate]);

  const loadPreview = async () => {
    try {
      // In production, fetch preview from backend
      // For now, generate a simple preview
      const template = RESUME_TEMPLATES.find(
        (t) => t.id === selectedTemplate
      );

      const previewMarkup = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
            }
            .resume-container {
              background: white;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              border-top: 4px solid ${template?.accentColor || '#6366f1'};
            }
            .header {
              border-bottom: 2px solid ${template?.accentColor || '#6366f1'};
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .name {
              font-size: 28px;
              font-weight: 700;
              color: #1a1a1a;
              margin: 0;
            }
            .title {
              color: ${template?.accentColor || '#6366f1'};
              font-size: 14px;
              font-weight: 600;
              letter-spacing: 0.5px;
              margin: 5px 0 0;
            }
            .section-title {
              font-size: 14px;
              font-weight: 700;
              color: ${template?.accentColor || '#6366f1'};
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 25px 0 10px;
              padding-top: 15px;
              border-top: 1px solid #e0e0e0;
            }
            .section-title:first-of-type {
              border-top: none;
            }
            .bullet {
              margin: 8px 0;
              color: #333;
              font-size: 13px;
            }
            .skill-tag {
              display: inline-block;
              background: ${template?.accentColor || '#6366f1'}20;
              color: ${template?.accentColor || '#6366f1'};
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 12px;
              margin-right: 6px;
              margin-bottom: 6px;
            }
            .template-name {
              text-align: center;
              color: #666;
              margin-top: 30px;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="resume-container">
            <div class="header">
              <h1 class="name">Tailored Resume</h1>
              <p class="title">${jobTitle}</p>
            </div>
            
            <div class="section-title">Summary</div>
            <p style="color: #555; font-size: 13px;">
              ${jobTitle} with skills tailored to match this opportunity.
            </p>
            
            <div class="section-title">Skills</div>
            <div>
              ${(tailoredResult?.suggestedSkills || [])
                .slice(0, 8)
                .map((skill) => `<span class="skill-tag">${skill}</span>`)
                .join('')}
            </div>
            
            <div class="section-title">Experience</div>
            <p class="bullet">• Customized to match ${jobTitle} requirements</p>
            <p class="bullet">• Aligned with job description keywords</p>
            
            <div class="template-name">Template: ${template?.name}</div>
          </div>
        </body>
        </html>
      `;

      setPreviewHtml(previewMarkup);
    } catch (err) {
      console.error('Failed to load preview:', err);
    }
  };

  const handleDownload = async () => {
    if (!tailoredResult) return;

    setDownloading(true);
    setDownloadError('');

    try {
      const payload = {
        resumeId: originalResume._id,
        templateId: selectedTemplate,
        jobTitle,
      };

      const response = await api.post('/resume/download', payload, {
        responseType: 'blob',
      });

      // Create blob and download
      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `resume_${jobTitle.replace(/\s+/g, '_')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Close modal after successful download
      setTimeout(() => onClose(), 500);
    } catch (err) {
      setDownloadError(
        err.response?.data?.error ||
          err.message ||
          'Download failed. Please try again.'
      );
    } finally {
      setDownloading(false);
    }
  };

  const selectedTemplateObj = RESUME_TEMPLATES.find(
    (t) => t.id === selectedTemplate
  );

  return (
    <div className="tpicker-overlay" role="dialog" aria-modal="true" aria-labelledby="tpicker-title">
      <div className={`tpicker-modal ${showPreview ? 'tpicker-modal--wide' : ''}`}>
        {/* ── HEADER ── */}
        <div className="tpicker-header">
          <div className="tpicker-header__left">
            {showPreview && (
              <button
                className="tpicker-back"
                onClick={() => setShowPreview(false)}
                title="Back to template selection"
              >
                ← Back
              </button>
            )}
            <div>
              <h2 className="tpicker-title" id="tpicker-title">
                {showPreview ? 'Preview Resume' : 'Choose Template'}
              </h2>
              <p className="tpicker-subtitle">
                {showPreview
                  ? `Preview of "${selectedTemplateObj?.name}" template`
                  : 'Select a professional template to download your tailored resume'}
              </p>
            </div>
          </div>
          <button
            className="tpicker-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* ── VALUE BANNER ── */}
        {!showPreview && (
          <div className="tpicker-value-banner">
            <span aria-hidden="true">✨</span>
            <p>
              Each template is professionally designed and optimized for ATS
              compatibility. Download as PDF and submit directly to employers.
            </p>
          </div>
        )}

        {/* ── TEMPLATE GRID OR PREVIEW ── */}
        {!showPreview ? (
          <div className="tpicker-body">
            <div className="tpicker-grid">
              {RESUME_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  className={`tpicker-card ${
                    selectedTemplate === template.id ? 'tpicker-card--active' : ''
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                  style={{ '--tmpl-accent': template.accentColor }}
                  aria-pressed={selectedTemplate === template.id}
                  aria-label={`${template.name} - ${template.description}`}
                >
                  {selectedTemplate === template.id && (
                    <div className="tpicker-card__check">✓</div>
                  )}

                  {template.isPremium && (
                    <div className="tpicker-card__tag">Premium</div>
                  )}

                  {/* Template Mockup */}
                  <div className="tpicker-mock">
                    <div className="tpicker-mock__header">
                      <div className="tpicker-mock__name" />
                      <div className="tpicker-mock__role" />
                      <div
                        className="tpicker-mock__accent"
                        style={{
                          background: template.accentColor,
                        }}
                      />
                    </div>
                    <div className="tpicker-mock__body">
                      <div className="tpicker-mock__line" />
                      <div className="tpicker-mock__line" />
                      <div className="tpicker-mock__line" />
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="tpicker-card__info">
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="tpicker-preview-wrap">
            {previewHtml && (
              <iframe
                className="tpicker-iframe"
                srcDoc={previewHtml}
                title="Resume preview"
              />
            )}
          </div>
        )}

        {/* ── DOWNLOAD NOTE ── */}
        {!showPreview && (
          <div className="tpicker-download-note">
            💡 Click to select a template, then preview and download your
            tailored PDF
          </div>
        )}

        {/* ── ERROR MESSAGE ── */}
        {downloadError && (
          <div className="tpicker-error" role="alert">
            <span>⚠ {downloadError}</span>
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div className="tpicker-actions">
          <button
            className="tpicker-btn-ghost"
            onClick={() => (showPreview ? setShowPreview(false) : onClose())}
            disabled={downloading}
          >
            {showPreview ? 'Back' : 'Cancel'}
          </button>

          {!showPreview ? (
            <button
              className="tpicker-btn-primary"
              onClick={() => setShowPreview(true)}
              disabled={downloading}
            >
              👁 Preview
            </button>
          ) : (
            <button
              className="tpicker-btn-primary"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <span className="tpicker-spinner" />
                  Downloading…
                </>
              ) : (
                <>
                  <span aria-hidden="true">📥</span>
                  Download PDF
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatePickerModal;