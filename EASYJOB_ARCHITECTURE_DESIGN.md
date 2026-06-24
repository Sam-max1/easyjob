# EasyJob — Architecture Design

> AI-driven career acceleration engine using GPT-4o, Vercel REST API, and SSE streaming.

---

## System Overview

```mermaid
graph TB
    subgraph UI["Next.js 16 App (port 3000)"]
        A[Left Sidebar\nPipeline Tracker · Branding · Value Props]
        B[Right Panel\nPreset Selector · Form · Dropzone]
        C[Results Panel\nResume · Cover Letter · Outreach · Live URL]
    end

    subgraph API["Next.js API Routes"]
        D[POST /api/packages\nCreate ApplicationPackage]
        E[POST /api/parse-resume\nPDF/DOCX → text]
        F[GET /api/generate\nSSE 4-Phase Pipeline]
        G[GET /api/status/id\nPolling Fallback]
    end

    subgraph AI["AI Layer — lib/openai.ts"]
        H["Phase 1: analyzeJobDescription\nGPT-4o JSON mode"]
        I["Phase 2: generateProofOfWorkCode\nGPT-4o code synthesis"]
        J["Phase 3: realignResume\nGPT-4o zero-fabrication"]
        K["Phase 4: generateOutreachAssets\nGPT-4o cover letter + DM"]
    end

    subgraph Deploy["Deployment — lib/vercel.ts"]
        L[Vercel REST API v13\nCreate deployment]
        M[Poll /deployments/id\nWait for READY state]
        N[Fallback: Mock sandbox URL]
    end

    subgraph Store["Storage — Supabase"]
        O[(PostgreSQL\napplication_packages\nid · status · outputs)]
    end

    B --> D
    B --> E
    B --> F
    F --> H --> I --> J --> K
    I --> L --> M
    M -->|failure| N
    F --> O
    G --> O
    F -->|SSE stream| C
```

---

## Data Flow

### SSE Generation Pipeline

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant P as page.tsx (React)
    participant PKG as POST /api/packages
    participant GEN as GET /api/generate (SSE)
    participant OAI as OpenAI GPT-4o
    participant VER as Vercel REST API
    participant SB as Supabase

    U->>P: Fill form + click "ANALYZE MY APPLICATION"
    P->>PKG: POST { user_name, jd, resume, ... }
    PKG->>SB: INSERT application_packages (status: idle)
    PKG-->>P: { id: "uuid" }
    P->>GEN: GET /api/generate?packageId=...&jd=...&resume=...
    GEN-->>P: SSE stream opens

    Note over GEN,OAI: Phase 01 — JD Analysis
    GEN->>OAI: analyzeJobDescription(jd)
    OAI-->>GEN: { role, keywords, stack, constraints }
    GEN-->>P: data: { event: "phase_start", phase: 1 }
    GEN->>SB: UPDATE status = "analyzing"

    Note over GEN,VER: Phase 02 — Code Gen + Deploy
    GEN->>OAI: generateProofOfWorkCode(analysis)
    OAI-->>GEN: { files: {...}, project_name }
    GEN->>VER: POST /v13/deployments (project files)
    VER-->>GEN: { id: deploy_id }
    GEN->>VER: GET /v13/deployments/deploy_id (poll)
    VER-->>GEN: { readyState: "READY", url }
    GEN-->>P: data: { event: "project_url", url }
    GEN->>SB: UPDATE status = "generating_code"

    Note over GEN,OAI: Phase 03 — Resume Realignment
    GEN->>OAI: realignResume(raw, analysis)
    OAI-->>GEN: optimized_resume text
    GEN-->>P: data: { event: "optimized_resume", text }
    GEN->>SB: UPDATE status = "synthesizing"

    Note over GEN,OAI: Phase 04 — Outreach Assembly
    GEN->>OAI: generateOutreachAssets(analysis, url)
    OAI-->>GEN: { cover_letter, outreach_message }
    GEN-->>P: data: { event: "cover_letter", text }
    GEN-->>P: data: { event: "outreach_message", text }
    GEN->>SB: UPDATE status = "completed" + all outputs
    GEN-->>P: data: { event: "complete" }
    GEN-->>P: SSE stream closes
    P->>U: Results panel renders
