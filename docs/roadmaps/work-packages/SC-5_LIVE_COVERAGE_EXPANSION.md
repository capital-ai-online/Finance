# Work Package SC-5 — Live Coverage Expansion

**SPT:** SC-MD-SPT-0001  
**Priority:** P1  
**Status:** PHASE D LANDED (code) — CoinAPI/EODHD gateway crypto adapters registered; quorum consumption still Owner-gated  
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

## Delivered (Phase D)

- [x] `CoinAPIMarketDataProvider` — `MarketDataProvider` adapter for CoinAPI crypto exchange-rate (`LIVE`)
- [x] `EODHDMarketDataProvider` — `MarketDataProvider` adapter for EODHD crypto EOD close, labelled `HISTORICAL` (never `LIVE`/`DELAYED`, so it cannot masquerade as a current execution price)
- [x] `TwelveDataMarketDataProvider` extended with `assetClass: 'crypto'` (`X/USD` via existing `/quote` endpoint, same conservative `DELAYED` posture as stock/forex)
- [x] ProviderMatrix: `coinapi` and `eodhd` moved `consensus_only` → `behind_gateway` (matrix RL/CB budget now applies if/when a caller registers them); `twelvedata` gains `crypto` in `assetClasses`; `provider-matrix/1.4.0`
- [x] Unit tests: success + fail-closed (missing key, invalid/empty payload, wrong asset class) for both new adapters; crypto branch for TwelveData
- [x] Evidence under `docs/evidence/sc-md/SC5_PHASE_D_GATEWAY_CRYPTO_ADAPTERS_2026-08-16.md`

**Scope boundary:** these adapters are registered inventory only — no `ProviderRegistry`/`MarketDataGateway` instance actually consumes them yet. `cryptoQuoteEvidence.ts` still pins `allowedProviderIds: ['coingecko']` unchanged, and `cryptoSpotConsensus.ts` still calls the raw `fetchCryptoSpotObservation` fetchers directly (no matrix RL/CB). Wiring an actual multi-provider quorum into the gateway path remains the next, still Owner-gated step below.

## Explicitly NOT done

- [ ] Wire a gateway-hardened multi-provider crypto quorum (consume `coinapi`/`eodhd`/`twelvedata` adapters from Phase D in a registry alongside `coingecko`) into `cryptoQuoteEvidence`/`cryptoSpotConsensus`
- [ ] Wire `executionPriceEligible: true` for crypto (requires the quorum above + Owner)
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

## DoD Phase D

1. CoinAPI/EODHD/TwelveData(crypto) implement `MarketDataProvider` and return `CanonicalMarketDataSnapshot`
2. EODHD snapshot is labelled `HISTORICAL`, never `LIVE`/`DELAYED` — cannot be mistaken for a current execution price
3. No synthetic prices; missing key / invalid payload / wrong asset class → `UNAVAILABLE` with reason
4. ProviderMatrix reflects the new `behind_gateway` status and stays queryable via `providersBehindGateway()`
5. No consumer wiring, no `executionPriceEligible` change, no scoring/eligibility mutation
6. Tests green; evidence updated

## Risk

Niedrig–mittel: coins/{id} is heavier than simple/price (same rate-limit budget). Fail-closed on missing price. No eligibility mutation.

Phase D: Niedrig — purely additive adapter classes + matrix inventory update; nothing in production calls them yet, so the change carries no runtime blast radius. The only behavior change is that `rateLimitOverridesFromMatrix()` now reserves budget slots for `coinapi`/`eodhd`, which is inert until a caller actually registers those providers.
