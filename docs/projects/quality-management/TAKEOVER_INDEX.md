# CAPITAL-AI-QM — Takeover Index

This file is the **only mapping table** between external roadmaps and QM execution. It grants no authority over the source domain.

| Source | Source item / context | Classification | Transferred QM portion | QM-ID | Source state |
|---|---|---|---|---|---|
| `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | Auth/session remediation and post-change verification | MIXED | Session/runtime regression evidence only; no IAM/MFA/Security policy | QM-3 | REFERENCED_BY_QM — source marker pending source-doc sync |
| `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | Security/performance priority regression | MIXED | Frontend runtime/performance verification only | QM-4 | REFERENCED_BY_QM — source marker pending source-doc sync |
| `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | CI/build/test evidence | MIXED | Exact-head build/test/coverage/regression quality evidence | QM-5 | REFERENCED_BY_QM — source marker pending source-doc sync |
| `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` | Delivery QA and release evidence | MIXED | Quality evidence verification and non-authorizing readiness snapshot | QM-5 / QM-8 | REFERENCED_BY_QM — source marker pending source-doc sync |
| `docs/roadmaps/VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | 18-stage value-chain coverage/hardening | MIXED | Evidence completeness, regression and read-only quality projection only | QM-7 | REFERENCED_BY_QM — source marker pending source-doc sync |
| `tests/unit/securityPerformancePriorityRemediation.test.ts` | Existing performance regression baseline | QUALITY_EXECUTION | Reuse regression evidence; do not duplicate bundle/routing architecture | QM-4 | BASELINE_REFERENCE |
| `docs/adr/ADR-0096-governance-control-plane-authority-and-supersession.md` | Documentation/authority consistency | NOT_QM | QM verifies consistency only; Governance retains authority | QM-6 | AUTHORITY_REFERENCE |
| `.ai/skills/ESS-0012-Documentation-Governance.md` | Documentation governance | NOT_QM | Quality documentation consistency only | QM-6 | AUTHORITY_REFERENCE |

## Source takeover marker

A source document is changed to `HANDED_OFF_TO_QM` only when the quality-only subtask has actually been split from the domain work and linked to a canonical QM item:

> QUALITY-MANAGEMENT TAKEOVER
>
> Execution State: HANDED_OFF_TO_QM  
> Canonical Work Item: `docs/projects/quality-management/ROADMAP.md#<QM-ID>`
>
> Execution ownership for this quality-management subtask has been transferred to CAPITAL-AI-QM.  
> This source roadmap retains domain context and dependency information only.  
> Operational status MUST NOT be maintained in parallel here.

`REFERENCED_BY_QM` is intentionally used during this consolidation PR until each source insertion is verified without overwriting domain status. It MUST NOT be misrepresented as a completed handoff.