# FE-AUTH-EMAIL-CAPTCHA-01 — LoginPage LEGACY_CHALLENGE_PROVIDER Reconnection

**Project:** CAPITAL-AI-FE  
**PVC:** cross-cutting; no productive PVC  
**Owner:** CAPITAL-AI-FE  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@1b022308c1fbabbca23b6cf6b829edbea0dddbd5`  
**Priority:** P0

## Problem

The email-auth controls are now visible, but the backend-first rebuild omitted the existing LEGACY_CHALLENGE_PROVIDER token bridge. Supabase Auth has CAPTCHA protection enabled and therefore rejects signup and mail resend before it can emit a confirmation mail.

## Existing authority reused

`src/lib/LEGACY_CHALLENGE_PROVIDER.ts` already provides bounded, invisible LEGACY_CHALLENGE_PROVIDER acquisition using public `VITE_LEGACY_CHALLENGE_PROVIDER_SITE_KEY`. This slice reuses that implementation; it does not introduce a second CAPTCHA stack.

## Scope

Immediately before each protected action, obtain one fresh token and attach it as `captchaToken` to the same-origin backend request for login, registration, password recovery and confirmation resend. Preload SDK on the login surface only as latency optimization.

## Security invariants

No direct Supabase Auth calls, no token persistence, no CAPTCHA secret in browser, no CAPTCHA bypass. Failure to obtain a token blocks the auth request and surfaces a user-visible error.

## Dependency

The owner-correct CAPITAL-AI-OPS companion slice validates and forwards the token to Supabase Auth.

## Exit evidence

Static/focused tests verify fresh token acquisition and payload binding for every protected form action; Human/CODEOWNER merge remains required.


## Reconciliation 2026-09-22

- PR #1282 backend CAPTCHA contract is merged and present in CURRENT_MAIN.
- PR #1280 frontend vocabulary/source-lock changes are inherited from CURRENT_MAIN and preserved.
- PR #1281 registration legal-link behavior is folded into this slice: AGB and Datenschutz open with `target="_blank"` and `rel="noopener noreferrer"`.
- The consolidated Exact Head is the only remaining LoginPage writer after #1281 supersession.

