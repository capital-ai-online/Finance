# ADR-0014 Phase 3.4.5 — FMP Index Provider Stage

## Scope

This phase completes the provider-stage preparation for market-data refresh by adapting the existing FMP index cache/cooldown implementation to the canonical `MarketDataProviderStage` contract.

## Invariants

- `server/fmpIndices.ts` remains the authoritative FMP API/cache implementation.
- Provider stage order is Crypto → Stooq → FMP.
- FMP refresh stays non-blocking and cooldown-aware.
- Only usable cached quotes are emitted as `dataSource: live`.
- Missing index quotes remain absent from the stage and are completed later by the coordinator fallback step.
- History refresh is best-effort and must not delay quote delivery.
- No scoring, Stripe, runtime-security, Render, secret-validation, or TOTP diagnostic behavior is changed.

## Next step

Perform a fresh overlap check against `main`, then cut `server.application.ts` over to `refreshMarketData(createMarketDataProviderStages(...))` in a dedicated compatibility PR. The inline provider implementations are removed only in that cutover.
