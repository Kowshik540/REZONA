/**
 * ResumeTailor.jsx
 * Drop-in feature for Rezona — paste a job description, get an AI-tailored
 * resume preview, then download as a formatted text file ready to copy-paste.
 *
 * INTEGRATION: Add a new "✂️ Tailor" tab in Dashboard.js and render:
 *   <ResumeTailor resume={selectedResume} />
 *
 * The component calls:
 *   POST /api/resume/modify  → { professionalSummary, skillsToAdd, experienceBullets, changes, atsImprovementEstimate }
 *
 * No new backend routes needed — /api/resume/modify already exists.
 */

import { useState, useRef } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function apiFetch(path, options = {}) {
  const token = localStorage.getItem("rezona_token");
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  });
}

// ─── ScorePill ───────────────────────────────────────────────────────────────
function ScorePill({ score, label, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 500,
        background: color + "22",
        color: color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}: {score}
    </span>
  );
}

// ─── Section: Job Input ──────────────────────────────────────────────────────
function JobInputPanel({ onSubmit, loading }) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!jobTitle.trim()) return setError("Please enter the job title.");
    if (jobDesc.trim().length < 50)
      return setError("Please paste at least 50 characters of the job description.");
    setError("");
    onSubmit({ jobTitle: jobTitle.trim(), jobDescription: jobDesc.trim() });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <label style={styles.label}>Job Title</label>
        <input
          style={styles.input}
          placeholder="e.g. Senior Frontend Developer"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label style={styles.label}>
          Job Description
          <span style={styles.hint}> — paste the full JD from LinkedIn / Naukri / Indeed</span>
        </label>
        <textarea
          style={{ ...styles.input, height: 180, resize: "vertical", fontFamily: "inherit" }}
          placeholder="Paste the job description here…"
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          disabled={loading}
        />
      </div>

      {error && (
        <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>⚠ {error}</p>
      )}

      <button
        style={{
          ...styles.btn,
          background: loading ? "#94a3b8" : "#6366f1",
          cursor: loading ? "not-allowed" : "pointer",
          alignSelf: "flex-start",
        }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Spinner /> Tailoring with AI…
          </span>
        ) : (
          "✨ Tailor My Resume"
        )}
      </button>
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        border: "2px solid #ffffff55",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

// ─── ChangeItem ───────────────────────────────────────────────────────────────
function ChangeItem({ text }) {
  return (
    <li
      style={{
        padding: "8px 12px",
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: 8,
        fontSize: 14,
        color: "#15803d",
        listStyle: "none",
      }}
    >
      ✓ {text}
    </li>
  );
}

// ─── BulletDiff ───────────────────────────────────────────────────────────────
function BulletDiff({ bullet }) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          background: "#fef2f2",
          fontSize: 13,
          color: "#991b1b",
          borderBottom: "1px solid #fecaca",
        }}
      >
        <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Before · {bullet.context}
        </strong>
        <p style={{ margin: "4px 0 0", lineHeight: 1.5 }}>{bullet.original || "—"}</p>
      </div>
      <div
        style={{
          padding: "8px 12px",
          background: "#f0fdf4",
          fontSize: 13,
          color: "#166534",
        }}
      >
        <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
          After ↗
        </strong>
        <p style={{ margin: "4px 0 0", lineHeight: 1.5 }}>{bullet.improved}</p>
      </div>
    </div>
  );
}

