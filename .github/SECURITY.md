# Security Policy

This document defines the repository-facing vulnerability reporting, triage, response, coordinated-disclosure, and verification process for CAPITAL-AI.

It is an operational Security handling surface under the existing CAPITAL-AI authority model. It does **not** create a second Security, Compliance, IAM, Incident, Risk, Release, Deployment, or Governance control plane. Where this file conflicts with a higher or more specific effective authority, the current repository Trust Root (`/AGENTS.md`), effective Governance controls, accepted ADR/ESS contracts, applicable law/contract, and explicit Human/Owner decisions prevail.

## Supported Security Scope

Security reports are in scope when they affect the actively maintained CAPITAL-AI repository, its current production application, or an explicitly supported release and concern one or more of the following:

- web application and browser security;
- API and server-side security;
- authentication, authorization, MFA/AAL, session handling, and identity boundaries;
- user data, secrets, credentials, tokens, cryptographic material, and privacy-relevant data flows;
- Supabase, Render, Stripe, DNS, CI/CD, GitHub Actions, container/runtime, dependency, and supply-chain security where they are part of CAPITAL-AI's supported architecture;
- AI/LLM, Agent, MCP, plugin/connector, tool-execution, prompt-injection, capability, authorization, and cross-agent trust boundaries;
- financial-data integrity, scoring/evidence integrity, entitlement/billing boundaries, or other defects that could materially alter protected application decisions or security-relevant state;
- repository governance or automation defects that could bypass Human/Owner approval, protected-mutation, merge, deployment, least-privilege, or audit controls;
- availability defects caused by a security weakness, including abuse-resistant resource exhaustion or denial-of-service conditions.

The current `main` branch is the primary maintained repository line. The actively deployed production release is also in scope when it differs from current `main`. Historical branches, archived builds, superseded releases, retired components, and unsupported experiments are not guaranteed to receive security fixes unless a current effective authority explicitly states otherwise.

## Reporting a Security Vulnerability

**Do not open a public issue, discussion, pull request, or other public channel for an unremediated vulnerability, exploit path, credential exposure, or sensitive security evidence.**

Use the most privileged private reporting path available to you:

1. Maintainers, repository administrators, or security managers with access to GitHub Security Advisories should create or use a private repository security advisory.
2. Other authorized collaborators should contact the repository Owner or designated Security maintainer through an already-authorized private channel and request a protected Security handling thread.
3. If no private channel is available, send only a non-sensitive request to establish one. Do **not** include exploit details, secrets, personal data, production tokens, private keys, or reusable credentials in an untrusted or public channel.

When the repository is public and GitHub provider readback confirms private vulnerability reporting is enabled, reporters should prefer the repository's **Report a vulnerability** flow so details stay non-public. While the repository is private, or if that provider feature is unavailable, the protected Security Advisory / authorized private-channel paths above remain the fallback. This policy never treats public Issues or Pull Requests as acceptable channels for unremediated vulnerability details.

### Include in the report

Provide enough information to reproduce and assess the issue safely:

- concise vulnerability title and affected component/surface;
- repository path, route, API, workflow, agent/tool capability, or runtime surface involved;
- affected commit, branch, release, or deployed identity when known;
- prerequisites and attacker capabilities;
- safe, minimal reproduction steps or proof of concept;
- observed and expected behavior;
- confidentiality, integrity, availability, authorization, data-integrity, financial-integrity, or control-plane impact;
- evidence of exploitation or exposure, if any;
- proposed mitigation, if known;
- whether any secret, token, user data, regulated data, or production resource may already be compromised.

Do not include more sensitive data than is necessary to prove the finding. Redact reusable credentials and unnecessary personal data.

## Security Ownership and Authority Boundaries

`CAPITAL-AI-SEC` owns repository-wide Security requirements, Security findings, threat analysis, Security testing, bounded Security-primary repository remediation where currently authorized, and independent Security verification.

This Security policy does not transfer productive Project Value Chain (`PVC-*`) ownership. Product/business semantics remain with the canonical Primary Owner of the affected project. Compliance applicability and regulatory assessment remain with `CAPITAL-AI-COMP`. Governance authority remains with the effective Trust Root and `CAPITAL-AI-GOV` authorities. Legal applicability and accepted-risk decisions remain with the competent Human/Legal/Owner authority where required.

A confirmed vulnerability may be implemented directly by `CAPITAL-AI-SEC` only when it qualifies for the existing bounded Security-remediation authority. A Security finding must not be used as a pretext for unrelated feature work, broad refactoring, foreign-domain authority, or a parallel control plane.

Protected external mutations remain separately authorized. A vulnerability report, severity classification, emergency condition, repository commit, branch, pull request, CI result, Security advisory, or this document alone does **not** authorize production deployment, IAM-admin changes, billing/money movement, DNS changes, secret rotation, destructive data mutation, provider mutation, merge, or release actions outside the currently effective authorization path.

## Severity Classification

