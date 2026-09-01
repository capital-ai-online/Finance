# CAPITAL-AI-FINTECH — Task Register

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-12..PVC-17`  
**Correlation baseline:** `main@6ace37bffa7912ec4f224feb69dd62ff9c629192`  
**Status:** `ACTIVE`

This register is an execution projection only. Authority remains with `/AGENTS.md`, accepted ADR/ESS/CTRL/AUTH artifacts and their canonical registries.

## Active queue

| ID | Priority | PVC | Task | Status | Dependency / source | Exit gate |
|---|---|---|---|---|---|---|
| `FIN-SYNC-01` | P1 | PVC-12..17 | Re-correlate the FINTECH project surface against current `main`; correct project-folder routing, provider projection and Security handoff state | EVIDENCE_READY | `/AGENTS.md`; `docs/projects/README.md`; PR #694 | PASS — project docs consistently reflect the same source-main baseline and current routing; final branch compare is FINTECH-only |
| `FIN-SEC-02` | P1/HIGH | PVC-16 | Make every productive canonical verified-score/context/batch path consume the accepted `verified_screening` entitlement/quota boundary without creating a second scoring or entitlement authority | REFERRED_NOT_EXECUTED | `OPS-02-SEC-06`; `S1-R2-06`; ADR-0034 | FINTECH implementation/evidence ready; independent CAPITAL-AI-SEC verification requested |
| `FIN-SEC-03` | P1/HIGH | PVC-15 | Define one authoritative entitlement boundary for Backtest and Monte Carlo; bind `full_ai_analysis` to an explicit productive financial-domain execution contract; preserve Buffett server authority | REFERRED_NOT_EXECUTED | `OPS-02-SEC-06`; `S1-R2-06`; ADR-0034 | protected execution has verified-principal/server-entitlement ALLOW/DENY evidence; Security verification requested |
| `FIN-17` | P1 | PVC-17 | Consolidate one productive backend ranking authority and expose stable rank/order output for presentation consumers | PARTIAL | existing Ranking contracts/service; FE consumer handoff | one productive FINTECH ranking authority; FE consumes backend ordering only |
| `FIN-12` | P1 | PVC-12 | Bind validated DATA/evidence/DQ output to an explicit versioned financial feature contract | PARTIAL | CAPITAL-AI-DATA PVC-09..11 | failed/missing DQ/evidence remains non-computable and cannot enter scoring |
| `FIN-19` | P2 | supporting | Keep asset/model requirements mapped to canonical DATA capability contracts and current `ProviderMatrix` without provider-ingress takeover | PARTIAL | `src/platform/MarketData/ProviderMatrix.ts` | project projection matches current provider matrix and no direct DATA bypass is normalized |
| `FIN-20` | P2 | supporting | Complete input → feature → model → dispatcher → executor → canonical score → rank evidence lineage | PARTIAL | FIN-12..17; OPS traceability; Security return contract | exact candidate/runtime lineage and required return paths are evidenced |
| `FIN-DRIFT-01` | P3 | supporting | Add low-cost automated drift checks for project/PVC/consumer/security-handoff projections | PLANNED | current project surface | deterministic drift check detects stale routing/baseline references without creating Authority |

## Current ordering after FIN-SYNC-01

1. `FIN-SEC-02` and `FIN-SEC-03` are the highest-priority newly actionable FINTECH work from merged OPS PR #694. They require separate FINTECH implementation work items and remain `REFERRED_NOT_EXECUTED` here.
2. After either Security child is completed, re-read then-current `main`, open PRs, Security state and ownership before selecting the next task; `FIN-17` or `FIN-12` is not automatically promoted without that recorrelation.
3. `FIN-SYNC-01` remains discoverable as `EVIDENCE_READY`; its evidence is `evidence/PROJECT_SURFACE_CORRELATION_2026-09-01.md`.

## Ownership boundaries

- `CAPITAL-AI-DATA / PVC-09..11` owns provider ingress, evidence identity, freshness and Data Quality.
- `CAPITAL-AI-OPS / PVC-18` owns EventMesh/Traceability and the repository delivery/operations lifecycle.
- `CAPITAL-AI-FE` is a presentation consumer and does not own financial scoring/ranking/entitlement business authority.
- `CAPITAL-AI-SEC` owns Security findings and independent verification. FINTECH may report only target-local `IMPLEMENTED` / `EVIDENCE_READY` states for Security remediation.
- Foreign productive implementation remains `REFERRED_NOT_EXECUTED` until routed and executed by its canonical owner.
