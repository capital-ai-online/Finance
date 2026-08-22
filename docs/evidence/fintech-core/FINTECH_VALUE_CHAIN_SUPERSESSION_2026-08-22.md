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
| `ADR-0099` | stable FinTech Core authority, lifecycle still `proposed` | PR #483 has been Human-merged; lifecycle and branch metadata are stale | same-authority lifecycle/version normalization to `1.7.0 / accepted`; no new authorityId |
| `docs/adr/registry.json` | canonical ADR registry | ADR-0099 still `1.6.0 / proposed` | synchronize to `1.7.0 / accepted` |
| `docs/governance/authority-registry.json` | canonical authority registry | ADR-0099 still `owner-directed-proposed` | synchronize stable authority identity to `1.7.0 / accepted` |
| `docs/roadmaps/FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` | roadmap projection | still says FT-6B PR pending / branch implementation | project FT-6B as DONE / MERGED #483 |
| `src/platform/FinTechCore/README.md` | component projection | still contains pre-merge closure gates and `ADR-0099 (proposed)` | replace with post-merge current-state projection |
| `src/platform/FinTechCore/manifest.json` | component inventory/projection | stale FT-6B and security-projection state | synchronize to applied/verified FT-6B state and version `0.6.1` after fail-closed hardening |
| `docs/architecture/ORCHESTRATORS_AND_SCORING_ENGINES.md` | architecture projection | canonical topology correct but historical architecture reports can still be misread as current | retain as current projection and add explicit historical supersession index |
| `FT6A_*` / older FT evidence | historical evidence | obsolete as current state but valid audit evidence | retain; do not rewrite or delete |
| FT-6B work claim | coordination metadata | `status=active` is schema-constrained historical coordination metadata after merge | do not reinterpret as runtime/architecture authority |
| `ADR-0100` / DeFiLlama | proposed DeFi evidence-provider decision | semantically correlated with requested Meme/DeFi remodeling | isolate for separate Supersession B; no model/scoring semantics changed here |

## 3. Runtime / legacy-path correlation

### 3.1 Canonical FT-6B OrderIntent path

New FT-6B execution-relevant PAPER OrderIntents are deterministic `BOUND` intents and persist through:

```text
FinTechCoreOrderIntent
  -> bindApprovedOrderIntent(...)
  -> appendOrderIntent(...)
  -> fintech_core_append_order_intent_v2
```

### 3.2 Legacy FT-3/FT-6 OrderIntent compatibility path

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

### 3.3 Shadowed Crypto/Meme composition-root handlers

`server.application.ts` still contains historical Meme-Crypto handler bodies and the `MemeCoinScoringService` import. They are **not the productive HTTP scoring authority** because `registerApplicationRoutes(...)` is mounted earlier and `server/routes/legacyScoringCompatibilityRoutes.ts` terminates Standard- and Meme-Crypto requests through `dispatchCanonicalScore(...)`.

Current effective chain:

```text
/api/crypto-scoring/:symbol
  -> createLegacyScoringCompatibilityRouter()
  -> respondWithCanonicalCryptoScore(...)
  -> dispatchCanonicalScore(...)
  -> ScoringModelRegistry / ScoringDispatcher
```

The later `server.application.ts` handlers are therefore `shadowed-dead-compatibility-debt`, not a parallel live scoring path.

This supersession adds a static regression guard in `tests/unit/sc2GlobalSingleDispatcher.test.ts` that verifies:

- the canonical route composition mount exists;
- the historical GET/POST handlers occur only after that mount;
- the compatibility router is actually mounted;
- the compatibility executable source contains no `MemeCoinScoringService` direct execution.

Physical deletion from the large composition root is deferred until a bounded decomposition/removal pass can preserve unrelated route behavior. The authority defect is closed now: a route-order regression that would reactivate the old handlers is test-detectable.

### 3.4 Historical FinTech architecture projections

The repository contains dated architecture/audit reports that accurately describe earlier states but conflict with the current Single-Dispatcher/FinTechCore topology if read as current architecture:

- `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` — 2026-07-31 audit snapshot;
- `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_NACHAUDIT.md` — 2026-08-02 audit snapshot;
- `docs/architecture/ENTERPRISE_FINTECH_FINALIZATION_REPORT.md` — 2026-07-31 remediation/finalization snapshot;
- `docs/architecture/ENTERPRISE_SCREENING_SCORING_MASTER_ARCHITECTURE.md` — pre-ADR-0087 multi-engine blueprint.

These files are retained for audit/RAG/reference stability and are explicitly classified in the current `ORCHESTRATORS_AND_SCORING_ENGINES.md` projection as `historical / non-authorizing`. Their old direct-service topology, old model weights, provider assumptions and production-readiness scores do not override ADR-0087, ADR-0099, current registries or runtime contracts.

A physical archive move is not performed in this package because current repository consumers include documentation export/RAG/test references. Moving them without consumer migration would trade semantic drift for broken traceability.

## 4. Owner-approved fail-closed operating-mode correction

The supersession found a real policy projection contradiction:

```text
FINTECH_CORE_OPERATING_MODE_POLICY
GUARDED_LIVE.realExecutionAllowed = true
PRODUCTION.realExecutionAllowed   = true
```

