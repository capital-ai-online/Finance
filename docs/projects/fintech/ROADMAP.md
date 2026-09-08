# CAPITAL-AI-FINTECH — Project Roadmap

**Status:** `ACTIVE — PVC-12..17 PRIMARY OWNER`  
**Version:** `4.0-sota-outcome-extension`  
**Current-main correlation baseline:** `main@c65ae87f25d7e9c231340366b697d131271baa24`  
**Modernized:** 2026-09-07  
**Re-correlated:** 2026-09-08  
**Primary PVC ownership:** `PVC-12` through `PVC-17`  
**Canonical role:** single FINTECH planning surface; this version extends the existing Roadmap and creates no second planning or runtime authority.

## 1. Objective

Consolidate the financial scoring department into one homogeneous, explainable, fail-closed decision-support chain while preserving current technical authorities:

```text
Validated DATA input
-> Financial Feature Contract
-> ScoringModelRegistry
-> ScoringDispatcher
-> Domain Executor
-> CanonicalScoreResult
-> Ranking / Decision Support
```

### Strategic Intent

Maintain one trustworthy, explainable, fail-closed financial decision-support chain from validated upstream evidence through versioned financial features, canonical model resolution, `ScoringDispatcher`, Domain Executor, `CanonicalScoreResult` and authoritative backend Ranking / Decision Support.

### North-star Outcome

A productive FINTECH outcome is roadmap-successful only when:

1. accepted upstream evidence enters FINTECH through explicit validated and version-compatible contracts;
2. productive model resolution uses the one canonical `ScoringModelRegistry` and controlled champion lifecycle;
3. productive scoring execution uses the one canonical `ScoringDispatcher` and registered Domain Executor path;
4. protected financial capabilities use server-authoritative identity/entitlement decisions;
5. score, rank/order and decision-support lineage is reproducible without synthetic evidence or silent fallback;
6. Frontend consumers render authoritative result/rank semantics and do not recalculate business scoring, ranking or entitlement decisions;
7. required Security, DATA, OPS, Compliance or Human-Legal returns remain explicit rather than being self-closed by FINTECH.

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

Current facts are resolved from then-current `main`, current open Pull Requests, applicable Accepted ADRs / Active ESS, code/tests/evidence and current writer state. Historical chats, branches, assessments and evidence are search/design inputs only until revalidated.

### Current correlation — 2026-09-08

- current baseline is `main@c65ae87f25d7e9c231340366b697d131271baa24`;
- DATA PR #827 was Human-merged as `5490a3b1a8d6aa19e2cd955b79267dffa15e5282`; the validated DATA exit composes provider-input validation, capability freshness, provenance lineage and the quality gate on current main;
- FIN-SEC-02 implementation PR #810 was Human-merged as `1624a51c5f54b2f3e56ea208bade374ae7e9b05a`; current-main FINTECH evidence remains `IMPLEMENTED / EVIDENCE_READY`, while independent `CAPITAL-AI-SEC` verification is still requested and `S1-R2-06` remains open at Security level;
- the stale `CAPITAL-AI-FINTECH-FIN-SEC-02-2026-09-07` work-claim file still says `active`, but its own release condition was satisfied by merged PR #810, its claimed paths do not include this Roadmap, and work claims are coordination metadata rather than planning/runtime authority;
- since the prior `main@09ab297c1fd954c37fa2cb8b2fba718cb58402cb` approval snapshot, 78 main commits were added through Governance PR #845; compare shows Governance, Security, Operations and Frontend changes but no modification of `docs/projects/fintech/ROADMAP.md` and no FINTECH runtime-file change;
- current Security roadmaps continue to describe `S1-R2-06` as parent evidence available with children mixed/open; no independent FIN-SEC-02 `SECURITY VERIFIED/CLOSED` return is present;
- no current-main `FIN_SEC_03_ANALYSIS_ENTITLEMENT_2026-09-07.md` evidence exists; FIN-SEC-03 therefore remains `OPEN / REFERRED_NOT_EXECUTED` regardless of historical unpublished branch work;
- the prior exclusive FIN-SEC-03 writer branch `agent/fintech-fin-sec-03-analysis-entitlement-r5-20260907` no longer exists; current branch search returns only this roadmap-modernization branch for FINTECH work;
- open PR #846 is `CAPITAL-AI-OPS` and changes only `docs/projects/operations/README.md`, `ROADMAP.md`, `WORK_PACKAGES.md` and `evidence/OPS_POST_828_PRIORITY_RECORRELATION_2026-09-07.md`; it has no FINTECH changed-file, PVC-12..17, scoring/ranking, entitlement, DATA-ingress or roadmap-authority overlap;
- the previously prepared State-of-the-Art assessment is treated as advisory/non-authorizing design input only; useful findings were revalidated against current architecture authorities before inclusion here;
- no second canonical roadmap, second Scoring architecture, second Ranking authority, second Entitlement authority or second DATA/provider-ingress architecture is introduced.

