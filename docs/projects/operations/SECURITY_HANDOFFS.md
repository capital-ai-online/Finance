# CAPITAL-AI-SEC → CAPITAL-AI-OPS Security Handoffs

**Source project:** `CAPITAL-AI-SEC`  
**Source PR:** `#631`  
**Merged main:** `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`  
**Target project:** `CAPITAL-AI-OPS`  
**Target roadmap:** `docs/projects/operations/ROADMAP.md`  
**Status:** ACCEPTED FOR OPS PLANNING — NOT SECURITY VERIFIED

## Contract

Security owns Security requirements, threats/control definitions, findings, negative-test expectations and independent verification. OPS owns productive implementation and runtime/provider evidence only within its own PVC scope.

This document does not authorize Production mutation, Accepted Risk, Security closure, or implementation in foreign PVC stages.

## SEC-FIND-S1-R2-03 — Node control-plane convergence

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-06]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-06]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-06`
- **target_project:** `CAPITAL-AI-OPS`
- **task:** converge `.nvmrc`, package engine policy and control-plane Node references on approved Node 24.20.0 identity without a second toolchain authority.
- **reason:** inconsistent Node identities invalidate hardening/build/runtime assumptions.
- **dependency:** existing Version/DevelopmentChain controls and Docker runtime identity.
- **required_evidence:** exact-candidate Node/version checks and hosted CI; runtime identity only for runtime claims.
- **verification_gate:** CAPITAL-AI-SEC independent identity verification.
- **status:** `REFERRED_NOT_EXECUTED`.

## SEC-FIND-S1-R2-04 — Fatal process handling

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-04]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-04]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-04`
- **target_project:** `CAPITAL-AI-OPS`
- **task:** fatal uncaught errors must fail readiness, stop new work, perform bounded safe cleanup, exit non-zero and rely on approved supervision.
- **reason:** unhealthy process must not continue protected work after fatal failure.
- **dependency:** `PVC-08` Production Operations supplies post-deploy supervisor recovery evidence.
- **required_evidence:** negative child-process evidence plus runtime supervisor recovery evidence for Production claims.
- **verification_gate:** CAPITAL-AI-SEC verifies fail-fast behavior and evidence identity.
- **status:** `REFERRED_NOT_EXECUTED`.

## SEC-FIND-S1-R2-05 — Stripe redirect boundary

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-02]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-02`
- **target_project:** `CAPITAL-AI-OPS`
- **task:** replace client-controlled absolute Checkout redirects with server-owned canonical origin/destination policy in the affected application implementation.
- **reason:** untrusted redirect input can create an open-redirect boundary.
- **dependency:** existing DevelopmentChain/application implementation.
- **required_evidence:** open-redirect negative tests plus exact-candidate API tests.
- **verification_gate:** CAPITAL-AI-SEC validates reject/allow boundaries.
- **status:** `REFERRED_NOT_EXECUTED`.

## SEC-FIND-S1-R2-06 — Entitlement authority

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-02]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-02`
- **target_project:** `CAPITAL-AI-OPS` for parent inventory/coordination.
- **task:** inventory premium/protected capabilities and ensure protected grants resolve verified principal plus authoritative server/provider entitlement state.
- **reason:** browser/local subscription projection must never grant a protected paid capability.
- **dependency:** capability-specific Primary Owners become child handoff targets when their productive code is identified.
- **required_evidence:** browser-tier escalation, forged identity, missing bearer, stale entitlement and alternate-path DENY evidence for each protected boundary.
- **verification_gate:** CAPITAL-AI-SEC independently verifies each returned capability boundary.
- **parent_inventory:** `controlled-implementation/OPS_02_SEC_06_ENTITLEMENT_CAPABILITY_INVENTORY.md`.
- **parent_result:** all seven canonical subscription feature keys correlated; FINTECH `PVC-15/PVC-16` and DATA `PVC-09` child work identified; PDF retained as server-enforced reference pattern.
- **status:** `PARENT_INVENTORY_EVIDENCE_READY / CHILD_REMEDIATION_REQUIRED / SECURITY_VERIFICATION_PENDING`.

### S1-R2-06 Security return projection

`[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`

