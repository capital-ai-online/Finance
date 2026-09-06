# CAPITAL-AI-SEO — Project Roadmap

**Project:** `CAPITAL-AI-SEO`  
**Project folder:** `docs/projects/seo/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting SEO and Google Marketing execution/project coordination  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Detailed program roadmap:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` (0002.15 in this PR)  
**Trust root:** `/AGENTS.md`

## Purpose

Thin owner-side execution surface. Program detail lives in the consolidated roadmap and `docs/seo/**`.

## Project-surface controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `SEO-PROJ-01` | Canonical project navigation | `README.md` + `ROADMAP.md` |
| `SEO-PROJ-02` | No productive PVC ownership | no `PVC-*` allocation |
| `SEO-PROJ-03` | No duplicate SEO truth | one program roadmap, updated in this PR |
| `SEO-PROJ-04` | No infra/publishing authority | OPS/GOV remain owners |
| `SEO-PROJ-05` | Owner-routed productive changes | FE/OPS/GOV/COMP |
| `SEO-PROJ-06` | Single version authority | `package.json#version` |
| `SEO-PROJ-07` | Google-visible version evidence-gated | no PASS without identified Google surface |
| `SEO-PROJ-08` | Sitemap equals canonical public SEO routes | PR #760 on main **and** live sitemap |
| `SEO-PROJ-09` | Google/marketing evidence classified | `docs/seo/GOOGLE_MARKETING_EVIDENCE_CORRELATION_2026-09-06.md` |
| `SEO-PROJ-10` | Program roadmap current-main closeout | consolidated roadmap 0002.15 in PR #764; no second SEO PR |

## Current correlation — 2026-09-06

Against `main@7fe061a897f669fd21ca4c46e564351e14f1c7dc` and live production:

- WP-Q1-HARDEN repository: **IMPLEMENTED_ON_MAIN** (PR #760).
- Q1 production sitemap/robots: **live**. Fünf kanonische URLs inkl. `/learning-platform`.
- Production identity: `x-capital-ai-commit=076e88e231372b2c9a9191917090388486a6f2f8`, version `0.6.0`, provider `render`.
- Current main liegt PR #762 (GOV) vor Production. Kein Sitemap-Delta.
- `GOOGLE_VISIBLE_PASS`: **NOT ENABLED**.
- GA4 Measurement-ID live vorhanden; kein Data-API-/Realtime-PASS.
- Search Console MCP / WIF: **NOT ENABLED**.
- S4 German-first Spec: **abgeschlossen**; kein produktives `hreflang`.
- WP-D4 / WP-D5 / N3-Renderer / N4-Kalender / Marketing-Runtime: **nicht SEO-schließbar in diesem PR**.

Die parallele Branch `agent/seo-roadmap-recorrelation-20260905` wird durch diese Datei + 0002.15 ersetzt. Kein zweiter SEO-PR.

## Remaining queue after Human merge of PR #764

Nur Owner-/Fremdowner-Gates, keine weiteren SEO-Dokumentations-PRs nötig:

1. Owner-separater read-only GSC-Check (Credentials) — sonst `NOT ENABLED`.
2. `CAPITAL-AI-FE`: optionales WP-D4 (CWV), falls messbar beauftragt.
3. Owner-Credentials: optionales WP-D5 Search Console MCP Read.
4. Owner-Entscheidungen außerhalb SEO: N3-Renderer, N4-Kalender, M5/M6, H/J/R.

## Completion condition

- SEO-owned repository work that does not need credentials or foreign runtime: complete after Human merge of PR #764.
- External Google PASS, MCP enablement, CWV, IAM/WIF and publishing remain separately gated.

## Non-goals

No duplicate SEO truth, no productive PVC allocation, no implicit `PVC-19`, no automatic publication or infrastructure authority.
