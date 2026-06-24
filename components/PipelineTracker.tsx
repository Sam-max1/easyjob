"use client";
// components/PipelineTracker.tsx
// 4-stage vertical pipeline tracker driven by SSE events

interface Step {
  number: string;
  label: string;
  sublabel: string;
}

type StepStatus = "idle" | "active" | "done" | "error";

interface Props {
  currentPhase: number; // 0 = idle, 1-4 = active phase, 5 = done, -1 = error
  errorPhase?: number;
}

const STEPS: Step[] = [
  {
    number: "01",
    label: "JD Analysis",
    sublabel: "Keywords & stack extraction",
  },
  {
    number: "02",
    label: "Code Generation & Deploy",
    sublabel: "Proof-of-work project build",
  },
  {
    number: "03",
    label: "Resume Reconstruction",
    sublabel: "Semantic keyword realignment",
  },
  {
    number: "04",
    label: "Outreach Assembly",
    sublabel: "Cover letter & DM drafting",
  },
];

export default function PipelineTracker({ currentPhase, errorPhase }: Props) {
  const getStatus = (stepIndex: number): StepStatus => {
    const phase = stepIndex + 1;
    if (errorPhase === phase) return "error";
    if (currentPhase === -1 && errorPhase && phase < errorPhase) return "done";
    if (currentPhase === 0) return "idle";
    if (phase < currentPhase) return "done";
    if (phase === currentPhase) return "active";
    if (currentPhase > 4) return "done"; // completed
    return "idle";
  };

  return (
    <div className="pipeline-tracker">
      <p
        className="section-label"
        style={{ color: "rgba(196, 181, 165, 0.45)" }}
      >
        Generation Pipeline
      </p>
      <div>
        {STEPS.map((step, i) => {
          const status = getStatus(i);
          return (
            <div key={step.number} className={`pipeline-step ${status}`}>
              <span className="step-number">{step.number}</span>
              <span className="step-dot" />
              <div>
                <div className="step-label">{step.label}</div>
                <div className="step-sublabel">{step.sublabel}</div>
              </div>
            </div>
          );
        })}
      </div>

      {currentPhase === 5 && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "0.875rem 1rem",
            background: "rgba(46, 125, 82, 0.12)",
            borderRadius: "4px",
            border: "1px solid rgba(46, 125, 82, 0.3)",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              color: "#4ade80",
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            ✓ Package Complete
          </p>
          <p
            style={{
              fontSize: "0.6875rem",
              color: "rgba(196, 181, 165, 0.5)",
              marginTop: "0.25rem",
            }}
          >
            All 4 phases finished
          </p>
        </div>
      )}
    </div>
  );
}
