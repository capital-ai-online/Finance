# CAPITAL-AI Security

**Project ID:** `CAPITAL-AI-SEC`  
**Canonical project folder:** `docs/projects/security/`  
**Branch project-folder slug:** `security`  
**Role:** cross-cutting Security requirements, findings, testing, bounded remediation and verification  
**Primary Productive PVC ownership:** `[]`  
**Coverage:** `PVC-01` through `PVC-18` as Security overlay only  
**Trust root:** `/AGENTS.md`  
**Implementation authority:** `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` / `CTRL-SEC-BOUNDED-REMEDIATION-001`  
**Component contract:** `ESS-0006 v1.2.0`  
**Status:** ACTIVE PROJECT EXECUTION PROJECTION — NON-AUTHORIZING

## Scope

CAPITAL-AI-SEC owns repository-wide Security requirements, threat analysis, Security testing, finding lifecycle coordination and independent Security verification. Under the existing Development Chain authority and `CTRL-SEC-BOUNDED-REMEDIATION-001`, it may additionally implement the smallest sufficient **Security-primary repository remediation** for a confirmed Security finding.

It does **not** own a productive `PVC-*` stage. A bounded Security fix may nevertheless modify the vulnerable implementation where it actually lives, including a file physically associated with another productive project. File or PVC placement alone does not block an otherwise eligible Security remediation and does not transfer long-term file, Domain or PVC ownership to Security.

The delegation ends where business/product semantics, foreign Architecture Authority or protected external mutation begins. Security implements only a cleanly separable Security portion where possible and routes the remaining owner-specific work to the canonical Primary Owner.

This project folder is organizational navigation only. It does not replace or supersede existing Security authorities, the Governance Control Plane, IAM authorities, ESS/ADR/control identities, Security runtime helpers, Security evidence or target-project Domain ownership.

## Canonical Security sources

The project surface deliberately references the existing Security sources instead of duplicating them:

- [Security Roadmap](../../roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md) — canonical detailed cross-cutting Security roadmap.
- [Security Work Packages](../../roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md) — `SEC-01..SEC-10` execution packages and current routed findings.
- [Security Traceability Matrix](../../traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md) — finding/control/owner/PVC/evidence traceability.
- [Security V2 Validation Evidence](../../evidence/security/CAPITAL_AI_SEC_V2_VALIDATION_2026-08-31.md) — historical exact-candidate validation evidence for PR #631 scope.
- [Technical Security component](../../../src/platform/Security/README.md) — preferred reusable technical Security implementation boundary under ESS-0006.
- [Development Chain Execution Policy](../../governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md) — controlling bounded Security-remediation authority.
- [Project Value Chain](../PROJECT_VALUE_CHAIN.md) — canonical `PVC-01..PVC-18` Primary Owners.
- [Project folder mapping](../README.md) — canonical folder-to-PVC connection.

## Ownership and implementation boundary

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
- bounded Security-primary repository remediation under `CTRL-SEC-BOUNDED-REMEDIATION-001`;
- independent Security verification as a separate evidence/review step.

Eligible bounded remediation includes input validation/sanitization, AuthN/AuthZ hardening inside accepted IAM/policy contracts, Secret-leak prevention, Security headers/CSP/safe defaults, vulnerable dependency and supply-chain remediation, semantically safe dependency upgrades, fail-closed guards, anti-DoS rate/size/resource limits, upload/parser/mail/URL/redirect/SSRF hardening, Security-negative tests, Security audit/evidence instrumentation, workflow hardening, SBOM/provenance/artifact verification controls and removal of clearly unsafe or no-longer-required Security-relevant components.

Security does not own or receive authority for:

- new product features or unrelated business logic;
- permanent target-project/PVC ownership;
- changes to business or foreign Architecture Authority beyond the minimum bounded Security correction;
- Governance authority lifecycle decisions outside its delegated remediation scope;
- accepted-risk decisions reserved to Human/Owner authority;
- protected Production/IAM-admin/Billing/money/Entitlement/DNS/Secret/destructive-data mutation without separate authority;
- EventMesh, data, scoring, billing or release architecture;
- a second IAM, Policy, Audit, Governance, Release, Deployment, Security-Control or Secrets authority;
- weakening Security gates, suppressing findings or lowering audit/security thresholds.

## Current cross-project execution model

A confirmed finding first resolves current Project/PVC/Primary Owner and applicable ADR/ESS/contracts. Then:

```text
Security finding
→ classify risk + root cause
→ correlate ownership / authority / current writers
→ pure bounded Security remediation?
  → YES: CAPITAL-AI-SEC implements on a fresh Security branch
  → NO: SEC implements only a cleanly separable Security portion and routes the Domain remainder
→ positive + negative Security tests
→ separate verification / evidence step
→ normal PR / hosted-CI / Human-CODEOWNER merge lifecycle
```

Security handoff remains available for the non-eligible or non-separable remainder:

`[SECURITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

Project ownership is resolved only from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Existing technical `VC-*` stages remain separately namespaced and never become project ownership by implication.

A pure eligible Security remediation uses the `CAPITAL-AI-SEC` project identity and a fresh `security`-slug branch/PR even when it touches a foreign-located file. The affected Primary Owner/PVC and its contracts remain explicit correlation/evidence inputs. An artificial foreign-project branch is not required solely because the vulnerable file is `package.json`, a lockfile, `server/**`, `.github/workflows/**` or another productive path.

## Independent verification and finding closure

Implementation and verification may both be performed within `CAPITAL-AI-SEC`, but they are distinct steps. Implementation evidence alone cannot produce `VERIFIED` or `CLOSED`.

`EVIDENCE_READY != VERIFIED`.

Finding closure requires reproducible positive and negative tests against the original Security invariant and, where relevant, hosted/runtime/provider evidence bound to the correct identity. Human/CODEOWNER or affected Primary Owner verification remains additional where the risk or an existing contract requires it. Security cannot self-accept residual risk.

## P0/P1 path

For confirmed `CRITICAL`/`HIGH` findings, CAPITAL-AI-SEC may immediately implement an eligible bounded repository fix on a fresh Security branch when the correction is technically unambiguous, does not expand Domain semantics, requires no protected external mutation and current-main/open-writer correlation is conflict-free or explicitly sequenced.

PR-creation approval, hosted CI, Human/CODEOWNER merge, Release, Deployment and Production gates remain unchanged.

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
3. an eligible bounded Security-primary remediation can be implemented by Security even in a foreign-located repository file;
4. file changes do not transfer long-term Domain/PVC ownership;
5. mixed Domain/architecture work is split at the ownership boundary rather than hidden in a Security slice;
6. protected external mutation and Human/CODEOWNER/Release/Production gates remain separate and unchanged;
7. Security verification never treats implementation, missing or stale evidence as PASS;
8. `EVIDENCE_READY != VERIFIED` and closure is based on a separate reproducible evidence/review step;
9. merged/closed Security work claims are terminalized and cannot remain active parallel writers;
10. detailed findings, handoffs and evidence remain traceable to the existing canonical Security roadmap/work-package/traceability surfaces.

## Non-goals

No duplicate Security architecture, no project-folder-driven runtime relocation, no new `PVC-*` stage, no implicit `PVC-19`, no autonomous protected Production mutation, no self-accepted risk, no Security self-authorization, no feature-development pretext and no parallel IAM/Policy/Audit/Release/Deployment/Governance control plane.
