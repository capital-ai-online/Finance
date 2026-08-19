# SC-2 C3 — Global Multi-Asset Single-Dispatcher Exit Evidence

**Evidence ID:** `SC2-GLOBAL-MULTI-ASSET-EXIT-2026-08-19`  
**SPT:** `SC-MD-SPT-0001`  
**Authority:** ADR-0087 + SC-2 Work Package  
**Baseline:** `main@2d8e482174e97601d4343249e50d208ccf6f6355`  
**Execution Branch:** `agent/sc2-global-multi-asset-exit`  
**Status:** `IMPLEMENTED_PENDING_M10_AUTHORIZED_CI`  
**Date:** 2026-08-19

## 1. Purpose

SC-2 C3 removes the remaining productive multi-asset model-execution bypasses. Evidence acquisition remains domain-specific, but **model resolution and productive score execution are owned by one boundary only**:

```text
UAI
  -> verified domain evidence / feature contract
  -> ScoringModelRegistry (canonical champion only)
  -> ScoringDispatcher
  -> Domain Executor Adapter
  -> CanonicalScoreResult
  -> Ranking / Eligibility / SLO / Traceability
```

No score weights, factor formulas, ranking thresholds or provider promotion policy are changed by C3.

## 2. Implemented changes

### 2.1 Multi-asset dispatcher bindings

`ScoringDispatcher` now binds the existing registered model families:

| Asset family | Registered model | Execution behind Dispatcher | Result |
|---|---|---|---|
| Crypto incl. Meme | `crypto-technical-provenance@0.6.3` | verified crypto technical executor | `CanonicalScoreResult` |
| Stock / Forex / Index | `traditional-scoring@2.1.0` | existing Traditional model + CanonicalResultAdapter | `CanonicalScoreResult` |
| Commodity | `commodity-evidence-scoring@1.0.0` | existing commodity evidence scorer | `CanonicalScoreResult` |
| Sovereign benchmark yield | `sovereign-benchmark-yield-scoring@1.0.0` | existing sovereign evidence scorer | `CanonicalScoreResult` |
| Individual bonds | none | blocked by Registry | `SCORE_NOT_COMPUTABLE` |

Traditional model math is unchanged. The new adapter only converts its existing 0..100 output and field provenance into the canonical 0..10 / 0..100 result contract.

### 2.2 Registry authority and traceability

All four productive model descriptors now declare `scoring-integrity/1.0.0` as result contract and no longer require a caller-side result adapter. Dispatcher outputs add:

- UAI `assetId`;
- dispatcher version;
- registry version;
- `modelId` / `modelVersion` / `modelAlias` / lifecycle;
- executor key;
- result contract version.

This metadata is carried in `CanonicalScoreResult.integrity` and is also exposed by the registry scoring lineage.

### 2.3 Productive route exits

The following productive scoring surfaces no longer invoke a domain scoring engine directly:

- `/api/crypto/score`, `/list`, `/top10` — already dispatcher-only before C3;
- legacy `/api/crypto-scoring/:symbol` — now dispatcher-only for **Standard and Meme Crypto**;
- `/api/registry/assets/verified-scores`;
- `/api/registry/assets/:symbol/verified-score`;
- `/api/registry/assets/:symbol/verified-context` score leg;
- `/api/raw-materials/verified-score/:symbol`.

Registry evidence acquisition was moved into `src/features/registry/verifiedCatalogScoring.ts`. That module acquires verified inputs/evidence but delegates all model selection/execution to `dispatchCanonicalScore()`.

### 2.4 Composition root / market-data exit

`server/marketData/canonicalCryptoScoreEnrichment.ts` is retained as a compatibility filename but is now a global canonical scoring adapter. It intercepts:

`crypto | stock | forex | commodity | index | bond`

before the legacy composition-root scorer. Provider/evidence acquisition remains class-specific. Missing evidence returns `score=null`; there is no heuristic recovery score.

The legacy market-data presentation scale remains compatible:

- Crypto: `score` stays 0..10;
- non-Crypto financial classes: `score` stays 0..100;
- the full canonical contract is attached separately as `canonicalScoreResult`.

### 2.5 Meme and Raw Materials

Meme-Crypto no longer falls through to the historical `MemeCoinScoringService` public handlers. It uses the registered Crypto champion through the Dispatcher.

