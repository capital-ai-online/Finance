# CAPITAL-AI-FINTECH — Work Packages

**Correlation baseline:** `main@56f196fc034c5514463546ee975ffb83fd50f44a`  
**Consolidated:** 2026-09-06  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-12..PVC-17`

This file is a supporting work-package projection. Current prioritization and completion semantics are maintained in `ROADMAP.md`. Authority remains with `/AGENTS.md`, applicable Accepted ADRs and Active ESS.

| ID | PVC | Work package | Consolidated status | Exit gate |
|---|---|---|---|---|
| FIN-12 | PVC-12 | Validated DATA -> Financial Feature Contract | PARTIAL / P1 — upstream `ValidatedDataInput/1.0.0` exists; FINTECH mapping open | explicit tested `ValidatedDataInput` -> versioned feature-contract mapping; failed/missing/stale/non-computable evidence stays fail-closed |
| FIN-13 | PVC-13 | Scoring Models | VERIFIED CORE / DRIFT WATCH | one `ScoringModelRegistry`; unique canonical/champion productive scopes; challengers non-productive until governed promotion |
| FIN-14 | PVC-14 | Scoring Orchestration | VERIFIED CORE | one productive `ScoringDispatcher`; no alternate productive dispatcher/model-selection path |
| FIN-15 | PVC-15 | Domain Executors / Financial Analysis | VERIFIED/PARTIAL | every productive scope maps to an explicit registered executor and `FIN-SEC-03` protected-execution boundary is remediated |
| FIN-16 | PVC-16 | Canonical Scoring | VERIFIED/PARTIAL | `CanonicalScoreResult` compatibility/lineage preserved and `FIN-SEC-02` verified-screening alternate paths use the canonical server entitlement boundary |
| FIN-17 | PVC-17 | Ranking / Decision Support | PARTIAL / P1 | one productive FINTECH backend rank/order authority; FE consumes authoritative ordering only |
| FIN-18 | supporting | Asset Class Inventory | VERIFIED | repository-derived supported classes only |
| FIN-19 | supporting | Provider Capability Mapping | PARTIAL / P2 | financial feature/model requirements map to provider-neutral DATA contracts and current `provider-matrix/1.10.0` without ingress/DQ takeover |
| FIN-20 | supporting | End-to-End Scoring Evidence | PARTIAL / P2 | exact `ValidatedDataInput` -> feature -> model -> dispatcher -> executor -> canonical score -> rank lineage plus required Security/OPS evidence |
| FIN-SEC-02 | PVC-16 | Verified-screening authorization | OPEN / REFERRED_NOT_EXECUTED / P1 HIGH | canonical verified-score/context/batch paths consume accepted `verified_screening` entitlement/quota boundary; FINTECH evidence ready; independent Security verification requested |
| FIN-SEC-03 | PVC-15 | Financial-analysis authorization | OPEN / REFERRED_NOT_EXECUTED / P1 HIGH | Backtest/Monte Carlo/full-AI protected execution is server-authoritative/fail-closed; Buffett authority preserved; FINTECH evidence ready; independent Security verification requested |
| FIN-DRIFT-01 | supporting | Project / contract drift checks | PLANNED / P3 | deterministic low-cost checks detect stale PVC/baseline/provider/consumer/security-routing projections without creating new Authority |
| FIN-SYNC-01 | PVC-12..17 | 2026-09-01 Project Surface Current-Main Sync | COMPLETED / HISTORICAL EVIDENCE | retained as merged evidence; current planning correlation is the 2026-09-06 Roadmap baseline |

## Consolidated dependency state

### DATA -> FINTECH / FIN-12

`CAPITAL-AI-DATA` has implemented upstream `ValidatedDataInput/1.0.0` with identity, provenance, freshness and explicit non-computable/missing/stale states. FINTECH still owns the explicit versioned mapping into registered financial feature contracts.

### Security -> FINTECH / FIN-SEC-02 and FIN-SEC-03

Both entitlement children remain concrete FINTECH implementation gaps. The historical separate FINTECH Security handoff overlay is non-authorizing; current work is selected through affected PVC, `ROADMAP.md`, ADR-0034 and implementation/tests/evidence. Security remains the independent verification owner.

### FINTECH -> Frontend / FIN-17 and FIN-SEC-03 consumer integration

Frontend remains a presentation consumer. `RankingBoard` is the productive UI surface, but stable business rank/order semantics must originate from FINTECH. Any downstream presentation migration is executed by `CAPITAL-AI-FE`.

### FINTECH -> OPS / FIN-20

`CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability transport and the delivery/operations lifecycle. Transported evidence does not authorize scoring, ranking, entitlement, merge or production decisions.

## Priority order

1. P1/HIGH — `FIN-SEC-02` and `FIN-SEC-03`.
2. Mandatory recorrelation of then-current `main`, open PRs, Security state, affected Roadmap and applicable ADR/ESS after either Security child completes.
3. P1 — `FIN-12` and `FIN-17` share the next priority band; choose order only after recorrelation.
4. P2 — `FIN-19`, then `FIN-20` unless current evidence changes the ordering.
5. P3 — `FIN-DRIFT-01`.

Detailed current planning semantics are maintained in `ROADMAP.md`; atomic execution projection is maintained in `TASK_REGISTER.md`.
