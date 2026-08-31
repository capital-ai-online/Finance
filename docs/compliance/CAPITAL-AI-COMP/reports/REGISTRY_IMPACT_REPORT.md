# CAPITAL-AI Compliance Registry Impact Report

**Document ID:** `DOC-COMP-REGISTRY-IMPACT-2026-08-31`  
**Role:** assessment report / non-authorizing  
**Version:** 1.1.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

## Decision

This consolidation introduces **no new normative Authority, Control, ADR or ESS**. It creates non-authorizing Compliance project/roadmap/inventory/mapping/report artifacts under the existing canonical `docs/compliance/` domain.

| Registry | Impact | Decision |
|---|---|---|
| `docs/governance/authority-registry.json` | none | **NO CHANGE** — roadmap/assessment/finding/evidence are not `AUTH-*` |
| `docs/governance/control-catalog.json` | none | **NO CHANGE** — existing controls are reused; Compliance does not define new `CTRL-*` |
| `docs/adr/registry.json` | no new ADR | **NO CHANGE** — ADR-0007 ambiguity is documented and handed to Governance rather than repaired by Compliance |
| `.ai/registry/ess-registry.json` | no new ESS | **NO CHANGE** — ESS-0006 clarification is handed to its responsible owner |
| `docs/governance/document-registry.json` | material new `DOC-*` artifacts may require selected non-normative registration under the current Documentary/Governance convention | **IMPACT IDENTIFIED / COMP-07 HANDOFF ASSIGNED** |

## Document-registry assessment

The current Document Registry establishes non-authorizing roles such as `projection`, `inventory`, `roadmap`, `evidence` and `specification`, and already registers selected Compliance projection/inventory artifacts. V2.1 uses the same role model and canonical path.

Material candidates for direct registration include:

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

## V2.1 one-project boundary

Direct mutation of the Governance-owned `document-registry.json` is **not executed in this Compliance-only PR scope**. Instead:

```text
[COMPLIANCE_HANDOFF -> GOV-DOC | VC-03]
```

is recorded in the Handoff Register with the current Document Lifecycle policy and Documentary/Governance references. The receiving owner decides which non-normative entries are required and performs that mutation in the appropriate scoped work/PR.

This preserves:

- `one_project_scope_per_pr = true`;
- `execute_foreign_work = false`;
- Governance ownership of repository registries;
- no new `AUTH-*`/`CTRL-*` identity from a Compliance roadmap/report.

## Why no authority/control mutation is justified

- Existing Governance already owns authority/control identity and supersession.
- `CTRL-COMPLIANCE-CLAIM-001` already covers unsupported certification/regulatory claims.
- `CTRL-AIMS-PDCA-001` already defines external standards as non-authorizing crosswalk input.
- Security, SDLC, deployment, document-lifecycle and historical-authority controls already exist.
- V2.1 requires reuse and explicitly prohibits a second policy hierarchy.

## Registry impact status

Registry impact is **ASSESSED AND ASSIGNED**. `COMP-GAP-008` remains an open target-owner finding until Documentary/Governance returns the relevant registry decision/evidence; it does not authorize Compliance to mutate the registry itself.
