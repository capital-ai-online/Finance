# CAPITAL-AI-OPS Work Packages

**Project:** `CAPITAL-AI-OPS`  
**Status:** ACTIVE BACKLOG / NON-AUTHORIZING  
**Correlation baseline:** `main@75c926f12ae514036aa508ea8faf1a82b1a91059`

Canonical current correlation evidence: [`evidence/OPS_POST_828_PRIORITY_RECORRELATION_2026-09-07.md`](./evidence/OPS_POST_828_PRIORITY_RECORRELATION_2026-09-07.md).

## Security-priority packages

| Priority | Package | PVC | Source | Scope | Exit evidence / current disposition |
|---:|---|---|---|---|---|
| P1 | `OPS-08-SEC-07` Recovery / RPO / RTO | `PVC-08` | S1-R2-07 | recurring encrypted off-site backup, deterministic measured RPO, isolated restore and measured database RTO | **HIGHEST EXECUTABLE LOCAL OPS SECURITY/DATA-INTEGRITY WORK** — recovery harness on main via PR #776; prior evaluator PR #802 closed unmerged, branch absent and evaluator absent from main. Fresh current-main re-intake required; operational evidence and Security verification remain separate |
| P1 | `OPS-06-SEC-03` Node Control-Plane Convergence | `PVC-06` | S1-R2-03 | converge approved Node identity only after effective authority resolves target | **BLOCKED_BY_AUTHORITY_CONFLICT** — `.nvmrc` and Accepted ADR-0053 remain Node 24.18.0; 24.20.0 supersession remains `PROPOSED`; no OPS mutation executable |
| P1 | `OPS-02-SEC-06` Entitlement Capability Inventory | `PVC-02` | S1-R2-06 | parent inventory and owner routing for protected capabilities | **PARENT EVIDENCE_READY / RETURN-ONLY** — child remediation and independent Security verification remain external |
| P1 | `OPS-04-SEC-04` Fatal Process Handling | `PVC-04` | S1-R2-04 | fail-fast/unhealthy readiness/non-zero exit contract | **IMPLEMENTED_ON_MAIN / REPOSITORY_CONTRACT_VERIFIED** — Security PR #832 independently re-verified repository contracts; exact post-deploy supervisor/restart/readiness evidence remains open |
| P1 | `OPS-02-SEC-05` Stripe Redirect Boundary | `PVC-02` | S1-R2-05 | server-owned canonical redirect policy | **IMPLEMENTED_ON_MAIN / EVIDENCE_READY / RETURN-ONLY** — independent Security verification remains open |
| P2 | `OPS-08-SEC-09` Strict CSP Promotion Evidence | `PVC-08` | S1-R2-09 | report-only until protected compatibility evidence satisfies ADR-0040 | WAITING_FOR_EVIDENCE |
| P2 | `OPS-08-SEC-10` Billing Isolation Post-Deploy | `PVC-08` | S1-R2-10 | prove Production cannot reach DEV simulated-success billing logic | WAITING_FOR_EVIDENCE |

### OPS-08-SEC-07 disposition

PR #776 is the current-main Recovery Evidence Harness baseline. The deterministic RPO evaluator from PR #802 is not current implementation: #802 is closed/unmerged, its branch no longer exists, and `scripts/operations/recoveryRpoEvidence.mjs` is absent from current main. Historical #802 diff/evidence is reusable only as implementation input; a fresh current-main implementation branch and new exact-head validation are required.

### OPS-06-SEC-03 disposition

Accepted ADR-0053 explicitly selects Node `24.18.0` for Production, CI and local development. The 24.20.0 write-boundary supersession remains proposed and ineffective until its Human-gated lifecycle completes. Node convergence is high priority but non-executable.

## Core OPS packages

