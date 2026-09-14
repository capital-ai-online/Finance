# CAPITAL-AI-FINTECH — Canonical Roadmap

**Project:** `CAPITAL-AI-FINTECH`  
**Folder:** `docs/projects/fintech/`  
**Owner/PVC:** `CAPITAL-AI-FINTECH / PVC-12..PVC-17`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 folded; dated 2026-09-13 archive and FT-CORE-CRYPTO open items absorbed  
**Baseline:** `main@9da67c406abc89d7595c1ee14a75c4038232948b`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active FINTECH execution projection. Dated 2026-09-13 archive content and remaining FT-CORE-CRYPTO / SC-MD-SPT work are represented here. `docs/roadmaps/FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` and `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` are detail/evidence only.

Canonical chain: Validated DATA → Feature Contract → ScoringModelRegistry → ScoringDispatcher → Domain Executor → CanonicalScoreResult → Ranking / Decision Support.

## PR #900 / #901 work packages

### FIN-CARRY-01 — Existing non-terminal FINTECH backlog
Carry forward every non-terminal PVC-12..17 feature, model, strategy, scoring, ranking, entitlement, security-return and evidence package.

### FIN-PR900-01 — Verified DATA→feature→score→rank chain
Consume fail-closed DATA/PVC-11 output, preserve feature lineage, keep PVC-16 canonical scoring before PVC-17 ranking and forbid synthetic production fallback.

### FIN-PR900-02 — F01/F06 AI-chat trust
With CLIENT/PVC-01, separate retrieved/history data from instructions, preserve session/history role provenance and prove negative tests for indirect prompt injection and history-role spoofing.

### FIN-PR900-03 — Security entitlement child returns
Complete FINTECH-owned authorization evidence for Backtest, Monte Carlo, `full_ai_analysis`, remaining Buffett consumer integration and other FINTECH capability slices without changing business entitlement semantics.

### FIN-PR900-04 — SC-MD-SPT-0001 boundary preservation
Re-correlate the exact current technical financial-stage boundary; no frontend-local or alternate scoring authority.

### FIN-PR900-05 — Regulated expansion proposals
Treat money-like/token or monetization concepts as proposals only until GOV/COMP/SEC/OPS/Human routing is complete.

## Absorbed open FINTECH work (from 2026-09-13 archive + FT-CORE-CRYPTO)

| ID | State | Next gate |
|---|---|---|
| FIN-12 Validated DATA → Feature Contract | `PARTIAL` — upstream exit composed / mapping open | tested fail-closed `ValidatedDataInput` → feature mapping |
| FIN-13 Scoring Models | `VERIFIED CORE / DRIFT WATCH` | no second registry |
| FIN-14 Scoring Orchestration | `VERIFIED CORE` | no second dispatcher |
| FIN-15 Domain executors | `VERIFIED/PARTIAL` + FIN-SEC-03 OPEN | protected analysis boundary |
| FIN-16 Canonical scoring | `VERIFIED/PARTIAL` + FIN-SEC-02 `EVIDENCE_READY` / SEC verification open | independent SEC return |
| FIN-17 Ranking / Decision Support | `PARTIAL / P1` | one backend rank/order authority; FE consumes only |
| FIN-18 Asset-class inventory | `VERIFIED` | no inferred new class |
| FIN-19 Provider capability mapping | `PARTIAL / OPEN` | map to DATA `provider-matrix` without owning ingress/DQ |
| FIN-20 End-to-end scoring evidence | `PARTIAL / OPEN` | exact lineage through OPS trace |
| FIN-DRIFT-01 Deterministic drift checks | `PLANNED` | stale projections fail closed |
| FIN-SEC-02 verified_screening | `IMPLEMENTED / EVIDENCE_READY`; SEC not self-closed | independent SEC verification |
| FIN-SEC-03 analysis entitlement | `OPEN / REFERRED_NOT_EXECUTED` | server ALLOW/DENY for Backtest / Monte Carlo / `full_ai_analysis` |
| FT-P1-A honeypot simulation | Foundation on main; labelled corpus / real route coverage / SLA validation `OPEN` | independent labels; no self-labelled provider PASS |
| FT-7 Guarded Live / Single CEX | `BLOCKED` | separate architecture/security Owner decision |
| FT-8 Production hardening | `PLANNED` | after FT-7 decision |
| FT-9 DEX/Bridge/Cross-Chain | `PLANNED` | no productive DeFi/DEX execution authorized |
| SC-2 Commodity orchestrator residuals | detail evidence only until re-correlated | no second scoring authority |

No synthetic score fallback. Frontend is presentation-only. `ScoringDispatcher` remains the only productive scoring execution authority. Research/challenger models stay `scoreEligible=false` until governed promotion.

## Dependencies
DATA PVC-09..11, SEC verification, CLIENT trust boundary, OPS runtime/provider evidence, QM exact-head tests.

## Project exit gate
One active FINTECH roadmap; canonical scoring/ranking and entitlement evidence are owner-correct; dated 2026-09-13 FINTECH archive is deleted.
