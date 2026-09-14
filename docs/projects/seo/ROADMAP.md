# CAPITAL-AI-SEO — Canonical Roadmap

**Project:** `CAPITAL-AI-SEO`  
**Folder:** `docs/projects/seo/`  
**Role:** cross-cutting SEO and Google Marketing execution/project coordination  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 contents folded into this file  
**Baseline:** `main@5dfdfbd4bad088777c48434e65fd7a7ec9921e36`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated sidecar roadmaps, pointer-only `ROADMAP.md` files and PR #900 staging artifacts are removed after this fold. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

### SEO-CARRY-01 — Existing non-terminal SEO backlog
Carry forward all non-terminal technical SEO, provider-read, dashboard, content/visibility, measurement and FE/OPS handoff work.

### SEO-PR900-01 — Least-privileged GSC/GA4/provider reads
Verify Search Console, URL Inspection, GA4 and GenAI-visibility reads with least privilege and current provider evidence. Provider-unavailable states remain explicit blockers/NOT_AVAILABLE.

### SEO-PR900-02 — Technical SEO owner returns
Complete FE/OPS technical-gate returns for robots, sitemap, canonical, 404, JSON-LD, prerender, SeoEngine/dashboard and deployed behavior where applicable.

### SEO-PR900-03 — Roadmap/document consolidation
Use this roadmap as the single project execution projection; retain legacy documents only as superseded/evidence references until their unique content is demonstrably preserved.

### SEO-PR900-04 — Measurable acceptance criteria
Define production-readiness SEO acceptance criteria from reproducible repository/provider evidence rather than estimated visibility.

## Carried-forward baseline (pre-2026-09-13)

Program detail remains in `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` and `docs/seo/**`.

| WP | State |
|---|---|
| WP-SEO-METRICS | READ_CONTRACT_READY / READ_BLOCKED_NOT_CONNECTED |
| WP-SEO-AI-VIS | READ_CONTRACT_READY / READ_BLOCKED_NOT_CONNECTED |
| WP-SEO-TECH-GATE | HANDOFF_READY / STARTED_AT_BOUNDARY |
| WP-SEO-SCHEMA | HANDOFF_READY / STARTED_AT_BOUNDARY |
| WP-SEO-TOPICS | NEXT after provider reads |
| WP-SEO-CONTENT | NEXT after topic evidence |
| WP-SEO-SPAM | apply existing negative gates |
| WP-SEO-CWV / IA / MEDIA / REFRESH / AUTHORITY | NEXT |
| WP-SEO-I18N / AGENT | LATER / CONDITIONAL |

No synthetic ranking/traffic/conversion/GenAI metrics. Provider-unavailable is not inferred as `NO_DATA` PASS.

## Dependencies
OPS deployment/provider evidence, FE implementation, QM checks, COMP/privacy for analytics.

## Project exit gate
One active SEO roadmap; technical gates are reproducible and provider-read state is either verified or explicitly owner-blocked.