while `isOrderIntentEligibleForRealExecution(...)` and the effective FT-6B authority hard-block real execution for every mode.

The Owner explicitly approved the fail-closed correction on **2026-08-22 at 04:23 CEST**. The mutation is repository-only and introduces no external or production capability.

Effective FT-6B policy after the approved correction:

```text
RESEARCH      -> real=false, simulated=false, newOrders=false
PAPER         -> real=false, simulated=true,  newOrders=true
GUARDED_LIVE  -> real=false, simulated=false, newOrders=false
PRODUCTION    -> real=false, simulated=false, newOrders=false
EMERGENCY     -> real=false, simulated=false, newOrders=false
```

`GUARDED_LIVE` and `PRODUCTION` remain forward-compatible vocabulary only. Any later enabling requires a separate FT-7+ architecture/security decision and must not be inferred from the enum or mode name.

Regression coverage in `tests/unit/fintechCoreContracts.test.ts` now asserts:

- `realExecutionAllowed=false` for every operating mode;
- simulated execution and new orders are permitted only for `PAPER`;
- `isOrderIntentEligibleForRealExecution(...)` remains false for every mode.

Security effect: stricter fail-closed projection, no privilege increase, no execution activation, no Supabase mutation and no change to persisted financial evidence.

## 5. Supersession semantics

This package does not create a replacement `AUTH-*` identity for ADR-0099. The semantic authority remains:

```text
AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20
```

The changes are same-authority post-merge lifecycle/current-state normalization plus removal of stale projections. Historical evidence remains non-authorizing and traceable.

No accepted higher-tier authority is superseded.

## 6. Code-/governance regression guards

Three code-level regression guards are included:

1. `tests/unit/governanceControlPlane.test.ts`
   - requires ADR-0099 to remain `1.7.0 / accepted` in ADR and Authority registries;
   - preserves the stable ADR-0099 authorityId/path.
2. `tests/unit/sc2GlobalSingleDispatcher.test.ts`
   - requires canonical Crypto/Meme compatibility routing to be mounted before shadowed historical composition-root handlers;
   - keeps the Compatibility Router free of direct Meme scoring execution.
3. `tests/unit/fintechCoreContracts.test.ts`
   - requires the complete FT-6 operating-mode policy to remain fail-closed;
   - permits simulated/new-order capability only for PAPER;
   - keeps real execution hard-blocked for every mode.

These tests harden the supersession without introducing a new runtime authority.

## 7. Operational impact

- no Supabase mutation;
- no new schema/table/queue/event journal;
- no new runtime dependency;
- no score/model promotion;
- no DeFi/Meme model change;
- no exchange/custody/live execution capability;
- no deletion of financial audit evidence;
- no change to productive ScoringDispatcher routing semantics;
- FinTechCore component version `0.6.1` records the fail-closed policy hardening.

## 8. Security impact

The Owner-approved operating-mode mutation is **fail-closed**: it removes stale declarative capabilities from `GUARDED_LIVE` and `PRODUCTION` rather than granting new ones.

The supersession preserves:

- FT-5 deterministic Risk/Compliance Decision authority;
- service-role-only private `fintech_core` persistence;
- FT-6B fixed-point financial representation;
- FT-6B deterministic idempotency/integrity;
- `public.outbox_jobs` queue authority;
- ADR-0087 Single-Dispatcher scoring boundary;
- FT-7+ live-execution gate.

Rollback is a repository revert of this supersession. No external state rollback is necessary because the correction performs no database, IAM, exchange or deployment mutation.

## 9. Regulatory impact

No legal applicability, policy threshold or customer-facing financial decision rule is changed. The correction reduces ambiguity around a blocked future execution capability.

## 10. Evidence retention / archive rule

Historical evidence is retained. Files are not deleted merely because a newer phase exists. A document is archived/suspended only when it is an obsolete current-source candidate and the lifecycle policy permits the move without breaking traceability.

For FT-6A/FT-6B evidence and dated Enterprise FinTech audits, retention is preferred over rewrite or deletion because these files document actual implementation/audit sequence. Current-state ambiguity is resolved through explicit de-authorizing projection metadata instead of historical rewriting.

## 11. Separate Supersession B — Meme Coin & DeFi Model Remodeling

The following scope is explicitly **out of this package** and begins from then-current `main` after Supersession A:

- re-model Meme Coin and DeFi category feature contracts;
- re-evaluate ADR-0100 and DeFiLlama evidence-provider placement;
- prevent latent-factor/double-counting correlations across market, liquidity, activity and protocol metrics;
- define versioned baseline/challenger lifecycle through the existing `ScoringModelRegistry` / `ScoringDispatcher` only;
- preserve explicit missing/stale/not-computable semantics;
- keep `CryptoOrchestrator` research/enrichment-only and `scoreEligible=false`;
- no second scoring/evidence/dispatcher/orchestrator authority.

## 12. Rollback

Documentation/current-state normalization, regression guards and the fail-closed policy correction can be reverted by reverting the supersession PR. No production database rollback is required because this package performs no external mutation.
