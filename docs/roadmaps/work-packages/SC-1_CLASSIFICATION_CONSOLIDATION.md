# Work Package SC-1 — Classification Consolidation

**SPT:** SC-MD-SPT-0001  
**Priority:** P0  
**Status:** ORCHESTRATOR WIRING LANDED — Owner review for merge  
**Date:** 2026-08-15

## Problem

Three incompatible `CryptoClassification` definitions coexist:

| Source | Shape |
|---|---|
| `src/types/crypto.types.ts` | Canonical 25-value `CryptoCategory` + tier |
| `src/types/crypto.ts` | Legacy `"Crypto" \| "Unknown"` |
| `src/agents/cryptoClassificationAgent.ts` | Free-text `category` / `sub_tier` |

`ClassificationService` only hard-codes ~20 symbols; classifier coverage of the 25 categories is partial.

## Delivered in this WP slice

- [x] `src/services/classificationAdapter.ts` — pure adapter (agent → canonical, legacy → canonical, ensureCanonical)
- [x] `mergeDeterministicAndAgentClassification` — single classification exit (deterministic preferred when known)
- [x] Unit tests `tests/unit/classificationAdapter.test.ts` (incl. merge cases)
- [x] **Wire adapter into `cryptoOrchestrator` as single classification exit**
- [x] Baseline inventory evidence under `docs/evidence/sc-md/`
- [x] Wiring evidence `docs/evidence/sc-md/SC1_ORCHESTRATOR_WIRING_2026-08-15.md`

## Explicitly NOT done (requires Owner / follow-up commits)

- [ ] Expand deterministic `ClassificationService` table (Stablecoin, RWA, …)
- [ ] Deprecate / rename agent interface to `AgentCryptoClassificationRaw` at import sites
- [ ] Delete or archive unused legacy type fields after adapter coverage ≥ critical paths

## DoD (full SC-1)

1. One canonical schema for all crypto scoring/ranking consumers  
2. Adapter used at orchestrator boundary  
3. No free-text category values in ranking payloads  
4. Tests green; no ranking formula change  
5. Evidence note under `docs/evidence/sc-md/`

## Risk

Low for adapter-only (additive). Medium when wiring orchestrator (payload shape consumers) — mitigated by keep of existing `CryptoClassification` shape on payload; only construction path changed.
