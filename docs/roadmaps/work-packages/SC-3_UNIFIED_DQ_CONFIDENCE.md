# Work Package SC-3 — Unified DQ + Confidence Composite

**SPT:** SC-MD-SPT-0001  
**Priority:** P0  
**Status:** FOUNDATION LANDED (pure functions + tests) — ranking writeback disabled  
**Date:** 2026-08-15

## Problem

- `DataQualityService` assesses **snapshot** quality (LIVE/STALE/INVALID) only.
- Ranking uses a coarse `data_quality.level` → 100/70/40/50 mapping.
- Completeness ratios exist per scoring engine but are not one platform composite.
- `scoreConfidenceCalibration` is empirical hit-rate with `scoreImpactEnabled: false`.

## Delivered in this WP slice

- [x] `src/platform/MarketData/CompositeDataQuality.ts`
  - `computeCompositeDataQuality` (sourceCoverage × freshness × supplyTransparency × exchangeBreadth × outlierStability, renormalized)
  - `computeUnifiedConfidence` (multiplicative; **scoreImpactEnabled: false**)
  - `compositeLevelToRankingDqPoints` helper (documentation / optional future use)
- [x] Unit tests `tests/unit/compositeDataQuality.test.ts`

## Explicitly NOT done

- [ ] Replace ranking.service DQ input with composite (SC-7 dependency / Owner gate)
- [ ] Persist composite on every score payload
- [ ] Enable scoreImpact / recommendationImpact
- [ ] Wire MarketDataGateway snapshots automatically into composite at orchestrator

## DoD (full SC-3)

1. Single composite contract versioned  
2. Ranking consumers can opt-in without dual formulas  
3. Confidence never silently inflates scores until Owner sets impact flags  
4. Tests cover missing-factor renormalization and INVALID snapshot cap  
5. Evidence under `docs/evidence/sc-md/`

## Risk

Foundation is fail-closed and non-mutating. Enabling ranking impact is a separate governed mutation.
