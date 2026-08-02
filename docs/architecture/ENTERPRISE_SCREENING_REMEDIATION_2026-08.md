# Enterprise Screening Remediation — 2026-08

Status: implementation in progress

## Scope

This remediation closes the remaining high-impact screening-platform gaps after the evidence/provenance hardening.

1. Market Screener consumes only verified score/context contracts. Symbol hashes, pseudo-timeframe score modifiers, synthetic pattern assignment and client-side trading ranges are prohibited.
2. Price Alerts do not use bootstrap registry prices or client-side random-walk simulation as financial truth. Alert evaluation requires verified quote evidence with provider, observation time and evidence id.
3. Screening/watchlist results preserve correlation ids, score lineage, provider attribution, evidence ids and explicit computability state.
4. Analytical sidecars never write back into canonical scores, ranking eligibility or provider provenance.
5. Missing or stale financial evidence remains explicit (`DATA_UNAVAILABLE`, `STALE_EVIDENCE`, `SCORE_NOT_COMPUTABLE`) rather than substituted with defaults.

## Implemented in this PR

- `MarketScreener.tsx`: verified Crypto Score + Traditional Verified Context; no symbol-hash scores, fake timeframe modifiers or synthetic trading levels.
- `PriceAlert.tsx`: verified Crypto Spot Consensus only; no Registry bootstrap prices and no random-walk engine. Other asset classes remain fail-closed until an approved server-side quote contract exists.
- `screeningEligibility/1.0.0`: reusable fail-closed eligibility contract for READY score, provider/evidence coverage, freshness and source-conflict handling.
- Frontend regression gates block reintroduction of hash/random financial logic.

## Enterprise acceptance gates

- No `charCodeAt`/symbol-hash financial scoring in MarketScreener.
- No `Math.random()` financial-price engine in PriceAlert.
- No registry bootstrap `price` accepted as verified live price.
- Alerts store provider/evidence/observation/correlation metadata used to evaluate the threshold.
- Missing scores are never normalized to a default value.
- TypeScript, unit tests, production build, dependency vulnerability gate and deployment-readiness checks must pass.

## Remaining after this PR

- Extend verified quote contracts to stock/forex/index before enabling their price alerts.
- Connect screening eligibility contract server-side to future bulk ranking/selection endpoints.
- Production-calibrate market-integrity quorum tolerances before enabling any hard ranking/scoring gate.
- Continue evidence-gated Bond and Commodity scoring activation only after approved real-data contracts and golden datasets.
