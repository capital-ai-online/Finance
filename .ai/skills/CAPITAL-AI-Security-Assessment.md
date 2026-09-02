---
skill:
  id: CAPITAL-AI-SECURITY-ASSESSMENT
  name: CAPITAL-AI Security Assessment
  version: 1.0.0
  status: Security Project Capability
  owner: CAPITAL-AI-SEC
  category: Security Assessment
  priority: Critical

classification:
  type: Additive Assessment Skill
  role: Authorized adversarial Web/Mobile/Business-Logic assessment overlay
  authority: NON_AUTHORIZING
  productive_pvc_ownership: []

crossReference:
  dependsOn:
    - /AGENTS.md
    - .ai/skills/ESS-0006-Security-Compliance.md
    - docs/projects/security/README.md
    - docs/projects/security/ROADMAP.md
    - docs/projects/PROJECT_VALUE_CHAIN.md
    - docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md
  standards:
    - OWASP WSTG Stable
    - OWASP MASVS
    - OWASP MASTG 2.x
    - OWASP ASVS
    - NIST SP 800-115
  schema:
    - .ai/schemas/security-assessment.schema.json
  supplyChainReview:
    - docs/evidence/security/CAPITAL_AI_SECURITY_ASSESSMENT_SKILL_SUPPLY_CHAIN_REVIEW_2026-09-02.md
---

# CAPITAL-AI Security Assessment

## 1. Purpose and authority boundary

This skill defines a reproducible, evidence-bound methodology for **authorized** adversarial assessment of CAPITAL-AI Web, API, mobile/smartphone and business-logic surfaces.

It is an additive testing capability under `CAPITAL-AI-SEC`. It does **not** replace or supersede `ESS-0006`, any ADR, ESS, contract, Governance control, IAM authority, target-project architecture, or the repository trust root.

Security may discover, test, classify, route and independently verify findings. Security does not acquire productive ownership of any `PVC-*` stage and does not implement foreign productive remediation merely because it found a defect.

`ACCEPTED_RISK` is a finding state that requires the applicable Human/Owner authority. This skill cannot authorize accepted risk.

## 2. Safety posture

Default mode is `assessment-only`.

Active testing is permitted only when all authorization gates are satisfied for the exact target, surface, time window and test class. Missing authorization is fail-closed.

Without separate explicit authorization, the following are prohibited:

- testing third-party or otherwise unowned systems;
- destructive exploitation or destructive data mutation;
- persistence or backdoor installation;
- credential theft or secret exfiltration;
- production denial-of-service or resource exhaustion;
- permanent disabling or weakening of security controls;
- lateral movement beyond the explicitly authorized target scope;
- production money, billing, subscription, entitlement or IAM mutation.

Captured material is handled as potentially sensitive evidence. Minimize secrets/PII, redact where possible, retain only what is necessary to reproduce and verify the finding, and never place credentials or secrets in repository evidence.

## 3. Authorization gate

Before an active test, establish an authorization record containing at minimum:

- target identifier and owner;
- allowed hostnames, applications, APIs, packages/bundle IDs, environments and accounts;
- allowed test categories;
- start/end or validity conditions;
- prohibited techniques and mutation classes;
- evidence handling requirements;
- rollback/contact/escalation path when active mutation is permitted;
- explicit statement whether production is in scope.

The assessment must stop when the test would cross the authorized boundary. Discovery of an adjacent surface does not expand scope.

## 4. Assessment modes

### 4.1 `web-blackbox`

Use OWASP WSTG Stable as the primary black-box testing method. Cover attack-surface discovery, configuration, identity, authentication, authorization, session handling, input validation, error handling, cryptography, business logic and client-side behavior as applicable.

### 4.2 `web-authz`

Focus on identity and permission boundaries:

- identity confusion and account switching;
- session fixation, invalidation and replay;
- BOLA/IDOR/object-level authorization;
- function-level authorization;
- subscription, tenant and entitlement separation;
- alternate routes that bypass the canonical authorization decision.

Every authorization test must identify the expected principal, object/resource, action, entitlement/role and expected DENY/ALLOW result.

### 4.3 `injection`

