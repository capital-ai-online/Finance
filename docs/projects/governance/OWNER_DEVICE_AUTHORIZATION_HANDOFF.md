# CAPITAL-AI-GOV — Human Owner Device Authorization Contract & Handoff

**Document ID:** `DOC-GOV-HUMAN-OWNER-DEVICE-AUTH-2026-09-01`  
**Status:** `PROPOSED / NON-AUTHORIZING / TARGET IMPLEMENTATION REQUIRED`  
**Date:** `2026-09-01`  
**Source project:** `CAPITAL-AI-GOV`  
**Source project folder:** `docs/projects/governance/`  
**Primary project stage:** `PVC-05 — Platform Director`  
**Current authority:** `/AGENTS.md`, ADR-0096, ADR-0104 v1.3.0 and the current Governance Control Catalog remain controlling until a later Human-merged cutover  
**Implementation targets:** `CAPITAL-AI-OPS` plus independent `CAPITAL-AI-SEC` verification

## 1. Decision intent

The Human Owner requests one cryptographically bound device authorization mechanism for two protected use cases:

1. Human Owner authorization of GitHub mutations that CAPITAL-AI classifies as protected Owner actions; and
2. Human Owner authorization of a future ADR-0104 delegated-execution-session activation.

The target is feasible, but a raw device identifier, browser fingerprint, hardware serial, user-agent value, installation UUID or caller-supplied `deviceId` MUST NOT be accepted as authorization evidence.

The target design uses a CAPITAL-AI-owned WebAuthn ceremony. The durable device reference is derived from or mapped to a successfully registered WebAuthn public-key credential and is useful only together with a freshly verified assertion. For strict device binding, only a **single-device credential** that is not backup-eligible/synchronized is accepted for this privileged Owner profile.

This document does not activate the mechanism. It defines the Governance contract, scope, cutover conditions and target-project handoffs. Productive implementation remains foreign to CAPITAL-AI-GOV.

## 2. Why a device ID alone is rejected

A device ID is an identifier, not proof of possession or Human presence. A copied, leaked, replayed or client-forged identifier cannot demonstrate that the Human Owner is currently controlling the registered authenticator.

Therefore:

- `deviceId == expectedDeviceId` is never an ALLOW condition;
- browser/device fingerprinting is not an Owner authorization factor;
- GitHub account authentication alone is not treated as proof that a specific CAPITAL-AI protected action was approved;
- a synced/multi-device passkey is not accepted for the strict single-device Owner profile;
- the authorization decision requires a fresh WebAuthn assertion with User Presence and User Verification;
- the assertion is bound to an exact action context and a server-generated, short-lived, single-use challenge.

The privacy-preserving audit identifier SHOULD be an opaque server-side alias or a hash of the WebAuthn credential reference. Raw public credential identifiers are not displayed in ordinary chat/evidence output.

## 3. Device-bound credential profile

The privileged Owner credential profile MUST satisfy all of the following:

```text
OWNER_ACTOR          = canonical CAPITAL-AI Human Owner
AUTH_PROTOCOL        = WebAuthn / FIDO2 public-key credential
USER_PRESENCE        = required
USER_VERIFICATION    = required
CREDENTIAL_CLASS     = single-device
BACKUP_ELIGIBLE      = false
BACKED_UP             = false
RP_ID                 = canonical CAPITAL-AI relying-party domain
ORIGIN                = explicit HTTPS allowlist
DEVICE_REFERENCE     = opaque/hash reference to registered credential
PRIVATE_KEY_STORAGE  = authenticator only; never repository/database/chat
```

A second independently registered device-bound credential or a separately governed recovery process SHOULD exist to prevent permanent lockout after device loss. Recovery MUST NOT silently downgrade to raw device ID, SMS, email link, TOTP-only or text-command authorization.

## 4. M10 independence and current writer correlation

This design MUST NOT reactivate DevelopmentChain M10 or reuse M10 as current authorization authority.

