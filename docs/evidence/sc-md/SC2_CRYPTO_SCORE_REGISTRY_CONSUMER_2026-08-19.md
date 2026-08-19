# SC-2 Crypto Score Registry Consumer Evidence — 2026-08-19

**SPT:** `SC-MD-SPT-0001`  
**Work Package:** `SC-2`  
**Phase:** A — first productive consumer  
**Branch:** `agent/sc2-crypto-score-registry-consumer`  
**Baseline:** `main@ca968b2563975df64245cb88ee45a7c04019a3a1`  
**Authority:** ADR-0087 + SC-MD-SPT-0001  
**Status:** IMPLEMENTED — PR/CI PENDING

## 1. Purpose

This increment closes the remaining SC-2 Phase-A foundation item: `POST /api/crypto/score` becomes the first productive consumer whose model selection is controlled by the canonical UAI + `ScoringModelRegistry` path.

It deliberately does **not** introduce the Phase-C single dispatcher yet. The existing verified crypto technical executor remains the scoring engine; the route may invoke it only after a successful registry resolution and an explicit compatibility check.

## 2. Before

The production endpoint already used verified history/snapshot providers, fail-closed data-quality gates and `CanonicalScoreResult`, but it invoked `evaluateVerifiedCryptoTechnicalScore()` directly and exposed only the legacy `model: technical-provenance` response label.

Consequences:

- the registry existed as metadata but did not yet authorize a productive route;
- route-local execution could drift from registry champion selection;
- scoring lineage did not carry registry model ID/version/alias/executor metadata;
- the route lineage used the bare symbol rather than the UAI `assetId`.

## 3. Implemented controls

### 3.1 UAI-first resolution

`POST /api/crypto/score` now constructs a request-sourced UAI identity (`crypto:<SYMBOL>`) and resolves it through the canonical `ScoringModelRegistry` before any scoring executor is called.

### 3.2 Fail-closed executor binding

`CryptoScoreExecutionPolicy` permits execution only when the resolved champion:

- points to `verifiedCryptoTechnicalScoring.evaluateVerifiedCryptoTechnicalScore`;
- requires verified evidence;
- emits the canonical `scoring-integrity/1.0.0` result contract;
- does not require a result adapter.

Any incompatible registry state returns `SCORE_NOT_COMPUTABLE` before the scoring executor is invoked. No fallback to legacy/challenger models is permitted.

### 3.3 Model lineage

The score response remains backward-compatible with the existing string field `model: technical-provenance`, while adding `assetId` and `modelRegistry` metadata. `ScoringLineage` now optionally records:

- registry version;
- model ID/version/alias/lifecycle;
- executor key;
- feature contract version;
- result contract version;
- evidence policy.

The migrated endpoint writes the UAI asset ID into lineage. `/api/crypto/list` and `/api/crypto/top10` remain unchanged in this increment and are the next crypto consumer-migration step.

## 4. Preserved invariants

- no scoring-weight changes;
- no ranking-/eligibility-threshold changes;
- no provider-routing or `executionPriceEligible` change;
- verified market-data evidence remains mandatory;
- caller-provided financial scores remain rejected;
- no automatic model fallback;
- no Gemini score path or ResearchEvidence promotion;
- Gemini Shadow remains disabled;
- no Render, Supabase or Stripe mutation.

## 5. Negative-test intent

Tests cover:

1. normal BTC request resolves to UAI `crypto:BTC` and `crypto-technical-provenance@0.6.3`;
2. a canonical registry descriptor pointing at a different executor fails closed;
3. a descriptor requiring a result adapter fails closed;
4. the `/score` route source contract resolves the registry policy before calling the verified scoring executor;
5. scoring lineage records the resolved model identity/version/alias and UAI asset ID.

Full repository validation is intentionally deferred to GitHub CI after PR creation, per repository cost policy.

## 6. Enterprise / FinTech benchmark

The design is aligned with the April 17, 2026 Federal Reserve/OCC/FDIC Revised Guidance on Model Risk Management as a model-governance benchmark: model use should be tied to intended purpose, supported by governance/controls, a sufficiently informative model inventory and ongoing documentation/monitoring. CAPITAL-AI applies that principle by moving productive model selection into a versioned registry and persisting the selected model metadata in execution lineage.

The EU AI Act Articles 11 and 12 are used as an additional traceability/documentation benchmark, not as a claim that this deterministic scoring path is legally classified as a high-risk AI system. The relevant engineering principle is that system versions, interactions and operational events should remain technically documentable and traceable.

NIST AI RMF remains a general governance benchmark for lifecycle risk management and traceability. The actual scoring engine remains deterministic; Gemini stays isolated behind the ResearchEvidence boundary.

## 7. Next roadmap step after merge

After this PR is Human-merged and re-correlated with then-current `main`, continue Phase B crypto migration:

1. move `/api/crypto/list` and `/api/crypto/top10` onto the same registry-resolution policy;
2. then consolidate the three crypto entry points behind the Phase-C canonical scoring dispatcher;
3. only after the scoring migration gates are stable continue the separately controlled Gemini Shadow consumer/source-policy work.
