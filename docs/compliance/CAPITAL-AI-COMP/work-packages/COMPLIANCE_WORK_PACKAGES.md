# CAPITAL-AI Compliance Work Packages

**Document ID:** `DOC-COMP-WORK-PACKAGES-2026-08-31`  
**Role:** roadmap / non-authorizing  
**Version:** 1.1.0  
**Date:** 2026-09-06  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Current baseline:** `main@49bf799d0098ba15a86a686401627ee6f658164f`

These eight work packages are the complete V2.1 Compliance workstream set. They coordinate assessment work only. None grants technical execution ownership over a foreign productive `PVC-*` stage.

## Current execution state

| WP | Name | Current state | Meaning |
|---|---|---|---|
| `COMP-01` | Applicability | `EXECUTED_CONTINUOUS` | current cycle executed; legal/source/scope changes may re-trigger it |
| `COMP-02` | Requirements | `DONE_ON_MAIN / CONTINUOUS` | 37 active inputs; source/version/scope changes may re-trigger it |
| `COMP-03` | Control Mapping | `DONE_ON_MAIN` | 37/37 current inputs mapped to existing authority/control/owner surfaces |
| `COMP-04` | Assessment | `DONE_ON_MAIN` | 23/23 `READY_NOW` inputs assessed by Human-merged PR #761 |
| `COMP-05` | Findings | `EXECUTED_CURRENT` | current finding set normalized against current main |
| `COMP-06` | Evidence | `EXECUTED_HELD` | all held sets reviewed; missing evidence remains explicit |
| `COMP-07` | Remediation Handoff | `EXECUTED_HELD` | current owner/gate routing recorded; foreign work remains foreign |
| `COMP-08` | Continuous Compliance | `EXECUTED_CONTINUOUS` | current impact review executed; future material changes re-trigger it |

## COMP-01 — Applicability

**Purpose:** determine whether a source requirement applies to the evidenced CAPITAL-AI scope.

**Inputs:** source/version, jurisdiction, product/user/data/AI/provider/market facts, competent Legal/Owner decisions.  
**Outputs:** `APPLICABLE`, `PARTIALLY_APPLICABLE`, `NOT_APPLICABLE`, `UNKNOWN` or `REQUIRES_LEGAL_REVIEW` with decision basis.  
**Boundary:** Compliance does not invent legal scope. Ambiguity fails closed to `UNKNOWN`/`REQUIRES_LEGAL_REVIEW`.

**DoD:** source/scope evidence linked; approved vocabulary used; Legal Review handoff created where needed; no external regime promoted into repository Authority merely by mapping.

## COMP-02 — Requirements

**Purpose:** maintain source-backed requirement/assessment inputs without creating a second policy hierarchy.

**Inputs:** applicable internal/external sources, contracts where evidenced, benchmark standards.  
**Outputs:** project-local `REQ-COMP-*` traceability records with source/version/jurisdiction/applicability.  
**Boundary:** Requirement IDs do not replace `AUTH-*`, `CTRL-*`, ADR or ESS IDs.

**DoD:** each requirement traceable to a source; benchmark-only standards labeled; legal/contract universe gaps explicit; no invented filler requirements.

## COMP-03 — Control Mapping

**Purpose:** map requirements to existing CAPITAL-AI Authority/Controls and implementation owners.

**Inputs:** Authority Registry, Control Catalog, ADR/ESS registries, project roadmaps/contracts.  
**Outputs:** Requirement → existing AUTH/CTRL/ADR/ESS → Primary Owner → `PVC-*` mapping.  
**Boundary:** Governance owns Controls/Authority. Compliance does not create duplicates.

**DoD:** existing control reused where it fits; absence recorded as a gap; Primary Owner and affected `PVC-*` explicit when determinable; historical/suspended authority cannot become current via citation.

## COMP-04 — Assessment

**Purpose:** determine evidence-based assessment status.

