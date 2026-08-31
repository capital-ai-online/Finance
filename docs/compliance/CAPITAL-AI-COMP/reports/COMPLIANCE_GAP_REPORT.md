# CAPITAL-AI Compliance Gap Report

**Document ID:** `DOC-COMP-GAP-REPORT-2026-08-31`  
**Role:** assessment report / non-authorizing  
**Version:** 1.2.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@5d3360c21ee51771495aab734ba81c2bdfd3d08b`

A finding is not a certification judgment and does not transfer technical, Governance-lifecycle or legal ownership to Compliance.

| Finding | Priority | requirement | applicability | affected_project | affected_vc_stage | evidence | assessment | required_remediation | legal_review_required | status |
|---|---:|---|---|---|---|---|---|---|---|---|
| COMP-GAP-001 — requested `CAPITAL-AI-QM` project template absent | P3 | repository project-structure requirement | APPLICABLE to consolidation method | Compliance / future QM project owner | N/A | `docs/quality/` only `.gitkeep`; ESS-0005/src/platform/Quality are component model, not project tree | EVIDENCE_MISSING for requested template | do not invent template; reconcile only when a Human-merged canonical QM project structure exists | false | DEFERRED |
| COMP-GAP-002 — ADR-0007 legacy lifecycle/semantic ambiguity | P2 | REQ-COMP-012 / claim boundary | APPLICABLE | Governance / ADR lifecycle owner | VC-03 | legacy ADR history shows ACCEPTED; current ADR registry does not migrate it; text contains over-broad historical legal/certification semantics | PARTIALLY_COMPLIANT because current Governance controls prevent reactivation but lifecycle remains ambiguous | `[COMPLIANCE_HANDOFF -> GOV-ADR | VC-03]` — Governance/Owner separately decide migrate/clarify/supersede/archive; Compliance does not create replacement ADR | false | REMEDIATION_ASSIGNED |
| COMP-GAP-003 — ESS-0006 stale implementation/content assumptions | P2 | REQ-COMP-012/029/033 | APPLICABLE | Governance / ESS component owner | VC-10 | ESS-0006 remains published but contains historical paths/events/findings and older requirement-registry language | PARTIALLY_COMPLIANT | `[COMPLIANCE_HANDOFF -> GOV-ESS | VC-10]` — clarify only under separately authorized ESS/Governance work; preserve current component boundary and no second normative registry | false | REMEDIATION_ASSIGNED |
| COMP-GAP-004 — vendor/transfer evidence incomplete | P1 | REQ-COMP-017 | APPLICABLE | Privacy / Legal / Human Owner | VC-09 | vendor inventory and partial DPA/subprocessor evidence; source DSGVO roadmap left DPA/SCC/TIA/role/region evidence open | EVIDENCE_MISSING | `[COMPLIANCE_HANDOFF -> PRIVACY-LEGAL | VC-09]` — complete/confirm only evidence applicable to actual providers/transfers | true where legal transfer assessment is needed | REMEDIATION_ASSIGNED |
| COMP-GAP-005 — human AI-literacy evidence absent | P2 | REQ-COMP-021 | PARTIALLY_APPLICABLE | Human Owner / Operations; `CAPITAL-AI-CLIENT` remains VC-01 technical owner | VC-01 | `AI_LITERACY_CONTROL.md` is a specification; no human training/ack records established in repository evidence | EVIDENCE_MISSING | `[COMPLIANCE_HANDOFF -> OWNER-OPERATIONS | VC-01]`; establish applicability and real human/organizational evidence without fabrication. This is not a VC-01 code-remediation handoff; any separate confirmed VC-01 technical change would target CAPITAL-AI-CLIENT. | true for obligation interpretation | REMEDIATION_ASSIGNED |
| COMP-GAP-006 — DORA entity scope unresolved | P2 | REQ-COMP-022 | REQUIRES_LEGAL_REVIEW | Human Owner / Legal | VC-08 | FinTech functionality exists, but entity/business regulatory status is not established | NOT_ASSESSED | `[COMPLIANCE_HANDOFF -> LEGAL-OWNER | VC-08]`; determine scope from actual legal/business facts without predetermined outcome | true | LEGAL_REVIEW |
| COMP-GAP-007 — measured backup/restore evidence missing | P1 | REQ-COMP-032 | APPLICABLE | S1 / Operations | VC-08 | S1-R2-07 explicitly OPEN / UNVERIFIED | EVIDENCE_MISSING | `[COMPLIANCE_HANDOFF -> S1 | VC-08]`; target domain provides measured restore/continuity evidence and remediation if needed | false | REMEDIATION_ASSIGNED |
| COMP-GAP-008 — new Compliance document-registry treatment not yet persisted | P2 | REQ-COMP-011 | APPLICABLE | Documentary / Governance | VC-03 | project documents have `DOC-*` IDs and canonical placement; direct `document-registry.json` registration has not been performed in this one-project Compliance scope | PARTIALLY_COMPLIANT | `[COMPLIANCE_HANDOFF -> GOV-DOC | VC-03]` — Documentary/Governance owner decides/applies any required non-normative registry entries; no `AUTH-*`/`CTRL-*` creation | false | REMEDIATION_ASSIGNED |

## Priority summary

- P0 CRITICAL: **0**
- P1 HIGH: **2**
- P2 MEDIUM: **5**
- P3 LOW: **1**

No regulatory criticality was inferred solely from the name of a regulation or standard.

## Authority / ADR / ESS summary

- Current stable Authority conflicts confirmed as P0: **0**.
- ADR lifecycle/semantic gaps: **1** (`ADR-0007`).
- ESS clarification gaps: **1** (`ESS-0006`).
- New ADR/ESS/Control authorities created by this package: **0**.

## Assignment check

Every currently actionable remediation in this report is assigned to an appropriate target owner through `COMP-07`. `CAPITAL-AI-CLIENT` is the single Primary Owner for VC-01 technical implementation; organizational/legal evidence handoffs do not change that ownership. `COMP-GAP-001` is intentionally `DEFERRED` because no canonical QM project template exists to remediate against; inventing one would violate the task boundary.

## Closure rule

A finding closes only after the relevant Primary Owner/Legal decision returns adequate evidence and `COMP-04` verifies it. `CAPITAL-AI-COMP` does not implement the target remediation itself.
