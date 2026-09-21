# SEO Landing Page Binding — 2026-09-22

**Project:** `CAPITAL-AI-SEO`  
**Canonical project folder:** `docs/projects/seo/`  
**Current-main baseline:** `main@9c8a3e80c4451ed0b6ea45f368175604608f6f4b`  
**Current frontend:** PR `#1241` / `SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d`  
**Canonical public landing:** `https://capital-ai.online/` (`/`)  
**Status:** `ACTIVE / CURRENT_FRONTEND_BOUND / FAQ_OPS_DEPENDENCY_OPEN`  
**Authority:** `/AGENTS.md@CURRENT_MAIN`

## Current-page contract

All active SEO work now targets the website actually present on current main. PR #1241 is the current graphical/runtime landing baseline; PR #1206 and PR #1209 are historical evidence only and must not block or define current SEO acceptance.

The visible root proposition is aligned to the current hero:
- “Marktdaten verstehen. Chancen besser erkennen.”
- Echtzeit-Marktdaten, KI-gestütztes Scoring und fundierte Analysen;
- global market/asset discovery and the currently rendered module/navigation structure.

Accordingly, this branch updates root route/prerender metadata to that current visible proposition and replaces stale Impressum “TMG §5” metadata with “§ 5 DDG”.

## Current public-route state

The currently converged canonical SEO route set remains:
`/`, `/universe`, `/learning-platform`, `/impressum`, `/agb`, `/datenschutz`.

The application also exposes `/faq` through the current Frontend. SEO Issue #1233 correctly requires FAQ metadata, sitemap and prerender coverage, but the production finite SPA allowlist/fallback is still OPS Issue #1223. The existing regression intentionally requires route SEO, sitemap, prerender, server allowlist and public HTML fallback to remain equal.

Therefore SEO does **not** add `/faq` prematurely in this PR. The exact continuation condition is: OPS #1223 merges and production routing is re-read; then SEO #1233 adds `/faq` atomically across the canonical public SEO surfaces.

## Work-package binding

All 16 SEO management lanes remain bound to the current root landing:
`WP-SEO-LAUNCH-01`, `METRICS`, `AI-VIS`, `TECH-GATE`, `SCHEMA`, `CWV`, `TOPICS`, `CONTENT`, `IA`, `MEDIA`, `REFRESH`, `AUTHORITY`, `SPAM`, `AGENT`, `I18N`, `REVIEW`.

Final Mobile/Desktop CWV is now **measurement/evidence-gated**, not held on a superseded frontend PR. GSC, GA4 and GenAI states remain separate provider-evidence lanes.

## Ownership boundaries

SEO owns search/content/metadata requirements and evidence coordination. Frontend remains presentation owner; OPS remains production/runtime owner; COMP owns substantive legal/FAQ wording; FINTECH owns market/scoring truth; SEC/QM/GOV retain their independent controls.

## Exit gate

1. Active SEO documents and PR evidence reference current main / PR #1241.
2. Root metadata describes the current visible landing rather than an older portal snapshot.
3. Impressum metadata uses DDG terminology.
4. No stale #1206/#1209 dependency is treated as a current blocker.
5. `/faq` remains explicitly blocked only on OPS #1223 until the cross-surface route equality can be preserved.
6. No repository state is misrepresented as GSC/GA4/CWV provider PASS.
