# OPS-AUTLEGACY_CHALLENGE_PROVIDER-REMOVAL-01 — Remove LEGACY_CHALLENGE_PROVIDER from productive auth

**Owner:** CAPITAL-AI-OPS  
**PVC:** PVC-02 / PVC-08  
**Baseline:** `main@d5829ff2fd40228cc938d07638563f56e178dfa6`

## Evidence

The productive login surface froze again after LEGACY_CHALLENGE_PROVIDER was reattached. Independent SMTP delivery through the Render mailer was successful, so SMTP is not the freeze source.

## Scope

Remove the application-side CAPTCHA token contract from email registration/login/recovery/resend and remove the LEGACY_CHALLENGE_PROVIDER build/runtime/CSP projection. Preserve rate limiting, password checks, backend-owned sessions, origin validation, account-enumeration resistance and privileged AAL2 controls.

## Provider prerequisite

The hosted Supabase project still enforces CAPTCHA at Auth level. The available Supabase connector and repository CI expose no Auth-config mutation surface. Before captcha-free registration can succeed, the provider CAPTCHA toggle must be disabled in Supabase Auth > Bot and Abuse Protection.

## Exit gate

Exact-head tests/security/governance PASS; Human/CODEOWNER merge; provider CAPTCHA disabled; then production registration + confirmation-mail smoke test.