### Historical consolidation baseline retained

The 2026-09-06 consolidation remains historical traceability for how the existing work-package inventory was assembled. Historical exact-main SHAs and prior branch states do not override the 2026-09-08 current correlation above.

## 3. Current ownership and consolidated state

| PVC | FINTECH capability | Current reusable implementation / contract | Current state |
|---|---|---|---|
| `PVC-12` | Feature Engineering | current-main DATA `ValidatedDataInput` exit plus versioned model feature contracts | `PARTIAL / P1 — UPSTREAM EXIT COMPOSED, FINTECH MAPPING OPEN` |
| `PVC-13` | Scoring Models | `ScoringModelRegistry` under ADR-0087 | `VERIFIED CORE / DRIFT WATCH` |
| `PVC-14` | Scoring Orchestration | `ScoringDispatcher` + bounded orchestration | `VERIFIED CORE` |
| `PVC-15` | Domain Analysis / Executor | registered executor adapters / analysis surfaces | `VERIFIED/PARTIAL + FIN-SEC-03 OPEN` |
| `PVC-16` | Canonical Scoring | `CanonicalScoreResult` family / verified-score surfaces | `VERIFIED/PARTIAL + FIN-SEC-02 EVIDENCE_READY / SECURITY VERIFICATION OPEN` |
| `PVC-17` | Ranking / Decision Support | existing ranking contracts/services plus productive `RankingBoard` consumer | `PARTIAL / P1 — BACKEND AUTHORITY CONSOLIDATION OPEN` |

### Completed / evidence-backed baseline retained

1. `FIN-SYNC-01` — 2026-09-01 project-surface synchronization completed/evidence-ready and merged; its exact-main baseline is historical.
2. One productive `ScoringModelRegistry` is retained; challengers/research models remain non-productive until governed promotion.
3. One productive `ScoringDispatcher` is retained; no second dispatcher or parallel productive model-selection architecture is authorized.
4. `CanonicalScoreResult` remains the canonical scoring-result family; lineage and fail-closed semantics remain mandatory.
5. Scoreable classes remain crypto, stock, forex, commodity, index and supported sovereign benchmark-yield bonds.
6. `src/platform/MarketData/ProviderMatrix.ts` remains the provider capability inventory at `provider-matrix/1.10.0`; FINTECH does not take over provider ingress/DQ authority.
7. `CAPITAL-AI-DATA` has implemented and composed upstream `validated-data-input/1.0.0` through the merged DATA #827 exit; FINTECH consumption/mapping remains open under `FIN-12`.
8. `FIN-SEC-02` implementation and tests are `EVIDENCE_READY`; independent Security verification remains open.
9. The former separate FINTECH Security handoff overlay is historical/non-authorizing; current remediation routes by affected PVC, this Roadmap, applicable ADR/ESS and owner implementation/tests/evidence.
10. Older V2/FinTechCore documents and branches are retained only where current code/ADR/ESS evidence supports their still-valid invariants.

## 4. Invariants

