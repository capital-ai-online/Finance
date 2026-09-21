# AUTH_ROOT_ROUTING_CORRELATION_2026-09-21

**Project:** CAPITAL-AI-OPS  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**CURRENT_MAIN:** `bf1e8c654332cbc1a01f20a3e9cb5fc6d330ca7f`  
**OPS branch:** `operations/auth-root-routing-correlation-20260921`  
**Foreign FE writer:** PR #1195 @ `9901590b3544d08df55f3771bdb35c60d5fb7d53`  
**Open GOV writer:** PR #1199 @ `11bf02ce17fe912cd28f6c1b3a2252c5ee2e10ee`  
**Landing program dependency:** `LF-01_STATIC_VISUAL_LANDING_PASS`

## Before — CURRENT_MAIN

Observed against `main@bf1e8c654332cbc1a01f20a3e9cb5fc6d330ca7f`:

| Contract | Before |
|---|---|
| Google OAuth callback -> `/` | PASS |
| authenticated root remains `/` | FAIL — current root redirects session users to `/dashboard` |
| authenticated `/login -> /` | FAIL — current login branch redirects to `/dashboard` |
| protected `/dashboard` | PASS — unauthenticated path converges to `/login` |
| authenticated unknown route -> `/` | FAIL — current fallback targets `/dashboard` |
| production SPA fallback | PASS — canonical app paths are explicitly served and unsupported paths remain 404 |
| Checkout/pricing return | DEFERRED_TO_LF_03 — not an LF-00 readiness gate |

The historical active finding `authenticated_root_dashboard_handoff` therefore encoded a superseded routing expectation.

## Landing-First phase evidence

| Phase | Evidence state | Reason |
|---|---|---|
| LF-00 ROUTING_CONTRACT | FAIL_ON_CURRENT_MAIN / OPS_CORRELATION_IMPLEMENTED | FE-owned root/login/unknown-route behavior has not converged on main yet. |
| LF-01 STATIC_VISUAL_LANDING | BLOCKED / NOT_PASS | Current root composition reaches productive Enterprise Scorer runtime. |
| LF-02 AUTH_PROFILE | WAITING_ON_LF_01 | Shared predecessor gate is not PASS. |
| LF-03 PRICING_ENTITLEMENTS | WAITING_ON_LF_01 | Shared predecessor gate is not PASS. |
| LF-04 ENTERPRISE_SCORER | WAITING_ON_LF_01 | Shared predecessor gate is not PASS. |
| LF-05 NEWS_DATA | WAITING_ON_LF_01 | Shared predecessor gate is not PASS. |
| LF-06 ADDITIONAL_MODULES | WAITING_ON_LF_01 | Shared predecessor gate is not PASS. |

### Why LF-01 is not PASS on CURRENT_MAIN

Repository readback shows:

1. `src/app/routing/AppRoutes.tsx` mounts `PublicAnalysisPreview` into the root landing composition.
2. `PublicCryptoScoringPreview.tsx` progresses to `CanonicalCryptoScoringEnterprise`.
3. `CryptoScoringEnterprise.tsx` performs productive score requests including `POST /api/crypto/score` and verified-score retrieval.
4. Therefore the root is not a static/presentational LF-01 baseline even though the initial scorer shell is progressively rendered.

This is a dependency/readiness finding only. OPS does not own or modify the scorer implementation.

## Foreign-owner PR #1195 correlation

PR #1195 remains the active FE writer, but it is not accepted as LF-01 evidence:

- exact FE head observed: `9901590b3544d08df55f3771bdb35c60d5fb7d53`;
- the change set wires session/profile/subscription projection into root;
- it adds LandingPricingPanel/entitlement runtime and session-dependent scorer composition;
- the exact-head CI run `35600366726` is FAIL; job `106334769053` fails TypeScript with:
  `src/app/universe/ui/UniversePortal.tsx(300,12): TS2741 — Property 'userSession' is missing in type '{}' but required in type '{ userSession: UserSession | null; }'.`
- Security/Governance checks may pass independently; that does not make LF-01 or the build PASS.

**Owner-correct handover:** `OPS-LF-FE-20260921-01` requires FE to re-scope or supersede the current landing writer so LF-01 is static-only and exact-head build evidence is successful.

## After — OPS PR #1200 branch

The active OPS inventory uses:

- `authenticated_root_landing_handoff`
- `authenticated_login_root_handoff`
- `dashboard_protected_deep_link`
- `authenticated_unknown_route_root_handoff`
- `canonical_spa_fallback_contract`
- `landing_first_lf01_static_visual_gate`

`checkout_root_return_handoff` is intentionally removed from the LF-00 inventory and deferred to LF-03. Historical 2026-09-02 evidence remains unchanged.

## Static performance baseline

State: **NOT_AVAILABLE** — LF-01 is not PASS, so no static baseline is claimed.

Required future metrics:

- initial_request_count
- initial_api_request_count
- html_bytes
- javascript_bytes
- css_bytes
- image_bytes
- total_transferred_bytes
- TTFB
- LCP
- CLS
- INP
- bootstrap_duration
- runtime_exception_count
- failed_request_count
- lazy_chunk_count
- deployment_identity

Later phases must record bounded BEFORE/AFTER deltas. Missing runtime evidence is not PASS.

## Remaining gates

1. PR #1200 exact-head checks must run for the new head.
2. Human/CODEOWNER merge remains required for PR #1200.
3. FE owns LF-00 implementation convergence and LF-01 re-scope.
4. QM must independently verify LF-01 before productive landing integrations can start.
5. SEC/COMP may independently block later integration even after visual completion.
