# CAPITAL-AI Security

**Project ID:** `CAPITAL-AI-SEC`  
**Canonical project folder:** `docs/projects/security/`  
**Branch project-folder slug:** `security`  
**Role:** cross-cutting Security requirements, findings, testing and verification  
**Primary Productive PVC ownership:** `[]`  
**Coverage:** `PVC-01` through `PVC-18` as Security overlay only  
**Trust root:** `/AGENTS.md`  
**Status:** ACTIVE PROJECT EXECUTION PROJECTION — NON-AUTHORIZING

## Scope

CAPITAL-AI-SEC owns repository-wide Security requirements, threat analysis, Security testing, finding lifecycle coordination and independent Security verification.

It does **not** own a productive `PVC-*` stage. Productive remediation remains with the affected Primary Project Owner unless the implementation is inherently reusable Security infrastructure inside `src/platform/Security`.

This project folder is organizational navigation only. It does not replace or supersede existing Security authorities, the Governance Control Plane, IAM authorities, ESS/ADR/control identities, Security runtime helpers, Security evidence or target-project implementation ownership.

## Canonical Security sources

The project surface deliberately references the existing Security sources instead of duplicating them:

- [Security Roadmap](../../roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md) — canonical detailed cross-cutting Security roadmap.
- [Security Work Packages](../../roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md) — `SEC-01..SEC-10` execution packages and current routed findings.
- [Security Traceability Matrix](../../traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md) — finding/control/owner/PVC/evidence traceability.
- [Security V2 Validation Evidence](../../evidence/security/CAPITAL_AI_SEC_V2_VALIDATION_2026-08-31.md) — historical exact-candidate validation evidence for PR #631 scope.
- [Technical Security component](../../../src/platform/Security/README.md) — reusable technical Security implementation boundary under existing authority.
- [Project Value Chain](../PROJECT_VALUE_CHAIN.md) — canonical `PVC-01..PVC-18` Primary Owners.
- [Project folder mapping](../README.md) — canonical folder-to-PVC connection.

## Ownership boundary

Security owns:

- Threat Modeling;
- Security Architecture Requirements;
- IAM/AuthN/AuthZ/MFA/AAL Security requirements and verification;
- Application/API Security requirements and verification;
- Data/Secrets Security requirements and verification;
- Infrastructure and Supply Chain Security requirements and verification;
- AI/Agent Security requirements and verification;
- Security test/negative-test design;
- Security findings lifecycle;
- independent Security verification.

Security does not own:

- target-project productive implementation;
- Governance authority lifecycle decisions;
- accepted-risk decisions reserved to Human/Owner authority;
- Production mutation or deployment authority;
- EventMesh, data, scoring, billing or release architecture;
- a second IAM, Governance or Secrets authority.

## Current cross-project execution model

Security findings remain routed with the Security marker where applicable:

`[SECURITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

Project ownership is resolved only from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Existing technical `VC-*` stages remain separately namespaced and never become project ownership by implication.

Current primary return-evidence dependencies remain with:

- `CAPITAL-AI-OPS` for routed implementation/runtime evidence under `PVC-02`, `PVC-04`, `PVC-06` and `PVC-08`;
- `CAPITAL-AI-DATA` for evidence identity/freshness semantics under `PVC-10`;
- `CAPITAL-AI-GOV` for MFA/AAL authority-lifecycle reconciliation under `PVC-05`;
- `CAPITAL-AI-CLIENT` / `CAPITAL-AI-FINTECH` only for child remediation where target-owned productive code is identified.

Detailed status remains canonical in the Security Roadmap, Work Packages and Traceability Matrix linked above.

## Project navigation

- `ROADMAP.md` — thin owner-side execution projection for this project folder.
- `../../roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md` — detailed Security roadmap.
- `../../roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md` — Security work packages.
- `../../traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md` — Security traceability.
- `../../evidence/security/` — Security evidence.
- `../../../src/platform/Security/` — technical Security component.

## Validation / Definition of Done

The Security project surface remains valid when:

1. `docs/projects/security/` remains a non-authorizing navigation layer;
2. CAPITAL-AI-SEC owns no productive `PVC-*` stage;
3. existing Security/Governance/IAM/ADR/ESS/control authorities remain the only controlling authorities in their scopes;
4. foreign productive implementation remains target-project work;
5. Security verification never treats missing/stale evidence as PASS;
6. merged/closed Security work claims are terminalized and cannot remain active parallel writers;
7. detailed findings, handoffs and evidence remain traceable to the existing canonical Security roadmap/work-package/traceability surfaces.

## Non-goals

No duplicate Security architecture, no project-folder-driven runtime relocation, no new `PVC-*` stage, no implicit `PVC-19`, no autonomous Production mutation, no self-accepted risk and no Security self-authorization.
