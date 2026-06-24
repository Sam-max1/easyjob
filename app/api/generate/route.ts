// app/api/generate/route.ts
// Server-Sent Events streaming pipeline — the core 90-second generation loop
// Phases: 01 JD Analysis → 02 Code Gen + Deploy → 03 Resume Reconstruction → 04 Outreach Copy

import { NextRequest } from "next/server";
import { analyzeJobDescription, generateProofOfWorkCode, realignResume, generateOutreachAssets } from "@/lib/openai";
import { deployProject } from "@/lib/vercel";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

// Disable body size limit for this route (SSE streaming)
export const maxDuration = 120; // seconds

function encodeSSE(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const packageId = searchParams.get("packageId");
  const userName = searchParams.get("userName") || "Applicant";
  const jobDescription = decodeURIComponent(searchParams.get("jd") || "");
  const rawResume = decodeURIComponent(searchParams.get("resume") || "");
  const targetCompany = decodeURIComponent(searchParams.get("company") || "");
  const recruiterName = decodeURIComponent(searchParams.get("recruiter") || "");

  if (!jobDescription || !rawResume) {
    return new Response(
      encodeSSE({ event: "error", message: "Missing required parameters: jd and resume" }),
      {
        status: 400,
        headers: { "Content-Type": "text/event-stream" },
      }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(encodeSSE(data)));
        } catch {
          // Client disconnected — swallow the error
        }
      };

      // Helper to update Supabase status
      const updateStatus = async (status: string, updates?: Record<string, unknown>) => {
        if (!isSupabaseConfigured()) return;
        if (packageId && !packageId.startsWith("local-")) {
          try {
            await supabaseAdmin
              .from("application_packages")
              .update({ status, ...updates })
              .eq("id", packageId);
          } catch {
            // Non-fatal: continue if Supabase unavailable
          }
        }
      };

      try {
        // ── PHASE 1: JD ANALYSIS ───────────────────────────────────────────────
        send({ event: "phase_start", phase: 1, label: "Analyzing job description" });
        await updateStatus("analyzing");

        let analysis;
        try {
          analysis = await analyzeJobDescription(jobDescription);
          send({
            event: "phase_progress",
            phase: 1,
            data: {
              role: analysis.role_title,
              keywords: analysis.required_keywords.length,
              stack: analysis.tech_stack.slice(0, 5),
            },
          });
        } catch (err) {
          send({ event: "log", level: "error", message: `JD analysis warning: ${(err as Error).message}` });
          // Fallback analysis
          analysis = {
            role_title: "Software Engineer",
            required_keywords: ["software development", "problem solving"],
            tech_stack: ["JavaScript", "TypeScript"],
            core_constraints: [],
            experience_level: "mid",
            key_responsibilities: ["Build features", "Write tests"],
            language: "TypeScript",
          };
        }

        send({ event: "phase_complete", phase: 1 });

        // ── PHASE 2: CODE GENERATION + DEPLOYMENT ─────────────────────────────
        send({ event: "phase_start", phase: 2, label: "Generating proof-of-work project" });
        await updateStatus("generating_code");

        let projectUrl = "";
        let isFallback = false;

        try {
          send({ event: "log", level: "info", message: "Architecting standalone proof-of-work project..." });
          const codeResult = await generateProofOfWorkCode(analysis, userName);
          send({
            event: "log",
            level: "success",
            message: `Project "${codeResult.project_name}" generated — ${Object.keys(codeResult.files).length} files`,
          });

          await updateStatus("deploying");
          send({ event: "log", level: "info", message: "Deploying to Vercel..." });

          const deployResult = await deployProject(codeResult.files, codeResult.project_name);
          projectUrl = deployResult.url;
          isFallback = deployResult.isFallback;

          if (isFallback) {
            send({
              event: "log",
              level: "warning",
              message: "Vercel deployment unavailable — using sandbox URL",
            });
          } else {
            send({ event: "log", level: "success", message: `Deployed: ${projectUrl}` });
          }

          send({ event: "project_url", url: projectUrl, isFallback });
        } catch (err) {
          send({ event: "log", level: "error", message: `Code gen warning: ${(err as Error).message}` });
          projectUrl = `https://sandbox.easyjob.dev/demo-${Date.now()}`;
          isFallback = true;
          send({ event: "project_url", url: projectUrl, isFallback: true });
        }

        send({ event: "phase_complete", phase: 2 });

        // ── PHASE 3: RESUME RECONSTRUCTION ───────────────────────────────────
        send({ event: "phase_start", phase: 3, label: "Reconstructing resume" });
        await updateStatus("synthesizing");

        let optimizedResume = "";
        try {
          send({ event: "log", level: "info", message: "Applying semantic realignment to resume..." });
          optimizedResume = await realignResume(rawResume, analysis, targetCompany);
          send({
            event: "log",
            level: "success",
            message: `Resume realigned — ${optimizedResume.split(" ").length} words optimized`,
          });
        } catch (err) {
          send({ event: "log", level: "error", message: `Resume realignment failed: ${(err as Error).message}` });
          optimizedResume = rawResume; // graceful fallback: return original
        }

        send({ event: "optimized_resume", text: optimizedResume });
        send({ event: "phase_complete", phase: 3 });

        // ── PHASE 4: OUTREACH ASSET ASSEMBLY ──────────────────────────────────
        send({ event: "phase_start", phase: 4, label: "Assembling outreach assets" });

        let coverLetter = "";
        let outreachMessage = "";

        try {
          send({ event: "log", level: "info", message: "Drafting cover letter and outreach message..." });
          const resumeSummary = rawResume.slice(0, 600);
          const assets = await generateOutreachAssets(
            analysis,
            userName,
            targetCompany,
            recruiterName,
            projectUrl,
            resumeSummary
          );
          coverLetter = assets.cover_letter;
          outreachMessage = assets.outreach_message;
          send({ event: "log", level: "success", message: "Outreach assets assembled" });
        } catch (err) {
          send({ event: "log", level: "error", message: `Outreach generation failed: ${(err as Error).message}` });
          coverLetter = `Dear ${recruiterName || "Hiring Manager"},\n\nI am excited to apply for the ${analysis.role_title} position${targetCompany ? ` at ${targetCompany}` : ""}.\n\nPlease review my live proof-of-work project: ${projectUrl}\n\nBest regards,\n${userName}`;
          outreachMessage = `Hi ${recruiterName || "there"}, I built a live demonstration of my ${analysis.tech_stack[0] || "technical"} skills relevant to your ${analysis.role_title} role: ${projectUrl} — would love to connect!`;
        }

        send({ event: "cover_letter", text: coverLetter });
        send({ event: "outreach_message", text: outreachMessage });
        send({ event: "phase_complete", phase: 4 });

        // ── COMPLETION ─────────────────────────────────────────────────────────
        await updateStatus("completed", {
          project_demo_url: projectUrl,
          optimized_resume: optimizedResume,
          cover_letter: coverLetter,
          outreach_message: outreachMessage,
        });

        send({
          event: "complete",
          packageId,
          summary: {
            project_url: projectUrl,
            keywords_matched: analysis.required_keywords.length,
            role: analysis.role_title,
          },
        });
      } catch (fatalErr) {
        console.error("[generate] Fatal pipeline error:", fatalErr);
        await updateStatus("failed");
        send({
          event: "error",
          message: `Generation failed: ${(fatalErr as Error).message}`,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
