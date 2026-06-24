// lib/openai.ts
// GPT-4o integration for all AI generation tasks in the EasyJob pipeline

import OpenAI from "openai";

// Lazy client — only instantiated when first needed (avoids build-time env var requirement)
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface JDAnalysis {
  role_title: string;
  required_keywords: string[];
  tech_stack: string[];
  core_constraints: string[];
  experience_level: string;
  key_responsibilities: string[];
  language: string; // primary programming language/tech
}

export interface CodeGenResult {
  project_name: string;
  description: string;
  files: Record<string, string>; // filename → content
  entry_point: string;
  framework: string;
}

// ─── Phase 1: Job Description Analysis ─────────────────────────────────────────

export async function analyzeJobDescription(
  jobDescription: string
): Promise<JDAnalysis> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert technical recruiter and ATS specialist. Analyze job descriptions with surgical precision to extract every evaluation criterion that matters.

Return a JSON object with exactly these fields:
{
  "role_title": "exact job title",
  "required_keywords": ["array of exact ATS keywords and buzzwords"],
  "tech_stack": ["array of specific technologies, frameworks, tools"],
  "core_constraints": ["hidden evaluation criteria, must-haves, dealbreakers"],
  "experience_level": "junior/mid/senior/lead/principal",
  "key_responsibilities": ["array of 5-7 core duties"],
  "language": "primary programming language or technology focus"
}`,
      },
      {
        role: "user",
        content: `Analyze this job description and extract all evaluation parameters:\n\n${jobDescription}`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("OpenAI returned empty response for JD analysis");
  return JSON.parse(content) as JDAnalysis;
}

// ─── Phase 2: Proof-of-Work Code Generation ─────────────────────────────────────

export async function generateProofOfWorkCode(
  analysis: JDAnalysis,
  userName: string
): Promise<CodeGenResult> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a senior software engineer generating compact, standalone proof-of-work projects. 
Generate a MINIMAL but REAL working project demonstrating mastery of the target tech stack.
The project must be deployable as a Vercel Next.js app or static site.
Keep it focused — one clear demonstration of the most critical skill.

Return JSON with:
{
  "project_name": "kebab-case-name",
  "description": "one sentence describing what the project demonstrates",
  "files": {
    "package.json": "...",
    "app/page.tsx": "...",
    "app/layout.tsx": "...",
    "app/globals.css": "..."
  },
  "entry_point": "app/page.tsx",
  "framework": "Next.js"
}

All files must be syntactically valid and deployable. Use TypeScript. Keep the project concise but impressive.`,
      },
      {
        role: "user",
        content: `Generate a proof-of-work project for: ${analysis.role_title}

Tech Stack: ${analysis.tech_stack.join(", ")}
Key Skills to Demonstrate: ${analysis.required_keywords.slice(0, 8).join(", ")}
Primary Language/Tech: ${analysis.language}
Built by: ${userName}

Create a minimal but genuinely impressive standalone demo that proves real competency in the most critical skill from this stack.`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content)
    throw new Error("OpenAI returned empty response for code generation");
  return JSON.parse(content) as CodeGenResult;
}

// ─── Phase 3: Resume Semantic Realignment ──────────────────────────────────────

export async function realignResume(
  rawResume: string,
  analysis: JDAnalysis,
  targetCompany?: string
): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      {
        role: "system",
        content: `You are an expert resume writer specializing in ATS optimization and semantic keyword alignment.

CRITICAL ZERO-FABRICATION GUARDRAIL:
- You MUST NOT invent job titles, companies, dates, or metrics not present in the original resume
- You MUST NOT fabricate experience, skills, or achievements
- You MAY rephrase existing experience using the job description's exact technical vocabulary
- You MAY reorder sections to lead with the most relevant experience
- You MAY expand abbreviations and add context to existing technical terms
- You MAY incorporate exact keywords from the JD into descriptions of real experience

Your goal is to maximize ATS match score through accurate rephrasing, NOT fabrication.
Return only the optimized resume text. Preserve all factual content. Use clean formatting with clear sections.`,
      },
      {
        role: "user",
        content: `Realign this resume for the following role without fabricating any information:

TARGET ROLE: ${analysis.role_title}${targetCompany ? ` at ${targetCompany}` : ""}
REQUIRED KEYWORDS: ${analysis.required_keywords.join(", ")}
TECH STACK: ${analysis.tech_stack.join(", ")}
EXPERIENCE LEVEL: ${analysis.experience_level}
KEY RESPONSIBILITIES: ${analysis.key_responsibilities.join("; ")}

ORIGINAL RESUME:
${rawResume}

Rewrite to maximize keyword alignment with the JD while preserving 100% factual accuracy.`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content)
    throw new Error("OpenAI returned empty response for resume realignment");
  return content;
}

// ─── Phase 4: Outreach Asset Assembly ──────────────────────────────────────────

export interface OutreachAssets {
  cover_letter: string;
  outreach_message: string;
}

export async function generateOutreachAssets(
  analysis: JDAnalysis,
  userName: string,
  targetCompany: string,
  recruiterName: string,
  projectUrl: string,
  resumeSummary: string
): Promise<OutreachAssets> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a world-class career strategist writing high-conversion job application assets.
Generate a professional cover letter and a concise LinkedIn/email outreach message.
Both must reference the live proof-of-work project URL as the primary differentiator.
Be specific, not generic. Reference the company name and role.

Return JSON:
{
  "cover_letter": "full markdown formatted cover letter",
  "outreach_message": "short 4-6 sentence LinkedIn DM or cold email"
}`,
      },
      {
        role: "user",
        content: `Write application assets for:
Applicant: ${userName}
Role: ${analysis.role_title}
Company: ${targetCompany || "the company"}
Recruiter: ${recruiterName || "Hiring Manager"}
Live Project URL: ${projectUrl}

Key skills demonstrated: ${analysis.tech_stack.slice(0, 6).join(", ")}
Core competencies: ${analysis.required_keywords.slice(0, 6).join(", ")}

Resume summary: ${resumeSummary}

The cover letter should be 3 paragraphs. The outreach message should be 4-6 sentences, punchy, and link directly to the live project.`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content)
    throw new Error("OpenAI returned empty response for outreach assets");
  return JSON.parse(content) as OutreachAssets;
}
