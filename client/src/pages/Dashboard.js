// client/src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import JobRecommendations from '../components/JobRecommendations';
import TailorResumeModal from '../components/TailorResumeModal';
import TemplatePickerModal from '../components/TemplatePickerModal';
import CreateResumeModal from '../components/CreateResumeModal';
import './Dashboard.css';

const ScoreCircle = ({ score }) => {
  const getStatusColor = () => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };
  const getStatusLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 45) return 'Fair';
    return 'Needs Work';
  };

  const themeColor = getStatusColor();

  return (
    <div className="resume-score-box" style={{ '--score-accent': themeColor }}>
      <div className="score-main-ring">
        <span className="score-value-digit">{score}</span>
        <span className="score-total-base">/100</span>
      </div>
      <span className="score-status-label">{getStatusLabel()}</span>
    </div>
  );
};

const CategoryBar = ({ label, icon, score, max, color, issues = [], checks = {} }) => {
  const pct = Math.round((score / max) * 100);
  const [open, setOpen] = useState(false);

  return (
    <div className={`analysis-accordion-row ${open ? 'expanded' : ''}`}>
      <div className="accordion-trigger-bar" onClick={() => setOpen(!open)}>
        <div className="accordion-meta-info">
          <span className="accordion-item-icon">{icon}</span>
          <span className="accordion-item-title">{label}</span>
        </div>
        <div className="accordion-metric-display">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
          <span className="progress-percentage-label" style={{ color }}>{pct}%</span>
          <span className="accordion-toggle-arrow">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="accordion-hidden-details">
          {issues.length > 0 && (
            <ul className="details-issue-bullet-list">
              {issues.map((issue, idx) => (
                <li key={idx}><span>⚠️</span> {issue}</li>
              ))}
            </ul>
          )}
          {checks.sectionsFound?.length > 0 && (
            <p className="status-note note-success">✓ Found sections: {checks.sectionsFound.join(', ')}</p>
          )}
          {checks.sectionsMissing?.length > 0 && (
            <p className="status-note note-error">✗ Missing sections: {checks.sectionsMissing.join(', ')}</p>
          )}
          {checks.buzzwords?.length > 0 && (
            <p className="status-note note-warning">! Consider changing generic phrases: {checks.buzzwords.join(', ')}</p>
          )}
          {issues.length === 0 && Object.keys(checks).length === 0 && (
            <p className="status-note note-success">✓ Section layout formatted cleanly.</p>
          )}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  const [uploadError, setUploadError] = useState('');

  const [showTailorModal, setShowTailorModal] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCreateResume, setShowCreateResume] = useState(false);
  const [tailoredJobTitle, tailoredJobTitleSet] = useState('');
  const [tailoredJobDesc, tailoredJobDescSet] = useState('');

  const fetchResumes = useCallback(async () => {
    try {
      const { data } = await api.get('/resume/history');
      const list = data.resumes || (Array.isArray(data) ? data : []);
      setResumes(list);
      if (list.length > 0 && !selectedResume) setSelectedResume(list[0]);
    } catch (err) {
      console.error('Error loading history:', err.message);
    }
  }, [selectedResume]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('resume', acceptedFiles[0]);

    try {
      const { data } = await api.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 minutes for upload + analysis
      });
      await fetchResumes();
      setSelectedResume({
        _id: data.resumeId,
        filename: acceptedFiles[0].name,
        atsScore: data.analysis?.score ?? 0,
        analysis: data.analysis,
        jobs: data.jobs,
        createdAt: new Date().toISOString(),
      });
      setActiveTab('analysis');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.limitReached) {
        setUploadError(`⚠️ ${errData.error} [${errData.currentPlan} plan — ${errData.used}/${errData.limit} used]`);
      } else {
        setUploadError(errData?.error || 'Could not parse the file.');
      }
    }
    setUploading(false);
  };

  const deleteResume = async (resumeId) => {
    if (!window.confirm('Delete this resume from your dashboard history?')) return;
    try {
      await api.delete(`/resume/${resumeId}`);
      const filtered = resumes.filter(r => r._id !== resumeId);
      setResumes(filtered);
      if (selectedResume?._id === resumeId) setSelectedResume(filtered[0] || null);
    } catch {
      alert('Could not complete deletion.');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
    disabled: uploading,
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        setUploadError('File too large. Maximum allowed size is 10 MB.');
      } else if (error?.code === 'file-invalid-type') {
        setUploadError('Only PDF files are accepted.');
      } else {
        setUploadError(error?.message || 'File rejected.');
      }
    },
  });

  const handleTailored = (result, jobTitle, jobDesc) => {
    tailoredJobTitleSet(jobTitle);
    tailoredJobDescSet(jobDesc);
    setShowTemplatePicker(true);
  };

  const guessJobTitle = (resume) => {
    const skills = resume?.analysis?.skillsDetected || [];
    if (skills.some(s => /react|angular|vue|next/i.test(s))) return 'Frontend Developer';
    if (skills.some(s => /node|express|django|spring/i.test(s))) return 'Backend Developer';
    if (skills.some(s => /python|ml|tensorflow/i.test(s))) return 'Data Scientist';
    return 'Software Engineer';
  };

  const truncate = (str = '', max = 24) => 
    str.length > max ? str.substring(0, max) + '...' : str;

  const analysis = selectedResume?.analysis || {};
  const breakdown = analysis.breakdown || {};

  return (
    <div className="dashboard-app-frame">
      <aside className="dashboard-sidebar-panel">
        <div className="sidebar-header-row">
          <h3>Saved Resumes</h3>
          <span className="history-count-tag">{resumes.length}</span>
        </div>

        <div {...getRootProps()} className={`sidebar-file-uploader ${isDragActive ? 'dragging' : ''}`}>
          <input {...getInputProps()} />
          {uploading ? (
            <div className="uploader-spinner-block">
              <div className="loading-spinner-ring" />
              <span>Checking formatting...</span>
            </div>
          ) : (
            <>
              <span className="uploader-label-text">{isDragActive ? 'Drop file here' : 'Upload Resume (PDF)'}</span>
              <small className="uploader-sub-text">Click or drag file directly</small>
            </>
          )}
        </div>

        {uploadError && <div className="uploader-error-banner">{uploadError}</div>}

        <div className="sidebar-history-list">
          {resumes.length === 0 ? (
            <div className="history-empty-message">
              <p>No resumes uploaded yet.</p>
            </div>
          ) : (
            resumes.map(resume => (
              <div
                key={resume._id}
                className={`history-card-item ${selectedResume?._id === resume._id ? 'active' : ''}`}
                onClick={() => { setSelectedResume(resume); setActiveTab('analysis'); }}
              >
                <div className="history-card-top">
                  <span className="history-card-name" title={resume.filename}>
                    {truncate(resume.filename || 'Untitled Resume')}
                  </span>
                  <button
                    className="history-card-remove"
                    onClick={(e) => { e.stopPropagation(); deleteResume(resume._id); }}
                  >×</button>
                </div>
                <div className="history-card-bottom">
                  <div className="history-mini-track">
                    <div className="history-mini-bar" style={{ width: `${resume.atsScore || 0}%` }} />
                  </div>
                  <span className="history-score-display">{resume.atsScore || 0}/100</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-user-section">
          <div className="user-info-text" title={user?.email}>
            <span>👤</span> {user?.name || user?.email}
          </div>
          <button onClick={logout} className="user-logout-btn">Logout</button>
        </div>
      </aside>

      <main className="dashboard-main-content">
        {selectedResume ? (
          <>
            <div className="main-workspace-header">
              <div className="header-title-area">
                <h2>{selectedResume.filename || 'Resume Document'}</h2>
                <div className="header-meta-tags">
                  <span>📝 {analysis.wordCount || 0} words</span>
                  <span className="tag-dot">•</span>
                  <span className="tag-status-active">Active Analysis</span>
                  {selectedResume.createdAt && (
                    <>
                      <span className="tag-dot">•</span>
                      <span>Uploaded {new Date(selectedResume.createdAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="header-actions-area">
                <button className="workspace-primary-btn" onClick={() => setShowTailorModal(true)}>
                  ✂️ Tailor to a Job
                </button>
                <button className="workspace-secondary-btn" onClick={() => {
                  tailoredJobTitleSet('');
                  tailoredJobDescSet('');
                  setShowTemplatePicker(true);
                }}>
                  ⚡ Optimize ATS
                </button>
                <button className="workspace-secondary-btn" onClick={() => setShowCreateResume(true)}>
                  📝 Create New
                </button>
                <ScoreCircle score={selectedResume.atsScore || 0} />
              </div>
            </div>

            <div className="workspace-tab-navbar">
              <button className={`tab-link-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
                Score Breakdown
              </button>
              <button className={`tab-link-item ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
                Matching Jobs
              </button>
            </div>

            {activeTab === 'analysis' && (
              <div className="workspace-view-pane">
                {breakdown && Object.keys(breakdown).length > 0 && (
                  <div className="workspace-card-section">
                    <h4 className="section-block-title">Scoring Categories</h4>
                    <div className="accordion-vertical-group">
                      {breakdown.content && (
                        <CategoryBar
                          label="Content Weight & Experience Verbs" icon="📝"
                          score={breakdown.content.score} max={breakdown.content.max}
                          color="#6366f1"
                          issues={breakdown.content.checks?.weakVerbsFound?.length
                            ? [`Weak experience verbs identified: ${breakdown.content.checks.weakVerbsFound.join(', ')}`]
                            : []}
                          checks={breakdown.content.checks || {}}
                        />
                      )}
                      {breakdown.format && (
                        <CategoryBar
                          label="File Layout & Structure Compatibility" icon="📐"
                          score={breakdown.format.score} max={breakdown.format.max}
                          color="#f59e0b"
                          issues={breakdown.format.issues || []}
                          checks={breakdown.format.checks || {}}
                        />
                      )}
                      {breakdown.skills && (
                        <CategoryBar
                          label="Skills & Industry Terms Density" icon="⚡"
                          score={breakdown.skills.score} max={breakdown.skills.max}
                          color="#10b981"
                          checks={breakdown.skills.checks || {}}
                        />
                      )}
                      {breakdown.style && (
                        <CategoryBar
                          label="Formatting & Writing Clarity" icon="🎨"
                          score={breakdown.style.score} max={breakdown.style.max}
                          color="#ec4899"
                          issues={breakdown.style.issues || []}
                          checks={breakdown.style.checks || {}}
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="workspace-card-section">
                  <h4 className="section-block-title">Extracted Skills ({analysis.skillsDetected?.length || 0})</h4>
                  {(analysis.skillsDetected?.length || 0) > 0 ? (
                    <div className="badge-pills-flex-grid">
                      {analysis.skillsDetected.map((skill, idx) => (
                        <span key={idx} className="badge-pill-item skill-pill">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="fallback-empty-text">No skills clearly extracted. Check if your resume layout uses explicit section titles.</p>
                  )}
                </div>

                {(analysis.suggestedSkills?.length || 0) > 0 && (
                  <div className="workspace-card-section">
                    <h4 className="section-block-title text-amber">Recommended Core Skills to Add</h4>
                    <div className="badge-pills-flex-grid">
                      {analysis.suggestedSkills.map((skill, idx) => (
                        <span key={idx} className="badge-pill-item suggest-pill">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="workspace-card-section card-border-red">
                  <h4 className="section-block-title text-red">Layout Formatting Warnings ({analysis.formattingIssues?.length || 0})</h4>
                  {(analysis.formattingIssues?.length || 0) > 0 ? (
                    <ul className="workspace-bullet-feedback-list">
                      {analysis.formattingIssues.map((issue, idx) => (
                        <li key={idx} className="feedback-list-item">
                          <span className="marker-icon marker-red">●</span> {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="success-clear-text">No major parsing or layout issues found in the file.</p>
                  )}
                </div>

                <div className="workspace-card-section card-border-green">
                  <h4 className="section-block-title text-green">Suggestions for Content Updates</h4>
                  {(analysis.suggestions?.length || 0) > 0 ? (
                    <ul className="workspace-bullet-feedback-list">
                      {analysis.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="feedback-list-item">
                          <span className="marker-icon marker-blue">●</span> {suggestion}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="fallback-empty-text">Your structure metrics look solid.</p>
                  )}
                </div>

                {(analysis.keywordsMissing?.length || 0) > 0 && (
                  <div className="workspace-card-section">
                    <h4 className="section-block-title">Missing Core Target Keywords</h4>
                    <div className="badge-pills-flex-grid">
                      {analysis.keywordsMissing.slice(0, 12).map((keyword, idx) => (
                        <span key={idx} className="badge-pill-item missing-pill">{keyword}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="workspace-bottom-actions-row">
                  <button onClick={() => setShowTailorModal(true)} className="workspace-primary-btn flex-fill">
                    Tailor this Resume for a Specific Role
                  </button>
                  <button onClick={() => setActiveTab('jobs')} className="workspace-secondary-btn">
                    View Match Recommendations
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="workspace-view-pane">
                <JobRecommendations
                  skills={analysis.skillsDetected || []}
                  jobTitle={guessJobTitle(selectedResume)}
                  resumeId={selectedResume._id}
                  onTailorClick={() => setShowTailorModal(true)}
                />
              </div>
            )}
          </>
        ) : (
          <div className="workspace-blank-state">
            <span className="blank-state-icon">📄</span>
            <h3>Welcome to Rezona</h3>
            <p style={{ marginBottom: 24 }}>AI-powered resume optimization platform. Upload your resume or create one from scratch.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, maxWidth: 500, margin: '0 auto 24px', padding: '0 8px' }}>
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>ATS Score Check</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Upload your PDF and get an instant ATS compatibility score with detailed breakdown</p>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✂️</div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Tailor to Job</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Paste a job description and get your resume rewritten to match the role perfectly</p>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Create Resume</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Don't have a resume? Fill in your details and we'll generate a professional one</p>
              </div>
              <div style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💼</div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Job Matching</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Get real job recommendations from LinkedIn, Naukri, Indeed matched to your skills</p>
              </div>
            </div>

            <button 
              onClick={() => setShowCreateResume(true)}
              style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginRight: 12 }}
            >
              📝 Create Resume from Scratch
            </button>
            <span style={{ color: '#64748b', fontSize: 13 }}>or upload a PDF from the sidebar</span>
          </div>
        )}
      </main>

      {showTailorModal && selectedResume && (
        <TailorResumeModal
          resumeId={selectedResume._id}
          skills={analysis.skillsDetected || []}
          onClose={() => setShowTailorModal(false)}
          onTailored={handleTailored}
        />
      )}

      {showTemplatePicker && (
        <TemplatePickerModal
          resumeId={selectedResume?._id}
          jobTitle={tailoredJobTitle}
          jobDescription={tailoredJobDesc}
          skills={analysis.skillsDetected || []}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {showCreateResume && (
        <CreateResumeModal
          onClose={() => setShowCreateResume(false)}
          onCreated={() => { fetchResumes(); setShowCreateResume(false); }}
        />
      )}
    </div>
  );
};

export default Dashboard;