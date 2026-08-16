# Evidence — SC-5 Phase C Canonical Multi-Field Gateway

**Date:** 2026-08-16  
**SPT:** SC-MD-SPT-0001  
**Claim:** `SC5-PHASE-C-CANONICAL-MULTIFIELD-2026-08-16`

## What changed

| Item | Before | After |
|---|---|---|
| `CanonicalMarketDataSnapshot` | price (+ bid/ask) only | + optional `marketCapUsd`, `volume24hUsd`, `circulatingSupply`, `maxSupply`, `totalSupply` |
| `CoinGeckoMarketDataProvider` | `simple/price` (price only) | `coins/{id}?market_data=true` → price + market fields |
| `providerFeed` | `simple/price` | `coins/market_data` |
| ProviderMatrix | `1.2.0` | `1.3.0` (notes only) |
| `executionPriceEligible` | false | **still false** |
| `scoreImpact` | false | **still false** |

## Live coverage matrix (update)

| Asset class | Path | Gateway / Matrix | Status Phase C |
|---|---|---|---|
| **stock** | traditionalQuoteEvidence → TwelveData | yes | VERIFIED |
| **forex** | traditionalQuoteEvidence → TwelveData | yes | VERIFIED |
| **index** | traditionalQuoteEvidence → FMP Index | yes | VERIFIED |
| **crypto (USD price)** | cryptoQuoteEvidence → CoinGecko gateway | yes | VERIFIED |
| **crypto (market fields)** | CoinGecko → CanonicalMarketDataSnapshot | yes | **CANONICAL (Phase C)** |
| **crypto (scoring multi-field)** | cryptoSnapshotProvider (VerifiedCryptoSnapshot) | matrix RL/CB | Phase B (parallel path) |
| **crypto (spot quorum)** | cryptoSpotConsensus | consensus_only | unchanged |

## Code

| File | Role |
|---|---|
| `src/platform/MarketData/contracts.ts` | Optional multi-field keys |
| `src/platform/MarketData/providers/CoinGeckoMarketDataProvider.ts` | coins/market_data mapping |
| `src/platform/MarketData/ProviderMatrix.ts` | v1.3.0 notes |
| `tests/unit/cryptoQuoteEvidence.test.ts` | Multi-field + fail-closed |

## Non-goals (confirmed)

- No CoinAPI / EODHD gateway adapter registration
- No executionPriceEligible flip
- No scoreImpact / rankingImpact mutation
- VerifiedCryptoSnapshot scoring API unchanged (parallel path remains)
