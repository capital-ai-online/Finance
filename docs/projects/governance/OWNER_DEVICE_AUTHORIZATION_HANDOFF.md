# CAPITAL-AI-GOV — Human Owner Device Authorization Contract & Handoff

**Document ID:** `DOC-GOV-HUMAN-OWNER-DEVICE-AUTH-2026-09-01`  
**Status:** `ACTIVE CONTRACT / STAGE B+C COMPLETE / STAGE D CUTOVER BOUND TO HUMAN MERGE`  
**Date:** `2026-09-02`  
**Source project:** `CAPITAL-AI-GOV`  
**Source project folder:** `docs/projects/governance/`  
**Primary project stage:** `PVC-05 — Platform Director`  
**Current authority:** `/AGENTS.md`, ADR-0096, ADR-0104 v1.4.0, the current Governance Authority Registry and Control Catalog. The final Stage-D cutover is carried by `AUTH-GOV-OWNER-DEVICE-AUTHORIZATION-CUTOVER` and becomes effective only when the fully correlated remediation snapshot is Human-merged to `main`.  
**Implementation targets:** `CAPITAL-AI-OPS = IMPLEMENTED`; independent `CAPITAL-AI-SEC = VERIFIED / STAGE C PASS`

## 1. Decision intent

The Human Owner requires one cryptographically bound device authorization mechanism for two protected use cases:

1. Human Owner authorization of GitHub mutations that CAPITAL-AI classifies as protected Owner actions; and
2. Human Owner authorization of a new ADR-0104 delegated-execution-session activation.

A raw device identifier, browser fingerprint, hardware serial, user-agent value, installation UUID or caller-supplied `deviceId` MUST NOT be accepted as authorization evidence.

The design uses a CAPITAL-AI-owned WebAuthn ceremony. The durable device reference is derived from or mapped to a successfully registered WebAuthn public-key credential and is useful only together with a freshly verified assertion. For strict device binding, only a **single-device credential** that is not backup-eligible/synchronized is accepted for this privileged Owner profile.

This document is the Governance contract and handoff record. It does not itself create runtime authority. Productive implementation was returned by CAPITAL-AI-OPS through PRs `#702`, `#704` and `#705`; independent Security re-verification was returned by CAPITAL-AI-SEC through PR `#709` with `SEC_FIND_ODA_003 = CLOSED` and `STAGE_C_SECURITY_VERIFICATION = PASS`. The final Stage-D authority boundary is the separate stable authority `AUTH-GOV-OWNER-DEVICE-AUTHORIZATION-CUTOVER`.

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

## 4. M10 independence and current implementation correlation

This design MUST NOT reactivate DevelopmentChain M10 or reuse M10 as current authorization authority.

PR `#691` was Human-merged and retired the productive M10 passkey / `AUTHORIZE_PR_CI` stack. Current `/AGENTS.md` therefore treats M10 as `RETIRED / OFF` and historical-only for current-state discovery.

The Owner Device Authorization implementation returned by CAPITAL-AI-OPS is M10-independent. Consequences:

1. no productive code is introduced below `server/m10/**`;
2. no `m10_*` database table is the new Owner Device Authorization source of truth;
3. no `AUTHORIZE_PR_CI` capability is reactivated;
4. historical M10 threat models/evidence remain research/audit input only;
5. maintained WebAuthn libraries may be reused without reviving retired M10 authority;
6. all productive activation checks remain bound to the current Owner Authorization runtime and current Governance authority.

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
adrVersion = 1.4.0
slotId = ADR-0104-S1 | ADR-0104-S2 | ADR-0104-S3
slotPreState = AVAILABLE
chatBindingHash
authorizedProjectSet[] = sorted canonical { projectId, projectFolder, projectStage, primaryOwner }
projectSetDigest
initialActiveProjectId
initialActiveProjectFolder
currentMainSha
sessionDuration = PT8H
sessionStart
sessionEnd
challengeId
issuedAt
expiresAt
nonce
```

The activation verifier MUST re-resolve current `main`, ADR-0104 version, slot availability, every canonical project/folder/stage/Primary-Owner mapping, the exact immutable project-set digest, initial active-project membership and the exact chat binding before consuming the approval. Empty, duplicate, more-than-three-member or post-challenge-modified sets MUST fail closed.

After the Stage-D cutover authority is Human-merged, a text command such as `activate ADR-0104-S1`, an approval emoji, a copied prompt, a GitHub reaction, a stored device-ID string or a previously valid assertion MUST NOT independently activate a new slot.

A successful fresh device assertion and successful ADR-0104 precondition check together create the activation record, including the immutable project set and its digest. If either side fails, activation is `DENIED / FAIL_CLOSED`.

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

The target is not secure if an alternate GitHub token, connector, workflow or API path can perform the same protected delegated mutation while bypassing Owner Device Authorization.

Protected delegated execution SHOULD therefore use least privilege and a trusted mutation gateway/workflow:

```text
Human Owner browser
  -> CAPITAL-AI Owner Device Authorization service
  -> verified single-use approval record
  -> trusted GitHub mutation gateway / workflow
  -> exact target-state recheck
  -> mutation
  -> append-only audit evidence
