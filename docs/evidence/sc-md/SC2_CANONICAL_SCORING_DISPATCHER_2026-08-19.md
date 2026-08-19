# SC-2 Canonical Scoring Dispatcher — Phase C1 Evidence — 2026-08-19

**SPT:** `SC-MD-SPT-0001`  
**Work Package:** `SC-2`  
**Phase:** C1 — Standard-Crypto Router/UI Single Dispatcher Exit  
**Branch:** `agent/sc2-canonical-scoring-dispatcher`  
**Baseline:** `main@24b70a794a7ce7dad62197f42a8948b347dbfbc3`  
**Authority:** ADR-0087 + SC-MD-SPT-0001  
**Status:** IMPLEMENTED — PR/CI PENDING

## 1. Purpose

This increment begins SC-2 Phase C by establishing one canonical model-execution boundary for the already registry-migrated Standard-Crypto product path.

`ScoringDispatcher` becomes the only module in the migrated path that may import and invoke `evaluateVerifiedCryptoTechnicalScore()`. Productive Crypto routes provide identity only; the dispatcher constructs UAI, resolves the canonical registry champion, verifies executor/evidence/result-contract compatibility and only then invokes the registered domain executor.

This is intentionally **Phase C1, not global Phase C completion**. Existing Meme, Traditional, Commodity/Sovereign and composition-root legacy scoring paths remain explicitly migration-required and are not relabeled as canonical.

## 2. Architecture after C1

```text
Request / registry asset
        -> ScoringDispatcher
             -> UAI identity
             -> ScoringModelRegistry champion resolution
             -> executor/evidence/result-contract binding
             -> verified Standard-Crypto executor
             -> CanonicalScoreResult
        -> route-specific ranking / eligibility / lineage
```

The existing deterministic scoring mathematics and verified MarketData/Evidence gates are unchanged.

## 3. Implemented controls

### 3.1 Single executable boundary for migrated Standard-Crypto routes

`src/platform/Scoring/ScoringDispatcher.ts` owns the only verified Standard-Crypto executor binding. It:

- creates stable UAI identity;
- resolves exactly one canonical champion;
- permits only `verifiedCryptoTechnicalScoring.evaluateVerifiedCryptoTechnicalScore`;
- requires `verified-required` evidence policy;
- requires `scoring-integrity/1.0.0`;
- rejects models that still require a result adapter;
- fails closed with a complete `SCORE_NOT_COMPUTABLE` canonical envelope before executor invocation.

The prior route-facing `CryptoScoreExecutionPolicy` is retired so registry authorization and execution binding are not duplicated across two public policies.

### 3.2 Productive Crypto routes

`POST /api/crypto/score`, `GET /api/crypto/list` and `GET /api/crypto/top10` now call `dispatchCanonicalScore()` rather than importing the verified domain scorer.

They continue to own only response composition, ranking/eligibility and lineage presentation after dispatch. UAI asset ID and model ID/version/alias/executor/contracts remain traceable.

### 3.3 `/api/crypto/analyze` becomes Research/Enrichment-only

`CryptoOrchestrator` no longer imports or calls:

- `generateCryptoScores`;
- `calculateBaseScore`;
- `calculateDefiScore`;
- `calculateValueCorridor`;
- `calculateRankScore`;
- `isTop10Eligible`.

It returns classification plus agent-derived research signals with:

- `mode = research-enrichment`;
- `scoreEligible = false`;
- no `scores` output;
- no rank, eligibility or value-corridor output.

Caller-provided `customInput` scoring overrides are rejected by `/api/crypto/analyze`.

### 3.4 DeFi UI removes browser-local production scoring

`DeFiOrchestration` no longer imports `scoring.service.ts` or calculates a DeFi score in the browser. Its financial score is loaded from canonical `/api/crypto/score`.

The Agent Re-Analyse action continues to call `/api/crypto/analyze`, but only updates the Research-Trail. It cannot replace or mutate the displayed canonical score.

