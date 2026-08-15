# Evidence — SC-1 Orchestrator Wiring

**SPT:** SC-MD-SPT-0001  
**WP:** SC-1 Classification Consolidation  
**Date:** 2026-08-15  
**Branch:** `docs/sc-md-sc1-orchestrator-wiring-2026-08-15`

## Change summary

| Area | Before | After |
|---|---|---|
| Classification construction in `cryptoOrchestrator.analyzeCrypto` | Manual string matching on agent `category` + average confidence with deterministic | `adaptAgentClassification` → `ensureCanonicalClassification(ClassificationService)` → `mergeDeterministicAndAgentClassification` |
| Free-text on ranking path | Possible (agent raw strings partially mapped) | Impossible — only canonical `CryptoCategory` / `CryptoSubCategory` exit |
| Adapter version | `classification-adapter/1.0.0` | `classification-adapter/1.1.0` (adds merge) |
| Ranking / score formulas | unchanged | unchanged |
| SC-3 composite | not observed | computed as non-mutating observation; `scoreImpactEnabled` remains false |

## Merge preference (documented in adapter)

1. Deterministic `category_main` wins when ≠ Unknown  
2. Else agent canonical when ≠ Unknown  
3. Sub / asset_type / tier: deterministic if known, else agent, else infer  
4. Confidence = mean of both (clamped)  
5. Reasoning: det first, agent second, provenance tag

## Files touched

- `src/services/classificationAdapter.ts`
- `src/orchestrator/cryptoOrchestrator.ts`
- `tests/unit/classificationAdapter.test.ts`
- `docs/roadmaps/work-packages/SC-1_CLASSIFICATION_CONSOLIDATION.md`
- `docs/evidence/sc-md/SC1_ORCHESTRATOR_WIRING_2026-08-15.md`
- `.ai/work-claims/SC1-ORCHESTRATOR-WIRING-2026-08-15.json`

## Verification intent

- Unit tests cover merge preference, agent fallback, dual-Unknown fail-closed.
- No change to `calculateRankScore` / `isTop10Eligible` formulas.
- Owner merge gate: PR review + CI green.
