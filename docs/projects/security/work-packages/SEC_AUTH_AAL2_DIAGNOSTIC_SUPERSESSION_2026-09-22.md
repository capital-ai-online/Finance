# SEC-AUTH-DIAG-AAL2-01 — AAL2 Diagnostic Supersession

**Status:** OWNER-DIRECTED / IMPLEMENTATION_IN_PROGRESS  
**Project:** `CAPITAL-AI-SEC`  
**Relationship:** cross-cutting Security; no productive PVC ownership  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@93893ab46cc0753dc4e86cd7d6120d321bc48651`  
**Owner direction:** 2026-09-22

## Purpose

Temporarily remove **all AAL2 enforcement** from the active authentication/authorization lifecycle so the observed post-Google-login stall can be isolated by staged reactivation. This is a diagnostic supersession, not removal of MFA implementation or factor data.

Native MFA factors remain enrolled. Primary Supabase identity verification, IAM role checks, bearer validation, rate limiting, subscription authority and unrelated security controls remain active.

## Observed before state

Provider readback on 2026-09-22:

- `public.profiles`: 5 total profiles;
- `mfa_required_account=true`: 0;
- `mfa_required_account=false`: 5;
- profiles with at least one verified native MFA factor: 3;
- update-to-false mutation was a no-op because all five profiles already held `false`.

Repository/UI correlation:

- `SessionComposition` on CURRENT_MAIN interprets a verified factor / `nextLevel=aal2` as a login step-up trigger even though account policy is false;
- `ProfilePage` still renders `PasskeySettings` and `TotpSettings`;
- the current public landing exposes only the dashboard entry, not a direct profile/security-settings entry;
- the strict provider AAL2 implementation exists in `authMiddleware.ts`.

## Supersession stages

| Stage | Login | Registration MFA | Privileged server AAL2 | Diagnostic intent |
|---|---|---|---|---|
| `0` | OFF | OFF | OFF | isolate all AAL2 enforcement |
| `1` | account-policy controlled | OFF | OFF | test login-only AAL2 account by account |
| `2` | account-policy controlled | ON | OFF | add registration/onboarding AAL2 |
| `3` | account-policy controlled | ON | ON | fully restore provider AAL2 enforcement |

Stage selection remains branch/PR/Human-CODEOWNER controlled. No email/user-ID exception or second runtime override is permitted.

## Stage 0 invariants

1. `profiles.mfa_required_account=false` for all accounts.
2. Existing `auth.mfa_factors` are not deleted or changed.
3. Normal login does not execute native factor/challenge choreography.
4. Registration still requires profile/consent completion but skips AAL2 enrollment and cannot set `mfa_required_account=true`.
5. Privileged server checks still require a valid Supabase bearer identity, but the **AAL2 requirement itself** is superseded.
6. `verifyProviderAal2()` preserves the strict provider AAL2 implementation independently for Stage 3 restoration and negative tests.
7. Every privileged AAL2 supersession is logged with supersession ID, stage and verified user ID.
8. `/api/auth/aal2/diagnostic-login` records authenticated stage/account-policy checkpoints without blocking the login critical path.
9. Subscription/Enterprise resolution remains server-authoritative and unchanged.

## Re-activation diagnostic sequence

After Stage 0 production convergence:

1. capture OAuth-return → account-policy read → subscription readback timing;
2. Stage 1: reactivate login AAL2 only and compare logs/timing;
3. Stage 2: reactivate registration/onboarding AAL2 and compare;
4. Stage 3: reactivate privileged provider AAL2 and compare;
5. the first stage reproducing the delay defines the bounded root-cause surface.

Each stage change requires fresh CURRENT_MAIN correlation, exact-head tests, Security evidence and Human/CODEOWNER merge.

## Frontend handover

`ProfilePage` already contains canonical `PasskeySettings` and `TotpSettings`. CAPITAL-AI-FE should restore a direct, obvious authenticated-landing path to `/dashboard?view=profil` rather than create a second settings architecture.

## Exit evidence

- Stage 0 exact-head tests/checks PASS;
- 5/5 profiles read back with `mfa_required_account=false`;
- 3 profiles' verified factors remain present and unchanged;
- no login, registration or privileged route enforces provider AAL2 in Stage 0;
- primary Supabase identity remains required;
- strict provider AAL2 verifier remains independently implemented/tested;
- supersession events are observable in runtime/IAM audit evidence;
- no email/UUID bypass exists;
- Human/CODEOWNER merge remains required.
