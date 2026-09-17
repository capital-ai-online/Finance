# CAPITAL-AI-FINTECH — Task Register

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-09..PVC-17`  
**Correlation baseline:** `main@2358642ff80f128e271e02ae88401008663578b7`  
**Re-correlated:** 2026-09-17  
**FIN-SEC-03 merge provenance:** `PR #929` · `103689c2f30536e573b7958f63b503ca428f69cf` · historical branch `agent/fintech-fin-sec-03-analysis-entitlement-20260915`  
**FIN-17 terminal provenance:** backend PR #946 · `c8a88afc7f9cfad367b592e9567654451f81e436`; FE consumer PR #951 · `3aa41faa2742dfc2601339b000e660f271380cf1`  
**Status:** `ACTIVE`

This register is a supporting execution projection. Current planning priority is maintained in `ROADMAP.md`; development execution authority remains exclusively with `/AGENTS.md@CURRENT_MAIN`. Work claims/handoffs are coordination/audit metadata only.

`CAPITAL-AI-DATA` is superseded as an independent Project Owner. Former DATA responsibilities for PVC-09..11 are now internal FINTECH responsibilities and MUST NOT be modeled as a foreign-project dependency.

## Active queue

| ID | Priority | PVC | Task | Status | Dependency / source | Exit gate |
|---|---|---|---|---|---|---|
| `FIN-SEC-02` | P1/HIGH | PVC-16 | Make every productive canonical verified-score/context/batch path consume the accepted `verified_screening` entitlement/quota boundary without creating a second scoring or entitlement authority | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | ADR-0034; current entitlement inventory; Roadmap; `server/middleware/verifiedScreeningEntitlement.ts` | independent CAPITAL-AI-SEC verification; FINTECH does not self-close |
| `FIN-SEC-03` | P1/HIGH | PVC-15 | Define one authoritative entitlement boundary for Backtest and Monte Carlo; bind `full_ai_analysis` to an explicit productive financial-domain execution contract; preserve Buffett server authority | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | ADR-0034; PR #929 / merge `103689c2f30536e573b7958f63b503ca428f69cf`; `server/middleware/paidAnalysisEntitlement.ts`; `docs/projects/fintech/evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md` | independent CAPITAL-AI-SEC verification; pre-PR/hosted execution evidence remains separate; FINTECH does not self-close |
| `FIN-12` | P1 / SELECTED | PVC-09..12 | Bind validated PVC-09..11 exits to explicit versioned productive financial feature contracts while preserving non-computable/missing/stale semantics | PARTIAL / PR #1037 RE-CORRELATION REQUIRED | `src/platform/MarketData/ValidatedDataInput.ts`; `src/platform/MarketData/FintechDataHandoff.ts`; FINTECH PVC-09..11; ADR-0087; ADR-0041 / ESS-0016; PR #1037 | PR #1037 re-correlated to post-supersession current main; productive crypto snapshot fields, traditional fundamentals, validated history consumers and signed sovereign-yield semantics remain fail-closed and tested |
| `FIN-19` | P2 | PVC-09..12 supporting | Keep asset/model requirements mapped to canonical provider/data-quality capability contracts and current `ProviderMatrix` without creating a parallel ingress plane | PARTIAL | `src/platform/MarketData/ProviderMatrix.ts`; ADR-0041 / ESS-0016 | financial requirements map to provider-neutral FINTECH PVC-09..11 capabilities/current matrix with no direct bypass |
| `FIN-20` | P2 | supporting | Complete validated data → feature → model → dispatcher → executor → canonical score → backend rank evidence lineage | PARTIAL / DEPENDS ON FIN-12 | FIN-12..17; OPS traceability; Security evidence return | exact current Git/runtime lineage and required return paths are evidenced |
| `FIN-DRIFT-01` | P3 | supporting | Add low-cost deterministic drift checks for project/PVC/baseline/provider/consumer/security-routing projections | PLANNED / NOT ACTIVE BY STATUS ALONE | current Roadmap and project surface | representative stale projections fail deterministically without creating new Authority/policy overlay |

## Completed / retained baseline

| ID / capability | Status | Current treatment |
|---|---|---|
| `FIN-17` Ranking / Decision Support | DONE_MAIN / TERMINAL | backend rank/order authority Human-merged via PR #946; FE backend-order consumption Human-merged via PR #951; keep drift watch only |
| `FIN-SYNC-01` | COMPLETED / historical evidence-ready | merged project-surface sync retained as evidence; current planning baseline is this 2026-09-17 correlation |
| `FIN-13` Scoring Models | VERIFIED CORE / DRIFT WATCH | one `ScoringModelRegistry`; canonical/champion resolution; challengers non-productive until promotion |
| `FIN-14` Scoring Orchestration | VERIFIED CORE | one productive `ScoringDispatcher`; no alternate productive dispatcher |
| `FIN-18` Asset Inventory | VERIFIED | repository-derived supported classes only |
| former DATA project boundary | SUPERSEDED / HISTORICAL | PVC-09..11 are internal FINTECH ownership; historical DATA files/claims remain evidence only |
| former FINTECH Security handoff overlay | HISTORICAL / NON-AUTHORIZING | current remediation routes through affected PVC + applicable ADR/ESS + implementation/tests/evidence |

## Current ordering

1. `FIN-SEC-02` and `FIN-SEC-03` implementation/test artifacts are `EVIDENCE_READY`; independent `CAPITAL-AI-SEC` verification remains open and FINTECH does not self-close either Security finding.
2. `FIN-17` is terminal on current main: PR #946 completed the FINTECH backend ranking authority and PR #951 completed FE backend-order consumption.
3. `FIN-12` remains selected P1, but its former DATA dependency is now an internal FINTECH PVC-09..11 dependency. PR #1037 contains the bounded validated-data contract implementation and must be re-correlated against the post-supersession main before merge.
4. PR #1046 is a separate FINTECH startup/provider/promo-retirement slice. It is not part of FIN-12 and must be re-correlated independently against post-supersession current main.
5. `FIN-19`, `FIN-20`, then `FIN-DRIFT-01` remain lower-priority follow-on work unless current evidence changes the ordering; historical status alone never activates them.

## Ownership boundaries

- `CAPITAL-AI-FINTECH / PVC-09..11` owns provider/data ingress, evidence identity, freshness and Data Quality organizational routing while reusing the existing canonical technical contracts and runtime.
- `CAPITAL-AI-FINTECH / PVC-12..17` owns feature engineering through ranking/decision support.
- `CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability and the repository delivery/operations lifecycle.
- `CAPITAL-AI-FE` is a presentation consumer and does not own financial scoring/ranking/entitlement business authority; the FIN-17 consumer cutover is terminal through PR #951.
- `CAPITAL-AI-SEC` owns Security findings and independent verification. FINTECH may report only target-local `IMPLEMENTED` / `EVIDENCE_READY` states for Security remediation.
- Historical `CAPITAL-AI-DATA` ownership text is provenance only and cannot create a current writer, task or dependency.
