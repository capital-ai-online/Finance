# CAPITAL-AI-FINTECH — Canonical Roadmap

**Project:** `CAPITAL-AI-FINTECH`  
**Folder:** `docs/projects/fintech/`  
**Owner/PVC:** `CAPITAL-AI-FINTECH / PVC-12..PVC-17`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — FIN-17 is terminal on main via PR #946 + #951; FIN-12 selected and re-correlated to the DATA ownership boundary  
**Baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
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
| FIN-12 Validated DATA → Feature Contract | `PARTIAL / P1 — SELECTED / DATA CONTRACT RETURN REQUIRED` | DATA/PVC-09..11 returns complete validated field/history semantics needed by productive crypto/traditional/commodity/sovereign feature inputs; then FINTECH binds every champion feature contract fail-closed |
| FIN-13 Scoring Models | `VERIFIED CORE / DRIFT WATCH` | no second registry |
| FIN-14 Scoring Orchestration | `VERIFIED CORE` | no second dispatcher |
| FIN-15 Domain executors | `VERIFIED/PARTIAL` + FIN-SEC-03 `IMPLEMENTED / EVIDENCE_READY`; SEC verification open | independent Security return for protected analysis boundary |
| FIN-16 Canonical scoring | `VERIFIED/PARTIAL` + FIN-SEC-02 `EVIDENCE_READY` / SEC verification open | independent SEC return |
| FIN-17 Ranking / Decision Support | `DONE_MAIN / TERMINAL` | backend authority PR #946 + FE backend-order consumer PR #951 are Human-merged; retain drift watch only |
| FIN-18 Asset-class inventory | `VERIFIED` | no inferred new class |
| FIN-19 Provider capability mapping | `PARTIAL / OPEN` | map to DATA `provider-matrix` without owning ingress/DQ |
| FIN-20 End-to-end scoring evidence | `PARTIAL / OPEN` | exact lineage through OPS trace after FIN-12 contract binding |
| FIN-DRIFT-01 Deterministic drift checks | `PLANNED` | stale projections fail closed |
| FIN-SEC-02 verified_screening | `IMPLEMENTED / EVIDENCE_READY`; SEC not self-closed | independent SEC verification |
| FIN-SEC-03 analysis entitlement | `IMPLEMENTED / EVIDENCE_READY`; SEC not self-closed | independent SEC verification; pre-PR/hosted tests remain truthfully separate |
| FT-P1-A honeypot simulation | Foundation on main; labelled corpus / real route coverage / SLA validation `OPEN` | independent labels; no self-labelled provider PASS |
| FT-7 Guarded Live / Single CEX | `BLOCKED` | separate architecture/security Owner decision |
| FT-8 Production hardening | `PLANNED` | after FT-7 decision |
| FT-9 DEX/Bridge/Cross-Chain | `PLANNED` | no productive DeFi/DEX execution authorized |
| SC-2 Commodity orchestrator residuals | detail evidence only until re-correlated | no second scoring authority |

No synthetic score fallback. Frontend is presentation-only. `ScoringDispatcher` remains the only productive scoring execution authority. Research/challenger models stay `scoreEligible=false` until governed promotion.

## FIN-SEC-03 implementation disposition

`FIN-SEC-03 / PVC-15` was Human-merged through PR #929 (`merge 103689c2f30536e573b7958f63b503ca428f69cf`):

- Backtest compatibility execution is gated server-side before history/provider work by the canonical subscription authority; current browser consumers use bearer-aware transport.
- Monte Carlo requires a fresh server-authoritative authorization/quota decision for every user-triggered execution; automatic/bypass execution is removed.
- `full_ai_analysis` is bound to the productive structured Anthropic/OpenAI portfolio-review executor; unavailable/missing providers fail closed with `503` and no heuristic substitute is emitted by the canonical extracted route.
- Buffett server authority is preserved.
- focused positive/negative regression tests and evidence are materialized in `docs/projects/fintech/evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md`.
- FINTECH does not self-assign Security `VERIFIED/CLOSED`; independent `CAPITAL-AI-SEC` verification remains required.

## FIN-17 terminal disposition

FIN-17 is complete for the bounded authority split that previously blocked FIN-12:

- PR #946 Human-merged the productive FINTECH backend rank/order authority based on `CrossAssetRanking` (`merge c8a88afc7f9cfad367b592e9567654451f81e436`).
- PR #951 Human-merged the FE consumer cutover so `RankingBoard` consumes authoritative backend ordering instead of browser-local score sorting (`merge 3aa41faa2742dfc2601339b000e660f271380cf1`).
- Supporting implementation evidence remains in `evidence/FIN_17_BACKEND_RANKING_AUTHORITY_2026-09-15.md`.

FIN-17 is therefore `DONE_MAIN / TERMINAL`; it is no longer an executable next slice.

## P1 selection after FIN-17

The selected FINTECH P1 item is now **`FIN-12 — Validated DATA → Feature Contract`**.

Current-main correlation proves the DATA handoff is necessary but not yet sufficient for the full FIN-12 exit gate. `ValidatedDataInput/1.0.0` currently provides the canonical validated snapshot/price boundary and `ValidatedHistoryInput` provides price-oriented history validation, while productive FINTECH feature builders also require:

- crypto market-cap/volume/supply fields with canonical provenance/freshness/DQ;
- traditional fundamentals with field-level validated provenance;
- validated history semantics for productive crypto/traditional consumers; and
- sovereign benchmark values that may legitimately be negative and therefore cannot be forced through positive-price-only history validation.

Those contract/provider/DQ semantics belong to `CAPITAL-AI-DATA / PVC-09..11`. FINTECH must not create a parallel provider-normalization or Data Quality plane. The exact current finding and required DATA return are recorded in `evidence/FIN_12_VALIDATED_FEATURE_BOUNDARY_RECORRELATION_2026-09-16.md`.

FINTECH runtime continuation resumes after the DATA return is integrated into then-current `main`, at which point every productive champion feature contract can be bound to the canonical validated input with focused positive/negative compatibility tests.

## Dependencies
DATA PVC-09..11 validated feature-input return, SEC verification, CLIENT trust boundary, OPS runtime/provider evidence, QM exact-head tests.

## Project exit gate
One active FINTECH roadmap; canonical scoring/ranking and entitlement evidence are owner-correct; FIN-12 consumes complete fail-closed DATA contracts without parallel provider/DQ authority; dated 2026-09-13 FINTECH archive is deleted.