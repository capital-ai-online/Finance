# CAPITAL-AI-FINTECH — Project Roadmap

**Status:** `ACTIVE — PVC-12..17 PRIMARY OWNER`  
**Version:** `3.0-consolidated-current-main`  
**Current-main correlation baseline:** `main@56f196fc034c5514463546ee975ffb83fd50f44a`  
**Consolidated:** 2026-09-06  
**Primary PVC ownership:** `PVC-12` through `PVC-17`

## 1. Objective

Consolidate the financial scoring department into one homogeneous, fail-closed chain while preserving current technical authorities:

```text
Validated DATA input
-> Financial Feature Contract
-> ScoringModelRegistry
-> ScoringDispatcher
-> Domain Executor
-> CanonicalScoreResult
-> Ranking / Decision Support
```

Organizational ownership is expressed with `PVC-*`; technical financial stage identity remains separately governed by `SC-MD-SPT-0001` using `VC-*`.

The current development order remains:

```text
PVC
-> this Roadmap
-> applicable ADR
-> applicable ESS
-> code / tests / evidence
```

This Roadmap is the current FINTECH planning surface. Task registers, work-package projections, historical handoffs, branch-correlation reports and older FinTech packages are supporting evidence/traceability only and do not create parallel planning or runtime authority.

## 2. Consolidation scope and evidence rule

This 2026-09-06 consolidation correlates repository-materialized work verifiable from current `main`, including current FINTECH project documents, relevant code/tests/contracts, merged PRs/commits, repository evidence/work-claims/handoffs, the supporting non-authorizing FinTech package, and concrete upstream/downstream project dependencies.

Separate ChatGPT UI chat windows are not repository sources and cannot be enumerated through the repository connector. Chat work is incorporated only when materialized as code, documentation, branch/commit/PR metadata, evidence, work-claim or handoff content. Historical or superseded artifacts are search/evidence inputs only and never override current `main`.

### Current correlation — 2026-09-06

- initial consolidation work began from `main@a0f485fe86811c9c780c9cf8aa666dc04dc205e8`;
- OPS PR #774 was merged during consolidation and advanced `main` to `169cf96ac4d90ffaacab22d88541b837fd66fe8d`; its DNS/runbook/test scope had no FINTECH overlap;
- Governance PR #775 was then created and Human-merged, advancing `main` to `56f196fc034c5514463546ee975ffb83fd50f44a`;
- PR #775 changed only `docs/projects/governance/COMPONENT_ARCHITECTURE_MATRIX.md`, `docs/projects/governance/ROADMAP.md` and `docs/projects/governance/TASK_REGISTER.md`; no FINTECH changed-file, semantic, namespace, authority or Primary-Owner overlap was identified;
- the unpublished FINTECH branch was reset to `main@56f196fc034c5514463546ee975ffb83fd50f44a` and the bounded FINTECH document consolidation was replayed;
- at this resynchronization point there are zero open Pull Requests;
- older FinTech consolidation/V2 branches remain historical/reuse inputs and are not parallel merge authorities.

## 3. Current ownership and consolidated state

| PVC | FINTECH capability | Current reusable implementation / contract | Consolidated status |
|---|---|---|---|
| `PVC-12` | Feature Engineering | DATA `ValidatedDataInput` boundary plus versioned model feature contracts | `PARTIAL / P1 — UPSTREAM CONTRACT IMPLEMENTED, FINTECH MAPPING OPEN` |
| `PVC-13` | Scoring Models | `ScoringModelRegistry` under ADR-0087 | `VERIFIED CORE / DRIFT WATCH` |
| `PVC-14` | Scoring Orchestration | `ScoringDispatcher` + bounded orchestration | `VERIFIED CORE` |
| `PVC-15` | Domain Analysis / Executor | registered executor adapters / analysis surfaces | `VERIFIED/PARTIAL + FIN-SEC-03 OPEN` |
| `PVC-16` | Canonical Scoring | `CanonicalScoreResult` family / verified-score surfaces | `VERIFIED/PARTIAL + FIN-SEC-02 OPEN` |
| `PVC-17` | Ranking / Decision Support | existing ranking contracts/services plus productive `RankingBoard` consumer | `PARTIAL / P1 — BACKEND AUTHORITY CONSOLIDATION OPEN` |

