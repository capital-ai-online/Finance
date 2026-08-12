# M5A — Supabase TOTP MFA / AAL2 Baseline Evidence

**Status:** READ-ONLY BASELINE COMPLETE / REMEDIATION PLAN IN REVIEW  
**Date:** 2026-08-12  
**Baseline:** `main@ee65ba19f64e7e8ee2d618e16364a658dfe60e4c` (PR #211 merge)  
**Authority:** ESS-0020, ADR-0064, ADR-0003.5  
**Mutation State:** `NOT PERFORMED — HUMAN APPROVAL REQUIRED`

## 1. Scope

This evidence records the first M5A gate only:

- repository inspection of TOTP enrollment/login/step-up and IAM enforcement;
- read-only Supabase Auth/database inventory;
- current Supabase documentation comparison;
- gap classification and exact mutation decision.

No Supabase Auth factor was created, challenged, verified, removed or modified. No project Auth setting, database schema, Render setting or Stripe configuration was mutated.

## 2. Production Supabase baseline

Project: `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`)  
Project health: `ACTIVE_HEALTHY`  
Organization plan: `free`

### Auth schema presence

Read-only information-schema inspection confirms:

- `auth.mfa_factors` exists;
- `auth.mfa_challenges` exists;
- `auth.sessions` exists.

This means no custom Postgres DDL is required to create Supabase Native MFA storage.

### Native factor state

Aggregate-only query of `auth.mfa_factors`:

```text
0 native MFA factors
```

No factor IDs, secrets or user identities were read.

### Session assurance state

Aggregate-only query of `auth.sessions`:

```text
aal1: 2 sessions
aal2: 0 sessions
```

Therefore no current production session demonstrates Supabase Native MFA assurance.

### Legacy application MFA state

Aggregate read of `public.profiles`:

```text
owner + legacy totp_enabled=true: 2 profiles
user  + legacy totp_enabled=false: 2 profiles
```

Additional aggregate state:

```text
legacy break_glass_codes: 20 rows, 20 unused
legacy step_up_tokens: 0 rows, 0 currently valid
```

This proves that the two Owner identities have CAPITAL-AI's historical custom TOTP enabled while Supabase Auth itself has no MFA factors.

### Security Advisor

Current relevant warning:

- `auth_insufficient_mfa_options` — project currently has too few MFA options enabled/configured.

Separate warning:

- Leaked Password Protection disabled. This remains a Pro+ plan dependency and is not an M5A TOTP blocker under the current Free plan.

The Advisor must be rerun after any later Auth/config mutation.

## 3. Repository baseline

### `src/platform/Security/totp.ts`

Implements RFC-6238 TOTP locally with Node crypto. This code is independent of Supabase Auth MFA and cannot produce a Supabase `aal2` session.

### `server/stepUp.ts`

Current application flow:

1. `/totp/setup` generates a CAPITAL-AI secret;
2. secret is encrypted into `profiles.totp_pending_secret_encrypted`;
3. `/totp/verify-setup` verifies via local `verifyTotp()`;
4. verified secret is persisted to `profiles.totp_secret_encrypted` and `totp_enabled=true`;
5. CAPITAL-AI creates 10 own break-glass codes;
6. `/step-up/verify` verifies the local secret and issues an application `step_up_token`.

No `supabase.auth.mfa.enroll`, `challenge` or `verify` is used.

### `src/components/TotpSettings.tsx`

Uses the custom server routes and reads `profiles.totp_enabled` as the displayed 2FA state. It does not use native factor state or AAL.

### `src/lib/loginStepUp.ts`

Findings:

- Passkey is checked first;
- custom TOTP is checked only through `profiles.totp_enabled`;
- a tab-local `sessionStorage` marker can suppress repeated checks;
- factor/status lookup failures degrade to `none` and allow login to proceed.

The last behavior is unacceptable for privileged Owner/Admin assurance because M5A requires fail-closed behavior.

### `src/components/LoginStepUpGate.tsx`

A successful passkey confirmation can complete the current login step-up independently of TOTP. This conflicts with ADR-0003.5's stated Owner requirement that TOTP is mandatory independently of passkey availability.

### `src/platform/Security/authMiddleware.ts`

`checkAdminAccess()` correctly verifies Supabase user identity and IAM role, but there is no application-code enforcement of `aal2` today. Repository-wide search for `aal2` returns documentation references rather than runtime enforcement.

### Tests

