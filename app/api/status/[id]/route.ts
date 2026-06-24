// app/api/status/[id]/route.ts
// Polling fallback endpoint — returns current package status and available outputs

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Package ID required" }, { status: 400 });
  }

  // Without Supabase, status polling isn't available
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured — status polling unavailable in local mode" },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("application_packages")
      .select(
        "id, status, project_demo_url, optimized_resume, cover_letter, outreach_message, created_at"
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      project_demo_url: data.project_demo_url,
      has_resume: !!data.optimized_resume,
      has_cover_letter: !!data.cover_letter,
      has_outreach: !!data.outreach_message,
      optimized_resume: data.optimized_resume,
      cover_letter: data.cover_letter,
      outreach_message: data.outreach_message,
      created_at: data.created_at,
    });
  } catch (err) {
    console.error("[status] Error:", err);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
