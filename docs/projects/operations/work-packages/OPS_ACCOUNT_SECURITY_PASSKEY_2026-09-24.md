# OPS-ACCOUNT-SECURITY-PASSKEY-01 — Profile security backend convergence

**Project:** `CAPITAL-AI-OPS`  
**Owner:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-02` controlled implementation; supporting `PVC-08` production operations  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Base:** `main@31625df9bf114e689ec359fc5e8aecafc5a7026d`  
**Status:** `IN_PROGRESS / OWNER_DIRECTED`

## Human Owner outcome

The protected Profile/Security surface needs productive backend capabilities for:

1. password reset initiated by the signed-in user and completed only after confirmation by e-mail;
2. primary-login passkey enrollment and passwordless passkey sign-in;
3. existing TOTP MFA enrollment through QR code or manual secret for standard authenticator apps;
4. direct production SPA support for `/profile` and the recovery destination `/account/update-password`.

## Architecture boundary

The browser remains tokenless. Supabase access/refresh tokens and session authority remain in the backend HttpOnly cookie path.

Primary-login passkeys are distinct from MFA/AAL2 factors. Passkey WebAuthn ceremonies use Supabase's two-step passkey API so the browser handles only public WebAuthn options/credential responses while the backend performs Supabase challenge issuance/verification and persists the resulting session.

TOTP continues through the existing protected `/api/auth/security/totp/*` routes.

## Bounded implementation

- opt the server-side stateless Supabase Auth client into experimental passkey support;
- add authenticated password-reset-mail trigger bound to the current verified account;
- add authenticated passkey registration start/verify/list/delete routes;
- add unauthenticated passkey login start/verify routes and persist verified sessions in the backend cookie;
- configure the canonical Supabase Auth controller for passkey RP `capital-ai.online` / origin `https://capital-ai.online`;
- add `/profile` and `/account/update-password` to the non-indexable application SPA allow-list;
- add focused tests for tokenless passkey boundaries, password-reset confirmation mail, and route fallback;
- do not activate WebAuthn as a Supabase MFA factor; primary passkeys do not substitute for TOTP/AAL2.

## Dependencies / overlap

- FE PR #1371 owns the user-visible Profile/Security surface and has no changed-file overlap with this OPS backend slice.
- OPS PR #1370 changes only PR self-healing policy/tests and has no changed-file overlap with this slice.
- Supabase provider configuration mutation remains protected and is applied/read back only through the existing canonical Auth configuration controller after Human/CODEOWNER merge.

## Exit evidence

1. Password reset initiated from a verified account sends only to that account's verified e-mail and requires the existing token-hash confirmation flow before password update.
2. Passkey registration/login WebAuthn ceremony exposes no Supabase access or refresh token to the browser.
3. Successful passkey verification persists the normal backend HttpOnly application session.
4. TOTP QR/manual-secret enrollment contract remains unchanged.
5. `/profile` and `/account/update-password` resolve to the SPA entry in production.
6. Provider desired state includes stable RP ID/origin and passkey enablement with post-write readback.
7. Exact-head required/security checks pass.
8. Human/CODEOWNER merge remains required.
