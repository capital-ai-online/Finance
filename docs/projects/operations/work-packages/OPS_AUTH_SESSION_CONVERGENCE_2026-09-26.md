# OPS-AUTH-SESSION-CONVERGENCE — End-to-end Auth/Profile completion

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02` — Controlled Implementation  
**Supporting PVC:** `PVC-08` — Production Operations  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Security boundary:** `CAPITAL-AI-SEC`  
**Frontend boundary:** `CAPITAL-AI-FE`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@82f50a97db513cab02e0a342c19230badb0b3ade`  
**Priority:** `P0 / Owner-directed`  
**Status:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING / HUMAN_MERGE_REQUIRED`

## Owner-visible failure

Google login succeeds and the Enterprise badge is rendered, but opening the authenticated profile can remain on session synchronization or freeze. Returning to the landing route can exhibit the same failure.

## Correlated root cause

The productive Render source and `CURRENT_MAIN` contain the same routing implementation, so this is not a missing deploy-only delta. The backend `/api/auth/session` handler resolves the same cookie twice: first through `resolvePendingBackendAuth()` and then through `resolveVerifiedBackendAuth()`. For an expired access token this can rotate the same single-use Supabase refresh token twice in one HTTP request. The observed Supabase Auth log contains two refresh operations for the same session timestamp, including token revocation.

Two additional client-side gaps amplify the visible failure:

- overlapping browser session reads are not coalesced and an older response can overwrite newer logout/unauthorized state;
- the first profile render depends on an unbounded lazy chunk although the profile is the primary authenticated action.

## Atomic implementation

1. Replace the two-step session route resolution with one `resolveBackendAuthSession()` call and classify MFA versus verified state from that single result.
2. Coalesce refresh-token rotation by a SHA-256 fingerprint for Supabase's bounded 10-second reuse window and a maximum of 256 entries. Raw refresh tokens are never used as map keys or logged.
3. Coalesce browser session readback and bind results to a session epoch so a stale response cannot resurrect state after logout or an unauthorized event.
4. Keep transient network/server readback failures from deleting an already verified UI projection; explicit unauthenticated, invalid, `401`, and `403` results remain fail-closed.
5. Load `ProfilePage` in the initial application graph so the authenticated account action cannot wait indefinitely on a route chunk.

## Security invariants

- Supabase remains the identity and refresh-token authority.
- Session tokens remain only in `HttpOnly`, `Secure`, `SameSite=Lax` backend cookies.
- The browser receives only the verified identity/profile/subscription projection.
- `mfaPending` sessions never become verified profile sessions.
- State-changing routes retain same-origin and server authorization controls.
- No provider settings, secrets, IAM, billing, schema, migration, or Production deployment are mutated by this repository change.

## Exit evidence

- one backend resolver invocation per `/api/auth/session` request;
- one provider refresh operation shared by concurrent requests using the same refresh token;
- one browser session read in flight at a time, with stale-result suppression after logout;
- eager authenticated profile entry and SPA return navigation;
- focused regression tests, TypeScript/build and required CI checks succeed on the exact PR head;
- Human/CODEOWNER merge remains required.