At the 2026-09-01 precheck, open PR `#691` (`CAPITAL-AI-OPS`) is retiring the productive M10 passkey / `AUTHORIZE_PR_CI` stack. It removes the current `server/m10/**` runtime, M10 UI/CI dispatch surfaces and productive M10 credential grants while retaining historical evidence.

Consequences:

1. no new productive code is added below `server/m10/**`;
2. no `m10_*` database table is reused as the new Owner Device Authorization source of truth;
3. no `AUTHORIZE_PR_CI` capability is reactivated by this work;
4. historical M10 threat models/evidence MAY be reused as research input only;
5. maintained WebAuthn libraries already present in the repository MAY be reused after dependency/current-main correlation, without reviving the retired M10 architecture;
6. target OPS implementation starts from then-current `main` after correlating PR #691 and any successor writer.

## 5. Canonical action model

The device assertion never grants a generic standing identity token. Each assertion authorizes exactly one canonical action transaction.

### 5.1 GitHub protected Owner mutation

Canonical action:

`AUTHORIZE_GITHUB_OWNER_MUTATION`

The challenge context MUST contain at least:

```text
ownerActorId
repository
operation
resourceType
resourceId / targetRef
baseSha or currentStateDigest where applicable
candidateHeadSha where applicable
requestedScopeDigest
challengeId
issuedAt
expiresAt
nonce
```

`operation` MUST be an allowlisted semantic operation rather than arbitrary caller text. The resulting approval is single-use and invalid after material target-state drift.

Examples that may consume this action class after their own existing Governance checks include PR creation, protected repository setting changes or other explicitly classified Owner-gated GitHub mutations.

**Excluded:** Pull Request merge and auto-merge. A WebAuthn approval record may be retained as Human authentication evidence, but it MUST NOT turn `MERGE` into delegated or agent-executable authority. Human merge remains a distinct Human Owner action under `/AGENTS.md` and ADR-0104.

### 5.2 ADR-0104 activation

Canonical action:

`ACTIVATE_ADR_0104_SESSION`

The challenge context MUST contain at least:

```text
ownerActorId
authorityId = AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01
adrVersion
slotId = ADR-0104-S1 | ADR-0104-S2 | ADR-0104-S3
slotPreState = AVAILABLE
chatBindingHash
projectId
projectFolder
currentMainSha
sessionDuration = PT8H
sessionStart
sessionEnd
challengeId
issuedAt
expiresAt
nonce
```

The activation verifier MUST re-resolve current `main`, ADR-0104 version, slot availability, canonical project/folder mapping and the exact chat binding before consuming the approval.

A text command such as `activate ADR-0104-S1`, an approval emoji, a copied prompt, a GitHub reaction, a stored device-ID string or a previously valid assertion MUST NOT independently activate the slot after device-gated cutover.

A successful device assertion and successful ADR-0104 precondition check together create the authoritative activation record. If either side fails, activation is `DENIED / FAIL_CLOSED` and the slot remains `AVAILABLE` unless a separately defined atomic transaction has already committed the transition.

## 6. Transaction and replay controls

Every Owner Device Authorization ceremony MUST:

1. generate the challenge server-side from cryptographically secure randomness;
2. use a short expiry appropriate to an interactive Human ceremony;
3. verify RP ID and HTTPS origin exactly;
4. verify the assertion signature against the registered public key;
5. require User Presence and User Verification;
6. verify the credential is active, belongs to the canonical Owner and satisfies the device-bound profile;
7. verify the exact action-context digest again immediately before authorization consumption;
8. atomically transition challenge/approval from unused to consumed;
9. reject challenge replay, assertion replay and duplicate action consumption;
10. fail closed when audit persistence, credential state, target state or correlation cannot be verified.

Recommended digest shape:

`SHA-256(ownerActorId || action || canonicalContext || challengeId || nonce)`

The digest is transaction context, not a replacement for the WebAuthn challenge or signature.

## 7. GitHub enforcement boundary

The target is not secure if an alternate GitHub token, connector, workflow or API path can perform the same protected mutation while bypassing Owner Device Authorization.

OPS MUST therefore design enforcement around least privilege and a trusted mutation gateway/workflow:

