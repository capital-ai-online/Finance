# FIN-TIER3/4-LIVE-TRANSPORT — Governed live market transport

**Canonical identity:** `FIN-TIER3-4-LIVE-TRANSPORT-2026-09-25`  
**Project / Owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC:** `PVC-09..11`  
**Compatibility boundary:** existing Tier-4 client projection contract; no browser implementation ownership transfer  
**Base:** `main@2a2244bd55bef6a88d892ec17c8ecc20b037e22f`  
**Status:** `IMPLEMENTED_BRANCH / VALIDATION_PENDING / PRODUCTION_ACTIVATION_GATED`

## Outcome

Connect one bounded public Binance Spot market-data stream to the existing canonical pipeline:

```text
Binance public bookTicker WSS
  -> MarketDataGateway.ingestTick()
  -> MarketTickGate
  -> ACCEPTED BBO only
  -> MarketDataFanoutHub
  -> asset:crypto:<SYMBOL>
  -> authenticated HTTP Upgrade / WebSocket
  -> future CAPITAL-AI-FE useMarketFeed consumer (#1447)
```

No new market-data, evidence, Data Quality, scoring, ranking, execution, entitlement or room/fan-out authority is created.

## Provider verification and activation boundary

Provider documentation was re-read on 2026-09-25 before implementation:

- Binance documents `wss://data-stream.binance.vision` as a public market-data-only WebSocket host; User Data Streams are not available on that host.
- Multiple individual `<symbol>@bookTicker` streams can be combined over one connection.
- Stream names are lowercase and connections are expected to reconnect over their lifecycle.

Repository implementation does **not** treat public availability as redistribution permission. ADR-0041 / ESS-0016 continue to require plan/feed/display/redistribution/geography/user-count evidence before end-user activation.

Therefore:
- `MARKET_DATA_LIVE_INGRESS_ENABLED=false` by default;
- `MARKET_DATA_LIVE_CLIENT_ENABLED=false` by default;
- `MARKET_DATA_LIVE_SYMBOLS` must be explicitly populated;
- no Render/provider/secret mutation is part of this branch.

## Implementation

### Upstream

`server/marketData/liveMarketDataRuntime.ts`

- reuses `ProviderMatrix` approval for `binance-public`;
- uses a single combined market-data-only WebSocket connection for the explicit symbol allow-list;
- parses only positive valid BBO observations;
- binds update ID + provider/feed + timestamp into correlation/evidence identity;
- passes every observation through `MarketDataGateway.ingestTick()`;
- publishes only `ACCEPTED` Tier-2 decisions into Tier 3;
- reconnect uses bounded exponential delay;
- optional Upstash REST fan-out is used only when both server-side variables are configured.

### Downstream

`server/marketData/marketDataWebSocketTransport.ts`

- exact path: `/api/market-data/live`;
- subprotocol: `capital-ai.market-data.v1`;
- existing backend HttpOnly session is mandatory;
- canonical Origin allow-list is mandatory;
- max two live sockets per authenticated subject by default;
- client WebSocket frames must be masked, unfragmented and <= 8 KiB;
- binary/extension/unsupported opcode input is denied;
- heartbeat closes stale clients;
- room subscription/replay/backpressure remain owned by the existing Tier-3 multiplexer;
- graceful process shutdown closes ingress and client sockets before the HTTP server drains.

Browser command envelope:

```json
{"action":"subscribe","topic":"asset:crypto:BTC","replayLimit":50}
```

```json
{"action":"unsubscribe","topic":"asset:crypto:BTC"}
```

## Integration defect corrected

Merged Tier 3 uses `asset:<assetClass>:<SYMBOL>`. The merged Tier-4 validator still expected `market:<assetClass>:<SYMBOL>`, which would reject valid Tier-3 events.

This slice converges the Tier-4 projection/test/work-package to the actual merged Tier-3 `asset:*` contract. It does not change scoring semantics.

## Protected boundaries

1. Raw Tier-3 ticks remain `alertEligible=false` and `scoringEligible=false`.
2. Issue #1450 remains a separate downstream FINTECH scoring-trigger slice.
3. Issue #1447 remains the FE consumer handover; no FE hook/Canvas implementation is added here.
4. No provider key, trading/account stream, order capability or execution path is introduced.
5. No claim of 10k clients, sub-5ms alert latency or production SLO is made without measured Render/load evidence.

## Reusable self-healing validation pattern

1. **Authority/claim validation** — re-read CURRENT_MAIN + Owner/PVC; release merged stale exclusive claims before a new writer claims the same semantic boundary.
2. **Contract seam validation** — compare producer and consumer identifiers at the integration seam; detected `asset:*` vs `market:*` drift must fail closed and converge to the merged producer contract.
3. **Input/security validation** — malformed provider data, invalid BBOs, invalid WebSocket frames, missing session, bad Origin and unsupported subscription commands are rejected before fan-out.
4. **Runtime activation validation** — repository presence never means Production activation; both ingress and redistribution remain explicit OFF-by-default gates.
5. **Post-merge validation** — reread exact CURRENT_MAIN, verify Required Checks and production/cadence evidence, then unlock the dependent FE/scoring handovers only if their own gates are satisfied.

## Exit evidence

- focused `liveMarketDataRuntime`, `marketDataWebSocketTransport`, Tier-3 fan-out and Tier-4 client-contract tests PASS;
- TypeScript/build PASS;
- Required Checks PASS on the exact PR head;
- branch contains fresh CURRENT_MAIN with no conflicting writer/semantic overlap;
- provider/display/redistribution activation remains fail-closed and is not reported as Production-ready;
- Human/CODEOWNER merge.
