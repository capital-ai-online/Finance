# CAPITAL-AI-FINTECH — Project Roadmap

**Status:** `ACTIVE — PVC-12..17 PRIMARY OWNER`  
**Version:** `2.1-security-sync`  
**Baseline:** `main@1f55340d89178fb5c1ab735242f42c263918b692`  
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

## 2. Ownership

| PVC | FINTECH capability | Current reusable implementation | Status |
|---|---|---|---|
| `PVC-12` | Feature Engineering | versioned feature contracts referenced by registered models | PARTIAL |
| `PVC-13` | Scoring Models | `ScoringModelRegistry` | VERIFIED core |
| `PVC-14` | Scoring Orchestration | `ScoringDispatcher` + bounded orchestration | VERIFIED core |
| `PVC-15` | Domain Analysis / Executor | registered executor adapters | VERIFIED/PARTIAL by asset scope |
| `PVC-16` | Canonical Scoring | `CanonicalScoreResult` family | VERIFIED core |
| `PVC-17` | Ranking / Decision Support | ranking service + cross-asset ranking contracts | PARTIAL / consolidation required |

## 3. Invariants

1. one productive `ScoringModelRegistry`;
2. one productive `ScoringDispatcher`;
3. one CanonicalScoreResult contract family;
4. one productive FINTECH ranking authority;
5. no synthetic score and no neutral missing-evidence fallback;
6. no provider-specific bypass around DATA/Evidence/DQ;
7. no frontend-local scoring or ranking business authority;
8. research/challenger scoring remains non-productive until separately promoted;
9. Security findings remain Security-owned for verification; implementation remains with the affected Primary Owner;
10. foreign PVC implementation is never absorbed into this project.

## 4. Asset-class baseline

Repository-derived scoreable classes remain:

- crypto;
- stock;
- forex;
- commodity;
- index;
- bond, bounded to supported sovereign benchmark-yield instruments.

No ETF, Fund or REIT scoring class is invented by this roadmap.

## 5. Ranking boundary

Existing backend ranking assets are reused. The current browser `RankingBoard` still orders READY scores to derive Top/Worst display lists. FINTECH records this as a consumer-boundary gap; the FE implementation change is foreign work and remains a separate handoff.

FINTECH must first define a stable backend rank/order result boundary using the existing ranking contracts/services. Cross-asset ranking impact remains disabled until compatibility and evidence gates are satisfied.

## 6. Upstream / downstream

### DATA

`PVC-09..11` remain CAPITAL-AI-DATA. FINTECH consumes validated data/evidence/DQ and does not own provider ingestion or DQ authority.

### OPS

`PVC-18` remains CAPITAL-AI-OPS. EventMesh/Traceability transports evidence but does not authorize scoring, ranking, merge or production decisions.

### Cross-cutting consumers/validators

Frontend, Quality, Security and Compliance do not acquire `PVC-12..17` ownership through presentation, validation or assessment responsibilities.

## 7. Security handoff from PR #631

Source artifacts:

- `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`;
- `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`;
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`.

FINTECH adopts the Security boundary for all owned stages:

| PVC | Security requirement focus |
|---|---|
| `PVC-12` | feature/input integrity and provenance |
| `PVC-13` | model/registry integrity and least privilege |
| `PVC-14` | dispatcher/tool integrity; no bypass |
| `PVC-15` | provider/tool/domain-execution boundary |
| `PVC-16` | result integrity and lineage |
| `PVC-17` | protected decision-input integrity |

Current Security routing contains no direct active FINTECH remediation item. S1-R2-06 is a conditional dependency only: if the OPS entitlement inventory identifies a FINTECH-owned protected capability, the resulting child handoff is implemented on a FINTECH branch and returned to CAPITAL-AI-SEC for independent verification.

## 8. Workstream status

| Workstream | PVC | Status | Next exit gate |
|---|---|---|---|
| FIN-12 Feature Engineering | PVC-12 | PARTIAL | explicit DATA input/feature contract mapping |
| FIN-13 Scoring Models | PVC-13 | VERIFIED/PARTIAL | registry/version drift closed without duplicate model authority |
| FIN-14 Scoring Orchestration | PVC-14 | VERIFIED | no dispatcher bypass |
| FIN-15 Domain Executors | PVC-15 | VERIFIED/PARTIAL | every productive scope explicitly mapped |
| FIN-16 Canonical Scoring | PVC-16 | VERIFIED | versioned compatibility preserved |
| FIN-17 Ranking / Decision Support | PVC-17 | PARTIAL / P1 | one productive backend authority + FE consumer migration |
| FIN-18 Asset Inventory | supporting | VERIFIED | repository-derived support only |
| FIN-19 Provider Capability Mapping | supporting | PARTIAL | DATA-owned ingress contract mapped |
| FIN-20 Scoring Evidence | supporting | PARTIAL | exact lineage/evidence + Security/OPS return paths |

## 9. Security evidence rule

FINTECH may report `IMPLEMENTED` or `EVIDENCE_READY` for a FINTECH-owned remediation. It may not self-report Security `VERIFIED` or `CLOSED`.

Required return marker for actual Security remediation:

`[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`

The return must carry source finding, project/stage, implementation status, changed files, exact candidate/runtime SHA where applicable, positive/negative Security tests, evidence paths, residual risk, unresolved dependencies and `verification_requested`.

## 10. Definition of Done

- `PVC-12..17` uniquely map to CAPITAL-AI-FINTECH;
- existing `VC-*` technical semantics remain unambiguous;
- every productive scoring path is Registry -> Dispatcher -> Executor -> CanonicalScoreResult;
- DATA/DQ remains upstream and fail-closed;
- ranking has one productive FINTECH authority;
- frontend consumes results only;
- EventMesh handoff to OPS is explicit;
- Security handoff/return contract is explicit;
- no foreign work is marked DONE/VERIFIED/CLOSED by FINTECH;
- exact current main and open PRs are re-read before any PR-creation approval request.