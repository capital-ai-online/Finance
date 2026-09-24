# ADR-0031 — Supabase Free-Tier Auth Security Compensating Controls

- **Status:** Accepted
- **Date:** 2026-08-02
- **Scope:** CAPITAL-AI Production Authentication / Supabase Auth
- **Platform Version:** `0.6.4`
- **Amended:** 2026-09-24 — application-level breached-password screening verified in Production
- **Governance ID:** `SEC-AUTH-SUPABASE-001`
- **Related:** ADR-0003.5, ADR-0008, ADR-0030
- **Security Advisor Target:** `SUPABASE_SECURITY_ZERO_ACTIONABLE_WARNINGS`

## 1. Context

The production Supabase Security Advisor currently reports one remaining warning after remediation of the Stripe schema function `search_path` findings:

`auth_leaked_password_protection`

Supabase documents leaked-password protection as a Pro Plan and above feature. The active CAPITAL-AI Supabase project is intentionally operated on the Free Tier at the time of this decision. Therefore the warning cannot be remediated within the current plan by enabling the native HaveIBeenPwned-based leaked-password protection feature.

The advisor additionally reports `rls_enabled_no_policy` for `public.screening_slo_evidence` at INFO level. That state is intentional: the table is server-write-only and deliberately has no `anon` or `authenticated` policies. It is not considered a security defect and must not be "fixed" by adding a client policy solely to silence the advisor.

## 2. Decision

CAPITAL-AI formally adopts the following security state for the Supabase Free Tier:

1. Native leaked-password protection remains unavailable while the project is on the Free Tier.
2. The advisor warning remains **PLAN-CONSTRAINED / ACCEPTED RISK** for the native provider control only; it is not relabeled as a Supabase remediation.
3. CAPITAL-AI's application password boundaries use the production backend adapter in `server/security/passwordSecurity.ts` to screen new or changed passwords against HIBP Pwned Passwords before the Supabase Auth mutation.
4. The adapter is an application-level compensating control, not a claim that Supabase's native setting is enabled or that the Advisor warning is cleared.
5. The target production status is `SUPABASE_SECURITY_ZERO_ACTIONABLE_WARNINGS`, not `ZERO_WARN`, because plan-constrained warnings and intentional INFO findings are distinguished from actionable security defects.
6. The native-control risk acceptance is temporary and automatically expires as soon as the project is upgraded to Supabase Pro or above.
7. On any plan upgrade to Pro or above, enabling native leaked-password protection becomes a mandatory Production Release Gate before the next release may be marked accepted.
8. No SQL workaround, copied breach corpus, or client-side imitation may be represented as equivalent to Supabase native leaked-password protection.

## 3. Compensating controls on Free Tier

While the native leaked-password control is unavailable, CAPITAL-AI must maintain defense in depth through controls available independently of that feature.

### 3.1 Required controls

- Email confirmation remains enabled for password-based registration.
- Production auth emails use the configured custom SMTP path rather than relying on the shared development mail service.
- IAM authorization must not depend on user-editable `user_metadata`; privileged roles remain server-verified.
- Owner/admin-sensitive actions remain protected by the existing Step-Up/TOTP architecture and IAM controls.
- Auth endpoints and application boundaries continue to use rate limiting and fail-closed authorization.
- All exposed application tables remain protected by RLS according to their intended access model.
- Service-role/secret keys remain server-side only and must never be shipped to browser bundles.
- Password reset and signup redirect URLs must remain explicit production allowlist entries; wildcard production redirects are prohibited.
- Every application-owned password registration or password-change boundary must call the server-side breached-password adapter before invoking the corresponding Supabase Auth mutation.

### 3.2 Password policy baseline

The application password boundary enforces:

- minimum length: **14 characters**;
- at least one lowercase character;
- at least one uppercase character;
- at least one digit;
- at least one symbol;
- server-side HIBP Pwned Passwords screening before an application-owned signup or password update proceeds.

Supabase Free-Tier password-policy settings remain defense in depth. The application adapter provides breached-password screening independently and does not make a claim that the native Supabase control is enabled.

### 3.3 Backend breached-password adapter

The production adapter uses the HIBP range API with k-anonymity:

