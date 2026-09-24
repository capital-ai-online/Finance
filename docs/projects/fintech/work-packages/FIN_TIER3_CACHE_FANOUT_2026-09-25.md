# FIN-TIER3-CACHE-FANOUT — Cache & Fan-out

**Project:** `CAPITAL-AI-FINTECH`  
**Owner/PVC:** `CAPITAL-AI-FINTECH / PVC-09, PVC-10, PVC-11`  
**Baseline:** `main@f510699a182c4a184e2fdc8691bbef1d830c9e21`  
**Branch:** `agent/fintech-tier3-cache-fanout-20260925`  
**State:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING / TIER2_HOT_PATH_ADAPTER_BLOCKED_BY_OPEN_WRITER`  
**Contract:** `market-data-fanout/1.0.0`

## Goal

Materialize Tier 3 as the bounded cache/distribution layer for verified market events without
creating a second provider-ingress, evidence, Data Quality, scoring or execution authority.

```text
Tier 1 provider event
        |
        v
Tier 2 normalization / 3-sigma / VWAP / BBO
        |
        v
[post-Tier-2 adapter — exact hook after #1448 becomes terminal]
        |
        v
Tier 3 market-data-fanout/1.0.0
   |                 |                    |
   |                 |                    +--> WebSocket room transport adapter
   |                 +-----------------------> Upstash Redis Pub/Sub
   +-----------------------------------------> 200-tick asset ring
        |
        v
Tier 4 live-client contract
```

The Tier-3 core is implemented independently now. The direct hot-path adapter is intentionally
not written into `MarketDataGateway.ts` while open PR #1448 owns that same file. Open PRs are
evidence, never authority; after #1448 is Human-merged or otherwise terminal, CURRENT_MAIN must
be reread and the smallest post-Tier-2 adapter can be added without semantic or writer overlap.

## Implemented bounded slice

- In-memory ring buffer capped at exactly **200 ticks per asset room**.
- Canonical room/topic namespace aligned with the downstream live-client contract:
  `asset:<assetClass>:<SYMBOL>`.
- Fan-out events retain provider/feed, source/receive timestamps, freshness, correlation,
  evidence ID, price, bid/ask and optional Tier-2 VWAP plus event kind
  (`snapshot|trade|bbo`).
- Admission requires finite price, source timestamp, evidence ID, correlation ID, provider
  identity and `LIVE|DELAYED|STALE`; evidence-less/unavailable values never enter Tier 3.
- Compact stateful wire protocol: one full baseline frame followed by bit-mask delta frames.
  Changed timestamps are represented as epoch milliseconds in deltas.
- Deterministic representative hot-path test requires **>=78% payload reduction** compared with
  repeatedly sending the full canonical event. This is a fixture benchmark, not a claim that
  every production payload will always reduce by 78%.
- Room multiplexer assigns connection-local numeric room IDs, performs replay, sends only matching
  rooms and disconnects repeatedly backpressured clients instead of growing unbounded queues.
- Upstash REST projection batches `LPUSH + LTRIM 0 199 + EXPIRE + PUBLISH` in one pipeline.
- Upstash Pub/Sub consumption uses SSE; every remote event is schema-validated and deduplicated
  before entering the local ring.
- `MarketDataFanoutHub.publishTick()` is the explicit future post-Tier-2 ingress point.
  `publish(snapshot)` supports existing canonical snapshot producers without changing their
  authority.

## Writer reconciliation

During implementation, open PR #1448 was discovered to modify `MarketDataGateway.ts` for the
Tier-2 tick gate. An initial Tier-3 hook on the same file was therefore reverted exactly to
CURRENT_MAIN. Current Tier-3 changed files no longer overlap #1448.

Open PR #1449 materializes the Tier-4 live-client contract on independent files. Tier 3 uses the
same `asset:<assetClass>:<SYMBOL>` room identity so the downstream contract does not need an
invented room translation. This compatibility does not make #1449 an authority or merge gate.

## Authority and failure boundaries

1. Redis and local rings are distribution/cache projections only.
2. No second ProviderRegistry, DQ engine, scorer, ranking path or execution-price authority exists.
3. Redis or WebSocket failure cannot make invalid data valid and cannot alter upstream evidence.
4. WebSocket server activation is not fabricated in this slice. The repository currently has no
   declared `ws` server dependency, so the multiplexer exposes a transport-neutral client
   interface for the later server adapter.
5. Public redistribution remains fail-closed until provider/feed storage/display/redistribution
   rights and the concrete Render WebSocket runtime are evidenced.
6. “Tens of thousands of clients” is an architecture target, not a PASS claim, until an exact
   Render topology is load-tested with real connection, memory, CPU, bandwidth and Redis-command
   measurements.

## Security

- Upstash endpoint is restricted to HTTPS and `*.upstash.io`.
- Standard Redis token is sent only as server-side Authorization and never in event bodies.
- No `VITE_*` Redis secret is introduced.
- Remote Pub/Sub events are untrusted input and must pass the fan-out schema.
- Topic strings/symbols are bounded before becoming keys/channels.
- Slow consumers are bounded with `bufferedAmount`, skip counters and close code 1013.

## 5-step reusable validation / self-healing pattern

1. **Contract:** reject malformed, evidence-less and wrong-topic events.
2. **Bounded state:** prove 250 writes retain exactly the newest 200 events per asset.
3. **Transport efficiency:** losslessly reconstruct deltas and meet the >=78% representative
   payload-reduction target.
4. **Resilience:** prove room isolation, slow-client backpressure, Redis pipeline shape and
   credential non-projection.
5. **Authority:** prove Redis failure does not remove the accepted local event and no Tier-2
   writer/file is mutated by this slice.

When a step fails, repair only the smallest responsible Tier-3 layer and rerun this focused
five-step suite before broader validation. This is a reusable repair pattern, not a second
self-healing control plane.

## Production activation gate

Repository implementation alone does not authorize public Tier-3 streaming. Before activation:

- provision/read back the real Upstash database and server-only credential;
- decide least-privilege Redis ACL/token policy;
- evidence provider-specific storage/display/redistribution and realtime/delayed entitlements;
- after #1448 is terminal, implement and test the exact Tier-2 accepted-tick adapter;
- implement the Render WebSocket server adapter with heartbeat, reconnect/resync and graceful
  shutdown semantics;
- load-test the intended concurrent-client topology instead of claiming 10k+ from design alone;
- pass exact-head Security/QM/required checks and Human/CODEOWNER merge.

No Render, Upstash, provider or secret mutation is performed by this package.
