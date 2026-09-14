# CAPITAL-AI-COMP — Canonical Roadmap

**Project:** `CAPITAL-AI-COMP`  
**Folder:** `docs/projects/compliance/`  
**Role:** cross-cutting Compliance assessment and regulatory traceability  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 contents folded into this file  
**Baseline:** `main@5dfdfbd4bad088777c48434e65fd7a7ec9921e36`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated sidecar roadmaps, pointer-only `ROADMAP.md` files and PR #900 staging artifacts are removed after this fold. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

### COMP-CARRY-01 — Existing non-terminal Compliance backlog
Carry forward all non-terminal compliance assessments, control mappings, regulatory traces and owner returns.

### COMP-PR900-01 — Production-readiness compliance dispositions
For readiness controls that require legal/compliance judgment, provide explicit disposition, scope, evidence and owner route. Do not let SEC/GOV/DOC synthesize legal PASS.

### COMP-PR900-02 — Auth/lifecycle compliance boundary
Review compliance implications of MFA/AAL, recovery, authentication lifecycle and provider evidence after current implementation/provider state is supplied; normative/security ownership remains separate.

### COMP-PR900-03 — Analytics/marketing/social privacy boundary
Assess provider analytics, PostHog/telemetry, SEO/marketing and social distribution flows for applicable data-minimization/privacy/compliance obligations without creating provider mutations.

### COMP-PR900-04 — Monetization/token/regulatory proposals
Before any regulated, entitlement, money-like or crypto-token implementation, classify applicable compliance/legal constraints and route required Human decisions.

**Exit:** no regulated expansion proposal is treated as implementation-ready without explicit compliance routing.

## Carried-forward baseline (pre-2026-09-13)

Detailed Compliance state remains canonical in `docs/compliance/CAPITAL-AI-COMP/**`.

| WP | State |
|---|---|
| COMP-01 Applicability | EXECUTED_CONTINUOUS |
| COMP-02 Requirements | DONE_ON_MAIN / CONTINUOUS |
| COMP-03 Control Mapping | DONE_ON_MAIN |
| COMP-04 Assessment | DONE_ON_MAIN |
| COMP-05 Findings | EXECUTED_CURRENT — COMP-GAP-008 resolved on main |
| COMP-06 Evidence | EXECUTED_HELD — external gates retained |
| COMP-07 Remediation Handoff | EXECUTED_HELD |
| COMP-08 Continuous Compliance | EXECUTED_CONTINUOUS |

Missing legal/regulatory evidence is routed, never inferred as PASS.

## Dependencies
SEC assurance, GOV authority, OPS provider/runtime evidence, DATA/FINTECH product semantics, SEO/SOCIAL analytics scopes.

## Project exit gate
One active COMP roadmap; all material compliance judgments are explicit, evidence-linked and owner-routed; unknowns remain visible.
