# CAPITAL-AI Compliance

**Project ID:** `CAPITAL-AI-COMP`  
**Display name:** CAPITAL-AI Compliance  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Domain:** Compliance  
**Document ID:** `DOC-COMP-PROJECT-README-2026-08-31`  
**Document role:** projection / project index  
**Version:** 1.1.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Date:** 2026-08-31  
**Status:** ACTIVE — NON-AUTHORIZING COMPLIANCE ASSESSMENT INDEX  
**Owner:** CAPITAL-AI Owner / Compliance  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

## Purpose

`CAPITAL-AI-COMP` is the **Single Point of Execution for compliance assessment work**. It owns applicability, requirement mapping, compliance assessment, compliance findings, compliance evidence, regulatory traceability and Legal Review handoff.

It owns **no primary technical value-chain stage**:

```yaml
primary_value_chain_ownership: []
```

Compliance does not implement foreign-domain remediation. Technical and organizational implementation remains with the Primary Owner of the affected architecture/value-chain stage.

```text
External / Internal Requirement
→ Applicability
→ Existing CAPITAL-AI Authority / Control
→ Primary Owner implementation
→ Evidence
→ Compliance Assessment
→ Compliance Finding
→ Remediation Handoff
→ Primary Owner remediation
→ Evidence return
→ Compliance Verification
→ Continuous Compliance
```

## Local scope

Compliance owns only:

- Applicability;
- Requirement Mapping;
- Compliance Assessment;
- Compliance Findings;
- Compliance Evidence;
- Regulatory Traceability;
- Legal Review Handoff.

Compliance does **not** create a second Governance Control Plane, control catalog, ADR/ESS hierarchy, Quality Management system, Security architecture, Enterprise Risk Management model or technical implementation architecture.

## Authority boundary

Authority remains with effective repository sources on current `main`, especially:

