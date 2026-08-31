# CAPITAL-AI-QM — Takeover Index

This file is the **only mapping table** between external roadmaps/current-state sources and QM execution. It grants no authority over the source domain.

| Source | Source item / context | Classification | Transferred QM portion | QM-ID | Source state |
|---|---|---|---|---|---|
| `docs/architecture/ROADMAP.md` | Current DevelopmentChain state / exact-head quality evidence | MIXED | Current-state build/test/regression/evidence verification only; DevelopmentChain execution remains governed by its existing authorities | QM-5 / QM-9 | REFERENCED_BY_QM — current-state source; takeover marker requires ADR-0103 activation |
| `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | Historical implementation-roadmap CI/build/test context | MIXED | Historical build/test/coverage/regression quality context only; not promoted back to current-state authority | QM-5 | HISTORICAL_CONTEXT_REFERENCE |
| `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` | Delivery QA and release evidence | MIXED | Quality evidence verification and non-authorizing readiness snapshot | QM-5 / QM-8 | REFERENCED_BY_QM — source marker requires ADR-0103 activation |
| `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | Auth/session remediation and post-change verification | MIXED | Session/runtime regression evidence only; no IAM/MFA/Security policy | QM-3 | REFERENCED_BY_QM — source marker requires ADR-0103 activation |
| `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | Security/performance priority regression | MIXED | Frontend runtime/performance verification only | QM-4 | REFERENCED_BY_QM — source marker requires ADR-0103 activation |
| `docs/frontend/FRONTEND_ROADMAP.md` | Frontend migration, UX, accessibility and performance work | MIXED | Runtime/performance/accessibility evidence, regression and documentation consistency only; feature migration/UX sequencing stays Frontend | QM-4 / QM-6 | REFERENCED_BY_QM — no operational handoff while ADR-0103 is proposed |
| `docs/frontend/FRONTEND_ARCH.md` | Frontend source tree, dependency direction and presentation architecture | NOT_QM | QM may verify conformance/evidence only; Frontend architecture authority remains here | QM-4 / QM-6 | AUTHORITY_REFERENCE |
| `docs/frontend/COMPONENT_INVENTORY.md` | Physical frontend component inventory | NOT_QM | Baseline/input for runtime attribution and documentation drift; no execution authority transfer | QM-4 / QM-6 | BASELINE_REFERENCE |
| `docs/roadmaps/VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | 18-stage value-chain coverage/hardening | MIXED | Evidence completeness, regression and read-only quality projection only | QM-7 | REFERENCED_BY_QM — source marker requires ADR-0103 activation |
| `tests/unit/securityPerformancePriorityRemediation.test.ts` | Existing performance regression baseline | QUALITY_EXECUTION | Reuse regression evidence; do not duplicate bundle/routing architecture | QM-4 | BASELINE_REFERENCE |
| `docs/adr/ADR-0096-governance-control-plane-authority-and-supersession.md` | Documentation/authority consistency | NOT_QM | QM verifies consistency only; Governance retains authority | QM-6 / QM-9 | AUTHORITY_REFERENCE |
| `.ai/skills/ESS-0012-Documentation-Governance.md` | Documentation governance | NOT_QM | Quality documentation consistency only | QM-6 | AUTHORITY_REFERENCE |

## Correlation notes

- `docs/architecture/ROADMAP.md` is treated as the current DevelopmentChain state source where the Governance Authority Registry says so. The older `DEVELOPMENT_CHAIN_ROADMAP.md` remains historical implementation context and is not reactivated by QM.
- `docs/frontend/FRONTEND_ROADMAP.md` remains the Frontend migration/UX roadmap. Its Product/UX work, migration waves and presentation decisions are not transferred to QM.
- A roadmap-local target such as a Lighthouse score remains a source-roadmap target unless an existing normative Quality/Frontend authority adopts it. QM does not silently convert such targets into Chapter-12 Quality Gates.
- The 18-stage Value Chain remains the existing runtime/domain model. QM only projects evidence across it.

## Source takeover marker

A source document is changed to `HANDED_OFF_TO_QM` only when **ADR-0103 is effective** and the quality-only subtask has actually been split from the domain work and linked to a canonical QM item:

> QUALITY-MANAGEMENT TAKEOVER
>
> Execution State: HANDED_OFF_TO_QM  
> Canonical Work Item: `docs/projects/quality-management/ROADMAP.md#<QM-ID>`
>
> Execution ownership for this quality-management subtask has been transferred to CAPITAL-AI-QM.  
> This source roadmap retains domain context and dependency information only.  
> Operational status MUST NOT be maintained in parallel here.

`REFERENCED_BY_QM` is intentionally used while ADR-0103 remains `proposed`. It MUST NOT be misrepresented as a completed handoff or used to suppress current domain status before the authority becomes effective.