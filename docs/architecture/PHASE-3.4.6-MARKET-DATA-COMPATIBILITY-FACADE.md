# Phase 3.4.6 — Market-Data Compatibility Facade

**Status:** Accepted for cutover preparation; amended 2026-08-20  
**Parent decision:** [ADR-0083 — Server Runtime Architecture Consolidation](../adr/ADR-0083-server-runtime-architecture-consolidation.md)  
**Correlated decision:** ADR-0097 — Verified Asset Display & Progressive Hydration Boundary

> Formerly titled `ADR-0014 Phase 3.4.6`. Parent is ADR-0083.

## Context

The legacy `fetchLiveMarketData()` in `server.application.ts` combined provider I/O, registry fallback completion, scoring/enrichment and best-effort side effects. Provider implementations are extracted behind `MarketDataProviderStage`, while the compatibility facade preserves legacy aggregate shape during the wider server-runtime cutover.

ADR-0097 adds a stricter public evidence boundary: registry/bootstrap compatibility rows must not trigger provider/scoring fan-out merely because they are present in the catalog. Render runtime evidence on 2026-08-20 showed provider pressure including CoinGecko 429 responses and open TwelveData/EODHD circuit breakers, making that distinction operationally material as well as a data-integrity requirement.

## Decision

`server/marketData/marketDataCompatibilityFacade.ts` remains the composition boundary for the legacy aggregate market-data refresh.

The facade:

- delegates provider execution to the canonical market-data coordinator;
- uses the canonical provider stage factory unless stages are explicitly injected for tests;
- appends registry assets missing from provider results as explicit `dataSource: fallback` compatibility records;
- **enriches/scorers only provider-observed `dataSource: live` records**;
- **runs snapshot persistence and alert evaluation only for provider-observed live records**;
- leaves appended registry fallback rows untouched by evidence/scoring side effects;
- keeps provider-stage failure handling fail-open for the aggregate compatibility response;
- does not turn a fallback row into verified display evidence.

This is deliberately different from the original Phase-3.4.6 wording that implied all appended rows passed through the general enrichment step. That historical behavior is superseded by this amendment and ADR-0097.

## Background refresh cadence

`createApplicationMarketDataRuntime()` configures `marketDataRuntimeFacade` with a **90,000 ms minimum background provider-refresh interval**.

The runtime facade owns the effective provider-I/O cadence:

- the first background refresh may run immediately;
- an invocation before 90 seconds have elapsed is deferred to the next eligible instant;
- multiple early invocations are coalesced into one scheduled refresh;
- the existing 60-second compatibility cache TTL remains independent of the provider polling cadence;
- foreground/cache reads may continue to use the existing freshness contract without redefining provider rate budgets.

This keeps the outer legacy scheduler behavior compatible while preventing it from forcing provider I/O more often than ADR-0097 allows.

## Protected invariants

- R-001 / ADR-0087 scoring provenance and model execution remain owned by the canonical scoring architecture.
- R-002 runtime immutability is unchanged.
- R-003 Stripe event ownership is unchanged.
- No Render, secret-validation or startup authorization behavior is modified.
- Registry/bootstrap data is never relabeled as verified live market evidence.
- `GET /api/registry/assets` remains metadata-only for verified public finance fields.
- Per-symbol verified display is owned by `verified-asset-display/1.0.0`, not by this compatibility facade.

## Cutover / validation gate

Before merge, validate at minimum:

1. fallback-only refreshes do not invoke enrichment, snapshot persistence or alert evaluation;
2. mixed refreshes enrich only live rows;
3. background calls inside the 90-second window are deferred/coalesced;
4. existing cache/coalescing failure behavior remains fail-open to prior verified cache where permitted;
5. current-main correlation and the ADR-0097 documentation set remain consistent.

Full cost-generating CI remains post-PR according to repository governance.
