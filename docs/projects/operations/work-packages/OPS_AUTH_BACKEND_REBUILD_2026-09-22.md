# OPS-AUTH-BACKEND-01 — Backend-first Authentication Rebuild

**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-02 — Controlled Implementation  
**Primary Owner:** CAPITAL-AI-OPS  
**Security boundary:** CAPITAL-AI-SEC  
**Frontend boundary:** CAPITAL-AI-FE  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@8cf32de51821a48f58a7bd86b2d6e0222a0f9cde`  
**Priority:** P0  
**Status:** OWNER-DIRECTED / ACTIVE

## Problem

The productive website still exhibits a visible post-login freeze after repeated client-side Auth/MFA remediation. The existing browser-owned lifecycle combines Supabase OAuth state, `onAuthStateChange`, onboarding, AAL/MFA, subscription hydration and local UI projection inside `SessionComposition`. The Owner has explicitly directed that this login logic be removed rather than patched again.

## Target architecture

```text
Browser
  -> GET /api/auth/login/google
Backend
  -> Supabase Google OAuth (PKCE)
Supabase / Google
  -> GET /api/auth/callback?code=...
Backend
  -> exchangeCodeForSession()
  -> HttpOnly cookie session
  -> redirect /
Browser
  -> GET /api/auth/session
Backend
  -> verify/refresh Supabase session
  -> resolve profile + subscription by verified user UUID
  -> return one session projection
Browser
  -> render authenticated state + explicit Logout
Browser
  -> POST /api/auth/logout
Backend
  -> revoke/clear session cookies
```

The browser does not persist Supabase tokens, does not own OAuth callback state and does not execute MFA/onboarding choreography during normal login.

## Security invariants

- Supabase remains upstream identity provider.
- PKCE verifier is server-managed in an HttpOnly cookie.
- Access/refresh tokens are server-managed in HttpOnly cookies only.
- No auth token in `localStorage`, `sessionStorage`, React session objects, URL fragments or browser JavaScript.
- Backend re-verifies identity with Supabase before projecting an authenticated session.
- Subscription tier remains authoritative by verified user UUID.
- Cookie authentication requires server-side rejection of disallowed browser origins for state-changing requests.
- Existing privileged `requireVerifiedAal2()/requireStepUp()` remains a separate authorization boundary.
- Existing MFA factors are not deleted by this package.

## Superseded productive path

The following browser-owned behavior is removed from the productive login path:

- `supabase.auth.onAuthStateChange`;
- browser `getSession()` bootstrap;
- browser OAuth `signInWithOAuth`;
- `LoginStepUpGate` login sequencing;
- `RegistrationCompletionGate` login sequencing;
- login-time `readAuthGatePolicy`;
- login-time AAL/MFA choreography;
- auth persistence in `localStorage`;
- password login/registration/recovery logic on the public login page.

Historical components may remain only if still used by a separately active settings/security surface; they are not login authority.

## Atomic implementation sequence

1. Add backend auth session/cookie/PKCE service.
2. Add `/api/auth/login/google`, `/api/auth/callback`, `/api/auth/session`, `/api/auth/logout`.
3. Extend server identity resolution to verified backend-session cookies.
4. Reconcile CSRF/origin handling for cookie-authenticated requests.
5. Replace browser `SessionComposition` with a thin backend-session adapter.
6. Replace LoginPage logic with one backend Google entrypoint.
7. Add authenticated Landing logout action.
8. Update lifecycle/security regression tests and remove assertions for superseded client logic.
9. Exact-main correlation, required checks, Human/CODEOWNER merge.

## Exit evidence

- Login callback and session hydration complete without client Supabase lifecycle code.
- Authenticated `/api/auth/session` returns correct Enterprise tier for the verified Enterprise owner account.
- Logout is visible on the landing/header and clears the backend session.
- No direct browser Supabase auth calls remain in the productive LoginPage/SessionComposition path.
- Cookie-authenticated POSTs cannot be processed from a disallowed browser Origin.
- TypeScript, full tests, Security and PR Governance pass on the exact head.
- No merge occurs without Human/CODEOWNER approval.
