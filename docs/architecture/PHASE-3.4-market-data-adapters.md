# Phase 3.4 — Market-data adapter extraction

**Status:** In progress  
**Date:** 2026-08-08  
**Parent decision:** [ADR-0083 — Server Runtime Architecture Consolidation](../adr/ADR-0083-server-runtime-architecture-consolidation.md)

> Formerly titled `ADR-0014 Phase 3.4`. The ADR-0014 number is reserved for Documentation Governance Validator. Parent is ADR-0083.

## Scope

Phase 3.4 continues the monotonic decomposition of `server.application.ts` by moving provider-facing HTTP adapters into canonical server modules without changing the underlying provider implementations or scoring semantics.

## Decision

The first adapter extracted is `/api/alpha-vantage-quote`, now owned by `server/routes/alphaVantageRoutes.ts`.

Existing provider modules remain authoritative and are not duplicated:

- `server/stockFundamentals.ts` owns Alpha Vantage stock-fundamental caching/fetching;
- `server/fmpIndices.ts` owns FMP index quote/history caching/fetching;
- `src/lib/assetRegistry.ts` remains the registry/history authority used by other routes;
- R-001 scoring services remain outside the provider-adapter boundary.

The HTTP adapter layer may translate provider responses into CAPITAL-AI API responses, but it must not absorb scoring logic, runtime-secret validation, Stripe ingress, startup lifecycle or runtime artifact ownership.

## Preserved invariants

- API keys are never logged; request URLs redact provider credentials.
- Alpha Vantage rate-limit and provider error semantics remain explicit.
- Crypto and traditional-asset quote request modes remain distinct.
- R-001 scoring provenance is untouched.
- R-002 runtime immutability is untouched.
- R-003 Stripe ownership is untouched.
- PR #109/#112 runtime-secret validation remains untouched.

## Next extraction

After this additive adapter is green, continue with the larger market-data aggregation functions in `server.application.ts` (`fetchLiveMarketData()` and dependent provider coordination) behind narrowly tested service boundaries before any inline block is removed.
