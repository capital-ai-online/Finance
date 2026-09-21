# AUTH_ROOT_ROUTING_CORRELATION_2026-09-21

**Project:** CAPITAL-AI-OPS  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**CURRENT_MAIN at implementation start:** `bf1e8c654332cbc1a01f20a3e9cb5fc6d330ca7f`  
**OPS branch:** `operations/auth-root-routing-correlation-20260921`  
**Foreign FE writer:** PR #1195 at head `9901590b3544d08df55f3771bdb35c60d5fb7d53`  
**Open GOV writer:** PR #1199 at head `11bf02ce17fe912cd28f6c1b3a2252c5ee2e10ee`

## Before — CURRENT_MAIN

Observed against `main@bf1e8c654332cbc1a01f20a3e9cb5fc6d330ca7f`:

| Contract | Before |
|---|---|
| Google OAuth callback -> `/` | PASS |
| authenticated root remains `/` | FAIL — current root redirects session users to `/dashboard` |
| authenticated `/login -> /` | FAIL — current login branch redirects to `/dashboard` |
| protected `/dashboard` | PASS — unauthenticated path converges to `/login` |
| authenticated unknown route -> `/` | FAIL — current fallback targets `/dashboard` |
| Checkout success/cancel -> `/` | FAIL — current Checkout targets `/dashboard?checkout=...` |
| production SPA fallback | PASS — `/`, `/login`, `/dashboard` and supported application paths are explicitly served; unsupported paths remain 404 |

The old active OPS finding `authenticated_root_dashboard_handoff` therefore encoded a superseded product-routing expectation and could produce a false-positive/false-negative relative to the new canonical target.

## Foreign-owner target evidence

PR #1195 is the active FE writer. At head `9901590b3544d08df55f3771bdb35c60d5fb7d53` repository readback shows:

- root renders `LandingPage` with session/profile/subscription projection and no authenticated dashboard default;
- authenticated `/login` redirects to `/`;
- authenticated unknown routes redirect to `/`;
- `/dashboard` still delegates to the protected dashboard renderer;
- Google OAuth `redirectTo` remains `${window.location.origin}/`;
- Checkout success/cancel URLs return to root with query-state markers.

This is evidence only. OPS does not claim or mutate FE ownership.

## After — OPS branch

The active correlation inventory now uses:

- `authenticated_root_landing_handoff`
- `authenticated_login_root_handoff`
- `dashboard_protected_deep_link`
- `authenticated_unknown_route_root_handoff`
- `checkout_root_return_handoff`
- `canonical_spa_fallback_contract`

The historical 2026-09-02 evidence and work package are unchanged and remain historical provenance only.

## Validation state

Repository/unit validation is required at the exact final PR head. Until that hosted/exact-head evidence exists, readiness is `EVIDENCE_PENDING`, not PASS.

## Remaining blocker/dependency

FE PR #1195 must reach its normal Human/CODEOWNER-gated merge path before CURRENT_MAIN itself can satisfy the new FE-owned root-routing findings. OPS may merge its read-only correlation earlier only if reviewers accept truthful FAIL state against the then-current FE implementation; it must not rewrite FE behavior to manufacture PASS.
