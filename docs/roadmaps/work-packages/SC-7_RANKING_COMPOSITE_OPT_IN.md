# Work Package SC-7 — Ranking Composite Opt-In (Phase A)

**SPT:** SC-MD-SPT-0001  
**Priority:** P1  
**Status:** PHASE A LANDED — mapping unified; scoreImpact still false  
**Date:** 2026-08-16

## Goal (Punkt 1)

Ranking resolves DQ contribution points via the SC-3 helper `compositeLevelToRankingDqPoints` instead of a duplicated inline ternary.

Optional `RankingDqOptions.compositeLevel` lets callers that already computed a composite pass the level explicitly — **same 100/70/40/50 map**, same formula weights.

## Delivered

- [x] `resolveRankingDqPoints` in `ranking.service.ts`
- [x] `calculateRankScore(..., options?)` optional composite level
- [x] `RANKING_SCORE_IMPACT_ENABLED = false` explicit constant
- [x] Unit tests: parity payload level ↔ compositeLevel; formula regression (92 for high/tier1 case)
- [x] Evidence under `docs/evidence/sc-md/`

## Explicitly NOT done (Owner gates)

- [ ] Flip `scoreImpactEnabled` / `rankingImpactEnabled` to true
- [ ] Change formula weights (0.70 / 0.15 / 0.10 / 0.05)
- [ ] Cross-asset rank modes (Overall / Category / Tier / Growth)
- [ ] Mandatory composite persistence on every payload

## DoD Phase A

1. One DQ point map shared with SC-3  
2. Existing consumers without options behave identically  
3. Tests prove numerical parity  
4. No silent score inflation flags

## Risk

Low: pure refactor of mapping path + optional argument. Eligibility thresholds unchanged.
