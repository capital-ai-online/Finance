# Evidence — SC-7 Phase C valuation.service / cryptoRoutes Wiring

**Date:** 2026-08-16
**SPT:** SC-MD-SPT-0001
**Claim:** `SC7-PHASE-C-VALUATION-CRYPTOROUTES-WIRING-2026-08-16`

## What changed

| Item | Before | After |
|---|---|---|
| `src/services/valuation.service.ts` | `calculateRankScore(payload, scores.final_score ?? 0)` (implicit default fallback) | `calculateRankScore(payload, scores.final_score ?? 0, { compositeLevel: payload.data_quality?.level ?? null })` |
| `src/routes/cryptoRoutes.ts` (list / score / top10, 3 call sites) | `calculateRankScore(rankPayload, canonical.final_score)` (implicit default fallback) | `calculateRankScore(rankPayload, canonical.final_score, { compositeLevel: canonical.integrity.dataQuality })` |
| Independent SC-3 composite (`computeCompositeDataQuality`) | not computed at either call site | **still not computed** — this phase only routes the existing payload-level value through the explicit option |
| `RANKING_SCORE_IMPACT_ENABLED` | false | **still false** |
| Formula weights (0.70/0.15/0.10/0.05) | unchanged | **unchanged** |

## Why this is a numeric no-op (parity, not a behavior change)

`resolveRankingDqPoints` (SC-7 Phase A, `src/services/ranking.service.ts`) already resolves DQ points as:

```
options?.compositeLevel ?? payload.data_quality?.level ?? 'unknown'
```

Both call sites pass exactly the same value through the option that `resolveRankingDqPoints` would otherwise have picked up from `payload.data_quality.level` / `rankPayload.data_quality.level` (itself sourced from `canonical.integrity.dataQuality`, which shares the identical `'high'|'medium'|'low'|'unknown'` type as `CompositeDqLevel`). There is therefore no computation change — only explicit, self-documenting routing through the same SC-3 opt-in path the orchestrator (Phase B) already uses, satisfying the SC-7 Phase A DoD goal "one DQ point map shared with SC-3" for the two remaining payload-level consumers.

`tests/unit/valuationService.test.ts` proves this directly: for every DQ level (`high`/`medium`/`low`/`unknown`), `ValuationService.analyze()`'s rank score matches an independently computed `calculateRankScore(payload, finalScore)` call using the legacy default-fallback path (no options).

## Code

| File | Role |
|---|---|
| `src/services/valuation.service.ts` | explicit `compositeLevel` option |
| `src/routes/cryptoRoutes.ts` | explicit `compositeLevel` option, 3 call sites |
| `tests/unit/valuationService.test.ts` | new — parity proof for every DQ level |

## Non-goals (confirmed)

- No independent SC-3 composite (`computeCompositeDataQuality`) computed in `valuation.service.ts` or `cryptoRoutes.ts`
- No `scoreImpactEnabled` / `rankingImpactEnabled` mutation
- No formula weight change
- No cross-asset rank mode work
- No route-level integration tests added (mechanical, type-checked change; `cryptoRoutes.ts` had no pre-existing test coverage baseline)
