# CAPITAL-AI Compliance Work Packages

**Document ID:** `DOC-COMP-WORK-PACKAGES-2026-08-31`  
**Role:** roadmap / non-authorizing  
**Version:** 1.0.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

These eight work packages are the complete V2.1 Compliance workstream set. They coordinate assessment work only. None grants technical execution ownership over a foreign value-chain stage.

## COMP-01 — Applicability

**Purpose:** determine whether a source requirement applies to the evidenced CAPITAL-AI scope.

**Inputs:** source/version, jurisdiction, product/user/data/AI/provider/market facts, competent Legal/Owner decisions.  
**Outputs:** `APPLICABLE`, `PARTIALLY_APPLICABLE`, `NOT_APPLICABLE`, `UNKNOWN` or `REQUIRES_LEGAL_REVIEW` with decision basis.  
**Boundary:** Compliance does not invent legal scope. Ambiguity fails closed to `UNKNOWN`/`REQUIRES_LEGAL_REVIEW`.

**DoD:**
- source and scope evidence linked;
- applicability status uses the approved vocabulary;
- Legal Review handoff created where needed;
- no external regime is promoted into repository Authority merely by mapping.

## COMP-02 — Requirements

**Purpose:** maintain source-backed requirement/assessment inputs without creating a second policy hierarchy.

**Inputs:** applicable internal/external sources, contracts where evidenced, benchmark standards.  
**Outputs:** project-local `REQ-COMP-*` traceability records with source/version/jurisdiction/applicability.  
**Boundary:** Requirement IDs do not replace `AUTH-*`, `CTRL-*`, ADR or ESS IDs.

**DoD:**
- each requirement is traceable to a source;
- benchmark-only standards are labeled as such;
- legal/contract universe gaps remain explicit;
- no requirement is invented solely to populate the matrix.

## COMP-03 — Control Mapping

**Purpose:** map requirements to existing CAPITAL-AI Authority/Controls and implementation owners.

**Inputs:** Authority Registry, Control Catalog, ADR/ESS registries, domain roadmaps/contracts.  
**Outputs:** Requirement→AUTH/CTRL→Primary Owner→VC mapping.  
**Boundary:** Governance owns Controls/Authority. Compliance does not create duplicates.

**DoD:**
- existing control reused where it fits;
- absence of a mapping is recorded as a gap, not silently solved with a new control;
- Primary Owner and affected VC stage explicit when implementation matters;
- historical/suspended authority cannot become current via citation.

## COMP-04 — Assessment

**Purpose:** determine evidence-based assessment status.

**Inputs:** applicability, mapped controls, current scoped evidence.  
**Outputs:** `COMPLIANT`, `PARTIALLY_COMPLIANT`, `NON_COMPLIANT`, `NOT_APPLICABLE`, `NOT_ASSESSED` or `EVIDENCE_MISSING`.  
**Boundary:** `COMPLIANT` requires sufficient current evidence; documentation claims alone do not suffice.

**DoD:**
- scope/baseline recorded;
- assessment status follows approved vocabulary;
- limitations and stale evidence explicit;
- no unsupported certification/regulatory-status claim.

## COMP-05 — Findings

**Purpose:** normalize compliance gaps and decisions requiring follow-up.

**Required fields:**
- `requirement`;
- `applicability`;
- `affected_project`;
- `affected_vc_stage`;
- `evidence`;
- `assessment`;
- `required_remediation`;
- `legal_review_required`;
- `status`.

**DoD:**
- severity is evidence/scope-derived;
- lifecycle state is explicit;
- evidence gap is not rewritten as control failure unless established;
- P0 is used only for demonstrated critical scope.

## COMP-06 — Evidence

**Purpose:** collect/reference and evaluate provenance, freshness and sufficiency of Compliance evidence.

**Priority:** Runtime → Code/Configuration → Hosted CI → Registry/Control → approved documentation → roadmap claim.

**DoD:**
- evidence source/path/provider identified;
- baseline/date/provenance and responsible source domain recorded where available;
- stale/historical evidence labeled;
- missing evidence remains `EVIDENCE_MISSING`/`NOT_ASSESSED` rather than fabricated.

## COMP-07 — Remediation Handoff

**Purpose:** delegate foreign remediation to the Primary Owner while preserving Compliance traceability.

**Marker:** `[COMPLIANCE_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

**DoD:**
- requirement, applicability, affected project and VC stage recorded;
- target roadmap/reference recorded;
- evidence/assessment and expected compliance outcome recorded;
- `execute_foreign_work = false`;
- technical remediation uses target-project work/branch/PR;
- returned evidence is reassessed independently before verification/closure.

## COMP-08 — Continuous Compliance

**Purpose:** reassess Compliance impact when relevant system or business facts change.

**Triggers:** features, AI models, data sources, providers, markets/countries, user types, processing purposes, deployment models, external integrations, authority/control changes or evidence expiry/staleness.

**Flow:**

```text
Change
→ COMP-08 impact review
→ COMP-01 applicability delta
→ COMP-02 requirement delta
→ COMP-03 control/owner/VC impact
→ COMP-06 evidence impact
→ COMP-04 reassessment
→ COMP-05 finding if needed
→ COMP-07 handoff if foreign remediation is needed
```

**Boundary:** Continuous Compliance reuses existing repository/runtime/evidence capabilities; it does not create a second technical orchestrator.

**DoD:**
- changed facts and affected requirements identified;
- stale assessments reopened only when evidence/scope requires it;
- new remediation assigned to Primary Owner;
- no silent legal-scope or certification-status promotion.

## V2.1 migration map from branch-draft labels

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
