# CAPITAL-AI-FINTECH — Project Roadmap

**Status:** `ACTIVE — PVC-12..17 PRIMARY OWNER`  
**Version:** `2.2-current-main-sync`  
**Baseline:** `main@6ace37bffa7912ec4f224feb69dd62ff9c629192`  
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

## 2. Ownership and current state

| PVC | FINTECH capability | Current reusable implementation | Status |
|---|---|---|---|
| `PVC-12` | Feature Engineering | versioned feature contracts referenced by registered models | PARTIAL |
| `PVC-13` | Scoring Models | `ScoringModelRegistry` | VERIFIED core / drift watch |
| `PVC-14` | Scoring Orchestration | `ScoringDispatcher` + bounded orchestration | VERIFIED core |
| `PVC-15` | Domain Analysis / Executor | registered executor adapters / analysis surfaces | VERIFIED/PARTIAL + S1-R2-06 child work |
| `PVC-16` | Canonical Scoring | `CanonicalScoreResult` family / verified-score surfaces | VERIFIED core + S1-R2-06 child work |
| `PVC-17` | Ranking / Decision Support | ranking service + cross-asset ranking contracts | PARTIAL / consolidation required |

## 3. Invariants

1. one productive `ScoringModelRegistry`;
2. one productive `ScoringDispatcher`;
3. one `CanonicalScoreResult` contract family;
4. one productive FINTECH ranking authority;
5. no synthetic score and no neutral missing-evidence fallback;
6. no provider-specific bypass around DATA/Evidence/DQ;
7. no frontend-local scoring, ranking or entitlement business authority;
8. research/challenger scoring remains non-productive until separately promoted;
9. Security findings remain Security-owned for verification; FINTECH owns implementation/evidence only for affected `PVC-12..17` code;
10. browser/local subscription projection is presentation state only and never a protected-capability grant;
11. foreign PVC implementation is never absorbed into this project.

## 4. Asset-class baseline

Repository-derived scoreable classes remain:

- crypto;
- stock;
- forex;
- commodity;
- index;
- bond, bounded to supported sovereign benchmark-yield instruments.

No ETF, Fund or REIT scoring class is invented by this roadmap.

## 5. Ranking boundary — FIN-17

Existing backend ranking assets are reused. The browser `RankingBoard` still derives Top/Worst ordering from READY scores. FINTECH records this as a consumer-boundary gap; the productive FE implementation change remains foreign work.

FINTECH must first expose a stable backend rank/order result boundary using existing ranking contracts/services. Cross-asset ranking impact remains disabled until compatibility and evidence gates are satisfied.

## 6. Validated DATA boundary — FIN-12

`PVC-09..11` remain `CAPITAL-AI-DATA`. FINTECH consumes validated asset identity, evidence, freshness and DQ and must make that dependency explicit in the financial feature contract.

Missing or failed DQ/evidence remains non-computable. FINTECH must not infer a neutral feature or make direct provider ingress productive merely because a provider capability exists.

## 7. Security child remediation after OPS PR #694

Merged OPS PR #694 completed `OPS-02-SEC-06` for Security finding `S1-R2-06 — Entitlement authority`. Two FINTECH P1/HIGH child items are now active as routed work, but remain `REFERRED_NOT_EXECUTED` in this project-surface sync.

### FIN-SEC-02 — PVC-16 verified-screening authorization

Every productive canonical verified-score/context/batch path must consume the accepted `verified_screening` server entitlement/quota boundary. The implementation must reuse existing scoring and entitlement authorities rather than introduce parallel authorization or scoring architecture.

Exit evidence includes plan/quota-positive cases plus browser-tier escalation, forged identity, missing/invalid identity where applicable, stale-entitlement and direct alternate-route DENY cases. Final Security verification remains with `CAPITAL-AI-SEC`.

### FIN-SEC-03 — PVC-15 financial-analysis authorization

FINTECH must define one authoritative protected-execution boundary for Backtest and Monte Carlo, bind `full_ai_analysis` to an explicit productive financial-domain contract, and preserve the existing Buffett server authority. Required browser/presentation integration must be routed to `CAPITAL-AI-FE` after the authoritative FINTECH contract is defined.

Exit evidence includes verified-principal/server-entitlement ALLOW/DENY behavior, Free/Starter DENY, forged/missing-bearer DENY, stale-entitlement DENY, automatic/direct alternate-path DENY and exact `full_ai_analysis` capability binding.