```

Where GitHub itself cannot technically enforce CAPITAL-AI proof on a Human-native UI action, Governance MUST distinguish that Human-native action from delegated API/agent execution instead of claiming a nonexistent technical gate.

## 8. ADR-0104 staged cutover

No ADR-0104 runtime protocol version is silently rewritten by this project document.

### Stage A — Governance contract

Status: `COMPLETE`.

This document defines the action, device, evidence, recovery and cutover contracts.

### Stage B — OPS implementation

Status: `IMPLEMENTED / EVIDENCE READY`.

Correlated implementation/remediation:

- PR `#702`;
- PR `#704`;
- PR `#705`;
- PR `#705` merge commit `2e5a4c23bca91032aa10b03bb573bb0801b7965d`.

The implementation remains M10-independent and preserves the ADR-0104 runtime authority ID/version binding.

### Stage C — independent Security verification

Status: `VERIFIED / STAGE C PASS`.

Correlated independent evidence:

- initial SEC PR `#703` retained as historical FAIL evidence;
- final re-verification PR `#709` Human-merged;
- `docs/evidence/security/CAPITAL_AI_SEC_OWNER_DEVICE_AUTHORIZATION_STAGE_C_REVERIFICATION_2026-09-02.md`;
- `SEC_FIND_ODA_003 = CLOSED`;
- `STAGE_C_SECURITY_VERIFICATION = PASS`.

Historical FAIL evidence MUST NOT be rewritten.

### Stage D — Governance authority cutover

Status rule: `EFFECTIVE ONLY AFTER HUMAN MERGE OF THE FULLY CORRELATED REMEDIATION SNAPSHOT`.

The Stage-D cutover is represented by the stable authority:

`AUTH-GOV-OWNER-DEVICE-AUTHORIZATION-CUTOVER`

at:

`docs/governance/OWNER_DEVICE_AUTHORIZATION_CUTOVER_AUTHORITY.md`

The same remediation snapshot MUST contain:

- the Authority Registry entry for `AUTH-GOV-OWNER-DEVICE-AUTHORIZATION-CUTOVER`;
- `CTRL-GOV-OWNER-DEVICE-AUTH-001` in the Governance Control Catalog;
- accurate projection of `/AGENTS.md` Control Plane version in the Authority Registry;
- this updated handoff state;
- unchanged ADR-0104 runtime protocol version `1.4.0`.

`docs/adr/registry.json` is intentionally unchanged for this remediation because no ADR display ID, authority ID, lifecycle or runtime protocol version changes. The current document-role validator does not require a new Document Registry entry merely because this authority document exists; `docs/governance/document-registry.json` therefore remains unchanged unless a later validator/authority explicitly requires registration.

Before Human Merge of the remediation snapshot:

```text
STAGE_D_FINALIZATION = BLOCKED
CUTOVER_EFFECTIVE = NOT_YET_ESTABLISHED
```

After Human Merge and successful post-merge current-main correlation:

```text
STAGE_D_FINALIZATION = PASS
OWNER_DEVICE_AUTHORIZATION_GOVERNANCE_CUTOVER = EFFECTIVE
ADR_0104_DEVICE_BACKED_ACTIVATION_REQUIREMENT = MANDATORY
```

