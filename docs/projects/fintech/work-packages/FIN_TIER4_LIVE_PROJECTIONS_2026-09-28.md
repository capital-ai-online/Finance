# FIN-TIER4-LIVE-PROJECTIONS — Verified Quote + Canonical Score

**Status:** `IMPLEMENTED_ON_BRANCH / EXACT_HEAD_VALIDATION_PENDING`  
**Project / Owner:** `CAPITAL-AI-FINTECH`  
**PVC:** `PVC-09..16`  
**Issues:** `#1455` Live Verified Quote Projection · `#1450` Server-side Live Scoring Trigger  
**Branch:** `agent/fintech-tier4-live-projections-20260928`  
**Base at work selection:** `f61df72e717399e783824d0b12190f2e7f6a96fd`  
**Development authority:** `/AGENTS.md@CURRENT_MAIN`

## Objective

Close the server-side Tier-4 gap without introducing a second quote, Data Quality, scoring,
WebSocket-room or provider authority.

The existing Tier-3 `market-data-fanout/1.0.0` tick remains presentation-only. Its price and
evidence are never copied into a verified quote or a scoring input. A locally accepted tick can
only schedule a bounded re-evaluation:

```text
accepted Tier-3 tick
  -> scheduling signal only
  -> per-asset coalescer
      -> existing crypto spot-consensus OR Traditional alertEligible verified quote
      -> existing ScoringModelRegistry -> ScoringDispatcher -> Domain Executor
  -> existing market-live-client/1.0.0 event
  -> existing asset:<assetClass>:<SYMBOL> WebSocket room
```

## Issue #1455 — verified quote projection

### Crypto

Crypto live quote truth remains the existing multi-provider `getCryptoSpotConsensus` path.
Only `CONSENSUS` with at least two providers, at least two evidence identities, a positive
canonical value, preserved correlation identity and attested `LIVE|DELAYED` quality can become
`MarketLiveVerifiedQuoteEvent`.

`SOURCE_CONFLICT`, `INSUFFICIENT_SOURCES`, unavailable evidence, missing quality lineage or
invalid timestamps stay non-alerting and emit no Tier-4 verified quote.

### Traditional assets

Stocks, forex and indices reuse `fetchVerifiedTraditionalQuote`. The live projector additionally
requires the existing result to be `READY`, `alertEligible=true` and `LIVE|DELAYED`.
Historical/stale/unavailable Traditional evidence therefore cannot enter the live event path.

The existing quote contract now exposes its canonical gateway `correlationId` and
`qualityState` additively so the projection does not manufacture those fields.

## Issue #1450 — canonical scoring trigger

For the currently productive live ingress, Crypto accepted ticks can schedule a score refresh,
but no raw tick field enters the dispatch request. The only productive model execution remains:

```text
ScoringModelRegistry
  -> ScoringDispatcher
  -> verified domain executor
  -> CanonicalScoreResult
```

A live score event is emitted only when the dispatcher returns `DISPATCHED` with a `READY`
`CanonicalScoreResult` carrying non-empty provider/evidence plus dispatcher, registry, model,
executor and result-contract lineage. The canonical payload is forwarded unchanged.

Traditional live scoring is not fabricated: no equivalent complete live executor input exists on
this Tier-3 ingress today, so that trigger remains `UNSUPPORTED` rather than synthesizing inputs.

## Existing-room sideband transport

`MarketDataWebSocketRoomMultiplexer.publishProjection()` sends a distinct
`["event", roomId, event]` sideband frame to clients already subscribed to the canonical
`asset:*` room. Projection events:

- do not enter the 200-tick ring;
- do not modify the Tier-3 delta codec state;
- do not become Redis raw-tick payloads;
- reuse the existing backpressure/disconnect behavior.

`MarketDataFanoutHub.publishLiveClientEvent()` accepts only already-valid
`verified-quote` or `canonical-score` client events.

## Coalescing and cost protection

Per process and per asset:

- verified quote refresh minimum interval: **5 seconds**;
- canonical score refresh minimum interval: **15 seconds**;
- one in-flight operation per asset and projection type;
- repeated signals during in-flight/minimum-interval windows return `COALESCED`.

These values are storm-control defaults, not latency SLOs. The runtime exposes a measurement
callback for trigger-to-result latency evidence without asserting a production target.

## Activation / entitlement boundary

Repository wiring remains OFF by default.

```text
MARKET_DATA_LIVE_CLIENT_ENABLED=false
MARKET_DATA_TIER4_PROJECTION_ENABLED=false
MARKET_DATA_LIVE_ENTITLEMENT_ATTESTED=false
```

Browser live transport now also requires the explicit entitlement attestation. Tier-4 quote/score
projection additionally requires its own projection flag. No provider plan, Render configuration,
credential, IAM, billing or external runtime setting is mutated by this work package.

## Validation — five-step self-healing gate

1. **Identity / room gate:** malformed asset/topic/correlation identities are rejected; verified
   quote and canonical score events use exactly `asset:<assetClass>:<SYMBOL>`.
2. **Authority gate:** a raw Tier-3 price cannot become a quote or score. Crypto quote values come
   from consensus; scores come only from `ScoringDispatcher`.
3. **Evidence gate:** source conflict, insufficient/stale/historical evidence and incomplete
   canonical score lineage emit no Tier-4 financial event.
4. **Storm / transport gate:** repeated per-asset work is coalesced; sideband events reuse the
   existing room/backpressure surface and do not enter ring/Redis raw-tick truth.
5. **Repository gate:** focused Vitest + TypeScript/build + exact-head Required Checks, followed by
   fresh CURRENT_MAIN/overlap correlation. Human/CODEOWNER merge remains required.

## Exit evidence

The implementation exit gate is reached only after exact-head CI/Governance/Security is green and
fresh merge-readiness correlation confirms that CURRENT_MAIN is an ancestor of the PR head.
Until then this document remains implementation evidence, not a PASS or production-activation
claim.
