# CAPITAL-AI-FINTECH — Canonical Roadmap

**Project:** `CAPITAL-AI-FINTECH`  
**Folder:** `docs/projects/fintech/`  
**Owner/PVC:** `CAPITAL-AI-FINTECH / PVC-12..PVC-17`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — FIN-17 is `DONE_MAIN` via PR #946; REQ-COMP-034 return is rematerialized from fresh current main as FIN-12 + FIN-20 without consuming the stale historical FIN-12 branch as evidence  
**Baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active FINTECH execution projection. Dated archive content and remaining FT-CORE-CRYPTO / SC-MD-SPT work are represented here. `docs/roadmaps/FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` and `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` are detail/evidence only.

Canonical chain: Validated DATA → Feature Contract → ScoringModelRegistry → ScoringDispatcher → Domain Executor → CanonicalScoreResult → Ranking / Decision Support → OPS EventMesh / Traceability evidence surface.

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

## Absorbed open FINTECH work

| ID | State | Next gate |
|---|---|---|
| FIN-12 Validated DATA → Feature Contract | `IMPLEMENTED_BRANCH / PRE_PR_EVIDENCE_READY / P1` — rematerialized from `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc` | exact-head CI after Draft PR; Human merge required before `DONE_MAIN` |
| FIN-13 Scoring Models | `VERIFIED CORE / DRIFT WATCH` | no second registry |
| FIN-14 Scoring Orchestration | `VERIFIED CORE` | no second dispatcher |
| FIN-15 Domain executors | `VERIFIED/PARTIAL` + FIN-SEC-03 `IMPLEMENTED / EVIDENCE_READY`; SEC verification open | independent Security return for protected analysis boundary |
| FIN-16 Canonical scoring | `VERIFIED/PARTIAL` + FIN-SEC-02 `EVIDENCE_READY` / SEC verification open | independent SEC return |
| FIN-17 Ranking / Decision Support | `DONE_MAIN` — PR #946 / merge `c8a88afc7f9cfad367b592e9567654451f81e436` | preserve one backend rank/order authority; FE remains presentation-only |
| FIN-18 Asset-class inventory | `VERIFIED` | no inferred new class |
| FIN-19 Provider capability mapping | `PARTIAL / OPEN` | map to DATA `provider-matrix` without owning ingress/DQ |
| FIN-20 End-to-end scoring evidence | `IMPLEMENTED_BRANCH / FINTECH EVIDENCE_READY / OPS RETURN OPEN` | exact DATA evidence/correlation is bound through FIN-12 feature mapping, canonical score metadata and FIN-17 backend rank; actual EventMesh publication/operational trace projection remains OPS/PVC-18 |
| FIN-DRIFT-01 Deterministic drift checks | `PLANNED` | stale projections fail closed |
| FIN-SEC-02 verified_screening | `IMPLEMENTED / EVIDENCE_READY`; SEC not self-closed | independent SEC verification |
| FIN-SEC-03 analysis entitlement | `IMPLEMENTED / EVIDENCE_READY`; SEC not self-closed | independent SEC verification; pre-PR/hosted tests remain truthfully separate |
| FT-P1-A honeypot simulation | Foundation on main; labelled corpus / real route coverage / SLA validation `OPEN` | independent labels; no self-labelled provider PASS |
| FT-7 Guarded Live / Single CEX | `BLOCKED` | separate architecture/security Owner decision |
| FT-8 Production hardening | `PLANNED` | after FT-7 decision |
| FT-9 DEX/Bridge/Cross-Chain | `PLANNED` | no productive DeFi/DEX execution authorized |
| SC-2 Commodity orchestrator residuals | detail evidence only until re-correlated | no second scoring authority |

No synthetic score fallback. Frontend is presentation-only. `ScoringDispatcher` remains the only productive scoring execution authority. Research/challenger models stay `scoreEligible=false` until governed promotion.

## REQ-COMP-034 / FIN-12 + FIN-20 owner return

The stale historical branch `agent/fintech-fin12-validated-feature-contract-20260916` is explicitly **not** accepted as current evidence. The owner return is newly materialized from the current baseline on `agent/fintech-fin12-fin20-lineage-20260916`.

FIN-12 now adds a FINTECH-owned `validated-financial-feature-mapping/1.0.0` boundary on top of the DATA-owned `ValidatedDataInput/1.0.0` / `FintechDataHandoff` gate. It maps admitted numeric observations one-to-one into the target model's existing `featureContractVersion`, preserves provider/feed/evidence/timestamps/freshness/correlation, rejects duplicate source reuse, and creates no new model registry or feature-estimation authority.

FIN-20 adds `fintech-scoring-trace-lineage/1.0.0`. It succeeds only when the FIN-12 source evidence IDs remain present in `CanonicalScoreResult`, model/dispatcher/executor/result/feature metadata matches, and exactly one FIN-17 `CrossAssetRanking` entry carries the same scoring lineage. The resulting handoff preserves the exact correlation and evidence identities required by the existing OPS strict-binding surface while leaving EventMesh publication and `OperationalTraceStateSourceRecord` creation to `CAPITAL-AI-OPS / PVC-18`.

Target-local evidence: `docs/projects/fintech/evidence/FIN_12_FIN_20_DATA_FEATURE_SCORE_RANK_TRACE_2026-09-16.md`.

## FIN-SEC-03 implementation disposition

`FIN-SEC-03 / PVC-15` was Human-merged through PR #929 (`merge 103689c2f30536e573b7958f63b503ca428f69cf`; historical implementation branch `agent/fintech-fin-sec-03-analysis-entitlement-20260915`):

- Backtest compatibility execution is gated server-side before history/provider work by the canonical subscription authority; current browser consumers use bearer-aware transport.
- Monte Carlo requires a fresh server-authoritative authorization/quota decision for every user-triggered execution; automatic/bypass execution is removed.
- `full_ai_analysis` is bound to the productive structured Anthropic/OpenAI portfolio-review executor; unavailable/missing providers fail closed with `503` and no heuristic substitute is emitted by the canonical extracted route.
- Buffett server authority is preserved.
- focused positive/negative regression tests and evidence are materialized in `docs/projects/fintech/evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md`.
- FINTECH does not self-assign Security `VERIFIED/CLOSED`; independent `CAPITAL-AI-SEC` verification remains required.

## Current ordering

1. `FIN-12 + FIN-20 / REQ-COMP-034 owner return` is the active bounded FINTECH package. FIN-17 is already merged and no longer blocks it.
2. `FIN-SEC-02` and `FIN-SEC-03` remain FINTECH `EVIDENCE_READY`; independent Security verification remains foreign-owner work and is not reopened locally.
3. `FIN-19` is the next ordinary FINTECH provider-capability follow-on after the current owner return reaches its integration/return boundary, unless then-current evidence changes priority.
4. `FIN-DRIFT-01` remains P3.

## Dependencies
DATA PVC-09..11, SEC verification, CLIENT trust boundary, OPS runtime/provider evidence, QM exact-head tests.

## Project exit gate
One active FINTECH roadmap; canonical scoring/ranking and entitlement evidence are owner-correct; DATA identity/provenance is fail-closed through the FINTECH feature/score/rank lineage and handed to OPS without taking PVC-18 authority.