There is no retrospective activation. Existing sessions, approvals and consumed slots are not upgraded or extended.

## 9. Required durable data model

The runtime maintains distinct M10-independent records with semantics equivalent to:

- `owner_device_credentials` — public credential material and lifecycle only;
- `owner_authorization_challenges` — short-lived exact-context challenges;
- `owner_authorization_evidence` — immutable successful/denied authorization evidence;
- `owner_authorization_consumptions` — one-time mutation/activation consumption.

Sensitive/private material MUST NOT be stored. The minimum credential record includes Owner ID, public key, signature counter where applicable, transports, credential device type, backup eligibility/state, AAGUID where justified, created/revoked timestamps and privacy-preserving device reference.

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

## 11. Mandatory negative-test boundary

Implementation and independent Security verification cover at minimum:

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
- ADR-0104 different project/folder or Project Set -> DENY;
- ADR-0104 version/current-main drift -> DENY and re-correlate;
- copied activation text without device proof after cutover -> DENY;
- audit persistence unavailable -> DENY;
- revoked credential -> DENY;
- device loss recovery attempting weak-factor downgrade -> DENY;
- agent self-approval -> DENY;
- agent/automation merge or auto-merge attempt -> DENY irrespective of device approval.

## 12. Reuse / state-of-the-art direction

Implementation reuses maintained WebAuthn/FIDO2 libraries rather than custom cryptography. Repository use of `@simplewebauthn/server` is compatible with this direction and does not revive retired M10 authority.

The design follows WebAuthn public-key authentication, relying-party scoping, User Presence/User Verification and credential backup/device-type signals. Device binding is defined by cryptographic credential properties, not by a globally correlatable hardware identifier.

## 13. OPS implementation return

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-02`
- **target_project:** `CAPITAL-AI-OPS`
- **target_project_folder:** `docs/projects/operations/`
- **primary_owner:** `CAPITAL-AI-OPS`
- **returned_evidence:** PRs `#702`, `#704`, `#705`
- **verification_gate:** independent CAPITAL-AI-SEC verification
- **status:** `IMPLEMENTED / RETURNED`

This section remains for traceability; it is not an instruction to reimplement or revive M10.

## 14. Security verification return

### [SECURITY_HANDOFF -> CAPITAL-AI-SEC | VC-05]
### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-SEC | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **routing_context:** cross-cutting Security verification
- **target_project:** `CAPITAL-AI-SEC`
- **target_project_folder:** `docs/projects/security/`
- **primary_owner:** `CAPITAL-AI-SEC` for Security requirements/verification only
- **returned_evidence:** PR `#709` and final Stage-C re-verification evidence
- **verification_gate:** `STAGE_C_SECURITY_VERIFICATION = PASS`
- **status:** `VERIFIED / RETURNED`

GOV consumes this evidence; GOV does not self-assert independent Security verification.

## 15. Governance return / exit gate

The Stage-D finalization gate requires all of the following:

1. OPS implementation is `IMPLEMENTED / EVIDENCE_READY`;
2. protected delegated GitHub mutation paths preserve the defined approval boundary;
3. ADR-0104 activation verification remains exact-slot/chat/project-set/version/current-main bound;
4. single-device WebAuthn enforcement and fail-closed recovery boundaries remain implemented;
5. required replay/negative tests are covered by the Human-merged Stage-C PASS;
6. CAPITAL-AI-SEC independently returns sufficient verification evidence;
7. the final Authority/Control/Registry remediation has an Owner-visible semantic diff and preserves Human-only merge;
8. Human Owner explicitly approves PR creation for the exact final candidate and later performs the merge;
9. post-merge current-main correlation confirms the authority and control are present and no relevant Security/runtime regression was introduced.

No step in this contract authorizes agent merge, auto-merge, deployment, production mutation or an ADR-0104 activation by itself.

```text
MERGE = HUMAN/CODEOWNER ONLY
AUTO_MERGE_BY_AGENT = FORBIDDEN
ADR_0104_RUNTIME_PROTOCOL_VERSION = 1.4.0
```
