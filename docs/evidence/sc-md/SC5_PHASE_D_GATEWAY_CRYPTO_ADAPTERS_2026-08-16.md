# Evidence — SC-5 Phase D Gateway Crypto Adapters (CoinAPI / EODHD / TwelveData)

**Date:** 2026-08-16
**SPT:** SC-MD-SPT-0001
**Claim:** `SC5-PHASE-D-GATEWAY-CRYPTO-ADAPTERS-2026-08-16`

## What changed

| Item | Before | After |
|---|---|---|
| `CoinAPIMarketDataProvider` | did not exist | new `MarketDataProvider` — `rest.coinapi.io/v1/exchangerate/{asset}/USD`, `qualityState: LIVE` |
| `EODHDMarketDataProvider` | did not exist | new `MarketDataProvider` — `eodhd.com/api/eod/{asset}-USD.CC`, `qualityState: HISTORICAL` (never `LIVE`/`DELAYED`) |
| `TwelveDataMarketDataProvider` | `assetClasses: [stock, forex]` | + `crypto` (`X/USD` via existing `/quote` endpoint, same `DELAYED` posture) |
| ProviderMatrix `coinapi` | `consensus_only` | `behind_gateway` |
| ProviderMatrix `eodhd` | `consensus_only` | `behind_gateway` |
| ProviderMatrix version | `1.3.0` | `1.4.0` (status + notes only) |
| `cryptoQuoteEvidence.ts` `allowedProviderIds` | `['coingecko']` | **unchanged** — `['coingecko']` |
| `cryptoSpotConsensus.ts` | raw `fetchCryptoSpotObservation` (no matrix RL/CB) | **unchanged** |
| `executionPriceEligible` | false | **still false** |
| `scoreImpact` / `rankingImpact` | false | **still false** |

## Why this is safe / additive only

- No `ProviderRegistry` or `MarketDataGateway` instance anywhere in the codebase registers `CoinAPIMarketDataProvider` or `EODHDMarketDataProvider`, or requests `assetClass: 'crypto'` from `TwelveDataMarketDataProvider`. The classes exist and are unit-tested, but nothing calls them from a production code path.
- `cryptoQuoteEvidence.ts` (the primary verified crypto quote path) still hard-pins `allowedProviderIds: ['coingecko']`; this PR does not touch that file.
- `cryptoSpotConsensus.ts` (the existing consensus/quorum path) still calls `fetchCryptoSpotObservation` directly; this PR does not touch that file either.
- The only observable runtime effect is that `rateLimitOverridesFromMatrix()` now includes budget entries for `coinapi` (20/60s) and `eodhd` (15/60s), because they moved to `behind_gateway`. This reserves budget slots but has no effect until a caller actually registers those providers with a gateway.
- EODHD is deliberately labelled `HISTORICAL`, not `LIVE`/`DELAYED`: `DataQualityService.assessMarketDataSnapshot` still treats it as an acceptable state (matches the History-adjacent, non-realtime EOD close semantics already documented for `cryptoSpotConsensus`), but the large natural freshness gap (yesterday's close vs. now) will push it to `STALE` under normal `maxAgeMs`, so it can only ever be accepted by a future caller that explicitly opts into `allowStale: true` — it can never silently pass for a tight, realtime quorum window.

## Live coverage matrix (update)

| Asset class | Path | Gateway / Matrix | Status Phase D |
|---|---|---|---|
| **stock** | traditionalQuoteEvidence → TwelveData | yes | unchanged (VERIFIED) |
| **forex** | traditionalQuoteEvidence → TwelveData | yes | unchanged (VERIFIED) |
| **index** | traditionalQuoteEvidence → FMP Index | yes | unchanged (VERIFIED) |
| **crypto (USD price, primary)** | cryptoQuoteEvidence → CoinGecko gateway | yes | unchanged (VERIFIED) |
| **crypto (CoinAPI adapter)** | `CoinAPIMarketDataProvider` | matrix RL/CB (`behind_gateway`) | **registered, unconsumed (Phase D)** |
| **crypto (EODHD adapter)** | `EODHDMarketDataProvider` | matrix RL/CB (`behind_gateway`) | **registered, unconsumed (Phase D)** |
| **crypto (TwelveData adapter)** | `TwelveDataMarketDataProvider` (`assetClass: crypto`) | matrix RL/CB (`behind_gateway`) | **registered, unconsumed (Phase D)** |
| **crypto (spot quorum)** | `cryptoSpotConsensus` | consensus_only (raw fetchers) | unchanged |

## Code

| File | Role |
|---|---|
| `src/platform/MarketData/providers/CoinAPIMarketDataProvider.ts` | new gateway adapter |
| `src/platform/MarketData/providers/EODHDMarketDataProvider.ts` | new gateway adapter |
| `src/platform/MarketData/providers/TwelveDataMarketDataProvider.ts` | + crypto asset class |
| `src/platform/MarketData/ProviderMatrix.ts` | v1.4.0 status/notes |
| `tests/unit/coinAPIMarketDataProvider.test.ts` | success + fail-closed paths |
| `tests/unit/eodhdMarketDataProvider.test.ts` | success + fail-closed paths |
| `tests/unit/twelveDataMarketDataProvider.test.ts` | + crypto branch |
| `tests/unit/providerMatrix.test.ts` | updated gatewayStatus/RL-override assertions |

## Non-goals (confirmed)

- No consumer wiring of the new adapters into `cryptoQuoteEvidence` or `cryptoSpotConsensus`
- No multi-provider quorum computation added
- No `executionPriceEligible` flip
- No `scoreImpact` / `rankingImpact` mutation
- No change to scoring formulas or eligibility thresholds
- `VerifiedCryptoSnapshot` / `CanonicalMarketDataSnapshot` scoring APIs unchanged
