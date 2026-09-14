# CAPITAL-AI-FINTECH — Canonical Roadmap

**Project:** `CAPITAL-AI-FINTECH`  
**Folder:** `docs/projects/fintech/`  
**Owner/PVC:** `CAPITAL-AI-FINTECH / PVC-12..PVC-17`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 contents folded into this file  
**Baseline:** `main@7f06828841546aa07a9ddca63ec8a7eca77e92d6`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

### FIN-CARRY-01 — Existing non-terminal FINTECH backlog
Carry forward every non-terminal PVC-12..17 feature, model, strategy, scoring, ranking, entitlement, security-return and evidence package.

### FIN-PR900-01 — Verified DATA→feature→score→rank chain
Consume fail-closed DATA/PVC-11 output, preserve feature lineage, keep PVC-16 canonical scoring before PVC-17 ranking and forbid synthetic production fallback.

**Exit:** deterministic verified scoring/ranking consumes traceable DQ-approved data only.

### FIN-PR900-02 — F01/F06 AI-chat trust
With CLIENT/PVC-01, separate retrieved/history data from instructions, preserve session/history role provenance and prove negative tests for indirect prompt injection and history-role spoofing.

### FIN-PR900-03 — Security entitlement child returns
Complete FINTECH-owned authorization evidence for Backtest, Monte Carlo, `full_ai_analysis`, remaining Buffett consumer integration and other FINTECH capability slices without changing business entitlement semantics.

### FIN-PR900-04 — SC-MD-SPT-0001 boundary preservation
Re-correlate the exact current boundary and retain only owner-correct work; no frontend-local or alternate scoring authority is introduced.

### FIN-PR900-05 — Regulated expansion proposals
Treat money-like/token or monetization concepts as proposals only until GOV/COMP/SEC/OPS/Human routing is complete.

## Carried-forward baseline (pre-2026-09-13)

Canonical chain: Validated DATA → Feature Contract → ScoringModelRegistry → ScoringDispatcher → Domain Executor → CanonicalScoreResult → Ranking / Decision Support.

| ID | State |
|---|---|
| FIN-12 Validated DATA → Feature Contract | PARTIAL — upstream exit composed / mapping open |
| FIN-13 Scoring Models | VERIFIED CORE / DRIFT WATCH |
| FIN-14 Scoring Orchestration | VERIFIED CORE |
| FIN-15 Domain executors | VERIFIED/PARTIAL + FIN-SEC-03 OPEN |
| FIN-16 Canonical scoring | VERIFIED/PARTIAL + FIN-SEC-02 EVIDENCE_READY / SEC verification open |
| FIN-17 Ranking / Decision Support | PARTIAL / P1 — backend authority consolidation open |
| FIN-18 Asset-class inventory | VERIFIED |
| FIN-19 Provider capability mapping | PARTIAL / OPEN |
| FIN-20 End-to-end scoring evidence | PARTIAL / OPEN |
| FIN-DRIFT-01 Deterministic drift checks | PLANNED |
| FIN-SEC-02 verified_screening | IMPLEMENTED / EVIDENCE_READY; SEC not self-closed |
| FIN-SEC-03 analysis entitlement | OPEN / REFERRED_NOT_EXECUTED |

No synthetic score fallback. Frontend is presentation-only.

## Dependencies
DATA PVC-09..11, SEC verification, CLIENT trust boundary, OPS runtime/provider evidence, QM exact-head tests.

## Project exit gate
One active FINTECH roadmap; canonical scoring/ranking and entitlement evidence are owner-correct; no stale branch is treated as current without re-correlation.
