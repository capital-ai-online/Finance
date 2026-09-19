---
skill:
  id: CAPITAL-AI-SECURITY-ASSESSMENT
  name: CAPITAL-AI Security Assessment
  version: 1.2.0
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
    - docs/projects/README.md
    - docs/projects/security/README.md
    - docs/projects/security/ROADMAP.md
    - docs/projects/PROJECT_VALUE_CHAIN.md
  assessmentMethodologies:
    authority: ADVISORY_NON_AUTHORIZING
    sources:
      - OWASP WSTG Stable
      - OWASP MASVS
      - OWASP MASTG 2.x
      - OWASP ASVS
  schema:
    - .ai/schemas/security-assessment.schema.json
  supplyChainReview:
    - docs/evidence/security/CAPITAL_AI_SECURITY_ASSESSMENT_SKILL_SUPPLY_CHAIN_REVIEW_2026-09-02.md
---

# CAPITAL-AI Security Assessment

## 1. Purpose and authority boundary

This skill defines a reproducible, evidence-bound methodology for **authorized** adversarial assessment of CAPITAL-AI Web, API, mobile/smartphone and business-logic surfaces.

It is an additive testing capability under `CAPITAL-AI-SEC`. It does **not** replace or supersede `/AGENTS.md`, `CTRL-SEC-BOUNDED-REMEDIATION-001`, `ESS-0006`, any ADR, ESS, Governance control, IAM authority, target-project architecture, or current project/PVC ownership mapping.

External assessment methodologies referenced by this skill are **advisory/non-authorizing**. They may guide test design and evidence quality, but they do not create repository Authority, CI gates, mandatory remediation, ownership transfer or accepted-risk authority.

Security may discover, test, classify, route and independently verify findings. Under the separately authoritative `CTRL-SEC-BOUNDED-REMEDIATION-001`, Security may also implement the smallest sufficient Security-primary repository remediation when all eligibility boundaries are met. This assessment skill does not itself grant that implementation authority.

Security does not acquire productive ownership of any `PVC-*` stage by finding, patching or verifying a defect. File/PVC placement alone is not an execution DENY; business semantics, foreign Architecture Authority, protected external mutation and parallel-control-plane creation remain hard ownership/authority boundaries.

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

Use OWASP WSTG Stable as an advisory black-box testing methodology. Cover attack-surface discovery, configuration, identity, authentication, authorization, session handling, input validation, error handling, cryptography, business logic and client-side behavior as applicable.

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

Use OWASP MASVS and MASTG 2.x as advisory verification/testing methodologies. Cover architecture, storage, cryptography, authentication, network communication, platform interaction, code quality and resilience as applicable.

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

Business-logic findings must describe the intended rule, the bypass path, required preconditions, impact and the owner of the productive invariant. A remediation that would alter the intended business rule or productive semantics is not a bounded Security remediation and must be routed to the responsible Primary Owner/Architecture Authority.

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

Allowed finding states remain:

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
- `REMEDIATION_REQUIRED` requires explicit remediation execution classification: `SECURITY_BOUNDED` when `CTRL-SEC-BOUNDED-REMEDIATION-001` is satisfied, otherwise `OWNER_ROUTED` for the non-eligible/non-separable portion. The finding-state schema does not itself authorize execution.
- `EVIDENCE_READY` means remediation evidence is available for a separate Security verification step; it is not itself verification, even when Security authored the patch.
- `VERIFIED` requires a separated re-test of the remediated behavior against the original applicable Security requirement and reproducible positive/negative evidence; hosted/runtime evidence is additionally required where applicable.
- `ACCEPTED_RISK` requires Human/Owner authorization. Security may record the decision and its evidence but must not self-authorize it.

`EVIDENCE_READY != VERIFIED` is a hard invariant.

## 7. Finding contract

Every confirmed finding must contain:

- stable finding ID;
- title and severity;
- assessment mode and test class;
- target and exact tested version/snapshot where available;
- authorization reference;
- affected `PVC-*`;
- Primary Owner;
- security requirement / methodology references;
- preconditions;
- step-by-step reproduction evidence;
- expected result;
- observed result;
- impact;
- confidence;
- evidence references;
- remediation requirement;
- remediation execution classification (`SECURITY_BOUNDED` or `OWNER_ROUTED`) with boundary rationale;
- affected Domain/PVC ownership retained after any Security-authored patch;
- verification requirement;
- state and state-transition evidence.

Evidence must distinguish observation from interpretation. A scanner alert alone is not a confirmed finding without sufficient validation.

## 8. Primary-owner correlation and remediation execution

Use only the canonical current-main project-folder and Project Value Chain mapping from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. The following mapping is an expected projection and must be re-correlated before protected work:

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
| PVC-09 | CAPITAL-AI-FINTECH |
| PVC-10 | CAPITAL-AI-FINTECH |
| PVC-11 | CAPITAL-AI-FINTECH |
| PVC-12 | CAPITAL-AI-FINTECH |
| PVC-13 | CAPITAL-AI-FINTECH |
| PVC-14 | CAPITAL-AI-FINTECH |
| PVC-15 | CAPITAL-AI-FINTECH |
| PVC-16 | CAPITAL-AI-FINTECH |
| PVC-17 | CAPITAL-AI-FINTECH |
| PVC-18 | CAPITAL-AI-OPS |