**Inputs:** applicability, mapped controls, current scoped evidence.  
**Outputs:** `COMPLIANT`, `PARTIALLY_COMPLIANT`, `NON_COMPLIANT`, `NOT_APPLICABLE`, `NOT_ASSESSED` or `EVIDENCE_MISSING`.  
**Boundary:** `COMPLIANT` requires sufficient current evidence; documentation claims alone do not suffice.

**DoD:** scope/baseline recorded; approved vocabulary used; limitations and stale evidence explicit; no unsupported certification/regulatory-status claim.

## COMP-05 — Findings

**Purpose:** normalize compliance gaps and decisions requiring follow-up.

**Required fields:** `requirement`, `applicability`, `affected_project`, `affected_pvc`, `evidence`, `assessment`, `required_remediation_or_return`, `legal_review_required`, `status`.

**DoD:** severity evidence/scope-derived; lifecycle state explicit; evidence gap is not rewritten as control failure unless established; P0 only for demonstrated critical scope; resolved findings are removed from active remediation queues rather than re-promoted by stale history.

## COMP-06 — Evidence

**Purpose:** collect/reference and evaluate provenance, freshness and sufficiency of Compliance evidence.

**Priority:** Runtime/Provider → Code/Configuration → exact-identity Hosted CI → Registry/Control → approved documentation → roadmap claim.

**DoD:** source/path/provider identified; baseline/date/provenance/responsible source domain recorded where available; stale/historical evidence labeled; missing evidence remains `EVIDENCE_MISSING`/`NOT_ASSESSED` rather than fabricated.

## COMP-07 — Remediation Handoff

**Purpose:** delegate foreign remediation to the Primary Owner while preserving Compliance traceability.

**Current marker:**

```text
[COMPLIANCE_HANDOFF -> <TARGET_PROJECT_OR_GATE> | PVC-<NN>]
```

When productive ownership cannot be resolved before a competent legal/provider-scope decision, use `PVC-N/A — REQUIRES_CORRELATION` rather than inventing a stage.

**DoD:** requirement/applicability/affected project and `PVC-*` recorded where determinable; target roadmap/reference and expected return evidence recorded; `execute_foreign_work=false`; technical remediation uses target-project work/branch/PR; returned evidence independently reassessed before verification/closure.

Historical `VC-*` handoff labels are migration history only and are not current ownership authority.

## COMP-08 — Continuous Compliance

**Purpose:** reassess Compliance impact when relevant system, source, authority or business facts change.

**Triggers:** features, AI models, data sources, providers, markets/countries, user types, processing purposes, deployment models, external integrations, authority/control changes, legal-source changes or evidence expiry/staleness.

**Flow:**

```text
Change
→ COMP-08 impact review
→ COMP-01 applicability delta
→ COMP-02 requirement delta
→ COMP-03 control/owner/PVC impact
→ COMP-06 evidence impact
→ COMP-04 reassessment
→ COMP-05 finding if needed
→ COMP-07 handoff if foreign remediation is needed
```

**Boundary:** Continuous Compliance reuses existing repository/runtime/evidence capabilities; it does not create a second technical orchestrator.

**DoD:** changed facts and affected requirements identified; stale assessments reopened only when evidence/scope requires it; new remediation assigned to the current Primary Owner; no silent legal-scope or certification-status promotion.

## V2.1 migration map from retired branch-draft labels

| Retired draft label | V2.1 destination |
|---|---|
| COMP-09 Documentation & Record Keeping | COMP-02 / 03 / 04 / 06 / 07 as applicable |
| COMP-10 Evidence & Auditability | COMP-06; assessment in COMP-04 |
| COMP-11 Standards Crosswalk | COMP-02 / COMP-03 |
| COMP-12 Control Effectiveness Mapping | COMP-03 / COMP-04 / COMP-06 |
| COMP-13 Compliance Gap Management | COMP-05 / COMP-07 |
| COMP-14 Compliance Reporting | outputs of COMP-04 / 05 / 06; no separate execution stream |
| COMP-15 Continuous Compliance Monitoring | COMP-08 |
| COMP-16 Compliance Lifecycle & Change Impact | COMP-08 plus affected COMP-01…07 |

The retired labels are migration history only and are not current workstream IDs.
