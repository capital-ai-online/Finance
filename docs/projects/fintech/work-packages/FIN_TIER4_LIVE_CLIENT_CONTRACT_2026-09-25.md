# FIN-TIER4-01 — Live Client & AI Contract

**Project:** `CAPITAL-AI-FINTECH`  
**Owner/PVC:** `CAPITAL-AI-FINTECH / PVC-09..16`  
**Status:** `IMPLEMENTED_BRANCH / TIER3_MERGE_AND_TRANSPORT_DEPENDENCY`  
**Fresh Human direction:** 2026-09-25  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Goal

Materialize the FINTECH-owned Tier 4 boundary for a low-latency client without creating a second market-data, scoring, alerting, registry or decision authority.

```text
Tier 3 market-data-fanout/1.0.0
  -> decoded market tick
     -> Canvas / visualization only
     -> alertEligible=false
     -> scoringEligible=false

Verified quote authority
  -> market-live-client/1.0.0 verified-quote
     -> PriceAlert watcher

ScoringModelRegistry -> ScoringDispatcher -> Domain Executor
  -> CanonicalScoreResult
     -> market-live-client/1.0.0 canonical-score
        -> read-only live scorer presentation
```

## FINTECH scope implemented in this slice

- versioned `market-live-client/1.0.0` client projection contract;
- explicit compatibility marker for the observed parallel Tier-3 contract `market-data-fanout/1.0.0`;
- decoded Tier-3 ticks are presentation-only and structurally fixed to `alertEligible=false` and `scoringEligible=false`;
- verified quote events are accepted for alerts only when price, provider set, evidence set and timestamps are present;
- canonical-score events carry the existing `CanonicalScoreResult` unchanged;
- asset identity must match `CanonicalScoreResult.integrity.assetId`;
- reconnect/replay idempotency is based on bounded upstream event IDs rather than inventing a sequence guarantee not present in Tier 3;
- a client visualization projection is bounded to at most 200 decoded Tier-3 ticks;
- PriceAlert threshold evaluation is constant-work after verified-quote admission;
- no sub-5ms or 60-FPS PASS claim is recorded without browser/runtime benchmark evidence.

## Tier-3 correlation

A fresh repository readback discovered the parallel branch
`agent/fintech-tier3-cache-fanout-20260925` at the same CURRENT_MAIN baseline.
It currently implements:

- `market-data-fanout/1.0.0`;
- canonical `market:<assetClass>:<SYMBOL>` topics;
- exactly 200 ticks per topic;
- delta frames;
- Upstash Redis REST Pub/Sub;
- a transport-neutral WebSocket room multiplexer.

That branch is evidence, not repository authority until Human/CODEOWNER merge. Tier 4 therefore does not import its unmerged files. Instead this slice records the expected contract version and mirrors only the minimum decoded client projection required for later owner-correct wiring.

Crucially, a Tier-3 provider tick is not promoted into the existing PriceAlert verified-quote authority and is not a scoring trigger by itself.

## Protected boundaries

This work MUST NOT:

- implement client-side financial scoring;
- emit a synthetic score, neutral default or heuristic replacement;
- treat raw Tier-3 provider ticks as alert-eligible;
- treat raw Tier-3 provider ticks as score-eligible;
- invent a public WebSocket endpoint while the server transport adapter is absent;
- replace the Tier-3 server-side ring buffer, Pub/Sub or fan-out authority;
- convert presentation state into `CanonicalScoreResult`;
- mutate ranking, execution eligibility or provider routing.

## Owner-correct FE handover

`CAPITAL-AI-FE` owns Issue #1447 and the later browser implementation:

- `useMarketFeed` hook;
- reconnect/backoff against the eventual canonical Tier-3 transport endpoint;
- replay dedupe using upstream event IDs;
- 200-tick decoded view-buffer consumption;
- Canvas sparkline driven by `requestAnimationFrame`;
- render coalescing toward a 60 FPS budget without fabricating FPS evidence;
- PriceAlert migration only after a live verified-quote authority exists;
- read-only canonical score presentation only after a server-side score event source exists;
- accessible text/table fallback for Canvas data;
- explicit `CONNECTING/LIVE/RECONNECTING/UNAVAILABLE` UI state.

## Remaining runtime dependencies

1. Tier 3 must Human/CODEOWNER merge.
2. A concrete Render WebSocket server adapter, authentication/subscription policy, heartbeat and shutdown path must be owner-correctly activated.
3. Feed/provider redistribution rights must be evidenced before public streaming.
4. Live alert events must originate from a verified quote/consensus authority, not raw provider ticks.
5. Live scoring triggers must remain backend FINTECH orchestration and emit only canonical results.
6. Browser benchmarks must measure the requested alert-check and 60-FPS budgets before those become PASS evidence.

## Acceptance / exit evidence

1. Contract compiles under the repository TypeScript configuration.
2. Focused tests prove raw-Tier-3 presentation-only admission, verified-quote alert gating, 200-tick bound, replay dedupe and canonical-score identity binding.
3. No browser-local scoring or synthetic financial truth is introduced.
4. Tier-3 and transport dependencies remain explicit and fail-closed.
5. FE work is handed to the canonical FE owner rather than implemented from FINTECH scope.
6. Human/CODEOWNER merge remains required.
