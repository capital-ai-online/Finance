# CAPITAL-AI-FINTECH — Work Packages

**Baseline:** `main@6ace37bffa7912ec4f224feb69dd62ff9c629192`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC ownership:** `PVC-12..PVC-17`

| ID | PVC | Work package | Status | Exit gate |
|---|---|---|---|---|
| FIN-12 | PVC-12 | Feature Engineering | PARTIAL | explicit validated DATA input -> versioned feature contract; failed evidence/DQ stays non-computable |
| FIN-13 | PVC-13 | Scoring Models | VERIFIED/PARTIAL | one registry, unique productive scopes, challengers non-productive until promotion |
| FIN-14 | PVC-14 | Scoring Orchestration | VERIFIED | one productive dispatcher; no alternate score path |
| FIN-15 | PVC-15 | Domain Executors | VERIFIED/PARTIAL | every productive asset scope maps to explicit registered executor |
| FIN-16 | PVC-16 | Canonical Scoring | VERIFIED | CanonicalScoreResult compatibility and exact lineage preserved |
| FIN-17 | PVC-17 | Ranking / Decision Support | PARTIAL / P1 | one productive FINTECH ranking authority; FE consumes backend order only |
| FIN-18 | supporting | Asset Class Inventory | VERIFIED | repository-derived classes only |
| FIN-19 | supporting | Provider Capability Mapping | PARTIAL | requirements mapped to current ProviderMatrix/DATA contracts without provider-ingress/DQ authority takeover |
| FIN-20 | supporting | Scoring Evidence | PARTIAL | input -> feature -> model -> dispatcher -> executor -> score -> rank lineage plus handoff evidence |
| FIN-SEC-01 | PVC-12..17 | Security Handoff Baseline | ACTIVE | stage Security requirements retained; FINTECH never self-verifies Security |
| FIN-SEC-02 | PVC-16 | S1-R2-06 verified-screening alternate-route entitlement boundary | REFERRED_NOT_EXECUTED / P1 HIGH | canonical verified-score/context/batch paths consume the accepted server entitlement/quota boundary; return evidence to CAPITAL-AI-SEC |
| FIN-SEC-03 | PVC-15 | S1-R2-06 financial-analysis entitlement boundary | REFERRED_NOT_EXECUTED / P1 HIGH | Backtest/Monte Carlo/full-AI capability binding is server-authoritative and fail-closed; Buffett server authority preserved; return evidence to CAPITAL-AI-SEC |
| FIN-SYNC-01 | PVC-12..17 | Project Surface Current-Main Sync | EVIDENCE_READY | project docs agree on source main, project routing, provider projection and current Security handoffs; final FINTECH-only compare recorded |

## Security handoff state after OPS PR #694

Merged OPS PR #694 completed the `OPS-02-SEC-06` parent entitlement-capability inventory and changed the former conditional `S1-R2-06` dependency into concrete FINTECH child work:

- `FIN-SEC-02 / PVC-16`: canonical `verified_screening` alternate routes must consume the accepted server entitlement/quota boundary;
- `FIN-SEC-03 / PVC-15`: Backtest and Monte Carlo require authoritative protected-execution decisions, `full_ai_analysis` requires an explicit productive capability binding, and the existing Buffett server authority must be preserved while consumer integration is corrected through the proper downstream handoff.

Both child items remain `REFERRED_NOT_EXECUTED` in this documentation-sync work item. Security finding ownership and independent `VERIFIED/CLOSED` decisions remain with `CAPITAL-AI-SEC`.

## Priority order after FIN-SYNC-01

1. P1/HIGH — FIN-SEC-02 and FIN-SEC-03 as newly triggered Security child remediation.
2. Recompute then-current main/open PR/Security state after either child completes before promoting FIN-17 or FIN-12.
3. P2 — FIN-19 provider capability completeness without DATA bypass.
4. P2 — contract/version drift and legacy compatibility cleanup.
5. P3 — automated project/PVC/consumer/security-handoff drift checks.

Detailed atomic status is maintained in `TASK_REGISTER.md`.