## 4. Preserved invariants

- no scoring-weight changes;
- no ranking-/eligibility-threshold changes;
- no MarketData provider-routing changes;
- no `executionPriceEligible`, `scoreImpact` or `rankingImpact` activation;
- no new financial features from LLM output;
- no automatic ResearchEvidence promotion;
- Gemini Shadow remains disabled and has no score effect;
- no Render, Supabase or Stripe mutation;
- Human/CODEOWNER merge remains mandatory.

## 5. Explicitly remaining for C2 / later SC-2 migration

C1 does **not** claim that all repository scoring is already behind the dispatcher. The following remain open and are the immediate correlation targets before global Phase C can be marked complete:

1. standard-Crypto legacy composition-root paths in `server.application.ts`, including Market-Data score enrichment and legacy `/api/crypto-scoring/:symbol` compatibility routes;
2. ad-hoc `/api/charts-scoring` legacy score semantics;
3. Meme direct scoring;
4. Traditional stock/forex/index CanonicalResultAdapter migration;
5. Commodity/Sovereign executor extraction and adapters;
6. Raw-Materials direct model selection;
7. final repo-wide proof that no productive route/UI can select or execute a model outside `ScoringDispatcher`.

These items are deliberately retained as open work instead of masking them with a broad “Phase C complete” status.

## 6. Negative / structural regression coverage

Tests establish:

- valid Standard-Crypto dispatch resolves UAI + canonical champion and calls the injected executor exactly once;
- incompatible registry binding returns canonical `SCORE_NOT_COMPUTABLE` and never invokes an executor;
- asset classes whose canonical adapter is not ready fail closed;
- `/score`, `/list`, `/top10` contain dispatcher calls and no direct verified-scorer import;
- `CryptoOrchestrator` contains no score/rank/value-corridor functions;
- `/analyze` rejects scoring overrides and remains `scoreEligible=false`;
- `DeFiOrchestration` consumes `/api/crypto/score` and cannot replace it with Agent output.

Full TypeScript/unit/build validation is intentionally deferred until the Pull Request exists, per repository cost policy.

## 7. Main / open-PR correlation at branch start

Baseline: `main@24b70a794a7ce7dad62197f42a8948b347dbfbc3`, Human merge of PR #424 after PR #425 had already been incorporated and revalidated.

Open-PR review at branch start:

- PR #426 is M10 Phase-6 negative-recovery Evidence scope and has no SC-2 path overlap;
- PR #414 remains Privacy/DSGVO scope and has no direct overlap with the C1 dispatcher/router/UI files.

A second branch-vs-current-main correlation is mandatory immediately before PR creation and again before merge readiness.

## 8. Enterprise / FinTech benchmark — verified 2026-08-19

The April 17, 2026 Federal Reserve/OCC/FDIC Revised Guidance on Model Risk Management (SR 26-2) remains the primary enterprise model-risk benchmark for this deterministic scoring estate. Its engineering direction connects intended model use, model inventory, validation, governance/controls, documentation and ongoing monitoring rather than allowing model choice to remain hidden inside consumers.

C1 advances that control model by turning the registry descriptor into an executable, centralized dispatch decision and by making the selected model identity traceable downstream.

NIST AI RMF 1.0 remains a voluntary lifecycle/governance benchmark. NIST currently states that AI RMF 1.0 is under revision, so this repository does not assume a later final framework version.

## 9. Exit criterion

C1 is ready for Human merge only after:

1. PR created from this branch;
2. required Governance and CI checks pass on the exact PR head;
3. branch is re-correlated against then-current `main`;
4. no new correlated main changes require adaptation.

After Human merge, continue directly with **Phase C2: composition-root and legacy Standard-Crypto score-path migration into ScoringDispatcher**, then continue the remaining asset-class adapters before declaring global Phase C complete.