1. one productive `ScoringModelRegistry`;
2. one productive `ScoringDispatcher`;
3. one `CanonicalScoreResult` contract family;
4. one productive FINTECH backend ranking / decision-support authority;
5. no synthetic score or neutral missing-evidence fallback;
6. no provider-specific bypass around DATA/Evidence/DQ;
7. no frontend-local scoring, ranking or entitlement business authority;
8. research/challenger scoring remains non-productive until governed promotion;
9. Security owns findings/independent verification; FINTECH owns only affected `PVC-12..17` implementation/evidence;
10. browser/local subscription projection is never a protected-capability grant;
11. foreign PVC implementation is never absorbed into FINTECH;
12. current Git evidence uses `main_sha`, `branch_head_sha`, `pr_head_sha` and `merge_sha` as applicable;
13. roadmap completion is evidence-backed outcome completion, not task completion alone;
14. `NOT RUN`, `NOT_BASELINED`, `EVIDENCE_READY`, `SECURITY VERIFIED` and `CLOSED` remain distinct states;
15. visualization-ready FINTECH output contracts may expose authoritative score/rank/lineage state, but Frontend presentation must not become a second business-decision authority.

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

`ScoringModelRegistry` remains the only productive model-resolution authority. Champion/challenger lifecycle, unsupported-scope behavior and ambiguity remain fail-closed.

### ADR-0034 — subscription entitlements

`subscription-entitlements/1.0.0` remains the code-level entitlement contract. FIN-SEC-02 has implemented the accepted `verified_screening` boundary on the current-main verified-score paths; independent Security verification remains open. FIN-SEC-03 remains an open protected-execution gap for Backtest / Monte Carlo / `full_ai_analysis` while Buffett server authority is preserved.

### ADR-0041 / ESS-0016 — provider data plane

Provider acquisition stays provider-neutral behind gateway/normalization/provenance/DQ. FINTECH may map financial feature/model requirements to provider capabilities but does not own provider ingress, freshness, licensing decisions or DQ. MCP/agent tools remain a governed research/evidence plane and do not replace the deterministic runtime data plane.

## 6. FIN-12 — Validated DATA -> Financial Feature Contract

**Priority:** `P1`  
**Status:** `PARTIAL — UPSTREAM EXIT COMPOSED / FINTECH MAPPING OPEN`

DATA exposes `src/platform/MarketData/ValidatedDataInput.ts` with `VALIDATED_DATA_INPUT_CONTRACT_VERSION = validated-data-input/1.0.0`, explicit PASS/PARTIAL/FAIL/NOT_COMPUTABLE/STALE/MISSING/UNKNOWN states and required provenance/correlation semantics.

Current main additionally composes provider-input validation, capability freshness, provenance lineage and the quality gate on the validated DATA exit through merged DATA PR #827. Before FIN-12 implementation, FINTECH re-reads the then-current `ValidatedDataInput` contract/tests and binds only against that current upstream behavior.

FINTECH must define and test the versioned mapping from accepted `ValidatedDataInput` observations into registered financial feature contracts while preserving identity, provenance/freshness where relevant, non-computable semantics and feature/model version compatibility.

**Exit gate:** every productive feature builder has a tested fail-closed `ValidatedDataInput` compatibility boundary; failed/missing/stale/non-computable upstream evidence cannot become an invented valid feature.

## 7. FIN-13 / FIN-14 — model and orchestration core

`ScoringModelRegistry` remains the only productive model-resolution authority and `ScoringDispatcher` the only productive dispatcher. Ambiguity, unsupported scope or missing canonical route stays fail-closed. Challenger/research models do not become fallback paths.

**Status:** `FIN-13 VERIFIED CORE / DRIFT WATCH`; `FIN-14 VERIFIED CORE`.

## 8. FIN-SEC-02 — PVC-16 verified-screening authorization

**Priority:** `P1/HIGH`  
**FINTECH status:** `IMPLEMENTED / EVIDENCE_READY`  
**Security status:** `VERIFICATION REQUESTED — NOT VERIFIED / NOT CLOSED`

Current-main evidence is `docs/projects/fintech/evidence/FIN_SEC_02_VERIFIED_SCREENING_2026-09-07.md`. Shared middleware reuses the accepted `verified_screening` quota/entitlement boundary; no second scoring or entitlement authority was introduced.

Required independent evidence includes the positive and negative authorization cases already prepared by FINTECH plus Security review of any alternate/public composition route that could be interpreted as productive verified scoring.