```

### SSE Fallback: Polling Mode

```mermaid
sequenceDiagram
    participant P as page.tsx
    participant GEN as /api/generate
    participant POLL as /api/status/[id]
    participant SB as Supabase

    P->>GEN: SSE connection attempt
    GEN--xP: Connection drops (network error)
    P->>P: Catch AbortError / fetch failure
    P->>POLL: Start polling every 3s
    POLL->>SB: SELECT ... WHERE id = packageId
    SB-->>POLL: { status, outputs }
    POLL-->>P: { status: "completed", optimized_resume, ... }
    P->>P: Render results panel
```

---

## Component Architecture

| Component | File | Responsibility |
|-----------|------|----------------|
| **Main Dashboard** | `app/page.tsx` | Form state, SSE orchestration, polling fallback, log stream |
| **Pipeline Tracker** | `components/PipelineTracker.tsx` | 4-step vertical tracker with idle/active/done/error states |
| **Preset Selector** | `components/PresetSelector.tsx` | One-click template hydration for 3 demo configurations |
| **Resume Dropzone** | `components/ResumeDropzone.tsx` | PDF/DOCX drag-and-drop → /api/parse-resume → text |
| **Generation Results** | `components/GenerationResults.tsx` | Tabbed panel: resume, cover letter, outreach, project URL |

---

## Library Modules

| Module | File | Key Functions |
|--------|------|---------------|
| **OpenAI** | `lib/openai.ts` | `analyzeJobDescription`, `generateProofOfWorkCode`, `realignResume`, `generateOutreachAssets` |
| **Vercel** | `lib/vercel.ts` | `deployProject`, `pollDeployment`, mock URL fallback |
| **Supabase** | `lib/supabase.ts` | Lazy `getSupabaseAdmin()`, `isSupabaseConfigured()` |
| **Document Parser** | `lib/document-parser.ts` | `parsePDF` (pdfjs-dist), `parseDOCX` (mammoth) |
| **Presets** | `lib/presets.ts` | 3 `Preset` objects with pre-filled JDs + resumes |

---

## API Routes

### `POST /api/packages`

Creates an `application_packages` row in Supabase. Returns a UUID. Falls back to local UUID if Supabase is not configured.

**Request:**
```json
{
  "user_name": "Alex Rivera",
  "target_company": "ChainForge Labs",
  "recruiter_name": "Sarah Mitchell",
  "raw_resume_text": "...",
  "job_description": "..."
}
```

**Response:** `{ "id": "uuid-v4" }`

---

### `POST /api/parse-resume`

Accepts multipart form data with a `file` field (PDF or DOCX). Extracts clean text.

**Response:**
```json
{
  "text": "Full name\nemail@...\n\nEDUCATION...",
  "wordCount": 312,
  "pageCount": 2,
  "filename": "resume.pdf"
}
```

---

### `GET /api/generate`

Core SSE endpoint. Streams JSON-encoded events across all 4 pipeline phases.

**Query Parameters:**
- `packageId` — Supabase record ID
- `userName` — Applicant full name
- `jd` — URL-encoded job description
- `resume` — URL-encoded raw resume text
- `company` — URL-encoded target company name
- `recruiter` — URL-encoded recruiter name

**SSE Events:**

| Event | Data Fields | Description |
|-------|------------|-------------|
| `phase_start` | `phase`, `label` | Pipeline phase begins |
| `phase_progress` | `data: { role, keywords, stack }` | Analysis results |
| `phase_complete` | `phase` | Phase finished |
| `log` | `level`, `message` | Real-time log entry |
| `project_url` | `url`, `isFallback` | Deployed project URL |
| `optimized_resume` | `text` | Realigned resume text |
| `cover_letter` | `text` | Generated cover letter |
| `outreach_message` | `text` | LinkedIn DM / cold email |
| `complete` | `packageId`, `summary` | All phases complete |
| `error` | `message` | Fatal pipeline error |

---

### `GET /api/status/[id]`

Polling fallback. Returns current package status + available output fields.

---

## Data Model

### `application_packages` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_name` | TEXT | Full name of applicant |
| `target_company` | TEXT | Optional company name |
| `recruiter_name` | TEXT | Optional recruiter name |
| `raw_resume_text` | TEXT | Extracted resume text |
| `job_description` | TEXT | Full JD text |
| `project_demo_url` | TEXT | Vercel URL (or sandbox fallback) |
| `optimized_resume` | TEXT | ATS-realigned resume |
| `cover_letter` | TEXT | Markdown cover letter |
| `outreach_message` | TEXT | LinkedIn DM template |
| `status` | TEXT | Pipeline state enum |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Status enum:** `idle → analyzing → generating_code → deploying → synthesizing → completed | failed`