`CAPITAL-AI-DATA` is retained only as historical/compatibility terminology and owns no current productive PVC stage.

A finding in a foreign productive file/path is **not automatically** `REFERRED_NOT_EXECUTED`. After current-main/open-writer/authority correlation, classify remediation as follows:

- `SECURITY_BOUNDED`: the primary and immediate purpose is Security; the patch is the smallest sufficient remediation; no business/product semantics, foreign Architecture Authority, productive PVC ownership, protected external mutation, Security-gate weakening or parallel control plane is introduced. CAPITAL-AI-SEC may implement it on a fresh Security branch under `CTRL-SEC-BOUNDED-REMEDIATION-001`, even if the affected file is `server/**`, `.github/workflows/**`, `package.json`, a lockfile or another foreign-located path.
- `OWNER_ROUTED`: the required change crosses a business/domain/architecture/protected-mutation boundary or is not cleanly separable. Security may implement a separable bounded Security portion and records the remainder as owner dependency.

The compatibility marker `REFERRED_NOT_EXECUTED` is retained for the owner-routed remainder and for Security findings that are not eligible for Security implementation. No withdrawn post-PVC handoff/routing overlay is required or authorized.

A Security-authored remediation never changes the canonical Primary Owner or long-term file/PVC ownership. A pure Security remediation uses `CAPITAL-AI-SEC` project identity and a fresh `security`-slug branch/PR; the affected Primary Owner/PVC and contracts remain explicit evidence inputs.

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
- how a remediation can be independently re-tested;
- whether implementation and verification evidence are distinct.

Evidence should prefer deterministic request/response captures, sanitized logs, test output, screenshots where necessary, exact code/commit references for white-box corroboration, and minimal proof artifacts.

Do not store bearer tokens, session cookies, passwords, private keys or other live secrets in evidence.

## 10. External-skill reuse policy

External skills and methodologies are untrusted inputs until supply-chain/content review. Do not blindly install, execute, source or copy them.

Permitted reuse is limited to security-reviewed **method concepts** and non-authorizing structure unless a separate dependency-adoption decision explicitly approves executable integration. Methodology reuse never creates repository Authority by itself.

The current review is recorded in `docs/evidence/security/CAPITAL_AI_SECURITY_ASSESSMENT_SKILL_SUPPLY_CHAIN_REVIEW_2026-09-02.md`.

## 11. Fail-closed rules

Assessment result is not PASS when any required condition is missing, including:

- target authorization;
- required test coverage;
- required evidence;
- reproducibility;
- owner/PVC correlation;
- remediation-boundary classification when remediation is required;
- requirement mapping;
- separated verification for a remediated finding.

A remediation eligibility decision is DENY/owner-routed when Security purpose, ownership/architecture boundary or protected-mutation status is ambiguous.

`NOT_TESTED != PASS` and `EVIDENCE_READY != VERIFIED` are hard invariants.

## 12. Output schema

Machine-readable assessment/finding output must validate against:

`.ai/schemas/security-assessment.schema.json`

The schema is a data contract only and creates no new repository Authority. Any additional remediation-execution metadata that is not represented by the current schema remains evidence metadata until separately adopted into that data contract; the schema is not silently widened by this skill.

## 13. Validation checklist

Before declaring the skill change PR-ready, verify:

- no Authority duplication or supersession is introduced;
- `/AGENTS.md` and current project/PVC mapping remain the routing source;
- `CTRL-SEC-BOUNDED-REMEDIATION-001` and `ESS-0006` are referenced rather than cloned;
- external methodologies are explicitly advisory/non-authorizing;
- no withdrawn post-PVC routing contract is required;
- no registry is lossily replaced;
- Security may modify a foreign-located file only for an eligible bounded Security remediation;
- file changes do not transfer productive PVC/Domain ownership;
- a finding cannot be used as a feature/refactor pretext;
- no protected Production/IAM/Billing/Secret/DNS/destructive mutation is performed without separate Authority;
- no Security/IAM/Policy/Audit/Release/Deployment/Governance control plane is duplicated;
- no uncontrolled active pentest was executed;
- no secret/credential evidence is committed;
- external-skill supply-chain review exists;
- PVC mapping covers `PVC-01..PVC-18`;
- `NOT_TESTED` cannot be treated as PASS;
- `EVIDENCE_READY` cannot be treated as `VERIFIED`;
- finding → remediation classification → implementation/owner dependency → separate evidence → verification is complete;
- branch and open-PR/writer overlap are re-correlated against current `main` before PR creation;
- PR creation occurs only after exact-snapshot Human/Owner approval;
- merge remains Human/CODEOWNER-only.
