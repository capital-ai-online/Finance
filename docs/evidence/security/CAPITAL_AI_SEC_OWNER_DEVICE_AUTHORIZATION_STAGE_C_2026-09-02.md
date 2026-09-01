# CAPITAL-AI-SEC — Owner Device Authorization Stage C Verification

**Project:** `CAPITAL-AI-SEC`  
**Stage:** `C — independent Security verification`  
**Date:** `2026-09-02`  
**Verified main:** `7bf77f4c5f15f46ef0d551d12c9ddb572bd16883`  
**Source PR:** `#702`  
**Implementation head:** `e0a1b33bb9226de4338838321c2433920788cfd0`  
**Merge commit:** `7bf77f4c5f15f46ef0d551d12c9ddb572bd16883`  
**Verdict:** `FAIL`

## Scope and evidence

Reviewed current-main `/AGENTS.md`, Security project README/ROADMAP, canonical Security roadmap/work packages/traceability, `docs/projects/governance/OWNER_DEVICE_AUTHORIZATION_HANDOFF.md`, ADR-0104 v1.4.0, PR #702 diff and hosted workflow conclusions. At verification start there were no open Pull Requests. Productive OPS implementation was not modified.

PR #702 hosted workflows for implementation head `e0a1b33bb9226de4338838321c2433920788cfd0` completed successfully for Container Security, Governance-Prüfung and CI-Prüfung. These checks are supporting evidence only and do not substitute for the mandatory Stage-C negative catalogue.

## Security findings

### SEC-FIND-ODA-001 — Activation transaction is not atomic / fail-closed

**Severity:** HIGH  
**Target owner:** `CAPITAL-AI-OPS / PVC-02`  
**Status:** `REFERRED_NOT_EXECUTED`

`verifyAdr0104Authentication()` consumes the challenge before WebAuthn verification, then persists ALLOW evidence, updates the credential counter, inserts the ADR session, and only afterwards inserts `owner_authorization_consumptions`. These are separate Supabase operations without a database transaction/RPC boundary. Failure after session insertion but before consumption insertion can leave an ACTIVE authorization session even though the function throws `OWNER_AUTH_CONSUMPTION_PERSIST_FAILED`. This violates atomic consumption and fail-closed persistence.

Required remediation: move challenge consumption, successful evidence persistence, counter transition, slot/session creation and final consumption record into one server-side transactional operation with uniqueness/precondition checks in the same transaction; return ALLOW only after commit.

### SEC-FIND-ODA-002 — Post-challenge canonical project metadata is not re-resolved

**Severity:** HIGH  
**Target owner:** `CAPITAL-AI-OPS / PVC-02`  
**Status:** `REFERRED_NOT_EXECUTED`

Challenge creation resolves project metadata from a hard-coded `ADR_0104_PROJECT_OPTIONS` array and stores the resolved set in challenge context. Verification checks only the stored context digest, ADR constants, slot and current-main SHA. It does not re-resolve every project/folder/stage/Primary-Owner mapping from then-current canonical project authority immediately before activation, as required by the Governance handoff. A same-SHA database/context mutation is detected, but canonical metadata drift is not independently re-resolved.

Required remediation: derive canonical project metadata from the current authoritative project registry/source and re-resolve/recompute the immutable set and digest immediately before atomic consumption.

### SEC-FIND-ODA-003 — Mandatory negative-test catalogue is materially incomplete

**Severity:** HIGH  
**Target owner:** `CAPITAL-AI-OPS / PVC-02` for implementation-coupled tests; CAPITAL-AI-SEC re-verifies independently  
**Status:** `REFERRED_NOT_EXECUTED`

The only PR #702 unit test added is `tests/unit/adr0104ProjectSet.test.ts`. It covers deterministic sorting/digest, empty/duplicate/oversized sets, unknown project, initial project outside set, and static S1/S2/S3 availability. No exact test evidence was found for the mandatory WebAuthn and replay catalogue: raw deviceId-only denial, fingerprint-only denial, foreign credential, synchronized/backup-eligible credential, wrong RP ID, wrong origin, UP=false, UV=false, expired challenge, challenge replay, assertion replay, context drift, wrong repository/action, wrong chat binding, wrong project set, ADR/current-main drift, audit persistence failure, revoked credential, copied activation text, weak recovery downgrade, agent self-approval, or merge/auto-merge denial.

Presence of fail-closed code paths is not classified as PASS where the contract requires negative-test evidence.

### SEC-FIND-ODA-004 — Audit fields overstate verification granularity

**Severity:** MEDIUM  
**Target owner:** `CAPITAL-AI-OPS / PVC-02`  
**Status:** `REFERRED_NOT_EXECUTED`

The evidence row writes `rp_verified`, `origin_verified`, `user_presence_verified`, and `user_verification_verified` all from the single aggregate `verification.verified` boolean. This does not preserve independent result evidence for the audit contract and cannot distinguish which verification property failed. DENY evidence also collapses failures to `WEBAUTHN_VERIFICATION_FAILED`.

Required remediation: persist truthful independently derived verification facts/reason classes available from the maintained WebAuthn verifier and precondition checks, without claiming individual checks from one aggregate boolean.

## Requirement classification

