# CAPITAL-AI-SEC Work Packages

**Document ID:** `DOC-WP-CAPITAL-AI-SEC-2026-08-31`  
**Project:** `CAPITAL-AI-SEC`  
**Version:** `2.1.1`  
**Status:** `ACTIVE — CROSS-CUTTING SECURITY BACKLOG / NON-AUTHORIZING`  
**Date:** `2026-08-31`  
**Baseline:** `main@8e0e4a541da24ce2e28988e31c9a8bb7e5711a25`  
**Primary Project Value Chain ownership:** `[]`  
**Project routing namespace:** `PVC-01..PVC-18`  
**Roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`

> `SEC-01..SEC-10` are Security coordination labels only. They do not allocate `AUTH-*`, `CTRL-*`, ADR, ESS, PVC, technical VC, IAM, provider or domain authority.

## Common contract

**Entry:** current `main` and open PRs correlated; affected project and project-routing stage known or explicitly BLOCKED; existing authority/control reused; threat/control and expected verification evidence defined.  
**Security action:** define requirement, threat model, test/negative test, finding, handoff and verification gate.  
**Foreign implementation:** do not execute under CAPITAL-AI-SEC. Retain `[SECURITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]` as the Security compatibility marker and add the current repository routing fields `project_namespace: PVC`, `project_stage: PVC-<NN>`, `target_project`, `task`, `reason`, `dependency`, `required_evidence`, `verification_gate`, `status`.  
**Technical stage:** when an existing technical financial `VC-*` stage is relevant, record `technical_namespace` and `technical_stage` separately.  
**Verification:** exact candidate/runtime evidence as appropriate; missing/stale evidence is not PASS.  
**Closure:** `VERIFIED/CLOSED` requires independent Security verification; `ACCEPTED_RISK` requires applicable Human/Owner authority.

## SEC-01 — Threat Modeling

**Owns:** threat inventory, trust boundaries, attack surfaces, affected-project/PVC/technical-stage mapping.  
**Does not own:** target system implementation.

Required output for active P0/P1 threats:

`asset → project namespace/stage → technical namespace/stage where applicable → primary project → threat → existing control → evidence → remediation requirement → verification gate`.

Exit: every active P0/P1 Security finding is traceably mapped and project-routed or explicitly blocked on unresolved ownership.

## SEC-02 — Identity & Access

**Owns:** AuthN/AuthZ/MFA/AAL/session/least-privilege Security requirements and verification.

Reuses:

- `resolveVerifiedIdentity()` / `checkAdminAccess()`;
- existing IAM zone/role contracts;
- native MFA/AAL implementation and tests;
- Human/Owner protected-action boundaries.

Immediate Security items:

- verify protected endpoints against canonical identity and deny paths;
- preserve authentication vs authorization separation;
- track ESS-0020/ADR-0064 lifecycle mismatch without self-promoting either authority;
- verify agent/Systemadmin capabilities cannot create Owner authority;
- route governance-lifecycle clarification through current `CAPITAL-AI-GOV` project semantics before PR readiness.

## SEC-03 — Application/API Security

**Owns:** requirements/tests for input validation, safe output, error handling, browser/API authorization, redirect safety, rate limiting and capability boundaries.

Legacy finding references retained from the pre-sync branch:

- S1-R2-05 Stripe redirect boundary;
- S1-R2-06 entitlement authority;
- S1-R2-09 CSP promotion;
- S1-R2-10 post-deploy demo-billing isolation verification.

Their earlier `DEVELOPMENT`, `SC-MD-SPT` and `SEO-GM` handoff labels remain historical/technical traceability only until explicit current-main `PVC-*` project routing is added.

Exit: protected API/browser capabilities have server-side authorization, directly relevant negative evidence and current project-routing metadata.

## SEC-04 — Data & Secrets

**Owns:** confidentiality/integrity requirements, RLS/grant verification, data provenance Security, PII-minimization Security requirements, secrets/credential exposure controls.

Rules:

- external data remains untrusted until validated;
- missing critical evidence never becomes synthetic success;
- server/service-role paths require application authorization where browser RLS is not the boundary;
- no reusable secrets in repository, logs, reports or model-visible evidence;
- server-only secret names cannot resolve from browser `VITE_*` aliases;
- credential rotation remains protected owner/operations work.

Foreign data-pipeline or domain-schema implementation remains with the current Primary Project Owner.

## SEC-05 — Infrastructure

**Owns:** runtime/container/network/process/recovery Security requirements and verification.

Legacy S1 finding references retained:

- S1-R2-03 Node control-plane convergence;
- S1-R2-04 fatal process handling;
- S1-R2-07 measured recovery/RPO/RTO.

Current-main project routing must resolve these against `CAPITAL-AI-OPS` and the applicable `PVC-*` stage before the handoff is considered refreshed/current. Security may require fail-closed behavior and block verification, but Operations retains implementation/runtime ownership.

## SEC-06 — Supply Chain

**Owns:** Security assurance for dependencies, actions, images, lockfiles, build provenance, artifact integrity, attestation and exact-SHA release identity.

Reuses existing Release/DevelopmentChain controls; creates no second release/deploy path.

Exit: candidate cannot silently weaken trusted checks or promote an unverified artifact; vulnerability severity is correlated to actual applicability.

## SEC-07 — AI / Agent Security

**Owns:** prompt-injection, tool-abuse, agent-authority and untrusted-content requirements/tests.

Mandatory invariants:

- retrieved/tool/inter-agent content is untrusted;
- prompt content cannot override repository authority;
- model/provider identity grants no authority;
- agents cannot self-expand capability or self-authorize protected mutation;
- tool scopes remain least privileged;
- model recommendations are not Human/Owner approval.

Agent/product implementation remains with the agent/domain owner unless the code is an inherently reusable Security control.

## SEC-08 — Security Testing

**Owns:** Security test design and cross-project verification suites/requirements.

Required families as applicable:

- AuthN/AuthZ/MFA/session negative tests;
- browser entitlement/privilege escalation tests;
- malformed/untrusted input tests;
- redirect/SSRF/injection/safe-rendering tests;
- fail-fast/failure-mode tests;
- configuration/integrity/supply-chain checks;
- missing/stale evidence must not become success;
- untrusted content cannot expand agent authority.

Test implementation tightly coupled to foreign code belongs with that target project PR; Security defines expected denial and verifies it.

## SEC-09 — Security Findings

**Owns:** finding lifecycle, routing, severity correlation, remediation requirements and residual-risk record.

Lifecycle:

`DISCOVERED → TRIAGED → CONFIRMED → ROUTED/ASSIGNED → REMEDIATING → IMPLEMENTED → EVIDENCE_READY → VERIFIED → CLOSED`.

Every refreshed project-routed finding must include:

- affected/target project;
- `project_namespace: PVC`;
- `project_stage: PVC-<NN>`;
- technical namespace/stage separately when applicable;
- threat/control;
- severity;
- evidence;
- required remediation;
- verification gate;
- status;
- target roadmap;
- Security handoff compatibility marker.

No P0 may remain unowned. HIGH/CRITICAL protected changes retain applicable Owner gates. Security cannot self-accept risk.

## SEC-10 — Verification

**Owns:** independent Security verification and evidence freshness/current-identity checks.

Evidence precedence:

`runtime → provider/security configuration → negative tests → hosted CI → code → scan → policy/control → roadmap`.

Current verification priorities retained after synchronization:

- S1-R2-11 evidence identity/staleness;
- MFA/AAL authority-lifecycle drift clarification;
- re-correlation of legacy handoffs to current `PVC-*` routing before any renewed `ROUTED`/`VERIFIED` claim.

Exit: every `VERIFIED` claim names exact applicable evidence; stale/missing evidence remains explicit.

## Current handoff re-correlation register

| Source | Pre-sync label | Current requirement | Status |
|---|---|---|---|
| S1-R2-03 | DC-SA / VC-05 | current Primary Project Owner + explicit PVC stage | PVC ENRICHMENT REQUIRED |
| S1-R2-04 | DC-SA / VC-05 | current Primary Project Owner + explicit PVC stage | PVC ENRICHMENT REQUIRED |
| S1-R2-05 | DEVELOPMENT / VC-03 | current Primary Project Owner + explicit PVC stage; technical stage separate | PVC ENRICHMENT REQUIRED |
| S1-R2-06 | SC-MD-SPT / VC-03 | current Primary Project Owner + explicit PVC stage; retain technical owner/stage separately | PVC ENRICHMENT REQUIRED |
| S1-R2-07 | DC-SA / VC-05 | current Primary Project Owner + explicit PVC stage | PVC ENRICHMENT REQUIRED |
| S1-R2-09 | SEO-GM / VC-18 | target project + explicit PVC impact stage | PVC ENRICHMENT REQUIRED |
| S1-R2-10 | DEVELOPMENT / VC-03 | current Primary Project Owner + explicit PVC stage; technical stage separate | PVC ENRICHMENT REQUIRED |
| S1-R2-11 | DC-SA / VC-17 | current Primary Project Owner + explicit PVC stage | PVC ENRICHMENT REQUIRED |
| MFA/AAL lifecycle drift | GOV / VC-02 | `CAPITAL-AI-GOV` + explicit PVC routing | PVC ENRICHMENT REQUIRED |

S1-R2-00 remains merged containment evidence on current `main`; it is not reopened by synchronization.

## PR ownership rule

CAPITAL-AI-SEC PRs contain Security-owned cross-cutting documentation, tests/utilities or inherently reusable Security implementation only.

If remediation primarily changes another project's productive implementation, the PR is owned/prefixed by that target project. Security remains reviewer/verification owner and retains the finding reference.