---

## Technology Stack

| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| Framework | Next.js | 16.x (App Router) | Full-stack SSE support, edge runtime |
| Language | TypeScript | 5.x | Type safety across full stack |
| Styling | Tailwind CSS + Custom CSS | 3.x | Cream editorial palette, fine control |
| State | React 19 hooks | — | useState + useRef for SSE orchestration |
| Database | Supabase (PostgreSQL) | latest | Managed Postgres, simple client |
| LLM | OpenAI GPT-4o | — | Best-in-class NLP + code generation |
| PDF Parsing | pdfjs-dist | 5.x | Server-side, no canvas dependency |
| DOCX Parsing | mammoth | 1.x | Clean text extraction from .docx |
| Deployment API | Vercel REST API | v13 | Headless deployment of generated projects |
| Streaming | Server-Sent Events | Web standard | Unidirectional, HTTP-native, no WS overhead |
| IDs | uuid v4 | 10.x | Fallback package IDs without Supabase |

---

## Design Principles

### Zero-Fabrication Guardrail

The resume realignment system prompt explicitly prohibits inventing facts:

```
CRITICAL ZERO-FABRICATION GUARDRAIL:
- You MUST NOT invent job titles, companies, dates, or metrics
- You MUST NOT fabricate experience, skills, or achievements
- You MAY rephrase existing experience using the JD's exact vocabulary
- You MAY reorder sections to lead with the most relevant experience
```

This prevents hallucinated work history while still achieving maximum ATS alignment.

### Graceful Degradation

Every external service has a fallback:
- **Vercel failure** → Mock sandbox URL, pipeline continues
- **SSE connection drop** → Client-side polling every 3 seconds
- **Supabase unconfigured** → Local UUID, no persistence
- **OpenAI error in any phase** → Fallback content, subsequent phases continue

### Lazy Client Initialization

All API clients (OpenAI, Supabase) are instantiated on first use — not at module evaluation time — allowing production builds to succeed without environment variables set.

---

## Deployment

### Local Development

```bash
git clone https://github.com/your-org/easyjob.git
cd easyjob
npm install
cp .env.example .env.local
# Fill in API keys
npm run dev
# → http://localhost:3000
```

### Vercel Production

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables via Vercel dashboard or CLI:
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add VERCEL_API_TOKEN
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | GPT-4o API access |
| `NEXT_PUBLIC_SUPABASE_URL` | ☑ Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ☑ Optional | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ☑ Optional | Supabase service role |
| `VERCEL_API_TOKEN` | ☑ Optional | Live project deployment |
| `VERCEL_TEAM_ID` | ☑ Optional | Team accounts only |
| `NEXT_PUBLIC_APP_URL` | ☑ Optional | App base URL |

---

## Directory Structure

```
easyjob/
├── app/
│   ├── page.tsx              ★ Main dashboard + SSE client
│   ├── layout.tsx            Root layout + SEO
│   ├── globals.css           Design system (cream palette)
│   └── api/
│       ├── packages/         POST — create record
│       ├── parse-resume/     POST — file parser
│       ├── generate/         GET — SSE pipeline ★
│       └── status/[id]/      GET — polling fallback
│
├── components/
│   ├── PipelineTracker.tsx   ★ 4-step progress tracker
│   ├── PresetSelector.tsx    Quick template buttons
│   ├── ResumeDropzone.tsx    Drag-and-drop uploader
│   └── GenerationResults.tsx Tabbed output panel
│
├── lib/
│   ├── openai.ts             ★ GPT-4o integration
│   ├── vercel.ts             ★ Vercel deploy + poll
│   ├── supabase.ts           DB client (lazy init)
│   ├── document-parser.ts    PDF/DOCX → text
│   └── presets.ts            Demo configurations
│
├── supabase/
│   └── migrations/001_initial_schema.sql
│
├── docs/                     Extended documentation
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```
