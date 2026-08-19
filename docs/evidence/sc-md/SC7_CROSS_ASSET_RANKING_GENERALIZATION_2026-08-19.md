# SC-7 Phase D — Cross-Asset Ranking Generalization Evidence

**SPT:** `SC-MD-SPT-0001`  
**Work Package:** `SC-7_RANKING_COMPOSITE_OPT_IN`  
**Date:** 2026-08-19  
**Branch:** `agent/sc7-cross-asset-ranking-generalization`  
**Initial baseline:** `main@8cf8ba6a0be86c022e7fc71667271f97b686b2fd`  
**Status:** IMPLEMENTED / SHADOW — repository CI not yet executed  

## 1. Context

SC-2 C3 is Human-merged and productive scoring converges on UAI + ScoringModelRegistry + ScoringDispatcher + CanonicalScoreResult. SC-7 now generalizes ranking without changing financial decisions.

The historical `src/services/ranking.service.ts` is Crypto-specific and must not be generalized numerically to other asset classes. Static review also found two comparability hazards:

1. C3 market-data compatibility preserves Crypto 0..10 but other financial score presentation at 0..100;
2. `traditional-scoring@2.1.0` uses `STOCK_SCORING_WEIGHTS` for Stock but `FX_SCORING_WEIGHTS` for Forex/Index.

Therefore neither equal-looking numbers nor a shared model id/version prove cross-asset comparability.

## 2. Phase-D boundary

```text
CanonicalScoreResult + UAI
        +
existing governance / operations evidence
        +
optional peer metadata / verified comparison evidence
        ↓
CrossAssetRanking
        ↓
comparable cohort(s) + explicit exclusions

CROSS_ASSET_RANKING_IMPACT_ENABLED=false
crossCohortOrder=false
```

Files:

- `src/platform/Ranking/contracts.ts`
- `src/platform/Ranking/CrossAssetRanking.ts`
- `src/platform/Ranking/index.ts`
- `tests/unit/crossAssetRanking.test.ts`

## 3. Modes

Shadow projection supports `overall | category | tier | growth`. "Overall" means ordering inside a proven comparison cohort, never an automatic universal rank.

### 3.1 Default intended-use cohort

Without separate calibration evidence the cohort identity is:

```text
model:<modelId>@<modelVersion>
|asset-class:<assetClass>
|feature:<featureVersion>
|scoring:<scoringVersion>
```

Admission also requires `modelRegistryVersion`, `dispatcherVersion`, executor and result-contract lineage. A feature/scoring-contract drift therefore cannot silently share the old cohort.

### 3.2 Cross-model / cross-asset comparability

Ordering across default cohorts requires verified `ScoreComparabilityEvidence`:

- `normalizedValue`
- `comparisonKey`
- `methodVersion`
- `evidenceId`
- `observedAt`
- `retrievedAt`
- `verified=true`

A key/label alone is insufficient. Invalid/unverified normalization fails closed. Phase D does not invent the calibration method itself.

### 3.3 Category / tier

Category and tier refine an already-valid comparison cohort. Missing peer metadata excludes the candidate.

### 3.4 Growth

Growth is never inferred from canonical score. `growth` requires separate verified `GrowthRankingEvidence` with a shared comparison contract.

## 4. Admission / fail-closed rules

Exclude when:

- CanonicalScoreResult is not `READY` or carries non-finite score values;
- UAI assetId differs from integrity assetId;
- dispatcher/registry/model/executor/result/feature/scoring lineage is incomplete;
- governance evidence is missing/ineligible;
- source conflict exists;
- operations state is `UNAVAILABLE` or `NO_RUNTIME_EVIDENCE`;
- required category/tier/growth/comparability evidence is missing/invalid;
- duplicate UAI identity occurs.

`DEGRADED` remains admissible to preserve the existing SC-7 governance policy; Phase D creates no new operations threshold.

## 5. Determinism

Inside a cohort: ranking value descending, then stable `assetId` ascending. There is no hidden financial tie-breaker. Cross-cohort ordering is undefined.

## 6. Non-impact invariants

- `RANKING_SCORE_IMPACT_ENABLED=false` unchanged.
- `CROSS_ASSET_RANKING_IMPACT_ENABLED=false` hard-coded.
- Crypto weights `0.70 / 0.15 / 0.10 / 0.05` unchanged.
- Top-10 eligibility thresholds unchanged.
- No API/UI/market-data ordering is wired to Phase D.
- No model formula, provider routing, billing, IAM, Supabase, Stripe or Render mutation.

## 7. Static regression contract

`tests/unit/crossAssetRanking.test.ts` is prepared to prove:

1. both ranking impact flags remain false;
2. default cohorts isolate intended-use contracts (model + asset class + feature/scoring contract);
3. Stock/Forex do not interleave merely because they share `traditional-scoring@2.1.0`;
4. feature-contract drift creates a separate cohort;
5. cross-model/cross-asset rank requires verified normalized evidence;
6. category/tier/growth metadata fails closed;
7. governance, identity, lineage and operations defects exclude candidates;
8. duplicate identities are rejected;
9. assetId is the deterministic tie-breaker.

Repository TypeScript/unit/build execution is intentionally deferred until PR creation under the cost policy. The Owner-managed M10 defect is a separate control-plane track and does not weaken these invariants.

## 8. Enterprise / FinTech benchmark

Engineering benchmark only; no assertion of direct regulatory applicability.

- Federal Reserve SR 26-2 emphasizes intended model use, validation, inventory, governance/controls, documentation and monitoring. Phase D treats ranking comparability itself as an assumption requiring explicit evidence and contract lineage.
- NIST AI RMF 1.0 (under revision) supports lifecycle governance, measurement and documented activation decisions. Phase D separates implementation, comparison evidence and later productive activation.

## 9. Remaining SC-7 work

1. validated cross-cohort normalization/calibration methodology;
2. canonical category/tier metadata outside Crypto;
3. verified Growth evidence acquisition/contracts;
4. shadow consumer + observability over real multi-asset universes;
5. drift/outcome analysis;
6. explicit Owner decision before any ranking-impact activation;
7. repository CI/Governance + Human Merge.