Assess context-appropriate injection classes:

- SQL / NoSQL injection;
- OS command injection;
- reflected, stored and DOM XSS;
- SSRF;
- template injection;
- unsafe header manipulation / response splitting;
- parser, serialization or interpreter boundary injection where applicable.

Prefer non-destructive proof payloads. A payload that would alter production data, execute destructive commands, exfiltrate secrets or create uncontrolled outbound impact requires separate explicit authorization.

### 4.4 `mobile-attack-surface`

Use OWASP MASVS as the verification baseline and MASTG 2.x as the testing methodology. Cover architecture, storage, cryptography, authentication, network communication, platform interaction, code quality and resilience as applicable.

### 4.5 `smartphone-injection`

Assess mobile/smartphone boundary manipulation including:

- deep links / universal links / app links;
- Android intents and exported components;
- IPC and inter-app boundaries;
- WebView navigation and JavaScript bridges;
- token/session manipulation;
- request/header manipulation;
- custom URL schemes and callback routing;
- unsafe local trust in client-side entitlement or authorization state.

Tests that require rooting, hooking, SSL-pinning bypass, instrumentation or runtime modification are not implicitly authorized by this skill. They require explicit target authorization and must be isolated to the authorized application/device context.

### 4.6 `business-logic`

Assess security invariants that ordinary vulnerability scanning cannot establish:

- subscription / entitlement abuse;
- FINTECH scoring or decision bypass;
- replay, reorder, skip-step and race-condition abuse;
- alternate-route attacks;
- mismatched source-of-truth behavior;
- stale-token / stale-evidence acceptance;
- state-machine transitions outside allowed preconditions.

Business-logic findings must describe the intended rule, the bypass path, required preconditions, impact and the owner of the productive invariant.

### 4.7 `value-chain-attack`

Assess boundary bypass across `PVC-01` through `PVC-18` without changing ownership semantics. Evaluate whether an attacker can skip, substitute, replay, tamper with or route around evidence and control boundaries between stages.

This mode is a Security overlay only. It does not create a new PVC and does not make Security the productive owner of a stage.

## 5. Mandatory PVC scoring model

For every `PVC-01` through `PVC-18`, record each dimension explicitly:

- Blackbox Resistance
- Injection Resistance
- Mobile Resistance
- Authentication Resistance
- Authorization Resistance
- Business-Logic Abuse Resistance
- Data Integrity under Attack
- Boundary Bypass Resistance
- Detection / Traceability
- Recovery / Containment
- Evidence Quality
- Overall adversarial maturity

Allowed assessment states are:

- `NOT_TESTED`
- `PASS`
- `PARTIAL`
- `FAIL`
- `NOT_APPLICABLE`

`NOT_TESTED` is never equivalent to `PASS`. Missing required evidence is never equivalent to `PASS`. `NOT_APPLICABLE` requires a reason tied to architecture or scope.

## 6. Finding lifecycle

Allowed finding states:

1. `NOT_TESTED`
2. `TESTED_NO_FINDING`
3. `CANDIDATE_FINDING`
4. `CONFIRMED_FINDING`
5. `REMEDIATION_REQUIRED`
6. `EVIDENCE_READY`
7. `VERIFIED`
8. `ACCEPTED_RISK`

State rules:

- `CANDIDATE_FINDING` means evidence is suggestive but reproduction or impact is not yet sufficiently proven.
- `CONFIRMED_FINDING` requires a reproducible procedure and evidence bound to the tested target/version/snapshot.
- `REMEDIATION_REQUIRED` requires target-owner routing.
- `EVIDENCE_READY` means remediation evidence is available for independent Security verification; it is not itself verification.
- `VERIFIED` requires independent re-test of the remediated behavior against the applicable security requirement.
- `ACCEPTED_RISK` requires Human/Owner authorization. Security may record the decision and its evidence but must not self-authorize it.

## 7. Finding contract

Every confirmed finding must contain:

