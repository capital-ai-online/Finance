# Evidence — SC-5 Phase B Multi-Field Matrix Guards

**Date:** 2026-08-16  
**SPT:** SC-MD-SPT-0001  
**Claim:** `SC5-PHASE-B-MULTIFIELD-MATRIX-GUARDS-2026-08-16`

## What changed

| Item | Before | After |
|---|---|---|
| Multi-field CoinGecko path | Private module circuit (3 failures / 60s) + no matrix RL | `RateLimitBudget` + `CircuitBreaker` from ProviderMatrix `coingecko` |
| Capability telemetry | None | Supervisor `market-fields` health |
| Fail-closed | Last-known-good on circuit open | Same + rate-limit exhaustion |
| API | `VerifiedCryptoSnapshot` | Unchanged |
| `executionPriceEligible` | false | **still false** |

## Live coverage matrix (update)

| Asset class | Path | Gateway / Matrix | Status Phase B |
|---|---|---|---|
| **stock** | traditionalQuoteEvidence → TwelveData | yes | VERIFIED |
| **forex** | traditionalQuoteEvidence → TwelveData | yes | VERIFIED |
| **index** | traditionalQuoteEvidence → FMP Index | yes | VERIFIED |
| **crypto (USD price)** | cryptoQuoteEvidence → CoinGecko | yes | VERIFIED (Phase A) |
| **crypto (market fields)** | cryptoSnapshotProvider | matrix RL/CB | **MATRIX-ALIGNED (Phase B)** |
| **crypto (spot quorum)** | cryptoSpotConsensus | consensus_only | unchanged |

## Code

| File | Role |
|---|---|
| `src/services/cryptoSnapshotProvider.ts` | Matrix-aligned guards |
| `src/platform/MarketData/ProviderMatrix.ts` | v1.2.0 notes |
| `tests/unit/cryptoSnapshotProvider.test.ts` | RL + CB negative paths |

## Non-goals (confirmed)

- No CanonicalMarketDataSnapshot extension for marketCap/supply
- No CoinAPI gateway adapter registration
- No executionPriceEligible flip
- No scoreImpact / rankingImpact mutation
