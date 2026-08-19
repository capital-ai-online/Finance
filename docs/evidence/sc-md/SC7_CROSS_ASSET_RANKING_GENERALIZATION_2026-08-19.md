# SC-7 Phase D — Cross-Asset Ranking Generalization Evidence

**SPT:** `SC-MD-SPT-0001`  
**Work Package:** `SC-7_RANKING_COMPOSITE_OPT_IN`  
**Date:** 2026-08-19  
**Branch:** `agent/sc7-cross-asset-ranking-generalization`  
**Initial baseline:** `main@8cf8ba6a0be86c022e7fc71667271f97b686b2fd`  
**Status:** IMPLEMENTED / SHADOW — repository CI not yet executed  

## 1. Context

SC-2 C3 is Human-merged and the productive scoring chain now converges on UAI + ScoringModelRegistry + ScoringDispatcher + CanonicalScoreResult. The next SPT critical-path item is SC-7 full ranking generalization.

The historical `src/services/ranking.service.ts` remains Crypto-specific: its numeric rank formula consumes Crypto classification tier, liquidity and DQ. Reusing that formula for stock/forex/index/commodity/bond would silently introduce incomparable factors and is therefore prohibited.

A second comparability issue is visible in the C3 market-data compatibility contract: Crypto score presentation retains the historical 0..10 scale, while other financial asset classes retain 0..100 presentation. Equal-looking canonical score fields across different model families must therefore not be treated as globally calibrated values.

## 2. Phase-D architecture

New platform boundary:

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

Phase D implements the SPT modes as a shadow projection:

- `overall`
- `category`
- `tier`
- `growth`

The word "overall" does **not** mean that unrelated model families are automatically interleaved. It means overall ordering inside a proven comparison cohort.

### 3.1 Same-model score cohorts

Without additional calibration evidence, the default score cohort is:

```text
model:<modelId>@<modelVersion>
```

This permits, for example, stock/forex/index assets using the same `traditional-scoring@2.1.0` model to share a cohort while keeping Crypto, Commodity and Sovereign model outputs separate.

### 3.2 Cross-model comparability

Cross-model ordering requires `ScoreComparabilityEvidence`:

- `normalizedValue`
- `comparisonKey`
- `methodVersion`
- `evidenceId`
- `observedAt`
- `retrievedAt`
- `verified=true`

A label/key by itself is not enough. Unverified or non-finite normalization evidence fails closed. Phase D does **not** implement the calibration/normalization method itself; that requires separate validation evidence before a production impact gate can be considered.

### 3.3 Category / tier

Category and tier are peer-group refinements on top of the score-comparability cohort. Missing metadata excludes the candidate instead of substituting an invented category/tier.

### 3.4 Growth

Growth is not inferred from a score or model subcomponent. `growth` mode requires separate verified `GrowthRankingEvidence` with a shared comparison contract. Missing/unverified growth evidence fails closed.

## 4. Admission / fail-closed rules

A candidate is excluded when any of the following applies:

- CanonicalScoreResult is not `READY`.
- score/final_score is non-finite.
- UAI assetId and score integrity assetId differ.
- dispatcher/model/executor/result-contract lineage is missing.
- governance evidence is missing or explicitly ineligible.
- source conflict is present.
- operations state is `UNAVAILABLE` or `NO_RUNTIME_EVIDENCE`.
- required category/tier/growth/comparability evidence is absent or invalid.
- duplicate UAI identity appears in the same ranking universe.

`DEGRADED` remains admissible, matching the existing SC-7 governance posture; Phase D does not create a new threshold.

## 5. Determinism

Within a cohort:

1. ranking value descending;
2. exact ties resolved only by `assetId` ascending.

No hidden liquidity, tier, provider, model-family or asset-class factor is introduced as a tie-breaker.

Cross-cohort order is explicitly undefined (`crossCohortOrder=false`).

## 6. Non-impact invariants

Phase D intentionally leaves all existing productive behavior unchanged:

- `RANKING_SCORE_IMPACT_ENABLED=false` remains unchanged.
- `CROSS_ASSET_RANKING_IMPACT_ENABLED=false` is hard-coded.
- Existing Crypto ranking formula weights `0.70 / 0.15 / 0.10 / 0.05` are untouched.
- Existing Top-10 eligibility thresholds are untouched.
- Existing Crypto routes are untouched.
- No market-data ordering or UI ranking is changed.
- No score, ranking, provider-routing, billing, IAM, Supabase, Stripe or Render mutation occurs.
- No model weights/formulas are changed.

## 7. Static regression contract

`tests/unit/crossAssetRanking.test.ts` covers:

1. both legacy and cross-asset ranking impact flags remain false;
2. different model families are not interleaved by default;
3. cross-model ranking requires verified normalized comparison evidence;
4. unverified comparability evidence fails closed;
5. category/tier peer metadata is mandatory for those modes;
6. growth uses only verified growth evidence;
7. governance, identity and model-lineage failures exclude candidates;
8. duplicate identities are rejected;
9. deterministic assetId tie-breaking.

Repository TypeScript/unit/build execution is intentionally not performed before the PR in accordance with the repository cost policy. The separate M10 CI-authorization defect is being handled in parallel by the Owner and is not used to weaken these Phase-D invariants.

## 8. Enterprise / FinTech benchmark

Engineering benchmark only; no assertion of direct regulatory applicability.

- Federal Reserve SR 26-2 (2026) emphasizes risk-based model use, validation, model inventory, governance/controls, documentation and monitoring. Phase D keeps ranking use bounded by explicit model lineage and prevents unvalidated cross-model output comparability.
- NIST AI RMF 1.0 (currently under revision) emphasizes lifecycle governance, measurement and documented go/no-go decisions. Phase D therefore separates implementation from productive ranking impact and requires explicit evidence for calibration/growth comparisons.

## 9. Remaining SC-7 work

Phase D is a foundation, not the production activation step. Still open:

1. validated normalization/calibration methodology for any intended cross-model global cohort;
2. a canonical source for category/tier peer metadata outside Crypto where required;
3. verified GrowthRankingEvidence acquisition and comparison contracts;
4. shadow consumer/observability over real multi-asset universes;
5. drift/outcome analysis before activation;
6. explicit Owner decision before any `rankingImpactEnabled` change;
7. final repository CI/Governance and Human Merge.