```text
Human Owner browser
  -> CAPITAL-AI Owner Device Authorization service
  -> verified single-use approval record
  -> trusted GitHub mutation gateway / workflow
  -> exact target-state recheck
  -> mutation
  -> append-only audit evidence
```

Direct execution credentials SHOULD be reduced so protected operations are not independently available to ordinary agent/client paths. Where GitHub itself cannot technically enforce the CAPITAL-AI proof on a native UI action, repository Governance MUST distinguish the Human-native action from delegated API/agent execution instead of claiming a nonexistent technical gate.

## 8. ADR-0104 staged cutover

No current ADR-0104 authority is silently rewritten by this project document.

### Stage A — Governance contract

This document defines the target action, device and evidence contracts. Status: `IN CANDIDATE` for the current GOV branch.

### Stage B — OPS implementation

CAPITAL-AI-OPS implements the M10-independent runtime, persistence, Owner enrollment/revocation, GitHub mutation integration and ADR-0104 activation verifier. Status until returned evidence: `REFERRED_NOT_EXECUTED`.

### Stage C — independent Security verification

CAPITAL-AI-SEC performs the threat-model review and positive/negative/replay/recovery verification on the exact candidate/runtime. Status until returned evidence: `REFERRED_NOT_EXECUTED`.

### Stage D — Governance authority cutover

Only after Stages B and C return sufficient current-main evidence may CAPITAL-AI-GOV prepare a normal authority amendment that makes device-backed proof mandatory for ADR-0104 activation and any enumerated GitHub Owner-authorization control.

The cutover amendment MUST update the canonical ADR/Authority/Control registries as required, preserve Human-only merge, and state an explicit effective version/date. It becomes effective only through Human Merge.

Until that Human-merged cutover exists, ADR-0104 v1.3.0 remains controlling and this document MUST NOT be cited as current activation authority.

## 9. Required durable data model

The target runtime SHOULD maintain distinct M10-independent records with equivalent semantics to:

- `owner_device_credentials` — public credential material and lifecycle only;
- `owner_authorization_challenges` — short-lived exact-context challenges;
- `owner_authorization_evidence` — immutable successful/denied authorization evidence;
- `owner_authorization_consumptions` — one-time mutation/activation consumption.

Sensitive/private material MUST NOT be stored. The minimum credential record includes Owner ID, public key, signature counter where applicable, transports, credential device type, backup eligibility/state, AAGUID where justified, created/revoked timestamps and privacy-preserving device reference.

Table names are illustrative; target OPS must correlate with current schema conventions and avoid parallel sources of truth.

## 10. Audit contract

Audit evidence MUST include, without biometric/private-key material:

- approval/challenge identifiers or privacy-preserving references;
- Owner actor ID;
- device/credential opaque reference;
- action;
- canonical context digest;
- RP/origin verification result;
- UP/UV result;
- single-device / backup-state result;
- issued/verified/consumed/revoked timestamps;
- current-main/target identity relevant to the action;
- final ALLOW/DENY outcome and reason class;
- mutation/ADR-0104 activation result correlation.

Evidence is evidence only. It does not create merge authority or retroactively authorize a failed action.

## 11. Mandatory negative tests

Target implementation and independent Security verification MUST cover at minimum:

- caller-supplied raw device ID only -> DENY;
- browser fingerprint only -> DENY;
- valid credential belonging to another principal -> DENY;
- synced/multi-device credential for strict Owner profile -> DENY;
- backup-eligible credential for strict Owner profile -> DENY;
- wrong RP ID -> DENY;
- wrong origin -> DENY;
- `UP=false` -> DENY;
- `UV=false` -> DENY;
- expired challenge -> DENY;
- challenge replay -> DENY;
- assertion replay -> DENY;
- action-context drift after challenge issue -> DENY;
- wrong repository/resource/action -> DENY;
- ADR-0104 wrong/consumed slot -> DENY;
- ADR-0104 different chat binding -> DENY;
- ADR-0104 different project/folder -> DENY;
- ADR-0104 version/current-main drift -> DENY and re-correlate;
- copied activation text without device proof after cutover -> DENY;
- audit persistence unavailable -> DENY;
- revoked credential -> DENY;
- device loss recovery attempting weak-factor downgrade -> DENY;
- agent self-approval -> DENY;
- agent/automation merge or auto-merge attempt -> DENY irrespective of device approval.

