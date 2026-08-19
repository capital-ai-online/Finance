# Work Package SC-7 — Ranking Composite Opt-In & Cross-Asset Generalization

**SPT:** SC-MD-SPT-0001  
**Priority:** P1  
**Status:** PHASE A–C LANDED · PHASE D IMPLEMENTED / SHADOW — cross-asset ranking contract; productive impact remains false  
**Date:** 2026-08-19

## Goal

SC-7 evolves ranking in controlled steps without silently changing financial decisions:

1. reuse SC-3 Data-Quality semantics in the existing Crypto rank formula; and
2. generalize ranking across canonical multi-asset scores **without assuming that different scoring models, intended-use segments or score scales are directly comparable**.

The productive Crypto formula and eligibility thresholds remain unchanged. Cross-asset ranking stays shadow/read-only until calibration evidence, runtime validation and a separate Owner impact decision exist.

## Delivered

### Phase A — shared DQ mapping
- [x] `resolveRankingDqPoints` in `ranking.service.ts`
- [x] `calculateRankScore(..., options?)` optional composite level
- [x] `RANKING_SCORE_IMPACT_ENABLED = false` explicit constant
- [x] Unit tests: parity payload level ↔ compositeLevel; formula regression (92 for high/tier1 case)

### Phase B — orchestrator opt-in
- [x] `cryptoOrchestrator.analyzeCrypto` passes `{ compositeLevel: composite.level }`
- [x] impact-off posture retained
- [x] pure SC-3 DQ point map retained

### Phase C — valuation / Crypto route wiring
- [x] `valuation.service.ts` routes existing DQ level explicitly
- [x] `cryptoRoutes.ts` uses `canonical.integrity.dataQuality`
- [x] no independent SC-3 composite is invented
- [x] formula weights / Top-10 thresholds unchanged

### Phase D — canonical cross-asset ranking foundation

#### New platform boundary
- [x] `src/platform/Ranking/contracts.ts`
- [x] `src/platform/Ranking/CrossAssetRanking.ts`
- [x] `src/platform/Ranking/index.ts`
- [x] `CROSS_ASSET_RANKING_CONTRACT_VERSION = cross-asset-ranking/1.0.0`
- [x] `CROSS_ASSET_RANKING_IMPACT_ENABLED = false`

#### Modes
- [x] `overall`
- [x] `category`
- [x] `tier`
- [x] `growth`

#### Comparability contract
- [x] Default score cohort = `model:<modelId>@<modelVersion>|asset-class:<assetClass>`
- [x] Same registry model id/version does **not** automatically create cross-asset comparability
- [x] Static review confirmed `traditional-scoring@2.1.0` uses different Stock vs. Forex/Index weight sets; intended-use segment therefore remains part of the default cohort boundary
- [x] Cross-model/cross-asset ranking is forbidden unless separately verified `ScoreComparabilityEvidence` exists
- [x] comparison evidence requires `normalizedValue`, `comparisonKey`, `methodVersion`, evidence lineage and `verified=true`
- [x] a comparison label/key alone cannot make heterogeneous score outputs comparable
- [x] `crossCohortOrder=false`; no global position exists across unproven cohorts

This restriction is additionally material because the C3 market-data compatibility layer preserves historical presentation scales: Crypto 0..10, other financial asset classes 0..100.

#### Growth contract
- [x] Growth is not inferred from canonical score or a model subcomponent
- [x] separate verified `GrowthRankingEvidence` is required
- [x] Growth comparison is only inside a shared explicit comparison contract

#### Admission / lineage
- [x] Canonical score must be `READY` and finite
- [x] UAI assetId must match score-integrity assetId
- [x] dispatcher/model/executor/result-contract lineage is mandatory
- [x] explicit governance evidence is mandatory
- [x] source conflict and unavailable/no-runtime-evidence fail closed
- [x] category/tier metadata fails closed when required by the selected mode
- [x] duplicate UAI identities are excluded

#### Determinism
- [x] rank value descending inside each comparable cohort
- [x] exact ties use only stable `assetId` ascending
- [x] no hidden liquidity/tier/provider/model-family tie-break factor

#### Regression proof prepared
- [x] `tests/unit/crossAssetRanking.test.ts`
- [x] proves default isolation by model version **and asset class**
- [x] proves Stock/Forex are not interleaved merely because they share `traditional-scoring@2.1.0`
- [x] proves verified normalization requirement for cross-model/cross-asset ranking
- [x] proves Growth evidence gate
- [x] proves governance/identity/lineage fail-closed rules
- [x] proves deterministic tie-break and duplicate rejection
- [x] proves both ranking impact flags remain false

Evidence: `docs/evidence/sc-md/SC7_CROSS_ASSET_RANKING_GENERALIZATION_2026-08-19.md`

## Explicitly NOT done / remaining Owner gates

- [ ] Flip `scoreImpactEnabled` / `rankingImpactEnabled` to true
- [ ] Change Crypto formula weights (`0.70 / 0.15 / 0.10 / 0.05`)
- [ ] Change existing Top-10 eligibility thresholds
- [ ] Invent a cross-model/cross-asset normalization algorithm
- [ ] Treat Crypto 0..10 and other model outputs as globally comparable without validation
- [ ] Treat Stock/Forex/Index as globally comparable merely because they share one registry model id/version
- [ ] Wire Phase-D ranking into productive API ordering, alerts, eligibility or UI decisions
- [ ] Persist cross-asset rank as a financial decision field
- [ ] Make an unverified Growth metric rank-eligible
- [ ] Mandatory composite persistence on every payload
- [ ] Compute an independent SC-3 composite inside `valuation.service.ts`/`cryptoRoutes.ts`

## DoD Phase D

1. Canonical multi-asset inputs use UAI + CanonicalScoreResult lineage
2. default cohorts are bounded by model version + asset class
3. cross-model/cross-asset ranking requires verified normalized comparison evidence
4. category/tier/growth modes fail closed when comparison metadata is absent
5. governance/source/operations/identity failures are explicit exclusions
6. deterministic ranking has no hidden financial tie-breaker
7. impact flags remain false and existing Crypto ranking is untouched
8. repository TypeScript/unit/build validation occurs only after PR creation under repository cost policy; the Owner-managed M10 authorization defect remains a parallel control-plane item

## Risk

### Existing phases
Low–medium. Phase B/C preserve the historical formula and thresholds. `unknown` composite maps to 50 ranking DQ points as documented.

### Phase D
Medium architectural scope but **no productive decision impact**. The principal risk is false output comparability. Phase D mitigates this by defaulting to model-version + asset-class cohorts and requiring independently verified normalized comparison evidence before different intended-use segments can share an ordering.

The Phase-D design follows enterprise model-risk practice by bounding intended model use, making limitations explicit, retaining traceable model identity/version/segment and separating implementation from activation/validation.
