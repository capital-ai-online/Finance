# FE-AUTH-EMAIL-CAPTCHA-01 — LoginPage hCaptcha Reconnection

**Project:** CAPITAL-AI-FE  
**PVC:** cross-cutting; no productive PVC  
**Owner:** CAPITAL-AI-FE  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@4d8c6ee4797e763a4c6a006eff17d34a793c3a49`  
**Priority:** P0

## Problem

The email-auth controls are now visible, but the backend-first rebuild omitted the existing hCaptcha token bridge. Supabase Auth has CAPTCHA protection enabled and therefore rejects signup and mail resend before it can emit a confirmation mail.

## Existing authority reused

`src/lib/hcaptcha.ts` already provides bounded, invisible hCaptcha acquisition using public `VITE_HCAPTCHA_SITE_KEY`. This slice reuses that implementation; it does not introduce a second CAPTCHA stack.

## Scope

Immediately before each protected action, obtain one fresh token and attach it as `captchaToken` to the same-origin backend request for login, registration, password recovery and confirmation resend. Preload SDK on the login surface only as latency optimization.

## Security invariants

No direct Supabase Auth calls, no token persistence, no CAPTCHA secret in browser, no CAPTCHA bypass. Failure to obtain a token blocks the auth request and surfaces a user-visible error.

## Dependency

The owner-correct CAPITAL-AI-OPS companion slice validates and forwards the token to Supabase Auth.

## Exit evidence

Static/focused tests verify fresh token acquisition and payload binding for every protected form action; Human/CODEOWNER merge remains required.
