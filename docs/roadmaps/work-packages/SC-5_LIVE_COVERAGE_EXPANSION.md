# Work Package SC-5 — Live Coverage Expansion

**SPT:** SC-MD-SPT-0001  
**Priority:** P1  
**Status:** PHASE C LANDED (code) — canonical multi-field on gateway; Phase B PR may still be open  
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

## Delivered (Phase C)

- [x] Optional `marketCapUsd` / `volume24hUsd` / `circulatingSupply` / `maxSupply` / `totalSupply` on `CanonicalMarketDataSnapshot`
- [x] `CoinGeckoMarketDataProvider.getSnapshot` uses `coins/{id}?market_data=true` and maps fields (never synthetic)
- [x] Unit tests for multi-field mapping + missing `market_data` fail-closed
- [x] ProviderMatrix `provider-matrix/1.3.0` notes
- [x] Evidence under `docs/evidence/sc-md/SC5_PHASE_C_CANONICAL_MULTIFIELD_2026-08-16.md`

## Explicitly NOT done

- [ ] Register CoinAPI/TwelveData/EODHD as gateway crypto adapters for quorum
- [ ] Wire `executionPriceEligible: true` for crypto (requires multi-provider quorum + Owner)
- [ ] Stooq behind gateway
- [ ] Alpaca primary promotion
- [ ] scoreImpact / rankingImpact flip
- [ ] Change scoring formulas or eligibility thresholds
- [ ] Process-wide shared RateLimitBudget instance between gateway quote path and multi-field path (policies aligned; instances still separate)
- [ ] Unify VerifiedCryptoSnapshot scoring path fully onto gateway-only (optional later)

## DoD Phase C

1. Canonical contract carries optional multi-field keys  
2. CoinGecko gateway provider populates them from real market_data  
3. No synthetic fields; no price → UNAVAILABLE  
4. Existing price-only consumers remain compatible  
5. Tests green; evidence + work-claim updated

## Risk

Niedrig–mittel: coins/{id} is heavier than simple/price (same rate-limit budget). Fail-closed on missing price. No eligibility mutation.
