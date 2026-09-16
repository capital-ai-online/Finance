# CAPITAL-AI-FINTECH — Work Packages

**Correlation baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Consolidated:** 2026-09-16  
**FIN-SEC-03 merge provenance:** `PR #929` · `103689c2f30536e573b7958f63b503ca428f69cf` · historical branch `agent/fintech-fin-sec-03-analysis-entitlement-20260915`  
**FIN-17 terminal provenance:** backend PR #946 · `c8a88afc7f9cfad367b592e9567654451f81e436`; FE consumer PR #951 · `3aa41faa2742dfc2601339b000e660f271380cf1`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-12..PVC-17`

This file is a supporting work-package projection. Current prioritization and completion semantics are maintained in `ROADMAP.md`. Authority remains with `/AGENTS.md`, applicable Accepted ADRs and Active ESS.

| ID | PVC | Work package | Consolidated status | Exit gate |
|---|---|---|---|---|
| FIN-12 | PVC-12 | Validated DATA -> Financial Feature Contract | PARTIAL / P1 — SELECTED / DATA CONTRACT RETURN REQUIRED | DATA returns complete validated field/history semantics required by productive champion inputs; FINTECH then binds every productive feature builder with tested fail-closed compatibility and no parallel provider/DQ plane |
| FIN-13 | PVC-13 | Scoring Models | VERIFIED CORE / DRIFT WATCH | one `ScoringModelRegistry`; unique canonical/champion productive scopes; challengers non-productive until governed promotion |
| FIN-14 | PVC-14 | Scoring Orchestration | VERIFIED CORE | one productive `ScoringDispatcher`; no alternate productive dispatcher/model-selection path |
| FIN-15 | PVC-15 | Domain Executors / Financial Analysis | VERIFIED/PARTIAL + FIN-SEC-03 IMPLEMENTED / EVIDENCE_READY | every productive scope maps to an explicit registered executor; protected Backtest/Monte Carlo/full-AI boundary is server-authoritative/fail-closed; independent Security verification remains open |
| FIN-16 | PVC-16 | Canonical Scoring | VERIFIED/PARTIAL | `CanonicalScoreResult` compatibility/lineage preserved and `FIN-SEC-02` verified-screening alternate paths use the canonical server entitlement boundary |
| FIN-17 | PVC-17 | Ranking / Decision Support | DONE_MAIN / TERMINAL | PR #946 establishes productive FINTECH backend rank/order authority; PR #951 makes productive FE consume authoritative backend ordering; retain drift watch only |
| FIN-18 | supporting | Asset Class Inventory | VERIFIED | repository-derived supported classes only |
| FIN-19 | supporting | Provider Capability Mapping | PARTIAL / P2 | financial feature/model requirements map to provider-neutral DATA contracts and current ProviderMatrix without ingress/DQ takeover |
| FIN-20 | supporting | End-to-End Scoring Evidence | PARTIAL / P2 — DEPENDS ON FIN-12 | exact validated DATA -> feature -> model -> dispatcher -> executor -> canonical score -> rank lineage plus required Security/OPS evidence |
| FIN-SEC-02 | PVC-16 | Verified-screening authorization | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | shared path gate consumes accepted `verified_screening` quota; FINTECH evidence ready; independent Security verification requested; not self-closed |
| FIN-SEC-03 | PVC-15 | Financial-analysis authorization | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | Backtest and Monte Carlo have server ALLOW/DENY; full-AI is bound to a real structured provider executor and fails closed; Buffett authority preserved; independent Security verification requested |
| FIN-DRIFT-01 | supporting | Project / contract drift checks | PLANNED / P3 | deterministic low-cost checks detect stale PVC/baseline/provider/consumer/security-routing projections without creating new Authority |
| FIN-SYNC-01 | PVC-12..17 | 2026-09-01 Project Surface Current-Main Sync | COMPLETED / HISTORICAL EVIDENCE | retained as merged evidence; current planning correlation is the 2026-09-16 Roadmap baseline |

## Consolidated dependency state

### DATA -> FINTECH / FIN-12

`CAPITAL-AI-DATA` has implemented the current validated DATA exit with identity, provenance, freshness/DQ and explicit non-computable/missing/stale states and has routed PVC-12 consumption to FINTECH. Current-main FIN-12 correlation shows that this is necessary but insufficient for the complete feature-contract exit gate.

Productive champion feature inputs additionally require DATA-owned validated semantics for crypto market-cap/volume/supply dimensions, traditional fundamentals and history/value types that distinguish positive price-series validation from legitimate signed sovereign-yield observations. Productive crypto/traditional history consumers also require a canonical DATA validated-history bridge or equivalent accepted contract.

FINTECH does not create a second provider schema, normalization layer, provenance authority or DQ plane. Exact evidence and the required return are recorded in `evidence/FIN_12_VALIDATED_FEATURE_BOUNDARY_RECORRELATION_2026-09-16.md`.

### Security -> FINTECH / FIN-SEC-02 and FIN-SEC-03

`FIN-SEC-02` and `FIN-SEC-03` implementation/test artifacts are `EVIDENCE_READY`; independent Security verification is requested for both. FIN-SEC-03 was Human-merged through PR #929 (`103689c2f30536e573b7958f63b503ca428f69cf`) and its target-local evidence is `docs/projects/fintech/evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md`. The historical separate FINTECH Security handoff overlay remains non-authorizing.

### FINTECH -> Frontend / FIN-17

FIN-17 is terminal for the bounded ranking-authority split. PR #946 Human-merged the FINTECH backend rank/order authority and PR #951 Human-merged the FE `RankingBoard` consumer cutover to authoritative backend ordering. Frontend remains presentation-only and no longer blocks FIN-12 on this current-main correlation.

### FINTECH -> OPS / FIN-20

`CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability transport and the delivery/operations lifecycle. Transported evidence does not authorize scoring, ranking, entitlement, merge or production decisions. FIN-20 remains downstream of the complete FIN-12 feature-contract binding.

## Priority order

1. Security return — `FIN-SEC-02` and `FIN-SEC-03` are FINTECH `EVIDENCE_READY`; independent Security verification remains open.
2. P1 / SELECTED — `FIN-12`; current FINTECH implementation is held at the DATA/PVC-09..11 ownership boundary until the required validated field/history semantics land on main.
3. After the DATA return — complete FIN-12 champion feature bindings and focused compatibility tests, then continue FIN-20 lineage.
4. P2 — `FIN-19`, then `FIN-20` unless current evidence changes the ordering.
5. P3 — `FIN-DRIFT-01`.

Detailed current planning semantics are maintained in `ROADMAP.md`; atomic execution projection is maintained in `TASK_REGISTER.md`.