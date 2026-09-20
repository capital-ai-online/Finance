# CAPITAL-AI-DATA — DATA-13 Capability Freshness Slice

**Date:** `2026-09-07`  
**Project:** `CAPITAL-AI-DATA`  
**Project stage:** `PVC-11`  
**DATA status:** `FRESHNESS_SLICE_IMPLEMENTED`  
**main SHA at branch creation:** `f8cdc390d47263c845a2f03827d62af429de1c5e`  
**Work branch:** `agent/data-13-freshness-20260907`

## Scope

Canonical evaluator `data-freshness/1.0.0` computes freshness from `observedAt` versus caller-supplied `evaluatedAt` against capability max-age:

- snapshot: `90_000` ms
- history: `86_400_000` ms
- news: `300_000` ms

`STALE` and `UNKNOWN` are not scoring-admissible. A claimed `FRESH`/`CURRENT` label cannot override the computed state.

The clock is deterministic: the evaluator does not call `Date.now()`.

## Residual

Provider-specific overrides beyond the three capability defaults remain backlog. Composite freshness scoring in `CompositeDataQuality.ts` remains FINTECH-owned and is untouched.
