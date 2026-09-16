# CAPITAL-AI-FINTECH — Task Register

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-12..PVC-17`  
**Correlation baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Consolidated:** 2026-09-16  
**FIN-17 merge provenance:** `PR #946` · `c8a88afc7f9cfad367b592e9567654451f81e436`  
**Status:** `ACTIVE`

This register is a supporting execution projection. Current planning priority is maintained in `ROADMAP.md`; Authority remains with `/AGENTS.md`, applicable Accepted ADRs, Active ESS and their delegated contracts. Work claims/handoffs are coordination/audit metadata only.

## Active queue

| ID | Priority | PVC | Task | Status | Dependency / source | Exit gate |
|---|---|---|---|---|---|---|
| `FIN-12` | P1 / ACTIVE OWNER RETURN | PVC-12 | Bind DATA `ValidatedDataInput/1.0.0` to explicit versioned financial feature contracts while preserving identity/provenance/freshness and non-computable/missing/stale semantics | IMPLEMENTED_BRANCH / PRE_PR_EVIDENCE_READY | current `src/platform/MarketData/FintechDataHandoff.ts`; `validated-financial-feature-mapping/1.0.0`; ADR-0087 | admitted observations map one-to-one into the resolved model feature-contract version; stale/missing/unknown/incomplete/duplicated source evidence fails closed |
| `FIN-20` | P1 / ACTIVE REQ-COMP-034 RETURN | supporting | Preserve exact DATA → feature → canonical score → backend rank evidence lineage and hand it to OPS/PVC-18 without taking EventMesh/Traceability authority | IMPLEMENTED_BRANCH / FINTECH EVIDENCE_READY / OPS RETURN OPEN | FIN-12; FIN-13..17; `fintech-scoring-trace-lineage/1.0.0`; OPS strict evidence binding | exact DATA evidence IDs/correlation survive feature, canonical score and rank validation; OPS receives evidence-only strict-binding inputs and performs actual EventMesh/operational projection |
| `FIN-SEC-02` | P1/HIGH | PVC-16 | Make every productive canonical verified-score/context/batch path consume the accepted `verified_screening` entitlement/quota boundary without creating a second scoring or entitlement authority | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | ADR-0034; current entitlement inventory; Roadmap; `server/middleware/verifiedScreeningEntitlement.ts` | independent CAPITAL-AI-SEC verification; FINTECH does not self-close |
| `FIN-SEC-03` | P1/HIGH | PVC-15 | Define one authoritative entitlement boundary for Backtest and Monte Carlo; bind `full_ai_analysis` to an explicit productive financial-domain execution contract; preserve Buffett server authority | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | ADR-0034; PR #929 / merge `103689c2f30536e573b7958f63b503ca428f69cf`; `server/middleware/paidAnalysisEntitlement.ts`; `docs/projects/fintech/evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md` | independent CAPITAL-AI-SEC verification; FINTECH does not self-close |
| `FIN-19` | P2 | supporting | Keep asset/model requirements mapped to canonical DATA capability contracts and current `ProviderMatrix` without provider-ingress takeover | PARTIAL | `src/platform/MarketData/ProviderMatrix.ts` `provider-matrix/1.10.0`; ADR-0041 / ESS-0016 | financial requirements map to provider-neutral DATA capabilities/current matrix with no direct DATA bypass normalized |
| `FIN-DRIFT-01` | P3 | supporting | Add low-cost deterministic drift checks for project/PVC/baseline/provider/consumer/security-routing projections | PLANNED | current Roadmap and project surface | representative stale projections fail deterministically without creating new Authority/policy overlay |

## Completed / retained baseline

| ID / capability | Status | Current treatment |
|---|---|---|
| `FIN-17` Ranking / Decision Support | DONE_MAIN via PR #946 | one productive backend `CrossAssetRanking` authority; preserve presentation-only FE boundary |
| `FIN-SYNC-01` | COMPLETED / historical evidence-ready | merged project-surface sync retained as historical evidence only |
| `FIN-13` Scoring Models | VERIFIED CORE / DRIFT WATCH | one `ScoringModelRegistry`; canonical/champion resolution; challengers non-productive until promotion |
| `FIN-14` Scoring Orchestration | VERIFIED CORE | one productive `ScoringDispatcher`; no alternate productive dispatcher |
| `FIN-18` Asset Inventory | VERIFIED | repository-derived supported classes only |
| former FINTECH Security handoff overlay | HISTORICAL / NON-AUTHORIZING | current remediation routes through affected PVC + Roadmap + applicable ADR/ESS + implementation/tests/evidence |

## Current ordering

1. `FIN-12 + FIN-20` is one coherent REQ-COMP-034 owner-return package because both share the same DATA identity/provenance → feature → score → rank exit gate and stop at the same OPS/PVC-18 ownership boundary.
2. The historical `agent/fintech-fin12-validated-feature-contract-20260916` branch is not consumed as current evidence; this package is rematerialized from `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`.
3. `FIN-SEC-02` and `FIN-SEC-03` remain target-local `EVIDENCE_READY`; independent Security verification remains separate foreign-owner work.
4. `FIN-19`, then `FIN-DRIFT-01`, are the next ordinary FINTECH follow-ons unless then-current evidence changes ordering.

## Ownership boundaries

- `CAPITAL-AI-DATA / PVC-09..11` owns provider ingress, evidence identity, freshness and Data Quality. DATA has implemented `ValidatedDataInput/1.0.0`; FINTECH owns downstream feature/scoring/ranking semantics.
- `CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability and the repository delivery/operations lifecycle. FINTECH may supply exact evidence/correlation inputs but does not create an OPS PASS or transport event on its own.
- `CAPITAL-AI-FE` is a presentation consumer and does not own financial scoring/ranking/entitlement business authority.
- `CAPITAL-AI-SEC` owns Security findings and independent verification. FINTECH may report only target-local `IMPLEMENTED` / `EVIDENCE_READY` states for Security remediation.
- Foreign productive implementation remains outside FINTECH ownership until executed by its canonical Primary Owner.