**Exit gate:** FINTECH implementation/tests remain evidence-ready on then-current main and `CAPITAL-AI-SEC` independently returns the applicable verification state. FINTECH does not self-promote to `SECURITY VERIFIED` or `CLOSED`.

## 9. FIN-SEC-03 — PVC-15 financial-analysis authorization

**Priority:** `P1/HIGH`  
**Status:** `OPEN / REFERRED_NOT_EXECUTED`

Current-main evidence does not contain the unpublished prior FIN-SEC-03 implementation/evidence branch. Backtest server entitlement enforcement, Monte Carlo alternate/client-local execution and explicit productive binding of `full_ai_analysis` therefore remain open current-main gaps. FINTECH must define one authoritative protected-execution boundary while preserving Buffett server authority.

**Exit gate:** server-authoritative ALLOW/DENY evidence is ready on a fresh current-main FINTECH branch, any FE consumer handoff is issued without transferring business authority, and independent Security verification is requested.

## 10. FIN-15 / FIN-16 — domain executors and canonical scoring

Core executor/result architecture is retained. `FIN-15` remains `VERIFIED/PARTIAL` while `FIN-SEC-03` is open; `FIN-16` remains `VERIFIED/PARTIAL` while FIN-SEC-02 independent Security verification remains open.

## 11. FIN-17 — one productive ranking / decision-support authority

**Priority:** `P1`  
**Status:** `PARTIAL / OPEN`

Existing backend ranking assets are reused. The productive browser surface is `src/features/screening/ui/RankingBoard.tsx`, but current evidence still records local READY-score ordering for Top/Worst presentation.

FINTECH must expose one stable backend rank/order result boundary. Frontend remains a presentation consumer; migration away from local ordering is executed by `CAPITAL-AI-FE` after the FINTECH boundary stabilizes.

The backend result boundary should be deliberately visualization-ready so presentation consumers can render, filter and explain authoritative results without recomputing business semantics.

**Exit gate:** one productive FINTECH backend ranking authority emits stable order/rank output from canonical scores and FE can consume it without recalculating ranking semantics.

## 12. FIN-18 — asset-class inventory

**Status:** `VERIFIED`

Supported scoreable classes remain crypto, stock, forex, commodity, index and bounded sovereign benchmark-yield bonds. No new class is inferred from UI/provider breadth.

## 13. FIN-19 — provider capability mapping

**Priority:** `P2`  
**Status:** `PARTIAL / OPEN`

FINTECH owns only mapping financial feature/model requirements to provider-neutral DATA capabilities/current `provider-matrix/1.10.0`. DATA retains ingress, evidence identity, freshness, provider-input validation, licensing/entitlement evidence and DQ.

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

OpenLineage-style dataset/job/run/facet concepts may be evaluated as an advisory interoperability pattern for lineage metadata, but FIN-20 must reuse existing CAPITAL-AI identities/contracts and may not create a parallel evidence or EventMesh authority.

**Exit gate:** exact productive score/rank lineage and required Security/OPS return paths are reproducible with current Git/runtime identities.

## 15. FIN-DRIFT-01 — deterministic project/contract drift checks

**Priority:** `P3`  
**Status:** `PLANNED`

Add low-cost deterministic checks for project/PVC owner drift, stale current-baseline claims, provider-matrix version drift, ranking consumer-boundary drift, active-vs-historical Security routing drift, retired Git terminology reappearing in current planning/evidence and roadmap measurement-state misuse (`NOT_RUN`, `NOT_BASELINED`, independent-verification states).

**Exit gate:** representative stale projections fail deterministically and the current canonical FINTECH surface passes without creating a new Authority/policy overlay.

## 16. Consolidated document disposition

