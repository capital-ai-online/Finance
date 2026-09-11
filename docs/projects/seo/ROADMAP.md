# CAPITAL-AI-SEO — Project Roadmap

**Project:** `CAPITAL-AI-SEO`  
**Project folder:** `docs/projects/seo/`  
**Primary Productive PVC ownership:** `[]` / `N/A`  
**Primary Owner:** `CAPITAL-AI-SEO`  
**Role:** cross-cutting SEO and Google Marketing execution/project coordination  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Detailed program roadmap:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` (0002.16)  
**Correlation baseline:** `main@eab5750a481fd68e93a41c409b561dabc4dcbf13`  
**Trust root:** `/AGENTS.md`

## Purpose

Thin owner-side execution surface. Program detail lives in the consolidated roadmap and `docs/seo/**`. The Owner instruction from 2026-09-07 reopened a bounded SEO roadmap work item after the historical 0002.15 closeout; 0002.16 is Human-merged through PR #883. The current bounded follow-up materializes the next measurement/evidence gate and the owner-correct Technical SEO / Structured Data handoff.

## Current project controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `SEO-PROJ-01` | Canonical project navigation | `README.md` + `ROADMAP.md` |
| `SEO-PROJ-02` | No productive PVC ownership | no `PVC-*` allocation |
| `SEO-PROJ-03` | No duplicate SEO truth | single program roadmap `SEO-GM-ROADMAP-0002` |
| `SEO-PROJ-04` | No infra/publishing authority | OPS/GOV remain owners |
| `SEO-PROJ-05` | Owner-routed productive changes | FE/OPS/GOV/COMP |
| `SEO-PROJ-06` | Honest measurement | no synthetic ranking/traffic/conversion/GenAI metrics |
| `SEO-PROJ-07` | Technical SEO drift controlled | public routes = sitemap = canonical/prerender/server allowlist |
| `SEO-PROJ-08` | Modern performance gate | FE-owned p75 LCP <=2.5s, INP <=200ms, CLS <=0.1 |
| `SEO-PROJ-09` | Search + onsite measurement | GSC + GA4 correlated, not numerically conflated |
| `SEO-PROJ-10` | GenAI Search visibility | dedicated Search Console GenAI read once capability exists |
| `SEO-PROJ-11` | Helpful/non-commodity content | intent + first-party evidence + Who/How/Why + refresh gate |
| `SEO-PROJ-12` | Living roadmap | impact/effort/owner/dependency/evidence/exit-gate per WP |

## Current correlation — 2026-09-11

- Repository: `capital-ai-online/Finance`.
- Baseline: `main@eab5750a481fd68e93a41c409b561dabc4dcbf13`.
- `/AGENTS.md` is Control Plane **2.10.0** and was read from this exact main baseline before implementation.
- PR #883 is Human-merged; SEO-GM-ROADMAP-0002.16 is therefore on main.
- Open PR #887 is `CAPITAL-AI-SEC`-owned and changes only Security roadmap/evidence files; no SEO changed-file or authority overlap.
- Current Project: `CAPITAL-AI-SEO`.
- Current Project Folder: `docs/projects/seo/`.
- Primary PVC: `N/A` — cross-cutting, no productive PVC ownership.
- Primary Owner: `CAPITAL-AI-SEO`.
- Existing SEO baseline remains: robots/sitemap/canonical/404/JSON-LD/prerender/SeoEngine/dashboard implemented as previously evidenced.
- Provider reads are not exposed to this Chat execution. `READ_BLOCKED_NOT_CONNECTED` is recorded instead of inventing `NO_DATA` or provider PASS.
- Frontend and runtime implementation stays with the canonical FE/OPS owners; SEO only materializes requirements, evidence contracts and handoff gates.

## Current bounded follow-up — 2026-09-11

### Measurement / AI visibility

- `WP-SEO-METRICS`: **READ_CONTRACT_READY / READ_BLOCKED_NOT_CONNECTED**.
- `WP-SEO-AI-VIS`: **READ_CONTRACT_READY / READ_BLOCKED_NOT_CONNECTED**.
- Evidence/read contract: `docs/seo/SEO_METRICS_AI_VIS_READ_BASELINE_2026-09-11.md`.
- The contract specifies reproducible GSC, GSC Generative-AI and GA4 windows/dimensions/metrics, URL-normalization rules and explicit `NOT_CONNECTED` / `NOT_AUTHORIZED` / `REPORT_UNAVAILABLE` / `NO_DATA_VERIFIED` / `READ_VERIFIED` states.
- Repository `.mcp.json` declares the pinned GA4 MCP executable identity, but the external host/credentials are not available in this execution. Search Console MCP remains unconnected.

### Technical SEO / Structured Data

- `WP-SEO-TECH-GATE`: **HANDOFF_READY / STARTED_AT_BOUNDARY**.
- `WP-SEO-SCHEMA`: **HANDOFF_READY / STARTED_AT_BOUNDARY**.
- Owner handoff: `docs/seo/SEO_TECH_GATE_SCHEMA_HANDOFF_2026-09-11.md`.
- Current gap: route inventory is duplicated across `routeSeo`, sitemap, prerender, server public allowlist and SPA fallback; current regression proves only `routeSeo ↔ sitemap` equality.
- Current schema gap: JSON-LD Organization/WebSite/SoftwareApplication is present and `softwareVersion` is covered indirectly, but no dedicated full-graph lifecycle regression was found.
- Productive implementation is intentionally not performed on this SEO branch.

## Prioritized roadmap projection

### NOW — highest value

1. `WP-SEO-METRICS` + `WP-SEO-AI-VIS` — **READ_CONTRACT_READY / BLOCKED_ON_CONNECTED_READ**; execute the bounded provider read when a least-privileged capability is explicitly connected.
2. `WP-SEO-TECH-GATE` + `WP-SEO-SCHEMA` — **HANDOFF_READY**; FE/OPS implement the specified deterministic route/schema regressions in their owner scope.
3. `WP-SEO-TOPICS` — enrich the seed topic map with real query/intent evidence once provider reads exist.
4. `WP-SEO-CONTENT` — produce first non-commodity pilot brief from the evidence-backed topic priority.
5. `WP-SEO-SPAM` — apply existing negative gates to every new content brief.

### NEXT

1. `WP-SEO-CWV` — FE-owned field-performance evidence.
2. `WP-SEO-IA` — internal linking/orphan checks.
3. `WP-SEO-MEDIA` — preferred first-party image/video SEO readiness.
4. `WP-SEO-REFRESH` — content decay/cannibalization backlog from real data.
5. `WP-SEO-AUTHORITY` — relevant backlink/unlinked-mention baseline and outreach planning.

### LATER / CONDITIONAL

1. `WP-SEO-I18N` only after real locale URLs exist.
2. `WP-SEO-AGENT` only after a validated browser-agent business case.
3. Publisher Preferred Sources work only for a real eligible editorial/news surface.

## Ownership boundary

SEO may define requirements, measurement, content/topic planning and evidence. Productive Frontend, runtime/deploy, external publishing and Compliance work remains with FE, OPS, GOV and COMP respectively. No foreign-owner productive implementation is silently bundled into this SEO branch.

## Completion condition for this follow-up

- real provider values are either read through an explicitly connected least-privileged capability or the blocked state remains truthfully documented;
- no `NO_DATA` state is inferred from missing connectivity;
- Technical SEO and Structured Data handoffs identify exact current repository gaps, target owners, minimum regressions and exit gates;
- project roadmap/checklist reference the new evidence and handoff artifacts;
- no protected Google marketing, credential, runtime, FE or OPS mutation occurs in SEO ownership.
