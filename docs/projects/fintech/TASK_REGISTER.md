# CAPITAL-AI-FINTECH — Task Register

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-12..PVC-17`  
**Correlation baseline:** `main@8f11a360ce598100396562ad0eced04ca13b7372`  
**Consolidated:** 2026-09-15  
**FIN-SEC-03 implementation branch:** `agent/fintech-fin-sec-03-analysis-entitlement-20260915`  
**Status:** `ACTIVE`

This register is a supporting execution projection. Current planning priority is maintained in `ROADMAP.md`; Authority remains with `/AGENTS.md`, applicable Accepted ADRs, Active ESS and their delegated contracts. Work claims/handoffs are coordination/audit metadata only.

## Active queue

| ID | Priority | PVC | Task | Status | Dependency / source | Exit gate |
|---|---|---|---|---|---|---|
| `FIN-SEC-02` | P1/HIGH | PVC-16 | Make every productive canonical verified-score/context/batch path consume the accepted `verified_screening` entitlement/quota boundary without creating a second scoring or entitlement authority | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | ADR-0034; current entitlement inventory; Roadmap; `server/middleware/verifiedScreeningEntitlement.ts` | independent CAPITAL-AI-SEC verification; FINTECH does not self-close |
| `FIN-SEC-03` | P1/HIGH | PVC-15 | Define one authoritative entitlement boundary for Backtest and Monte Carlo; bind `full_ai_analysis` to an explicit productive financial-domain execution contract; preserve Buffett server authority | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | ADR-0034; `server/middleware/paidAnalysisEntitlement.ts`; `docs/projects/fintech/evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md` | independent CAPITAL-AI-SEC verification; pre-PR/hosted execution evidence remains separate; FINTECH does not self-close |
| `FIN-17` | P1 / NEXT | PVC-17 | Consolidate one productive backend ranking authority and expose stable rank/order output for presentation consumers | PARTIAL / NEXT FINTECH SLICE | existing `CrossAssetRanking`; productive `RankingBoard` still performs browser-local Top/Worst sorting; ADR-0087 | one productive FINTECH backend ranking authority; FE consumes backend ordering only |
| `FIN-12` | P1 / AFTER FIN-17 | PVC-12 | Bind DATA `ValidatedDataInput/1.0.0` to explicit versioned financial feature contracts while preserving non-computable/missing/stale semantics | PARTIAL — DATA HANDOFF READY / FINTECH MAPPING OPEN | `src/platform/MarketData/ValidatedDataInput.ts`; DATA PVC-09..11 handoff; ADR-0087 | every productive feature builder has a tested fail-closed ValidatedDataInput compatibility boundary |
| `FIN-19` | P2 | supporting | Keep asset/model requirements mapped to canonical DATA capability contracts and current `ProviderMatrix` without provider-ingress takeover | PARTIAL | `src/platform/MarketData/ProviderMatrix.ts` `provider-matrix/1.10.0`; ADR-0041 / ESS-0016 | financial requirements map to provider-neutral DATA capabilities/current matrix with no direct DATA bypass normalized |
| `FIN-20` | P2 | supporting | Complete `ValidatedDataInput` → feature → model → dispatcher → executor → canonical score → backend rank evidence lineage | PARTIAL | FIN-12..17; OPS traceability; Security evidence return | exact current Git/runtime lineage and required return paths are evidenced |
| `FIN-DRIFT-01` | P3 | supporting | Add low-cost deterministic drift checks for project/PVC/baseline/provider/consumer/security-routing projections | PLANNED | current Roadmap and project surface | representative stale projections fail deterministically without creating new Authority/policy overlay |

## Completed / retained baseline

| ID / capability | Status | Current treatment |
|---|---|---|
| `FIN-SYNC-01` | COMPLETED / historical evidence-ready | merged project-surface sync retained as 2026-09-01 evidence; current planning baseline is superseded by the 2026-09-15 Roadmap correlation |
| `FIN-13` Scoring Models | VERIFIED CORE / DRIFT WATCH | one `ScoringModelRegistry`; canonical/champion resolution; challengers non-productive until promotion |
| `FIN-14` Scoring Orchestration | VERIFIED CORE | one productive `ScoringDispatcher`; no alternate productive dispatcher |
| `FIN-18` Asset Inventory | VERIFIED | repository-derived supported classes only |
| former FINTECH Security handoff overlay | HISTORICAL / NON-AUTHORIZING | current remediation routes through affected PVC + Roadmap + applicable ADR/ESS + implementation/tests/evidence |

## Current ordering

1. `FIN-SEC-02` and `FIN-SEC-03` implementation/test artifacts are `EVIDENCE_READY`; independent `CAPITAL-AI-SEC` verification remains open and FINTECH does not self-close either Security finding.
2. `FIN-17` is the single next P1 FINTECH implementation slice: current `RankingBoard` still owns browser-local score ordering while backend `CrossAssetRanking` exists, so the active ranking-authority split is the narrower immediate correction.
3. `FIN-12` remains P1 immediately after FIN-17. DATA has already provided the upstream `ValidatedDataInput` handoff; FINTECH feature-contract mapping remains open.
4. `FIN-19`, `FIN-20`, then `FIN-DRIFT-01` remain lower-priority follow-on work unless current evidence changes the ordering.

## Ownership boundaries

- `CAPITAL-AI-DATA / PVC-09..11` owns provider ingress, evidence identity, freshness and Data Quality. DATA has implemented `ValidatedDataInput/1.0.0`; FINTECH owns downstream feature/scoring/ranking semantics.
- `CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability and the repository delivery/operations lifecycle.
- `CAPITAL-AI-FE` is a presentation consumer and does not own financial scoring/ranking/entitlement business authority.
- `CAPITAL-AI-SEC` owns Security findings and independent verification. FINTECH may report only target-local `IMPLEMENTED` / `EVIDENCE_READY` states for Security remediation.
- Foreign productive implementation remains outside FINTECH ownership until executed by its canonical Primary Owner.
