# AUTH_PROFILE_PROVIDER_CORRELATION_2026-09-22

**Project:** `CAPITAL-AI-OPS`  
**Canonical identity:** `OPS-LF02-AUTH-PROFILE-CORRELATION`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**CURRENT_MAIN:** `a328f9cfdb1dba2845aa0e5c2c78e5a286a0e64d`  
**Production Render SHA:** `a328f9cfdb1dba2845aa0e5c2c78e5a286a0e64d`  
**Evidence state:** `PROVIDER_AUDIT_COMPLETE / LF02_REPOSITORY_NOT_AVAILABLE / SECURITY_BLOCKERS_OPEN`

## Executive result

The existing authentication and registration chain is materially ready to be reused for LF-02, and live Supabase statement timing does not show an auth/profile performance bottleneck.

`LF-02_AUTH_PROFILE_PASS` is **not** asserted. Two independent requirements remain open:

1. FE issue #1237 must project the existing authenticated session/profile/tier state into the root landing and bind/regression-test all login entry points.
2. SEC issue #1238 must close the Data-API executable-`SECURITY DEFINER` findings and leaked-password-protection provider setting, with trigger-preservation evidence.

Productive Google OAuth execution also remains runtime evidence, not something inferred from repository source alone.

## Current website/Auth readback

| Contract | Current-main readback |
|---|---|
| canonical login route | PASS — `/login` renders `LoginPage` |
| authenticated `/login` | PASS — converges to `/` |
| authenticated root | PASS — remains on `/`, no implicit `/dashboard` redirect |
| email/password login | PASS_REPOSITORY — Supabase `signInWithPassword` |
| normal registration | PASS_REPOSITORY — Supabase `signUp` + fresh hCaptcha + `full_name` metadata |
| Google/Gmail OAuth | PASS_REPOSITORY / RUNTIME_EVIDENCE_PENDING — `signInWithOAuth({ provider: 'google' })` + root callback |
| registration profile/consent | PASS_REPOSITORY — server `/api/auth/register/complete` |
| mandatory new-user MFA | PASS_REPOSITORY — native TOTP/WebAuthn + server `/api/auth/mfa/enrollment-complete` |
| subscription projection | PASS_REPOSITORY — authenticated server `/api/stripe/user-subscription`, least-privileged Free fallback |
| root landing profile/tier projection | NOT_AVAILABLE — FE handoff #1237 |
| final LF-02 provider/security assurance | BLOCKED — #1238 + QM/provider evidence |

Current known login entry points resolve to `/login` through FAQ, public-analysis gated tools, guest dashboard navigation and the compatibility redirect bridge.

## Supabase health and performance

**Project:** `AIFINANCIAL`  
**Project ID:** `ryzywoktpmyhwzxmstyu`  
**Region:** `eu-west-1`  
**Provider state:** `ACTIVE_HEALTHY`  
**Postgres:** `17.6.1.127`  
**`pg_stat_statements`:** enabled

### Relevant table state

| Table | RLS | Approx. observed rows | Size | Key observation |
|---|---|---:|---:|---|
| `profiles` | enabled | ~5 | ~32 kB | PK heavily used |
| `subscriptions` | enabled | ~5 | ~64 kB | `user_id` unique index heavily used |
| `user_consents` | enabled | 0 at audit | ~24 kB | no performance pressure |
| `security_events` | enabled | ~1,735 | ~1.5 MB | outside landing hot path |

### Statement timing

| Statement family | Calls | Mean execution | Max execution |
|---|---:|---:|---:|
| `profiles.onboarding_required` by user id | 588 | ~0.503 ms | ~4.966 ms |
| profile `iam_role` reads | >1,200 | ~0.1–0.2 ms | <4 ms |
| `subscriptions.tier` by user id | 267 | ~0.193 ms | ~7.066 ms |
| `auth.users` identity existence | 914 | ~0.347 ms | bounded |

The performance advisor showed no LF-02-specific query/index remediation that justifies schema churn before integration. Current unused-index notices are treated as informational because traffic and row counts are still small.

## Live trigger and data-lineage verification

The following productive trigger wiring is present and enabled:

- `auth.users.on_auth_user_created -> public.handle_new_user()`
  - creates `public.profiles` with default Free role;
  - creates `public.subscriptions` with default Free tier.
- `stripe.subscriptions.stripe_subscription_sync_trigger -> public.sync_stripe_subscription_to_public()`
  - validates subscription metadata/user identity and upserts canonical public subscription state.
- event trigger `ensure_rls -> public.rls_auto_enable()`
  - enables RLS for newly created public tables under the current trigger contract.

This confirms that email/password registration and Google OAuth users converge on the same `auth.users`-driven profile/subscription lineage once Supabase creates the provider user.

## Security Advisor findings

### Open blocker: Data API execute exposure

The provider currently allows `anon` and `authenticated` to execute these `public` `SECURITY DEFINER` functions:

- `handle_new_user()`
- `rls_auto_enable()`
- `sync_stripe_subscription_to_public()`

They are trigger/event-trigger functions and do not require public RPC execution for their intended invocation path.

**Owner:** CAPITAL-AI-SEC  
**Handoff:** issue #1238  
**Expected remediation:** canonical migration revoking direct `PUBLIC`/`anon`/`authenticated` execute, followed by trigger-functionality and Security Advisor readback.

No production database mutation was performed by this OPS audit.

### Open blocker: leaked-password protection

Supabase Auth leaked-password protection is disabled.

**Owner:** CAPITAL-AI-SEC  
**Handoff:** issue #1238  
**Required evidence:** provider setting enabled + post-change Auth/lifecycle regression evidence.

## Render production performance/readiness

**Workspace:** `AICapital`  
**Service:** `Finance` / `srv-d91o1o9o3t8c73edi55g`  
**Region / plan:** Frankfurt / Starter  
**Instances:** 1  
**Health path:** `/healthz`  
**Latest deploy:** live on exact `main@a328f9cf...`

Observed during the audit:

- CPU: approximately `0.0025–0.0034` CPU;
- memory: approximately `129–145 MB`;
- HTTP samples predominantly 200;
- no sampled recent Supabase/Auth performance error;
- sampled error history contains malformed-path reconnaissance and earlier SMTP `EAUTH` events, neither of which is evidence of an LF-02 database/auth bottleneck.

`render.yaml` preserves the intended secret boundary:
- public browser build inputs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`;
- server-only inputs: `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Secret values are not recorded in this evidence.

## Owner-correct handoffs

### #1237 — CAPITAL-AI-FE

Required:
- retain `/login` as the one website auth surface;
- preserve email/password, registration, Google OAuth, recovery and onboarding chains;
- add LF-02 landing guest/login and authenticated profile/tier adapter from the existing session projection;
- do not change pinned `frontend-port/**` source blobs;
- do not add duplicate root Supabase profile/subscription fetches;
- regression-test every login entry point.

### #1238 — CAPITAL-AI-SEC

Required:
- revoke unnecessary Data-API direct execute on the three trigger-only definer functions;
- preserve auth/Stripe/RLS trigger behavior;
- enable leaked-password protection;
- return provider Security evidence.

## LF-02 decision state

`LF-02_AUTH_PROFILE_PASS = NOT_YET`

Reason:
- Supabase/Render performance is acceptable for the observed current load and no hot-path schema redesign is indicated;
- repository auth/registration/onboarding/subscription foundations are present;
- FE root projection is not implemented on current main;
- Security Advisor blockers remain open;
- productive Google OAuth and final QM assurance still require real provider/runtime evidence.

No later LF-03/LF-04/LF-05 phase is unblocked by this evidence alone.
