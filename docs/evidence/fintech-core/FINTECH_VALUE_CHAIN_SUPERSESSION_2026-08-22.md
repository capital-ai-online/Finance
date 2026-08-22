# FinTech Enterprise Value Chain Authority & Legacy Supersession — 2026-08-22

**Work claim:** `FINTECH-VALUE-CHAIN-SUPERSESSION-2026-08-22`  
**Branch:** `feat/fintech-value-chain-supersession-2026-08-22`  
**Start baseline:** `main@571de76e4d5f1d33460bf129d2231885dfde9584`  
**Trigger:** Human Merge of PR #483  
**Open PRs at start:** 0  
**Supersession policy:** `GOV-AUTH-SUPERSESSION-0001`

## 1. Purpose

This package removes post-merge state drift from the FinTech Enterprise value chain without creating a second scoring, evidence, governance, persistence, queue, execution or vocabulary authority.

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

| Artifact / path | Classification before supersession | Finding | Supersession action |
|---|---|---|---|
| `ADR-0087` | canonical scoring authority | no drift | protect unchanged |
| `ADR-0099` | stable FinTech Core authority, lifecycle still `proposed` | PR #483 has been Human-merged; lifecycle and branch metadata are stale | same-authority lifecycle/version normalization; no new authorityId |
| `docs/roadmaps/FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` | roadmap projection | still says FT-6B PR pending / branch implementation | project FT-6B as DONE / MERGED #483 |
| `src/platform/FinTechCore/README.md` | component projection | still contains pre-merge closure gates and `ADR-0099 (proposed)` | replace with post-merge current-state projection |
| `src/platform/FinTechCore/manifest.json` | component inventory/projection | still says FT-6B migration prepared/not applied and lists migration application as blocked | synchronize to applied/verified FT-6B state |
| `docs/architecture/ORCHESTRATORS_AND_SCORING_ENGINES.md` | architecture projection | already aligned with ADR-0087/0099; must remain non-authorizing | retain as projection; add explicit supersession reference only if needed |
| `FT6A_*` / older FT evidence | historical evidence | obsolete as current state but valid audit evidence | retain; do not rewrite or delete |
| FT-6B work claim | coordination metadata | `status=active` is schema-constrained historical coordination metadata after merge | do not reinterpret as runtime/architecture authority |
| `ADR-0100` / DeFiLlama | proposed DeFi evidence-provider decision | semantically correlated with requested Meme/DeFi remodeling | isolate for separate Supersession B; no model/scoring semantics changed here |

## 3. Runtime / legacy-path correlation

### 3.1 Canonical path

New FT-6B execution-relevant PAPER OrderIntents are deterministic `BOUND` intents and persist through:

```text
FinTechCoreOrderIntent
  -> bindApprovedOrderIntent(...)
  -> appendOrderIntent(...)
  -> fintech_core_append_order_intent_v2
```

### 3.2 Legacy compatibility path

`server/fintechCorePersistence.ts` still contains a v1 write route for `bindingState=UNBOUND`:

```text
UNBOUND
  -> fintech_core_append_order_intent_v1
```

This route is **not** a second OrderIntent authority. It is a compatibility path for legacy/research persistence evidence.

Physical removal is intentionally not performed in this supersession without all of the following evidence:

1. no active runtime producer still emits `UNBOUND` intents;
2. no recovery/replay path depends on the v1 RPC;
3. existing persisted rows are not made unreadable or misleading;
4. rollback remains possible without deleting audit evidence;
5. separate owner approval exists if the removal changes a security/execution boundary or external persistence contract.

Until then, v1 is classified `legacy-compatibility / non-canonical-write-path` and v2 remains the only canonical BOUND FT-6B persistence path.

## 4. Security-relevant correlation requiring explicit Owner approval

`FINTECH_CORE_OPERATING_MODE_POLICY` currently projects:

- `GUARDED_LIVE.realExecutionAllowed=true`;
- `PRODUCTION.realExecutionAllowed=true`;

while the effective FT-6B authority and `isOrderIntentEligibleForRealExecution(...)` hard-block real execution for every mode.

This is a stale future-capability projection and should be normalized fail-closed. Because the change touches an execution/security boundary, it is **not silently mutated** in this package without explicit Owner approval.

### Proposed remediation

For the current FT-6B effective policy:

```text
RESEARCH      -> real=false, simulated=false, newOrders=false
PAPER         -> real=false, simulated=true,  newOrders=true
GUARDED_LIVE  -> real=false, simulated=false, newOrders=false
PRODUCTION    -> real=false, simulated=false, newOrders=false
EMERGENCY     -> real=false, simulated=false, newOrders=false
```

`GUARDED_LIVE` and `PRODUCTION` remain vocabulary for FT-7+ forward compatibility only. Any future enabling requires a separate FT-7+ architecture/security decision.

## 5. Supersession semantics

This package does not create a replacement `AUTH-*` identity for ADR-0099. The semantic authority remains:

```text
AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20
```

The changes are same-authority post-merge lifecycle/current-state normalization plus removal of stale projections. Historical evidence remains non-authorizing and traceable.

No accepted higher-tier authority is superseded.

## 6. Operational impact

- no Supabase mutation;
- no new schema/table/queue/event journal;
- no new runtime dependency;
- no score/model promotion;
- no DeFi/Meme model change;
- no exchange/custody/live execution capability;
- no deletion of financial audit evidence.

## 7. Security impact

Current branch work is fail-closed documentation/authority normalization. The separately identified operating-mode code mutation remains blocked pending explicit Owner approval.

The supersession must not weaken:

- FT-5 deterministic Risk/Compliance Decision authority;
- service-role-only private `fintech_core` persistence;
- FT-6B fixed-point financial representation;
- FT-6B deterministic idempotency/integrity;
- `public.outbox_jobs` queue authority;
- FT-7+ live-execution gate.

## 8. Regulatory impact

N/A for this cleanup package. No legal applicability, policy threshold, execution eligibility or customer-facing financial decision rule is changed.

## 9. Evidence retention / archive rule

Historical evidence is retained. Files are not deleted merely because a newer phase exists. A document is archived/suspended only when it is an obsolete current-source candidate and the lifecycle policy permits the move without breaking traceability.

For FT-6A/FT-6B evidence, retention is preferred over rewrite or deletion because these files document the actual implementation sequence.

## 10. Separate Supersession B — Meme Coin & DeFi Model Remodeling

The following scope is explicitly **out of this package** and begins from then-current `main` after Supersession A:

- re-model Meme Coin and DeFi category feature contracts;
- re-evaluate ADR-0100 and DeFiLlama evidence-provider placement;
- prevent latent-factor/double-counting correlations across market, liquidity, activity and protocol metrics;
- define versioned baseline/challenger lifecycle through the existing `ScoringModelRegistry` / `ScoringDispatcher` only;
- preserve explicit missing/stale/not-computable semantics;
- keep `CryptoOrchestrator` research/enrichment-only and `scoreEligible=false`;
- no second scoring/evidence/dispatcher/orchestrator authority.

## 11. Rollback

Documentation/current-state normalization can be reverted by reverting the supersession commit/PR. No production database rollback is required because this package performs no external mutation.

Any later runtime security mutation must carry its own negative tests and rollback path.