### Completed / evidence-backed baseline retained

1. `FIN-SYNC-01` — 2026-09-01 project-surface synchronization completed/evidence-ready and merged through PR #696; its exact-main baseline is historical.
2. One productive `ScoringModelRegistry` is retained; challengers/research models remain non-productive until governed promotion.
3. One productive `ScoringDispatcher` is retained; no second dispatcher or parallel productive model-selection architecture is authorized.
4. `CanonicalScoreResult` remains the canonical scoring-result family; lineage and fail-closed semantics remain mandatory.
5. Scoreable classes remain crypto, stock, forex, commodity, index and supported sovereign benchmark-yield bonds.
6. `src/platform/MarketData/ProviderMatrix.ts` remains the provider capability inventory at `provider-matrix/1.10.0`; FINTECH does not take over provider ingress/DQ authority.
7. `CAPITAL-AI-DATA` has implemented upstream `validated-data-input/1.0.0`; FINTECH consumption/mapping remains open under `FIN-12`.
8. The former separate FINTECH Security handoff overlay is historical/non-authorizing; current remediation routes by affected PVC, this Roadmap, applicable ADR/ESS and owner implementation/tests/evidence.
9. Older V2/FinTechCore documents and branches are retained only where current code/ADR/ESS evidence supports their still-valid invariants.

## 4. Invariants

1. one productive `ScoringModelRegistry`;
2. one productive `ScoringDispatcher`;
3. one `CanonicalScoreResult` contract family;
4. one productive FINTECH ranking authority;
5. no synthetic score or neutral missing-evidence fallback;
6. no provider-specific bypass around DATA/Evidence/DQ;
7. no frontend-local scoring, ranking or entitlement business authority;
8. research/challenger scoring remains non-productive until promoted;
9. Security owns findings/independent verification; FINTECH owns only affected `PVC-12..17` implementation/evidence;
10. browser/local subscription projection is never a protected-capability grant;
11. foreign PVC implementation is never absorbed into FINTECH;
12. current Git evidence uses `main_sha`, `branch_head_sha`, `pr_head_sha` and `merge_sha` as applicable.

## 5. Architecture baseline

### ADR-0087 — canonical scoring

The productive chain remains:

```text
UAI Identity
-> Evidence Acquisition
-> Evidence/Quality Gate
-> Feature Contract
-> ScoringModelRegistry
-> ScoringDispatcher
-> Domain Executor Adapter
-> CanonicalScoreResult
-> Ranking/Eligibility
-> EventMesh/Traceability/Supervisor
```

### ADR-0034 — subscription entitlements

`subscription-entitlements/1.0.0` remains the code-level entitlement contract. Verified-score route adoption and remaining protected-capability migration are still open and form the basis for `FIN-SEC-02` and `FIN-SEC-03`.

### ADR-0041 / ESS-0016 — provider data plane

Provider acquisition stays provider-neutral behind gateway/normalization/provenance/DQ. FINTECH may map financial feature/model requirements to provider capabilities but does not own provider ingress, freshness or DQ.

## 6. FIN-12 — Validated DATA -> Financial Feature Contract

**Priority:** `P1`  
**Status:** `PARTIAL — UPSTREAM CONTRACT IMPLEMENTED`

DATA now exposes `src/platform/MarketData/ValidatedDataInput.ts` with `VALIDATED_DATA_INPUT_CONTRACT_VERSION = validated-data-input/1.0.0`, explicit PASS/PARTIAL/FAIL/NOT_COMPUTABLE/STALE/MISSING/UNKNOWN states and required provenance/correlation semantics.

FINTECH must define and test the versioned mapping from accepted `ValidatedDataInput` observations into registered financial feature contracts while preserving identity, provenance/freshness where relevant, non-computable semantics and feature/model version compatibility.

**Exit gate:** every productive feature builder has a tested fail-closed `ValidatedDataInput` compatibility boundary; failed/missing/stale/non-computable upstream evidence cannot become an invented valid feature.

## 7. FIN-13 / FIN-14 — model and orchestration core

`ScoringModelRegistry` remains the only productive model-resolution authority and `ScoringDispatcher` the only productive dispatcher. Ambiguity, unsupported scope or missing canonical route stays fail-closed. Challenger/research models do not become fallback paths.