- stable finding ID;
- title and severity;
- assessment mode and test class;
- target and exact tested version/snapshot where available;
- authorization reference;
- affected `PVC-*`;
- Primary Owner;
- security requirement / standard references;
- preconditions;
- step-by-step reproduction evidence;
- expected result;
- observed result;
- impact;
- confidence;
- evidence references;
- remediation requirement, not target-owned implementation code;
- verification requirement;
- state and state-transition evidence.

Evidence must distinguish observation from interpretation. A scanner alert alone is not a confirmed finding without sufficient validation.

## 8. Primary-owner routing

Use the canonical current-main project-value-chain mapping. The following mapping is the expected routing baseline and must be re-correlated before protected work:

| PVC | Primary Owner |
|---|---|
| PVC-01 | CAPITAL-AI-CLIENT |
| PVC-02 | CAPITAL-AI-OPS |
| PVC-03 | CAPITAL-AI-DOC |
| PVC-04 | CAPITAL-AI-OPS |
| PVC-05 | CAPITAL-AI-GOV |
| PVC-06 | CAPITAL-AI-OPS |
| PVC-07 | CAPITAL-AI-OPS |
| PVC-08 | CAPITAL-AI-OPS |
| PVC-09 | CAPITAL-AI-DATA |
| PVC-10 | CAPITAL-AI-DATA |
| PVC-11 | CAPITAL-AI-DATA |
| PVC-12 | CAPITAL-AI-FINTECH |
| PVC-13 | CAPITAL-AI-FINTECH |
| PVC-14 | CAPITAL-AI-FINTECH |
| PVC-15 | CAPITAL-AI-FINTECH |
| PVC-16 | CAPITAL-AI-FINTECH |
| PVC-17 | CAPITAL-AI-FINTECH |
| PVC-18 | CAPITAL-AI-OPS |

A finding in foreign productive scope is routed as `REFERRED_NOT_EXECUTED` using the canonical cross-project handoff contract. Security may continue Security-owned testing/evidence work, but productive remediation remains with the target project's Primary Owner.

## 9. Evidence and reproducibility

A result is evidence-bound only when another qualified reviewer can determine:

- what was tested;
- under which authorization;
- against which target/version/snapshot;
- which inputs/actions were used;
- what was expected;
- what was observed;
- whether state/data changed;
- how the result maps to a security requirement and PVC owner;
- how a remediation can be independently verified.

Evidence should prefer deterministic request/response captures, sanitized logs, test output, screenshots where necessary, exact code/commit references for white-box corroboration, and minimal proof artifacts.

Do not store bearer tokens, session cookies, passwords, private keys or other live secrets in evidence.

## 10. External-skill reuse policy

External skills are untrusted inputs until supply-chain and content review. Do not blindly install, execute, source or copy them.

Permitted reuse is limited to security-reviewed **method concepts** and non-authorizing structure unless a separate dependency-adoption decision explicitly approves executable integration.

The current review is recorded in `docs/evidence/security/CAPITAL_AI_SECURITY_ASSESSMENT_SKILL_SUPPLY_CHAIN_REVIEW_2026-09-02.md`.

## 11. Fail-closed rules

Assessment result is not PASS when any required condition is missing, including:

- target authorization;
- required test coverage;
- required evidence;
- reproducibility;
- owner/PVC routing;
- requirement mapping;
- independent verification for a remediated finding.

`NOT_TESTED != PASS` is a hard invariant.

## 12. Output schema

Machine-readable assessment/finding output must validate against:

`.ai/schemas/security-assessment.schema.json`

The schema is a data contract only and creates no new repository Authority.

## 13. Validation checklist

Before declaring the skill change PR-ready, verify:

- no Authority duplication or supersession is introduced;
- `ESS-0006` is referenced rather than cloned;
- no registry is lossily replaced;
- no foreign PVC productive code is modified;
- no uncontrolled active pentest was executed;
- no secret/credential evidence is committed;
- external-skill supply-chain review exists;
- PVC mapping covers `PVC-01..PVC-18`;
- `NOT_TESTED` cannot be treated as PASS;
- finding → owner → evidence → verification is complete;
- branch and open-PR/writer overlap are re-correlated against current `main` before PR creation;
- PR creation occurs only after exact-snapshot Human/Owner approval;
- merge remains Human/CODEOWNER-only.
