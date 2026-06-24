"use client";
// app/page.tsx
// EasyJob main dashboard — split-panel editorial layout

import { useState, useRef, useCallback, useEffect } from "react";
import PipelineTracker from "@/components/PipelineTracker";
import PresetSelector from "@/components/PresetSelector";
import ResumeDropzone from "@/components/ResumeDropzone";
import GenerationResults from "@/components/GenerationResults";
import { Preset } from "@/lib/presets";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  userName: string;
  targetCompany: string;
  recruiterName: string;
  jobDescription: string;
  rawResumeText: string;
}

interface GenerationOutput {
  optimizedResume: string;
  coverLetter: string;
  outreachMessage: string;
  projectUrl: string;
  isFallbackUrl: boolean;
}

interface LogEntry {
  id: number;
  level: "info" | "success" | "error" | "warning" | "step";
  message: string;
}

type RunStatus = "idle" | "running" | "done" | "error";

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  // Form state
  const [form, setForm] = useState<FormState>({
    userName: "",
    targetCompany: "",
    recruiterName: "",
    jobDescription: "",
    rawResumeText: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, boolean>>>({});

  // Preset selection
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Pipeline state
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [currentPhase, setCurrentPhase] = useState(0);
  const [errorPhase, setErrorPhase] = useState<number | undefined>();
  const [elapsed, setElapsed] = useState(0);

  // SSE logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logCounter = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Generation output
  const [output, setOutput] = useState<GenerationOutput>({
    optimizedResume: "",
    coverLetter: "",
    outreachMessage: "",
    projectUrl: "",
    isFallbackUrl: false,
  });

  // Error alert
  const [fatalError, setFatalError] = useState<string | null>(null);

  // SSE controller ref for cleanup
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling fallback ref
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const packageIdRef = useRef<string | null>(null);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const addLog = useCallback((level: LogEntry["level"], message: string) => {
    setLogs((prev) => [
      ...prev,
      { id: ++logCounter.current, level, message },
    ]);
  }, []);

  const updateField = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handlePresetSelect = (preset: Preset) => {
    if (!preset.id) {
      // Clear preset
      setActivePresetId(null);
      return;
    }
    setActivePresetId(preset.id);
    setForm({
      userName: preset.userName,
      targetCompany: preset.targetCompany,
      recruiterName: preset.recruiterName,
      jobDescription: preset.jobDescription,
      rawResumeText: preset.rawResumeText,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, boolean>> = {};
    if (!form.userName.trim()) newErrors.userName = true;
    if (!form.jobDescription.trim()) newErrors.jobDescription = true;
    if (!form.rawResumeText.trim()) newErrors.rawResumeText = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormComplete =
    form.userName.trim() &&
    form.jobDescription.trim() &&
    form.rawResumeText.trim();

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ─── Polling Fallback ──────────────────────────────────────────────────────

  const startPolling = useCallback((packageId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${packageId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "completed") {
          clearInterval(pollRef.current!);
          setOutput({
            optimizedResume: data.optimized_resume || "",
            coverLetter: data.cover_letter || "",
            outreachMessage: data.outreach_message || "",
            projectUrl: data.project_demo_url || "",
            isFallbackUrl: false,
          });
          setCurrentPhase(5);
          setRunStatus("done");
          if (timerRef.current) clearInterval(timerRef.current);
          addLog("success", "Package retrieved via status polling");
        } else if (data.status === "failed") {
          clearInterval(pollRef.current!);
          setRunStatus("error");
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch {
        // Polling error — keep trying
      }
    }, 3000);
  }, [addLog]);

  // ─── SSE Stream Handler ────────────────────────────────────────────────────

  const handleSSEStream = useCallback(
    async (packageId: string) => {
      const jd = encodeURIComponent(form.jobDescription);
      const resume = encodeURIComponent(form.rawResumeText);
      const company = encodeURIComponent(form.targetCompany);
      const recruiter = encodeURIComponent(form.recruiterName);
      const name = encodeURIComponent(form.userName);

      const url =
        `/api/generate?packageId=${packageId}` +
        `&userName=${name}&jd=${jd}&resume=${resume}` +
        `&company=${company}&recruiter=${recruiter}`;

      abortRef.current = new AbortController();

      try {
        const res = await fetch(url, { signal: abortRef.current.signal });

        if (!res.ok || !res.body) {
          throw new Error("SSE connection failed — falling back to polling");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const outputAccumulator: GenerationOutput = {
          optimizedResume: "",
          coverLetter: "",
          outreachMessage: "",
          projectUrl: "",
          isFallbackUrl: false,
        };

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6));

              switch (evt.event) {
                case "phase_start":
                  setCurrentPhase(evt.phase);
                  addLog("step", `[0${evt.phase}] ${evt.label}`);
                  break;

                case "phase_progress":
                  if (evt.data?.role) addLog("info", `Role: ${evt.data.role}`);
                  if (evt.data?.keywords) addLog("info", `${evt.data.keywords} keywords extracted`);
                  if (evt.data?.stack?.length)
                    addLog("info", `Stack: ${evt.data.stack.join(", ")}`);
                  break;

                case "phase_complete":
                  addLog("success", `Phase 0${evt.phase} complete`);
                  break;

                case "log":
                  addLog(
                    (evt.level as LogEntry["level"]) || "info",
                    evt.message
                  );
                  break;

                case "project_url":
                  outputAccumulator.projectUrl = evt.url;
                  outputAccumulator.isFallbackUrl = evt.isFallback;
                  setOutput((prev) => ({ ...prev, projectUrl: evt.url, isFallbackUrl: evt.isFallback }));
                  break;

                case "optimized_resume":
                  outputAccumulator.optimizedResume = evt.text;
                  setOutput((prev) => ({ ...prev, optimizedResume: evt.text }));
                  break;

                case "cover_letter":
                  outputAccumulator.coverLetter = evt.text;
                  setOutput((prev) => ({ ...prev, coverLetter: evt.text }));
                  break;

                case "outreach_message":
                  outputAccumulator.outreachMessage = evt.text;
                  setOutput((prev) => ({ ...prev, outreachMessage: evt.text }));
                  break;

                case "complete":
                  setCurrentPhase(5);
                  setRunStatus("done");
                  if (timerRef.current) clearInterval(timerRef.current);
                  addLog("success", "✓ Application package complete");
                  // Scroll to results
                  setTimeout(() => {
                    document.getElementById("results-panel")?.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                  break;

                case "error":
                  setFatalError(evt.message);
                  setRunStatus("error");
                  setErrorPhase(currentPhase || undefined);
                  if (timerRef.current) clearInterval(timerRef.current);
                  addLog("error", evt.message);
                  break;
              }
            } catch {
              // Malformed SSE line — skip
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        // SSE failed — fall back to polling
        addLog("warning", "SSE connection interrupted — switching to polling mode");
        startPolling(packageId);
      }
    },
    [form, addLog, startPolling, currentPhase]
  );

  // ─── Main Submit Handler ───────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    // Reset state
    setRunStatus("running");
    setCurrentPhase(0);
    setErrorPhase(undefined);
    setFatalError(null);
    setLogs([]);
    setElapsed(0);
    setOutput({
      optimizedResume: "",
      coverLetter: "",
      outreachMessage: "",
      projectUrl: "",
      isFallbackUrl: false,
    });

    // Start elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    addLog("info", `Starting generation for ${form.userName}...`);

    // Create package record
    let packageId: string;
    try {
      const pkgRes = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: form.userName,
          target_company: form.targetCompany,
          recruiter_name: form.recruiterName,
          raw_resume_text: form.rawResumeText,
          job_description: form.jobDescription,
        }),
      });
      const pkgData = await pkgRes.json();
      packageId = pkgData.id;
      packageIdRef.current = packageId;
      addLog("info", `Package created: ${packageId.slice(0, 8)}...`);
    } catch {
      // Use a temp ID if package creation fails
      const { v4: uuidv4 } = await import("uuid");
      packageId = `local-${uuidv4()}`;
      packageIdRef.current = packageId;
      addLog("warning", "Running in local mode (Supabase not configured)");
    }

    // Start SSE stream
    await handleSSEStream(packageId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, addLog, handleSSEStream]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="layout-grid">
      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Branding */}
        <div className="sidebar-brand">
          <p className="brand-label">AI Career Engine</p>
          <h1 className="brand-name">EasyJob</h1>
          <p className="brand-tagline">
            From resume to live proof-of-work in under 90 seconds
          </p>
        </div>

        {/* Pipeline Tracker */}
        <PipelineTracker
          currentPhase={runStatus === "done" ? 5 : currentPhase}
          errorPhase={errorPhase}
        />

        {/* Value Props */}
        <div>
          <p
            className="section-label"
            style={{ color: "rgba(196, 181, 165, 0.35)" }}
          >
            What you get
          </p>
          <ul className="value-list">
            <li className="value-item">ATS keyword-optimized resume</li>
            <li className="value-item">Live deployed proof-of-work project</li>
            <li className="value-item">Tailored cover letter with project URL</li>
            <li className="value-item">High-conversion outreach script</li>
          </ul>
        </div>

        {/* Elapsed Timer */}
        {runStatus === "running" && (
          <div className="timer-badge">
            <div className="spinner" />
            {formatElapsed(elapsed)} elapsed
          </div>
        )}

        {/* Completion */}
        {runStatus === "done" && (
          <div className="timer-badge" style={{ color: "#4ade80", background: "rgba(46, 125, 82, 0.12)", borderColor: "rgba(46, 125, 82, 0.25)" }}>
            ✓ Completed in {formatElapsed(elapsed)}
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <p className="page-eyebrow">Application Workbench</p>
          <h2 className="page-title">Build Your Application Package</h2>
          <p className="page-subtitle">
            Upload your resume and paste the job description. Our AI engine
            analyzes, realigns, and deploys a live proof-of-work project —
            making your application impossible to ignore.
          </p>
        </div>

        {/* Fatal Error */}
        {fatalError && (
          <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
            <span>✕</span>
            <div>
              <strong>Generation Error</strong>
              <p style={{ marginTop: "0.25rem" }}>{fatalError}</p>
            </div>
          </div>
        )}

        {/* Preset Selector */}
        <PresetSelector
          activePresetId={activePresetId}
          onSelect={handlePresetSelect}
        />

        <hr className="divider" />

        {/* Name & Company Row */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="user-name">
              Your Full Name <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              id="user-name"
              type="text"
              className={`form-input ${errors.userName ? "error" : ""}`}
              placeholder="e.g. Alex Rivera"
              value={form.userName}
              onChange={(e) => updateField("userName")(e.target.value)}
            />
            {errors.userName && (
              <p style={{ fontSize: "0.6875rem", color: "var(--error)" }}>
                Full name is required.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="target-company">
              Target Company
            </label>
            <input
              id="target-company"
              type="text"
              className="form-input"
              placeholder="e.g. ChainForge Labs"
              value={form.targetCompany}
              onChange={(e) => updateField("targetCompany")(e.target.value)}
            />
          </div>
        </div>

        {/* Recruiter */}
        <div className="form-group" style={{ marginBottom: "1.25rem" }}>
          <label className="form-label" htmlFor="recruiter-name">
            Recruiter / Hiring Manager Name
          </label>
          <input
            id="recruiter-name"
            type="text"
            className="form-input"
            placeholder="e.g. Sarah Mitchell (optional)"
            value={form.recruiterName}
            onChange={(e) => updateField("recruiterName")(e.target.value)}
          />
        </div>

        {/* Job Description */}
        <div className="form-group" style={{ marginBottom: "1.25rem" }}>
          <label className="form-label" htmlFor="job-description">
            Job Description <span style={{ color: "var(--error)" }}>*</span>
          </label>
          <textarea
            id="job-description"
            className={`form-input ${errors.jobDescription ? "error" : ""}`}
            placeholder="Paste the full job description here — include required skills, responsibilities, and any specific technologies or frameworks mentioned..."
            value={form.jobDescription}
            onChange={(e) => updateField("jobDescription")(e.target.value)}
            rows={10}
          />
          {errors.jobDescription && (
            <p style={{ fontSize: "0.6875rem", color: "var(--error)" }}>
              Job description is required.
            </p>
          )}
        </div>

        <hr className="divider" />

        {/* Resume Upload */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p className="section-label">Your Resume</p>
          <ResumeDropzone
            value={form.rawResumeText}
            onChange={updateField("rawResumeText")}
            hasError={errors.rawResumeText}
          />
        </div>

        {/* SSE Log Stream */}
        {logs.length > 0 && (
          <div
            style={{
              background: "rgba(244, 237, 228, 0.6)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <p className="section-label" style={{ marginBottom: "0.5rem" }}>
              Generation Log
            </p>
            <div className="log-stream">
              {logs.map((entry) => (
                <div key={entry.id} className={`log-entry ${entry.level}`}>
                  <span style={{ opacity: 0.4, marginRight: "0.5rem", userSelect: "none" }}>›</span>
                  {entry.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          id="analyze-btn"
          className={`action-btn ${runStatus === "running" ? "running" : ""}`}
          disabled={!isFormComplete || runStatus === "running"}
          onClick={handleSubmit}
        >
          {runStatus === "running" ? (
            <>
              <div className="spinner" />
              Generating your package...
            </>
          ) : (
            <>
              {runStatus === "done" ? "✓ REGENERATE APPLICATION" : "ANALYZE MY APPLICATION"}
            </>
          )}
        </button>

        {!isFormComplete && runStatus === "idle" && (
          <p
            style={{
              textAlign: "center",
              fontSize: "0.6875rem",
              color: "var(--ink-faint)",
              marginTop: "0.625rem",
              letterSpacing: "0.04em",
            }}
          >
            Complete all required fields to activate
          </p>
        )}

        {/* Generation Results */}
        {(output.optimizedResume ||
          output.coverLetter ||
          output.outreachMessage ||
          output.projectUrl) && (
          <>
            <hr className="divider" />
            <p className="section-label">Your Application Package</p>
            <GenerationResults
              optimizedResume={output.optimizedResume}
              coverLetter={output.coverLetter}
              outreachMessage={output.outreachMessage}
              projectUrl={output.projectUrl}
              isFallbackUrl={output.isFallbackUrl}
            />
          </>
        )}
      </main>
    </div>
  );
}
