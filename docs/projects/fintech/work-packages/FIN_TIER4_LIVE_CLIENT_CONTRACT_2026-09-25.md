# FIN-TIER4-01 — Live Client & AI Contract

**Project:** `CAPITAL-AI-FINTECH`  
**Owner/PVC:** `CAPITAL-AI-FINTECH / PVC-09..16`  
**Status:** `IMPLEMENTED_BRANCH / TIER3_DEPENDENCY`  
**Fresh Human direction:** 2026-09-25  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Goal

Materialize the FINTECH-owned Tier 4 boundary for a low-latency client without creating a second market-data, scoring, alerting, registry or decision authority.

The requested Tier 4 design is:

```text
Tier 3 governed stream
  -> market-live-client/1.0.0
     -> verified quote events
     -> CanonicalScoreResult events
     -> sequence / resync semantics
     -> bounded 200-tick client view
        -> FE useMarketFeed auto-reconnect
        -> Canvas sparkline / requestAnimationFrame
        -> O(1) verified PriceAlert watcher
```

## FINTECH scope implemented in this slice

- versioned `market-live-client/1.0.0` event contract;
- quote events are accepted only when price, provider, evidence, timestamps and `alertEligible=true` are present;
- canonical-score events carry the existing `CanonicalScoreResult` unchanged;
- asset identity must match `CanonicalScoreResult.integrity.assetId`;
- deterministic sequence handling rejects duplicate/old events and requests resync on gaps;
- a client visualization projection is bounded to at most 200 verified quote events;
- PriceAlert threshold evaluation is constant-work and remains evidence-gated;
- no latency claim is recorded without browser/runtime benchmark evidence.

## Protected boundaries

This work MUST NOT:

- implement client-side financial scoring;
- emit a synthetic score, neutral default or heuristic replacement;
- treat unverified quote events as alert-eligible;
- invent a WebSocket endpoint while Tier 3 transport is absent;
- replace the Tier 3 server-side ring buffer, pub/sub or fan-out authority;
- convert presentation state into `CanonicalScoreResult`;
- mutate ranking, execution eligibility or provider routing.

## Current dependency state

CURRENT_MAIN does not yet contain the requested Tier 3 production transport:

- no canonical market WebSocket server;
- no Redis/Upstash 200-tick server ring buffer;
- no market-data room multiplexer;
- no production Pub/Sub fan-out contract.

Therefore Tier 4 transport activation is fail-closed. The FINTECH contract can merge independently, but no UI may claim `LIVE` until the Tier 3 producer publishes contract-conformant events.

## Owner-correct FE handover

`CAPITAL-AI-FE` owns the presentation/browser implementation:

- `useMarketFeed` hook;
- exponential backoff + jittered reconnect using the Tier 3 endpoint;
- sequence-gap resync using this contract;
- 200-tick view buffer consumption;
- Canvas sparkline driven by `requestAnimationFrame`;
- render coalescing toward 60 FPS without treating FPS as guaranteed evidence;
- PriceAlert consumer migration from the 60-second poller to verified live quote events;
- accessible text/table fallback for Canvas data;
- explicit `CONNECTING/LIVE/RECONNECTING/UNAVAILABLE` UI state.

The FE implementation remains blocked until Tier 3 exposes the canonical transport endpoint and authentication/room-subscription contract.

## Acceptance / exit evidence

1. Contract compiles under the repository TypeScript configuration.
2. Focused tests prove evidence gating, 200-tick bound, sequence resync, threshold semantics and canonical-score identity binding.
3. No browser-local scoring or synthetic financial truth is introduced.
4. Tier 3 dependency remains explicit and fail-closed.
5. FE work is handed to the canonical FE owner rather than implemented from FINTECH scope.
6. Human/CODEOWNER merge remains required.
