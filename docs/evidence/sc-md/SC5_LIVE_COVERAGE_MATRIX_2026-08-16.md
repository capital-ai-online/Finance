# Evidence — SC-5 Live Coverage Matrix

**Date:** 2026-08-16  
**SPT:** SC-MD-SPT-0001  
**Claims:** `SC5-LIVE-COVERAGE-CRYPTO-GATEWAY-2026-08-16` (Phase A), `SC5-PHASE-B-MULTIFIELD-MATRIX-GUARDS-2026-08-16` (Phase B)

## Live coverage matrix (verified quotes / fields)

| Asset class | Path | Gateway | Status | Notes |
|---|---|---|---|---|
| **stock** | `traditionalQuoteEvidence` → TwelveData | yes | **VERIFIED** | SC-4 matrix budgets |
| **forex** | `traditionalQuoteEvidence` → TwelveData | yes | **VERIFIED** | SC-4 |
| **index** | `traditionalQuoteEvidence` → FMP Index | yes | **VERIFIED** | SC-4; approved ticker map |
| **crypto (USD price)** | `cryptoQuoteEvidence` → CoinGecko | yes | **VERIFIED (Phase A)** | Mapped core symbols only |
| **crypto (market fields)** | `cryptoSnapshotProvider` | matrix RL/CB | **MATRIX-ALIGNED (Phase B)** | marketCap/volume/supply; Canonical snapshot deferred |
| **crypto (spot quorum)** | `cryptoSpotConsensus` | partial | consensus_only | CoinAPI/TwelveData/EODHD keys required |
| **commodity / bond / macro** | evidence services | mixed | evidence-gated | SC-5 later |

## Fail-closed guarantees

- No synthetic / registry-bootstrap prices or market fields on failure
- Unmapped crypto symbol → `UNSUPPORTED_ASSET` (quote) / null (snapshot)
- Upstream error → `SOURCE_UNAVAILABLE` / degraded last-known-good / null
- Rate-limit or open circuit on multi-field path → last-known-good (degraded) or null
- `executionPriceEligible` remains **false** for crypto gateway quotes until multi-provider quorum is Owner-linked

## Code

| File | Role |
|---|---|
| `src/platform/MarketData/providers/CoinGeckoMarketDataProvider.ts` | Price adapter (Phase A) |
| `src/services/cryptoQuoteEvidence.ts` | Verified quote API |
| `src/services/cryptoSnapshotProvider.ts` | Multi-field + matrix guards (Phase B) |
| `src/platform/MarketData/ProviderMatrix.ts` | `coingecko` behind_gateway; v1.2.0 |
| `tests/unit/cryptoQuoteEvidence.test.ts` | Phase A unit coverage |
| `tests/unit/cryptoSnapshotProvider.test.ts` | Phase B RL/CB coverage |

## Follow-up

Phase C+: CanonicalMarketDataSnapshot market fields; optional CoinAPI gateway adapter; Stooq; execution-price eligibility gate (Owner).