CAPITAL-AI uses the qualitative severity bands from **CVSS v4.0 (FIRST)** as a common technical vocabulary:

| Severity | CVSS v4.0 reference | CAPITAL-AI interpretation |
|---|---:|---|
| **Critical** | 9.0–10.0 | Plausible or demonstrated compromise of a high-trust boundary, unauthenticated/low-complexity control bypass, remote code/tool execution with material authority, cross-tenant/user compromise, credential/secret compromise with broad blast radius, protected mutation bypass, supply-chain compromise, or material integrity loss affecting production/security/financial decisions. |
| **High** | 7.0–8.9 | Serious confidentiality, integrity, authorization, availability, agent/tool, or data-integrity impact requiring prompt remediation, but with materially narrower prerequisites, blast radius, or exploitability than Critical. |
| **Medium** | 4.0–6.9 | Security weakness with meaningful but bounded impact, significant prerequisites, limited reach, or defense-in-depth degradation that does not presently expose a Critical/High trust boundary. |
| **Low** | 0.1–3.9 | Minor security weakness, limited hardening gap, or low-impact condition with no current evidence of meaningful protected-boundary compromise. |
| **None / Informational** | 0.0 / N/A | No exploitable vulnerability demonstrated; may still produce a hardening, documentation, or evidence follow-up. |

CVSS is a prioritization input, not the sole decision mechanism. CAPITAL-AI may raise urgency based on current Threat and Environmental context, active exploitation, internet exposure, user-data sensitivity, secret exposure, privilege boundary, AI/Agent capability escalation, financial/data-integrity impact, supply-chain reach, exploit automation, recovery difficulty, or blast radius.

A lower CVSS score must not downgrade a finding when the actual CAPITAL-AI environment demonstrates higher material risk. Conversely, missing evidence must not be treated as proof of safety.

## Response and Remediation Objectives

The following are mandatory internal Security handling objectives. They are operational targets, not a public contractual SLA and do not override law, regulatory duties, contracts, Human/Owner gates, or protected-mutation controls.

The clock starts when the report is visible to an authorized CAPITAL-AI Security maintainer.

| Severity | Acknowledge | Initial triage/classification | Containment decision | Remediation objective |
|---|---:|---:|---:|---:|
| **Critical** | ≤ 4 hours | ≤ 8 hours | ≤ 24 hours | Target ≤ 72 hours for the smallest safe fix or compensating control; unresolved blockers require explicit Owner-visible escalation. |
| **High** | ≤ 1 business day | ≤ 2 business days | ≤ 3 business days | Target ≤ 7 calendar days; unresolved blockers require explicit escalation and tracked owner/evidence state. |
| **Medium** | ≤ 2 business days | ≤ 5 business days | As required by exposure | Target ≤ 30 calendar days or an explicitly scheduled roadmap item with owner and exit evidence. |
| **Low** | ≤ 5 business days | ≤ 10 business days | Normally not required | Target ≤ 90 calendar days, accepted deferral by competent Owner, or closure as non-exploitable/informational with evidence. |

For all severities:

- `NOT RUN`, missing evidence, stale evidence, or inability to reproduce is never silently converted to `PASS`;
- a remediation target missed because authority, external-provider access, deployment, credential, or runtime evidence is unavailable remains open and explicitly blocked/routed;
- accepted residual risk requires the competent Human/Legal/Owner authority; Security and agents do not self-accept risk;
- where a legal, contractual, regulatory, or incident-notification deadline is stricter, the stricter applicable requirement controls.

## Critical / High Incident Escalation

A confirmed **Critical** or **High** vulnerability is treated as an incident candidate when there is evidence or credible indication of active exploitation, unauthorized access, secret compromise, privilege/capability escalation, protected-mutation bypass, material user-data exposure, supply-chain compromise, or material integrity impact.

Security must then:

1. preserve minimal necessary evidence without copying reusable secrets or unnecessary personal data;
2. identify the affected Project/PVC/Primary Owner and current production/runtime identity;
3. determine whether immediate containment is required;
4. route any protected external mutation to its authorized Owner/execution path rather than self-authorizing it;
5. implement the smallest eligible repository-side Security remediation under the existing bounded-remediation control when permitted;
6. require independent verification against the original Security invariant before `VERIFIED` or `CLOSED` is claimed;
7. trigger Compliance/Legal reassessment when reporting, privacy, regulatory, contractual, or notification obligations may apply.

Emergency Security handling does not waive Human/CODEOWNER merge requirements, PR-creation rules, or separate production-mutation authorization unless a then-effective higher/scoped authority explicitly replaces that exact gate.

## Secret and Credential Exposure

If a report suggests exposure of a password, API key, signing key, session secret, OAuth credential, private key, provider token, database credential, webhook secret, passkey material, or equivalent reusable credential:

- do not paste the secret into issues, PRs, chat logs, evidence files, CI logs, screenshots, or reports;
- identify the credential by provider/purpose and redact its value;
- treat repository history, CI artifacts, build logs, caches, deployment artifacts, and downstream consumers as potentially affected until assessed;
- request revoke/rotate/replace through the authorized secret/IAM/provider mutation path;
- verify post-rotation invalidation and affected-system recovery where evidence is available;
- never treat removal from the latest Git tree as proof that a previously exposed secret is safe.

