# CAPITAL-AI Compliance Registry Impact Report

**Document ID:** `DOC-COMP-REGISTRY-IMPACT-2026-08-31`  
**Role:** assessment report / non-authorizing  
**Version:** 1.0.0  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

## Decision

This consolidation introduces **no new normative Authority, Control, ADR or ESS**. It creates non-authorizing Compliance project/roadmap/inventory/mapping/report artifacts under the existing canonical `docs/compliance/` domain.

| Registry | Impact | Decision |
|---|---|---|
| `docs/governance/authority-registry.json` | none | **NO CHANGE** — roadmap/assessment/finding/evidence are not `AUTH-*` |
| `docs/governance/control-catalog.json` | none | **NO CHANGE** — existing controls are reused; Compliance does not define new `CTRL-*` |
| `docs/adr/registry.json` | no new ADR | **NO CHANGE** — ADR-0007 ambiguity is documented as a gap, not repaired by Compliance |
| `.ai/registry/ess-registry.json` | no new ESS | **NO CHANGE** — ESS-0006 clarification is documented only |
| `docs/governance/document-registry.json` | potential registration of material new `DOC-*` artifacts | **REVIEW REQUIRED BEFORE MERGE-READINESS** |

## Document-registry assessment

The current Document Registry already establishes non-authorizing roles such as `projection`, `inventory`, `roadmap`, `evidence` and `specification`, and already registers existing Compliance projection/inventory artifacts. The V2.1 project uses the same role model and canonical path.

Material candidates for direct registration are at minimum:

| Document ID | Role | Path | Normative? |
|---|---|---|---:|
| `DOC-COMP-PROJECT-README-2026-08-31` | projection / project index | `docs/compliance/CAPITAL-AI-COMP/README.md` | no |
| `DOC-COMP-ROADMAP-2026-08-31` | roadmap | `docs/compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md` | no |
| `DOC-COMP-REQUIREMENTS-INVENTORY-2026-08-31` | inventory | `docs/compliance/CAPITAL-AI-COMP/inventory/COMPLIANCE_REQUIREMENTS_INVENTORY.md` | no |
| `DOC-COMP-APPLICABILITY-MATRIX-2026-08-31` | inventory/assessment | `docs/compliance/CAPITAL-AI-COMP/inventory/APPLICABILITY_MATRIX.md` | no |
| `DOC-COMP-VC-COVERAGE-2026-08-31` | mapping/projection | `docs/compliance/CAPITAL-AI-COMP/mappings/VALUE_CHAIN_COMPLIANCE_COVERAGE_MATRIX.md` | no |
| `DOC-COMP-HANDOFF-REGISTER-2026-08-31` | traceability | `docs/compliance/CAPITAL-AI-COMP/mappings/COMPLIANCE_HANDOFF_REGISTER.md` | no |
| `DOC-COMP-GAP-REPORT-2026-08-31` | assessment report | `docs/compliance/CAPITAL-AI-COMP/reports/COMPLIANCE_GAP_REPORT.md` | no |
| `DOC-COMP-VALIDATION-2026-08-31` | evidence/validation report | `docs/compliance/CAPITAL-AI-COMP/reports/VALIDATION_REPORT.md` | no |

## Why no authority/control mutation is justified

- Existing Governance already owns authority/control identity and supersession.
- `CTRL-COMPLIANCE-CLAIM-001` already covers unsupported certification/regulatory claims.
- `CTRL-AIMS-PDCA-001` already defines external standards as non-authorizing crosswalk input.
- Security, SDLC, deployment, document-lifecycle and historical-authority controls already exist.
- V2.1 requires reuse and explicitly prohibits a second policy hierarchy.

## Open merge-readiness gate

`COMP-GAP-008` remains open until the current `document-registry.json` registration convention is correlated against the final document set. If direct entries are required, they must be added as **non-normative** document records only and must not add `AUTH-*` or `CTRL-*` identities.

This report does not itself authorize or perform a Governance registry mutation.
