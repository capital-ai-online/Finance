# OPS-LF02-AUTH-PROFILE-CORRELATION — Auth/Profile Provider Readiness

**Canonical identity:** `OPS-LF02-AUTH-PROFILE-CORRELATION`  
**Project:** `CAPITAL-AI-OPS`  
**Resolved owner:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**CURRENT_MAIN at activation:** `a328f9cfdb1dba2845aa0e5c2c78e5a286a0e64d`  
**Production correlation:** Render `Finance` live on the same SHA  
**State:** `ACTIVE / PROVIDER_AUDIT_COMPLETE / OWNER_HANDOFFS_OPEN / LF02_NOT_PASS`

## Project and PVC relationship

OPS owns runtime/provider correlation, deployment-readiness evidence and the repository correlation gate. It does **not** absorb Frontend presentation/Auth UI ownership, Security verification, IAM authority, subscription/billing authority or QM assurance.

Owner-correct implementation handoffs created from this package:

- **CAPITAL-AI-FE:** GitHub issue #1237 — bind the existing Supabase Auth/registration lifecycle to the canonical `/login` surface and add the LF-02 root profile/tier projection without modifying the pinned FRONTEND source blobs.
- **CAPITAL-AI-SEC:** GitHub issue #1238 — remove Data-API execute exposure from trigger-only `SECURITY DEFINER` functions and enable/evidence leaked-password protection.
- **CAPITAL-AI-QM:** independent exact-head/runtime assurance remains required before the final `LF-02_AUTH_PROFILE_PASS`.

The 2026-09-21 `OPS_AUTH_ROOT_ROUTING_CORRELATION` package/evidence is retained as historical evidence only. Its then-current LF-00/LF-01 blocker states do not override this fresh current-main correlation.

## Goal

Advance the Landing-First chain from the already-established static/presentation baseline to a bounded LF-02 Auth/Profile integration without creating a second authentication, profile, subscription or entitlement authority.

The canonical behavior is:

1. `/` remains the canonical landing page for anonymous and authenticated users.
2. `/login` remains the single productive website authentication/registration surface.
3. email/password, Google OAuth and registration converge on the existing Supabase Auth authority.
4. successful OAuth returns to `/`.
5. new accounts pass existing profile/consent completion and verified MFA onboarding.
6. the landing consumes the already-composed user/session projection; it does not perform duplicate Supabase profile/subscription reads.
7. subscription tier remains server-authoritative through the existing authenticated `/api/stripe/user-subscription` readback.
8. later LF-03 pricing/entitlement, LF-04 scorer and LF-05 news runtime remain independently gated.

## Fresh CURRENT_MAIN findings

### Repository auth chain

Current main already contains:

- `LoginPage.tsx`: `signInWithPassword`, `signUp`, fresh hCaptcha, password recovery and `signInWithOAuth({ provider: 'google' })`;
- Google OAuth `redirectTo: \`${window.location.origin}/\``;
- `SessionComposition`: Supabase session composition, anonymous-session rejection, onboarding routing, AAL/MFA step-up, local/global logout separation and least-privileged Free fallback;
- `RegistrationCompletionGate`: profile/country/consent completion plus TOTP or WebAuthn MFA;
- server endpoints `/api/auth/register/complete` and `/api/auth/mfa/enrollment-complete`;
- authenticated server subscription readback `/api/stripe/user-subscription`;
- canonical login entry points from FAQ, public analysis, dashboard guest navigation and the compatibility redirect bridge.

The missing FE-owned LF-02 slice is the root landing projection itself: current `AppRoutes` renders `LandingPage` without the composed authenticated profile/tier state.

### Supabase live provider audit

Project: `AIFINANCIAL` / `ryzywoktpmyhwzxmstyu`, `eu-west-1`, `ACTIVE_HEALTHY`.

Observed auth/profile hot-path statement timing from `pg_stat_statements`:

