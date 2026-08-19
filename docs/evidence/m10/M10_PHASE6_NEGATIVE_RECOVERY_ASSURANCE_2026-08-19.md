# M10 Phase 6 — Negative / Recovery Assurance

Status: IN PROGRESS — LIVE SHADOW NEGATIVE / RECOVERY EVIDENCE
Date: 2026-08-19
Branch: `agent/m10-phase6-negative-recovery-assurance`
Baseline: `main@2c7854184f6d39d9cd96cc762c9a59d62a749a6d`
Authority: ADR-0066, ESS-0022, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`, M10 Threat Model

## Purpose

This evidence-only work package completes the remaining Phase-6 assurance before any Controlled Cutover. It does not make M10 authoritative for CI and it does not change runtime, workflow, database, IAM, secrets, or deployment configuration.

The dedicated PR created from this branch is an assurance instrument and must be closed, not merged, after the evidence is captured.

## Already verified production positive path

A real Owner WebAuthn assertion was completed in production against PR #423 after the Phase-6 WebAuthn descriptor fix was deployed.

Observed durable evidence:

- verdict: `APPROVED_SHADOW`;
- repository: `SvenKulessa/Finance`;
- PR: `423`;
- base SHA: `2c7854184f6d39d9cd96cc762c9a59d62a749a6d`;
- head SHA: `6dc6bd5d921982595d33b7a1f94e59e496a2f855`;
- `authoritativeForCi=false`;
- `dispatchEnabled=false`;
- no `m10_approval_evidence` row for PR #423;
- no `m10_ci_consumptions` row for PR #423;
- append-only agent audit contains `m10_shadow_authorization_begin` and successful `m10_shadow_authorization_complete` for the same PR head.

PR #423 was subsequently closed without merge.

## Automated negative coverage already present on main

Existing Phase-4/5 tests cover exact-state binding and fail-closed behavior including:

- current PR head/diff drift -> DENY and challenge revoke;
- unknown/revoked credential -> DENY before cryptographic verification;
- bad signature -> DENY and challenge becomes non-replayable;
- atomic authenticator counter persistence failure -> DENY;
- immutable approval-evidence persistence failure -> DENY;
- explicit expected RP ID and `requireUserVerification=true` passed to the WebAuthn verifier;
- Phase-5 PR drift -> DENY before claim or dispatch;
- already-consumed approval -> DEDUPE with no dispatch;
- second approval for an already-claimed head -> DEDUPE with no dispatch;
- ambiguous/network dispatch outcome -> terminal uncertainty, never blind retry.

These automated controls complement, but do not replace, the live Shadow state-binding tests below.

## Live assurance sequence

### N1 — Closed PR must fail closed

Target: closed PR #423.

Expected: `/shadow/begin` refuses the request because the trusted GitHub resolver requires an open PR. No WebAuthn ceremony and no shadow approval may be created.

Status: PENDING OWNER EXECUTION.

### N2 — Exact PR-state drift between challenge issuance and completion

Target: the dedicated assurance PR created by this branch.

Sequence:

1. Owner starts Shadow authorization and waits at the passkey confirmation prompt without completing it.
2. While that challenge is outstanding, a documentation-only commit is added to this branch, changing the PR head and diff.
3. Owner completes the already-issued WebAuthn prompt.
4. Server must re-resolve GitHub state and return DENY before accepting the assertion as shadow approval.
5. No new `APPROVED_SHADOW`, real approval evidence, CI consumption, or dispatch may be produced for the stale head.

Status: PENDING COORDINATED OWNER / AGENT EXECUTION.

### R1 — Recovery on fresh challenge and stabilized current head

After N2 DENY, Owner starts a new Shadow authorization on the new stable head and completes the passkey ceremony.

Expected:

- `APPROVED_SHADOW` on the new exact head;
- audit success bound to that head;
- still no authoritative approval, Phase-5 consumption, or CI dispatch.

Status: PENDING N2 COMPLETION.

## Additional fail-closed matrix

The following cases remain required by the authoritative M10 runbook and are satisfied through existing automated verifier/consumer tests unless a live-safe production exercise is explicitly noted:

- wrong Owner / agent self-approval: server Owner-only authorization boundary and canonical Owner verification;
- wrong RP/origin, UP/UV false, invalid signature: WebAuthn server verification contract and signature-failure tests; production browser positive ceremony confirms the deployed RP/origin path;
- expired/replayed challenge: short-lived single-use challenge model plus replay denial test; no production data mutation is introduced solely to force expiry;
- revoked credential: active-credential-only lookup plus unknown/revoked credential DENY test;
- wrong repository / PR: canonical repository restriction plus N1 closed-PR live test;
- changed base/head/file-set/diff: exact context comparison plus N2 live drift test;
- unavailable resolver/verifier/audit: fail-closed server/store paths and existing persistence failure tests; no deliberate production outage is introduced;
- already-consumed approval: Phase-5 DEDUPE tests;
- forged legacy emoji/checkbox/label/reaction: Shadow router has no legacy authorization capability and does not consume such signals;
- weak recovery fallback: prohibited; recovery must use a fresh valid challenge and Owner WebAuthn assertion.

## State-of-the-art alignment

The live drift/recovery design follows the WebAuthn requirement that challenges are generated and checked by the Relying Party and that assertions are verified against expected challenge, origin, RP ID, user-presence/user-verification semantics. CAPITAL-AI adds a stronger transaction-binding layer by re-resolving and comparing the exact GitHub PR state before accepting the assertion.

## Exit condition for this evidence package

This evidence package may be marked `VERIFIED PASS` only after N1, N2 and R1 are executed and durable production evidence confirms:

1. stale/closed PR state is denied;
2. stale challenge after PR drift cannot create Shadow approval;
3. a fresh challenge against the stabilized new head succeeds;
4. no real M10 approval evidence or CI consumption is produced by Shadow;
5. audit correlation is present for the observed decisions.

Controlled Cutover remains a separate fresh-main branch/PR and is not authorized by this evidence-only PR.

N2 marker: documentation-only state-change commit for the live assurance exercise.