- `source_security_finding: S1-R2-06`
- `target_project: CAPITAL-AI-OPS`
- `project_stage: PVC-02`
- `implementation_status: EVIDENCE_READY`
- `changed_files: OPS-owned inventory/roadmap/handoff/work-package documentation and work claim only`
- `candidate_sha: exact PR head supplied by repository PR evidence`
- `runtime_sha_if_applicable: N/A`
- `security_tests: no child implementation test is claimed PASS by the parent inventory`
- `negative_tests: browser-tier escalation, forged identity, missing bearer, stale entitlement and alternate-path expectations are mapped for all seven capabilities`
- `evidence_paths: docs/projects/operations/controlled-implementation/OPS_02_SEC_06_ENTITLEMENT_CAPABILITY_INVENTORY.md`
- `known_residual_risk: protected capabilities with unguarded/client-local/alternate paths remain until target owners implement remediation`
- `unresolved_dependencies: CAPITAL-AI-FINTECH PVC-15/PVC-16; CAPITAL-AI-DATA PVC-09; independent CAPITAL-AI-SEC verification`
- `verification_requested: true`

This return is evidence for the **parent inventory only**. It is not Security `VERIFIED` or `CLOSED`.

## SEC-FIND-S1-R2-07 — Recovery / RPO / RTO

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-08`
- **target_project:** `CAPITAL-AI-OPS`
- **task:** establish approved recovery objectives, recurring encrypted off-site backup and isolated measured restore.
- **reason:** unverified recovery capability and unmeasured RPO/RTO create resilience/integrity risk.
- **dependency:** existing Operations recovery/runbooks and applicable Owner approvals.
- **required_evidence:** measured actual RPO/RTO plus integrity-validated restore evidence.
- **verification_gate:** CAPITAL-AI-SEC verifies returned evidence; runbook existence alone is not PASS.
- **status:** `REFERRED_NOT_EXECUTED`.

## SEC-FIND-S1-R2-09 — Strict CSP promotion

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-08`
- **target_project:** `CAPITAL-AI-OPS`
- **task:** promote CSP from report-only to strict only after protected compatibility/violation evidence satisfies ADR-0040.
- **reason:** premature strict CSP can break availability; report-only must not be mislabeled as strict enforcement.
- **dependency:** SEO/marketing/browser paths may supply compatibility evidence but own no productive Production stage.
- **required_evidence:** accepted violation/compatibility window and protected Stripe/Supabase/Consent/hCaptcha path verification.
- **verification_gate:** CAPITAL-AI-SEC verifies promotion evidence before a strict-state claim.
- **status:** `WAITING_FOR_EVIDENCE`.

## SEC-FIND-S1-R2-10 — Demo billing isolation post-deploy proof

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-08]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-08`
- **target_project:** `CAPITAL-AI-OPS`
- **task:** provide production bundle/runtime evidence proving DEV billing simulation is unreachable.
- **reason:** Production must not reach simulated-success billing logic.
- **dependency:** merged S1 tail implementation; failed proof may create a new target-owned implementation package.
- **required_evidence:** exact runtime/bundle identity plus reachability/fail-closed evidence.
- **verification_gate:** CAPITAL-AI-SEC independently verifies production reachability evidence.
- **status:** `WAITING_FOR_EVIDENCE`.

## S1-R2-11 — external primary dependency

- **primary_owner:** `CAPITAL-AI-DATA / PVC-10`.
- **OPS state:** dependency only.
- **rule:** no OPS implementation until a separate handoff identifies concrete OPS-owned PR/trace tooling code.

## Required return contract

Every completed OPS remediation/evidence package returns:

`[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`

Required fields:

- `source_security_finding`
- `target_project: CAPITAL-AI-OPS`
- `project_stage`
- `implementation_status: IMPLEMENTED | EVIDENCE_READY | BLOCKED`
- `changed_files`
- `candidate_sha`
- `runtime_sha_if_applicable`
- `security_tests`
- `negative_tests`
- `evidence_paths`
- `known_residual_risk`
- `unresolved_dependencies`
- `verification_requested: true`

OPS never sets its own returned item to Security `VERIFIED` or `CLOSED`.
