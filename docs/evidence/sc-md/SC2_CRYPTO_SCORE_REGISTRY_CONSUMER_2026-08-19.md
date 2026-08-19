# SC-2 Crypto Score Registry Consumer Evidence — 2026-08-19

**SPT:** `SC-MD-SPT-0001`  
**Work Package:** `SC-2`  
**Phase:** A — first productive consumer  
**Branch:** `agent/sc2-crypto-score-registry-consumer`  
**Original Baseline:** `main@ca968b2563975df64245cb88ee45a7c04019a3a1`  
**Authority:** ADR-0087 + SC-MD-SPT-0001  
**Status:** LANDED — PR #421 / post-#422 CI #1815 + Governance #1134 / `main@5976e4d2eb1c0d11303322b027b8be42e261583a`

## 1. Purpose

This increment closed the remaining SC-2 Phase-A foundation item: `POST /api/crypto/score` became the first productive consumer whose model selection is controlled by the canonical UAI + `ScoringModelRegistry` path.

It deliberately did **not** introduce the Phase-C single dispatcher. The existing verified crypto technical executor remains the scoring engine; the route may invoke it only after a successful registry resolution and an explicit compatibility check.

## 2. Before

The production endpoint already used verified history/snapshot providers, fail-closed data-quality gates and `CanonicalScoreResult`, but it invoked `evaluateVerifiedCryptoTechnicalScore()` directly and exposed only the legacy `model: technical-provenance` response label.

Consequences:

- the registry existed as metadata but did not yet authorize a productive route;
- route-local execution could drift from registry champion selection;
- scoring lineage did not carry registry model ID/version/alias/executor metadata;
- the route lineage used the bare symbol rather than the UAI `assetId`.

## 3. Implemented controls

### 3.1 UAI-first resolution

`POST /api/crypto/score` constructs a request-sourced UAI identity (`crypto:<SYMBOL>`) and resolves it through the canonical `ScoringModelRegistry` before any scoring executor is called.

### 3.2 Fail-closed executor binding

`CryptoScoreExecutionPolicy` permits execution only when the resolved champion:

- points to `verifiedCryptoTechnicalScoring.evaluateVerifiedCryptoTechnicalScore`;
- requires verified evidence;
- emits the canonical `scoring-integrity/1.0.0` result contract;
- does not require a result adapter.

Any incompatible registry state returns `SCORE_NOT_COMPUTABLE` before the scoring executor is invoked. No fallback to legacy/challenger models is permitted.

### 3.3 Model lineage

The score response remains backward-compatible with the existing string field `model: technical-provenance`, while adding `assetId` and `modelRegistry` metadata. `ScoringLineage` records:

- registry version;
- model ID/version/alias/lifecycle;
- executor key;
- feature contract version;
- result contract version;
- evidence policy.

The migrated endpoint writes the UAI asset ID into lineage.

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

## 5. Validation and merge evidence

The original PR was re-correlated after PR #422 changed `main`. PR #422 contributed only M10 Shadow-Assurance documentation and had no path overlap with the SC-2 implementation.

Final validated PR #421 head: `c876490121616007ab3fd758ed9af102a86d831c`.

- CI #1815: **SUCCESS** — repository integrity, TypeScript, full unit suite, production build, CSP and deployment readiness passed; Docker checks were workflow-correctly skipped for class C.
- Governance #1134: **SUCCESS** — cost gate, workflow security and canonical PR contract passed.
- Final pre-merge correlation: `0 behind` current `main@3ed1d6063394a65e9bdc0b46629929ebfc9ff067`.
- Human merge: PR #421 -> `main@5976e4d2eb1c0d11303322b027b8be42e261583a`.
- Merge commit tree equals the validated PR-head tree `d843405e16ff1882d56c13e8cc4b9f32037ab952`.

## 6. Enterprise / FinTech benchmark

The implementation remains aligned with the April 17, 2026 Federal Reserve/OCC/FDIC Revised Guidance on Model Risk Management as a model-governance benchmark: intended model use, model inventory, documentation, governance/controls and monitoring should be connected across the model lifecycle. The guidance explicitly focuses on traditional statistical/quantitative and non-generative/non-agentic AI models; that makes its engineering principles particularly relevant to CAPITAL-AI's deterministic scoring path, without asserting regulatory applicability to CAPITAL-AI.

NIST AI RMF 1.0 remains a voluntary supporting benchmark for lifecycle governance, inventory and traceability. As of 2026-08-19 NIST states that AI RMF 1.0 is being revised, so this repository does not claim a later final NIST framework version.

## 7. Next roadmap step

Phase B continues with `/api/crypto/list` and `/api/crypto/top10` on the same UAI + Registry resolution policy. After all three Crypto score consumers are registry-authorized, Phase C can introduce the one canonical scoring dispatcher and remove productive route-level direct engine imports.
