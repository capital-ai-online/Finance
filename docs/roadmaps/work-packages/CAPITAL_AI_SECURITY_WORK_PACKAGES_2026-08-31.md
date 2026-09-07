# CAPITAL-AI-SEC Work Packages

**Document ID:** `DOC-WP-CAPITAL-AI-SEC-2026-08-31`  
**Project:** `CAPITAL-AI-SEC`  
**Version:** `2.2.0`  
**Status:** `ACTIVE — CROSS-CUTTING SECURITY BACKLOG / NON-AUTHORIZING`  
**Date:** `2026-09-07`  
**Baseline:** `main@09ab297c1fd954c37fa2cb8b2fba718cb58402cb`  
**Primary Productive PVC ownership:** `[]`  
**Project routing namespace:** `PVC-01..PVC-18`  
**Roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`

> `SEC-01..SEC-10` and `SEC-SOTA-*` are Security coordination labels only. They do not allocate repository Authority, ADR/ESS ownership, IAM authority, release authority or productive PVC ownership.

## Common contract

**Entry:** current `main` and open PRs correlated; affected project and PVC known or explicitly unresolved; current authority/control reused; threat/control and expected evidence defined.  
**Security action:** define requirement, threat model, test/negative test, finding, owner routing and independent verification gate.  
**Foreign implementation:** do not execute under CAPITAL-AI-SEC. Route directly to the current Primary Owner using canonical project/PVC mapping and record target project, PVC, task, reason, dependency, required evidence, verification gate and status. Withdrawn post-PVC handoff overlays are not current routing mechanisms.  
**Verification:** exact candidate/runtime/provider evidence as appropriate; missing/stale/wrong-identity/`NOT_AVAILABLE` evidence is not PASS.  
**Closure:** `VERIFIED/CLOSED` requires independent Security evidence; `ACCEPTED_RISK` requires applicable Human/Owner authority.

External standards and guidance are `ADVISORY_NON_AUTHORIZING`. They may inform verification objectives but do not create repository Authority or mandatory controls. Current `/AGENTS.md` excludes NIST publications/frameworks from the CURRENT repository governance baseline.

## Immediate execution packages

### `SEC-SOTA-01` — SOTA baseline and roadmap convergence

**Priority:** P0  
**Owner:** CAPITAL-AI-SEC  
**State:** `IMPLEMENTED_BRANCH / PR GATE OPEN`

Implemented:

- current external SOTA baseline in `docs/evidence/security/CAPITAL_AI_SEC_SOTA_BASELINE_2026-09-07.md`;
- OWASP Top 10:2025, ASVS 5.0.0, GenAI/Agentic/ACS/MCP guidance, SLSA v1.2 and CISA Secure by Design mapped to existing `SEC-01..SEC-10` workstreams;
- external material explicitly advisory/non-authorizing;
- `SEC-ASSESS-ALIGN` corrected to `DONE_MAIN` after merged PR #766;
- CRA reporting readiness represented only as a dependency on `CAPITAL-AI-COMP` for applicability/legal scope;
- project and detailed Security roadmaps synchronized to current main.

### `SEC-VERIFY-R2-04` — fatal-process current-main re-verification

**Priority:** P0  
**Owner:** CAPITAL-AI-SEC for independent verification  
**Productive owner:** CAPITAL-AI-OPS / PVC-04; post-deploy evidence PVC-08  
**State:** `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN`

Evidence: `docs/evidence/security/S1_R2_04_FATAL_PROCESS_CURRENT_MAIN_REVERIFICATION_2026-09-07.md`.

Verified from current-main source/test contract: uncaught exceptions and unhandled rejections latch fatal state; fatal state projects readiness as not-ready; repeated fatal events do not initiate duplicate shutdown; fatal termination preserves non-zero-exit intent; repository tests encode these behaviors.

Not claimed: hosted tests PASS (`NOT_RUN` in this connector session), exact deployed supervisor/restart behavior or destructive production fault injection. Runtime gates remain OPS/PVC-08.

### `SEC-SOTA-02` — AI/Agent/MCP control inventory

**Priority:** P0  
**Owner:** CAPITAL-AI-SEC for requirements/threats/testing/findings  
**State:** `READY`

Required output:

`surface → trust boundary → current authority path → untrusted input/tool risk → current control → evidence → gap → productive owner/PVC → verification gate`.

Minimum coverage: prompt/indirect injection; authority/capability expansion; delegated permissions; tool side effects/least privilege; session/context isolation; memory/retrieval poisoning where applicable; inter-agent trust; MCP AuthN/AuthZ/validation/session/tool-chain isolation; inspectability/traceability of actor/model/tool/decision/authorization/runtime identity where applicable.

### `SEC-SOTA-03` — supply-chain assurance inventory

**Priority:** P0  
**Owner:** CAPITAL-AI-SEC for assurance/verification  
**State:** `READY`

Required output:

`source/dependency/build/artifact/release surface → existing repository control → exact evidence → advisory SLSA/OWASP theme → actual gap → owner/PVC → verification gate`.

Inventory lockfiles/dependency controls, GitHub Action trust/pinning, source revision identity, build identity, artifact/container provenance/attestations/SBOM where present and release/deployment exact-SHA binding. Reuse existing Development Chain and Release controls; do not create a parallel release/provenance system.

### `SEC-SOTA-04` — application/API ASVS 5.0 verification matrix

**Priority:** P1  
**State:** `READY AFTER P0 INVENTORIES`

Map repository-relevant ASVS objectives to existing tests/evidence. Framework mapping alone is never PASS. Productive gaps route to actual Primary Owners.

### `SEC-COMP-CRA-01` — CRA applicability/reporting readiness dependency

**Priority:** time-sensitive dependency  
**Security state:** `WAITING_FOR_COMP_APPLICABILITY_DECISION`

External CRA reporting obligations begin `2026-09-11` for in-scope products with digital elements. `CAPITAL-AI-COMP` owns applicability/legal-obligation determination. Security supplies technical vulnerability/incident evidence requirements after that determination and does not self-authorize Compliance work.

## SEC-01 — Threat Modeling

Owns threat inventory, trust boundaries, attack surfaces and owner/PVC correlation. Exit: every active P0/P1 finding is traceably owner-routed or explicitly blocked.

## SEC-02 — Identity & Access

Owns AuthN/AuthZ/MFA/AAL/session/least-privilege requirements and verification. Preserve authentication vs authorization separation; verify protected deny paths and agent/system capabilities cannot create Owner authority; include delegated permission and MCP/session isolation where applicable.

## SEC-03 — Application/API Security

Owns requirements/tests for input validation, safe output, error handling, browser/API authorization, redirect safety, rate limiting and capability boundaries. ASVS 5.0 is advisory verification context, not repository Authority.

## SEC-04 — Data & Secrets

Owns confidentiality/integrity requirements, RLS/grant verification, provenance, PII minimization and secret/credential exposure controls. External data remains untrusted; missing evidence cannot become success; no reusable secrets in repository/log/model-visible evidence; credential rotation remains protected owner/operations work.

## SEC-05 — Infrastructure

Owns runtime/container/network/process/recovery Security requirements and verification. Current routed findings include S1-R2-03, S1-R2-04 and S1-R2-07. Operations retains productive runtime ownership.

## SEC-06 — Supply Chain

Owns assurance for dependencies, source, actions, images, lockfiles, builds, provenance, artifact integrity, attestations and exact-SHA release identity. Reuse current Development Chain/Release controls; advisory SLSA/OWASP themes guide gap analysis only.

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

Current priorities: exact post-deploy S1-R2-04 return, User Lifecycle provider residuals, S1-R2-09/10/11 returns, then SOTA inventory findings.

## Current owner-routing register

| Source | PVC | Primary target | Status / Security gate |
|---|---|---|---|
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
