# Work Package SC-1 — Classification Consolidation

**SPT:** SC-MD-SPT-0001  
**Priority:** P0  
**Status:** TABLE EXPANSION LANDED (deterministic coverage) — Owner review for merge  
**Date:** 2026-08-15 / 2026-08-16

## Problem

Three incompatible `CryptoClassification` definitions coexist:

| Source | Shape |
|---|---|
| `src/types/crypto.types.ts` | Canonical 25-value `CryptoCategory` + tier |
| `src/types/crypto.ts` | Legacy `"Crypto" \| "Unknown"` |
| `src/agents/cryptoClassificationAgent.ts` | Free-text `category` / `sub_tier` |

Historically `ClassificationService` only hard-coded ~20 symbols.

## Delivered in this WP

- [x] `src/services/classificationAdapter.ts` — pure adapter + merge
- [x] Wire adapter into `cryptoOrchestrator` as single classification exit
- [x] Unit tests adapter + merge
- [x] Baseline + wiring evidence under `docs/evidence/sc-md/`
- [x] **Expand deterministic `ClassificationService` table** (table-driven; Stablecoin, RWA, AI/Data, L2, Oracle, Liquid Staking, Gaming, Storage, Privacy, Payments, Exchange, …)
- [x] Unit tests `tests/unit/classificationServiceTable.test.ts`

## Explicitly NOT done

- [ ] Deprecate / rename agent interface to `AgentCryptoClassificationRaw` at all import sites
- [ ] Delete or archive unused legacy type fields after full consumer audit
- [ ] SC-7 ranking writeback of composite DQ (separate Owner gate)

## DoD (full SC-1)

1. One canonical schema for all crypto scoring/ranking consumers  
2. Adapter used at orchestrator boundary  
3. No free-text category values in ranking payloads  
4. Tests green; no ranking formula change  
5. Deterministic table covers core categories beyond legacy ~20 symbols  
6. Evidence note under `docs/evidence/sc-md/`

## Risk

Low: additive table rows; fail-closed Unknown retained; no ranking formula mutation.
