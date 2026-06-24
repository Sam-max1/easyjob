# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Yes    |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub Issues.**

Instead, email the maintainers directly via LinkedIn DM (link in README). You will receive an acknowledgment within 48 hours and a resolution timeline within 5 business days.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your suggested fix (if any)

---

## Security Considerations

### API Key Exposure

- `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `VERCEL_API_TOKEN` are server-side only and must **never** be prefixed with `NEXT_PUBLIC_`
- All sensitive keys are accessed only in Next.js API Routes (server-side) — never in `"use client"` components
- `.env.local` is git-ignored by default. Do not commit it.

### Input Validation

- Resume file size is limited to 10MB per upload
- File extension validation rejects non-PDF/DOCX files
- Job description and resume text are passed via query parameters with `encodeURIComponent` to prevent injection
- Supabase queries use parameterized inputs (Supabase client handles escaping)

### Zero-Fabrication Guardrail

The resume realignment system prompt contains explicit instructions prohibiting hallucination of work history. However, EasyJob is AI-powered and users should **always verify generated content** before submitting to employers.

### No Authentication (MVP)

EasyJob v1.0 has no authentication. Supabase RLS is set to allow public access (suitable for demo/MVP). For production deployments:
- Implement Clerk, Auth.js, or Supabase Auth
- Restrict RLS policies to authenticated users
- Rate-limit the `/api/generate` endpoint

### SSE Stream Safety

- SSE streams are read-only (GET requests) from client to server
- The generate endpoint does not accept or persist user-controlled HTML — all content is plain text
- Generated code is deployed to isolated Vercel projects, not the EasyJob application itself

### Dependency Security

Run `npm audit` periodically and address moderate/high vulnerabilities promptly.

```bash
npm audit
npm audit fix
```

---

## Data Handling

- Resume text and job descriptions are sent to OpenAI API for processing. Review [OpenAI's Privacy Policy](https://openai.com/privacy/) before deploying to production with real user data.
- Application packages are stored in Supabase PostgreSQL. Data is retained indefinitely in the MVP — implement TTL/cleanup for production.
- No analytics, tracking pixels, or third-party scripts are included in the frontend.
