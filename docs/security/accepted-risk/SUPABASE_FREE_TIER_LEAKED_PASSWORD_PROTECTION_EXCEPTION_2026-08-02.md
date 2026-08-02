# CAPITAL-AI — Supabase Free-Tier Leaked Password Protection Exception

- **Record ID:** `SEC-EXC-SUPABASE-AUTH-2026-08-02`
- **Record Version:** `1.0.0`
- **Date:** `2026-08-02`
- **Environment:** Production
- **Platform Version:** `0.6.0`
- **Status:** **ACCEPTED — PLAN CONSTRAINT**
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
| Requires application-breaking workaround | No workaround authorized |
| Risk accepted permanently | No |
| Risk accepted while Free Tier remains active | Yes |
| Mandatory remediation after Pro upgrade | Yes |

Classification:

`PLAN-CONSTRAINED / TEMPORARILY ACCEPTED`

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
- password policy hardening where configurable on Free Tier.

These controls reduce exposure but are **not represented as equivalent** to native leaked-password screening.

## 5. Prohibited responses to this finding

The following must not be done merely to silence the warning:

- weakening authentication requirements;
- disabling the Security Advisor;
- claiming a client-side password-strength meter performs leaked-password screening;
- storing a copied breach-password corpus in the production database without a separately reviewed architecture;
- routing plaintext passwords through custom application logging or observability;
- adding unrelated RLS policies to remove informational advisor findings.

## 6. Mandatory remediation trigger

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

## 7. Acceptance statement

The current Free-Tier production state is accepted because all security findings that are actionable through the available database/security controls have been remediated, while the remaining WARN requires a higher Supabase plan according to Supabase documentation.

This acceptance does **not** downgrade the warning to PASS. It records why remediation is currently unavailable and defines the exact trigger that ends the exception.

**Current security lifecycle status:**

`SUPABASE_SECURITY_ZERO_ACTIONABLE_WARNINGS`
