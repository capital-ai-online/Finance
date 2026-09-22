# SEC-AUTH-DIAG-AAL2-01 — AAL2 Diagnostic Supersession

**Status:** OWNER-DIRECTED / IMPLEMENTATION_IN_PROGRESS  
**Project:** `CAPITAL-AI-SEC`  
**Relationship:** cross-cutting Security; no productive PVC ownership  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@93893ab46cc0753dc4e86cd7d6120d321bc48651`  
**Owner direction:** 2026-09-22

## Purpose

Temporarily remove AAL2 enforcement from the normal login and registration authentication lifecycle so the observed post-Google-login stall can be isolated by staged reactivation. This is a diagnostic supersession, not removal of the MFA implementation.

Native MFA factors remain enrolled. Primary Supabase identity verification, IAM role checks, bearer validation, rate limiting, subscription authority and other unrelated security controls remain in place.

## Observed before state

Provider readback on 2026-09-22:

- `public.profiles`: 5 total profiles;
- `mfa_required_account=true`: 0;
- `mfa_required_account=false`: 5;
- profiles with at least one verified native MFA factor: 3;
- update-to-false mutation was a no-op because all five profiles already held `false`.

Repository/runtime correlation:

- `SessionComposition` on current main still interprets a verified factor / `nextLevel=aal2` as a global login step-up trigger;
- `ProfilePage` still renders `PasskeySettings` and `TotpSettings`;
- the current public landing does not expose a direct profile/security-settings route and sends authenticated users first to the landing/dashboard flow;
- the strict provider AAL2 implementation exists in `authMiddleware.ts`.

## Supersession stages

| Stage | Login | Registration MFA | Privileged server AAL2 | Diagnostic intent |
|---|---|---|---|---|
| `0` | OFF | OFF | ON | isolate user-authentication AAL2 from the login stall |
| `1` | account-policy controlled | OFF | ON | test login-only AAL2 account by account |
| `2` | account-policy controlled | ON | ON | restore normal authentication policy |

The implementation authority for stage selection remains the normal branch/PR/Human-CODEOWNER path. No email/user-ID bypass is permitted.

## Stage 0 invariants

1. `profiles.mfa_required_account` remains `false` for all accounts during the baseline diagnostic.
2. Existing `auth.mfa_factors` are not deleted or modified.
3. Normal login does not call native factor/challenge choreography.
4. Registration still requires profile/consent completion, but does not require AAL2 enrollment and must not set `mfa_required_account=true`.
5. `requireVerifiedAal2()` remains unchanged and continues to enforce provider AAL2 for privileged server actions.
6. Login diagnostic checkpoints are written server-side with the supersession ID and stage without blocking the login critical path.
7. Registration completion records whether the AAL2 requirement was superseded or active and keeps `mfa_required_account=false` while Stage 0/1 is active.
8. Subscription/Enterprise resolution remains server-authoritative and is not changed by this package.

## Re-activation diagnostic sequence

After Stage 0 production convergence:

1. capture Google-login timing from OAuth return through authoritative subscription projection;
2. reactivate Stage 1 only and compare latency/logs;
3. if stable, reactivate Stage 2 and compare registration/onboarding traces;
4. privileged server AAL2 remains continuously enforced and can be correlated independently in existing IAM/security logs;
5. the first authentication stage that reproduces the delay becomes the bounded root-cause surface.

Each stage change requires fresh CURRENT_MAIN correlation, exact-head tests, Security evidence and Human/CODEOWNER merge.

## Frontend handover

The existing `ProfilePage` already contains the canonical `PasskeySettings` and `TotpSettings` components. CAPITAL-AI-FE should restore a direct, obvious path from the authenticated landing sideboard to `/dashboard?view=profil` instead of creating a second settings architecture.

## Exit evidence

- Stage 0 code and tests are exact-head PASS;
- all profiles read back with `mfa_required_account=false`;
- existing verified factors remain present;
- no normal login or registration path requires provider AAL2 at Stage 0;
- privileged server actions continue to require strict provider AAL2 throughout the diagnostic;
- no new email/UUID bypass exists;
- Human/CODEOWNER merge remains required.
