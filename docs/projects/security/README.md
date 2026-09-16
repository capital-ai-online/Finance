# CAPITAL-AI Security

**Project ID:** `CAPITAL-AI-SEC`  
**Canonical project folder:** `docs/projects/security/`  
**Branch project-folder slug:** `security`  
**Role:** cross-cutting Security requirements, threat/risk analysis, controls, testing, findings and independent verification  
**Primary Productive PVC ownership:** `[]`  
**Coverage:** `PVC-01` through `PVC-18` as Security overlay only  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Development policy:** `GOV-DYNAMIC-SCOPE-RESOLUTION-02` (`SECURITY_FOUNDATION_FIRST`) plus the remaining exact eight-policy suite  
**Component contract:** `ESS-0006 v1.2.0`  
**Status:** ACTIVE PROJECT EXECUTION PROJECTION — NON-AUTHORIZING

## Scope

CAPITAL-AI-SEC owns repository-wide Security requirements, threat/risk analysis, Security Architecture constraints, Security testing, finding lifecycle and independent Security verification within its delegated subject matter.

Security deliberately evaluates in the direction:

```text
Threat
→ Risk
→ Trust
→ Controls
→ Platform / Domain
→ Capability
→ User
```

This is the `SECURITY_FOUNDATION_FIRST` exception defined by `GOV-DYNAMIC-SCOPE-RESOLUTION-02`. User-visible Top-Layer prioritization cannot override Security controls or Security Authority.

CAPITAL-AI-SEC owns **no productive `PVC-*` stage**. A Security finding does not transfer the affected project's PVC, Domain or implementation ownership to Security. If remediation implementation belongs to another project, SEC creates an owner-correct handover rather than silently taking over the foreign implementation.

## Canonical Security sources

- [Security Roadmap](../../roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md) — detailed cross-cutting Security roadmap/work graph.
- [Security Work Packages](../../roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md) — Security work-package/evidence surface.
- [Security Traceability Matrix](../../traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md) — finding/control/owner/PVC/evidence traceability.
- [Technical Security component](../../../src/platform/Security/README.md) — reusable technical Security implementation boundary under ESS-0006.
- [Project Value Chain](../PROJECT_VALUE_CHAIN.md) — canonical `PVC-01..PVC-18` Primary Owners.
- [Project folder mapping](../README.md) — canonical folder-to-PVC connection and preserved presentation metadata.
- [Development policies](../../governance/development-policies/) — sole repository development-execution guideline.

`docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` and `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` are historical compatibility identities only and grant no current Security remediation delegation after activation of the eight-policy suite.

## Ownership and implementation boundary

Security owns or constrains, within applicable accepted contracts:

- Threat Modeling and risk analysis;
- Security Architecture Requirements;
- IAM/AuthN/AuthZ/MFA/AAL Security requirements and verification;
- Application/API and Data/Secrets Security requirements and verification;
- Infrastructure and Supply Chain Security requirements and verification;
- AI/Agent Security requirements and verification;
- Security test/negative-test design;
- Security findings lifecycle;
- independent Security verification/evidence.

Security does not receive automatic authority for:

- foreign product/business implementation;
- permanent target-project/PVC ownership;
- foreign Domain/Architecture changes;
- accepted-risk decisions reserved to Human/Owner authority;
- protected Production/IAM-admin/Billing/money/Entitlement/DNS/Secret/destructive-data mutation without separate authority;
- a second IAM, Policy, Audit, Governance, Release, Deployment, EventMesh, Data, Scoring or Secrets authority;
- weakening Security gates, suppressing findings or lowering audit/security thresholds.

## Owner-correct Security flow

```text
Security finding / requirement
→ Threat + Risk + Trust + Control analysis
→ resolve CURRENT_MAIN project / PVC / Primary Owner / applicable contracts
→ is implementation canonically SEC-owned?
  → YES: execute as an atomic SEC work package under the eight-policy suite
  → NO: materialize owner-correct handover to the implementation owner
→ implementation evidence
→ independent Security verification / evidence
→ PR/review/merge gates from GOV-PR-CLOSURE-AUTHORITY-08
```

The handover is correlation-ID-based and includes exact trigger, completed Security scope, remaining implementation scope, dependencies, evidence, exit gate and continuation condition. A foreign-located file alone neither transfers ownership to SEC nor blocks SEC from analyzing/verifying it.

## Independent verification and finding closure

Implementation evidence alone cannot produce `VERIFIED` or `CLOSED`.

`EVIDENCE_READY != VERIFIED`.

Finding closure requires reproducible positive/negative evidence against the Security invariant and, where relevant, hosted/runtime/provider evidence bound to the correct identity. Missing or stale evidence is never `PASS`; Security cannot self-accept residual risk.

## P0/P1 behavior

CRITICAL/HIGH findings may immediately become highest-priority Security analysis/control work where the applicable contracts require it, but foreign implementation still follows owner-correct handover. No severity classification authorizes direct-main mutation, review bypass, self-merge or protected external mutation.

## Validation / Definition of Done

The Security project surface remains valid when:

1. it remains a non-authorizing cross-cutting navigation/evidence layer;
2. CAPITAL-AI-SEC owns no productive `PVC-*` stage;
3. Security direction remains `SECURITY_FOUNDATION_FIRST`;
4. foreign implementation produces an owner-correct handover rather than silent ownership takeover;
5. Security verification never treats implementation, missing or stale evidence as PASS;
6. `EVIDENCE_READY != VERIFIED`;
7. protected Human/CODEOWNER/external mutation boundaries remain preserved;
8. no parallel Security/Governance/IAM/Release/Deployment control plane is introduced.
