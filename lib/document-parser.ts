// lib/document-parser.ts
// Converts uploaded PDF/DOCX binary files to clean text for LLM ingestion
// Using pdfjs-dist for PDF and mammoth for DOCX

import mammoth from "mammoth";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

// Disable worker for server-side rendering
GlobalWorkerOptions.workerSrc = "";

export interface ParseResult {
  text: string;
  pageCount?: number;
  wordCount: number;
}

/**
 * Parse a PDF buffer to clean text using pdfjs-dist
 */
export async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const pdf = await getDocument({
      data: uint8Array,
      disableFontFace: true,
      useSystemFonts: false,
      isEvalSupported: false,
    }).promise;

    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      textParts.push(pageText);
    }

    const text = cleanText(textParts.join("\n\n"));
    return {
      text,
      pageCount: pdf.numPages,
      wordCount: countWords(text),
    };
  } catch (err) {
    throw new Error(`PDF parsing failed: ${(err as Error).message}`);
  }
}

/**
 * Parse a DOCX buffer to clean text
 */
export async function parseDOCX(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = cleanText(result.value);
    return {
      text,
      wordCount: countWords(text),
    };
  } catch (err) {
    throw new Error(`DOCX parsing failed: ${(err as Error).message}`);
  }
}

/**
 * Auto-detect file type and parse accordingly
 */
export async function parseResumeFile(
  buffer: Buffer,
  filename: string
): Promise<ParseResult> {
  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    return parsePDF(buffer);
  } else if (ext === "docx" || ext === "doc") {
    return parseDOCX(buffer);
  } else {
    throw new Error(
      `Unsupported file type: .${ext}. Please upload a PDF or DOCX file.`
    );
  }
}

/**
 * Normalize whitespace and clean extracted text
 */
function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
