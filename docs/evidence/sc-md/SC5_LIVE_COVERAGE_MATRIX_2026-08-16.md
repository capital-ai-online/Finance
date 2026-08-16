# Evidence — SC-5 Phase A Live Coverage Matrix

**Date:** 2026-08-16  
**SPT:** SC-MD-SPT-0001  
**Claim:** `SC5-LIVE-COVERAGE-CRYPTO-GATEWAY-2026-08-16`

## Live coverage matrix (verified quotes)

| Asset class | Path | Gateway | Status Phase A | Notes |
|---|---|---|---|---|
| **stock** | `traditionalQuoteEvidence` → TwelveData | yes | **VERIFIED** | SC-4 matrix budgets |
| **forex** | `traditionalQuoteEvidence` → TwelveData | yes | **VERIFIED** | SC-4 |
| **index** | `traditionalQuoteEvidence` → FMP Index | yes | **VERIFIED** | SC-4; approved ticker map |
| **crypto (USD price)** | `cryptoQuoteEvidence` → CoinGecko | yes | **VERIFIED (Phase A)** | Mapped core symbols only |
| **crypto (market fields)** | `cryptoSnapshotProvider` | no | legacy | marketCap/volume/supply; SC-5 Phase B |
| **crypto (spot quorum)** | `cryptoSpotConsensus` | partial | consensus_only | CoinAPI/TwelveData/EODHD keys required |
| **commodity / bond / macro** | evidence services | mixed | evidence-gated | SC-5 later |

## Fail-closed guarantees

- No synthetic / registry-bootstrap prices on gateway failure
- Unmapped crypto symbol → `UNSUPPORTED_ASSET`
- Upstream error → `SOURCE_UNAVAILABLE`, `price: null`
- `executionPriceEligible` remains **false** for crypto gateway quotes until multi-provider quorum is Owner-linked

## Code

| File | Role |
|---|---|
| `src/platform/MarketData/providers/CoinGeckoMarketDataProvider.ts` | Adapter |
| `src/services/cryptoQuoteEvidence.ts` | Verified quote API |
| `src/platform/MarketData/ProviderMatrix.ts` | `coingecko` behind_gateway |
| `tests/unit/cryptoQuoteEvidence.test.ts` | Unit coverage |

## Follow-up

Phase B: multi-field snapshot migration; optional CoinAPI gateway adapter; Stooq; execution-price eligibility gate.
