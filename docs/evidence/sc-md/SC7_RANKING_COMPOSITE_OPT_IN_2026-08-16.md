# Evidence — SC-7 Phase A Ranking Composite Opt-In

**SPT:** SC-MD-SPT-0001  
**Date:** 2026-08-16  
**Branch:** `docs/sc-md-sc7-ranking-composite-opt-in-2026-08-16`

## Change

| Before | After |
|---|---|
| Inline ternary in `calculateRankScore` for DQ points | `resolveRankingDqPoints` → `compositeLevelToRankingDqPoints` |
| No optional composite input | `RankingDqOptions.compositeLevel` optional |
| Implicit impact posture | `RANKING_SCORE_IMPACT_ENABLED = false` explicit |

## Formula (unchanged)

```
rank = 0.70 * finalScore + 0.15 * dqPoints + 0.10 * tierScore + 0.05 * liquidity
dqPoints: high=100, medium=70, low=40, unknown=50
```

## Verification

- Unit: `tests/unit/rankingService.test.ts` (parity + regression 92.0 for high/tier1/liq80/final90)
- Existing `isTop10Eligible` thresholds unchanged

## Non-goals

- No weight mutation
- No `scoreImpactEnabled: true`

## Remediation note (PR #349)

Initial PR body was free-form Summary (not canonical template v1.3.5). Body was replaced with full `CAPITAL_AI_PR_TEMPLATE_VERSION: 1.3.5` contract; claim `schemaVersion` corrected to `1.0.0`. Root cause: agent PR creation path skipped `renderPullRequestBody.mjs` / template fill.

## Authority

SC-MD-SPT-0001 SC-7 · SC-3 composite contract · DOCUMENTATION_HYGIENE_POLICY
