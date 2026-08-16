# Work Package SC-5 — Live Coverage Expansion

**SPT:** SC-MD-SPT-0001  
**Priority:** P1  
**Status:** PHASE A LANDED — crypto USD price behind gateway; Stock/FX/Index already verified  
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

## Explicitly NOT done

- [ ] Migrate multi-field `cryptoSnapshotProvider` (marketCap/supply) to gateway
- [ ] Register CoinAPI/TwelveData/EODHD as gateway crypto adapters for quorum
- [ ] Wire `executionPriceEligible: true` for crypto (requires multi-provider quorum)
- [ ] Stooq behind gateway
- [ ] Alpaca primary promotion
- [ ] scoreImpact / rankingImpact flip
- [ ] Change scoring formulas or eligibility thresholds

## DoD Phase A

1. Crypto USD price obtainable via gateway with matrix RL/CB/health  
2. Unmapped / failed upstream → no synthetic price  
3. Live coverage matrix documents Stock/FX/Index/Crypto  
4. Existing multi-field CoinGecko snapshot path unchanged (compatibility)  
5. Tests green

## Risk

Niedrig: additive path. Callers must opt into `fetchVerifiedCryptoQuote`; legacy snapshot provider remains.
