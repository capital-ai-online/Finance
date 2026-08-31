# CAPITAL-AI Compliance

**Project ID:** `CAPITAL-AI-COMP`  
**Display name:** CAPITAL-AI Compliance  
**Domain:** Compliance  
**Document ID:** `DOC-COMP-PROJECT-README-2026-08-31`  
**Document role:** projection / project index  
**Version:** 1.0.0  
**Date:** 2026-08-31  
**Status:** ACTIVE — NON-AUTHORIZING COMPLIANCE EXECUTION INDEX  
**Owner:** CAPITAL-AI Owner / Compliance  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

## Purpose

`CAPITAL-AI-COMP` is the **Single Point of Execution for compliance work**: applicability assessment, requirement mapping, control mapping, evidence requirements, evidence verification, compliance assessment, findings, remediation tracking and reporting.

It does **not** create a second governance authority, control catalog, ADR/ESS hierarchy, Quality Management system, Security architecture, Enterprise Risk Management system or implementation ownership model.

```text
External / Internal Requirement
→ Applicability
→ Existing CAPITAL-AI Authority
→ Existing Control
→ Domain Implementation
→ Evidence
→ Compliance Assessment
→ Gap
→ Remediation
→ Verification
→ Reporting / Monitoring
```

## Authority boundary

Authority remains with the effective repository sources on current `main`, especially:

- `/AGENTS.md` — repository trust root and instruction surface;
- `docs/governance/authority-registry.json` — stable `AUTH-*` identities;
- `docs/governance/control-catalog.json` — existing `CTRL-*` controls;
- `docs/adr/registry.json` and `.ai/registry/ess-registry.json` — ADR/ESS lifecycle and namespace state;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` — branch/PR/sync lifecycle;
- `docs/governance/GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md` — supersession resolution;
- domain ADR/ESS/contracts for implementation decisions.

Roadmaps, assessments, reports, requirements inventories and evidence in this project are non-authorizing unless an existing authority explicitly says otherwise.

## Domain responsibilities

| Domain | Owns | Does not delegate to Compliance |
|---|---|---|
| Governance | Authority, controls, decision gates, supersession | normative rule ownership |
| Compliance | applicability, mappings, evidence requirements, assessment, gaps, verification | technical/domain implementation |
| Quality Management | quality requirements, quality tests/findings/improvement | compliance assessment |
| Security | security design, hardening, security tests/runtime verification | regulatory/control assessment ownership |
| Development | SDLC implementation, code review/test/CI evidence | compliance interpretation |
| Data | data implementation, lineage, quality, retention mechanisms | applicability/legal determination |
| Release/Operations | release, deployment and operational implementation/evidence | compliance assessment |
| Legal/Human Owner | legal applicability decisions and accepted risk where required | technical implementation |

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
│   └── VALUE_CHAIN_COMPLIANCE_COVERAGE_MATRIX.md
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

Therefore this project does not invent or falsely attribute a QM project structure. The fallback is the repository's current canonical document-domain and lifecycle model from `AUTH-GOV-DOCUMENT-LIFECYCLE`, with explicit project folders corresponding to the requested artifact roles. This deviation is tracked as `COMP-GAP-001` and can be structurally reconciled if a Human-merged canonical `CAPITAL-AI-QM` project model appears later.

## Status models

### Requirement applicability

`APPLICABLE` · `PARTIALLY_APPLICABLE` · `NOT_APPLICABLE` · `UNKNOWN` · `REQUIRES_LEGAL_REVIEW`

### Compliance task ownership

`COMP-OWNED` · `COMP-SHARED` · `COMP-CONSUMER` · `NOT-COMPLIANCE`

### Assessment

`COMPLIANT` · `PARTIALLY_COMPLIANT` · `NON_COMPLIANT` · `NOT_APPLICABLE` · `NOT_ASSESSED` · `EVIDENCE_MISSING`

`COMPLIANT` requires adequate evidence. Roadmap text alone is not adequate evidence.

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

Allowed terminal/alternate states: `NOT_APPLICABLE`, `ACCEPTED_RISK`, `LEGAL_REVIEW`, `DEFERRED`, `SUPERSEDED`. `ACCEPTED_RISK` requires the existing competent Human/Owner authority.

### Severity

`P0 CRITICAL` · `P1 HIGH` · `P2 MEDIUM` · `P3 LOW`. Severity is evidence- and scope-derived; regulatory criticality is never inferred solely from a standard or law name.

## Evidence priority

```text
Runtime Evidence
→ Code / Configuration
→ Hosted CI Evidence
→ Registry / Control Evidence
→ Signed / Approved Documentation
→ Roadmap Claims
```

## Change-impact rule

New or changed features, AI models, data sources, providers, markets, countries, user types, processing purposes, deployment models or external integrations trigger:

```text
Change
→ Compliance Impact Assessment
→ New / Changed Requirements
→ Control Impact
→ Evidence Impact
→ Roadmap Update
```

## External standards

ISO, NIST, OWASP, CIS and comparable external standards are handled only as `BENCHMARK`, `CROSSWALK`, `CONTROL SOURCE` or `ASSESSMENT INPUT` unless an existing CAPITAL-AI authority explicitly adopts a narrower obligation. They do not become a competing policy hierarchy by inclusion in this project.

## Claim rule

This project must not claim `ISO certified`, `fully compliant`, `AI Act compliant`, `GDPR compliant`, `SOC compliant` or `audit passed` without scope-appropriate evidence and competent confirmation. Prefer precise statuses such as `mapped`, `assessed`, `partially evidenced`, `control implemented`, `evidence missing`, `verification pending` or `not assessed`.
