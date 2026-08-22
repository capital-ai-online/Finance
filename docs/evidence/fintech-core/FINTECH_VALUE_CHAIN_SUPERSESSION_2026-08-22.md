# FinTech Enterprise Value Chain Authority & Legacy Supersession — 2026-08-22

**Work claim:** `FINTECH-VALUE-CHAIN-SUPERSESSION-2026-08-22`  
**Branch:** `feat/fintech-value-chain-supersession-2026-08-22`  
**Start baseline:** `main@571de76e4d5f1d33460bf129d2231885dfde9584`  
**Trigger:** Human Merge of PR #483  
**Open PRs at start:** 0  
**Supersession policy:** `GOV-AUTH-SUPERSESSION-0001`  
**Supersession B:** integrated in the same branch by explicit Owner direction on 2026-08-22

## 1. Purpose

This package removes post-merge state drift from the FinTech Enterprise value chain and finalizes the Meme/DeFi research-model supersession without creating a second scoring, evidence, governance, persistence, queue, execution or vocabulary authority.

The canonical value chain remains:

```text
UAI
  -> Evidence Acquisition
  -> Evidence / Data Quality Gate
  -> Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor Adapter
  -> CanonicalScoreResult
  -> Ranking / Eligibility
  -> FinTechCore financial workflow composition
  -> Risk / Compliance Decision Records
  -> canonical OrderIntent
  -> PAPER-only simulated handoff
  -> typed Reconciliation
  -> EventMesh / Traceability / Supervisor
```

## 2. Authority classification

| Artifact / path | Finding | Supersession action |
|---|---|---|
| `ADR-0087` | canonical scoring authority | revalidated; single registry/dispatcher preserved; Meme/DeFi challengers updated to 0.2.0 without promotion |
| `ADR-0099` | stale post-PR-483 lifecycle projection | normalized to `1.7.0 / accepted`, stable authorityId retained |
| `ADR-0100` | implemented provider remained `proposed` | normalized to `1.1.0 / accepted` for evidence-only DeFiLlama authority; no scoring authority |
| ADR / Authority registries | stale ADR-0099/0100 state | synchronized to current lifecycle/version |
| FinTechCore roadmap / README / manifest | pre-merge and pre-supersession projections | synchronized to FT-6B merged, fail-closed execution policy and Meme/DeFi non-executable challenger state |
| historical Enterprise FinTech reports | old multi-engine/current-state semantics | retained as historical/non-authorizing for traceability |
| `MemeCoinScoringService` weighted formula | historical 35/25/20/20 formula with incomplete risk evidence | explicitly non-authorizing; not copied into Meme 0.2.0 research contract |
| DeFi TVL/fees/revenue | correlated protocol scale/activity observations | correlation-bound as `defi-scale-activity` before any future weighting |
| legacy v1 UNBOUND OrderIntent RPC | compatibility write path | retained as legacy/research compatibility only; v2 BOUND remains canonical FT-6B path |

## 3. Runtime / legacy-path correlation

### 3.1 Canonical FT-6B OrderIntent path

```text
FinTechCoreOrderIntent
  -> bindApprovedOrderIntent(...)
  -> appendOrderIntent(...)
  -> fintech_core_append_order_intent_v2
```

The v1 UNBOUND RPC remains compatibility evidence only. It is not a second OrderIntent authority.

### 3.2 Shadowed Crypto/Meme composition-root handlers

`server.application.ts` still contains historical Meme-Crypto handler bodies, but the canonical compatibility router is mounted first and terminates requests through `dispatchCanonicalScore(...)`.

```text
/api/crypto-scoring/:symbol
  -> createLegacyScoringCompatibilityRouter()
  -> respondWithCanonicalCryptoScore(...)
  -> dispatchCanonicalScore(...)
  -> ScoringModelRegistry / ScoringDispatcher
```

`tests/unit/sc2GlobalSingleDispatcher.test.ts` protects this ordering so the legacy Meme service cannot silently regain productive routing authority.

### 3.3 Historical architecture projections

The dated Enterprise FinTech architecture/audit reports remain for audit/RAG/export stability but are explicitly non-authorizing. Their old multi-engine topology, weights, readiness statements or provider assumptions cannot override ADR-0087, ADR-0099, ADR-0100, current registries or runtime contracts.

## 4. Owner-approved fail-closed operating-mode correction

The Owner explicitly approved the correction on **2026-08-22 at 04:23 CEST**.

Effective FT-6B policy:

```text
RESEARCH      -> real=false, simulated=false, newOrders=false
PAPER         -> real=false, simulated=true,  newOrders=true
GUARDED_LIVE  -> real=false, simulated=false, newOrders=false
PRODUCTION    -> real=false, simulated=false, newOrders=false
EMERGENCY     -> real=false, simulated=false, newOrders=false
```