**Status:** `FIN-13 VERIFIED CORE / DRIFT WATCH`; `FIN-14 VERIFIED CORE`.

## 8. FIN-SEC-02 — PVC-16 verified-screening authorization

**Priority:** `P1/HIGH`  
**Status:** `OPEN / REFERRED_NOT_EXECUTED`

Every productive canonical verified-score/context/batch path must consume the accepted `verified_screening` server entitlement/quota boundary. No second scoring or entitlement authority may be introduced.

Required evidence includes valid paid/within-quota ALLOW; browser-tier escalation DENY; missing/invalid identity DENY where applicable; stale entitlement/quota-state DENY; alternate/direct-route DENY when the canonical gate is not satisfied; and no canonical-score/DATA-DQ regression.

**Exit gate:** FINTECH implementation/tests are `EVIDENCE_READY` and independent `CAPITAL-AI-SEC` verification is requested.

## 9. FIN-SEC-03 — PVC-15 financial-analysis authorization

**Priority:** `P1/HIGH`  
**Status:** `OPEN / REFERRED_NOT_EXECUTED`

Current gaps remain Backtest server entitlement enforcement, Monte Carlo alternate/client-local execution, and explicit productive binding of `full_ai_analysis`. FINTECH must define one authoritative protected-execution boundary while preserving Buffett server authority.

**Exit gate:** server-authoritative ALLOW/DENY evidence is ready, any FE consumer handoff is issued without transferring business authority, and Security verification is requested.

## 10. FIN-15 / FIN-16 — domain executors and canonical scoring

Core executor/result architecture is retained. `FIN-15` remains `VERIFIED/PARTIAL` while `FIN-SEC-03` is open; `FIN-16` remains `VERIFIED/PARTIAL` while `FIN-SEC-02` is open.

## 11. FIN-17 — one productive ranking / decision-support authority

**Priority:** `P1`  
**Status:** `PARTIAL / OPEN`

Existing backend ranking assets are reused. The productive browser surface is `src/features/screening/ui/RankingBoard.tsx`, but current evidence still records local READY-score ordering for Top/Worst presentation.

FINTECH must expose one stable backend rank/order result boundary. Frontend remains a presentation consumer; migration away from local ordering is executed by `CAPITAL-AI-FE` after the FINTECH boundary stabilizes.

**Exit gate:** one productive FINTECH backend ranking authority emits stable order/rank output from canonical scores and FE can consume it without recalculating ranking semantics.

## 12. FIN-18 — asset-class inventory

**Status:** `VERIFIED`

Supported scoreable classes remain crypto, stock, forex, commodity, index and bounded sovereign benchmark-yield bonds. No new class is inferred from UI/provider breadth.

## 13. FIN-19 — provider capability mapping

**Priority:** `P2`  
**Status:** `PARTIAL / OPEN`

FINTECH owns only mapping financial feature/model requirements to provider-neutral DATA capabilities/current `provider-matrix/1.10.0`. DATA retains ingress, evidence identity, freshness and DQ.

**Exit gate:** productive financial requirements map to current provider-neutral DATA capability contracts without duplicating ingress/DQ authority.

## 14. FIN-20 — end-to-end scoring evidence

**Priority:** `P2`  
**Status:** `PARTIAL / OPEN`

Complete exact lineage across:

```text
ValidatedDataInput
-> versioned Feature Contract
-> registered Model
-> ScoringDispatcher
-> Domain Executor
-> CanonicalScoreResult
-> backend Rank/Decision output
-> OPS trace/evidence transport
```

**Exit gate:** exact productive score/rank lineage and required Security/OPS return paths are reproducible with current Git/runtime identities.

## 15. FIN-DRIFT-01 — deterministic project/contract drift checks

**Priority:** `P3`  
**Status:** `PLANNED`

Add low-cost deterministic checks for project/PVC owner drift, stale current-baseline claims, provider-matrix version drift, ranking consumer-boundary drift, active-vs-historical Security routing drift, and retired Git terminology reappearing in current planning/evidence.

**Exit gate:** representative stale projections fail deterministically and the current canonical FINTECH surface passes without creating a new Authority/policy overlay.

## 16. Consolidated document disposition

