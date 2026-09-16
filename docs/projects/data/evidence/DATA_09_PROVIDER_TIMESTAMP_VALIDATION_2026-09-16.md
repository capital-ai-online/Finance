# DATA-09 — Provider source-timestamp validation

**Project:** `CAPITAL-AI-DATA`  
**PVC:** `PVC-09 — UAI / Data Ingestion` with `DATA-14` provider-input validation support  
**Baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Branch:** `agent/data-ingress-timestamp-validation-20260916`  
**State:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING`  
**Authority:** `/AGENTS.md@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`, ADR-0041, ESS-0016

## Current-main finding

The canonical `MarketDataGateway` and `DataQualityService` already fail closed when a priced snapshot has no valid `sourceTimestamp`. The remaining DATA-owned ingress gap was earlier in the provider dialect adapters: CoinAPI, TwelveData and CoinGecko substituted the local retrieval time when the upstream source timestamp was missing or malformed, while EODHD could substitute retrieval time when its source date was absent and did not strictly reject invalid calendar dates.

That substitution collapses two different facts:

- `sourceTimestamp`: when the provider says the observation was produced;
- `ingestedAt` / `receivedAt`: when CAPITAL-AI retrieved the provider response.

A local retrieval timestamp is not provider provenance and must not be manufactured into source evidence. ADR-0041 / ESS-0016 require provider output to remain untrusted until validated, require source/provenance/freshness fields to stay attributable, and prohibit synthetic replacement of missing provider data.

## Bounded remediation

The existing provider adapters are reused; no second normalization plane is introduced.

- `CoinAPIMarketDataProvider`: a missing or invalid `time` now returns `UNAVAILABLE` with no price/evidence instead of using retrieval time.
- `TwelveDataMarketDataProvider`: a missing or invalid `datetime` now returns `UNAVAILABLE` with no price/evidence instead of using retrieval time.
- `CoinGeckoMarketDataProvider`: a missing or invalid `market_data.last_updated` now returns `UNAVAILABLE` with no price/evidence instead of using retrieval time.
- `EODHDMarketDataProvider`: `date` must be a real `YYYY-MM-DD` calendar date; missing/invalid dates return `UNAVAILABLE` and never synthesize a source timestamp.

The canonical gateway, provider routing, rate limits, circuit breakers, provider roles, credentials, entitlements and downstream scoring/ranking semantics are unchanged.

## Negative evidence added

Focused unit tests assert that a response containing a valid numeric price but no trustworthy provider source time produces:

```text
qualityState = UNAVAILABLE
price = null
sourceTimestamp = null
evidenceId = null
```

The positive-path tests additionally retain the exact normalized provider timestamp where applicable.

## Ownership and mutation boundary

This slice is repository-local DATA work only. It performs no Provider, Render, credential, entitlement, IAM, billing, deployment or production mutation. It does not promote Alpaca, change crypto execution eligibility, alter provider priority, create scoring inputs, or claim independent Security/Governance verification.

`DATA-09` remains the canonical next Roadmap target after this slice because broader provider-ingress convergence remains open. `DATA-09-GOV-07` is correlated separately: current main already contains explicit `entitlement-authority-unavailable` behavior for the realtime AI newsfeed; DATA may record that implementation evidence but does not convert foreign GOV/SEC assessment into DATA authority.

## Validation truth

Repository-hosted TypeScript/Vitest/Governance/Security checks are intentionally `NOT RUN` before PR creation on this connector execution surface. They must be evaluated on the exact PR head after Draft-PR creation; `NOT RUN` is not `PASS`.
