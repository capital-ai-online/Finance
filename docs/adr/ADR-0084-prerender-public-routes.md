# ADR-0084 — Prerender / SSG for public SPA routes (WP-S2)

**Status:** Accepted  
**Implementation-Status:** Applied on production (build-wired prerender + spaFallback serve path HTML; evidence 2026-08-16)  
**Date:** 2026-08-15 (draft); numbered & accepted 2026-08-16  
**Roadmap:** SEO-GM-ROADMAP-0002 / WP-S2  
**Related:** WP-D2 route meta, WP-D3 soft-404, Q1 sitemap, ADR-0082 (SeoEngine separate)  
**Supersedes-Draft:** formerly `docs/adr/ADR-DRAFT-prerender-public-routes.md`

## Context

CAPITAL-AI is a Vite React SPA. Crawlers that do not execute JavaScript see an empty `#root`. Public marketing/legal routes (`/`, `/impressum`, `/agb`, `/datenschutz`) must remain indexable with meaningful HTML (title, description, canonical, and a minimal visible body).

A build-time prerender script and production SPA allow-list fallback were already implemented and live before formal numbering. This ADR records the architectural decision and closes the formal gate required by SEO-GM-ROADMAP-0002 §10.

## Decision

1. **Build-time prerender** of the public path set only (not authenticated app routes).
2. Emit static HTML files under `dist/` mirroring the path structure:
   - `dist/index.html`
   - `dist/impressum/index.html`
   - `dist/agb/index.html`
   - `dist/datenschutz/index.html`
3. Keep the React SPA for interactivity; prerendered HTML is the first paint / crawler shell (meta + `<noscript>` summary).
4. Production server uses `express.static(distPath, { redirect: false, index: false })` plus `registerProductionSpaFallback` so path-specific HTML is served when present; unknown paths remain real HTTP 404 (`text/plain`).
5. Soft-404 (WP-D3) remains required and is not replaced by prerender.
6. Route title/description source of truth for client hydration remains `src/lib/routeSeo.ts`; prerender script keeps an aligned route map (follow-up: single shared module).

## Non-goals

- Full SSR / React body hydration for authenticated dashboards
- Next.js or framework migration
- Prerender of every client-side route
- Invented full legal copy in noscript (only short, accurate summaries)

## Implementation (as applied)

| Component | Location |
|-----------|----------|
| Post-vite prerender | `scripts/seo/prerender-public-routes.mjs` (hooked from `npm run build`) |
| Route SEO map (client) | `src/lib/routeSeo.ts` + `main.tsx` load/popstate |
| Production allow-list + sendFile | `server/runtime/spaFallback.ts` (`buildPublicHtmlFiles`, `existingOrRoot`) |
| Static options | `express.static(..., { redirect: false, index: false })` (avoids Q2/S2 trailing-slash ping-pong) |

## Acceptance (verified 2026-08-16)

- `curl https://capital-ai.online/impressum` returns unique `<title>Impressum – CAPITAL-AI</title>`, matching meta, and `<noscript>` body containing “Impressum” without requiring JS
- Analogous unique titles live for `/`, `/agb`, `/datenschutz`
- Unknown paths (e.g. `/foo-bar-xyz`) still return **HTTP 404** `text/plain` (D3)

## Consequences

- Positive: Sitemap public URLs are meaningfully indexable for non-JS crawlers; aligns with Rich Results / title uniqueness from WP-D1/D2.
- Negative: Legal noscript text must stay in sync with in-app components (manual or shared content module as follow-up).
- Neutral: Full React-body SSR remains optional future work, not required for WP-S2 DoD.

## Security invariants

1. Request path may only select a finite allow-list branch; filesystem paths for `sendFile` are precomputed from trusted literals (`buildPublicHtmlFiles`).
2. No path traversal via request data into `sendFile`.
3. Unknown routes fail closed with 404 (no SPA shell for arbitrary paths).

## Numbering note

Collision check 2026-08-16: highest numbered active ADR on main is **ADR-0083** (server runtime consolidation). Next free number for this decision is **ADR-0084** (AUD5-F-002).
