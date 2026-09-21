# OPS_AUTH_ROOT_ROUTING_CORRELATION_2026-09-21

**Project:** CAPITAL-AI-OPS  
**Canonical folder:** `docs/projects/operations/`  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-06, PVC-07, PVC-08, PVC-18  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Source:** fresh Human/Owner direction in the current interaction; `CAPITAL-AI-LANDING-FIRST-INTEGRATION-01..03` are non-authorizing projections  
**Baseline:** `main@bf1e8c654332cbc1a01f20a3e9cb5fc6d330ca7f`

## Goal

Align OPS-owned auth/lifecycle/runtime correlation with the canonical root-routing contract and make the Landing-First dependency order explicit without moving Frontend, Billing/Entitlement, IAM, FINTECH/Scoring, Security, Compliance or Quality authority into OPS.

## Canonical LF-00 routing contract observed by OPS

- `/` is the canonical landing page for anonymous and authenticated users.
- authenticated `/login` converges to `/`.
- `/dashboard` remains a protected deep link; anonymous access converges to `/login`.
- authenticated unknown routes converge to `/`.
- Google/Supabase OAuth uses `${window.location.origin}/`.
- production SPA fallback serves canonical app routes and preserves 404 for unsupported routes.
- Checkout/pricing return behavior is **not** an LF-00 readiness gate; it is deferred to the owner-correct LF-03 pricing/entitlement phase.

## Landing-First phase resolution

| Phase | State at this baseline | OPS interpretation |
|---|---|---|
| LF-00 ROUTING_CONTRACT | ACTIVE / CURRENT_MAIN_NOT_CONVERGED | OPS may correlate routing; FE owns route implementation. |
| LF-01 STATIC_VISUAL_LANDING | BLOCKED / NOT_PASS | Current root still reaches productive scorer runtime; no static performance baseline may be claimed. |
| LF-02 AUTH_PROFILE | WAITING_ON_LF_01 | No new productive landing integration may start. |
| LF-03 PRICING_ENTITLEMENTS | WAITING_ON_LF_01 | Pricing/checkout integration is not part of LF-00. |
| LF-04 ENTERPRISE_SCORER | WAITING_ON_LF_01 | FINTECH remains scoring authority; no productive scorer is admitted into LF-01. |
| LF-05 NEWS_DATA | WAITING_ON_LF_01 | News/data runtime must not become an LF-01 dependency. |
| LF-06 ADDITIONAL_MODULES | WAITING_ON_LF_01 | One bounded module at a time only after predecessor gates. |

## Ownership and active-writer correlation

- PR #1195 — CAPITAL-AI-FE — active writer for root routing/landing composition. It is evidence only for OPS. Its current scope is not accepted as LF-01 because it includes later-phase session/pricing/scorer coupling and its exact-head build is failing.
- PR #1199 — CAPITAL-AI-GOV — active Governance writer; no changed-file overlap with this OPS slice.
- PR #1200 — this OPS writer — owns only correlation/runtime/evidence files listed in its work claim.
- Historical `AUTH_LIFECYCLE_RECORRELATION_2026-09-02` evidence remains immutable provenance; its former dashboard-default expectation is not current routing authority.

## Atomic scope

1. Replace active OPS `authenticated_root_dashboard_handoff` semantics with `authenticated_root_landing_handoff`.
2. Correlate authenticated `/login -> /`, protected `/dashboard`, authenticated unknown-route `-> /`, OAuth root handoff and production SPA fallback.
3. Remove Checkout/pricing from the active LF-00 correlation gate and defer it to LF-03.
4. Add `landing_first_lf01_static_visual_gate` to fail closed when LF-02/LF-03/LF-04/LF-05 runtime coupling is reachable from root.
5. Keep later-phase implementation as foreign-owner work; OPS records an owner-correct handover instead of mutating FE/FINTECH/Billing code.
6. Capture static performance evidence only after LF-01 exists as a real static baseline.

## Static performance evidence contract

`STATIC_VISUAL_BASELINE` is currently **NOT_AVAILABLE** because LF-01 is not PASS. OPS must not synthesize values.

When LF-01 becomes valid, capture at minimum:

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

Every later landing integration records a BEFORE/AFTER delta against the immediately preceding accepted phase.

## Owner-correct FE handover

**Correlation ID:** `OPS-LF-FE-20260921-01`  
**Source:** CAPITAL-AI-OPS  
**Target:** CAPITAL-AI-FE  
**Source phase:** LF-00/LF-01 correlation  
**Completed scope:** routing target and LF-01 fail-closed gate are represented in OPS correlation.  
**Remaining scope:** re-scope or supersede PR #1195 so LF-01 is static/presentational only; remove later-phase productive dependencies from LF-01; restore exact-head build PASS.  
**Dependency:** `LF-01_STATIC_VISUAL_LANDING_PASS`  
**Exit gate:** root renders successfully without productive scoring/news/pricing/subscription/provider dependencies required by landing composition; exact-head FE checks and independent QM evidence are available.  
**Continuation condition:** after LF-01 PASS, OPS may capture the static runtime/performance baseline and later phase deltas.

## Acceptance criteria

- No active OPS contract requires successful authentication to default to `/dashboard`.
- LF-00 routing and LF-01 static-visual readiness are distinct gates.
- No Checkout/pricing/scoring/news integration is treated as an LF-00 prerequisite.
- LF-02..LF-06 remain waiting until LF-01 PASS.
- Missing runtime/performance evidence remains NOT_AVAILABLE, never PASS.
- Current foreign-owner gaps remain FAIL/BLOCKED rather than being converted into OPS implementation authority.
- Historical evidence remains unchanged.
- Exact-head validation is recorded for PR #1200.
- Final merge remains Human/CODEOWNER-gated.

## Exit evidence

`docs/projects/operations/evidence/AUTH_ROOT_ROUTING_CORRELATION_2026-09-21.md` plus exact PR-head CI/status evidence.
