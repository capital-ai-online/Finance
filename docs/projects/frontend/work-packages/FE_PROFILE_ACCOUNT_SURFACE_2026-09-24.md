# FE-PROFILE-ACCOUNT-SURFACE-01 — Authenticated Profile Entry Point

**Project:** `CAPITAL-AI-FE`  
**Owner:** `CAPITAL-AI-FE`  
**PVC relationship:** cross-cutting presentation; no productive PVC ownership  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Base:** `main@31625df9bf114e689ec359fc5e8aecafc5a7026d`  
**Status:** `IN_PROGRESS / OWNER_DIRECTED`

## Human Owner outcome

The authenticated account entry point must no longer open the analytics Dashboard. The visible account action on the landing page becomes **Profil**. The former `/dashboard` account entry is retained only as a compatibility redirect to `/profile` and must not mount analysis components.

The profile surface follows the current landing-page visual language and exposes two account tabs:

1. **Profil** — personal details, avatar selection/upload, and persisted account preferences.
2. **Sicherheit** — password-reset confirmation flow and authentication methods; security capability implementation remains owner-correct under the existing backend auth boundary.

The pricing model is archived. No membership tier, upgrade or billing-management presentation belongs on this profile surface.

## Bounded FE implementation

- add protected `/profile` route;
- make `/dashboard` redirect to `/profile` without mounting Dashboard;
- replace landing header/drawer Dashboard actions with Profile actions;
- remove subscription/pricing/billing presentation from the active profile view;
- preserve existing backend-owned profile persistence and private avatar upload contracts;
- preserve the existing Security tab composition for the owner-correct auth/security follow-up;
- add regression coverage that rejects reintroduction of Dashboard account navigation or pricing presentation.

## Dependencies / handover

- `CAPITAL-AI-OPS` owns the backend auth/security follow-up for confirmation-mail password reset and productive primary-login passkeys.
- Existing TOTP enrollment already runs through the protected backend account route and remains available.
- Open PR #1369 has no changed-file overlap with this FE slice.
- PR #1367 was closed as superseded by this Human Owner product direction.

## Exit evidence

1. Landing authenticated action says **Profil** and routes to `/profile`.
2. Drawer account action says **Profil & Sicherheit** and routes to `/profile`.
3. `/dashboard` never mounts the analysis Dashboard and redirects to `/profile`.
4. `/profile` is protected by backend-session state.
5. Active profile UI contains no pricing, membership tier, upgrade or billing-management action.
6. Avatar upload and persisted profile update remain wired to `/api/auth/profile*`.
7. Focused regression, TypeScript/build and required PR checks pass on the exact head.
8. Human/CODEOWNER merge remains required.
