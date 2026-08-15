# Work Package SC-7 — Ranking Composite Opt-In

**SPT:** SC-MD-SPT-0001  
**Priority:** P1  
**Status:** PHASE A + PHASE B LANDED — orchestrator wires compositeLevel; scoreImpact still false  
**Date:** 2026-08-16

## Goal

Ranking resolves DQ contribution points via the SC-3 helper `compositeLevelToRankingDqPoints` instead of a duplicated inline ternary.

Optional `RankingDqOptions.compositeLevel` lets callers that already computed a composite pass the level explicitly — **same 100/70/40/50 map**, same formula weights.

## Delivered

### Phase A
- [x] `resolveRankingDqPoints` in `ranking.service.ts`
- [x] `calculateRankScore(..., options?)` optional composite level
- [x] `RANKING_SCORE_IMPACT_ENABLED = false` explicit constant
- [x] Unit tests: parity payload level ↔ compositeLevel; formula regression (92 for high/tier1 case)
- [x] Evidence under `docs/evidence/sc-md/`

### Phase B (this commit)
- [x] `cryptoOrchestrator.analyzeCrypto` passes `{ compositeLevel: composite.level }` into `calculateRankScore`
- [x] Reasoning trail documents SC-7 Phase B + impact-off posture
- [x] Pure SC-3 level used for rank DQ points (unknown → 50 fail-closed)
- [x] Evidence `SC7_PHASE_B_ORCHESTRATOR_WIRING_2026-08-16.md`

## Explicitly NOT done (Owner gates)

- [ ] Flip `scoreImpactEnabled` / `rankingImpactEnabled` to true
- [ ] Change formula weights (0.70 / 0.15 / 0.10 / 0.05)
- [ ] Cross-asset rank modes (Overall / Category / Tier / Growth)
- [ ] Mandatory composite persistence on every payload
- [ ] Wire valuation.service / cryptoRoutes list|score|top10 (still payload-level path; no SC-3 composite there yet)

## DoD Phase A + B

1. One DQ point map shared with SC-3  
2. Existing consumers without options behave identically  
3. Orchestrator (primary multi-agent path) uses composite opt-in  
4. Tests prove numerical parity for explicit compositeLevel  
5. No silent score inflation flags

## Risk

Low–medium: Phase B uses pure `composite.level` for ranking points. When composite is `unknown`, rank DQ points are **50** (fail-closed) rather than the display rewrite on `payload.data_quality` (medium/high). Formula weights and eligibility thresholds unchanged. scoreImpact remains false.
