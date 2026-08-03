# CAPITAL-AI Server Modularization

## Status

Phase 2 refactoring completed on the supplied `server.ts` baseline.

## Objective

Reduce the root `server.ts` to a composition root and move infrastructure, domain HTTP routes, provider wiring, and lifecycle concerns into explicit modules.

## Resulting structure

```text
server.ts
src/server/
├── app.ts
├── config/
│   └── security.ts
├── middleware/
│   ├── errorHandler.ts
│   ├── globalRateLimit.ts
│   └── processSafety.ts
├── services/
│   └── marketData.service.ts
├── routes/
│   ├── core.routes.ts
│   ├── system.routes.ts
│   ├── marketData.routes.ts
│   ├── marketHistory.routes.ts
│   ├── documentation.routes.ts
│   ├── scoring.routes.ts
│   ├── sentiment.routes.ts
│   └── portfolio.routes.ts
└── lifecycle/
    └── startup.ts
```

## Responsibility boundaries

- `server.ts`: composition root only.
- `app.ts`: Express application creation, global infrastructure registration and AI provider construction.
- `marketData.service.ts`: market-data aggregation, resilient provider fallback, score enrichment and cache state.
- `marketData.routes.ts`: `/api/market-data` HTTP contract.
- `marketHistory.routes.ts`: Alpha Vantage quote and backtest-history endpoints.
- `documentation.routes.ts`: documentation read/write HTTP boundary.
- `scoring.routes.ts`: chart and crypto scoring HTTP endpoints.
- `sentiment.routes.ts`: AI-backed market sentiment and shock simulation.
- `portfolio.routes.ts`: AI-backed portfolio review.
- `startup.ts`: IAM startup health check, frontend serving, error handler installation, background refresh and diagnostics.

## Preserved invariants

1. Stripe webhook raw-body handling remains before JSON parsing in `app.ts`.
2. IAM schema health check still runs once during startup.
3. Market-data background refresh remains 60 seconds.
4. Asset Registry synchronization remains part of startup/background refresh.
5. Error handler remains terminal and is installed after frontend/static middleware.
6. AI routes receive provider instances through dependency injection rather than importing secrets directly.

## Follow-up

- Move documentation write access behind explicit privileged IAM authorization if not already enforced upstream.
- Add route-contract integration tests for every extracted endpoint.
- Consider splitting `marketData.service.ts` further by provider (`coingecko`, `stooq`, `fmp`, `alpha-vantage`) after regression tests exist.
- Add graceful shutdown handling for interval cleanup and HTTP server close.
