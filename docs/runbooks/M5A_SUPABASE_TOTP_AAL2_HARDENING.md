# M5A Runbook — Supabase Native TOTP MFA / AAL2 Hardening

**Status:** PLANNED — NO PRODUCTION MUTATION AUTHORIZED  
**Date:** 2026-08-12  
**Authority:** ESS-0020, ADR-0064  
**Production project:** `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`)

## 1. Safety rule

This runbook is sequential and fail-closed:

`BASELINE → OWNER APPROVAL → CODE IMPLEMENTATION + CI → PRE-MUTATION CHECK → OWNER MUTATION APPROVAL → NATIVE MFA ENROLLMENT → AAL2 VERIFICATION → NEGATIVE TESTS → RECOVERY TEST → SECURITY ADVISOR → EVIDENCE → ROADMAP UPDATE`

Do not skip a gate. No step in the baseline PR authorizes enrollment, factor deletion, project Auth setting changes or legacy data cleanup.

## 2. Baseline state

Verified read-only on 2026-08-12:

- native MFA factors: 0;
- production AAL2 sessions: 0;
- current active session evidence: 2 × AAL1;
- two Owner profiles have legacy custom TOTP enabled;
- 20 unused legacy break-glass codes exist;
- no active legacy step-up token exists;
- Security Advisor reports `auth_insufficient_mfa_options`;
- project organization plan is Free;
- native Auth MFA tables already exist.

## 3. Stage A — Architecture approval

Required repository artifacts:

- ESS-0020;
- ADR-0064;
- M5A baseline evidence;
- this runbook;
- ROADMAP + implementation roadmap + traceability update;
- ADR-0003.5 reactivated as IN PROGRESS because its Owner-TOTP assurance statement is not currently satisfied by Supabase AAL2.

Exit:

- Human/Owner reviewed current PR head;
- docs-fast-path PASS;
- PR merged;
- baseline branch deleted after merge.

## 4. Stage B — Application implementation

Create a fresh branch from the post-Stage-A `main`.

### B1 — Native enrollment

Replace the authoritative TOTP setup path with Supabase Native MFA:

1. call `supabase.auth.mfa.enroll({ factorType: 'totp' })`;
2. render QR code and optional secret only to current authenticated user;
3. create a challenge;
4. verify the entered TOTP code;
5. evaluate `getAuthenticatorAssuranceLevel()` after verify;
6. treat setup as successful only if the resulting state is `aal2/aal2`.

Do not write a native TOTP secret to public application tables.

### B2 — Login/session gate

For Owner/Admin privileged access:

- `aal1/aal1` → enrollment required / deny privileged access;
- `aal1/aal2` → challenge required;
- `aal2/aal2` → MFA condition satisfied;
- `aal2/aal1` → stale/downgraded; deny and refresh/re-authenticate.

Network/Auth errors → deny privileged access. Remove the current fail-open privileged behavior.

### B3 — Server enforcement

Add one canonical helper, conceptually:

```text
requireVerifiedAal2(req)
```

It must use the Bearer token already tied to the Supabase identity and must not trust client-provided AAL fields.

Privileged server paths must compose:

```text
checkAdminAccess
+ requireVerifiedAal2
+ requireStepUp (where action contract requires fresh purpose-bound confirmation)
```

### B4 — Step-up

Retain the purpose-bound single-use token only as defense-in-depth.

It cannot:

- be issued from an AAL1 session;
- be accepted if the current user session is no longer valid AAL2;
- authorize a different user or purpose;
- be replayed after consumption.

### B5 — Recovery

Implement a native-MFA-aware recovery contract before legacy TOTP retirement.

Preferred controls:

- backup TOTP factor/recovery procedure documented and tested;
- destructive native factor removal restricted to Owner-controlled server path;
- factor deletion via supported Supabase Admin MFA API;
- factor reset logged as CRITICAL audit event;
- no automatic role elevation;
- no automatic unrelated passkey deletion.

## 5. Stage C — CI / pre-mutation verification

Before touching production factors:

Required CI:

- repository integrity;
- TypeScript;
- unit tests;
- new MFA/AAL2 negative tests;
- production build;
- predeploy/runtime checks required by changed scope.

Mandatory negative tests:

1. AAL1 Owner/Admin denied;
2. missing factor denied;
3. unverified factor denied;
4. invalid TOTP denied;
5. expired/invalid challenge denied;
6. stale AAL2/AAL1 denied;
7. Auth/AAL verification error denied;
8. AAL1 + valid legacy/custom step-up denied;
9. AAL2 + wrong-purpose token denied;
10. replayed token denied;
11. unauthorized recovery/factor deletion denied.

Stage C exit: CI `VERIFIED PASS`.

## 6. Stage D — Production pre-mutation check

**READ ONLY.**

Immediately before enrollment:

1. confirm project health;
2. rerun aggregate native factor count;
3. rerun aggregate AAL distribution;
4. verify current Owner roles without exposing identities;
5. verify Security Advisor baseline;
6. test whether Native TOTP enroll/challenge/verify is available through the application path;
7. determine whether Dashboard Auth configuration mutation is actually required.

If native API is unavailable due project setting, STOP and request a separate Owner approval for the exact setting change.

Do not alter settings speculatively.

## 7. Stage E — Human/Owner production mutation approval

Approval must explicitly cover:

- native TOTP enrollment for the two Owner identities;
- any exact Auth configuration change proven necessary in Stage D;
- controlled recovery test scope;
- expected session invalidation/refresh behavior.

Without this approval: STOP.

## 8. Stage F — Native Owner enrollment

Perform via supported application/Supabase Auth flow, one Owner identity at a time.

For each Owner:

1. maintain a verified recovery path for the other Owner before starting;
2. enroll TOTP;
3. challenge;
4. verify;
5. confirm current AAL2;
6. sign out/in or refresh as required and prove MFA challenge behavior;
7. verify privileged AAL2-gated action in a safe/non-destructive test;
8. record redacted evidence only.

Never record the TOTP secret, QR payload, code or factor identifier in repository evidence.

## 9. Stage G — Negative production verification

Use safe/non-destructive paths where possible:

- AAL1 session cannot invoke privileged endpoint;
- invalid code cannot verify;
- stale/downgraded session cannot invoke privileged endpoint;
- missing purpose-bound step-up blocks critical Owner action;
- consumed token replay blocks;
- audit event contains no sensitive MFA payload.

No test should deliberately weaken production security configuration.

## 10. Stage H — Recovery verification

Verify a documented recovery/backup route without permanently locking out both Owner accounts.

If testing native factor removal:

- explicit Human/Owner approval required;
- test only one controlled factor while another valid recovery path remains;
- verify all affected sessions are invalidated as expected;
- re-enroll and restore AAL2 before declaring PASS.

Legacy break-glass codes remain transitional until this stage passes.

## 11. Stage I — Post-mutation verification

After successful native enrollment:

- native factor aggregate reflects expected verified factors;
- AAL2 session evidence exists for tested Owner sessions;
- privileged AAL1 paths deny;
- Advisor rerun completed;
- no new critical Security Advisor finding created;
- M5A audit evidence completed.

## 12. Stage J — Legacy cleanup decision

Do **not** clean up automatically.

Create a separate mutation decision for:

- `profiles.totp_enabled`;
- `totp_secret_encrypted` / pending secret fields;
- legacy break-glass code table/data;
- legacy local TOTP verifier and server setup routes;
- legacy step-up issuance logic that still depends on local TOTP.

Cleanup is authorized only after native MFA + recovery + AAL2 enforcement are `VERIFIED PASS`.

## 13. Rollback / stop conditions

STOP immediately if:

- native factor enrollment cannot reach AAL2;
- both Owner recovery paths would be at risk simultaneously;
- server AAL2 verification behaves fail-open;
- stale session is accepted;
- CI fails;
- Advisor shows a new critical finding;
- mutation scope differs from approved scope.

Rollback application enforcement if necessary, but preserve audit evidence and do not delete native factors automatically.

## 14. M5A exit

M5A may be marked `COMPLETE / VERIFIED PASS` only after:

- code implementation merged;
- required CI PASS;
- native Owner enrollment verified;
- AAL2 positive/negative tests PASS;
- recovery PASS;
- Advisor rerun;
- final evidence + Roadmap + traceability synchronized.

Only then may M6 begin.
