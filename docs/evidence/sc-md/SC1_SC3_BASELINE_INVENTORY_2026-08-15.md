# SC-1 / SC-3 Baseline Inventory — 2026-08-15

**Authority:** SC-MD-SPT-0001  
**Baseline:** branch work against current `main`  
**Mutation:** none to ranking formula / scoreImpact flags

## Classification worlds (SC-1)

| Path | Role | Action |
|---|---|---|
| `src/types/crypto.types.ts` | Canonical | KEEP |
| `src/types/crypto.ts` | Legacy enterprise payload | ADAPT via classificationAdapter |
| `src/agents/cryptoClassificationAgent.ts` | Free-text agent output | ADAPT via classificationAdapter |
| `src/services/classification.service.ts` | Deterministic symbol table | EXTEND later |
| `src/orchestrator/cryptoOrchestrator.ts` | Merge point | WIRE later |

## DQ / Confidence (SC-3)

| Path | Role | Action |
|---|---|---|
| `src/platform/MarketData/DataQualityService.ts` | Snapshot accept/reject | KEEP |
| `src/platform/MarketData/CompositeDataQuality.ts` | **NEW** composite | FOUNDATION |
| `src/services/ranking.service.ts` | Coarse DQ points | UNCHANGED this slice |
| `src/services/screeningEligibility.ts` | Fail-closed evidence rules | KEEP |
| `src/services/scoreConfidenceCalibration.ts` | Empirical calibration | KEEP (`scoreImpactEnabled: false`) |

## Tests added

- `tests/unit/classificationAdapter.test.ts`
- `tests/unit/compositeDataQuality.test.ts`

## Next Owner decision

1. Approve wiring of adapter in orchestrator (SC-1 remaining).  
2. Approve optional ranking consumer of composite level (SC-3 → SC-7).  
3. Keep scoreImpact disabled until backtest evidence (SC-8) supports calibration.
