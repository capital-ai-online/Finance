# CAPITAL-AI-FINTECH — Canonical Roadmap

**Baseline:** `main@4f2c746a20a8683d784a1cbe54c763a64ddd1da3`

**Project:** `CAPITAL-AI-FINTECH`  
**Folder:** `docs/projects/fintech/`  
**Owner/PVC:** `CAPITAL-AI-FINTECH / PVC-09..PVC-17`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-21 — FIN-21 post-merge state converged against current main; stale branch/validation projections retired  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

This file is the temporary active FINTECH execution projection until the separately requested Roadmap-removal work is freshly authorized and re-correlated. Historical/archive entries, old non-terminal markers, chat context and superseded branches are evidence only. A work item is executable only when it is currently active under `/AGENTS.md@CURRENT_MAIN` with a canonical identity or freshly defined/re-authorized by the Human/Owner in the current interaction.

`CAPITAL-AI-DATA` is not an independent Project Owner. PVC-09, PVC-10 and PVC-11 are FINTECH-owned under `CAPITAL-AI-FINTECH-DATA-OWNERSHIP-SUPERSESSION-2026-09-17`.

Canonical chain: Provider/data ingress → Evidence/Provenance/Freshness → Data Quality → Validated data → Feature Contract → ScoringModelRegistry → ScoringDispatcher → Domain Executor → CanonicalScoreResult → Ranking / Decision Support.

## Current bounded work

### FIN-12 — Validated data → Feature Contract

**State:** `DONE_MAIN / BOUNDED CONTRACT SLICE`

Human-merged PR #1037 (`692286551977e54d816812b70d5014d955c93183`) materialized the FINTECH-owned validated field/history boundary for crypto market-cap/volume/supply, traditional fundamentals, validated history and signed sovereign-yield semantics. The former foreign DATA dependency is retired; `PVC-09..11 -> PVC-12` remains an internal fail-closed FINTECH boundary.

### FINTECH startup/provider/promo-retirement

**State:** `DONE_MAIN`

Human-merged PR #1046 (`f4d94581eaa1e59b19c08293c4ddbda2f7d33d9a`) removed Alpaca/CoinGecko from bounded startup/readiness paths while retaining governed on-demand evidence and retired `promo_redemptions` through its guarded migration.

### FIN-21 — Multi-Asset Orchestrator Universe

**State:** `DONE_MAIN / TERMINAL PROJECTION SLICE`

Human-merged PR #1157 (`59b65e4907b27f57acd639d56f83ab365f30e4a5`) materialized the six-class read-only FINTECH universe/orchestration projection plus 20 Equity subclass lenses as `RESEARCH_TARGET_NOT_MODEL`, all without creating a second registry, dispatcher, taxonomy, provider plane or productive subclass score. Current main contains the merged implementation and remains descended from the merge commit. Evidence: `evidence/FIN_21_MULTI_ASSET_ORCHESTRATOR_UNIVERSE_2026-09-20.md`.

## Historical FINTECH work inventory — non-active unless currently revalidated

| ID | Historical state / current gate |
|---|---|
| FIN-12 Validated data → Feature Contract | `DONE_MAIN` through PR #1037; retain fail-closed drift watch |
| FIN-13 Scoring Models | `VERIFIED CORE / DRIFT WATCH` |
| FIN-14 Scoring Orchestration | `VERIFIED CORE` |
| FIN-15 Domain executors | `VERIFIED/PARTIAL`; independent Security return may remain |
| FIN-16 Canonical scoring | `VERIFIED/PARTIAL`; independent Security return may remain |
| FIN-17 Ranking / Decision Support | `DONE_MAIN / TERMINAL` |
| FIN-18 Asset-class inventory | `VERIFIED` |
| FIN-19 Provider capability mapping | `PARTIAL / OPEN`; re-evaluate expanded stock/crypto/commodity research requirements against the single ProviderMatrix and PVC-09..11 boundary |
| FIN-20 End-to-end scoring evidence | `PARTIAL / REVALIDATION READY`; FIN-12 bounded prerequisite is on main, exact runtime/OPS lineage evidence remains open |
| FIN-21 Multi-Asset Orchestrator Universe | `DONE_MAIN / TERMINAL PROJECTION SLICE` through PR #1157; six-class read-only projection plus Equity research lenses retained |
| FIN-DRIFT-01 Deterministic drift checks | historical `PLANNED`; not active by status alone |
| FIN-SEC-02 verified_screening | prior `IMPLEMENTED / EVIDENCE_READY`; independent SEC verification separate |
| FIN-SEC-03 analysis entitlement | prior `IMPLEMENTED / EVIDENCE_READY`; independent SEC verification separate |
| FT-P1-A honeypot simulation | historical partial state only |
| FT-7 Guarded Live / Single CEX | historical `BLOCKED`; no productive execution authorized |
| FT-8 Production hardening | historical `PLANNED`; not active by status alone |
| FT-9 DEX/Bridge/Cross-Chain | historical `PLANNED`; no productive DeFi/DEX execution authorized |
| SC-2 Commodity orchestrator residuals | detail evidence only until fresh correlation |

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

FIN-17 is `DONE_MAIN / TERMINAL`; it is not an executable next slice.

## FIN-12 contract requirements

Productive FINTECH feature builders may require:

- crypto market-cap/volume/supply fields with canonical provenance/freshness/DQ;
- traditional fundamentals with field-level validated provenance;
- validated history semantics for productive crypto/traditional consumers; and
- sovereign benchmark values that may legitimately be negative and therefore cannot be forced through positive-price-only history validation.

Those contract/provider/DQ semantics belong to `CAPITAL-AI-FINTECH / PVC-09..11`. FINTECH must preserve a single provider-normalization and Data Quality plane. Historical evidence remains in `evidence/FIN_12_VALIDATED_FEATURE_BOUNDARY_RECORRELATION_2026-09-16.md` but does not activate work by itself.

## Dependencies

SEC verification, CLIENT trust boundary, OPS runtime/provider evidence, QM exact-head tests. PVC-09..11 data-ingress/evidence/DQ work is internal FINTECH ownership, not a foreign DATA-project dependency.

## Project exit gate

One active FINTECH roadmap; PVC-09..17 ownership is coherent; canonical provider/DQ/scoring/ranking and entitlement evidence are owner-correct; historical task state never self-activates; no parallel provider/DQ authority exists.
