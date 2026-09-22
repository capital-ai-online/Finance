# FE-AUTH-REGISTRATION-VISUAL-01 — Login/Register UI Restoration

**Project:** CAPITAL-AI-FE  
**PVC:** cross-cutting; no productive PVC  
**Primary Owner:** CAPITAL-AI-FE  
**Backend dependency:** CAPITAL-AI-OPS / PR #1273  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@dbebf7688e36bc0b179cc3e11b5a07612d14e7ab`  
**Design authority:** `SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d/src/components/LoginPage.tsx`

## Goal

Restore visible email/password login, registration, password recovery and confirmation-resend controls on `/login` in the previously selected FRONTEND design without restoring browser-owned Supabase authentication.

## Backend bindings

- `POST /api/auth/login/email`
- `POST /api/auth/register`
- `POST /api/auth/password/forgot`
- `POST /api/auth/confirmation/resend`
- `GET /api/auth/login/google?next=%2F`

All browser requests remain same-origin and cookie-backed. No Supabase access/refresh token is exposed to JavaScript.

## Visual contract

The login card restores the upstream two-tab pattern:

`Anmelden | Registrieren`

Login contains email/password, password visibility, password-forgot action and Google continuation. Registration contains full name, email, password, password confirmation, AGB/Datenschutz acceptance and confirmation-mail feedback.

## Exit evidence

- frontend design source pinned in runtime metadata/tests;
- backend-only auth transport preserved;
- registration and recovery visible on `/login`;
- focused + required checks pass;
- Human/CODEOWNER merge required.
