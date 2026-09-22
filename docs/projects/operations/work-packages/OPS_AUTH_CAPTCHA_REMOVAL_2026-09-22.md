# OPS-AUTH-CAPTCHA-REMOVAL-01 — Remove hCaptcha from productive auth

**Owner:** CAPITAL-AI-OPS  
**PVC:** PVC-02 / PVC-08  
**Baseline:** `main@d5829ff2fd40228cc938d07638563f56e178dfa6`

## Evidence

The productive login surface froze again after hCaptcha was reattached. Independent SMTP delivery through the Render mailer was successful, so SMTP is not the freeze source.

## Scope

Remove the application-side CAPTCHA token contract from email registration/login/recovery/resend and remove the hCaptcha build/runtime/CSP projection. Preserve rate limiting, password checks, backend-owned sessions, origin validation, account-enumeration resistance and privileged AAL2 controls.

## Provider prerequisite

The hosted Supabase project still enforces CAPTCHA at Auth level. The available Supabase connector and repository CI expose no Auth-config mutation surface. Before captcha-free registration can succeed, the provider CAPTCHA toggle must be disabled in Supabase Auth > Bot and Abuse Protection.

## Exit gate

Exact-head tests/security/governance PASS; Human/CODEOWNER merge; provider CAPTCHA disabled; then production registration + confirmation-mail smoke test.
