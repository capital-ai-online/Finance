# FIN-17 — Backend Ranking Authority Evidence — 2026-09-15

**Project:** `CAPITAL-AI-FINTECH`  
**Primary PVC:** `PVC-17 — Ranking / Decision Support`  
**Primary Owner:** `CAPITAL-AI-FINTECH`  
**Implementation baseline:** `main@5ae0fdd80b085740f92a5530c5561a06f760c7a3`  
**Current correlation baseline after PR #945 Human merge:** `main@bda779f709811ca87222218fbc71216ea5ff3c92`  
**Branch:** `agent/fintech-fin17-ranking-authority-20260915`  
**Status:** `BACKEND IMPLEMENTED / VALIDATION NOT RUN / FE HANDOFF REQUIRED`

## Trigger and authority

The FIN-17 roadmap trigger is satisfied by the Human merge of PR #942. The current Owner instruction to continue with the next FINTECH step selects FIN-17's productive backend rank/order authority work. PR #943 subsequently Human-merged the FIN-17 `HELD -> READY` project-surface update. PR #944 and PR #945 then advanced Governance/Documentary main state without changing any FIN-17 runtime/test file; this implementation branch was resynchronized against `main@bda779f709811ca87222218fbc71216ea5ff3c92` without importing those foreign-project files into its net diff.

SC-7 previously kept `CrossAssetRanking` shadow-only pending a separate Owner impact decision and runtime validation. This FIN-17 slice proposes that impact activation for **backend order projection only**. Merge remains Human/CODEOWNER-only and is not authorized by this evidence file.

## Implemented backend boundary

`CrossAssetRanking` remains the single ranking engine. FIN-17 adds no second ranker and no alternate score authority.

- `cross-asset-ranking/1.1.0` activates productive backend order projection.
- `backend-ranking-projection/1.0.0` adapts already-canonical `CanonicalScoreResult` values and UAI identity into `CrossAssetRanking`.
- `POST /api/crypto/score` remains the verified Crypto scoring boundary and now also accepts a bounded batch of 1..24 candidates. The batch returns `backendRanking` generated from the same canonical dispatcher results.
- `GET /api/registry/assets/verified-scores` remains the Traditional verified-score boundary. Existing screening governance now attaches `backendRanking` metadata to each result through the shared ranking authority.
- `GET /api/crypto/top10` retains the existing `isTop10Eligible` admission gate but delegates order to `CrossAssetRanking`; if more than one incomparable cohort would have to be merged, the route fails closed with `RANKING_COHORT_AMBIGUOUS`.

## Preserved invariants

- `ScoringDispatcher` remains the only productive model-execution authority.
- Crypto ranking formula weights and existing Top-10 eligibility thresholds are not changed.
- `RANKING_SCORE_IMPACT_ENABLED=false` remains unchanged; the legacy `rank_score` value remains available for compatibility but is not the FIN-17 order authority.
- No caller-provided score or classification gains authority.
- No cross-cohort ordering is created. `crossCohortOrder=false` remains invariant.
- No normalization/calibration evidence is invented. Cross-model/cross-asset comparison still requires separately verified `ScoreComparabilityEvidence`.
- No DATA provider/quality authority, Security authority, Frontend authority, deployment authority or production state is mutated.

## Material behavioral change

For `GET /api/crypto/top10`, eligibility is unchanged, but ordering is now the canonical score order produced by `CrossAssetRanking` inside the explicit comparable Crypto cohort instead of sorting by the legacy `rank_score` value. Deterministic exact-score ties use the existing `assetId` tie-breaker.

This is intentional FIN-17 consolidation and must remain visible in PR review; it is not represented as a no-op compatibility change.

## Frontend ownership boundary

`src/features/screening/ui/RankingBoard.tsx` belongs to the `CAPITAL-AI-FE` presentation consumer boundary and is intentionally **not changed** on this FINTECH branch.

Required downstream handoff after the FINTECH backend contract is validated and Human-merged:

1. consume the Crypto batch `backendRanking` and Traditional per-row `backendRanking` metadata;
2. remove browser-local financial-score ordering from `RankingBoard`;
3. render only backend-authoritative cohort rank/order;
4. fail closed rather than joining different `cohortKey` values into one financial order.

Until that owner-correct FE handoff is complete, FIN-17 remains `PARTIAL` rather than `DONE`.

## FIN-12 sequencing

FIN-12 (`ValidatedDataInput/1.0.0` -> versioned Financial Feature Contract) remains sequenced **after the complete FIN-17 exit**. It is not implemented on this branch because the current FIN-17 exit still requires the foreign-owner FE consumer handoff.

## Validation state before PR

Per repository cost-control policy, hosted TypeScript, unit, production build and PR CI are not run before PR creation. The branch contains focused regression tests for the new backend projection, dispatcher wiring, cohort isolation and ranking activation, but their execution state is `NOT RUN` until the PR validation phase.
