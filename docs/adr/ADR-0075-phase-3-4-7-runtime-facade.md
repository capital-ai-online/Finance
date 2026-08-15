# ADR-0075 Phase 3.4.7 — Market Data Runtime Facade

Status: Proposed  
Date: 2026-08-08  
Supersedes-Number-Only: formerly filed as ADR-0014 (number collision with Documentation Governance; content unchanged)  
Parent phase series: `docs/architecture/` market-data Phase 3.4.x (not `docs/adr/ADR-0014`)

## Context

The remaining compatibility cutover in `server.application.ts` still owns cache TTL handling, request coalescing, stale-cache fallback and AssetRegistry synchronization around the already extracted market-data refresh pipeline.

## Decision

Extract those runtime mechanics to `server/marketData/marketDataRuntimeFacade.ts` before changing the shared compatibility module.

The facade owns only:

- 60-second cache semantics,
- coalescing concurrent refresh requests,
- stale-cache fallback after a refresh failure,
- best-effort background refresh behavior,
- synchronization of successfully refreshed assets through an injected `syncAsset` callback.

Provider I/O, fallback completion, scoring/enrichment, score snapshots and alert evaluation remain outside this facade and behind the existing **market-data compatibility refresh boundary** documented in:

- `docs/architecture/ADR-0014-PHASE-3.4.6-MARKET-DATA-COMPATIBILITY-FACADE.md`
- related Phase 3.4.x notes under `docs/architecture/` and `docs/architecture/adr/`

**Numbering note (ADR-0081):** The label `ADR-0014` in those architecture phase documents refers to the **server/market-data workstream**, not to the canonical active ADR `docs/adr/ADR-0014-documentation-governance-validator.md` (Documentation Governance Validator). Disambiguation of the architecture phase document titles is tracked separately (GOV-XREF-2026-08-16).

## Protected invariants

- No Stripe webhook or billing behavior changes.
- No R-001 scoring/provenance behavior changes.
- No R-002 runtime filesystem mutation changes.
- No Render or runtime secret-validation changes.
- No `server.application.ts` change in this preparatory phase.

## Verification

Unit contracts cover request coalescing, cache reuse, stale-cache fallback, background fail-open behavior and registry synchronization.
