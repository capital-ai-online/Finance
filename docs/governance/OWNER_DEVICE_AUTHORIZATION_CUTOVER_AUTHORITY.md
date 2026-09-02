# CAPITAL-AI-GOV — Owner Device Authorization Cutover Authority

**Authority ID:** `AUTH-GOV-OWNER-DEVICE-AUTHORIZATION-CUTOVER`  
**Document ID:** `DOC-GOV-OWNER-DEVICE-AUTHORIZATION-CUTOVER`  
**Version:** `1.0.0`  
**Lifecycle:** `CANDIDATE / EFFECTIVE ONLY AFTER HUMAN MERGE`  
**Effective date:** `2026-09-02`  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV`  
**Trust root:** `/AGENTS.md`  
**Runtime protocol binding preserved:** `ADR-0104 v1.4.0` / `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`

## 1. Decision

This authority is the bounded Governance Stage-D cutover for Owner Device Authorization. It closes the governance-registration gap left after Human Merge of PR #710 without changing the productive ADR-0104 runtime protocol version.

This authority becomes effective only after Human Merge of the remediation Pull Request containing this exact authority and the correlated Authority Registry and Control Catalog updates. Branch commits, chat statements, CI results and PR creation are non-authorizing.

## 2. Preconditions consumed from current main

The cutover consumes, without re-performing independent Security verification:

- OPS Owner Device Authorization implementation/remediation from PRs #702, #704 and #705;
- independent Security re-verification from PR #709;
- `SEC_FIND_ODA_003 = CLOSED`;
- `STAGE_C_SECURITY_VERIFICATION = PASS`;
- Human-merged Stage-D candidate from PR #710;
- no later relevant current-main regression at remediation start baseline `c8c87261120d227dc9132e3ec0e9d27ad6697eda`.

Historical FAIL evidence remains immutable historical evidence.

## 3. Exact cutover effect

After this authority is Human-merged and canonical registry correlation passes:

```text
OWNER_DEVICE_AUTHORIZATION_GOVERNANCE_CUTOVER = EFFECTIVE
ADR_0104_DEVICE_BACKED_ACTIVATION_REQUIREMENT = MANDATORY
TEXT_ONLY_ADR_0104_ACTIVATION = DENY
RAW_DEVICE_ID_AUTHORIZATION = DENY
BROWSER_FINGERPRINT_AUTHORIZATION = DENY
```

The cutover is prospective only. It does not retroactively upgrade, reauthorize or extend any prior activation, approval or slot.

## 4. ADR-0104 runtime compatibility boundary

This authority MUST NOT change the productive runtime protocol binding from ADR-0104 `1.4.0`.

The runtime continues to bind activation evidence to:

- authority ID `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`;
- ADR version `1.4.0`;
- exact slot;
- exact chat binding;
- immutable canonical Project Set and digest;
- current-main SHA;
- Human Owner;
- PT8H duration;
- single-use challenge/consumption semantics.

A future ADR-0104 version change that changes the runtime protocol binding is a separate OPS implementation plus independent Security re-verification work item. This Governance cutover does not manufacture that migration.

## 5. Preserved invariants

The cutover does not broaden or alter:

- `PT8H` duration;
- maximum immutable Project Set size of three;
- slot model `S1` / `S2` / `S3`;
- exact chat binding;
- Project-Set digest binding;
- current-main binding;
- project/PVC/Primary-Owner ownership;
- cross-project routing outside the authorized set;
- one-work-item/one-branch and per-project PR separation;
- provider authentication/capability gates;
- Security/Compliance assurance boundaries;
- production mutation/deployment controls;
- Human/CODEOWNER-only merge.

```text
MERGE = HUMAN/CODEOWNER ONLY
AUTO_MERGE_BY_AGENT = FORBIDDEN
DEVICE_AUTHORIZATION_IMPLIES_MERGE_AUTHORITY = FALSE
```

## 6. Device proof requirement

Protected ADR-0104 activation requires the M10-independent Owner Device Authorization path and a successful WebAuthn ceremony bound to the exact activation transaction.

The privileged credential profile remains single-device, `backupEligible=false`, `backedUp=false`, with User Presence and User Verification required, canonical RP ID, explicit HTTPS origin, Owner binding, challenge/context binding, current-main binding, ADR-version binding, immutable canonical Project-Set binding and atomic single-use consumption.

Raw device IDs, browser fingerprints, hardware serials, installation IDs, copied text, emoji, stale approvals and caller-supplied `deviceId` values are identifiers/input only and never authorization factors.

## 7. Recovery boundary

Recovery MUST NOT downgrade authorization to raw device ID, browser fingerprint, SMS, email link, TOTP-only, copied text or another weak factor. Device loss requires a separately governed Human-Owner recovery/re-enrollment path that preserves fail-closed behavior.

## 8. Security evidence boundary

CAPITAL-AI-GOV consumes the Human-merged Stage-C PASS as a prerequisite. It does not replace CAPITAL-AI-SEC and does not restate Governance evidence as independent Security verification.

A later change to Owner Authorization runtime, credential semantics, RP/origin rules, challenge/consumption semantics, ADR-version binding, Project-Set binding, persistence/audit fail-closed behavior or relevant Security evidence requires fresh correlation and, where the Security basis is invalidated, `REQUIRES_SECURITY_RECORRELATION`.

## 9. Canonical registration requirements

Before this candidate may be merge-ready, the same remediation snapshot MUST:

1. register `AUTH-GOV-OWNER-DEVICE-AUTHORIZATION-CUTOVER` in `docs/governance/authority-registry.json`;
2. add an enforceable Owner Device Authorization cutover control to `docs/governance/control-catalog.json` referencing this authority and ADR-0104;
3. project the current `/AGENTS.md` Trust Root version accurately in the Authority Registry;
4. update `docs/projects/governance/OWNER_DEVICE_AUTHORIZATION_HANDOFF.md` so its lifecycle no longer claims the Stage-D cutover is absent after the remediation Human Merge;
5. register this normative document in `docs/governance/document-registry.json` if required by the current document-role validator;
6. preserve ADR-0104 and `docs/adr/registry.json` at runtime protocol version `1.4.0` unless an independently authorized runtime migration exists.

## 10. Effective-state gate

Before Human Merge of the fully correlated remediation snapshot:

```text
STAGE_D_FINALIZATION = BLOCKED
CUTOVER_EFFECTIVE = NOT_YET_ESTABLISHED
```

Only after Human Merge and post-merge current-main correlation may Governance record:

```text
STAGE_D_FINALIZATION = PASS
CUTOVER_EFFECTIVE = YES
```

No production mutation or deployment is authorized by this document.