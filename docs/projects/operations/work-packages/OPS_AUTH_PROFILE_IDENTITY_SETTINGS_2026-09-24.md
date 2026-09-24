# OPS-AUTH-PROFILE-IDENTITY-SETTINGS-01 — Account identity and settings convergence

**Project:** `CAPITAL-AI-OPS`  
**Owner:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-02` controlled implementation; supporting `PVC-08` production operations  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Base:** `main@206fc5f5ff200cd2929be067b5e555f9927bfacc`  
**Status:** `IN_PROGRESS / OWNER_DIRECTED`

## Human Owner outcome

The account surface must support username login, productive passkey authentication, enforceable TOTP two-factor login, two branded top-level tabs (**Profil** and **Einstellungen**), password replacement, optional verified phone recovery and richer fintech profile preferences. The current profile route must never remain indefinitely on a landing-page escape screen.

## Architecture boundary

The browser remains tokenless. Password, username resolution, Google OAuth, passkey challenges, TOTP verification, phone OTP and session material stay behind `/api/auth/*`. An AAL1 session that still requires TOTP is stored as short-lived backend-owned `mfaPending` state and is rejected by normal authenticated route resolution until the factor is verified.

Phone OTP is provider- and cost-dependent. `CAPITAL_AI_PHONE_AUTH_ENABLED=false` is the fail-closed default; enabling it requires a configured Supabase SMS provider, abuse controls and explicit Owner cost approval. HIBP remains exclusively `ADR-0031 PLAN-CONSTRAINED` and is not changed by this package.

## Bounded implementation

- normalize and uniquely persist usernames; resolve username to the authoritative Auth subject server-side;
- repair missing OAuth profile projection before session readback, addressing Google callbacks that return without a recognized website account;
- require TOTP at primary login for accounts whose Supabase assurance level advances to AAL2;
- keep passkey registration/authentication on Supabase's backend start/verify boundary;
- add phone verification plus phone password recovery behind the explicit provider gate;
- add bounded crypto, stock, portfolio, experience, horizon and currency profile fields;
- expose branded **Profil** and **Einstellungen** tabs, including password and authentication sub-tabs;
- bound session bootstrap to ten seconds and provide a branded retry state;
- add the versioned profile identity migration generated through the Supabase CLI naming workflow.

## Protected rollout order

1. Human/CODEOWNER merges the PR after exact-head checks.
2. Canonical migration workflow applies `20260924070530_profile_identity_settings.sql` and reads back schema, constraints, FK, private avatar bucket and RLS.
3. Canonical Supabase Auth controller is rerun and Security/Performance Advisors are reviewed.
4. Render deploys code only after migration evidence is green.
5. Registration, Google, username, passkey and TOTP user tests run against Production.
6. Phone recovery remains unavailable until provider/cost approval and `CAPITAL_AI_PHONE_AUTH_ENABLED=true` are both confirmed.

## Exit evidence

1. E-mail and username password login both establish the same backend-owned session.
2. Google OAuth callback produces a recognized profile/session or a visible MFA step instead of an unrecognized landing return.
3. Passkey and password login cannot bypass an enrolled TOTP factor.
4. Profile route leaves pending state after a bounded timeout and offers retry.
5. Profile/avatar/fintech fields persist only through the protected backend route.
6. Migration, schema constraints and focused regression tests pass.
7. SMS remains fail-closed until the protected provider boundary is approved.
8. Human/CODEOWNER merge remains required.
