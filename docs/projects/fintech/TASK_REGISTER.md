# CAPITAL-AI-FINTECH — Task Register

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-12..PVC-17`  
**Correlation baseline:** `main@8618326db4d4a5af0fbecd65b83805ea7608109f`  
**Consolidated:** 2026-09-06  
**FIN-SEC-02 implementation branch:** `agent/fintech-fin-sec-02-verified-screening-20260907`  
**Status:** `ACTIVE`

This register is a supporting execution projection. Current planning priority is maintained in `ROADMAP.md`; Authority remains with `/AGENTS.md`, applicable Accepted ADRs, Active ESS and their delegated contracts. Work claims/handoffs are coordination/audit metadata only.

## Active queue

| ID | Priority | PVC | Task | Status | Dependency / source | Exit gate |
|---|---|---|---|---|---|---|
| `FIN-SEC-02` | P1/HIGH | PVC-16 | Make every productive canonical verified-score/context/batch path consume the accepted `verified_screening` entitlement/quota boundary without creating a second scoring or entitlement authority | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | ADR-0034; current entitlement inventory; Roadmap; `server/middleware/verifiedScreeningEntitlement.ts` | independent CAPITAL-AI-SEC verification; FINTECH does not self-close |
| `FIN-SEC-03` | P1/HIGH | PVC-15 | Define one authoritative entitlement boundary for Backtest and Monte Carlo; bind `full_ai_analysis` to an explicit productive financial-domain execution contract; preserve Buffett server authority | OPEN / REFERRED_NOT_EXECUTED | ADR-0034; current entitlement inventory; Roadmap | protected execution has verified-principal/server-entitlement ALLOW/DENY evidence; Security verification requested |
| `FIN-12` | P1 | PVC-12 | Bind DATA `ValidatedDataInput/1.0.0` to explicit versioned financial feature contracts while preserving non-computable/missing/stale semantics | PARTIAL — UPSTREAM CONTRACT IMPLEMENTED | `src/platform/MarketData/ValidatedDataInput.ts`; DATA PVC-09..11; ADR-0087 | every productive feature builder has a tested fail-closed ValidatedDataInput compatibility boundary |
| `FIN-17` | P1 | PVC-17 | Consolidate one productive backend ranking authority and expose stable rank/order output for presentation consumers | PARTIAL | existing ranking contracts/services; productive `RankingBoard`; ADR-0087 | one productive FINTECH ranking authority; FE can consume backend ordering only |
| `FIN-19` | P2 | supporting | Keep asset/model requirements mapped to canonical DATA capability contracts and current `ProviderMatrix` without provider-ingress takeover | PARTIAL | `src/platform/MarketData/ProviderMatrix.ts` `provider-matrix/1.10.0`; ADR-0041 / ESS-0016 | financial requirements map to provider-neutral DATA capabilities/current matrix with no direct DATA bypass normalized |
| `FIN-20` | P2 | supporting | Complete `ValidatedDataInput` → feature → model → dispatcher → executor → canonical score → backend rank evidence lineage | PARTIAL | FIN-12..17; OPS traceability; Security evidence return | exact current Git/runtime lineage and required return paths are evidenced |
| `FIN-DRIFT-01` | P3 | supporting | Add low-cost deterministic drift checks for project/PVC/baseline/provider/consumer/security-routing projections | PLANNED | current Roadmap and project surface | representative stale projections fail deterministically without creating new Authority/policy overlay |

## Completed / retained baseline

| ID / capability | Status | Current treatment |
|---|---|---|
| `FIN-SYNC-01` | COMPLETED / historical evidence-ready | merged project-surface sync retained as 2026-09-01 evidence; current planning baseline is superseded by the 2026-09-06 Roadmap correlation |
| `FIN-13` Scoring Models | VERIFIED CORE / DRIFT WATCH | one `ScoringModelRegistry`; canonical/champion resolution; challengers non-productive until promotion |
| `FIN-14` Scoring Orchestration | VERIFIED CORE | one productive `ScoringDispatcher`; no alternate productive dispatcher |
| `FIN-18` Asset Inventory | VERIFIED | repository-derived supported classes only |
| former FINTECH Security handoff overlay | HISTORICAL / NON-AUTHORIZING | current remediation routes through affected PVC + Roadmap + applicable ADR/ESS + implementation/tests/evidence |

## Current ordering

1. `FIN-SEC-02` implementation/tests are `EVIDENCE_READY` on this branch. Independent `CAPITAL-AI-SEC` verification remains open; FINTECH must recorrelate after that return.
2. `FIN-SEC-03` remains the highest-priority unimplemented FINTECH child.
3. After either Security child completes merge + recorrelation, re-read then-current `main`, open PRs, Security state, affected Roadmap and applicable ADR/ESS before promoting another work item.
4. `FIN-12` and `FIN-17` share the next P1 band; their order is recomputed after that mandatory recorrelation rather than assumed here.
5. `FIN-19`, `FIN-20`, then `FIN-DRIFT-01` remain lower-priority follow-on work unless current evidence changes the ordering.

## Ownership boundaries

- `CAPITAL-AI-DATA / PVC-09..11` owns provider ingress, evidence identity, freshness and Data Quality. DATA has implemented `ValidatedDataInput/1.0.0`; FINTECH owns downstream feature/scoring/ranking semantics.
- `CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability and the repository delivery/operations lifecycle.
- `CAPITAL-AI-FE` is a presentation consumer and does not own financial scoring/ranking/entitlement business authority.
- `CAPITAL-AI-SEC` owns Security findings and independent verification. FINTECH may report only target-local `IMPLEMENTED` / `EVIDENCE_READY` states for Security remediation.
- Foreign productive implementation remains outside FINTECH ownership until executed by its canonical Primary Owner.
