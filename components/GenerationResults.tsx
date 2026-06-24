"use client";
// components/GenerationResults.tsx
// Tabbed output panel for optimized resume, cover letter, outreach message, and live project URL

import { useState } from "react";

interface Props {
  optimizedResume: string;
  coverLetter: string;
  outreachMessage: string;
  projectUrl: string;
  isFallbackUrl: boolean;
}

type Tab = "resume" | "cover_letter" | "outreach" | "project";

interface TabConfig {
  id: Tab;
  label: string;
  available: (p: Props) => boolean;
}

const TABS: TabConfig[] = [
  { id: "resume",       label: "Optimized Resume",    available: (p) => !!p.optimizedResume },
  { id: "cover_letter", label: "Cover Letter",        available: (p) => !!p.coverLetter },
  { id: "outreach",     label: "Outreach Message",    available: (p) => !!p.outreachMessage },
  { id: "project",      label: "Live Project",        available: (p) => !!p.projectUrl },
];

export default function GenerationResults(props: Props) {
  const { optimizedResume, coverLetter, outreachMessage, projectUrl, isFallbackUrl } = props;
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (optimizedResume) return "resume";
    if (coverLetter) return "cover_letter";
    if (outreachMessage) return "outreach";
    return "project";
  });
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getActiveContent = () => {
    switch (activeTab) {
      case "resume":       return optimizedResume;
      case "cover_letter": return coverLetter;
      case "outreach":     return outreachMessage;
      default:             return "";
    }
  };

  const availableTabs = TABS.filter((t) => t.available(props));

  return (
    <div className="results-panel" id="results-panel">
      {/* Tab Navigation */}
      <div className="results-tabs">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            id={`results-tab-${tab.id}`}
            className={`results-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="results-content">
        {activeTab === "project" ? (
          // Project URL Tab
          <div>
            <p className="section-label" style={{ marginBottom: "1rem" }}>
              Live Proof-of-Work Project
            </p>
            {projectUrl ? (
              <>
                <div className="project-url-box">
                  <span style={{ fontSize: "1.125rem" }}>🚀</span>
                  <a
                    href={projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-url-link"
                    id="project-live-url"
                  >
                    {projectUrl}
                  </a>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(projectUrl)}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                {isFallbackUrl && (
                  <div className="alert alert-warning" style={{ marginTop: "1rem" }}>
                    <span>⚠</span>
                    <span>
                      Vercel deployment was unavailable — this is a sandbox preview URL. 
                      Configure <code>VERCEL_API_TOKEN</code> for live deployment.
                    </span>
                  </div>
                )}
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--ink-light)",
                    marginTop: "1rem",
                    lineHeight: 1.6,
                  }}
                >
                  Include this URL in your application, cover letter, and LinkedIn messages 
                  as direct evidence of your technical capability for this role.
                </p>
              </>
            ) : (
              <p style={{ color: "var(--ink-faint)", fontSize: "0.875rem" }}>
                Project URL will appear here after generation completes.
              </p>
            )}
          </div>
        ) : (
          // Text Content Tabs
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <p className="section-label" style={{ margin: 0 }}>
                {TABS.find((t) => t.id === activeTab)?.label}
              </p>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(getActiveContent())}
                id={`copy-${activeTab}`}
              >
                {copied ? "✓ Copied!" : "Copy Text"}
              </button>
            </div>
            <div className="results-text">{getActiveContent()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
