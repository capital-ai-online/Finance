# Evidence — SC-7 Phase B Orchestrator Composite Wiring

**SPT:** SC-MD-SPT-0001  
**WP:** SC-7 Ranking Composite Opt-In  
**Date:** 2026-08-16  
**Branch:** `feat/sc-md-sc7-phase-b-orchestrator-composite-wiring-2026-08-16`

## Change

| Path | Change |
|---|---|
| `src/orchestrator/cryptoOrchestrator.ts` | `calculateRankScore(payload, finalScore, { compositeLevel: composite.level })` |
| Reasoning trail | Appends `[SC-7 Phase B] rankScore uses compositeLevel=…` |

## Invariants preserved

- `RANKING_SCORE_IMPACT_ENABLED = false`
- Formula weights `0.70 / 0.15 / 0.10 / 0.05` unchanged
- `isTop10Eligible` thresholds unchanged
- SC-1 classification adapter path unchanged
- SC-3 `computeCompositeDataQuality` / `computeUnifiedConfidence` remain observation-first

## Behavioral note (fail-closed)

When `composite.level === 'unknown'`, Phase B rank DQ points resolve to **50** via `compositeLevelToRankingDqPoints('unknown')`.

Previously the orchestrator only fed ranking through `payload.data_quality.level`, which rewrote `unknown` to `medium`/`high` for display. That rewrite still applies to the payload field returned to API consumers; only the rank-score calculation uses the pure composite level.

## Non-goals

- No flip of scoreImpact / rankingImpact
- No wiring of valuation.service or cryptoRoutes (no SC-3 composite computed there)
- No cross-asset rank modes

## Verification intent

- Existing `tests/unit/rankingService.test.ts` Phase A parity cases remain green
- CI class C: unit + build-and-test
- Owner merge required; agent does not self-merge
