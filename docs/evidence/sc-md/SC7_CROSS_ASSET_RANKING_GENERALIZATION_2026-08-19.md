# SC-7 Phase D — Cross-Asset Ranking Generalization Evidence

**SPT:** `SC-MD-SPT-0001`  
**Work Package:** `SC-7_RANKING_COMPOSITE_OPT_IN`  
**Date:** 2026-08-19  
**Branch:** `agent/sc7-cross-asset-ranking-generalization`  
**Initial baseline:** `main@8cf8ba6a0be86c022e7fc71667271f97b686b2fd`  
**Status:** IMPLEMENTED / SHADOW — repository CI not yet executed  

## 1. Context

SC-2 C3 is Human-merged and the productive scoring chain converges on UAI + ScoringModelRegistry + ScoringDispatcher + CanonicalScoreResult. The next SPT critical-path item is SC-7 ranking generalization.

The historical `src/services/ranking.service.ts` remains Crypto-specific: its numeric rank formula consumes Crypto classification tier, liquidity and DQ. Reusing that formula for stock/forex/index/commodity/bond would silently introduce incomparable factors and is prohibited.

Two additional comparability risks were found during Phase-D static review:

1. the C3 market-data compatibility contract preserves historical presentation scales — Crypto 0..10, other financial asset classes 0..100;
2. `traditional-scoring@2.1.0` is one registry model id/version but its intended-use segments do not have identical math: Stock uses `STOCK_SCORING_WEIGHTS`, whereas Forex and Index use `FX_SCORING_WEIGHTS`.

Therefore **same model id/version is not sufficient evidence of cross-asset comparability**.

## 2. Phase-D architecture

```text
CanonicalScoreResult + UAI
        +
existing screening/governance evidence
        +
optional peer metadata / verified comparison evidence
        ↓
CrossAssetRanking
        ↓
mode-specific comparable cohorts
        ↓
ranked projection + explicit exclusions

CROSS_ASSET_RANKING_IMPACT_ENABLED=false
crossCohortOrder=false
```

Files:

- `src/platform/Ranking/contracts.ts`
- `src/platform/Ranking/CrossAssetRanking.ts`
- `src/platform/Ranking/index.ts`
- `tests/unit/crossAssetRanking.test.ts`

## 3. Ranking modes

Phase D implements shadow projections for:

- `overall`
- `category`
- `tier`
- `growth`

"Overall" means overall ordering **inside a proven comparison cohort**. It does not create a universal cross-asset rank by itself.

### 3.1 Default score cohorts

Without separate normalization evidence the default cohort is:

```text
model:<modelId>@<modelVersion>|asset-class:<assetClass>
```

Examples:

- `traditional-scoring@2.1.0 + stock` is separate from
- `traditional-scoring@2.1.0 + forex`, which is separate from
- `traditional-scoring@2.1.0 + index`.

This is intentionally stricter than model-version grouping because model intended use, factor coverage and weighting can differ by asset segment.

### 3.2 Cross-model / cross-asset comparability

Ordering across those default cohorts requires `ScoreComparabilityEvidence`:

- `normalizedValue`
- `comparisonKey`
- `methodVersion`
- `evidenceId`
- `observedAt`
- `retrievedAt`
- `verified=true`

A key/label alone is insufficient. Unverified or non-finite normalization evidence fails closed. Phase D does **not** invent or implement a calibration method; calibration remains a separately validated work item.

### 3.3 Category / tier

Category and tier refine an already-valid score-comparability cohort. Missing metadata excludes the candidate rather than inventing a category/tier.

### 3.4 Growth

Growth is never inferred from canonical score or model subcomponents. `growth` mode requires separate verified `GrowthRankingEvidence` with a shared comparison contract. Missing/unverified evidence fails closed.

## 4. Admission / fail-closed rules

A candidate is excluded when any of the following applies:

- CanonicalScoreResult is not `READY`;
- score/final_score is non-finite;
- UAI assetId and score-integrity assetId differ;
- dispatcher/model/executor/result-contract lineage is missing;
- governance evidence is missing or explicitly ineligible;
- source conflict is present;
- operations state is `UNAVAILABLE` or `NO_RUNTIME_EVIDENCE`;
- required category/tier/growth/comparability evidence is absent or invalid;
- duplicate UAI identity appears in the ranking universe.

`DEGRADED` remains admissible, matching the existing SC-7 governance posture; Phase D does not invent a new operations threshold.

## 5. Determinism

Within each valid cohort:

1. ranking value descending;
2. exact ties resolved only by stable `assetId` ascending.

No hidden liquidity, tier, provider, asset-class or model-family factor is applied as a tie-breaker. Cross-cohort order is explicitly undefined (`crossCohortOrder=false`).

## 6. Non-impact invariants

Phase D intentionally leaves productive behavior unchanged:

- `RANKING_SCORE_IMPACT_ENABLED=false` remains unchanged;
- `CROSS_ASSET_RANKING_IMPACT_ENABLED=false` is hard-coded;
- Crypto ranking weights `0.70 / 0.15 / 0.10 / 0.05` are untouched;
- Top-10 eligibility thresholds are untouched;
- existing Crypto routes are untouched;
- no market-data/API/UI ordering is changed;
- no score, provider-routing, billing, IAM, Supabase, Stripe or Render mutation occurs;
- no scoring-model weights or formulas are changed.

## 7. Static regression contract

`tests/unit/crossAssetRanking.test.ts` is prepared to prove:

1. legacy and cross-asset ranking impact flags remain false;
2. default cohorts are isolated by **model version and asset class**;
3. Stock/Forex sharing `traditional-scoring@2.1.0` are not interleaved by default;
4. cross-model/cross-asset ranking requires verified normalized evidence;
5. unverified comparability evidence fails closed;
6. category/tier metadata is mandatory for those modes;
7. growth uses only verified Growth evidence;
8. governance, identity, lineage and operations defects exclude candidates;
9. duplicate identities are rejected;
10. assetId is the deterministic tie-breaker.

Repository TypeScript/unit/build execution is intentionally not performed before PR creation under the repository cost policy. The Owner-managed M10 authorization defect is tracked separately and is not used to weaken Phase-D controls.

## 8. Enterprise / FinTech benchmark

Engineering benchmark only; no assertion of direct regulatory applicability.

- Federal Reserve SR 26-2 (2026) emphasizes risk-based intended model use, validation, model inventory, governance/controls, documentation and monitoring. Phase D treats output comparability as a model-use assumption requiring evidence rather than assuming it from shared identifiers or numeric ranges.
- NIST AI RMF 1.0 (under revision) emphasizes lifecycle governance, measurement and documented go/no-go decisions. Phase D therefore separates implementation, comparison measurement/evidence and later productive activation.

## 9. Remaining SC-7 work

Phase D is a foundation, not a production activation step. Still open:

1. validated normalization/calibration methodology for any intended cross-asset/cross-model cohort;
2. canonical category/tier peer metadata for non-Crypto assets where required;
3. verified GrowthRankingEvidence acquisition and comparison contracts;
4. shadow consumer/observability over real multi-asset universes;
5. drift/outcome analysis before activation;
6. explicit Owner decision before any `rankingImpactEnabled` change;
7. repository CI/Governance and Human Merge.
