# CAPITAL-AI — Supabase Free-Tier Leaked Password Protection Exception

- **Record ID:** `SEC-EXC-SUPABASE-AUTH-2026-08-02`
- **Record Version:** `1.1.0`
- **Date:** `2026-08-02`
- **Environment:** Production
- **Platform Version:** `0.6.4`
- **Amended:** 2026-09-24
- **Status:** **ACCEPTED — NATIVE PROVIDER CONTROL / APPLICATION CONTROL REMEDIATED**
- **Owner:** CAPITAL-AI Security / Platform Governance
- **Related ADR:** `ADR-0031-supabase-free-tier-auth-security-compensating-controls.md`
- **Advisor Finding:** `auth_leaked_password_protection`
- **Target State:** `SUPABASE_SECURITY_ZERO_ACTIONABLE_WARNINGS`

## 1. Finding

The production Supabase Security Advisor reports:

- Name: `auth_leaked_password_protection`
- Level: `WARN`
- Description: leaked-password protection is disabled.

Supabase documents the native leaked-password protection capability as available on **Pro Plan and above**. CAPITAL-AI currently operates the production Supabase project on the **Free Tier**.

Therefore this finding is not currently actionable within the active tariff.

## 2. Classification

| Attribute | Decision |
|---|---|
| Security warning | Yes |
| Exploit automatically present | No |
| Native remediation available on Free Tier | No |
| Application-level breached-password screening | Active in the production backend |
| Native provider warning accepted permanently | No |
| Native provider warning accepted while Free Tier remains active | Yes |
| Mandatory remediation after Pro upgrade | Yes |

Classification:

`NATIVE PLAN-CONSTRAINED / APPLICATION CONTROL ACTIVE`

## 3. Current production advisor state

Following remediation of the Stripe-schema function search-path warnings, the current Security Advisor state contains:

1. `auth_leaked_password_protection` — `WARN` — plan-constrained.
2. `rls_enabled_no_policy` for `public.screening_slo_evidence` — `INFO` — intentional fail-closed/server-only architecture.

The following previously actionable findings were remediated:

- `stripe.set_updated_at` mutable search path — **FIXED**
- `stripe.set_updated_at_metadata` mutable search path — **FIXED**
- `stripe.check_rate_limit` mutable search path — **FIXED**

The three Stripe functions retain their existing behavior and now use a fixed empty function `search_path`.

## 4. Compensating controls

While the plan constraint remains active, CAPITAL-AI relies on layered controls including:

- verified Supabase identities;
- email confirmation;
- custom production SMTP;
- server-side IAM role verification;
- TOTP Step-Up for privileged owner operations;
- rate limiting;
- fail-closed RLS;
- server-only privileged keys;
- append-only security/audit evidence where defined;
- password policy hardening where configurable on Free Tier;
- first-party, rate-limited backend screening through HIBP Pwned Passwords before application-owned password registration or password change;
- k-anonymity range lookup with only a five-character SHA-1 prefix, response padding, no plaintext/full digest transmission and no password persistence;
- fail-closed handling for upstream errors and timeouts.

The application control materially addresses breached-password acceptance on CAPITAL-AI-owned password mutation paths. It is **not represented as equivalent** to enabling Supabase's native provider control and therefore does not clear the Advisor warning.

## 5. Prohibited responses to this finding

The following must not be done merely to silence the warning:

- weakening authentication requirements;
- disabling the Security Advisor;
- claiming a client-side password-strength meter performs leaked-password screening;
- storing a copied breach-password corpus in the production database without a separately reviewed architecture;
- sending plaintext passwords or complete password hashes to a third party;
- routing plaintext passwords through custom application logging or observability;
- adding unrelated RLS policies to remove informational advisor findings.

## 6. Application-control evidence

The production commit `fb62cf1f9313d6f3d34db60cc0561d60cd0a7c74` and current `main` contain the same verified control:

- `server/security/passwordSecurity.ts` performs the padded HIBP range lookup and fails closed;
- `server/routes/passwordSecurityRoutes.ts` exposes only the first-party rate-limited boundary;
- backend registration and password-update paths call `assertServerPasswordSafe` before the Supabase Auth mutation;
- `tests/unit/serverPasswordSecurity.test.ts` covers prefix-only transmission, positive breach rejection and upstream failure;
- `scripts/security/verifyPasswordSecurityBoundary.ts` makes the adapter a build/deployment invariant.

HIBP Pwned Passwords range queries are free and do not require an API key. No new long-lived backend secret is required.

## 7. Mandatory native-control remediation trigger

This exception expires immediately when any of the following becomes true:

- the Supabase project is upgraded to Pro, Team or Enterprise;
- Supabase makes leaked-password protection available to Free Tier;
- a compliance requirement requires breached-password detection;
- an authentication/credential-stuffing incident requires immediate escalation.

On expiry, the next production release is blocked until:

1. Supabase native leaked-password protection is enabled;
2. Security Advisor is rerun;
3. `auth_leaked_password_protection` is absent;
4. signup and password-change/reset smoke tests pass;
5. this record is superseded or updated to `REMEDIATED`;
6. the release acceptance record references the remediation evidence.

## 8. Acceptance statement

The current Free-Tier production state is accepted because the remaining WARN requires a higher Supabase plan, while CAPITAL-AI-owned password mutation paths are already protected by a verified application-level HIBP adapter.

This acceptance does **not** downgrade the provider warning to PASS and does not claim native Supabase equivalence. It records the narrower provider residual, the active application control and the exact trigger that ends the exception.

**Current security lifecycle status:**

`SUPABASE_SECURITY_ZERO_ACTIONABLE_WARNINGS`
