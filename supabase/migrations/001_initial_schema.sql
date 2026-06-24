-- supabase/migrations/001_initial_schema.sql
-- EasyJob application packages table
-- Run via: supabase db push or Supabase Dashboard SQL editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS application_packages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name       TEXT        NOT NULL,
  target_company  TEXT,
  recruiter_name  TEXT,
  raw_resume_text TEXT        NOT NULL,
  job_description TEXT        NOT NULL,
  project_demo_url TEXT,
  optimized_resume TEXT,
  cover_letter    TEXT,
  outreach_message TEXT,
  status          TEXT        NOT NULL DEFAULT 'idle'
                  CHECK (status IN ('idle', 'analyzing', 'generating_code', 'deploying', 'synthesizing', 'completed', 'failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for status-based queries
CREATE INDEX IF NOT EXISTS idx_application_packages_status
  ON application_packages (status);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_application_packages_created_at
  ON application_packages (created_at DESC);

-- Enable Row Level Security (no auth in MVP — public access)
ALTER TABLE application_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: allow all operations (MVP — no auth required)
CREATE POLICY "Allow public access to application_packages"
  ON application_packages
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE application_packages IS 
  'EasyJob AI generation pipeline output records. Each row represents one application package generation run.';

COMMENT ON COLUMN application_packages.status IS
  'Pipeline state: idle → analyzing → generating_code → deploying → synthesizing → completed | failed';

COMMENT ON COLUMN application_packages.project_demo_url IS
  'Public Vercel URL of the deployed proof-of-work project. May be a sandbox URL if Vercel deployment failed.';

COMMENT ON COLUMN application_packages.optimized_resume IS
  'ATS-optimized resume text with semantic keyword realignment applied. No facts fabricated.';
