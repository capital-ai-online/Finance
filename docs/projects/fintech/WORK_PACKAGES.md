# CAPITAL-AI-FINTECH — Work Packages

Baseline: `main@1f55340d89178fb5c1ab735242f42c263918b692`

| ID | PVC | Work package | Status | Exit gate |
|---|---|---|---|---|
| FIN-12 | PVC-12 | Feature Engineering | PARTIAL | explicit validated DATA input -> versioned feature contract; failed evidence/DQ stays non-computable |
| FIN-13 | PVC-13 | Scoring Models | VERIFIED/PARTIAL | one registry, unique productive scopes, challengers non-productive until promotion |
| FIN-14 | PVC-14 | Scoring Orchestration | VERIFIED | one productive dispatcher; no alternate score path |
| FIN-15 | PVC-15 | Domain Executors | VERIFIED/PARTIAL | every productive asset scope maps to explicit registered executor |
| FIN-16 | PVC-16 | Canonical Scoring | VERIFIED | CanonicalScoreResult compatibility and exact lineage preserved |
| FIN-17 | PVC-17 | Ranking / Decision Support | PARTIAL / P1 | one productive FINTECH ranking authority; FE consumes backend order only |
| FIN-18 | supporting | Asset Class Inventory | VERIFIED | repository-derived classes only |
| FIN-19 | supporting | Provider Capability Mapping | PARTIAL | requirements mapped without provider-ingress/DQ authority takeover |
| FIN-20 | supporting | Scoring Evidence | PARTIAL | input -> feature -> model -> dispatcher -> executor -> score -> rank lineage plus handoff evidence |
| FIN-SEC-01 | PVC-12..17 | Security Handoff Integration | ACTIVE / NO DIRECT FINDING | stage Security requirements mapped; concrete findings remain REFERRED until routed; return contract ready |

## FIN-SEC-01

Source: CAPITAL-AI-SEC PR #631 / Security V2.1.2.

Required behavior:

- preserve least privilege and external-input integrity;
- preserve single Registry/Dispatcher and no-bypass controls;
- preserve executor/provider boundaries;
- preserve CanonicalScoreResult lineage and fail-closed unavailable states;
- preserve protected ranking-input integrity;
- add directly relevant positive/negative Security tests when a concrete remediation changes code;
- return exact candidate/runtime evidence to CAPITAL-AI-SEC;
- never self-set Security VERIFIED/CLOSED or Accepted Risk.

Current direct Security finding: `NONE_CURRENTLY_ROUTED`.

Conditional dependency: S1-R2-06 may become a child FINTECH handoff only when the OPS entitlement inventory identifies FINTECH-owned productive protected-capability code.

## Priority order

1. P1 — FIN-17 ranking authority consolidation / FE consumer boundary.
2. P1 — FIN-12 explicit DATA contract and fail-closed DQ/evidence boundary.
3. P1 when triggered — any concrete Security handoff affecting FINTECH-owned PVC-12..17.
4. P2 — FIN-19 provider capability completeness without DATA bypass.
5. P2 — contract/version drift and legacy compatibility cleanup.
6. P3 — automated project/PVC/consumer/security-handoff drift checks.