| Requirement | Result | Evidence / reason |
|---|---|---|
| raw device ID is never authorization evidence | PASS | runtime accepts Owner identity + WebAuthn assertion; no deviceId authorization condition |
| browser fingerprint is never authorization evidence | PASS | no fingerprint authorization input/path in reviewed runtime |
| WebAuthn signature verification | PASS | `verifyAuthenticationResponse` with stored public key |
| RP-ID verification | PASS | `expectedRPID` configured server-side |
| HTTPS origin allowlist | PARTIAL | HTTPS enforced, but implementation exposes one configured origin rather than an explicit multi-origin allowlist; no negative test |
| User Presence required | PARTIAL | WebAuthn verification implies ceremony checks, but no explicit Stage-C negative evidence for UP=false |
| User Verification required | PARTIAL | `requireUserVerification: true`; mandatory UV=false negative evidence absent |
| single-device credential | PASS | enrollment and assertion DB filters require `singleDevice` |
| backupEligible=false | PASS | schema + runtime filter enforce false |
| backedUp=false | PASS | enrollment check + schema/runtime filter enforce false |
| canonical Human Owner binding | PASS | router requires `OWNER_ONLY_ROLES`; credential lookup is owner-user scoped |
| revoked credential denial | PARTIAL | revoked credentials excluded in lookup; mandatory negative test absent |
| foreign-principal credential denial | PARTIAL | owner-scoped credential lookup; mandatory negative test absent |
| short-lived challenge | PASS | 5-minute TTL |
| cryptographically secure challenge | PASS | challenge generated by maintained SimpleWebAuthn server library; nonce uses `randomUUID` |
| challenge single-use | PARTIAL | compare-and-set consumed flag exists; transaction defect remains |
| assertion replay denial | PARTIAL | challenge consumption and WebAuthn counter support replay resistance; mandatory replay test absent and transaction is non-atomic |
| context replay/drift denial | PARTIAL | stored context digest is rechecked; mandatory drift test absent |
| atomic consumption | FAIL | multi-step persistence is not transactional |
| fail-closed persistence | FAIL | ACTIVE session can be inserted before final consumption persistence failure |
| audit integrity | PARTIAL | durable tables exist; verification flags are aggregate/overstated and transaction is non-atomic |
| slot AVAILABLE | PASS | static baseline + session uniqueness check |
| S1/S2/S3 only | PASS | router/type/schema constraints |
| 1–3 projects | PASS | resolver enforces 1..3 |
| duplicate projects denied | PASS | resolver rejects duplicates; unit test present |
| unknown project denied | PASS | resolver rejects unknown; unit test present |
| projectFolder not caller-authoritative | PASS | caller supplies project IDs only |
| canonical project metadata server-resolved | PARTIAL | server-owned hard-coded mapping, not re-resolved from current canonical authority at verification |
| immutable sorted project set | PASS | sorted set stored in challenge context; context digest binds it |
| deterministic projectSetDigest | PASS | SHA-256 over sorted stable records; unit test present |
| initial project in set | PASS | explicit assertion + unit test |
| exact chat binding | PARTIAL | hash is stored/bound in context, but verifier has no independent current-chat value to compare; mandatory wrong-chat negative test absent |
| exact ADR version | PASS | v1.4.0 constant checked at verification |
| exact current-main binding | PASS | GitHub main is resolved at challenge and verification |
| current-main drift denied | PARTIAL | source path denies drift; mandatory negative test absent |
| slot replay denied | PARTIAL | DB unique slot + baseline check; mandatory replay test absent |
| post-challenge project-set mutation denied | PARTIAL | context digest catches stored-context mutation; canonical project metadata is not re-resolved; mandatory test absent |
| copied text activation without WebAuthn proof denied | PARTIAL | reviewed API activation requires assertion; mandatory explicit negative test absent; GOV cutover remains separate |

## Mandatory negative-test catalogue

`PASS` is recorded only where exact automated evidence was found. Project-set unit tests provide PASS for duplicate/oversized/unknown project and consumed static slots. The remaining required negative cases are `NOT_TESTED` unless explicitly covered by those tests. In particular: raw deviceId-only, fingerprint-only, foreign credential, synchronized credential, backup-eligible credential, wrong RP ID, wrong origin, UP=false, UV=false, expired challenge, challenge replay, assertion replay, context drift, wrong repository/action, wrong chat binding, wrong project set after challenge, ADR/current-main drift, audit persistence unavailable, revoked credential and copied-text activation are `NOT_TESTED` for Stage C.

## Residual risk and verdict

The implementation establishes a credible WebAuthn-based foundation and server-side project-set binding, but the authorization commit is not atomic and the mandatory negative-test evidence is incomplete. Both are security-critical blockers under the Stage-C contract. No Stage-D Governance cutover is authorized by this evidence.

`STAGE_C_SECURITY_VERIFICATION = FAIL`

## Return handoff

`[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-02]`  
`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]`

Productive remediation remains CAPITAL-AI-OPS-owned. After remediation is Human-merged, CAPITAL-AI-SEC must independently re-run Stage C against the exact then-current main/candidate and complete the mandatory negative catalogue.

Return this FAIL evidence to `CAPITAL-AI-GOV / PVC-05`; GOV Stage D must not proceed until a later Stage-C PASS exists.