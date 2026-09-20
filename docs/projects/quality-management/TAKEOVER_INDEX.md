# CAPITAL-AI-QM — Assurance Referral Index

This file is the single mapping table between source roadmaps, QM assurance work and Primary Owner remediation. It grants no technical implementation authority to QM.

## V2 routing rule

- QM assessment/verification remains in `CAPITAL-AI-QM`.
- Technical remediation remains in the Primary Owner project for the affected VC stage.
- Every confirmed implementation finding uses `[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`.
- The target project maintains remediation execution status; QM maintains finding/verification status.
- `remediation_execution_local=false`.

## Primary Owner reference

| VC | Target project | VC | Target project |
|---|---|---|---|
| VC-01 | `CAPITAL-AI-CLIENT` | VC-10 | `CAPITAL-AI-FINTECH` |
| VC-02 | `CAPITAL-AI-OPS` | VC-11 | `CAPITAL-AI-FINTECH` |
| VC-03 | `CAPITAL-AI-DOC` | VC-12 | `CAPITAL-AI-FINTECH` |
| VC-04 | `CAPITAL-AI-OPS` | VC-13 | `CAPITAL-AI-FINTECH` |
| VC-05 | `CAPITAL-AI-GOV` | VC-14 | `CAPITAL-AI-FINTECH` |
| VC-06 | `CAPITAL-AI-OPS` | VC-15 | `CAPITAL-AI-FINTECH` |
| VC-07 | `CAPITAL-AI-OPS` | VC-16 | `CAPITAL-AI-FINTECH` |
| VC-08 | `CAPITAL-AI-OPS` | VC-17 | `CAPITAL-AI-FINTECH` |
| VC-09 | `CAPITAL-AI-FINTECH` | VC-18 | `CAPITAL-AI-OPS` |

## Current source correlations

| Source | Context | QM workstream | VC / target routing | QM responsibility |
|---|---|---|---|---|
| `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | auth/session and security-performance regression evidence | `QM-03`, `QM-05`, `QM-07` | attribute finding to affected VC stage; route via Primary Owner table | measurement, regression assessment, evidence, verification only |
| `docs/architecture/ROADMAP.md` | current DevelopmentChain state and CI/release evidence | `QM-02`, `QM-07`, `QM-08` | generally `CAPITAL-AI-OPS` for delivery/CI concerns; exact VC required per finding | consume evidence; do not own CI topology or remediation |
| `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | historical implementation-roadmap context | `QM-05`, `QM-07` | historical evidence only; no current owner transfer | baseline/reference only |
| `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` | delivery QA and readiness evidence | `QM-02`, `QM-07` | exact affected VC determines owner | non-authorizing Quality readiness verification |
| `docs/frontend/FRONTEND_ROADMAP.md` | frontend runtime/performance quality | `QM-03`, `QM-05` | normally VC-18 -> `CAPITAL-AI-OPS`; other findings require exact VC attribution | performance/regression finding and verification, not frontend implementation |
| `docs/frontend/FRONTEND_ARCH.md` | frontend structural authority | `QM-01`, `QM-05` | VC attribution per affected delivery/runtime boundary | criterion/evidence reference only; no architecture redefinition |
| `docs/frontend/COMPONENT_INVENTORY.md` | physical frontend inventory | `QM-03`, `QM-07` | VC attribution per affected component path | measurement baseline only |
| `docs/roadmaps/VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | VC-01..VC-18 evidence completeness | `QM-03`, `QM-04`, `QM-07`, `QM-08` | every finding maps through Primary Owner table | read-only measurement, finding, evidence and improvement verification |
| `.ai/skills/ESS-0012-Documentation-Governance.md` | documentation governance | `QM-01`, `QM-07` | documentation findings affecting VC-03 route to `CAPITAL-AI-DOC`; governance findings use their actual VC/authority | consume authority; no Documentation Governance takeover |
| `docs/adr/ADR-0096-governance-control-plane-authority-and-supersession.md` | authority/document consistency | `QM-01`, `QM-08` | VC-05 -> `CAPITAL-AI-GOV` when remediation is required | consistency finding only; Governance remains owner |
| `tests/unit/securityPerformancePriorityRemediation.test.ts` | existing performance regression baseline | `QM-05`, `QM-07` | target depends on failing behavior's VC stage | reuse test evidence; no duplicate bundle/routing architecture |

## Required handoff record

For each confirmed finding that requires implementation, record:

```text
[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
Finding: <finding_id>
QM Workstream: <QM-01..QM-08>
Roadmap Reference: <canonical source/target roadmap>
Evidence: <evidence reference>
Required Remediation: <bounded technical action>
Verification Gate: <how QM will verify after implementation>
QM Finding Status: REFERRED
Target Remediation Status: maintained by <TARGET_PROJECT>
```

A chat notice is required when the referral is created.

## Legacy takeover semantics

The draft marker `QUALITY-MANAGEMENT TAKEOVER / HANDED_OFF_TO_QM` is superseded by the V2 referral model before ADR-0103 activation. It MUST NOT be used to transfer foreign technical execution into QM.

Existing source roadmaps remain unchanged until a concrete confirmed finding is referred. A referral may add a roadmap cross-reference, but implementation status continues in the target project's own roadmap/PR.

## Closure rule

QM closes a finding only after the target project provides remediation evidence, the required verification gate is executed, and QM records `VERIFIED -> CLOSED`. A target implementation commit, PR or claim by itself is not sufficient verification evidence.