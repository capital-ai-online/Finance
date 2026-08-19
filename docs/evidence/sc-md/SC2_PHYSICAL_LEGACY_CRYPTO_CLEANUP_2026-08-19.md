# SC-2 C2b — Physical Standard-Crypto Legacy Cleanup Evidence

**Document ID:** SC2-PHYSICAL-LEGACY-CRYPTO-CLEANUP-2026-08-19  
**Date:** 2026-08-19  
**Authority:** SC-MD-SPT-0001 · ADR-0087  
**Baseline:** `main@0d84e479ea97c97490dd65bea85fad2ec76ee157`  
**Execution Branch:** `agent/sc2-physical-legacy-crypto-cleanup`  
**Status:** IMPLEMENTED — PR/CI/Main-revalidation pending

## Objective

C2a made the canonical Standard-Crypto path operationally authoritative. C2b removes the superseded physical Standard-Crypto execution code from `server.application.ts` without changing model weights, ranking thresholds, evidence policy, provider routing, Meme scoring or the C3 multi-asset scope.

Canonical Standard-Crypto authority remains:

`UAI -> Evidence/DQ -> ScoringModelRegistry -> ScoringDispatcher -> verified Crypto executor -> CanonicalScoreResult`

## Baseline finding

A fresh scan after Human Merge of PR #428 identified one residual reachability edge that prevented the Standard-Crypto branch from being honestly classified as dead code:

- normal `createApplicationMarketDataRuntime()` refreshes already intercepted Standard-Crypto before the historical application enricher;
- the cold-start error fallback of `GET /api/market-data`, used when the first refresh fails before any stale cache exists, still called `enrichMarketDataAsset()` directly;
- `enrichMarketDataAsset()` still called `calculateAssetScore()`, whose Standard-Crypto branch contained `generateCryptoScores`, Base/DeFi scoring and the former finite upstream heuristic fallback.

Therefore C2b first closes that fallback edge and only then deletes the superseded Standard-Crypto execution code.

## Implemented changes

### 1. Cold-start fallback closed

`enrichMarketDataAsset()` now performs the same Standard-Crypto classification guard as the normal runtime boundary and delegates Standard-Crypto to `enrichStandardCryptoWithCanonicalScore()`.

This makes both paths equivalent:

- normal provider refresh -> canonical Standard-Crypto enrichment;
- cold-start resilient fallback -> canonical Standard-Crypto enrichment.

A non-READY canonical result remains `score=null`; no upstream or heuristic Standard-Crypto score is revived.

### 2. Physical Standard-Crypto branch removed

`server.application.ts::calculateAssetScore()` no longer imports or calls:

- `CryptoScoringService`;
- `ClassificationService`;
- `generateCryptoScores`;
- `calculateBaseScore`;
- `calculateDefiScore`;
- `hasFiniteScoreValues`;
- `resolveHeuristicCryptoScore`.

If a non-Meme Crypto asset reaches this historical helper due to a future wiring regression, it fails closed with `STANDARD_CRYPTO_REQUIRES_CANONICAL_DISPATCHER`.

Meme scoring remains unchanged and explicitly deferred to C3.

### 3. Superseded handlers removed

The duplicate `server.application.ts` `/api/charts-scoring` implementation was physically deleted. The route remains available only through `legacyScoringCompatibilityRoutes.ts`, where it is declared `NON_PRODUCTION_SIMULATION`, `scoreEligible=false` and `productionScoring=false`.

The historical `/api/crypto-scoring/:symbol` GET/POST bodies are now Meme-only fallback handlers. A Standard-Crypto request reaching them returns `SCORING_BOUNDARY_VIOLATION` instead of invoking another model path.

## Regression contract

`tests/unit/canonicalCryptoPhysicalCleanup.test.ts` proves structurally that:

1. Standard-Crypto legacy scorer/classification/Base/DeFi imports are absent from `server.application.ts`;
2. historical Standard-Crypto Base/DeFi/heuristic calls are absent;
3. the Cold-Start composition helper contains the canonical Standard-Crypto guard;
4. the duplicate chart handler is absent;
5. direct `CryptoScoringService` Standard-Crypto handler calls are absent;
6. an explicit fail-closed boundary violation remains as defense in depth.

## Non-goals / protected invariants

Unchanged in C2b:

- verified Standard-Crypto score mathematics;
- `ScoringModelRegistry` champion configuration;
- Ranking/Eligibility thresholds;
- scoreImpact/rankingImpact flags;
- Market-Data provider ordering;
- Meme scoring semantics;
- Traditional/Commodity/Sovereign/Raw-Materials migration (C3);
- Gemini Research Shadow remains default-off and has no score effect;
- no Supabase, Render, Stripe, secret, billing or provider mutation.

## Enterprise / FinTech benchmark

C2b reduces the number of physical model-execution surfaces and removes a fallback path that could otherwise diverge from declared intended model use. This is consistent with the risk-based model inventory, governance, validation and monitoring engineering pattern in the 2026 Revised Guidance on Model Risk Management (SR 26-2). NIST AI RMF remains a complementary lifecycle/traceability benchmark. These references are engineering benchmarks; no specific regulatory applicability is asserted here.

## Verification state

- implementation: complete on execution branch;
- structural regression test: added;
- branch-vs-current-main correlation: required again before PR;
- repository CI/Governance: must run only after PR creation;
- Human Merge: required;
- C3: remains open after C2b.
