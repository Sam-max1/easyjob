// app/api/parse-resume/route.ts
// Accepts PDF or DOCX file upload and returns extracted plain text

import { NextRequest, NextResponse } from "next/server";
import { parseResumeFile } from "@/lib/document-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const filename = file.name;
    const ext = filename.toLowerCase().split(".").pop();
    if (!["pdf", "doc", "docx"].includes(ext || "")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF or DOCX." },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await parseResumeFile(buffer, filename);

    if (!result.text || result.wordCount < 10) {
      return NextResponse.json(
        {
          error:
            "Could not extract readable text from this file. The document may be image-only or encrypted.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: result.text,
      wordCount: result.wordCount,
      pageCount: result.pageCount,
      filename,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[parse-resume] Error:", message);
    return NextResponse.json(
      { error: `File parsing failed: ${message}` },
      { status: 500 }
    );
  }
}
