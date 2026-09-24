# FIN-TIER3-CACHE-FANOUT — Cache & Fan-out

**Project:** `CAPITAL-AI-FINTECH`  
**Owner/PVC:** `CAPITAL-AI-FINTECH / PVC-09, PVC-10, PVC-11`  
**Baseline:** `main@f510699a182c4a184e2fdc8691bbef1d830c9e21`  
**Branch:** `agent/fintech-tier3-cache-fanout-20260925`  
**State:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING`  
**Contract:** `market-data-fanout/1.0.0`

## Goal

Materialize Tier 3 as a bounded distribution layer behind the existing canonical
MarketDataGateway and its Data Quality decision. Tier 3 does not select providers,
manufacture prices, change evidence, calculate scores or create execution authority.

```text
Tier 1/2 provider ingress
        |
        v
MarketDataGateway
        |
        v
canonical DQ-accepted snapshot
        |
        v
Tier 3 Fan-out Sink
   |        |        |
   |        |        +--> Room multiplexer -> WebSocket transport adapter
   |        +-----------> Upstash Redis Pub/Sub
   +--------------------> bounded 200-tick ring per asset/topic
```

## Implemented bounded slice

- In-memory ring buffer capped at exactly 200 ticks per topic.
- Canonical topic namespace: `market:<assetClass>:<SYMBOL>`.
- Fan-out admission requires price, source timestamp, evidence ID, correlation ID,
  provider identity and `LIVE|DELAYED|STALE` state.
- Compact stateful wire protocol: one full baseline frame followed by bit-mask delta
  frames. Timestamps are encoded as epoch milliseconds in deltas.
- The deterministic representative hot-path test requires at least 78% payload
  reduction relative to repeatedly sending the full canonical tick. This is a test
  target, not an unsupported claim that every production payload is reduced by 78%.
- Room multiplexer assigns connection-local numeric room IDs, replays buffered ticks,
  sends only subscribed topics and disconnects clients that repeatedly exceed bounded
  buffered-byte backpressure.
- Upstash REST bridge performs `LPUSH + LTRIM 0 199 + EXPIRE + PUBLISH` in one HTTP
  pipeline. The standard token remains in the Authorization header and is never put in
  event payloads.
- Redis Pub/Sub subscription uses Upstash SSE and revalidates every remote payload
  against the fan-out contract before admitting it to the local ring.
- MarketDataGateway exposes an optional post-DQ `fanoutSink`. Cache hits are not
  republished. Sink failures are payload-free and isolated from the authoritative
  provider result.

## Authority and failure boundaries

1. Redis and local rings are distribution/cache projections only. They cannot convert
   `UNAVAILABLE`, `INVALID` or evidence-less data into market truth.
2. No second ProviderRegistry, Data Quality engine, scorer, ranking path or execution
   price authority is introduced.
3. Redis failure does not make a valid MarketDataGateway request fail and does not
   mutate the snapshot.
4. WebSocket transport activation is deliberately not bootstrapped in this slice.
   The current package has no declared WebSocket server dependency. The multiplexer
   exposes a transport-neutral WebSocket client interface so the later server adapter
   can be attached without coupling FINTECH truth to a transport library.
5. Public redistribution remains fail-closed until feed/provider licensing,
   real-time/delayed entitlement, user/display redistribution rights and the concrete
   Render WebSocket transport are evidenced.

## Security

- Upstash endpoint must be HTTPS and an `*.upstash.io` host.
- Standard Redis token stays server-side; no `VITE_*` secret and no token logging.
- Remote Pub/Sub payloads are untrusted and schema-validated before local admission.
- Topic strings and symbols are bounded/validated before becoming Redis keys/channels.
- Slow consumers are bounded through `bufferedAmount`, skip counters and close code
  1013 instead of allowing unbounded per-client queues.

## Validation plan — self-healing reuse pattern

1. **Contract validation:** reject missing evidence/provenance and invalid topics.
2. **Bounded-state validation:** prove 250 writes retain exactly the newest 200 ticks.
3. **Transport-efficiency validation:** prove delta decoding is lossless and the
   representative hot path reaches >=78% payload reduction.
4. **Fan-out resilience validation:** prove room isolation/backpressure and Redis
   command shape without credential leakage.
5. **Authority validation:** prove a fan-out failure cannot downgrade or replace an
   accepted MarketDataGateway result.

A failed step is repaired at the smallest responsible layer and the five-step focused
suite is rerun before PR readiness. The pattern is reusable for later Tier-3 transport
adapters without creating a second self-healing control plane.

## Production activation gate

Repository implementation alone is not sufficient for public Tier-3 activation.
Required before enabling public WebSocket redistribution:

- actual Upstash database/credentials provisioned server-side;
- least-privilege Redis ACL/token decision where supported;
- provider-specific redistribution/storage/display entitlement evidence;
- concrete Render WebSocket server adapter plus heartbeat/reconnect/shutdown tests;
- load/backpressure benchmark using expected concurrent-client topology;
- exact-head Security/QM/required checks and Human/CODEOWNER merge.

No Render/Upstash/provider mutation is performed by this package.
