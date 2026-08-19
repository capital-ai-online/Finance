# M10 Phase 6 — Negative / Recovery Assurance

Status: VERIFIED PASS — SHADOW / NEGATIVE / RECOVERY ASSURANCE COMPLETE  
Date: 2026-08-19  
Branch: `agent/m10-phase6-negative-recovery-assurance`  
Baseline after correlation: `main@24b70a794a7ce7dad62197f42a8948b347dbfbc3`  
Authority: ADR-0066, ESS-0022, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`, M10 Threat Model

## Purpose

This evidence-only work package completes the Phase-6 shadow / negative / recovery assurance required before any Controlled Cutover. It does not make M10 authoritative for CI and it does not change runtime, workflow, database, IAM, secrets, or deployment configuration.

The dedicated PR created from this branch is an assurance instrument and must be closed, not merged, after final CI/Governance verification.

## Production positive shadow evidence

A real Owner WebAuthn assertion was completed in production against PR #423 after the Phase-6 WebAuthn descriptor fix was deployed.

Verified durable evidence:

- verdict: `APPROVED_SHADOW`;
- repository: `SvenKulessa/Finance`;
- PR: `423`;
- head SHA: `6dc6bd5d921982595d33b7a1f94e59e496a2f855`;
- `authoritativeForCi=false`;
- `dispatchEnabled=false`;
- no `m10_approval_evidence` row for PR #423;
- no `m10_ci_consumptions` row for PR #423;
- append-only agent audit contains correlated begin + complete events for the exact PR head.

PR #423 was subsequently closed without merge.

## Mandatory negative assurance

The authoritative runbook requires the negative/replay/freshness/revocation matrix to PASS before Controlled Cutover. It does not require every case to be exercised through a deliberately disruptive production maneuver; live-safe production checks are combined with automated verifier/consumer regression evidence.

### N1 — Closed PR fail-closed — LIVE PASS

Target: closed PR #423.

Observed production result:

- Shadow begin rejected before WebAuthn ceremony with `PR ist nicht offen (Status: closed)`;
- no new `APPROVED_SHADOW` was created by the attempt;
- no authoritative approval evidence was created;
- no CI consumption was created.

Status: **PASS**.

### N2 — PR-state drift — CONTROL PASS / LIVE TIMING ATTEMPT INCONCLUSIVE

A live single-device timing exercise was attempted against PR #426.

Facts:

- challenge/assertion completed successfully on head `e49e152531011525289ab597d243b54c84fcc6e7` at 2026-08-19 04:53:12Z;
- the intentional documentation-only drift commit `35ccebe8dabaa0ce2eba10dec816a45aa7328ae4` landed later at 2026-08-19 04:54:06Z;
- therefore the successful assertion was never stale and the live attempt cannot be claimed as a drift-DENY test;
- no security failure was observed.

The mandatory changed base/head/file-set/diff invariant is nevertheless **PASS** through the existing Phase-4 verifier regression test on `main`: after challenge issuance the verifier re-resolves trusted GitHub state, detects head/diff drift, revokes the challenge and returns `DENY` before cryptographic assertion verification or evidence persistence.

Phase-5 regression coverage independently denies PR drift before claim/dispatch.

Status: **PASS via automated fail-closed control; live timing exercise transparently INCONCLUSIVE**.

### N3 — Freshness / abandoned challenge — LIVE + AUTOMATED PASS

During the single-device exercise an earlier production challenge was issued at 2026-08-19 04:52:06Z, abandoned by the Owner and never consumed. Its fixed two-minute validity window ended at 04:54:06Z without approval evidence.

Automated Phase-2 tests additionally prove:

- fixed `M10_CHALLENGE_TTL_MS = 2 minutes`;
- validity is strict within `[issuedAt, expiresAt)`;
- `expiresAt` itself is invalid;
- consumed/revoked challenges remain invalid even inside the time window;
- single-use consumption rejects replay.

Status: **PASS**.

### Additional automated negative matrix — PASS

Existing tests on `main` cover:

- wrong/unresolvable repository or PR -> DENY;
- unknown/revoked credential -> DENY before cryptographic verification;
- invalid signature -> DENY and challenge becomes non-replayable;
- RP ID and User Verification requirements passed explicitly to the verifier;
- failed atomic authenticator-counter persistence -> DENY;
- failed immutable evidence persistence -> DENY;
- Phase-5 PR drift -> DENY before claim or dispatch;
- already-consumed approval -> DEDUPE with no dispatch;
- second approval for an already-claimed head -> DEDUPE with no dispatch;
- ambiguous/network dispatch outcome -> terminal uncertainty, never blind retry;
- Shadow router has no legacy emoji/checkbox authorization capability and no Phase-5 dispatch wiring.

Production Shadow additionally confirms the deployed RP/origin/browser ceremony and active Owner credential path.

## R1 — Fresh-head recovery — LIVE PASS

After the intentional PR-head change, the Owner initiated a fresh Shadow ceremony against the stabilized current head `35ccebe8dabaa0ce2eba10dec816a45aa7328ae4`.

Verified durable production evidence:

- Shadow begin: 2026-08-19 05:01:19Z;
- Shadow complete: 2026-08-19 05:01:28Z;
- verdict: `APPROVED_SHADOW`;
- repository: `SvenKulessa/Finance`;
- PR: `426`;
- base SHA: `24b70a794a7ce7dad62197f42a8948b347dbfbc3`;
- head SHA: `35ccebe8dabaa0ce2eba10dec816a45aa7328ae4`;
- audit begin and complete are bound to the same exact head;
- `authoritativeForCi=false`;
- `dispatchEnabled=false`;
- `m10_approval_evidence` rows for PR #426: `0`;
- `m10_ci_consumptions` rows for PR #426: `0`.

Status: **PASS**.

## Shadow isolation and audit — PASS

Across the production positive and recovery ceremonies:

- Shadow evidence is append-only and separate from authoritative approval evidence;
- no Phase-5 CI consumption was created;
- no CI dispatch was triggered by Shadow;
- audit records `m10_shadow_authorization_begin` and `m10_shadow_authorization_complete` with exact repository/PR/head correlation;
- all successful Shadow audit events explicitly record `authoritativeForCi=false` and `dispatchEnabled=false`.

Status: **PASS**.

## State-of-the-art alignment

The assurance model follows WebAuthn relying-party requirements for fresh server-generated challenges, expected challenge/origin/RP verification, User Verification, credential/signature validation and replay resistance. CAPITAL-AI adds transaction binding to the exact GitHub PR state by hashing and re-resolving repository, PR, base/head, changed-file set and diff context before acceptance.

The assurance strategy deliberately avoids weakening production controls merely to manufacture a live failure. Deterministic automated negative tests cover unsafe-to-induce failure modes; production Shadow verifies the real authenticator, GitHub resolver, durable stores, audit chain and fresh-head recovery path.

## Phase-6 exit assessment

The runbook Controlled Cutover prerequisite `shadow + negative + recovery evidence VERIFIED PASS` is satisfied by the combined evidence in this package:

1. real Owner production Shadow assertion — **PASS**;
2. closed/stale PR fail-closed — **PASS**;
3. challenge freshness/replay controls — **PASS**;
4. changed base/head/file-set/diff fail-closed control — **PASS** through deterministic verifier regression evidence; live timing attempt explicitly not counted;
5. recovery with fresh challenge on new exact head — **PASS**;
6. immutable Shadow/audit evidence — **PASS**;
7. zero authoritative approvals / zero CI consumptions from Shadow — **PASS**;
8. legacy checkbox/emoji authority absent from Shadow — **PASS**.

Therefore **Phase 6 Shadow / Negative / Recovery Assurance = VERIFIED PASS**.

This does **not** mark M10 itself `COMPLETE`: the authoritative passkey CI gate, exactly-one approved-head CI proof, unapproved-CI suppression and post-cutover negative tests remain part of the separate Controlled Cutover work package.

## Lifecycle

- PR #426 remains an evidence-only assurance probe.
- It must not be merged into `main`.
- After the final Documentation Fast Path, Governance and branch-vs-main correlation succeed, close PR #426.
- Controlled Cutover must start on a new branch created fresh from then-current `main` and requires its own explicit PR authorization / Human merge boundary.