## 8. Provider capability mapping — FIN-19

The canonical source is `src/platform/MarketData/ProviderMatrix.ts`, currently `provider-matrix/1.10.0`. FINTECH owns only the mapping from financial feature/model requirements to required provider capabilities.

`CAPITAL-AI-DATA / PVC-09..11` retains provider ingress, evidence identity, freshness and DQ. Static provider enablement is not runtime-health or entitlement evidence. Direct provider paths discovered in productive FINTECH execution require owner/gateway assessment before remediation.

## 9. Upstream / downstream

### DATA

`PVC-09..11` remain CAPITAL-AI-DATA. FINTECH consumes accepted DATA output and does not own provider ingestion or DQ authority.

### OPS

`PVC-18` remains CAPITAL-AI-OPS. EventMesh/Traceability transports evidence but does not authorize scoring, ranking, entitlement, merge or production decisions.

### Cross-cutting consumers/validators

Frontend, Quality, Security and Compliance do not acquire `PVC-12..17` ownership through presentation, validation, verification or assessment responsibilities. Canonical project-folder routing is resolved from `docs/projects/README.md`.

## 10. Workstream status

| Workstream | PVC | Status | Next exit gate |
|---|---|---|---|
| FIN-SYNC-01 Project Surface Sync | PVC-12..17 | EVIDENCE_READY | final FINTECH-only compare recorded; current-main/open-PR recorrelation required again before PR approval |
| FIN-SEC-02 Verified Screening Entitlement | PVC-16 | REFERRED_NOT_EXECUTED / P1 HIGH | implementation/evidence ready and Security verification requested |
| FIN-SEC-03 Financial Analysis Entitlement | PVC-15 | REFERRED_NOT_EXECUTED / P1 HIGH | implementation/evidence ready; required FE handoff issued; Security verification requested |
| FIN-12 Feature Engineering | PVC-12 | PARTIAL / P1 | explicit DATA input/feature contract mapping |
| FIN-13 Scoring Models | PVC-13 | VERIFIED/PARTIAL | registry/version drift closed without duplicate model authority |
| FIN-14 Scoring Orchestration | PVC-14 | VERIFIED | no dispatcher bypass |
| FIN-15 Domain Executors | PVC-15 | VERIFIED/PARTIAL | every productive scope explicitly mapped; entitlement child remediated |
| FIN-16 Canonical Scoring | PVC-16 | VERIFIED/PARTIAL | compatibility/lineage preserved; verified-screening alternate paths authorized consistently |
| FIN-17 Ranking / Decision Support | PVC-17 | PARTIAL / P1 | one productive backend authority + FE consumer migration |
| FIN-18 Asset Inventory | supporting | VERIFIED | repository-derived support only |
| FIN-19 Provider Capability Mapping | supporting | PARTIAL / P2 | DATA-owned ingress contract mapped to current provider matrix |
| FIN-20 Scoring Evidence | supporting | PARTIAL / P2 | exact lineage/evidence + Security/OPS return paths |

Atomic status and ordering are maintained in `TASK_REGISTER.md`.

## 11. Security evidence rule

FINTECH may report `IMPLEMENTED` or `EVIDENCE_READY` for a FINTECH-owned remediation. It may not self-report Security `VERIFIED` or `CLOSED`.

Required return marker for actual Security remediation:

`[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`

The return carries source finding, project/stage, implementation status, changed files, exact candidate/runtime SHA where applicable, positive/negative Security tests, evidence paths, residual risk, unresolved dependencies and `verification_requested`.

## 12. Definition of Done

- `PVC-12..17` uniquely map to CAPITAL-AI-FINTECH;
- existing `VC-*` technical semantics remain unambiguous;
- every productive scoring path is Registry -> Dispatcher -> Executor -> CanonicalScoreResult;
- DATA/DQ remains upstream and fail-closed;
- protected financial capabilities use verified-principal/server-authoritative entitlement decisions;
- ranking has one productive FINTECH authority;
- frontend consumes authoritative results/contracts only;
- EventMesh handoff to OPS is explicit;
- Security handoff/return contract is explicit and Security verification remains independent;
- project/provider/handoff documentation reflects then-current main;
- no foreign work is marked DONE/VERIFIED/CLOSED by FINTECH;
- exact current main and open PRs are re-read before any PR-creation approval request.
