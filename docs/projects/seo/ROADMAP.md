# CAPITAL-AI-SEO — Project Roadmap

**Project:** `CAPITAL-AI-SEO`  
**Project folder:** `docs/projects/seo/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting SEO and Google Marketing execution/project coordination  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Detailed program roadmap:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`  
**Trust root:** `/AGENTS.md`

## Purpose

Thin owner-side execution surface. Detailed program state remains in the consolidated SEO/Google Marketing roadmap and `docs/seo/**`.

## Project-surface controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `SEO-PROJ-01` | Canonical project navigation | `README.md` + `ROADMAP.md` |
| `SEO-PROJ-02` | No productive PVC ownership | no `PVC-*` allocation |
| `SEO-PROJ-03` | No duplicate SEO truth | consolidated roadmap + `docs/seo/**` remain detail sources |
| `SEO-PROJ-04` | No infra/publishing authority | OPS/GOV remain owners |
| `SEO-PROJ-05` | Owner-routed productive changes | FE/OPS/GOV/COMP |
| `SEO-PROJ-06` | Single version authority | `package.json#version` |
| `SEO-PROJ-07` | Google-visible version evidence-gated | no PASS without identified Google surface |
| `SEO-PROJ-08` | Sitemap equals canonical public SEO routes | PR #760 on main **and** live sitemap 2026-09-06 |
| `SEO-PROJ-09` | Google/marketing evidence classified | `docs/seo/GOOGLE_MARKETING_EVIDENCE_CORRELATION_2026-09-06.md` |

## Current correlation — 2026-09-06

Against `main@076e88e231372b2c9a9191917090388486a6f2f8` and live production at 2026-09-06T10:01:01Z:

- WP-Q1-HARDEN repository: **IMPLEMENTED_ON_MAIN** (PR #760).
- Q1 claim: terminalisiert (`released`).
- Q1 production sitemap/robots: **beobachtet live**. Fünf kanonische URLs inkl. `/learning-platform`; `Allow: /learning-platform` in robots.txt.
- Production identity: `x-capital-ai-commit=d080def271f36b208b85c5272ef863431d386de1` (PR #760 merge), version `0.6.0`, branch `main`, provider `render`.
- Current main `076e88e2…` liegt eine COMP-Merge (PR #761) vor Production. Das ist kein offenes Q1-Sitemap-Delta.
- Live page version projection `0.6.0`: Seiten-Nachweis plus Identity-Header vorhanden.
- `GOOGLE_VISIBLE_PASS`: **NOT ENABLED**.
- GA4 Measurement-ID `G-0542DT2HCE` in live HTML vorhanden; das ist kein Data-API-/Realtime-PASS.
- CookieHub auf der Live-Homepage vorhanden; kein frischer Pre-Opt-in-Netzwerktrace.
- Search Console MCP: **NOT ENABLED**.
- `.mcp.json` GA4-Stanza vorhanden; aktueller API-Erfolg **NOT ENABLED**.
- WIF: nicht auf current main implementiert.
- Q3 GSC Domain-Verify bleibt historische Evidence.

Die konsolidierte Programm-Roadmap wird hier nicht editiert (`agent/seo-roadmap-recorrelation-20260905` ist paralleler Writer ohne offenen PR).

## Current project dependencies

| Target | Relationship |
|---|---|---|
| `CAPITAL-AI-FE` | public-page / `index.html`; optionales WP-D4 |
| `CAPITAL-AI-OPS` | Production bleibt OPS-owned; Q1-Sitemap ist live beobachtet |
| `CAPITAL-AI-GOV` | Write-Plane / Publishing-Control |
| `CAPITAL-AI-COMP` | Consent-/Marketing-Rechtsbewertung |

## Completion condition

- Q1 repository: complete after PR #760.
- Q1 production sitemap coverage: observed 2026-09-06T10:01Z on commit `d080def…`.
- WP-GOOGLE-EVIDENCE repository correlation: complete after Human merge of this evidence package. External Google PASS remains separate.

## Non-goals

No duplicate SEO truth, no productive PVC allocation, no implicit `PVC-19`, no automatic publication or infrastructure authority.
