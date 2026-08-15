# ADR-DRAFT: Prerender / SSG for public SPA routes

**Status:** DRAFT — not authorized for production cutover  
**Date:** 2026-08-15  
**Roadmap:** SEO-ROADMAP-0001 / S2  
**Related:** D2 route meta, D3 soft-404, Q1 sitemap

## Context

CAPITAL-AI is a Vite React SPA. Crawlers that do not execute JS see an empty `#root`.
Public marketing/legal routes (`/`, `/impressum`, `/agb`, `/datenschutz`) need indexable HTML.

## Decision (proposed)

1. **Build-time prerender** of the public path set only (not authenticated app routes).
2. Emit static HTML files under `dist/` mirroring the path structure:
   - `dist/index.html`
   - `dist/impressum/index.html`
   - `dist/agb/index.html`
   - `dist/datenschutz/index.html`
3. Keep the React SPA for interactivity; prerendered HTML is the first paint / crawler shell.
4. Production server continues to use `express.static(dist)` so prerendered files are served first.
5. Soft-404 (`registerProductionSpaFallback`) remains required for unknown paths.

## Non-goals

- Full SSR for authenticated dashboards
- Next.js migration
- Prerender of every client-side route

## Implementation sketch

- `scripts/seo/prerender-public-routes.mjs` — post-`vite build` step
- Input: built `dist/index.html` + route title/meta map (`src/lib/routeSeo.ts`)
- Output: path-specific HTML with filled `<title>`, meta description, and a minimal visible body mirroring legal/marketing copy (or a noscript summary)

## Consequences

- Sitemap URLs become meaningfully indexable
- Slightly more complex CI build
- Content in prerendered legal pages must stay in sync with in-app legal components (manual or shared content module)

## Acceptance

- `curl -s https://capital-ai.online/impressum | grep -i impressum` returns text without requiring JS
- Unknown paths still return HTTP 404 (D3)
