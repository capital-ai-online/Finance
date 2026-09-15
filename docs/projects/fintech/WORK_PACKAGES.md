# CAPITAL-AI-FINTECH — Work Packages

**Correlation baseline:** `main@5ae0fdd80b085740f92a5530c5561a06f760c7a3`  
**Consolidated:** 2026-09-15  
**FIN-SEC-03 merge provenance:** `PR #929` · `103689c2f30536e573b7958f63b503ca428f69cf` · historical branch `agent/fintech-fin-sec-03-analysis-entitlement-20260915`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-12..PVC-17`

This file is a supporting work-package projection. Current prioritization and completion semantics are maintained in `ROADMAP.md`. Authority remains with `/AGENTS.md`, applicable Accepted ADRs and Active ESS.

| ID | PVC | Work package | Consolidated status | Exit gate |
|---|---|---|---|---|
| FIN-12 | PVC-12 | Validated DATA -> Financial Feature Contract | PARTIAL / P1 — DATA handoff ready; FINTECH mapping open; sequenced after FIN-17 | explicit tested `ValidatedDataInput` -> versioned feature-contract mapping; failed/missing/stale/non-computable evidence stays fail-closed |
| FIN-13 | PVC-13 | Scoring Models | VERIFIED CORE / DRIFT WATCH | one `ScoringModelRegistry`; unique canonical/champion productive scopes; challengers non-productive until governed promotion |
| FIN-14 | PVC-14 | Scoring Orchestration | VERIFIED CORE | one productive `ScoringDispatcher`; no alternate productive dispatcher/model-selection path |
| FIN-15 | PVC-15 | Domain Executors / Financial Analysis | VERIFIED/PARTIAL + FIN-SEC-03 IMPLEMENTED / EVIDENCE_READY | every productive scope maps to an explicit registered executor; protected Backtest/Monte Carlo/full-AI boundary is server-authoritative/fail-closed; independent Security verification remains open |
| FIN-16 | PVC-16 | Canonical Scoring | VERIFIED/PARTIAL | `CanonicalScoreResult` compatibility/lineage preserved and `FIN-SEC-02` verified-screening alternate paths use the canonical server entitlement boundary |
| FIN-17 | PVC-17 | Ranking / Decision Support | PARTIAL / P1 — NEXT / READY | fresh current-main/open-writer recorrelation complete; establish one productive FINTECH backend rank/order authority; productive FE surface consumes authoritative backend ordering only |
| FIN-18 | supporting | Asset Class Inventory | VERIFIED | repository-derived supported classes only |
| FIN-19 | supporting | Provider Capability Mapping | PARTIAL / P2 | financial feature/model requirements map to provider-neutral DATA contracts and current `provider-matrix/1.10.0` without ingress/DQ takeover |
| FIN-20 | supporting | End-to-End Scoring Evidence | PARTIAL / P2 | exact `ValidatedDataInput` -> feature -> model -> dispatcher -> executor -> canonical score -> rank lineage plus required Security/OPS evidence |
| FIN-SEC-02 | PVC-16 | Verified-screening authorization | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | shared path gate consumes accepted `verified_screening` quota; FINTECH evidence ready; independent Security verification requested; not self-closed |
| FIN-SEC-03 | PVC-15 | Financial-analysis authorization | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | Backtest and Monte Carlo have server ALLOW/DENY; full-AI is bound to a real structured provider executor and fails closed; Buffett authority preserved; independent Security verification requested |
| FIN-DRIFT-01 | supporting | Project / contract drift checks | PLANNED / P3 | deterministic low-cost checks detect stale PVC/baseline/provider/consumer/security-routing projections without creating new Authority |
| FIN-SYNC-01 | PVC-12..17 | 2026-09-01 Project Surface Current-Main Sync | COMPLETED / HISTORICAL EVIDENCE | retained as merged evidence; current planning correlation is the 2026-09-15 Roadmap baseline |

## Consolidated dependency state

### DATA -> FINTECH / FIN-12

`CAPITAL-AI-DATA` has implemented upstream `ValidatedDataInput/1.0.0` with identity, provenance, freshness and explicit non-computable/missing/stale states and has routed consumption to FINTECH/PVC-12. FINTECH still owns the explicit versioned mapping into registered financial feature contracts. This work remains P1, sequenced immediately after FIN-17 on the current evidence.

### Security -> FINTECH / FIN-SEC-02 and FIN-SEC-03

`FIN-SEC-02` and `FIN-SEC-03` implementation/test artifacts are `EVIDENCE_READY`; independent Security verification is requested for both. FIN-SEC-03 was Human-merged through PR #929 (`103689c2f30536e573b7958f63b503ca428f69cf`) and its target-local evidence is `docs/projects/fintech/evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md`. The historical separate FINTECH Security handoff overlay remains non-authorizing.

### FINTECH -> Frontend / FIN-17

Frontend remains a presentation consumer. `RankingBoard` is the productive UI surface but still performs local READY-score sorting/Top-Worst slicing. `FIN-17` remains the single next P1 slice and is now `READY`: PR #942 Human-merged `agent/fintech-fin-sec-03-post-merge-sync-20260915`, and the required fresh `main@5ae0fdd80b085740f92a5530c5561a06f760c7a3` / open-writer recorrelation found no open Pull Request writers. Backend FINTECH rank/order authority may now proceed before downstream FE presentation-only consumption is completed.

### FINTECH -> OPS / FIN-20

`CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability transport and the delivery/operations lifecycle. Transported evidence does not authorize scoring, ranking, entitlement, merge or production decisions.

## Priority order

1. Security return — `FIN-SEC-02` and `FIN-SEC-03` are FINTECH `EVIDENCE_READY`; independent Security verification remains open.
2. P1 / NEXT / READY — `FIN-17` backend ranking authority consolidation may begin from the current correlated baseline.
3. P1 / AFTER FIN-17 — `FIN-12` ValidatedDataInput → versioned feature-contract mapping.
4. P2 — `FIN-19`, then `FIN-20` unless current evidence changes the ordering.
5. P3 — `FIN-DRIFT-01`.

Detailed current planning semantics are maintained in `ROADMAP.md`; atomic execution projection is maintained in `TASK_REGISTER.md`.