| Document / source | Current disposition |
|---|---|
| `docs/projects/fintech/ROADMAP.md` | single current FINTECH planning surface |
| `docs/projects/fintech/TASK_REGISTER.md` | supporting atomic execution projection aligned to this Roadmap |
| `docs/projects/fintech/WORK_PACKAGES.md` | supporting work-package projection aligned to this Roadmap |
| `docs/projects/fintech/SECURITY_HANDOFFS.md` | `HISTORICAL / NON-AUTHORIZING` |
| `docs/projects/fintech/VALIDATION_REPORT.md` | historical 2026-09-01 evidence |
| `docs/projects/fintech/BRANCH_CORRELATION_2026-08-31.md` | historical branch/reuse evidence |
| prior SOTA roadmap assessment / historical branch material | advisory design evidence only; not a second planning surface |
| `docs/fintech/CAPITAL-AI-FINTECH/**` | supporting/non-authorizing technical detail/history |
| merged FINTECH PRs/commits | implementation/evidence history; current facts only where present on current main |
| work claims / handoffs | coordination/audit evidence only |

## 17. Priority queue

Priority is recalculated from current main using the trust-root order: security/data integrity -> governance/compliance -> CI/build reliability -> architecture/integration consistency -> deployment readiness -> observability/performance -> UX/documentation.

| Order | Horizon | Work item | Priority | Current status | Next exit gate |
|---|---|---|---|---|---|
| 1 | `NOW` | `FIN-SEC-03` | P1/HIGH | OPEN / REFERRED_NOT_EXECUTED | protected execution/capability binding evidence-ready; Security verification requested |
| 1 | `NOW / VERIFY` | `FIN-SEC-02` | P1/HIGH | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | independent Security return; no FINTECH self-close |
| 2 | `NOW` | mandatory recorrelation after Security or upstream contract movement | gate | OPEN WHEN TRIGGERED | then-current main/open PR/claims/ADR/ESS/DATA/Security state re-read |
| 3 | `NEXT` | `FIN-12` | P1 | PARTIAL | current-main `ValidatedDataInput` -> versioned financial feature mapping tested fail-closed |
| 3 | `NEXT` | `FIN-17` | P1 | PARTIAL | one backend FINTECH rank/order authority; visualization-ready FE consumer boundary |
| 4 | `LATER` | `FIN-19` | P2 | PARTIAL | current provider-neutral capability mapping complete |
| 5 | `LATER` | `FIN-20` | P2 | PARTIAL | exact input-to-rank lineage and return evidence complete |
| 6 | `LATER` | `FIN-DRIFT-01` | P3 | PLANNED | deterministic drift check implemented |

`FIN-12` and `FIN-17` intentionally share the same post-integrity P1 band; order is recomputed after current Security recorrelation rather than permanently hard-coded.

## 18. Ownership boundaries

