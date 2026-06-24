// app/api/packages/route.ts
// Creates a new ApplicationPackage record in Supabase (or returns local UUID if not configured)

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.user_name?.trim()) {
      return NextResponse.json({ error: "user_name is required" }, { status: 400 });
    }
    if (!body.raw_resume_text?.trim()) {
      return NextResponse.json({ error: "raw_resume_text is required" }, { status: 400 });
    }
    if (!body.job_description?.trim()) {
      return NextResponse.json({ error: "job_description is required" }, { status: 400 });
    }

    // Graceful fallback: return a local UUID if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ id: uuidv4(), local: true });
    }

    const { data, error } = await supabaseAdmin
      .from("application_packages")
      .insert({
        user_name: body.user_name.trim(),
        target_company: body.target_company?.trim() || null,
        recruiter_name: body.recruiter_name?.trim() || null,
        raw_resume_text: body.raw_resume_text,
        job_description: body.job_description,
        status: "idle",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error("[packages] Error:", err);
    // Last resort fallback for demo without Supabase
    return NextResponse.json({ id: uuidv4(), local: true });
  }
}
