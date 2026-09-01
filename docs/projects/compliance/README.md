# CAPITAL-AI Compliance

**Project ID:** `CAPITAL-AI-COMP`  
**Canonical project folder:** `docs/projects/compliance/`  
**Branch project-folder slug:** `compliance`  
**Role:** cross-cutting Compliance applicability, requirement mapping, assessment, findings, evidence and Legal Review handoff  
**Primary Productive PVC ownership:** `[]`  
**Coverage:** `PVC-01` through `PVC-18` as Compliance overlay only  
**Trust root:** `/AGENTS.md`  
**Status:** ACTIVE PROJECT EXECUTION PROJECTION — NON-AUTHORIZING

## Scope

CAPITAL-AI-COMP owns compliance applicability analysis, requirement/control mapping, evidence-based compliance assessment, compliance findings, regulatory traceability, remediation handoff and continuous compliance reassessment.

It owns **no productive `PVC-*` stage**. Productive remediation remains with the Primary Owner of the affected project stage. Legal applicability and accepted-risk decisions remain with the competent Human/Legal/Owner authority where required.

This project folder is organizational navigation only. It does not replace the existing Compliance domain, the Governance Control Plane, Security, Quality Management, Data, Frontend, Release/Operations, ADR/ESS/control identities or target-project implementation ownership.

## Canonical Compliance sources

The project surface references the existing Compliance sources instead of duplicating them:

- [Compliance project index](../../compliance/CAPITAL-AI-COMP/README.md) — canonical Compliance execution/domain index.
- [Compliance Roadmap](../../compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md) — detailed Compliance roadmap.
- `../../compliance/CAPITAL-AI-COMP/inventory/` — requirements/applicability inventory.
- `../../compliance/CAPITAL-AI-COMP/mappings/` — requirement/control mappings.
- `../../compliance/CAPITAL-AI-COMP/traceability/` — compliance traceability.
- `../../compliance/CAPITAL-AI-COMP/work-packages/` — Compliance work packages.
- `../../compliance/CAPITAL-AI-COMP/reports/` — assessment/report outputs.
- [Project Value Chain](../PROJECT_VALUE_CHAIN.md) — canonical `PVC-01..PVC-18` Primary Owners.
- [Cross-Project Handoff Contract](../CROSS_PROJECT_HANDOFF_CONTRACT.md) — repository handoff and `PVC-*` routing contract.

## Ownership boundary

Compliance owns:

- Applicability;
- requirements inventory and source/version/scope tracking;
- mapping external/internal requirements to existing CAPITAL-AI authorities and controls;
- evidence-based compliance assessment;
- compliance findings lifecycle;
- compliance evidence sufficiency assessment;
- regulatory traceability;
- remediation handoff;
- continuous compliance/change-impact reassessment;
- Legal Review handoff.

Compliance does not own:

- a second Governance Control Plane or control catalog;
- technical remediation in foreign project scopes;
- Security architecture or Security verification ownership;
- Quality Management implementation;
- productive Data/Scoring/Frontend/Release implementation;
- autonomous legal applicability or accepted-risk decisions;
- Production mutation or deployment authority.

## Cross-project execution model

When Compliance identifies remediation outside its local scope, the work is routed to the Primary Owner using the repository cross-project handoff contract. Compliance records the requirement, applicability, evidence and assessment, but the target project implements the remediation and returns evidence for independent reassessment.

Detailed workstream and finding state remains canonical under `docs/compliance/CAPITAL-AI-COMP/**`; this folder does not create a second findings or requirement register.

## Project navigation

- `ROADMAP.md` — thin owner-side execution projection for this project folder.
- `../../compliance/CAPITAL-AI-COMP/README.md` — canonical Compliance domain/project index.
- `../../compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md` — detailed roadmap.
- `../../compliance/CAPITAL-AI-COMP/inventory/` — requirements inventory.
- `../../compliance/CAPITAL-AI-COMP/mappings/` — control mappings.
- `../../compliance/CAPITAL-AI-COMP/traceability/` — traceability.
- `../../compliance/CAPITAL-AI-COMP/work-packages/` — work packages.

## Validation / Definition of Done

The Compliance project surface remains valid when:

1. `docs/projects/compliance/` remains a non-authorizing navigation layer;
2. CAPITAL-AI-COMP owns no productive `PVC-*` stage;
3. existing Governance/ADR/ESS/control authorities remain controlling in their scopes;
4. external requirements do not become repository authority merely through mapping;
5. foreign productive remediation remains target-project work;
6. compliance assessments remain evidence-based and traceable to source/version/scope;
7. missing or stale required evidence cannot silently become PASS;
8. merged/closed Compliance work claims are terminalized and cannot remain active parallel writers.

## Non-goals

No duplicate Compliance architecture, no project-folder-driven relocation of the existing Compliance domain, no second Governance/Security/QM system, no new productive `PVC-*` stage, no implicit `PVC-19`, no autonomous Legal/Accepted-Risk decision and no Production self-authorization.
