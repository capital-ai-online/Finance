# CAPITAL-AI-SEC Work Packages

**Document ID:** `DOC-WP-CAPITAL-AI-SEC-2026-08-31`  
**Project:** `CAPITAL-AI-SEC`  
**Version:** `2.3.0`  
**Status:** `ACTIVE — CROSS-CUTTING SECURITY BACKLOG / NON-AUTHORIZING`  
**Date:** `2026-09-07`  
**Baseline:** `main@96119f958cacbf35614747380a066b87fdb1ee40`  
**Primary Productive PVC ownership:** `[]`  
**Project routing namespace:** `PVC-01..PVC-18`  
**Roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`

> `SEC-01..SEC-10` and `SEC-SOTA-*` are Security coordination labels only. They do not allocate repository Authority, ADR/ESS ownership, IAM authority, release authority or productive PVC ownership.

## Common contract

**Entry:** current `main` and open PRs correlated; affected project and PVC known or explicitly unresolved; current authority/control reused; threat/control and expected evidence defined.  
**Security action:** define requirement, threat model, test/negative test, finding, owner routing and independent verification gate.  
**Foreign implementation:** do not execute under CAPITAL-AI-SEC. Route directly to the current Primary Owner using canonical project/PVC mapping and record target project, PVC, task, reason, dependency, required evidence, verification gate and status.  
**Verification:** exact branch/runtime/provider evidence as appropriate; missing/stale/wrong-identity/`NOT_AVAILABLE` evidence is not PASS.  
**Closure:** `VERIFIED/CLOSED` requires independent Security evidence; `ACCEPTED_RISK` requires applicable Human/Owner authority.

External standards and guidance are `ADVISORY_NON_AUTHORIZING`. They may inform verification objectives but do not create repository Authority or mandatory controls. Current `/AGENTS.md` excludes NIST publications/frameworks from the CURRENT repository governance baseline.

## Immediate execution packages

### `SEC-SOTA-01` — SOTA baseline and roadmap convergence

**Priority:** P0  
**Owner:** CAPITAL-AI-SEC  
**State:** `DONE_MAIN`

PR #832 merged the SOTA baseline. PR #837 subsequently synchronized the active Security status projections and passed final-head Governance, Container Security and Class-D `build-and-test` before Human merge. Historical execution evidence is not rewritten to fake a newer verification baseline.

### `SEC-VERIFY-R2-04` — fatal-process current-main re-verification

**Priority:** P0  
**Owner:** CAPITAL-AI-SEC for independent verification  
**Productive owner:** CAPITAL-AI-OPS / PVC-04; post-deploy evidence PVC-08  
**State:** `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN`

Evidence: `docs/evidence/security/S1_R2_04_FATAL_PROCESS_CURRENT_MAIN_REVERIFICATION_2026-09-07.md`.

Repository source/test contract is verified; exact deployed supervisor/restart/readiness fault behavior remains open. Generic successful deployment/identity evidence does not close this runtime gate.

### `SEC-SOTA-02` — AI/Agent/MCP control inventory

**Priority:** P0  
**Owner:** CAPITAL-AI-SEC for requirements/threats/testing/findings  
**State:** `INVENTORY_IMPLEMENTED_BRANCH / FINDINGS_ROUTED / PR GATE OPEN`

Evidence: `docs/evidence/security/CAPITAL_AI_SEC_SOTA02_AI_AGENT_MCP_CONTROL_INVENTORY_2026-09-07.md`.

Required output is materialized as:

`surface → trust boundary → current authority path → untrusted input/tool risk → current control → evidence → gap → productive owner/PVC → verification gate`.

Coverage includes prompt/indirect injection, authority/capability expansion, delegated permissions, tool side effects/least privilege, session/context isolation, retrieval poisoning, inter-agent trust, MCP AuthN/AuthZ/session/tool-chain boundaries and inspectability of actor/model/tool/decision/authorization/runtime identity.

Existing Control Plane reused rather than duplicated: `/AGENTS.md`, ESS-0019, ADR-0058/0059, AI Agent Trust Boundaries/Threat Model, `agentIam.ts`, `providerProfile.ts`, PolicyGate, audited execution adapters, Supervisor approved-action path and actual `src/services/agentTools/*` surfaces.

#### Routed `SEC-SOTA-02` findings

| ID | Security finding | Primary productive owner / PVC | Required return evidence |
|---|---|---|---|
| `SEC-SOTA02-F01` | AI Chat indirect prompt injection: retrieved repository text is appended to trusted system instruction; caller history can manufacture assistant-role context | `CAPITAL-AI-FINTECH / PVC-15`; CLIENT/PVC-01 dependency | data/instruction separation + malicious retrieval/history negative tests + proof no tool/authority escalation |
| `SEC-SOTA02-F02` | Documentary maintenance control loop can auto-dispatch Draft-PR creation without current exact Human PR-creation approval | `CAPITAL-AI-DOC / PVC-03` | approval-ready stop + exact main/head/scope/title Human approval before dispatch |
| `SEC-SOTA02-F03` | Documentary real Git mutation path uses synchronous Agent policy checks without durable ADR-0059-grade authorization/outcome evidence at real host | `CAPITAL-AI-DOC / PVC-03` | attributable durable auth/outcome evidence across actor/app/agent/session/request/capability/tool/branch/commit/PR |
| `SEC-SOTA02-F04` | external MCP/connector host permissions/session isolation are not independently proven; `.mcp.json` executable identity is mutable supply-chain input | `CAPITAL-AI-OPS / PVC-02` | host AuthN/AuthZ/tool-grant/session/read-only readback; executable identity assessed in `SEC-SOTA-03` |
| `SEC-SOTA02-F05` | current ESS-0018/ADR-0051 retain stale `CLAUDE.md` authority wording | `CAPITAL-AI-GOV / PVC-05` | current Trust Root/stable authority references without semantic control weakening |
| `SEC-SOTA02-F06` | AI Chat history/session provenance is caller-supplied and not independently attestable | `CAPITAL-AI-CLIENT / PVC-01`; FINTECH/PVC-15 dependency | explicit stateless or server-attested session contract + context-substitution tests |

Explicit non-findings:

- no in-app MCP server is required by current accepted contracts; absence is `NOT_APPLICABLE`, not a backlog gap;
- no productive direct bypass caller was found for the two Supabase Admin write tools;
- no direct agent-to-agent capability delegation was found in inspected FinTech parallel orchestrators;
- Systemadmin replay fields are wired through the real audited caller and are not reopened;
- retired M10 / `AUTHORIZE_PR_CI` is historical only and is not a current gap.

No foreign productive remediation is included in this Security package.

### `SEC-SOTA-03` — supply-chain assurance inventory

**Priority:** P0  
**Owner:** CAPITAL-AI-SEC for assurance/verification  
**State:** `READY`

Required output:

`source/dependency/build/artifact/release surface → existing repository control → exact evidence → advisory SLSA/OWASP theme → actual gap → owner/PVC → verification gate`.

Inventory lockfiles/dependency controls, GitHub Action trust/pinning, source revision identity, build identity, artifact/container provenance/attestations/SBOM where present and release/deployment exact-SHA binding. Reuse current Development Chain/Release controls. The executable-identity portion of `SEC-SOTA02-F04` is an input here; do not duplicate its external host authorization finding.

### `SEC-SOTA-04` — application/API ASVS 5.0 verification matrix

**Priority:** P1  
**State:** `READY AFTER P0 INVENTORIES`

Map repository-relevant ASVS objectives to existing tests/evidence. Framework mapping alone is never PASS. Productive gaps route to actual Primary Owners.

### `SEC-COMP-CRA-01` — CRA applicability/reporting readiness dependency

**Priority:** time-sensitive dependency  
**Security state:** `WAITING_FOR_COMP_APPLICABILITY_DECISION`

`CAPITAL-AI-COMP` owns applicability/legal-obligation determination. Security supplies technical vulnerability/incident evidence requirements after that determination and does not self-authorize Compliance work.

## SEC-01 — Threat Modeling

Owns threat inventory, trust boundaries, attack surfaces and owner/PVC correlation. Exit: every active P0/P1 finding is traceably owner-routed or explicitly blocked.

## SEC-02 — Identity & Access

Owns AuthN/AuthZ/MFA/AAL/session/least-privilege requirements and verification. Preserve authentication vs authorization separation; verify protected deny paths and agent/system capabilities cannot create Owner authority; include delegated permission and MCP/session isolation where applicable.

## SEC-03 — Application/API Security

Owns requirements/tests for input validation, safe output, error handling, browser/API authorization, redirect safety, rate limiting and capability boundaries. ASVS 5.0 is advisory verification context, not repository Authority.

## SEC-04 — Data & Secrets

Owns confidentiality/integrity requirements, RLS/grant verification, provenance, PII minimization and secret/credential exposure controls. External data remains untrusted; missing evidence cannot become success; no reusable secrets in repository/log/model-visible evidence; credential rotation remains protected owner/operations work.

## SEC-05 — Infrastructure

Owns runtime/container/network/process/recovery Security requirements and verification. Operations retains productive runtime ownership.

## SEC-06 — Supply Chain

Owns assurance for dependencies, source, actions, images, lockfiles, builds, provenance, artifact integrity, attestations and exact-SHA release identity. Reuse current Development Chain/Release controls.

## SEC-07 — AI / Agent Security

Owns prompt-injection, tool abuse, delegated authority, MCP and untrusted-content requirements/tests. Retrieved/tool/inter-agent content is untrusted; prompt/model identity cannot override authority; agents cannot self-expand capabilities; tools remain least privileged; side effects require appropriate authorization.

## SEC-08 — Security Testing

Owns Security test design and independent/cross-project verification requirements: AuthN/AuthZ/MFA/session negative tests, entitlement escalation, malformed/untrusted input, redirect/SSRF/injection/safe rendering, fail-fast/failure modes, configuration/integrity/supply chain, stale-evidence denial and agent authority-boundary tests as applicable.

## SEC-09 — Security Findings

Owns finding lifecycle, routing, severity correlation, remediation requirements and residual-risk record.

`DISCOVERED → TRIAGED → CONFIRMED → OWNER/PVC IDENTIFIED → REMEDIATING → IMPLEMENTED → EVIDENCE_READY → VERIFIED → CLOSED`.

No P0 may remain unowned. Security cannot self-accept risk.

## SEC-10 — Verification

Owns independent verification and evidence freshness/current-identity checks.

Evidence precedence: `runtime → provider/security configuration → negative tests → hosted CI → code → scan → policy/control → roadmap`.

Current priorities include exact S1-R2-04 runtime return and the newly routed `SEC-SOTA02-*` owner returns. Inventory completion does not equal finding closure.

## Current owner-routing register

| Source | PVC | Primary target | Status / Security gate |
|---|---|---|---|
| SEC-SOTA02-F01 | PVC-15 (+ PVC-01 dependency) | CAPITAL-AI-FINTECH / CAPITAL-AI-CLIENT | owner remediation → indirect-injection/session negative tests |
| SEC-SOTA02-F02 | PVC-03 | CAPITAL-AI-DOC | owner remediation → exact Human PR-gate evidence |
| SEC-SOTA02-F03 | PVC-03 | CAPITAL-AI-DOC | owner remediation → durable mutation audit evidence |
| SEC-SOTA02-F04 | PVC-02 | CAPITAL-AI-OPS | host readback/evidence → independent SEC verification; executable identity to SOTA-03 |
| SEC-SOTA02-F05 | PVC-05 | CAPITAL-AI-GOV | authority wording correction → governance/security re-correlation |
| SEC-SOTA02-F06 | PVC-01 (+ PVC-15 dependency) | CAPITAL-AI-CLIENT / CAPITAL-AI-FINTECH | session/history contract evidence → negative tests |
| S1-R2-03 | PVC-06 | CAPITAL-AI-OPS | owner remediation → exact toolchain verification |
| S1-R2-04 | PVC-04 / PVC-08 evidence | CAPITAL-AI-OPS | repository contract verified; post-deploy supervisor/readiness evidence open |
| S1-R2-05 | PVC-02 | CAPITAL-AI-OPS | owner remediation → redirect DENY verification |
| S1-R2-06 parent | applicable OPS stage | CAPITAL-AI-OPS | parent evidence; children route by capability owner |
| S1-R2-07 | PVC-08 | CAPITAL-AI-OPS | measured recovery evidence required |
| S1-R2-09 | PVC-08 | CAPITAL-AI-OPS | CSP evidence required |
| S1-R2-10 | PVC-08 | CAPITAL-AI-OPS | production reachability evidence required |
| S1-R2-11 | PVC-10 | CAPITAL-AI-DATA | freshness/wrong-identity evidence required |
| MFA/AAL lifecycle | PVC-05 where governance lifecycle resolution is required | CAPITAL-AI-GOV | lifecycle clarification; no SEC self-promotion |
| CRA applicability/readiness | applicable Compliance mapping | CAPITAL-AI-COMP | applicability/legal scope decision required before SEC technical verification |

## PR ownership rule

CAPITAL-AI-SEC PRs contain Security-owned cross-cutting documentation, evidence, tests/utilities or inherently reusable Security implementation only. If remediation primarily changes another project's productive implementation, the PR belongs to that target project; Security remains requirements/testing/verification owner.

---

## SEC-WEB-HARDENING-01 — Public Website & Secure Deployment Convergence

**Priority:** P0/P1  
**Security Owner:** CAPITAL-AI-SEC  
**State:** MATERIALIZED / IMPLEMENTATION_NOT_STARTED  
**Fresh Human/Owner direction:** 2026-09-20  
**Materialization baseline:** main@e86955225887bb7f34036c175ad1da89b8aec14d  
**Detailed package:** docs/projects/security/work-packages/SEC_WEB_HARDENING_01_PUBLIC_WEBSITE_SECURE_DEPLOYMENT.md

This package protects the rebuilt public website and its deployment chain without creating a second Security or Release architecture. It decomposes into SEC-WEB-00/10/20/30/40/50 and carries SEC-WEB-F01..F30. P0 starts with exact-current-main attack-surface readback, OCI/GHCR digest convergence, one verified production artifact, client/build/container secret exposure gates and current OAuth/session negative tests.

Primary implementation routing:

- CAPITAL-AI-OPS / PVC-07 and PVC-08: signed artifact, registry/deploy identity, readiness, rollback, runtime and production correlation;
- CAPITAL-AI-OPS / PVC-02 where controlled API/CI implementation is affected;
- CAPITAL-AI-FE: public landing/browser/CSP presentation implementation without productive PVC ownership;
- CAPITAL-AI-CLIENT / PVC-01 where client/session semantics are affected;
- CAPITAL-AI-GOV / PVC-05: optional review/CODEOWNER provider enforcement decision;
- CAPITAL-AI-COMP: supply-chain/compliance requirement/evidence overlay;
- CAPITAL-AI-QM: independent assurance.

Security remains requirement/finding/testing/verification authority. EVIDENCE_READY != VERIFIED. The package does not itself mutate Production, IAM, DNS, Secrets, Billing, database state or GitHub Rulesets.

