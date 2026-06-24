// lib/supabase.ts
// Supabase client singletons — lazy initialization to allow builds without env vars

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PackageStatus =
  | "idle"
  | "analyzing"
  | "generating_code"
  | "deploying"
  | "synthesizing"
  | "completed"
  | "failed";

export interface ApplicationPackage {
  id: string;
  user_name: string;
  target_company?: string;
  recruiter_name?: string;
  raw_resume_text: string;
  job_description: string;
  project_demo_url?: string;
  optimized_resume?: string;
  cover_letter?: string;
  outreach_message?: string;
  status: PackageStatus;
  created_at: string;
}

export interface CreatePackageInput {
  user_name: string;
  target_company?: string;
  recruiter_name?: string;
  raw_resume_text: string;
  job_description: string;
}

// ─── Lazy Client Factories ─────────────────────────────────────────────────────

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/** Browser-safe client (uses anon key, respects RLS) */
export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Supabase credentials not configured");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/** Server-side admin client (bypasses RLS) */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error("Supabase admin credentials not configured");
    }
    _supabaseAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return _supabaseAdmin;
}

/** Check if Supabase is configured */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Convenience aliases (lazy — safe to use in routes)
export const supabase = {
  get client() { return getSupabaseClient(); }
};

export const supabaseAdmin = {
  from: (table: string) => getSupabaseAdmin().from(table),
};
