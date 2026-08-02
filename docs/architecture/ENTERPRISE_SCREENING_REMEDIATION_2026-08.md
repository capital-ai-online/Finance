# Enterprise Screening Remediation — 2026-08

Status: implementation in progress

## Scope

This remediation closes the remaining high-impact screening-platform gaps after the evidence/provenance hardening.

1. Market Screener must consume only verified score/context contracts. Symbol hashes, pseudo-timeframe score modifiers, synthetic pattern assignment and client-side trading ranges are prohibited.
2. Price Alerts must not use bootstrap registry prices or client-side random-walk simulation as financial truth. Alert evaluation requires a verified quote observation with provider, observation time and evidence id.
3. Screening/watchlist responses must preserve root/child correlation ids, score lineage, provider attribution, evidence ids and explicit computability state.
4. UI may present analytical sidecars, but sidecar values must never write back into canonical scores, ranking eligibility or provider provenance.
5. Missing or stale financial evidence must remain explicit (`DATA_UNAVAILABLE`, `STALE_EVIDENCE`, `SCORE_NOT_COMPUTABLE`) rather than substituted with defaults.

## Enterprise acceptance gates

- No `charCodeAt`/symbol-hash financial scoring in MarketScreener.
- No `Math.random()` financial-price engine in PriceAlert.
- No registry bootstrap `price` accepted as verified live price.
- Alerts store the evidence/provider metadata used to evaluate the threshold.
- Screening results include correlation/lineage metadata and only rank `READY` scores.
- TypeScript, unit tests, production build, dependency vulnerability gate and deployment-readiness checks must pass.