- `CAPITAL-AI-DATA / PVC-09..11` owns provider ingress, UAI/data ingestion, evidence identity, provider-input validation, freshness and DQ.
- `CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability and operations/release lifecycle.
- `CAPITAL-AI-FE` owns presentation implementation only; it does not own score/rank/entitlement business authority.
- `CAPITAL-AI-SEC` owns findings/requirements and independent verification; FINTECH may report only target-local implementation/evidence readiness.
- Compliance/Quality may assess FINTECH outputs but do not acquire productive `PVC-12..17` ownership.
- Legal/regulatory applicability, including any EU DORA applicability question, remains with `CAPITAL-AI-COMP` / Human-Legal and is not inferred from the project name.

## 19. Security evidence return rule

FINTECH remediation evidence must identify the source finding and include applicable `main_sha`, `branch_head_sha`, `pr_head_sha`, `merge_sha`, changed files/scope, actually executed positive/negative tests, evidence paths, residual risks/dependencies and a request for independent Security verification.

Semantic separation is mandatory:

```text
IMPLEMENTED
!= EVIDENCE_READY
!= SECURITY VERIFIED
!= CLOSED
```

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
- active roadmap outcomes have explicit baseline/evidence semantics and no invented maturity percentage;
- visualization-ready outputs expose authoritative backend semantics without relocating FINTECH business authority to Frontend;
- no foreign work is marked DONE/VERIFIED/CLOSED by FINTECH;
- exact current `main`, open PRs, overlap and branch head are re-read before PR approval/creation;
- PR creation, hosted checks, merge and any production mutation follow then-current `/AGENTS.md` controls.

## 21. Outcome-based roadmap operating model

The roadmap navigation layer above the existing atomic FIN-* work packages is:

```text
STRATEGIC INTENT
-> OUTCOME
-> CAPABILITY
-> RISK / CONSTRAINT
-> CURRENT GAP
-> NOW / NEXT / LATER
-> EXIT GATE
-> EVIDENCE
-> MEASURED OUTCOME
```

This layer explains why a work item is prioritized and how its outcome is evidenced. It does not replace the repository navigation chain `PVC -> Roadmap -> ADR -> ESS -> code/tests/evidence`.

## 22. Capability maturity view — PVC-12..PVC-17

Capability maturity is distinct from task completion. No maturity percentage is inferred without an authoritative baseline.

| PVC | Capability | Current evidence-backed state | Target maturity condition | Horizon |
|---|---|---|---|---|
| `PVC-12` | Feature Engineering | `PARTIAL`; current-main validated DATA exit is composed, downstream financial mapping remains open | every productive feature builder consumes an explicit, versioned, fail-closed DATA compatibility boundary | `NEXT` |
| `PVC-13` | Scoring Models | `VERIFIED CORE / DRIFT WATCH` | exactly one productive Registry with explicit canonical/champion resolution; challengers remain non-productive until governed promotion | `MAINTAIN` |
| `PVC-14` | Scoring Orchestration | `VERIFIED CORE` | exactly one productive Dispatcher; ambiguity/unsupported scope fail closed | `MAINTAIN` |
| `PVC-15` | Domain Analysis / Executor | `VERIFIED/PARTIAL`; FIN-SEC-03 open | productive protected financial-analysis paths use authoritative server-side execution and entitlement decisions | `NOW` |
| `PVC-16` | Canonical Scoring | `VERIFIED/PARTIAL`; FIN-SEC-02 evidence ready, Security verification open | canonical scoring preserves result/lineage semantics and all protected verified-screening paths use the accepted entitlement boundary with independent Security return | `NOW / VERIFY` |
| `PVC-17` | Ranking / Decision Support | `PARTIAL` | exactly one productive backend FINTECH rank/order authority; frontend consumers do not recalculate business ranking semantics | `NEXT` |

`MAINTAIN` does not infer new feature work; it means preserve the verified core under regression/drift watch.

## 23. NOW / NEXT / LATER horizon

The horizon is a priority view, not a release-date promise. It is recomputed on the review triggers in section 29.

### NOW — protect Security and Data Integrity first

1. implement `FIN-SEC-03` from then-current main and request independent Security verification;
2. obtain/record the independent Security return for current-main `FIN-SEC-02` without self-closing it;
3. preserve the merged DATA #827 fail-closed exit as the upstream FIN-12 dependency baseline without taking DATA ownership;
4. re-correlate current main, open PRs, claims and applicable ADR/ESS after any material Security or DATA contract movement.

### NEXT — close canonical FINTECH value-chain gaps

1. `FIN-12` — current-main validated DATA -> versioned financial feature contract;
2. `FIN-17` — one productive backend Ranking / Decision Support authority with stable visualization-ready output;
3. recompute FIN-12 vs FIN-17 order from then-current evidence and dependency state.

### LATER — completeness and continuous fitness

1. `FIN-19` — provider capability mapping without DATA ownership takeover;
2. `FIN-20` — exact end-to-end score/rank lineage;
3. `FIN-DRIFT-01` — deterministic drift/roadmap-integrity checks;
4. only after core maturity, evaluate additional domain/model specialization as governed challengers rather than parallel productive architectures.

## 24. Measurable outcome model

Task completion alone is not roadmap outcome completion. Where no authoritative measurement exists, the baseline is `NOT_BASELINED`.

| Outcome measure | Current baseline | Target / exit semantics | Evidence source |
|---|---|---|---|
| productive feature builders behind validated DATA compatibility boundary | `NOT_BASELINED` | `100%` of inventoried productive feature builders when FIN-12 exits | feature-builder inventory + contract tests |
| productive scoring entry points using Registry -> Dispatcher -> Executor -> CanonicalScoreResult | architecture baseline established; complete entry-point coverage remains evidence-bound | `100%` of productive supported scoring entry points | route/registry/dispatcher tests + ADR-0087 evidence |
| protected productive FINTECH capabilities using server-authoritative entitlement decisions | `PARTIAL` | all protected productive paths in current scope have positive/negative server authorization evidence and required independent Security return | FIN-SEC evidence + Security assessment |
| productive ranking consumers using authoritative FINTECH rank/order output | `PARTIAL` | `100%` of productive ranking consumers after FIN-17 + FE consumer migration | backend ranking contract/tests + FE consumer evidence |
| exact score-to-rank lineage completeness | `PARTIAL` | reproducible complete lineage for productive score/rank output | FIN-20 evidence + OPS trace linkage |
| open independent Security verification debt | FIN-SEC-02 verification open; FIN-SEC-03 implementation open | no FINTECH roadmap `SECURITY VERIFIED/CLOSED` claim without Security return | CAPITAL-AI-SEC evidence |
| service reliability SLI/SLO | `NOT_BASELINED` for FINTECH roadmap scope | establish only for measured productive service boundaries; no invented SLO | authoritative runtime telemetry / OPS evidence |
| DORA software-delivery metrics | `NOT_BASELINED` for this project roadmap | observe current five metrics only when repository/deployment telemetry is authoritative | CI/deployment telemetry owned by appropriate delivery/OPS surfaces |

A target of `100%` is an exit semantic for a bounded inventoried productive scope, not a claim that a current percentage has already been measured.

## 25. Risk / Constraint lane

Every active `NOW` or `NEXT` initiative should expose the controlling risk/constraint without creating a numeric priority-scoring authority.

Recommended fields:

```yaml
risk_category:
  - security
  - data_integrity
  - compliance_applicability
  - architecture_consistency
  - reliability
  - delivery
  - product_outcome
