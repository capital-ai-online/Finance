# CAPITAL-AI-DATA — Canonical Roadmap

**Project:** `CAPITAL-AI-DATA`  
**Folder:** `docs/projects/data/`  
**Owner/PVC:** `CAPITAL-AI-DATA / PVC-09, PVC-10, PVC-11`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 contents folded into this file  
**Baseline:** `main@5dfdfbd4bad088777c48434e65fd7a7ec9921e36`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated sidecar roadmaps, pointer-only `ROADMAP.md` files and PR #900 staging artifacts are removed after this fold. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

### DATA-CARRY-01 — Existing non-terminal DATA backlog
Carry forward every non-terminal DATA ingestion, provenance, freshness, quality, lineage, authorization and evidence package.

### DATA-PR900-01 — Fail-closed DQ handoff
Preserve `PVC-11 → PVC-12` as a fail-closed Data Quality handoff. Provider provenance, freshness and DQ state must remain visible to FINTECH consumers.

**Exit:** unverifiable/stale/wrong-identity data cannot silently enter feature/scoring stages.

### DATA-PR900-02 — Evidence freshness semantics
Close S1-R2-11 with reproducible current/stale/wrong-identity semantics under PVC-10.

**Exit:** evidence freshness can be tested and produces deterministic non-synthetic outcomes.

### DATA-PR900-03 — Authorization/data-owner coverage
For DATA-owned routes/objects/fields, provide cross-role/cross-user negative evidence required by SEC V8 coverage; foreign route owners retain their own slices.

### DATA-PR900-04 — Product-chain lineage return
Provide exact lineage/provenance inputs required for canonical FINTECH feature/scoring/ranking; do not fill missing scores/data with frontend or synthetic fallback.

## Carried-forward baseline (pre-2026-09-13)

| ID | State |
|---|---|
| DATA-09 UAI / Data Ingestion | READY / ACTIVE BACKLOG |
| DATA-09 GOV-07 Newsfeed entitlement | PARTIAL — product access closed; authority-unavailable distinction open |
| DATA-10 Evidence Management | IMPLEMENTED — DATA evidence ready / SEC verification open |
| DATA-11 Data Quality | IMPLEMENTED — gate slice ready / source vocabularies retained |
| DATA-12 Provenance | IMPLEMENTED — lineage slice ready / correction version open |
| DATA-13 Freshness | IMPLEMENTED — capability max-age ready / provider overrides open |
| DATA-14 Provider Input Validation | IMPLEMENTED — canonical envelope ready / vendor dialects open |
| DATA-15 Data Contract Testing | READY |
| DATA-16 Evidence | READY / CONTINUOUS |

No synthetic provider data or synthetic DQ PASS. Scoring/ranking remain outside DATA.

## Dependencies
OPS provider/runtime evidence, SEC independent verification, FINTECH PVC-12..17 consumers, QM exact-snapshot evidence.

## Project exit gate
One active DATA roadmap; real provider data reaching product features is provenance/freshness/DQ traceable and all non-terminal baseline work remains represented.
