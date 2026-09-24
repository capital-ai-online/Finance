# FIN-TIER2-01 — Market tick gate and normalization

## Routing and observed state

- Project/Owner: `CAPITAL-AI-FINTECH`; PVC-09 ingestion, PVC-10 evidence, PVC-11 Data Quality.
- Baseline: `main@f510699a182c4a184e2fdc8691bbef1d830c9e21`.
- Current gateway is `MarketDataGateway`; Binance has a governed bars/history adapter, while Twelve Data currently supplies HTTP quotes. No productive Binance WebSocket trade or book-ticker ingress is present on this baseline.
- The existing provider quota was a fixed-window process-local budget. A declared Binance `quote` capability in ProviderMatrix is not proof of a registered tick adapter or live Tier-1 feed.

## Bounded FINTECH change

`MarketDataGateway.ingestTick` accepts normalized trade/BBO events only for enabled registered providers with the matching asset class and capability. A token bucket caps process-local tick ingestion. The existing gateway's outbound provider quota now refills continuously as a token bucket. Neither is an internet-facing WAF.

`MarketTickGate` keys a bounded rolling series by provider, feed, asset class, symbol, currency and event kind. It rejects missing provenance, stale/future/reordered/replayed events, invalid prices/quantities, crossed BBO and a return outside three robust sigma (median absolute deviation scaled to sigma, with an explicit 50 bps minimum movement floor). A rejected spike never enters the baseline or VWAP. After 20 accepted warmup observations it emits a same-feed quantity-weighted rolling trade VWAP or a real bid/ask BBO. Warmup emits neither; gaps beyond the freshness window require a new warmup. Outputs retain only contributing evidence references. No price or book quote is synthesized.

The default stream freshness window is 10 seconds, 1 second future skew, 60 accepted points and 1,000 bounded series. These are initial risk controls to calibrate with real venue evidence. A sustained genuine price jump remains blocked until independently assessed and the baseline is deliberately reset; no automatic false PASS is inferred.

## Dependencies and owner-correct handover

1. **Tier 1 / FINTECH PVC-09:** Provide actual, licensed, server-side Binance trade and BBO observations with trusted source timestamps, quantities, stable evidence IDs and canonical asset mapping. Wire the adapter to this gateway method, then validate reconnect/order/replay behavior. Binance spot book-ticker payloads must not be assigned a fabricated exchange observation time; absent attested event time remains fail-closed for this gate. Twelve Data HTTP quote or price-only WebSocket data cannot be used as BBO or per-trade VWAP evidence. No provider is enabled by this slice.
2. **Edge WAF / CAPITAL-AI-SEC:** Assess the public ingress route and edge trust boundary, then configure a shared client-identity token bucket or WAF rule with readback, trusted IP resolution, burst policy, 429 semantics and multi-instance behavior. Correlation ID `FIN-TIER2-01-SEC-WAF`. The local provider/tick budgets cannot claim “zero abuse” or replace an edge WAF.
3. **QM:** Independently validate source time, legitimate regime breaks, 3σ false-positive/false-negative rates and the licensed use of venue data before productive score eligibility. This slice never changes scoring, ranking, execution or a provider entitlement.

## Exit evidence

- Focused tests: warmup, spike/drop without baseline poisoning, weighted VWAP, actual BBO, source isolation, malformed/stale/replay rejection, token refill and registered-provider denial.
- Local native TypeScript smoke verification: PASS for the pure gate and token bucket on the draft source; repository TypeScript/Vitest/build/required checks remain NOT_RUN until the exact PR head is tested.
- No live WebSocket, WAF deployment or production provider readback claimed.
- Human/CODEOWNER review and merge required.
