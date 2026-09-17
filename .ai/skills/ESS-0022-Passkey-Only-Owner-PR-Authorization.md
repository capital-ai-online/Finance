# ESS-0022 — Passkey-only Human/Owner PR Authorization

Status: PROPOSED — IMPLEMENTATION BLOCKED BY M9
Version: `1.0.0`
Date: 2026-08-12
Scope: CAPITAL-AI DEVELOPMENT Chain M10
Owner: `SvenKulessa`
Repository: `SvenKulessa/Finance`
Authority: ADR-0066, DEVELOPMENT Chain Execution Policy, Human Owner PR Approval Policy

## 1. Purpose

Define the normative Enterprise System Specification for replacing the transitional emoji/text + PR-body checkbox authorization before expensive CI with a CAPITAL-AI-owned, PR-state-bound WebAuthn/passkey approval transaction.

M10 does **not** automate merge. Human file review and Human/Owner merge remain separate controls.

## 2. Target Sequence

```text
PR OPEN / UPDATE
→ Human reviews complete changed-file set
→ all files Viewed
→ trusted service resolves exact current PR state
→ server generates single-use WebAuthn challenge
→ Owner completes passkey assertion with required user verification
→ server verifies assertion + exact PR context
→ immutable approval evidence persists
→ exactly one CI request consumes approval
→ build-and-test
→ Human merge
```

## 3. Authorization Context

Every `AUTHORIZE_PR_CI` transaction MUST bind at least:

- Owner: `SvenKulessa`;
- Repository: `SvenKulessa/Finance`;
- Pull Request number;
- base branch;
- exact base SHA;
- exact current head SHA;
- canonical sorted changed-file-set hash;
- canonical PR diff/review digest;
- action: `AUTHORIZE_PR_CI`;
- challenge ID;
- challenge issue time;
- challenge expiry;
- approval consumption/replay state.

A new commit, force-push, base change, changed-file-set change or material diff change MUST invalidate an earlier approval.

## 4. WebAuthn Verification Requirements

Server-side verification MUST enforce:

- cryptographically random server-generated challenge;
- short expiry;
- single-use challenge;
- expected HTTPS origin;
- expected RP ID;
- registered Owner credential binding;
- assertion signature verification;
- authenticator `UP` (User Presence);
- authenticator `UV` (User Verification) required;
- expected challenge match;
- credential revocation state;
- replay/consumption check;
- exact PR authorization-context match.

Client-side device identity, browser state or provider assertions are not sufficient authority.

## 5. Human File Review

Human file review remains mandatory.

The system MUST derive the canonical changed-file set from trusted GitHub state rather than accepting an agent-supplied file list as authoritative.

The approval transaction MUST bind the reviewed file set and current diff/review digest. `Viewed` status remains Human workflow evidence; the cryptographic approval binds the resolved state that the Owner is authorizing.

## 6. Audit

Before CI can be requested, immutable M5-compatible approval evidence MUST be persisted.

Evidence SHOULD include:

- human actor ID;
- repository / PR;
- base/head SHA;
- file-set hash;
- diff/review digest;
- action;
- challenge/approval IDs;
- credential public identifier/reference suitable for audit;
- UP/UV verification result;
- RP/origin verification result;
- issued/verified/consumed timestamps;
- CI request/result reference.

Evidence MUST NOT include:

- private keys;
- biometric material;
- reusable authenticator secrets;
- raw passwords;
- TOTP secrets/codes;
- recovery codes;
- reusable bearer credentials.

## 7. Single CI Consumption

A valid approval may authorize exactly one normal expensive CI request for its exact PR state.

Duplicate requests for an already consumed approval/head MUST be rejected or deterministically deduplicated.

An unconsumed approval cannot be retargeted to another PR/base/head/file set/diff/action.

## 8. Legacy Cutover

Until M10 `VERIFIED PASS`, the current transitional Owner gate remains authoritative.

After controlled cutover, the following MUST no longer authorize expensive CI:

- `💪`;
- `okay`;
- generic GitHub review status;
- PR-body Owner checkboxes;
- reactions;
- comments;
- labels;
- device ID;
- provider/model identity;
- GitHub login method alone.

Legacy signals may remain as non-authoritative workflow/display evidence only where useful.

## 9. Recovery / Break-Glass

Passkey recovery is a separate strong Human/Owner flow.

Recovery MUST:

- verify the Owner through an approved strong recovery path;
- be reason-bound and audited;
- avoid silent fallback to emoji/checkbox/TOTP-only PR authorization;
- not grant agent merge authority;
- support credential revocation/re-enrollment;
- invalidate affected outstanding challenges/approvals when necessary.

Break-glass is disabled by default and governed by M9/ADR-0063.

## 10. Agent Boundary

No agent may:

- self-enroll an Owner credential;
- answer the Owner WebAuthn challenge as the Owner;
- modify the approval context after assertion;
- accept agent-provided file/diff hashes as authoritative without trusted recomputation;
- consume approval for a different action;
- grant itself `MERGE`;
- weaken RP/origin/UP/UV/replay/audit checks.

Audit/verifier unavailable → CI authorization `DENY`.

## 11. Threat Model

Normative threat model:

`docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`

It covers RP/origin confusion, replay, TOCTOU/state drift, forged review/diff context, stolen session, compromised agent, recovery bypass, credential revocation, audit outage and duplicate CI triggering.

## 12. Implementation Runbook

Normative runbook:

`docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

Required rollout:

1. architecture/ESS/threat model approval;
2. implementation;
3. unit/integration/security tests;
4. Owner passkey enrollment + recovery proof;
5. shadow mode while legacy gate remains authoritative;
6. decision comparison;
7. negative/replay/freshness/revocation tests;
8. controlled passkey-only cutover;
9. legacy authorization cleanup;
10. final Evidence and Roadmap sync.

## 13. Mandatory Positive Tests

- correct Owner credential + exact current PR state → verified approval;
- immutable audit record persisted;
- one CI request consumes approval;
- approved current head runs required build-and-test;
- Human merge remains independent after green CI.

## 14. Mandatory Negative Tests

- wrong credential → DENY;
- wrong RP ID/origin → DENY;
- `UP=false` → DENY;
- `UV=false` → DENY;
- expired challenge → DENY;
- replayed challenge/assertion → DENY;
- revoked credential → DENY;
- wrong repository/PR/base/head → DENY;
- changed file set/diff after challenge issue → invalidate/DENY;
- unavailable verifier → DENY;
- unavailable durable audit → DENY;
- duplicate CI consumption → DENY/DEDUPE;
- forged emoji/comment/reaction/checkbox → no authorization;
- agent self-approval → DENY.

## 15. Rollback

Before legacy removal, rollback disables M10 enforcement and returns to the still-authoritative transitional gate.

After legacy cleanup, rollback MUST use a separately pre-approved recovery design and MUST NOT silently re-enable weaker legacy authorization without Human/Owner incident approval.

## 16. Exit Gate

M10 is `COMPLETE / VERIFIED PASS` only when:

- M9 prerequisite is `VERIFIED PASS`;
- exact-state WebAuthn approval works end-to-end;
- required positive/negative/replay/recovery tests PASS;
- shadow comparison is accepted;
- immutable approval/audit evidence works;
- exactly one CI request per approval/head is proven;
- legacy emoji/checkbox authorization is removed from the CI authorization path;
- Human file review remains;
- Human-only merge remains;
- rollback/recovery is proven;
- Evidence/Roadmap/Traceability are synchronized;
- implementation branch is deleted after Human merge.
