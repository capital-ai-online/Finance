# OPS-AUTH-EMAIL-CAPTCHA-01 — Backend CAPTCHA Contract Restoration

**Project:** CAPITAL-AI-OPS  
**PVC:** PVC-02 / PVC-08  
**Owner:** CAPITAL-AI-OPS  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@4d8c6ee4797e763a4c6a006eff17d34a793c3a49`  
**Priority:** P0  
**Status:** OWNER-DIRECTED / ACTIVE

## Evidence

A real SMTP test through the production Render mailer completed successfully to the requested Proton mailbox target. Registration still fails before mail creation. Production backend logs show Supabase Auth rejecting signup and confirmation-resend with `captcha protection: request disallowed (no captcha_token found)`.

The repository already contains the bounded LEGACY_CHALLENGE_PROVIDER browser bridge and build-time public site-key contract. The backend-first email auth added in PR #1273 did not carry that token into its new server endpoints.

## Scope

- validate a short-lived browser-provided `captchaToken`;
- forward it to Supabase `signUp`;
- forward it to `signInWithPassword`;
- forward it to `resend`;
- forward it to `resetPasswordForEmail`;
- keep enumeration-resistant mail responses and all cookie/session boundaries unchanged.

## Security invariants

CAPTCHA remains enabled. The LEGACY_CHALLENGE_PROVIDER secret remains exclusively in Supabase Auth. Tokens are neither logged nor persisted. Missing tokens fail closed at the application backend. No direct browser Supabase Auth authority is restored.

## Dependency / handover

CAPITAL-AI-FE owns the visual/request materialization on `LoginPage.tsx` and must obtain the fresh LEGACY_CHALLENGE_PROVIDER token through the already-existing `src/lib/LEGACY_CHALLENGE_PROVIDER.ts` helper immediately before each protected request.

## Exit evidence

Exact-head tests prove token validation and forwarding on all protected email-auth endpoints; Human/CODEOWNER merge remains required.

