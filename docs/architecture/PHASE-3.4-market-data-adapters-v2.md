# Phase 3.4 — Market-data adapter extraction (v2 note)

**Status:** In progress  
**Date:** 2026-08-08  
**Parent decision:** [ADR-0083 — Server Runtime Architecture Consolidation](../adr/ADR-0083-server-runtime-architecture-consolidation.md)

> Formerly titled `ADR-0014 Phase 3.4` (v2). Parent is ADR-0083.

Phase 3.4 moves provider-facing HTTP adapters out of `server.application.ts` without changing underlying provider implementations or scoring semantics.

The first extracted adapter is `/api/alpha-vantage-quote`, now owned by `server/routes/alphaVantageRoutes.ts` and mounted via `server/routes/registerMarketDataAdapters.ts`.

Authoritative provider modules remain unchanged: `server/stockFundamentals.ts` for Alpha Vantage fundamentals, `server/fmpIndices.ts` for FMP index data, and `src/lib/assetRegistry.ts` for registry/history behavior. R-001 scoring services remain outside this boundary.

The adapter layer may normalize external provider responses but must not own scoring, runtime-secret validation, Stripe ingress, startup lifecycle, or runtime artifact governance.

Preserved invariants include API-key redaction in logs, explicit Alpha Vantage rate-limit/error behavior, separate crypto/traditional quote modes, R-001 scoring provenance, R-002 runtime immutability, R-003 Stripe ownership, and PR #109/#112 secret validation.

Next: extract `fetchLiveMarketData()` and its provider coordination behind narrowly tested service boundaries before removing any inline compatibility block.
