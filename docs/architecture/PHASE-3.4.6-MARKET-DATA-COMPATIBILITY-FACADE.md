# Phase 3.4.6 — Market-Data Compatibility Facade

**Status:** Accepted for cutover preparation  
**Parent decision:** [ADR-0083 — Server Runtime Architecture Consolidation](../adr/ADR-0083-server-runtime-architecture-consolidation.md)

> Formerly titled `ADR-0014 Phase 3.4.6`. Parent is ADR-0083.

## Context

The legacy `fetchLiveMarketData()` in `server.application.ts` still combines provider I/O, registry fallback completion, scoring/enrichment and best-effort side effects. The provider implementations have already been extracted behind `MarketDataProviderStage`, but replacing the legacy function directly would risk losing enrichment, snapshot validation and alert evaluation semantics.

## Decision

Introduce `server/marketData/marketDataCompatibilityFacade.ts` as the final composition boundary before the shared-file cutover.

The facade:

- delegates provider execution to the canonical market-data coordinator;
- uses the canonical provider stage factory unless stages are explicitly injected for tests;
- appends registry assets missing from provider results as explicit `dataSource: fallback` records;
- delegates scoring/domain enrichment through an injected `enrichAsset` function;
- keeps score snapshot persistence and alert evaluation best-effort;
- propagates provider-stage failure reporting without failing the complete refresh.

## Protected invariants

- R-001 scoring provenance remains owned by existing scoring services and the injected enrichment function.
- R-002 runtime immutability is unchanged.
- R-003 Stripe event ownership is unchanged.
- No Render, secret-validation or startup security behavior is modified.
- Registry/bootstrap data is never relabeled as verified live market evidence.

## Cutover gate

After CI and Technical Validation are green, `server.application.ts` may replace the provider/fallback/enrichment composition inside `fetchLiveMarketData()` with one call to `runMarketDataCompatibilityRefresh(...)`. Cache/coalescing and AssetRegistry synchronization remain separate behavior-preserving concerns until their own extraction.
