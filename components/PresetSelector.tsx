"use client";
// components/PresetSelector.tsx
// Horizontal preset pill buttons for one-click template evaluation

import { PRESETS, Preset } from "@/lib/presets";

interface Props {
  activePresetId: string | null;
  onSelect: (preset: Preset) => void;
}

export default function PresetSelector({ activePresetId, onSelect }: Props) {
  return (
    <div>
      <p className="section-label">Quick Templates</p>
      <div className="preset-row">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`preset-btn ${activePresetId === preset.id ? "active" : ""}`}
            onClick={() => onSelect(preset)}
            id={`preset-${preset.id}`}
          >
            {preset.shortLabel}
          </button>
        ))}
        {activePresetId && (
          <button
            className="preset-btn"
            onClick={() => onSelect({ id: "", label: "", shortLabel: "", userName: "", targetCompany: "", recruiterName: "", jobDescription: "", rawResumeText: "" })}
            style={{ opacity: 0.6 }}
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