`GUARDED_LIVE` and `PRODUCTION` remain FT-7+ vocabulary only. `isOrderIntentEligibleForRealExecution(...)` remains false for every mode.

## 5. Supersession B — Meme Coin & DeFi model remodeling

The Owner subsequently directed that Supersession B be finalized **before** the single PR rather than waiting for a second branch/PR. The work claim records this consolidation explicitly.

### Meme 0.2.0

`crypto-meme-integrity@0.2.0`:

- challenger / research-only / `scoreEligible=false`;
- executor `research-only:not-executable`;
- feature contract `crypto-meme-research-features/0.2.0`;
- no executable weights;
- trend, momentum and volatility quality are one correlation group (`meme-price-path`);
- liquidity cannot substitute for community/manipulation evidence;
- governed contract-integrity and manipulation-risk evidence are required before any future promotion;
- the legacy Meme 35/25/20/20 formula is not promoted or reused as canonical model semantics.

### DeFi 0.2.0

`crypto-defi-fundamental@0.2.0`:

- challenger / research-only / `scoreEligible=false`;
- executor `research-only:not-executable`;
- feature contract `crypto-defi-research-features/0.2.0`;
- no executable weights;
- TVL, fees and revenue are bound to `defi-scale-activity` and cannot be independently additively weighted without validated de-correlation/latent-factor transformation;
- smart-contract and oracle-risk hard-gate evidence remains mandatory for future score admission.

### DeFiLlama freshness

`defi-protocol-evidence/1.1.0` is fail-closed:

- `READY` only when all emitted evidence is `VERIFIED`;
- mixed verified/nonverified evidence -> `PARTIAL`;
- no verified item but stale evidence present -> explicit `STALE`;
- unavailable/invalid-only evidence -> `SOURCE_UNAVAILABLE`;
- no missing/stale value becomes 0 or PASS.

ADR-0100 remains evidence-only. No provider-to-score bypass exists.

## 6. Fingerprint / model-promotion boundary

No fake effective-weight fingerprint is emitted for Meme/DeFi because there are no executable weights. A future promotion must introduce versioned weights, nominal-weights version, DQ/freshness contract and the existing ADR-0087 `scoringFingerprint` effective-feature/effective-weight lineage in one reviewed model change.

The canonical crypto champion remains unchanged:

`crypto-technical-provenance@0.7.0`

Classification as Meme or DeFi does not select a challenger as productive fallback.

## 7. Regression guards

The branch now includes guards for:

1. ADR-0099 registry synchronization;
2. canonical compatibility router ordering before shadowed Meme handlers;
3. FT-6 fail-closed operating-mode policy;
4. Meme/DeFi 0.2.0 non-executable challenger state;
5. Meme price-path correlation binding;
6. DeFi scale/activity correlation binding;
7. unchanged crypto champion resolution;
8. stale DeFi evidence never becoming `READY`.

## 8. Operational / security impact

- no Supabase mutation;
- no new schema/table/queue/event journal;
- no Render/Stripe mutation;
- no new runtime dependency;
- no score/model promotion;
- no second registry/dispatcher/provider gateway;
- no exchange/custody/live execution capability;
- no deletion of financial audit evidence;
- productive `ScoringDispatcher` routing remains unchanged;
- FinTechCore manifest version `0.6.2` records the complete supersession state.

The security correction is strictly fail-closed and removes declarative capabilities; it grants none.

## 9. Regulatory impact

No legal applicability, policy threshold, customer-facing financial decision rule or live execution eligibility is expanded. The package reduces ambiguity and prevents unvalidated category-model signals from becoming financial decisions.

## 10. Evidence retention / archive rule

Historical evidence remains retained and non-authorizing. Physical moves/deletes are deferred where current RAG/export/test consumers would lose traceability. Semantic supersession is encoded in current authority projections rather than rewriting history.

## 11. Remaining future work — promotion, not architecture creation

Meme remains blocked from productive category scoring until contract/manipulation evidence, DQ/freshness policy, validation and versioned weights/fingerprints are approved.

DeFi remains blocked from productive category scoring until protocol/token identity, multi-chain/fork handling, double-counted TVL treatment, correlation/latent-factor validation, DQ/freshness policy and out-of-sample validation are approved.

These are **promotion blockers inside the existing architecture**. They are not justification for another dispatcher, registry, orchestrator or persistence authority.

## 12. Rollback

All changes in this combined Supersession A+B package are repository code/document/test changes. `git revert` restores the prior state. Existing DeFi provider/evidence kill switches can additionally disable DeFiLlama acquisition. No production database, IAM, billing, secret or deployment rollback is required.