- `/AGENTS.md` — repository trust root and instruction surface;
- `docs/governance/authority-registry.json` — stable `AUTH-*` identities;
- `docs/governance/control-catalog.json` — existing `CTRL-*` controls;
- `docs/adr/registry.json` and `.ai/registry/ess-registry.json` — ADR/ESS lifecycle and namespace state;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` — branch/PR/sync lifecycle;
- `docs/governance/GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md` — supersession resolution;
- domain ADR/ESS/contracts for implementation decisions.

Roadmaps, assessments, findings, reports, requirements inventories and evidence in this project are non-authorizing unless an existing authority explicitly says otherwise. External requirements do not become repository Architecture Authority merely because Compliance maps them.

## Domain responsibilities

| Domain | Owns | Compliance relationship |
|---|---|---|
| Governance | Authority, controls, decision gates, supersession | Compliance consumes; never redefines |
| Compliance | applicability, requirement/control mapping, assessment, findings, evidence, handoff | independent assessment domain |
| Quality Management | quality requirements, quality tests/findings/improvement | supplies quality evidence where relevant |
| Security | security design, hardening, security tests/runtime verification | receives security remediation handoffs and supplies evidence |
| Development | SDLC implementation, code review/test/CI evidence | receives SDLC remediation handoffs and supplies evidence |
| Data | data implementation, lineage, quality, retention mechanisms | receives data/privacy implementation handoffs and supplies evidence |
| Scoring/Product | scoring, model and decision-support implementation | receives model/transparency/traceability handoffs and supplies evidence |
| Release/Operations | release, deployment, monitoring, incident and continuity execution | receives operational handoffs and supplies evidence |
| Documentary/Evidence | documentary implementation and evidence lifecycle mechanisms | supplies registered/documentary evidence |
| Legal/Human Owner | legal applicability decisions and accepted risk where required | receives Legal Review handoffs |

## Workstreams

The V2.1 execution model has exactly eight Compliance workstreams:

| WP | Name | Compliance-owned outcome |
|---|---|---|
| `COMP-01` | Applicability | source-backed applicability decision or explicit Legal Review state |
| `COMP-02` | Requirements | requirement inventory with source/version/scope |
| `COMP-03` | Control Mapping | mapping to existing `AUTH-*` / `CTRL-*` / ADR / ESS without duplicate policy |
| `COMP-04` | Assessment | evidence-based assessment status |
| `COMP-05` | Findings | normalized compliance finding lifecycle and priority |
| `COMP-06` | Evidence | provenance-bound evidence inventory and sufficiency status |
| `COMP-07` | Remediation Handoff | assignment to affected Primary Owner; no foreign execution |
| `COMP-08` | Continuous Compliance | change-impact reassessment and evidence freshness monitoring |

No `COMP-09` or higher workstream is valid in the V2.1 model. Earlier branch-draft references are migrated into these eight workstreams.

## Cross-project handoff contract

When Compliance identifies remediation outside its local scope, it creates a handoff using exactly this marker pattern:

```text
[COMPLIANCE_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

Rules:

1. `execute_foreign_work = false`.
2. The target is the repository-supported Primary Owner project/domain for the affected VC stage.
3. The target roadmap/reference is mandatory in the handoff record.
4. Compliance records the requirement, applicability, evidence and assessment before delegation.
5. Technical remediation is performed in a target-project work item/branch/PR, not in a `CAPITAL-AI-COMP` technical change.
6. Compliance may later consume returned evidence and update its assessment; it does not silently close the target implementation task.
7. A handoff must be surfaced in the chat completion/handoff report (`chat_notice_required = true`).

Canonical handoffs are tracked in `mappings/COMPLIANCE_HANDOFF_REGISTER.md`.

## Finding schema

Each active Compliance finding records at least:

- `requirement`;
- `applicability`;
- `affected_project`;
- `affected_vc_stage`;
- `evidence`;
- `assessment`;
- `required_remediation`;
- `legal_review_required`;
- `status`.

Finding identity and severity may be added as traceability metadata, but they do not replace the required fields above.

## Status models

### Applicability

`APPLICABLE` · `PARTIALLY_APPLICABLE` · `NOT_APPLICABLE` · `UNKNOWN` · `REQUIRES_LEGAL_REVIEW`

### Assessment

`COMPLIANT` · `PARTIALLY_COMPLIANT` · `NON_COMPLIANT` · `NOT_APPLICABLE` · `NOT_ASSESSED` · `EVIDENCE_MISSING`

`COMPLIANT` requires adequate current evidence. Roadmap text alone is not adequate evidence.

### Compliance task relationship

`COMP-OWNED` · `COMP-SHARED` · `COMP-CONSUMER` · `NOT-COMPLIANCE`

These classifications describe the Compliance relationship to a task; they never authorize Compliance to execute foreign technical work.

### Finding lifecycle

```text
DISCOVERED
→ TRIAGED
→ APPLICABILITY_CONFIRMED
→ GAP_CONFIRMED
→ REMEDIATION_ASSIGNED
→ IMPLEMENTED
→ EVIDENCE_READY
→ VERIFIED
→ CLOSED
```

Allowed alternate/terminal states: `NOT_APPLICABLE`, `ACCEPTED_RISK`, `LEGAL_REVIEW`, `DEFERRED`, `SUPERSEDED`. `ACCEPTED_RISK` requires the existing competent Human/Owner authority.

### Severity

`P0 CRITICAL` · `P1 HIGH` · `P2 MEDIUM` · `P3 LOW`. Severity is evidence- and scope-derived; regulatory criticality is never inferred solely from a law or standard name.

## Evidence priority

```text
Runtime Evidence
→ Code / Configuration
→ Hosted CI Evidence
→ Registry / Control Evidence
→ Signed / Approved Documentation
→ Roadmap Claims
```

Evidence gaps remain explicit. Missing evidence is not converted into a positive compliance status.

## Existing assets reused

The project consumes rather than duplicates:

- `docs/compliance/CAPITAL_AI_REGULATORY_CONTROL_MATRIX_2026-08-19.md`;
- `docs/compliance/AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md`;
- `docs/compliance/AI_LITERACY_CONTROL.md`;
- `docs/compliance/ISO27001_STATEMENT_OF_APPLICABILITY.md` as dated internal benchmark evidence only;
- `docs/compliance/privacy/**` and `docs/compliance/legal/**`;
- `docs/compliance/vendor-evidence/**`;
- `src/platform/Compliance/**` scanner/runtime evidence;
- `docs/governance/control-plane/STANDARDS_CROSSWALK.md`;
- existing Security, Quality, Development, Data, Release, Operations and Documentary evidence.

## Project structure

```text
docs/compliance/CAPITAL-AI-COMP/
├── README.md
├── CAPITAL_AI_COMPLIANCE_ROADMAP.md
├── inventory/
│   ├── COMPLIANCE_ROADMAP_INVENTORY.md
│   ├── COMPLIANCE_TASK_EXTRACTION_MATRIX.md
│   ├── COMPLIANCE_REQUIREMENTS_INVENTORY.md
│   └── APPLICABILITY_MATRIX.md
├── mappings/
│   ├── REQUIREMENT_CONTROL_EVIDENCE_MATRIX.md
│   ├── ADR_ESS_COMPLIANCE_CORRELATION_MATRIX.md
│   ├── CROSS_ROADMAP_COMPLIANCE_MATRIX.md
│   ├── VALUE_CHAIN_COMPLIANCE_COVERAGE_MATRIX.md
│   └── COMPLIANCE_HANDOFF_REGISTER.md
├── work-packages/
│   └── COMPLIANCE_WORK_PACKAGES.md
├── reports/
│   ├── COMPLIANCE_GAP_REPORT.md
│   ├── REGISTRY_IMPACT_REPORT.md
│   ├── COMPLIANCE_EVIDENCE_REPORT.md
│   ├── VALIDATION_REPORT.md
│   └── PR_READY_CHANGE_SUMMARY.md
└── traceability/
    └── COMPLIANCE_TRACEABILITY_MATRIX.md
```

### CAPITAL-AI-QM template finding

The requested structural reference `CAPITAL-AI-QM` is **not present on baseline `main`**. Repository searches return no `CAPITAL-AI-QM` project tree; `docs/quality/` contains only `.gitkeep`. A Quality Center exists through `ESS-0005` / `src/platform/Quality`, but that is a component model, not a canonical project-folder template.

Therefore this project does not invent or falsely attribute a QM project structure. The fallback is the repository's current canonical document-domain and lifecycle model from `AUTH-GOV-DOCUMENT-LIFECYCLE`. This deviation remains `COMP-GAP-001` until a Human-merged canonical project model exists.

## Change-impact rule

New or changed features, AI models, data sources, providers, markets, countries, user types, processing purposes, deployment models or external integrations trigger:

```text
Change
→ COMP-08 impact review
→ COMP-01 applicability reassessment
→ COMP-02 changed requirements
→ COMP-03 control impact
→ COMP-06 evidence impact
→ COMP-04 reassessment
→ COMP-05 finding when needed
→ COMP-07 handoff when remediation belongs elsewhere
```

## External standards and claim rule

ISO, NIST, OWASP, CIS and comparable standards are handled only as `BENCHMARK`, `CROSSWALK`, `CONTROL SOURCE` or `ASSESSMENT INPUT` unless an existing CAPITAL-AI authority explicitly adopts a narrower obligation. They do not become a competing policy hierarchy.

This project must not claim `ISO certified`, `fully compliant`, `AI Act compliant`, `GDPR compliant`, `SOC compliant` or `audit passed` without scope-appropriate evidence and competent confirmation. Prefer precise statuses such as `mapped`, `assessed`, `partially evidenced`, `control implemented`, `evidence missing`, `verification pending` or `not assessed`.

## Pull-request boundary

- PR prefix/project scope: `CAPITAL-AI-COMP`;
- intended creation title: `[CAPITAL-AI-COMP] - PR`;
- after authorized creation, title is updated to `[CAPITAL-AI-COMP] - PR <PR_NUMBER>`;
- one project scope per PR;
- technical remediation uses the target project's PR, not the Compliance PR;
- explicit Human/Owner PR-creation approval is required for the exact candidate snapshot;
- merge remains Human/CODEOWNER-only;
- direct `main` edits are prohibited.
