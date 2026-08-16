# Work Package SC-5 — Live Coverage Expansion

**SPT:** SC-MD-SPT-0001  
**Priority:** P1  
**Status:** PHASE B IN PROGRESS — multi-field snapshot matrix RL/CB aligned  
**Date:** 2026-08-16

## Goal

Verified live quotes for **Stock / FX / Index / Crypto** with fail-closed status, central CB/RL/cache via MarketDataGateway, and an explicit live-coverage matrix.

## Delivered (Phase A)

- [x] `CoinGeckoMarketDataProvider` — price-only canonical crypto snapshot
- [x] `fetchVerifiedCryptoQuote` (`crypto-quote/1.0.0`) through MarketDataGateway
- [x] ProviderMatrix: `coingecko` → `behind_gateway`; CoinAPI/EODHD inventoried as `consensus_only`
- [x] Live coverage matrix doc under `docs/evidence/sc-md/`
- [x] Unit tests: provider + evidence fail-closed paths
- [x] Stock / FX / Index remain on traditionalQuoteEvidence (already gateway, SC-4)

## Delivered (Phase B)

- [x] Multi-field `cryptoSnapshotProvider` uses ProviderMatrix `coingecko` rate-limit + circuit-breaker policies
- [x] Capability key `market-fields`; Supervisor health on success / rate-limit / open circuit
- [x] Fail-closed: budget exhaustion or open CB → last-known-good (degraded) or null; no registry bootstrap
- [x] `VerifiedCryptoSnapshot` API unchanged (scoring callers stable)
- [x] ProviderMatrix version `provider-matrix/1.2.0` + notes
- [x] Unit tests for rate-limit and circuit-open paths

## Explicitly NOT done

- [ ] Map marketCap/supply into `CanonicalMarketDataSnapshot` / full gateway `getSnapshot` path
- [ ] Register CoinAPI/TwelveData/EODHD as gateway crypto adapters for quorum
- [ ] Wire `executionPriceEligible: true` for crypto (requires multi-provider quorum + Owner)
- [ ] Stooq behind gateway
- [ ] Alpaca primary promotion
- [ ] scoreImpact / rankingImpact flip
- [ ] Change scoring formulas or eligibility thresholds
- [ ] Process-wide shared RateLimitBudget instance between gateway quote path and multi-field path (policies aligned; instances still separate)

## DoD Phase B

1. Multi-field CoinGecko path consumes matrix RL capacity and CB thresholds  
2. Rate-limit / open circuit → no synthetic fields; degraded last-known-good or null  
3. Evidence + work-claim updated  
4. Existing provenance + cache-hit behaviour preserved  
5. Tests green

## Risk

Niedrig: additive policy wiring. Callers of `getVerifiedCryptoSnapshot` unchanged. No eligibility or scoreImpact mutation.
