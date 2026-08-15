# Work Package SC-3 — Unified DQ + Confidence Composite

**SPT:** SC-MD-SPT-0001  
**Priority:** P0  
**Status:** FOUNDATION LANDED + SC-7 PHASE A CONSUMER MAPPING  
**Date:** 2026-08-15 / 2026-08-16

## Problem

- `DataQualityService` assesses **snapshot** quality (LIVE/STALE/INVALID) only.
- Ranking used a coarse `data_quality.level` → 100/70/40/50 mapping (duplicated).
- Completeness ratios exist per scoring engine but are not one platform composite.
- `scoreConfidenceCalibration` is empirical hit-rate with `scoreImpactEnabled: false`.

## Delivered

- [x] `src/platform/MarketData/CompositeDataQuality.ts`
  - `computeCompositeDataQuality`
  - `computeUnifiedConfidence` (**scoreImpactEnabled: false**)
  - `compositeLevelToRankingDqPoints` helper
- [x] Unit tests `tests/unit/compositeDataQuality.test.ts`
- [x] **SC-7 Phase A:** `ranking.service` resolves DQ points via `compositeLevelToRankingDqPoints` + optional `compositeLevel` (same map; **RANKING_SCORE_IMPACT_ENABLED = false**)

## Explicitly NOT done

- [ ] Enable scoreImpact / recommendationImpact / rankingImpact
- [ ] Persist composite on every score payload as mandatory field
- [ ] Wire MarketDataGateway snapshots automatically into composite at every orchestrator path
- [ ] Change ranking formula weights

## DoD (full SC-3 + ranking writeback)

1. Single composite contract versioned  
2. Ranking consumers opt-in without dual formulas ← **Phase A done**  
3. Confidence never silently inflates scores until Owner sets impact flags  
4. Tests cover missing-factor renormalization and INVALID snapshot cap  
5. Evidence under `docs/evidence/sc-md/`

## Risk

Foundation and Phase A mapping are fail-closed / parity-preserving. Enabling ranking **impact** remains a separate governed mutation.
