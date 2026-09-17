# Work Package SC-7 — Ranking Composite Opt-In

**SPT:** SC-MD-SPT-0001  
**Priority:** P1  
**Status:** PHASE A–C LANDED — orchestrator + valuation.service + cryptoRoutes all wire compositeLevel explicitly; scoreImpact still false  
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

### Phase C (this commit)
- [x] `valuation.service.ts` `ValuationService.analyze` passes `{ compositeLevel: payload.data_quality?.level ?? null }` into `calculateRankScore` instead of relying on the implicit default fallback
- [x] `cryptoRoutes.ts` — all three `rank_score` call sites (list/score/top10) pass `{ compositeLevel: canonical.integrity.dataQuality }`
- [x] No independent SC-3 composite computed at either call site (still payload-level `data_quality.level`/`integrity.dataQuality` as the source value) — this is explicit routing/consistency, not a new computation
- [x] Unit tests: `tests/unit/valuationService.test.ts` proves numerical parity between the explicit-option path and the legacy default-fallback path for every DQ level (`high`/`medium`/`low`/`unknown`)
- [x] Evidence under `docs/evidence/sc-md/SC7_PHASE_C_VALUATION_CRYPTOROUTES_WIRING_2026-08-16.md`

**Scope boundary:** `cryptoRoutes.ts` had no pre-existing unit test coverage; this change does not add route-level integration tests (out of scope for a mechanical, type-checked, single-line wiring change) — covered instead by the existing `resolveRankingDqPoints` parity guarantee (SC-7 Phase A) plus the new `valuationService.test.ts` parity proof for the identical pattern.

## Explicitly NOT done (Owner gates)

- [ ] Flip `scoreImpactEnabled` / `rankingImpactEnabled` to true
- [ ] Change formula weights (0.70 / 0.15 / 0.10 / 0.05)
- [ ] Cross-asset rank modes (Overall / Category / Tier / Growth)
- [ ] Mandatory composite persistence on every payload
- [ ] Compute an independent SC-3 composite (`computeCompositeDataQuality`) inside `valuation.service.ts`/`cryptoRoutes.ts` (Phase C only routes the existing payload-level value through the explicit option; a genuinely independent composite there is still open)

## DoD Phase A + B

1. One DQ point map shared with SC-3  
2. Existing consumers without options behave identically  
3. Orchestrator (primary multi-agent path) uses composite opt-in  
4. Tests prove numerical parity for explicit compositeLevel  
5. No silent score inflation flags

## DoD Phase C

1. `valuation.service.ts` and `cryptoRoutes.ts` route `calculateRankScore` through the explicit `compositeLevel` option
2. No behavior change — same DQ point map, same source value, numerically identical rank scores
3. No independent composite computed; no `scoreImpact`/`rankingImpact` mutation
4. Tests prove parity for every DQ level

## Risk

Low–medium: Phase B uses pure `composite.level` for ranking points. When composite is `unknown`, rank DQ points are **50** (fail-closed) rather than the display rewrite on `payload.data_quality` (medium/high). Formula weights and eligibility thresholds unchanged. scoreImpact remains false.

Phase C: Low — purely mechanical, type-checked routing of an already-present value through an existing, already-tested option parameter. No new computation, no behavior change (proven by parity test).