## 12. Reuse / state-of-the-art direction

Implementation SHOULD reuse maintained WebAuthn/FIDO2 libraries rather than custom cryptography. Existing repository experience with `@simplewebauthn/server` may inform the implementation, but the retired M10 runtime is not revived and no historical M10 evidence is treated as current verification.

The design follows WebAuthn public-key authentication, relying-party scoping, User Presence/User Verification and credential backup/device-type signals. Device binding is defined by cryptographic credential properties, not by a globally correlatable hardware identifier.

## 13. OPS implementation handoff

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-02`
- **related_project_stages:** `PVC-04`, `PVC-08`
- **target_project:** `CAPITAL-AI-OPS`
- **target_project_folder:** `docs/projects/operations/`
- **primary_owner:** `CAPITAL-AI-OPS`
- **task:** implement the M10-independent Owner Device Authorization runtime and trusted mutation/ADR-0104 activation enforcement described in this contract.
- **reason:** productive Controlled Implementation, Supervisor integration and Production Operations are OPS-owned; GOV owns the decision/authority contract only.
- **dependency:** current `/AGENTS.md`; current ADR-0104; this contract; resolved/open status of PR #691; current Security requirements; exact provider/runtime capabilities.
- **required_evidence:** current-main branch, credential/challenge/evidence/consumption schema, Owner enrollment/revocation, GitHub protected-action gateway, ADR-0104 activation verifier, replay-safe atomic consumption, audit chain, rollback/recovery runbook, positive and negative automated tests.
- **verification_gate:** OPS implementation evidence plus independent CAPITAL-AI-SEC verification; Governance cutover remains separate.
- **status:** `REFERRED_NOT_EXECUTED`

## 14. Security verification handoff

### [SECURITY_HANDOFF -> CAPITAL-AI-SEC | VC-05]
### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-SEC | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **routing_context:** cross-cutting Security verification; CAPITAL-AI-SEC owns no productive PVC through this record.
- **target_project:** `CAPITAL-AI-SEC`
- **target_project_folder:** `docs/projects/security/`
- **primary_owner:** `CAPITAL-AI-SEC` for Security requirements/verification only.
- **task:** independently threat-model and verify the Owner Device Authorization implementation, including device-bound credential enforcement, replay resistance, recovery and bypass resistance.
- **reason:** Security owns IAM/AuthN/AuthZ/MFA requirements, negative-test expectations and independent Security verification.
- **dependency:** returned OPS exact-candidate/runtime evidence plus this Governance contract and current Security authorities.
- **required_evidence:** threat model, bypass-path inventory, credential lifecycle review, negative/replay/recovery test evidence, residual risk and explicit VERIFIED/NOT VERIFIED result.
- **verification_gate:** CAPITAL-AI-SEC independent Security decision; GOV/OPS may not self-assert Security VERIFIED/CLOSED.
- **status:** `REFERRED_NOT_EXECUTED`

## 15. Governance return / exit gate

CAPITAL-AI-GOV may prepare the final authority cutover only when all of the following are present on then-current `main` or otherwise validly correlated exact candidate evidence:

1. OPS implementation is `IMPLEMENTED / EVIDENCE_READY` with no active parallel M10 authorization runtime;
2. protected GitHub delegated mutation paths cannot bypass the required approval record within the defined technical scope;
3. ADR-0104 activation verification is exact-slot/chat/project/version/current-main bound;
4. single-device WebAuthn enforcement and recovery are implemented;
5. replay/negative tests pass on the exact candidate;
6. CAPITAL-AI-SEC independently returns sufficient verification evidence;
7. the final ADR/control/registry amendment has an Owner-visible semantic diff and preserves Human-only merge;
8. Human Owner explicitly approves PR creation for the exact final candidate and later performs the merge.

No step in this contract authorizes merge, deployment, production mutation or an ADR-0104 activation by itself.
