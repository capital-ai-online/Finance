# CAPITAL-AI-FINTECH — Work Packages

**Correlation baseline:** `main@c9980602f691b855fd6f8c66a49822e7a9611b4a`  
**Consolidated:** 2026-09-20  
**FIN-SEC-03 merge provenance:** `PR #929` · `103689c2f30536e573b7958f63b503ca428f69cf` · historical branch `agent/fintech-fin-sec-03-analysis-entitlement-20260915`  
**FIN-17 terminal provenance:** backend PR #946 · `c8a88afc7f9cfad367b592e9567654451f81e436`; FE consumer PR #951 · `3aa41faa2742dfc2601339b000e660f271380cf1`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-09..PVC-17`

This file is a supporting work-package projection. Current prioritization and completion semantics are maintained in `ROADMAP.md`. Authority remains with `/AGENTS.md`, applicable Accepted ADRs and Active ESS.

| ID | PVC | Work package | Consolidated status | Exit gate |
|---|---|---|---|---|
| FIN-12 | PVC-09..12 | Validated data -> Financial Feature Contract | DONE_MAIN / BOUNDED CONTRACT SLICE | Human-merged PR #1037 materialized the required validated field/history semantics; missing/stale/conflicting evidence remains fail-closed and no parallel provider/DQ plane is created |
| FIN-13 | PVC-13 | Scoring Models | VERIFIED CORE / DRIFT WATCH | one `ScoringModelRegistry`; unique canonical/champion productive scopes; challengers non-productive until governed promotion |
| FIN-14 | PVC-14 | Scoring Orchestration | VERIFIED CORE | one productive `ScoringDispatcher`; no alternate productive dispatcher/model-selection path |
| FIN-15 | PVC-15 | Domain Executors / Financial Analysis | VERIFIED/PARTIAL + FIN-SEC-03 IMPLEMENTED / EVIDENCE_READY | every productive scope maps to an explicit registered executor; protected Backtest/Monte Carlo/full-AI boundary is server-authoritative/fail-closed; independent Security verification remains open |
| FIN-16 | PVC-16 | Canonical Scoring | VERIFIED/PARTIAL | `CanonicalScoreResult` compatibility/lineage preserved and `FIN-SEC-02` verified-screening alternate paths use the canonical server entitlement boundary |
| FIN-17 | PVC-17 | Ranking / Decision Support | DONE_MAIN / TERMINAL | PR #946 establishes productive FINTECH backend rank/order authority; PR #951 makes productive FE consume authoritative backend ordering; retain drift watch only |
| FIN-18 | supporting | Asset Class Inventory | VERIFIED | repository-derived supported classes only |
| FIN-19 | supporting | Provider Capability Mapping | PARTIAL / P2 — RE-EVALUATION REQUIRED | expanded financial research requirements map to provider-neutral FINTECH PVC-09..11 contracts and current ProviderMatrix without ingress/DQ takeover |
| FIN-20 | supporting | End-to-End Scoring Evidence | PARTIAL / P2 — REVALIDATION READY | exact validated data -> feature -> model -> dispatcher -> executor -> canonical score -> rank lineage plus required Security/OPS evidence |
| FIN-21 | supporting | Multi-Asset Orchestrator Universe | IMPLEMENTED_BRANCH / P2 / VALIDATION_PENDING | read-only six-class orchestration projection plus 20 Equity research lenses; missing workflow modules stay explicit and research lenses remain non-model |
| FIN-SEC-02 | PVC-16 | Verified-screening authorization | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | shared path gate consumes accepted `verified_screening` quota; FINTECH evidence ready; independent Security verification requested; not self-closed |
| FIN-SEC-03 | PVC-15 | Financial-analysis authorization | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | Backtest and Monte Carlo have server ALLOW/DENY; full-AI is bound to a real structured provider executor and fails closed; Buffett authority preserved; independent Security verification requested |
| FIN-DRIFT-01 | supporting | Project / contract drift checks | PLANNED / P3 | deterministic low-cost checks detect stale PVC/baseline/provider/consumer/security-routing projections without creating new Authority |
| FIN-SYNC-01 | PVC-12..17 | 2026-09-01 Project Surface Current-Main Sync | COMPLETED / HISTORICAL EVIDENCE | retained as merged evidence; current planning correlation is the 2026-09-16 Roadmap baseline |

## Consolidated dependency state

### FINTECH validated-data boundary / FIN-12

`CAPITAL-AI-DATA` is superseded as an independent Project Owner. Human-merged PR #1037 materialized the bounded FINTECH `PVC-09..11 -> PVC-12` validated-data exit with field-level identity/provenance/freshness/DQ semantics for the previously open crypto fields, traditional fundamentals, validated history and signed sovereign-yield handling.

FINTECH does not create a second provider schema, normalization layer, provenance authority or DQ plane. Historical pre-merge evidence remains provenance only; current work consumes the merged fail-closed contracts.

### Security -> FINTECH / FIN-SEC-02 and FIN-SEC-03

`FIN-SEC-02` and `FIN-SEC-03` implementation/test artifacts are `EVIDENCE_READY`; independent Security verification is requested for both. FIN-SEC-03 was Human-merged through PR #929 (`103689c2f30536e573b7958f63b503ca428f69cf`) and its target-local evidence is `docs/projects/fintech/evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md`. The historical separate FINTECH Security handoff overlay remains non-authorizing.

### FINTECH -> Frontend / FIN-17

FIN-17 is terminal for the bounded ranking-authority split. PR #946 Human-merged the FINTECH backend rank/order authority and PR #951 Human-merged the FE `RankingBoard` consumer cutover to authoritative backend ordering. Frontend remains presentation-only and no longer blocks FIN-12 on this current-main correlation.

### FINTECH -> OPS / FIN-20

`CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability transport and the delivery/operations lifecycle. Transported evidence does not authorize scoring, ranking, entitlement, merge or production decisions. FIN-20 may now be revalidated because the bounded FIN-12 prerequisite is merged; exact OPS/runtime trace evidence remains a separate exit gate.

## Priority order

1. Security return — `FIN-SEC-02` and `FIN-SEC-03` are FINTECH `EVIDENCE_READY`; independent Security verification remains open.
2. P2 / OWNER-DIRECTED — `FIN-21`; materialize and validate the read-only multi-asset orchestration/universe projection without introducing a new authority.
3. P2 — re-evaluate `FIN-19` provider/capability coverage for the expanded research universe.
4. P2 — revalidate `FIN-20` exact current-main data → feature → score → rank → trace lineage.
5. P3 — `FIN-DRIFT-01` remains non-active until freshly authorized.

Detailed current planning semantics are maintained in `ROADMAP.md`; atomic execution projection is maintained in `TASK_REGISTER.md`.