| Query family | Samples | Mean | Max | Interpretation |
|---|---:|---:|---:|---|
| `profiles.onboarding_required` | 588 | ~0.503 ms | ~4.966 ms | no DB bottleneck observed |
| profile IAM role reads | >1,200 | ~0.1–0.2 ms | <4 ms | no DB bottleneck observed |
| subscription tier by `user_id` | 267 | ~0.193 ms | ~7.066 ms | indexed and bounded |
| `auth.users` identity existence | 914 | ~0.347 ms | bounded |

RLS is enabled on the relevant `profiles`, `subscriptions`, `user_consents` and `security_events` tables. Primary/unique indexes are actively used for profile and subscription identity lookups.

The performance advisor reports no LF-02-specific performance defect requiring schema redesign. Low-use-index advisories are informational at the current traffic level and are not treated as delete instructions.

### Supabase Security blockers

Security Advisor reports direct Data-API execute capability for `anon` and `authenticated` on:

- `public.handle_new_user()`
- `public.rls_auto_enable()`
- `public.sync_stripe_subscription_to_public()`

Live trigger correlation proves these are trigger/event-trigger functions, not intended public RPC APIs. Remediation is routed to Security issue #1238; OPS does not mutate Security ownership or synthesize closure.

Supabase Auth leaked-password protection is also currently disabled and remains an explicit Security/provider gate.

### Render production correlation

Render service `Finance` (`srv-d91o1o9o3t8c73edi55g`) is live on the same `main@a328f9cf...` snapshot in Frankfurt/Starter with one instance.

Observed runtime envelope during the audit:

- CPU roughly `0.0025–0.0034` CPU;
- memory roughly `129–145 MB`;
- request stream predominantly HTTP 200;
- no sampled recent Supabase/Auth performance error;
- historical malformed-path bot probes and SMTP `EAUTH` log events are unrelated to LF-02.

Render-managed Supabase variables remain server/build configuration; this package neither exposes nor rotates secret values.

## Correlation-gate change

`scripts/operations/authLifecycleCorrelation.ts` is advanced so completed LF-01 does not regress to FAIL merely because the additive LF-02 profile projection is later introduced.

LF-01 continues to fail closed on productive LF-03 pricing/entitlement, LF-04 scoring and LF-05 news dependencies.

A new repository-only finding `landing_first_lf02_auth_profile_repository_gate`:

- is `NOT_AVAILABLE` before the FE landing profile projection exists;
- becomes `FAIL` if a projection appears while canonical login/OAuth/registration/onboarding/subscription-readback invariants are broken;
- may become repository `PASS` when those invariants are present;
- explicitly does **not** equate repository PASS with final provider/Security/QM `LF-02_AUTH_PROFILE_PASS`.

## Dependencies and blockers

| Dependency | Owner | Current state |
|---|---|---|
| root landing profile/tier adapter + login entry-point regression | CAPITAL-AI-FE | OPEN — issue #1237 |
| Data-API SECURITY DEFINER execute hardening | CAPITAL-AI-SEC | OPEN — issue #1238 |
| leaked-password protection provider setting | CAPITAL-AI-SEC | OPEN — issue #1238 |
| productive Google OAuth execution evidence | FE + OPS + QM | EVIDENCE_PENDING |
| independent LF-02 assurance | CAPITAL-AI-QM | EVIDENCE_PENDING |
| LF-03/LF-04/LF-05 | their canonical owners | remain later-phase gated |

## Exit evidence

- this work package;
- `docs/projects/operations/evidence/AUTH_PROFILE_PROVIDER_CORRELATION_2026-09-22.md`;
- exact-head repository validation for the OPS branch;
- owner-return evidence from #1237 and #1238;
- final independent QM/provider evidence before any `LF-02_AUTH_PROFILE_PASS` claim.

## Acceptance criteria

- current main and production identity are explicitly correlated;
- Supabase performance is measured from live provider state rather than inferred;
- no duplicate Auth/Profile/Subscription authority is created;
- completed LF-01 remains stable when LF-02 is added;
- LF-03/LF-04/LF-05 remain independently gated;
- FE and SEC work is owner-correctly handed over, not implemented by OPS;
- Security Advisor findings are never represented as PASS before their owner-return;
- Google OAuth repository wiring is distinguished from real provider/E2E evidence;
- no secret values are written to repository evidence;
- Human/CODEOWNER merge remains required.
