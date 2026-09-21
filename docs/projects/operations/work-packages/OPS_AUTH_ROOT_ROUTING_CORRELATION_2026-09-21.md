# OPS_AUTH_ROOT_ROUTING_CORRELATION_2026-09-21

**Project:** CAPITAL-AI-OPS  
**Canonical folder:** `docs/projects/operations/`  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-06, PVC-07, PVC-08, PVC-18  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Source:** fresh Human/Owner direction in the current interaction  
**Baseline:** `main@bf1e8c654332cbc1a01f20a3e9cb5fc6d330ca7f`

## Goal

Align OPS-owned auth/lifecycle/runtime correlation with the canonical frontend routing target without moving Frontend business logic, Billing/Entitlement policy, IAM authority or FINTECH/Scoring authority into OPS.

Canonical observed routing contract:

- `/` remains the landing page for anonymous and authenticated users.
- authenticated `/login` converges to `/`.
- `/dashboard` remains a protected deep link and unauthenticated access converges to `/login`.
- authenticated unknown routes converge to `/`.
- Google/Supabase OAuth uses `${window.location.origin}/`.
- Checkout success/cancel browser returns converge to `/`; OPS validates routing only.
- production SPA fallback serves canonical app routes and preserves 404 for unsupported routes.

## Ownership boundary

OPS changes only correlation, runtime validation and lifecycle evidence. FE remains the implementation owner for `AppRoutes.tsx`, `LoginPage.tsx`, Checkout UX and landing composition. Billing policy, entitlement semantics, IAM and scorer authority remain outside OPS.

## Current writer correlation

- PR #1195 — CAPITAL-AI-FE — active writer for `src/app/routing/AppRoutes.tsx`, Checkout and landing surfaces. This work package consumes that state as foreign-owner evidence and does not mutate those files.
- PR #1199 — CAPITAL-AI-GOV — active Governance writer; no direct changed-file overlap with this OPS slice was observed at package creation.
- Historical `AUTH_LIFECYCLE_RECORRELATION_2026-09-02` evidence/work-package remains immutable historical evidence. Its old dashboard-default finding is not current routing authority.

## Atomic scope

1. Replace active OPS finding `authenticated_root_dashboard_handoff` with `authenticated_root_landing_handoff`.
2. Add explicit read-only correlation for authenticated `/login -> /`, protected `/dashboard`, authenticated unknown-route `-> /`, Checkout root returns and production SPA fallback.
3. Update unit-test inventory and ownership routing.
4. Produce Before/After evidence with exact current-main and PR-head correlation.
5. Re-correlate main, branch head, open writers and semantic overlap before PR readiness.

## Acceptance criteria

- No active OPS contract requires successful authentication to default to `/dashboard`.
- Root, login, protected dashboard, unknown-route, OAuth, Checkout-return and SPA-fallback semantics are represented independently.
- Current foreign-owner implementation gaps remain FAIL rather than being hidden or converted to OPS implementation authority.
- Historical evidence remains unchanged.
- Exact-head validation is recorded for the PR.
- Merge remains Human/CODEOWNER-gated.

## Exit evidence

`docs/projects/operations/evidence/AUTH_ROOT_ROUTING_CORRELATION_2026-09-21.md` plus exact PR-head CI/status evidence.