| Document / source | Current disposition |
|---|---|
| `docs/projects/fintech/ROADMAP.md` | current FINTECH planning surface |
| `docs/projects/fintech/TASK_REGISTER.md` | supporting atomic execution projection aligned to this Roadmap |
| `docs/projects/fintech/WORK_PACKAGES.md` | supporting work-package projection aligned to this Roadmap |
| `docs/projects/fintech/SECURITY_HANDOFFS.md` | `HISTORICAL / NON-AUTHORIZING` |
| `docs/projects/fintech/VALIDATION_REPORT.md` | historical 2026-09-01 evidence |
| `docs/projects/fintech/BRANCH_CORRELATION_2026-08-31.md` | historical branch/reuse evidence |
| `docs/fintech/CAPITAL-AI-FINTECH/**` | supporting/non-authorizing technical detail/history |
| merged FINTECH PRs/commits | implementation/evidence history; current facts only where present on current main |
| work claims / handoffs | coordination/audit evidence only |

## 17. Priority queue

| Order | Work item | Priority | Current status | Next exit gate |
|---|---|---|---|---|
| 1 | `FIN-SEC-02` | P1/HIGH | OPEN / REFERRED_NOT_EXECUTED | FINTECH implementation/tests evidence-ready; Security verification requested |
| 1 | `FIN-SEC-03` | P1/HIGH | OPEN / REFERRED_NOT_EXECUTED | server protected-execution/capability binding evidence-ready; Security verification requested |
| 2 | mandatory recorrelation after either Security child completes | gate | OPEN WHEN TRIGGERED | then-current main/open PR/Security/ADR/ESS state re-read |
| 3 | `FIN-12` | P1 | PARTIAL | `ValidatedDataInput/1.0.0` -> versioned financial feature mapping tested fail-closed |
| 3 | `FIN-17` | P1 | PARTIAL | one backend FINTECH rank/order authority; FE consumer boundary ready |
| 4 | `FIN-19` | P2 | PARTIAL | current provider-neutral capability mapping complete |
| 5 | `FIN-20` | P2 | PARTIAL | exact input-to-rank lineage and return evidence complete |
| 6 | `FIN-DRIFT-01` | P3 | PLANNED | deterministic drift check implemented |

`FIN-12` and `FIN-17` intentionally share the same post-Security priority band; order is recomputed after recorrelation.

## 18. Ownership boundaries

- `CAPITAL-AI-DATA / PVC-09..11` owns provider ingress, UAI/data ingestion, evidence identity, freshness and DQ.
- `CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability and operations/release lifecycle.
- `CAPITAL-AI-FE` owns presentation implementation only; it does not own score/rank/entitlement business authority.
- `CAPITAL-AI-SEC` owns findings/requirements and independent verification; FINTECH may report only target-local implementation/evidence readiness.
- Compliance/Quality may assess FINTECH outputs but do not acquire productive `PVC-12..17` ownership.

## 19. Security evidence return rule

FINTECH remediation evidence must identify the source finding and include applicable `main_sha`, `branch_head_sha`, `pr_head_sha`, `merge_sha`, changed files/scope, actually executed positive/negative tests, evidence paths, residual risks/dependencies and a request for independent Security verification.

## 20. Definition of Done

The FINTECH roadmap is complete only when:

- `PVC-12..17` uniquely map to `CAPITAL-AI-FINTECH`;
- `ValidatedDataInput` reaches financial feature contracts through an explicit versioned fail-closed mapping;
- every productive scoring path is Registry -> Dispatcher -> Executor -> CanonicalScoreResult;
- DATA/DQ remains upstream and fail-closed;
- protected financial capabilities use verified-principal/server-authoritative entitlement decisions;
- FIN-SEC-02 and FIN-SEC-03 are independently assessed by Security;
- ranking has one productive FINTECH backend authority;
- Frontend consumes authoritative result/ranking contracts only;
- provider mapping does not bypass DATA ownership;
- exact score-to-rank lineage and OPS trace handoff are reproducible;
- deterministic drift checks prevent stale projections from silently returning;
- no foreign work is marked DONE/VERIFIED/CLOSED by FINTECH;
- exact current `main`, open PRs, overlap and branch head are re-read before PR approval/creation;
- PR creation, hosted checks, merge and any production mutation follow then-current `/AGENTS.md` controls.
