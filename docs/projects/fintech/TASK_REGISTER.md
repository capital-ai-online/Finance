# CAPITAL-AI-FINTECH — Task Register

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-12..PVC-17`  
**Correlation baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Consolidated:** 2026-09-16  
**FIN-SEC-03 merge provenance:** `PR #929` · `103689c2f30536e573b7958f63b503ca428f69cf` · historical branch `agent/fintech-fin-sec-03-analysis-entitlement-20260915`  
**FIN-17 terminal provenance:** backend PR #946 · `c8a88afc7f9cfad367b592e9567654451f81e436`; FE consumer PR #951 · `3aa41faa2742dfc2601339b000e660f271380cf1`  
**Status:** `ACTIVE`

This register is a supporting execution projection. Current planning priority is maintained in `ROADMAP.md`; Authority remains with `/AGENTS.md`, applicable Accepted ADRs, Active ESS and their delegated contracts. Work claims/handoffs are coordination/audit metadata only.

## Active queue

| ID | Priority | PVC | Task | Status | Dependency / source | Exit gate |
|---|---|---|---|---|---|---|
| `FIN-SEC-02` | P1/HIGH | PVC-16 | Make every productive canonical verified-score/context/batch path consume the accepted `verified_screening` entitlement/quota boundary without creating a second scoring or entitlement authority | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | ADR-0034; current entitlement inventory; Roadmap; `server/middleware/verifiedScreeningEntitlement.ts` | independent CAPITAL-AI-SEC verification; FINTECH does not self-close |
| `FIN-SEC-03` | P1/HIGH | PVC-15 | Define one authoritative entitlement boundary for Backtest and Monte Carlo; bind `full_ai_analysis` to an explicit productive financial-domain execution contract; preserve Buffett server authority | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | ADR-0034; PR #929 / merge `103689c2f30536e573b7958f63b503ca428f69cf`; `server/middleware/paidAnalysisEntitlement.ts`; `docs/projects/fintech/evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md` | independent CAPITAL-AI-SEC verification; pre-PR/hosted execution evidence remains separate; FINTECH does not self-close |
| `FIN-12` | P1 / SELECTED | PVC-12 | Bind DATA validated exits to explicit versioned productive financial feature contracts while preserving non-computable/missing/stale semantics | PARTIAL / DATA CONTRACT RETURN REQUIRED | `src/platform/MarketData/ValidatedDataInput.ts`; `src/platform/MarketData/FintechDataHandoff.ts`; DATA PVC-09..11; ADR-0087; ADR-0041 / ESS-0016; `evidence/FIN_12_VALIDATED_FEATURE_BOUNDARY_RECORRELATION_2026-09-16.md` | complete DATA return for productive crypto snapshot fields, traditional fundamentals, validated history consumers and signed sovereign-yield semantics; then every productive champion feature builder has a tested fail-closed validated-input compatibility boundary |
| `FIN-19` | P2 | supporting | Keep asset/model requirements mapped to canonical DATA capability contracts and current `ProviderMatrix` without provider-ingress takeover | PARTIAL | `src/platform/MarketData/ProviderMatrix.ts`; ADR-0041 / ESS-0016 | financial requirements map to provider-neutral DATA capabilities/current matrix with no direct DATA bypass normalized |
| `FIN-20` | P2 | supporting | Complete validated DATA → feature → model → dispatcher → executor → canonical score → backend rank evidence lineage | PARTIAL / DEPENDS ON FIN-12 | FIN-12..17; OPS traceability; Security evidence return | exact current Git/runtime lineage and required return paths are evidenced |
| `FIN-DRIFT-01` | P3 | supporting | Add low-cost deterministic drift checks for project/PVC/baseline/provider/consumer/security-routing projections | PLANNED | current Roadmap and project surface | representative stale projections fail deterministically without creating new Authority/policy overlay |

## Completed / retained baseline

| ID / capability | Status | Current treatment |
|---|---|---|
| `FIN-17` Ranking / Decision Support | DONE_MAIN / TERMINAL | backend rank/order authority Human-merged via PR #946; FE backend-order consumption Human-merged via PR #951; keep drift watch only |
| `FIN-SYNC-01` | COMPLETED / historical evidence-ready | merged project-surface sync retained as 2026-09-01 evidence; current planning baseline is this 2026-09-16 correlation |
| `FIN-13` Scoring Models | VERIFIED CORE / DRIFT WATCH | one `ScoringModelRegistry`; canonical/champion resolution; challengers non-productive until promotion |
| `FIN-14` Scoring Orchestration | VERIFIED CORE | one productive `ScoringDispatcher`; no alternate productive dispatcher |
| `FIN-18` Asset Inventory | VERIFIED | repository-derived supported classes only |
| former FINTECH Security handoff overlay | HISTORICAL / NON-AUTHORIZING | current remediation routes through affected PVC + Roadmap + applicable ADR/ESS + implementation/tests/evidence |

## Current ordering

1. `FIN-SEC-02` and `FIN-SEC-03` implementation/test artifacts are `EVIDENCE_READY`; independent `CAPITAL-AI-SEC` verification remains open and FINTECH does not self-close either Security finding.
2. `FIN-17` is terminal on current main: PR #946 completed the FINTECH backend ranking authority and PR #951 completed FE backend-order consumption.
3. `FIN-12` is the selected P1 work item, but the full exit is dependency-held at the DATA ownership boundary. The current DATA exit does not yet expose all productive crypto snapshot fields or traditional fundamentals and its price-oriented history validation cannot represent legitimate signed sovereign-yield observations. FINTECH does not fork provider normalization/DQ to bypass this.
4. After the DATA return lands on then-current `main`, FINTECH resumes the champion feature-contract bindings and focused compatibility tests; `FIN-20` follows the resulting lineage.
5. `FIN-19`, `FIN-20`, then `FIN-DRIFT-01` remain lower-priority follow-on work unless current evidence changes the ordering.

## Ownership boundaries

- `CAPITAL-AI-DATA / PVC-09..11` owns provider ingress, evidence identity, freshness and Data Quality. DATA has implemented the existing validated exit; the additional field/history semantics required to close FIN-12 remain DATA-owned.
- `CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability and the repository delivery/operations lifecycle.
- `CAPITAL-AI-FE` is a presentation consumer and does not own financial scoring/ranking/entitlement business authority; the FIN-17 consumer cutover is terminal through PR #951.
- `CAPITAL-AI-SEC` owns Security findings and independent verification. FINTECH may report only target-local `IMPLEMENTED` / `EVIDENCE_READY` states for Security remediation.
- Foreign productive implementation remains outside FINTECH ownership until executed by its canonical Primary Owner.