- SHA-1 is computed only inside the backend process;
- only the first five hexadecimal hash characters are transmitted;
- the complete digest and plaintext password never leave the backend and are never logged or persisted;
- `Add-Padding: true` is used to reduce response-size correlation;
- the Pwned Passwords range API requires no API key, so no additional credential is introduced;
- a five-second timeout and upstream errors fail closed with HTTP 503;
- a positive breach match is rejected with HTTP 422;
- `/api/auth/password-security/check` is first-party, `no-store`, length-bounded and rate-limited.

The primary browser login currently uses backend Google OAuth and does not expose a CAPITAL-AI password. The adapter remains mandatory for the backend registration/password-update routes and for any future password UI.

### 3.4 Additional controls requiring explicit implementation/configuration

CAPTCHA/bot protection may be introduced only together with the corresponding frontend token flow and provider configuration. It must not be enabled server-side without the application flow supplying valid CAPTCHA tokens.

Any change to session lifetime, inactivity timeout, or single-session enforcement must be separately evaluated against the active Supabase plan and the CAPITAL-AI device/session product requirements before activation.

## 4. Release lifecycle integration

ADR-0030 remains the governing version/release lifecycle. This ADR adds the following security gate to it.

### Current Free Tier

A release may pass the Supabase security gate when all of the following are true:

- Security Advisor contains no unresolved actionable database/auth warnings available to the current plan.
- `auth_leaked_password_protection` is the only remaining WARN and is documented as plan-constrained for the native provider control.
- the backend breached-password adapter, its rate limit and fail-closed behavior remain covered by build/deployment invariants while application password routes exist.
- Intentional `rls_enabled_no_policy` findings are traceable to a server-only/fail-closed access decision.
- No new WARN is silently accepted without a dedicated security review.

Resulting lifecycle status:

`SUPABASE_SECURITY_ZERO_ACTIONABLE_WARNINGS`

### After upgrade to Pro or above

The first release after a plan upgrade is blocked until:

1. leaked-password protection is enabled in Supabase Auth;
2. the Security Advisor no longer reports `auth_leaked_password_protection`;
3. production password signup/change/reset flows are smoke-tested;
4. the security exception record is closed as `REMEDIATED`;
5. the release acceptance record references the remediation evidence.

Required gate status after upgrade:

`SUPABASE_LEAKED_PASSWORD_PROTECTION_ENABLED`

## 5. Review triggers

This decision must be re-evaluated when any of these events occur:

- Supabase plan changes from Free to Pro/Team/Enterprise;
- Supabase makes leaked-password protection available on Free Tier;
- Supabase changes the Security Advisor semantics for this finding;
- CAPITAL-AI introduces a materially different authentication provider or password architecture;
- a security incident indicates credential-stuffing or compromised-password abuse;
- a compliance requirement mandates breached-password screening.

## 6. Evidence and verification

The current decision is grounded in:

- production Supabase Security Advisor output;
- Supabase documentation stating leaked-password protection is available on Pro Plan and above;
- production confirmation that the project is operated under the Free Tier;
- prior remediation of all actionable `function_search_path_mutable` warnings affecting the `stripe` schema;
- identical adapter blobs in current `main` and the live production commit `fb62cf1f9313d6f3d34db60cc0561d60cd0a7c74`;
- unit coverage in `tests/unit/serverPasswordSecurity.test.ts` and the deployment invariant in `scripts/security/verifyPasswordSecurityBoundary.ts`.

The Security Advisor must be rerun after every relevant auth/database hardening change and before production acceptance when the release touches authentication, RLS, database functions, or privileged data paths.

## 7. Consequences

### Positive

- The repository no longer treats an unremediable tariff limitation as an unexplained security defect.
- Free-Tier production state has a precise, auditable acceptance condition.
- A future Pro upgrade has an explicit mandatory remediation gate.
- The design avoids weakening `screening_slo_evidence` RLS merely to remove an informational advisor notice.

### Negative / residual risk

- Supabase Auth cannot natively reject breached passwords while the project remains on Free Tier, so the Advisor warning remains visible.
- The application adapter protects CAPITAL-AI-owned password creation/change paths, but it cannot change provider-side flows that bypass the application boundary.
- HIBP availability is an external dependency; the application fails closed rather than accepting an unchecked new password.

## 8. Final decision

For the active Supabase Free Tier, the remaining Advisor warning is accepted only for the unavailable native provider control. Application-owned password creation and change paths are actively protected by the verified backend HIBP adapter, with a mandatory native-control remediation gate after plan upgrade.

**Accepted security target:** `SUPABASE_SECURITY_ZERO_ACTIONABLE_WARNINGS`
