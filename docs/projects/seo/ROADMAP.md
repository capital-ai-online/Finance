# CAPITAL-AI-SEO — Project Roadmap

**Project:** `CAPITAL-AI-SEO`  
**Project folder:** `docs/projects/seo/`  
**Primary Productive PVC ownership:** `[]` / `N/A`  
**Primary Owner:** `CAPITAL-AI-SEO`  
**Role:** cross-cutting SEO and Google Marketing execution/project coordination  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Detailed program roadmap:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` (0002.16)  
**Correlation baseline:** `main@12c9e129c7302df0d1bce7640cd7888f0998b9ca`  
**Trust root:** `/AGENTS.md`

## Purpose

Thin owner-side execution surface. Program detail lives in the consolidated roadmap and `docs/seo/**`. The Owner instruction from 2026-09-07 reopened a bounded SEO roadmap work item after the historical 0002.15 closeout; this projection is re-established on current main after the repository transfer to `capital-ai-online/Finance`.

## Current project controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `SEO-PROJ-01` | Canonical project navigation | `README.md` + `ROADMAP.md` |
| `SEO-PROJ-02` | No productive PVC ownership | no `PVC-*` allocation |
| `SEO-PROJ-03` | No duplicate SEO truth | single program roadmap `SEO-GM-ROADMAP-0002` |
| `SEO-PROJ-04` | No infra/publishing authority | OPS/GOV remain owners |
| `SEO-PROJ-05` | Owner-routed productive changes | FE/OPS/GOV/COMP |
| `SEO-PROJ-06` | Honest measurement | no synthetic ranking/traffic/conversion/GenAI metrics |
| `SEO-PROJ-07` | Technical SEO drift controlled | public routes = sitemap = canonical/prerender allowlist |
| `SEO-PROJ-08` | Modern performance gate | FE-owned p75 LCP <=2.5s, INP <=200ms, CLS <=0.1 |
| `SEO-PROJ-09` | Search + onsite measurement | GSC + GA4 correlated, not numerically conflated |
| `SEO-PROJ-10` | GenAI Search visibility | Search Console GenAI report once read access exists |
| `SEO-PROJ-11` | Helpful/non-commodity content | intent + first-party evidence + Who/How/Why + refresh gate |
| `SEO-PROJ-12` | Living roadmap | impact/effort/owner/dependency/evidence/exit-gate per WP |

## Current correlation — 2026-09-11

- Repository: `capital-ai-online/Finance` (same transferred repository instance formerly addressed as `SvenKulessa/Finance`).
- Baseline: `main@12c9e129c7302df0d1bce7640cd7888f0998b9ca`.
- Since approval-base `main@7e5f783caa6cb33bca8346582b31ddda33258ed9`, 20 commits landed on main. None changed the three SEO files in this work item.
- Current `/AGENTS.md` remains Control Plane 2.9.0 across this movement and was re-read before PR creation; Approval-Envelope v3.4 still permits payload-equivalent synchronization with fresh correlation.
- Open PR #882 changes `.mcp.json`, `scripts/security/validateMcpExecutableIdentity.mjs` and `tests/unit/mcpExecutableIdentity.test.ts`; no SEO changed-file, semantic, namespace, authority or security overlap.
- Current Project: `CAPITAL-AI-SEO`.
- Current Project Folder: `docs/projects/seo/`.
- Primary PVC: `N/A` — cross-cutting, no productive PVC ownership.
- Primary Owner: `CAPITAL-AI-SEO`.
- Existing SEO baseline remains: robots/sitemap/canonical/404/JSON-LD/prerender/SeoEngine/dashboard implemented as previously evidenced; provider reads remain separately gated.
- Frontend performance implementation stays `CAPITAL-AI-FE`-owned; SEO only defines/consumes measurable CWV exit evidence.

## Prioritized roadmap projection

### NOW — highest value

1. `WP-SEO-METRICS` — read-only GSC + GA4 baseline; **STARTED_AT_GATE** (credentials/provider read required).
2. `WP-SEO-AI-VIS` — Search Console GenAI visibility baseline; **STARTED_AT_GATE**.
3. `WP-SEO-TECH-GATE` — crawl/index/canonical/sitemap regression contract; **STARTED_AT_BOUNDARY** -> FE/OPS.
4. `WP-SEO-SCHEMA` — structured-data lifecycle/validation; **STARTED_AT_BOUNDARY** -> FE.
5. `WP-SEO-TOPICS` — intent/topic/content-gap map; **STARTED** in program roadmap.
6. `WP-SEO-CONTENT` — non-commodity content brief contract; **STARTED**.
7. `WP-SEO-SPAM` — scaled-content/cloaking/doorway/link-scheme guardrails; **STARTED**.

### NEXT

1. `WP-SEO-CWV` — FE-owned field-performance evidence.
2. `WP-SEO-IA` — internal linking/orphan checks.
3. `WP-SEO-MEDIA` — preferred first-party image/video SEO readiness.
4. `WP-SEO-REFRESH` — content decay/cannibalization backlog.
5. `WP-SEO-AUTHORITY` — relevant backlink/unlinked-mention baseline and outreach planning.

### LATER / CONDITIONAL

1. `WP-SEO-I18N` only after real locale URLs exist.
2. `WP-SEO-AGENT` only after a validated browser-agent business case.
3. Publisher Preferred Sources work only for a real eligible editorial/news surface.

## Ownership boundary

SEO may define requirements, measurement, content/topic planning and evidence. Productive Frontend, runtime/deploy, external publishing and Compliance work remains with FE, OPS, GOV and COMP respectively. No foreign-owner productive implementation is silently bundled into this SEO branch.

## Completion condition for this work item

- consolidated roadmap is 0002.16 and current-main correlated;
- project roadmap and checklist mirror the same scope;
- every added WP has owner/status/impact/effort/evidence/exit gate;
- all WPs are started either by concrete SEO artifact, credential gate, foreign-owner handoff boundary, or explicit conditional gate;
- PR creation occurs only after final re-sync/correlation/validation and a current bounded Human/Owner Approval Envelope evaluates to `APPROVAL_STILL_VALID`.