## Safe Testing Rules

Security research and validation must minimize impact and remain within explicitly authorized assets and accounts.

Do not:

- access, alter, download, retain, or disclose other users' data beyond the minimum evidence strictly required;
- perform destructive testing against production data or resources;
- execute denial-of-service, load amplification, resource exhaustion, or traffic flooding against production;
- conduct social engineering, phishing, credential stuffing, physical attacks, or attacks against third parties;
- pivot from a proof of vulnerability into unrelated systems, accounts, providers, tenants, or data;
- use a discovered vulnerability to perform financial transactions, billing changes, entitlement changes, production mutations, or persistent privilege escalation;
- publish unremediated exploit details, reusable secrets, or sensitive production evidence through public channels.

If safe reproduction requires production-impacting behavior, stop and request an authorized test/containment path.

## Remediation and Verification Lifecycle

The expected handling flow is:

```text
REPORTED
→ TRIAGED
→ CONFIRMED or NOT_REPRODUCED / NOT_A_VULNERABILITY
→ SEVERITY + OWNER/PVC IDENTIFIED
→ CONTAINMENT / OWNER ROUTING AS NEEDED
→ REMEDIATING
→ EVIDENCE_READY
→ INDEPENDENT SECURITY VERIFICATION
→ VERIFIED
→ CLOSED
```

Implementation evidence alone is not verification.

**`EVIDENCE_READY != VERIFIED`.**

Closure requires reproducible evidence that the original Security invariant is restored. Where applicable this includes positive and negative tests, exact branch/PR identity, hosted CI, runtime/provider identity, and post-deployment evidence. Human/CODEOWNER or affected Primary Owner review remains mandatory where current authority requires it.

## Coordinated Disclosure

CAPITAL-AI follows coordinated disclosure for confirmed vulnerabilities.

- Vulnerability details remain private while triage, containment, remediation, and verification are active unless disclosure is required by law, regulation, contract, or an authorized Owner decision.
- Reporters are asked to provide a reasonable remediation window and coordinate publication timing with the Security Owner.
- Public disclosure should occur only after the affected release/control has been remediated or an explicit Owner-approved disclosure decision has been made with residual risk understood.
- Published advisories should minimize exploit enablement, never expose reusable credentials or unnecessary personal data, and clearly identify affected/fixed versions or commit/release identities where appropriate.
- A Security advisory, changelog entry, CVE request, customer notice, regulator notice, or public incident communication requires its applicable Owner/Legal/Compliance process; Security does not infer those obligations from severity alone.

When a reporter follows this policy in good faith, CAPITAL-AI will treat the report as a Security-coordination activity. This policy does not authorize testing outside explicitly permitted assets, accounts, or environments and does not waive third-party terms, law, or contractual restrictions.

## Security / Compliance / Governance Correlation

This policy is intentionally subordinate to and aligned with the current repository model:

- `/AGENTS.md@CURRENT_MAIN` — sole repository-wide AI/development execution authority, including branch/PR/merge/protected-mutation and bounded self-healing rules;
- accepted Security/ADR/ESS/contracts — subject-matter constraints only in their declared scope; historical DevelopmentChain authority IDs are traceability aliases that resolve back to `/AGENTS.md@CURRENT_MAIN`;
- `.ai/skills/ESS-0006-Security-Compliance.md` — Security/Compliance component and authority boundaries;
- `.ai/skills/ESS-0019-Universal-AI-Agent-Control-Plane.md` — provider-neutral AI Agent capability/risk/audit boundaries;
- `docs/projects/security/README.md` — `CAPITAL-AI-SEC` ownership and independent-verification model;
- `docs/projects/compliance/README.md` — `CAPITAL-AI-COMP` applicability/evidence/Legal-handoff boundary;
- `docs/projects/governance/README.md` — `CAPITAL-AI-GOV` Governance boundary;
- `docs/architecture/ROADMAP.md` — current Security execution roadmap and finding lifecycle.

External guidance such as CVSS, OWASP, CISA, NIST, SLSA, or vendor security recommendations is advisory input unless separately adopted by an effective CAPITAL-AI authority. External guidance does not independently create repository authority.

## Policy Maintenance

This file should be reviewed when any of the following materially changes:

- Security/Compliance/Governance ownership or authority boundaries;
- supported production/release model;
- vulnerability intake channel;
- severity/incident handling model;
- protected mutation or emergency-remediation policy;
- applicable legal, regulatory, contractual, or customer-notification requirements;
- AI/Agent/MCP/tool trust boundaries;
- security verification and disclosure process.

Changes to this policy follow the normal CAPITAL-AI branch, correlation-gated PR creation, hosted-CI, Human/CODEOWNER merge, and evidence lifecycle. Direct edits to `main` are prohibited.