| Priority | Package | PVC | Scope | Current disposition |
|---:|---|---|---|---|
| P1 | `OPS-02-A` Controlled Implementation Inventory | `PVC-02` | execution paths, claims, branch/pre-PR boundaries | ACTIVE / recurring |
| P1 | `OPS-04-A` Supervisor Ownership & Gap Closure | `PVC-04` | finding lifecycle, recovery and non-deciding contract | PARTIAL; repository contract verified, post-deploy evidence remains |
| P1 | `OPS-06-A` Version Boundary & Drift | `PVC-06` | package authority and drift testing | BLOCKED at Node authority boundary |
| P1 | `OPS-07-A` Release Evidence Contract | `PVC-07` | release evidence, gate, rollback, handoff completeness | OPEN |
| P1 | `OPS-08-A` Production Handoff & Recovery | `PVC-08` | readiness, health, rollback/recovery evidence | OPEN / PARTIAL; `OPS-08-SEC-07` highest executable local Security/Data-Integrity slice |
| P1 | `OPS-18-A` EventMesh/Traceability Coverage | `PVC-18` | replay/reliability and operational trace coverage | OPEN / PARTIAL |
| P2 | `OPS-08-B` Reliability & Capacity Baseline | `PVC-08` | SLO/SLI/capacity/degradation evidence | OPEN |
| P2 | `OPS-18-B` Traceability Freshness | `PVC-18` | staleness/identity coverage without authority expansion | OPEN |

## DR-03 — Provider Adapter / Execution Integration

| Priority | Package | PVC | Source | Scope | Current disposition |
|---:|---|---|---|---|---|
| queued after higher-priority OPS gates | `DR-03` Provider Adapter / Execution Integration | primary `PVC-02`; supporting `PVC-04`, `PVC-18`; Release/Production `PVC-07`/`PVC-08` | `docs/architecture/ROADMAP.md`, ADR-0060 v1.1.0, ESS-0019 v1.2.0 | smallest productive provider-adapter execution boundary behind existing Identity/Capability/Policy/Audit/Trace controls | **BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE** — Governance dependency terminal, but executable `OPS-08-SEC-07` remains ahead |

DR-03 must reuse provider profiles, Agent IAM/capability controls, Supervisor observation, request/orchestration and audit/trace contracts. It must not create a second control plane, bypass policy gates, restore retired authorization mechanisms or couple adapter execution to Production mutation.

## Terminal / historical OPS work

| Work | Repository evidence | Residual boundary |
|---|---|---|
| Alpha Vantage canonical secret/deployment contract | PR #642 merged | Production mutation separate |
| Retired PR-authorization runtime | PR #691 merged | historical only; do not restore |
| Fatal Process Handling | PR #720 merged; repository contract re-verified by Security PR #832 | post-deploy supervisor/restart/readiness evidence remains |
| R-Class CI cost control | PR #721 merged | governed by current classifier/contracts |
| User Lifecycle OPS closeout | PR #729 merged | provider/Security residuals explicit |
| GOV-03 / DR-02B | PR #743 merged | terminal foreign dependency |
| Stripe Redirect Boundary | implementation/tests on main | Security verification external |
| DR-03 roadmap re-correlation | PR #747 merged | terminal coordination metadata |
| Recovery/RPO/RTO harness | PR #776 merged | scheduled RPO/restore/Security evidence open |
| GOV-07 OPS evidence return | PR #794 merged | broader external gates remain |
| RPO measurement evaluator | PR #802 closed unmerged; branch/code absent | **fresh current-main re-intake required** |
| qs 6.16.0 DoS remediation | PR #828 merged/deployed; final hosted CI/Governance/Container Security success; current main contains override/lock/test | **IMPLEMENTED_ON_MAIN / DEPLOYED / TERMINAL** |

## Package rules

1. One bounded work package per fresh compliant branch unless a coherent package is explicitly correlated.
2. Security-related implementation may become `IMPLEMENTED`/`EVIDENCE_READY`; Security `VERIFIED/CLOSED` belongs to CAPITAL-AI-SEC.
3. Foreign productive code remains with the actual Primary Owner unless effective authority permits a bounded delegated execution package.
4. Protected changes retain Human/Owner gates.
5. Runtime/provider mutation is never implied by repository documentation or code alone.
6. Terminal Governance dependencies do not override a higher-priority active Security/Data-Integrity gate.
7. A project Roadmap cannot override an Accepted ADR; unresolved authority divergence is fail-closed.
8. Closed-unmerged PRs and absent branches are historical implementation input only, not current repository state.
