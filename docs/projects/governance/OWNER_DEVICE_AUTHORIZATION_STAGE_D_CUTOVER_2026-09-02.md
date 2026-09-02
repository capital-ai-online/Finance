# CAPITAL-AI-GOV — Owner Device Authorization Stage-D Cutover Candidate

**Document ID:** `DOC-GOV-OWNER-DEVICE-STAGE-D-CUTOVER-2026-09-02`  
**Status:** `GOV STAGE_D CANDIDATE / NON-EFFECTIVE UNTIL HUMAN MERGE`  
**Date:** `2026-09-02`  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary stage:** `PVC-05 — Platform Director`  
**Trust root:** `/AGENTS.md`  
**Runtime authority binding preserved:** `ADR-0104 v1.4.0` / `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`

## 1. Decision

CAPITAL-AI-GOV determines that the Stage-D entry conditions for the Owner Device Authorization cutover are satisfied on the observed baseline `main@387c039ff06db9fa6d821cd13c66296d3cc35def`.

This document is the bounded Stage-D Governance cutover candidate. It does not become effective by branch commit, chat statement or Pull Request creation. The cutover becomes effective only if this exact Governance candidate is Human-merged and remains consistent with then-current `/AGENTS.md` and the canonical Governance authorities.

## 2. Source evidence

The candidate relies on Human-merged current-main evidence:

- OPS implementation/remediation: PRs `#702`, `#704`, `#705`;
- PR `#705` merge: `2e5a4c23bca91032aa10b03bb573bb0801b7965d`;
- independent SEC re-verification: PR `#709`;
- PR `#709` merge/current-main baseline: `387c039ff06db9fa6d821cd13c66296d3cc35def`;
- Security evidence: `docs/evidence/security/CAPITAL_AI_SEC_OWNER_DEVICE_AUTHORIZATION_STAGE_C_REVERIFICATION_2026-09-02.md`;
- `SEC-FIND-ODA-003 = CLOSED`;
- `STAGE_C_SECURITY_VERIFICATION = PASS`.

Historical Stage-C FAIL evidence remains historical and MUST NOT be rewritten.

## 3. Cutover semantics

Before Human merge of this Stage-D candidate:

```text
OWNER_DEVICE_AUTHORIZATION_RUNTIME = IMPLEMENTED
SECURITY = VERIFIED / STAGE C PASS
GOVERNANCE_DEVICE_CUTOVER = NOT YET EFFECTIVE
```

After Human merge, provided final current-main correlation remains valid:

```text
OWNER_DEVICE_AUTHORIZATION = GOVERNANCE CUTOVER EFFECTIVE
ADR_0104_DEVICE_BACKED_ACTIVATION_REQUIREMENT = EFFECTIVE
```

There is no retroactive activation. Existing sessions or approvals are not upgraded by this document.

## 4. Runtime/ADR compatibility

The productive verifier binds activation context to ADR-0104 authority ID and version `1.4.0`. Stage D therefore MUST NOT silently change the runtime protocol binding to a new ADR version without a separately implemented and independently security-verified runtime migration.

This cutover satisfies ADR-0104 v1.4.0 section 7's deferred Human-merged device-bound transition condition. It does not alter the runtime's `adrVersion` field or weaken `ADR0104_AUTHORITY_DRIFT` fail-closed behavior.

## 5. Preserved ADR-0104 invariants

Stage D does not alter:

- `PT8H` duration;
- maximum immutable Project Set size of three;
- exact chat binding;
- slot model `S1` / `S2` / `S3`;
- Project ownership or PVC ownership;
- out-of-set cross-project routing;
- current-main binding;
- Project-Set digest binding;
- Human Owner binding;
- Human/CODEOWNER-only merge;
- production mutation/deployment gates.

## 6. Device-backed activation requirement

After effective Human-merged cutover, a text command, emoji, copied prompt, stored device identifier, browser fingerprint, caller-supplied `deviceId`, stale approval or previously valid assertion is insufficient to activate an ADR-0104 slot.

Activation requires the M10-independent Owner Device Authorization path and a successful WebAuthn ceremony bound to the exact activation transaction. The credential profile remains single-device, `backupEligible=false`, `backedUp=false`, with required User Presence and User Verification, canonical RP ID, explicit HTTPS origin, Owner binding, challenge/context binding, current-main binding, ADR-version binding, immutable canonical Project-Set binding and atomic single-use consumption.

Raw Device ID and browser fingerprint remain non-authorizing identifiers.

## 7. Security prerequisites consumed by GOV

GOV consumes, but does not re-assert as independent SEC verification, the Human-merged SEC Stage-C evidence for:

- wrong RP ID -> DENY;
- wrong HTTPS origin -> DENY;
- `UP=false` -> DENY;
- `UV=false` -> DENY;
- assertion replay/counter violation -> DENY;
- no consumption on DENY -> PASS;
- canonical Project-Set drift -> DENY;
- current-main drift -> DENY;
- ADR-version drift -> DENY;
- consumed slot -> DENY;
- revoked/foreign/backup credential -> DENY;
- audit/persistence failure -> fail closed.

If a later current-main change invalidates these prerequisites before Human merge, this candidate becomes `REQUIRES_SECURITY_RECORRELATION` and MUST NOT be treated as an effective cutover.

## 8. Merge authority boundary

The device authorization mechanism does not delegate merge authority.

```text
MERGE = HUMAN/CODEOWNER ONLY
AUTO_MERGE_BY_AGENT = FORBIDDEN
DEVICE_AUTHORIZATION_IMPLIES_MERGE_AUTHORITY = FALSE
```

A successful WebAuthn ceremony may satisfy only the protected Owner approval/activation surfaces explicitly authorized by current Governance. It cannot authorize an agent or automation to merge a Pull Request.

## 9. Recovery boundary

Recovery MUST NOT downgrade authorization to raw device ID, browser fingerprint, SMS, email link, TOTP-only, text command or another weak factor. Device loss requires an independently governed recovery/re-enrollment path preserving Human Owner verification and fail-closed behavior.

## 10. Effective-state gate

This candidate is `STAGE_D_READY` but `CUTOVER_EFFECTIVE = NO` while it exists only on a branch or open PR.

Only after Human merge may CAPITAL-AI-GOV re-read current main, identify the actual merge commit, verify Authority/Control consistency and state `CUTOVER_EFFECTIVE = YES`.

No production provider mutation or deployment is implied by Governance merge.

## 11. Traceability

```text
OPS_IMPLEMENTATION = IMPLEMENTED
SEC_VERIFICATION = VERIFIED
SEC_FIND_ODA_003 = CLOSED
STAGE_C_SECURITY_VERIFICATION = PASS
STAGE_D_ENTRY_GATE = PASS
STAGE_D_READY = YES
GOV_STAGE_D_CANDIDATE = YES
CUTOVER_EFFECTIVE = NO_UNTIL_HUMAN_MERGE
MERGE_AUTHORITY = HUMAN/CODEOWNER_ONLY
```