// ─── ResumePreview ────────────────────────────────────────────────────────────
function ResumePreview({ result, resume, jobTitle, jobDesc }) {
  const previewRef = useRef(null);

  const { professionalSummary, skillsToAdd = [], experienceBullets = [] } = result;
  const originalSkills = resume?.analysis?.skillsDetected || [];
  const allSkills = [...new Set([...originalSkills, ...skillsToAdd])];

  const previewText = buildPlainText({
    resume,
    professionalSummary,
    allSkills,
    experienceBullets,
    jobTitle,
  });

  function downloadTxt() {
    const blob = new Blob([previewText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tailored-resume-${jobTitle.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(previewText).then(() => {
      alert("Copied to clipboard!");
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "#1e293b",
          borderRadius: "10px 10px 0 0",
        }}
      >
        <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>
          📄 Tailored Resume Preview
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.toolbarBtn} onClick={copyToClipboard}>
            Copy Text
          </button>
          <button
            style={{ ...styles.toolbarBtn, background: "#6366f1", color: "#fff", border: "none" }}
            onClick={downloadTxt}
          >
            ⬇ Download .txt
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div
        ref={previewRef}
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderTop: "none",
          borderRadius: "0 0 10px 10px",
          padding: "32px 36px",
          fontFamily: "Georgia, serif",
          fontSize: 14,
          lineHeight: 1.7,
          color: "#1e293b",
          maxHeight: 600,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {previewText}
      </div>

      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
        💡 Tip: Download the .txt file and paste into your Word / Google Docs resume to apply formatting.
      </p>
    </div>
  );
}

function buildPlainText({ resume, professionalSummary, allSkills, experienceBullets, jobTitle }) {
  const name = resume?.filename?.replace(/\.[^.]+$/, "") || "Resume";
  const lines = [];

  lines.push("=" .repeat(60));
  lines.push(`TAILORED RESUME — ${jobTitle.toUpperCase()}`);
  lines.push("=".repeat(60));
  lines.push("");

  if (professionalSummary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push("-".repeat(30));
    lines.push(professionalSummary);
    lines.push("");
  }

  if (allSkills.length) {
    lines.push("SKILLS");
    lines.push("-".repeat(30));
    lines.push(allSkills.join(" • "));
    lines.push("");
  }

  if (experienceBullets.length) {
    lines.push("EXPERIENCE HIGHLIGHTS (TAILORED)");
    lines.push("-".repeat(30));
    experienceBullets.forEach((b) => {
      if (b.context) lines.push(`[${b.context}]`);
      lines.push(`• ${b.improved}`);
      lines.push("");
    });
  }

  lines.push("=".repeat(60));
  lines.push("Original resume sections (keep as-is unless replaced above):");
  lines.push("=".repeat(60));
  lines.push(`Source file: ${resume?.filename || "resume.pdf"}`);
  lines.push(`ATS Score (original): ${resume?.atsScore || 0}/100`);

  return lines.join("\n");
}

// ─── Main: ResumeTailor ───────────────────────────────────────────────────────
export default function ResumeTailor({ resume }) {
  const [phase, setPhase] = useState("input"); // input | loading | result
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [activeResultTab, setActiveResultTab] = useState("preview");

  async function handleTailor({ jobTitle: jt, jobDescription: jd }) {
    setJobTitle(jt);
    setJobDesc(jd);
    setPhase("loading");
    setError("");

    try {
      const data = await apiFetch("/resume/modify", {
        method: "POST",
        body: JSON.stringify({
          resumeId: resume?._id,
          jobTitle: jt,
          jobDescription: jd,
          missingSkills: resume?.analysis?.keywordsMissing || [],
        }),
      });
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err.message || "Tailoring failed. Please try again.");
      setPhase("input");
    }
  }

  function reset() {
    setPhase("input");
    setResult(null);
    setError("");
  }

  if (!resume) {
    return (
      <div style={styles.emptyState}>
        <span style={{ fontSize: 48 }}>📄</span>
        <p style={{ color: "#64748b" }}>Select a resume from the sidebar to tailor it.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={styles.headerBar}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1e293b" }}>
            ✂️ Tailor Resume for a Job
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            AI rewrites your resume to match a specific job description
          </p>
        </div>
        {phase === "result" && (
          <button style={{ ...styles.btn, background: "#f1f5f9", color: "#475569" }} onClick={reset}>
            ← New Tailoring
          </button>
        )}
      </div>

      {/* Resume context pill */}
      <div style={styles.contextBar}>
        <span style={{ fontSize: 13, color: "#64748b" }}>Working on:</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#1e293b",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            padding: "2px 10px",
          }}
        >
          {resume.filename || "Resume"}
        </span>
        <ScorePill
          score={`${resume.atsScore || 0}/100`}
          label="Current ATS"
          color={resume.atsScore >= 75 ? "#10b981" : resume.atsScore >= 50 ? "#f59e0b" : "#ef4444"}
        />
        {result?.atsImprovementEstimate > 0 && (
          <ScorePill
            score={`+${result.atsImprovementEstimate}pts`}
            label="Estimated gain"
            color="#6366f1"
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          ⚠ {error}
        </div>
      )}

      {/* Phase: Input */}
      {phase === "input" && (
        <div style={styles.card}>
          <JobInputPanel onSubmit={handleTailor} loading={false} />
        </div>
      )}

      {/* Phase: Loading */}
      {phase === "loading" && (
        <div style={{ ...styles.card, textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
          <p style={{ fontWeight: 500, color: "#1e293b", margin: 0 }}>Analyzing job description…</p>
          <p style={{ color: "#64748b", fontSize: 13, margin: "6px 0 24px" }}>
            Claude is rewriting your resume to match <strong>{jobTitle}</strong>
          </p>
          <div
            style={{
              width: 200,
              height: 4,
              background: "#e2e8f0",
              borderRadius: 4,
              margin: "0 auto",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "40%",
                height: "100%",
                background: "#6366f1",
                borderRadius: 4,
                animation: "loading-bar 1.4s ease-in-out infinite",
              }}
            />
          </div>
          <style>{`
            @keyframes loading-bar {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(350%); }
            }
          `}</style>
        </div>
      )}

      {/* Phase: Result */}
      {phase === "result" && result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Result tabs */}
          <div style={styles.tabRow}>
            {["preview", "changes", "bullets"].map((t) => (
              <button
                key={t}
                style={{
                  ...styles.tab,
                  ...(activeResultTab === t ? styles.tabActive : {}),
                }}
                onClick={() => setActiveResultTab(t)}
              >
                {t === "preview" && "📄 Preview & Download"}
                {t === "changes" && `✅ Changes Made (${result.changes?.length || 0})`}
                {t === "bullets" && `✏️ Experience Rewrites (${result.experienceBullets?.length || 0})`}
              </button>
            ))}
          </div>

          {/* Tab: Preview */}
          {activeResultTab === "preview" && (
            <ResumePreview
              result={result}
              resume={resume}
              jobTitle={jobTitle}
              jobDesc={jobDesc}
            />
          )}

          {/* Tab: Changes */}
          {activeResultTab === "changes" && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>What Claude changed</h3>

              {result.professionalSummary && (
                <div style={{ marginBottom: 20 }}>
                  <p style={styles.subLabel}>New Professional Summary</p>
                  <p
                    style={{
                      margin: 0,
                      padding: "12px 16px",
                      background: "#eef2ff",
                      border: "1px solid #c7d2fe",
                      borderRadius: 8,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "#312e81",
                    }}
                  >
                    {result.professionalSummary}
                  </p>
                </div>
              )}

              {result.skillsToAdd?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={styles.subLabel}>Skills to Add</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {result.skillsToAdd.map((s, i) => (
                      <span key={i} style={styles.skillChip}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.changes?.length > 0 && (
                <div>
                  <p style={styles.subLabel}>All Changes</p>
                  <ul style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.changes.map((c, i) => (
                      <ChangeItem key={i} text={c} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tab: Experience Bullets */}
          {activeResultTab === "bullets" && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Before → After rewrites</h3>
              {result.experienceBullets?.length > 0 ? (
                result.experienceBullets.map((b, i) => <BulletDiff key={i} bullet={b} />)
              ) : (
                <p style={{ color: "#64748b", fontSize: 14 }}>
                  No specific bullet rewrites generated — check the Changes tab for improvements.
                </p>
              )}
            </div>
          )}

          {/* Apply CTA */}
          <div style={styles.applyBar}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>
                Ready to apply?
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                Download the tailored resume, update your PDF, then hit Apply on the job listing.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button
                style={{ ...styles.btn, background: "#f1f5f9", color: "#475569" }}
                onClick={reset}
              >
                Tailor Another
              </button>
              <button
                style={{ ...styles.btn, background: "#6366f1" }}
                onClick={() => setActiveResultTab("preview")}
              >
                ⬇ Get Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  headerBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  contextBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    flexWrap: "wrap",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "24px 28px",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 6,
  },
  hint: {
    fontWeight: 400,
    color: "#9ca3af",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    color: "#1e293b",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  btn: {
    padding: "9px 18px",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: "#fff",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  toolbarBtn: {
    padding: "5px 12px",
    border: "1px solid #334155",
    borderRadius: 6,
    fontSize: 12,
    color: "#cbd5e1",
    background: "transparent",
    cursor: "pointer",
  },
  tabRow: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 0,
  },
  tab: {
    padding: "10px 16px",
    border: "none",
    borderBottom: "2px solid transparent",
    background: "transparent",
    fontSize: 14,
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500,
    marginBottom: -1,
  },
  tabActive: {
    color: "#6366f1",
    borderBottomColor: "#6366f1",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 15,
    fontWeight: 600,
    color: "#1e293b",
  },
  subLabel: {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#94a3b8",
  },
  skillChip: {
    padding: "4px 12px",
    background: "#eef2ff",
    color: "#4338ca",
    border: "1px solid #c7d2fe",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
  },
  applyBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "16px 20px",
    background: "#fafafa",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    flexWrap: "wrap",
  },
  errorBox: {
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    color: "#dc2626",
    fontSize: 14,
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
};