authority_sources:
current_evidence:
missing_evidence:
dependency_owner:
exit_gate:
```

Within the same trust-root priority band, decisions may consider outcome value, risk reduction, dependency unblocking, evidence confidence, reversibility and implementation effort. No repository-wide numeric prioritization formula is created here.

## 26. Evidence Contract for active roadmap items

Every active initiative should be readable using at least the following fields, either inline in this Roadmap or in its existing supporting execution/evidence projection:

```yaml
id:
outcome:
capability:
pvc:
owner:
horizon:
current_state:
target_state:
risk_or_constraint:
authority_sources:
dependencies:
success_measure:
baseline:
exit_gate:
evidence_required:
independent_verification:
```

Evidence rules:

1. `NOT RUN` is never `PASS`.
2. `NOT_BASELINED` is never replaced with an invented percentage or score.
3. `EVIDENCE_READY` is never independent verification.
4. a merged task does not equal achieved outcome unless its target measure/exit gate is evidenced.
5. foreign-owner dependency state is never locally promoted to `DONE`.
6. legal/regulatory applicability is never inferred from framework relevance or the FINTECH project name.

## 27. Visualization- and API-ready FINTECH output contract

FINTECH must plan its productive backend outputs so that later Frontend evaluation tools can visualize authoritative information without copying business logic into the browser.

A stable score/rank/decision-support response should expose, where applicable and already authorized by the underlying contracts:

```text
asset identity / canonical symbol
asset class / instrument type
canonical score status and value
backend authoritative rank / order / eligibility
model id + model version / champion alias
feature contract version
result contract version
DQ / evidence / freshness state
confidence or degradation state where canonically defined
leading factors / components where the canonical result exposes them
risk / constraint state relevant to decision support
correlation / evidence / lineage identifiers
computedAt / source time semantics where applicable
```

Rules:

- the output contract is a FINTECH backend concern; presentation implementation is `CAPITAL-AI-FE` owned;
- Frontend may sort/filter/display only in ways that do not recompute or contradict authoritative business rank/order semantics;
- no UI demo-fill, synthetic score, client-local entitlement grant or second ranking formula;
- `RankingBoard` remains the productive presentation surface until Frontend changes it through its own owner-scoped roadmap/work item;
- Apache ECharts 6.1.x is an advisory visualization-library candidate for later `CAPITAL-AI-FE` evaluation because it provides rich chart types, data transforms, responsive rendering and accessibility support; this Roadmap does not add or authorize that dependency.

## 28. State-of-the-Art advisory reference baseline

External guidance improves design quality but does not override `/AGENTS.md`, PVC ownership, Accepted ADRs, Active ESS, code/tests/evidence or Human authority.

| Advisory reference / tool | Current verified reference state | FINTECH use | Authority / ownership treatment |
|---|---|---|---|
| BIAN Service Landscape | `14.0` (February 2026) | financial-services capability decomposition/language benchmark | advisory only; does not rename PVC/ADR/ESS identities |
| Outcome-based product roadmapping | current product-management pattern | connect initiatives to measurable outcomes rather than feature delivery alone | advisory planning pattern |
| Now / Next / Later | current product-roadmapping pattern | horizon view without false long-range date precision | advisory planning pattern |
| OWASP ASVS | `5.0.0` latest stable | web application verification reference where applicable | advisory; `CAPITAL-AI-SEC` remains Security authority |
| OWASP SAMM | current maturity-oriented secure-SDLC framework | Security maturity lens | advisory only; no automatic finding/gate |
| DORA software-delivery metrics | current five-metric model | delivery outcome observation where authoritative telemetry exists | decision-support only; not FINTECH merge authority |
| Google SRE SLI/SLO/Error Budget | current reliability practice | measurable reliability prioritization after a real baseline exists | advisory; OPS/runtime evidence required |
| SLSA | `1.2` current version | supply-chain benchmark | advisory; OPS/release authority remains external to FINTECH |
| ISO/IEC 42001:2023 | repository-recognized management benchmark | continual-improvement / AI-management lens | does not imply certification |
| EU DORA Regulation | applicable since 2025-01-17 in its legal scope | possible operational-resilience applicability question | `CAPITAL-AI-COMP` / Human-Legal applicability only; no automatic FINTECH requirement |
| OpenLineage | maintained open lineage standard | FIN-20 lineage interoperability ideas | advisory; may not replace existing evidence/EventMesh authorities |
| Feast | maintained open-source feature-store architecture | FIN-12 feature registry/service/materialization concepts | evaluate patterns/reuse only; no second productive FINTECH/DATA registry is authorized |
| MLflow Model Registry | maintained OSS model lifecycle/lineage/aliasing pattern | challenger/research lifecycle benchmark | must not replace or duplicate ADR-0087 `ScoringModelRegistry` |
| OpenTelemetry | maintained vendor-neutral observability specification | future cross-service trace/context interoperability reference | advisory; integration/operations ownership remains outside FINTECH where applicable |
| Apache ECharts | current `6.1.x` release line | later FE visualization of authoritative FINTECH outputs | `CAPITAL-AI-FE` evaluation only; no dependency added by this Roadmap |

NIST publications/frameworks are intentionally excluded from this current roadmap baseline because `/AGENTS.md` withdraws them unless a new explicit Human/Owner decision re-adopts a named source/version/scope.

No external tool listed above is installed, connected, enabled or promoted by this documentation-only roadmap change.

## 29. Roadmap review / recorrelation triggers

Re-read current `main`, open Pull Requests, claims/writers, this Roadmap and applicable ADR/ESS when any of the following changes materially:

- FIN-SEC-02 receives an independent Security return;
- FIN-SEC-03 implementation/evidence moves or a new FIN-SEC-03 writer appears;
- `ValidatedDataInput`, DATA exit semantics, provider-input validation, freshness, lineage or DQ contracts change materially;
- FIN-12 or FIN-17 reaches or materially approaches its exit gate;
- a new productive scoring/ranking/analysis capability is proposed;
- Accepted ADR/Active ESS changes model, entitlement, provider, evidence or result semantics;
- provider capability/licensing changes materially affect FIN-19;
- a relevant Compliance/Human-Legal applicability decision returns;
- exact score-to-rank lineage or OPS trace contracts change;
- Frontend requests a new visualization field that would require changing authoritative FINTECH business semantics;
- an external advisory benchmark version materially changes and re-evaluation would improve a current decision.

External benchmark changes alone never mutate this Roadmap automatically.
