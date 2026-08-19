# SC-2 Phase C2a — Composition Root / Legacy Standard-Crypto Exit

**Date:** 2026-08-19  
**Branch:** `agent/sc2-composition-root-crypto-exit`  
**Baseline:** `main@4c280fb53e74e38d571e4b44b620a7b33681e0be`  
**Authority:** SC-MD-SPT-0001 · ADR-0087 · ADR-0086 governance hierarchy  
**Status:** IMPLEMENTED — PR/CI pending

## Objective

Remove productive Standard-Crypto score authority from the remaining Composition Root / legacy compatibility surfaces without changing score mathematics, thresholds, provider routing, or the remaining C3 asset classes.

## Implemented boundary

### Market-data runtime

`createApplicationMarketDataRuntime()` now detects Standard-Crypto before the legacy `server.application.ts` enrichment callback.

Canonical path:

`MarketData asset -> UAI -> ScoringModelRegistry -> ScoringDispatcher -> verified crypto executor -> CanonicalScoreResult -> legacy 1..10 presentation scale`

If the canonical result is not READY, the enriched asset receives `score=null` and `scoreBasis=unavailable`. Existing snapshot and alert sinks already admit only finite scores, so a denied/unavailable Standard-Crypto score cannot enter persistence or notification decisions.

Meme assets intentionally remain on their existing path for C3.

### Legacy `/api/crypto-scoring/:symbol`

A compatibility router is mounted before the historical handlers in `server.application.ts`.

For Standard-Crypto:

- GET terminates at `dispatchCanonicalScore()`.
- READY responses expose dispatcher/model/evidence metadata plus the existing deterministic analysis payload.
- non-READY responses are HTTP 422 and `scoreEligible=false`.
- POST caller scoring overrides are HTTP 422 with `CUSTOM_SCORING_INPUTS_DISABLED`.
- POST without overrides resolves through the same canonical dispatcher.

Meme requests call `next()` and remain a C3 migration item.

### `/api/charts-scoring`

The historical caller-indicator score is retained only for UI compatibility as a what-if visualization. The response is explicitly marked:

- `mode=simulation-only`
- `scoreEligible=false`
- `productionScoring=false`
- `scoreSemantics=NON_PRODUCTION_SIMULATION`
- `x-capital-ai-score-authority: simulation-only`

The compatibility `score` field remains for the existing Charts UI, but it has no ranking, eligibility, snapshot, alert, model-registry, or evidence authority.

## Fail-closed properties

1. Standard-Crypto market-data refresh no longer calls the legacy enrichment callback.
2. Missing verified evidence cannot preserve the previous upstream/fallback Crypto score.
3. Snapshot persistence skips `score=null` via its existing `Number.isFinite` gate.
4. Alert evaluation skips `score=null` via its existing `Number.isFinite` gate.
5. Caller-provided Standard-Crypto scoring inputs cannot enter the canonical path.
6. Chart indicator scoring is explicitly non-production simulation.
7. No scoring weights, ranking thresholds, execution-price gates, provider routing, Gemini settings, secrets, billing, Supabase schema, or Render settings change.

## Enterprise / FinTech benchmark

The engineering direction is aligned with the 2026 Federal Reserve/OCC/FDIC Revised Guidance on Model Risk Management (SR 26-2) as an enterprise benchmark: intended use, inventory, controls, validation, documentation, and monitoring should remain tied to an identifiable governed model lifecycle. The C2a change reduces uncontrolled model-use surfaces by enforcing one dispatcher-authorized Standard-Crypto execution path.

NIST AI RMF remains a complementary voluntary lifecycle and traceability benchmark. No assertion of direct regulatory applicability to CAPITAL-AI is made.

## Remaining Phase C work

C2 is not declared globally complete yet. The historical Standard-Crypto code in `server.application.ts` is now operationally unreachable for the migrated surfaces but remains textual dead code. A subsequent cleanup may remove that dead code once correlation with other ongoing Composition Root work is safe.

C3 remains open for Traditional, Commodity, Sovereign, Meme, Raw Materials and the repo-wide single-dispatcher proof.

## Validation plan

Repository-costing checks are intentionally deferred until the PR exists. The PR gate must run the repository classifier, TypeScript, full unit suite, production build, CSP/deployment readiness and any stricter class selected by repository policy. Before merge-readiness the branch must be compared again with then-current `main` and open PRs.
