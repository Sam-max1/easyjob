"use client";
// components/ResumeDropzone.tsx
// Drag-and-drop resume uploader + text paste area

import { useState, useRef, useCallback } from "react";

interface Props {
  value: string;
  onChange: (text: string) => void;
  hasError?: boolean;
}

export default function ResumeDropzone({ value, onChange, hasError }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse file");
      }

      onChange(data.text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const hasContent = value.trim().length > 0;
  const dropzoneClass = [
    "dropzone",
    isDragging ? "dragging" : "",
    hasError && !hasContent ? "error" : "",
    hasContent ? "loaded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      {/* Drop Zone */}
      <div
        id="resume-dropzone"
        className={dropzoneClass}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !hasContent && fileInputRef.current?.click()}
        style={{ cursor: hasContent ? "default" : "pointer" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="resume-file-input"
        />

        {isUploading ? (
          <>
            <div className="spinner spinner-ink" />
            <p className="dropzone-text">Parsing {fileName}...</p>
          </>
        ) : hasContent ? (
          <>
            <span style={{ fontSize: "1.25rem" }}>✓</span>
            <p className="dropzone-text">
              <strong>
                {fileName ? `${fileName} loaded` : "Resume text entered"}
              </strong>
            </p>
            <p className="dropzone-hint">
              {value.trim().split(/\s+/).length} words ·{" "}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                  setFileName(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-warm)",
                  cursor: "pointer",
                  fontSize: "inherit",
                  textDecoration: "underline",
                }}
              >
                Clear & replace
              </button>
            </p>
          </>
        ) : (
          <>
            <span className="dropzone-icon">📄</span>
            <p className="dropzone-text">
              <strong>Drop your resume here</strong> or click to browse
            </p>
            <p className="dropzone-hint">PDF or DOCX · Max 10 MB</p>
          </>
        )}
      </div>

      {/* Error display */}
      {uploadError && (
        <div className="alert alert-error" style={{ marginTop: "0.5rem" }}>
          <span>⚠</span>
          <span>{uploadError}</span>
        </div>
      )}

      {/* Text paste fallback */}
      <div style={{ marginBottom: "0.375rem" }}>
        <label className="form-label" htmlFor="resume-text-paste">
          Or paste resume text directly
        </label>
      </div>
      <textarea
        id="resume-text-paste"
        className={`form-input ${hasError && !hasContent ? "error" : ""}`}
        placeholder="Paste the full text of your resume here..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (e.target.value) setFileName(null);
        }}
        rows={8}
      />
      {hasError && !hasContent && (
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--error)",
            marginTop: "0.375rem",
          }}
        >
          Resume is required to generate your application package.
        </p>
      )}
    </div>
  );
}
