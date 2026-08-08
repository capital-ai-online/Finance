# ADR-0014 Phase 3.4.3 — Crypto Provider Chain Extraction

Status: In Progress
Date: 2026-08-08

## Scope

Extract the concrete crypto market-data provider chain from `server.application.ts` without changing scoring, provenance or runtime behavior.

## Canonical provider order

1. Binance public 24h ticker API
2. Kraken public ticker API
3. Coinbase public spot API
4. Static fallback assets with explicit `dataSource: 'fallback'`

## Invariants

- Provider failures are fail-open and advance to the next provider.
- Binance remains preferred when it returns BTC or ETH live data.
- Kraken is the second source.
- Coinbase is the final live source and MUST NOT invent 24h change or volume values; unknown values remain zero because that endpoint does not provide them.
- Static fallback data MUST remain explicitly labelled `fallback`.
- This extraction does not alter R-001 scoring provenance, R-002 runtime immutability, R-003 Stripe event ownership, Render startup, runtime-secret validation or FMP/Stooq provider behavior.

## Cutover rule

`server.application.ts` is not modified in this additive PR. Wiring the extracted provider stage into `marketDataCoordinator` and deleting the equivalent inline implementation is a separate overlap-checked cutover.
