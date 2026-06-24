# Contributing to EasyJob

Thank you for your interest in contributing to EasyJob! This document provides guidelines to help you contribute effectively.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Contribution Types](#contribution-types)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)

---

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. We are committed to maintaining a welcoming, inclusive community.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Local Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/easyjob.git
cd easyjob

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add at minimum: OPENAI_API_KEY

# Start the development server
npm run dev
```

### Verify Setup

```bash
# TypeScript check
npx tsc --noEmit

# Production build
npm run build
```

---

## Development Workflow

### Branch Naming

Use descriptive branch names:

```bash
git checkout -b feature/add-linkedin-parser
git checkout -b fix/sse-reconnection-timeout
git checkout -b docs/update-api-reference
git checkout -b refactor/lazy-vercel-client
```

### Commit Messages

Follow conventional commits:

```
feat: add LinkedIn job posting URL parser
fix: handle SSE drop during phase 3 realignment
docs: update API reference with new status fields
refactor: extract Vercel polling into separate module
test: add unit tests for document-parser PDF extraction
chore: upgrade pdfjs-dist to v5
```

---

## Contribution Types

### Bug Reports

Open a GitHub issue with:
- **Environment**: OS, Node.js version, browser
- **Steps to reproduce**: Numbered list
- **Expected vs actual**: What you expected vs what happened
- **Logs**: Any console errors or SSE event stream dumps

### Feature Requests

Open a GitHub issue tagged `enhancement` with:
- Problem statement: What workflow is broken or missing
- Proposed solution: High-level description
- Alternatives considered
- Reference to the feature spec in this repository

### Code Contributions

Priority areas:
1. **SSE stability improvements** — reconnection handling, heartbeat mechanism
2. **Document parsing** — better resume structure extraction, markdown preservation
3. **Preset templates** — additional industry/role configurations
4. **Error messages** — clearer user-facing error descriptions
5. **Tests** — unit and integration test coverage

---

## Pull Request Process

1. **Fork** the repository and create a branch from `main`
2. **Make changes** following the coding standards below
3. **Verify build**: `npm run build` must pass with no errors
4. **Test your changes** manually (see [EASYJOB_UNIT_INTEGRATION_TEST.md](EASYJOB_UNIT_INTEGRATION_TEST.md))
5. **Update docs** if adding new features or changing behavior
6. **Open PR** with:
   - Clear title describing the change
   - Description explaining the why, not just the what
   - Screenshots if UI changes are involved
   - Link to any related issues

### PR Checklist

```
- [ ] `npm run build` passes with no TypeScript errors
- [ ] No new ESLint warnings introduced
- [ ] UI changes tested in Chrome and Firefox
- [ ] New API endpoints have error handling for missing env vars
- [ ] SSE events follow the existing naming convention
- [ ] Zero-fabrication guardrail preserved if resume logic is modified
- [ ] README updated if new features added
- [ ] CHANGELOG.md updated under [Unreleased]
```

---

## Coding Standards

### TypeScript

- Strict mode enabled (`"strict": true` in tsconfig.json)
- Explicit return types on exported functions
- No `any` types — use `unknown` and type narrow
- Interfaces preferred over type aliases for object shapes

### API Routes

- All routes must handle missing env vars gracefully (return 503 or use fallback)
- SSE routes must use `try/catch` around all external calls
- Error responses: `{ error: "descriptive message" }` format
- Always set `Cache-Control: no-cache` on SSE responses

### SSE Events

Follow the existing event format:
```typescript
{ event: "event_name", ...otherFields }
```

Existing events must not be removed or renamed (breaking change).

### Client Components

- Mark with `"use client"` directive at top of file
- Never import server-only modules (lib/supabase, lib/openai) from client components
- Use `useCallback` for event handlers passed as props
- Clean up SSE streams and timers in `useEffect` cleanup

### CSS

- Use CSS custom properties from `globals.css` design tokens
- No inline `style` objects for layout — prefer CSS class names
- New component styles go in `globals.css` with a `/* ─── Component Name ─── */` section header

### Environment Variables

- Variables accessed at runtime only (never at module top level)
- New variables must be documented in `.env.example` and `docs/EASYJOB_ADMIN_GUIDE.md`
- Client-side variables must be prefixed with `NEXT_PUBLIC_`

---

## Review Process

All PRs require one approval from a maintainer. Reviews focus on:

1. **Correctness**: Does the code do what it claims?
2. **Resilience**: Does it fail gracefully when external services are unavailable?
3. **Zero-fabrication**: Does any resume-related change preserve the no-hallucination guardrail?
4. **Code quality**: Is it readable and maintainable?
5. **Documentation**: Are new behaviors documented?

---

## Questions?

Open a GitHub Discussion or reach out via the LinkedIn profile linked in the README.
