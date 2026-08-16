# Evidence — SC-5 Live Coverage Matrix

**Date:** 2026-08-16  
**SPT:** SC-MD-SPT-0001  
**Claims:** Phase A `SC5-LIVE-COVERAGE-CRYPTO-GATEWAY-2026-08-16`, Phase B `SC5-PHASE-B-MULTIFIELD-MATRIX-GUARDS-2026-08-16`, Phase C `SC5-PHASE-C-CANONICAL-MULTIFIELD-2026-08-16`

## Live coverage matrix (verified quotes / fields)

| Asset class | Path | Gateway | Status | Notes |
|---|---|---|---|---|
| **stock** | `traditionalQuoteEvidence` → TwelveData | yes | **VERIFIED** | SC-4 matrix budgets |
| **forex** | `traditionalQuoteEvidence` → TwelveData | yes | **VERIFIED** | SC-4 |
| **index** | `traditionalQuoteEvidence` → FMP Index | yes | **VERIFIED** | SC-4; approved ticker map |
| **crypto (USD price)** | `cryptoQuoteEvidence` → CoinGecko gateway | yes | **VERIFIED** | Mapped core symbols only |
| **crypto (market fields)** | CoinGecko → `CanonicalMarketDataSnapshot` | yes | **CANONICAL (Phase C)** | marketCap/volume/supply optional keys |
| **crypto (scoring multi-field)** | `cryptoSnapshotProvider` | matrix RL/CB | **MATRIX-ALIGNED (Phase B)** | `VerifiedCryptoSnapshot` parallel path |
| **crypto (spot quorum)** | `cryptoSpotConsensus` | partial | consensus_only | CoinAPI/TwelveData/EODHD keys required |
| **commodity / bond / macro** | evidence services | mixed | evidence-gated | SC-5 later |

## Fail-closed guarantees

- No synthetic / registry-bootstrap prices or market fields on failure
- Unmapped crypto symbol → `UNSUPPORTED_ASSET` (quote) / null (snapshot)
- Upstream error → `SOURCE_UNAVAILABLE` / degraded last-known-good / null
- Rate-limit or open circuit on multi-field scoring path → last-known-good (degraded) or null
- Missing `market_data` / no valid price on gateway path → `UNAVAILABLE`
- `executionPriceEligible` remains **false** for crypto gateway quotes until multi-provider quorum is Owner-linked

## Code

| File | Role |
|---|---|
| `src/platform/MarketData/contracts.ts` | Optional multi-field keys (Phase C) |
| `src/platform/MarketData/providers/CoinGeckoMarketDataProvider.ts` | coins/market_data adapter |
| `src/services/cryptoQuoteEvidence.ts` | Verified quote API |
| `src/services/cryptoSnapshotProvider.ts` | Multi-field + matrix guards (Phase B) |
| `src/platform/MarketData/ProviderMatrix.ts` | `coingecko` behind_gateway; v1.3.0 |
| `tests/unit/cryptoQuoteEvidence.test.ts` | Phase A+C unit coverage |
| `tests/unit/cryptoSnapshotProvider.test.ts` | Phase B RL/CB coverage |

## Follow-up

Optional CoinAPI gateway adapter; Stooq; execution-price eligibility gate (Owner); unify scoring path onto gateway-only.
