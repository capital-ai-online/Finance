# CAPITAL-AI-FINTECH — Work Packages

**Correlation baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Consolidated:** 2026-09-16  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-12..PVC-17`

This file is a supporting work-package projection. Current prioritization and completion semantics are maintained in `ROADMAP.md`. Authority remains with `/AGENTS.md`, applicable Accepted ADRs and Active ESS.

| ID | PVC | Work package | Consolidated status | Exit gate |
|---|---|---|---|---|
| FIN-12 | PVC-12 | Validated DATA -> Financial Feature Contract | IMPLEMENTED_BRANCH / PRE_PR_EVIDENCE_READY | DATA-admitted numeric observations map one-to-one into the resolved existing feature-contract version; identity/provenance/freshness/correlation are retained; stale/missing/unknown/duplicate-source states fail closed |
| FIN-13 | PVC-13 | Scoring Models | VERIFIED CORE / DRIFT WATCH | one `ScoringModelRegistry`; unique canonical/champion productive scopes; challengers non-productive until governed promotion |
| FIN-14 | PVC-14 | Scoring Orchestration | VERIFIED CORE | one productive `ScoringDispatcher`; no alternate productive dispatcher/model-selection path |
| FIN-15 | PVC-15 | Domain Executors / Financial Analysis | VERIFIED/PARTIAL + FIN-SEC-03 IMPLEMENTED / EVIDENCE_READY | protected analysis paths retain server-authoritative entitlement; independent Security verification remains separate |
| FIN-16 | PVC-16 | Canonical Scoring | VERIFIED/PARTIAL + FIN-SEC-02 EVIDENCE_READY | canonical result/lineage preserved; independent Security verification remains separate |
| FIN-17 | PVC-17 | Ranking / Decision Support | DONE_MAIN — PR #946 / merge `c8a88afc7f9cfad367b592e9567654451f81e436` | preserve one productive backend `CrossAssetRanking` authority and presentation-only FE consumption |
| FIN-18 | supporting | Asset Class Inventory | VERIFIED | repository-derived supported classes only |
| FIN-19 | supporting | Provider Capability Mapping | PARTIAL / P2 | financial feature/model requirements map to provider-neutral DATA contracts/current provider matrix without ingress/DQ takeover |
| FIN-20 | supporting | End-to-End Scoring Evidence | IMPLEMENTED_BRANCH / FINTECH EVIDENCE_READY / OPS RETURN OPEN | exact DATA evidence/correlation survives feature -> canonical score -> backend rank and reaches an evidence-only OPS/PVC-18 strict-binding handoff; actual EventMesh/operational projection remains OPS-owned |
| FIN-SEC-02 | PVC-16 | Verified-screening authorization | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | independent Security verification; FINTECH does not self-close |
| FIN-SEC-03 | PVC-15 | Financial-analysis authorization | IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED | independent Security verification; FINTECH does not self-close |
| FIN-DRIFT-01 | supporting | Project / contract drift checks | PLANNED / P3 | deterministic low-cost checks detect stale PVC/baseline/provider/consumer/security-routing projections without creating new Authority |

## REQ-COMP-034 owner-return package

The current work package combines FIN-12 and FIN-20 because both share one bounded owner-correct exit chain and remain entirely inside FINTECH until the final OPS handoff:

`ValidatedDataInput/1.0.0 -> FintechDataHandoff -> validated-financial-feature-mapping/1.0.0 -> existing ScoringModelRegistry/Dispatcher/Executor -> CanonicalScoreResult -> FIN-17 CrossAssetRanking -> fintech-scoring-trace-lineage/1.0.0 -> OPS/PVC-18 evidence-only strict-binding handoff`.

The stale historical `agent/fintech-fin12-validated-feature-contract-20260916` branch is not consumed as current evidence. This package is rematerialized from the stated current-main baseline.

## Ownership boundaries

- DATA/PVC-09..11 remains authoritative for provider ingress, evidence identity, freshness, provenance and Data Quality.
- FINTECH/PVC-12..17 owns feature/scoring/ranking semantics and the target-local lineage validation implemented here.
- OPS/PVC-18 owns EventMesh publication and operational trace projection; FINTECH hands over evidence/correlation without creating an OPS PASS.
- Compliance owns REQ-COMP-034 reassessment after current-main integration plus owner-correct OPS return.

## Priority order

1. Current active package: FIN-12 + FIN-20 REQ-COMP-034 owner return.
2. Independent Security returns for FIN-SEC-02/03 remain foreign-owner gates and are not reopened locally.
3. FIN-19 follows after the current package reaches its integration/owner-return boundary unless then-current evidence changes the order.
4. FIN-DRIFT-01 remains P3.
