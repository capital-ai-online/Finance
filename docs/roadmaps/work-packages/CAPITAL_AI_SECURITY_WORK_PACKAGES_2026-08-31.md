# CAPITAL-AI-SEC Work Packages

**Document ID:** `DOC-WP-CAPITAL-AI-SEC-2026-08-31`  
**Project:** `CAPITAL-AI-SEC`  
**Version:** `2.1.2`  
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
**Foreign implementation:** do not execute under CAPITAL-AI-SEC. Retain `[SECURITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]` as the Security marker, record `[CROSS_PROJECT_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]` for repository routing compatibility, and add `project_namespace: PVC`, `project_stage: PVC-<NN>`, `target_project`, `task`, `reason`, `dependency`, `required_evidence`, `verification_gate`, `status`.  
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
- route Governance lifecycle clarification to `CAPITAL-AI-GOV / PVC-05`.

## SEC-03 — Application/API Security

**Owns:** requirements/tests for input validation, safe output, error handling, browser/API authorization, redirect safety, rate limiting and capability boundaries.

Current routed findings:

- S1-R2-05 → `CAPITAL-AI-OPS / PVC-02` — server-owned Stripe redirect boundary;
- S1-R2-06 → `CAPITAL-AI-OPS / PVC-02` — parent entitlement inventory and server-side enforcement coordination; child capability handoffs go to the actual Primary Owner when discovered;
- S1-R2-09 → `CAPITAL-AI-OPS / PVC-08` — production CSP promotion; `CAPITAL-AI-SEO` remains compatibility/evidence dependency only;
- S1-R2-10 → `CAPITAL-AI-OPS / PVC-08` — post-deploy production reachability evidence.

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

Current routed findings:

- S1-R2-03 → `CAPITAL-AI-OPS / PVC-06` — Node/control-plane version convergence;
- S1-R2-04 → `CAPITAL-AI-OPS / PVC-04` — fail-fast process behavior and supervisor recovery;
- S1-R2-07 → `CAPITAL-AI-OPS / PVC-08` — measured recovery/RPO/RTO.

Security may require fail-closed behavior and block verification, but Operations retains implementation/runtime ownership.

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

Every refreshed project-routed finding includes:

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
- Security and repository handoff markers.

No P0 may remain unowned. HIGH/CRITICAL protected changes retain applicable Owner gates. Security cannot self-accept risk.

## SEC-10 — Verification

**Owns:** independent Security verification and evidence freshness/current-identity checks.

Evidence precedence:

`runtime → provider/security configuration → negative tests → hosted CI → code → scan → policy/control → roadmap`.

Current verification priorities:

- S1-R2-09/10/11 evidence return from their Primary Owners;
- MFA/AAL authority-lifecycle reconciliation under Governance;
- R2-03/04/05/06/07 target-owned remediation evidence when implemented.

Exit: every `VERIFIED` claim names exact applicable evidence; stale/missing evidence remains explicit.

## Current handoff register — PVC correlated

| Source | Security marker | project_stage | Primary target | Target roadmap/reference | Status |
|---|---|---|---|---|---|
| S1-R2-03 | `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-06]` | `PVC-06` | CAPITAL-AI-OPS | `docs/projects/operations/ROADMAP.md` (target canonical OPS roadmap) | REFERRED_NOT_EXECUTED |
| S1-R2-04 | `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-04]` | `PVC-04` | CAPITAL-AI-OPS | `docs/projects/operations/ROADMAP.md` | REFERRED_NOT_EXECUTED |
| S1-R2-05 | `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-02]` | `PVC-02` | CAPITAL-AI-OPS | `docs/projects/operations/ROADMAP.md` | REFERRED_NOT_EXECUTED |
| S1-R2-06 | `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-02]` | `PVC-02` | CAPITAL-AI-OPS | `docs/projects/operations/ROADMAP.md`; child handoffs as capabilities are inventoried | REFERRED_NOT_EXECUTED / ACTIVE |
| S1-R2-07 | `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]` | `PVC-08` | CAPITAL-AI-OPS | `docs/projects/operations/ROADMAP.md` | REFERRED_NOT_EXECUTED |
| S1-R2-09 | `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]` | `PVC-08` | CAPITAL-AI-OPS | `docs/projects/operations/ROADMAP.md`; SEO roadmap supplies evidence context | WAITING_FOR_EVIDENCE |
| S1-R2-10 | `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]` | `PVC-08` | CAPITAL-AI-OPS | `docs/projects/operations/ROADMAP.md` | WAITING_FOR_EVIDENCE |
| S1-R2-11 | `[SECURITY_HANDOFF -> CAPITAL-AI-DATA | VC-10]` | `PVC-10` | CAPITAL-AI-DATA | `docs/projects/data/ROADMAP.md` (target canonical DATA roadmap) | WAITING_FOR_EVIDENCE |
| MFA/AAL lifecycle drift | `[SECURITY_HANDOFF -> CAPITAL-AI-GOV | VC-05]` | `PVC-05` | CAPITAL-AI-GOV | `docs/projects/governance/ROADMAP.md` | REFERRED_NOT_EXECUTED / CLARIFY |

Each row also has the repository compatibility marker `[CROSS_PROJECT_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]` with the same numeric `PVC-*` routing stage and `project_namespace: PVC`.

### Cross-project dependency notes

- **R2-06:** `CAPITAL-AI-OPS / PVC-02` owns the parent controlled-implementation inventory. If the inventory identifies Agent Client or FinTech-owned productive code, the remediation becomes a child handoff to `CAPITAL-AI-CLIENT / PVC-01` or the applicable `CAPITAL-AI-FINTECH / PVC-12..17` stage. Security does not absorb that work.
- **R2-09:** `CAPITAL-AI-SEO` may supply CSP compatibility/violation evidence but owns no productive PVC stage; production promotion remains `CAPITAL-AI-OPS / PVC-08`.
- **R2-11:** `CAPITAL-AI-DATA / PVC-10` owns evidence identity/freshness semantics. If correction requires PR/trace tooling code, that code is a secondary `CAPITAL-AI-OPS` implementation handoff under the applicable OPS stage.
- **MFA/AAL drift:** `CAPITAL-AI-GOV / PVC-05` owns lifecycle reconciliation; Security cannot self-promote ESS/ADR/registry state.

S1-R2-00 remains merged containment evidence on current `main`; it is not reopened by this correlation.

## PR ownership rule

CAPITAL-AI-SEC PRs contain Security-owned cross-cutting documentation, tests/utilities or inherently reusable Security implementation only.

If remediation primarily changes another project's productive implementation, the PR is owned/prefixed by that target project. Security remains reviewer/verification owner and retains the finding reference.