`tests/unit/totp.test.ts` validates the local RFC-6238 implementation. It does not prove Supabase enrollment/challenge/verify, AAL transition, stale-session handling or privileged AAL2 enforcement.

## 4. Gap matrix

| Requirement | Current state | Result |
|---|---|---|
| Native TOTP enrollment | custom local TOTP | GAP |
| Supabase `challenge → verify` | absent | GAP |
| AAL2 session produced | 0 production AAL2 sessions | GAP |
| Server rejects Owner/Admin `aal1` | not implemented | CRITICAL GAP |
| Stale `aal2/aal1` rejected | not implemented | GAP |
| MFA status from authoritative factor source | `profiles.totp_enabled` | GAP |
| Privileged auth failure fail-closed | login status check can fail-open | CRITICAL GAP |
| Purpose-bound step-up | implemented | KEEP / HARDEN ABOVE AAL2 |
| Recovery | custom codes exist | MIGRATION REQUIRED |
| Native MFA negative tests | absent | GAP |
| Security Advisor after mutation | required later | PENDING |

## 5. Root cause

The historical IAM hardening added a technically valid local second factor but placed it **beside** Supabase Auth instead of **inside** the Supabase session assurance model.

As a result:

```text
Supabase identity/session = source A
CAPITAL-AI TOTP state     = source B
CAPITAL-AI step-up token  = source C
```

These sources are correlated by user ID but do not create a single provider-authenticated AAL2 assertion. M5A closes this split-brain authority.

## 6. Target architecture

```text
Primary login / session
        |
        v
Supabase Auth session (aal1)
        |
        +-- native TOTP enroll → challenge → verify
        |
        v
Supabase Auth session (aal2)
        |
        v
Server IAM role check + central AAL2 check
        |
        +-- critical action? → purpose-bound single-use CAPITAL-AI step-up
        |
        v
Privileged operation
        |
        v
Audit evidence
```

The purpose-bound token remains an additional action-control, not an MFA replacement.

## 7. Mutation decision

### Repository code: REQUIRED

Required implementation areas:

- Native TOTP enrollment UI/service;
- native challenge/verify login gate;
- centralized server AAL2 verification;
- privileged Owner/Admin enforcement;
- stale/error fail-closed behavior;
- recovery redesign;
- native MFA unit/integration negative tests.

### Supabase Auth factor mutation: REQUIRED, but not yet authorized

Both Owner identities currently have no native MFA factor. To reach M5A `VERIFIED PASS`, they must later enroll and verify native TOTP through supported Supabase Auth APIs.

### Supabase project configuration mutation: CONDITIONAL

Current official Supabase guidance states TOTP MFA APIs are available by default, but the available connector does not expose the exact Dashboard Challenge/Verify setting for this project. Therefore no project-setting mutation is justified by assumption.

Pre-mutation gate must determine the actual configuration. If native challenge/verify works without config change, project config mutation is `NOT REQUIRED`.

### Postgres DDL: NOT REQUIRED for Native MFA

The native Auth schema already exists.

### Legacy cleanup: DEFERRED

Do not remove:

- encrypted legacy TOTP values;
- legacy break-glass rows;
- custom verifier code;

until native factor enrollment, recovery and AAL2 enforcement are verified and a separate cleanup mutation is approved.

## 8. Required implementation tests

Negative:

- Owner/Admin AAL1 denied;
- enrolled/unverified factor denied;
- invalid TOTP denied;
- invalid/expired challenge denied;
- no factor denied where MFA is required;
- stale AAL2/AAL1 denied;
- Auth/AAL lookup failure denied for privileged access;
- purpose-bound token without AAL2 denied;
- wrong-user/wrong-purpose/replayed step-up denied;
- unauthorized factor-reset denied.

Positive:

- native enroll/challenge/verify reaches AAL2;
- AAL2 Owner/Admin with valid policy/role/action step-up can execute allowed privileged operation;
- audit event is emitted without storing TOTP secret/code.

## 9. Current gate

**M5A state:** `IN PROGRESS — BASELINE COMPLETE / REMEDIATION PLAN IN REVIEW`

**Production mutation:** `BLOCKED — HUMAN/OWNER APPROVAL REQUIRED`

Next allowed action after merge of the architecture/baseline PR:

1. implement repository code on a fresh branch;
2. test via CI;
3. then open an explicit Human/Owner production-mutation gate for native Owner factor enrollment.

M6 remains blocked until M5A is `VERIFIED PASS`.