Raw-Materials structural/AI scoring remains available only as explicitly non-productive research/sandbox output:

- `canonical=false`;
- `scoreEligible=false`;
- `scoreSemantic=legacy-structural-research`.

The productive `/verified-score/:symbol` path uses verified commodity evidence + Dispatcher.

`/api/charts-scoring` remains explicitly `NON_PRODUCTION_SIMULATION`, `scoreEligible=false`, `productionScoring=false`.

## 3. Legacy reachability statement

Some historical non-Crypto/Meme scoring code remains physically present in `server.application.ts`, but C3 removes its **productive reachability**:

1. all scorable market-data assets are intercepted before `calculateAssetScore()`;
2. all legacy Crypto GET/POST scoring requests are intercepted by `createLegacyScoringCompatibilityRouter()` before historical declarations;
3. the only remaining public caller-driven chart score is explicitly simulation-only.

This residual code is non-authoritative compatibility dead code and must not be interpreted as a second productive model-selection architecture. A later source-hygiene cleanup may delete it without changing C3 scoring semantics.

## 4. Fail-closed invariants

- Registry missing/ambiguous champion -> `SCORE_NOT_COMPUTABLE`;
- incompatible executor/result/evidence binding -> `missingFields=['scoringModel']`;
- missing verified execution evidence -> `missingFields=['scoringEvidence']`;
- Traditional numeric factors without provider provenance -> `SCORE_NOT_COMPUTABLE`;
- missing Commodity/Sovereign provider evidence -> no heuristic fallback;
- individual-bond scoring remains blocked;
- Research/Gemini output remains non-score-eligible and is not promoted by C3.

## 5. Regression coverage prepared before PR

No cost-generating repository build/test was run before PR creation, in accordance with project policy.

C3 adds/updates structural and unit contracts for:

- all productive model families using canonical registry bindings;
- Traditional CanonicalResultAdapter preserving domain score math;
- UAI/model lineage on dispatcher output;
- no direct Traditional/Commodity/Sovereign engine execution in registry productive routes;
- Meme no longer falling through to legacy public scoring;
- all six scorable market-data classes entering canonical enrichment;
- Raw-Materials structural scoring remaining non-productive;
- existing C2 composition tests updated to the global C3 invariant.

Full TypeScript/unit/build validation is intentionally deferred until a PR is technically necessary. After M10 Controlled Cutover, expensive PR CI requires the Owner Passkey/WebAuthn `AUTHORIZE_PR_CI` flow on the exact current PR head.

## 6. Enterprise / FinTech architecture comparison

C3 reduces model-use surfaces to one explicit inventory/routing/execution authority and makes model identity/version/use traceable at runtime. This is consistent with the model-use, inventory, governance, validation, documentation and monitoring pattern used as the CAPITAL-AI enterprise benchmark from the 2026 Revised Guidance on Model Risk Management (SR 26-2). NIST AI RMF remains the complementary lifecycle/traceability benchmark.

No claim of a specific regulatory classification or mandatory applicability is made by this engineering comparison.

## 7. Before / after

| Area | Before C3 | C3 branch |
|---|---|---|
| Crypto | Dispatcher | Dispatcher |
| Meme Crypto | separate public legacy model reachable | Crypto champion via Dispatcher |
| Traditional | direct route/composition execution | CanonicalResultAdapter via Dispatcher |
| Commodity | direct route evidence scorer | Dispatcher |
| Sovereign benchmark | direct registry-route scorer | Dispatcher |
| Individual bond | blocked | blocked |
| Raw Materials verified score | direct commodity scorer | Dispatcher |
| Raw Materials structural score | legacy research | explicitly non-productive research |
| Market-data non-Crypto | legacy model/fallback | canonical evidence adapter + Dispatcher |
| Missing evidence | historical fallback possible | `score=null` / fail-closed |
| Model lineage | fragmented | UAI + registry/model/executor metadata |
| Productive execution authority | multiple | one `ScoringDispatcher` |

## 8. Remaining gates

- final branch-vs-current-main/Open-PR correlation before PR;
- PR creation only when needed for repository validation;
- M10 Owner-Passkey authorization for expensive CI on exact head;
- Governance + required CI PASS;
- post-CI main race check;
- separate Human/CODEOWNER merge decision.
