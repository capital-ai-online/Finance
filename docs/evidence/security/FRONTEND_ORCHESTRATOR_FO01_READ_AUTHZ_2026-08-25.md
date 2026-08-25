# Frontend Orchestrator FO-01 — Admin Read Authorization Evidence

**Status:** IMPLEMENTED ON BRANCH / PRE-PR VALIDATION

## Traceability

- Work package: `FO-01 — Admin Read Boundary schließen`
- Source: user-prioritized Frontend-Orchestrator follow-up work package
- Security authority: `ADR-0067 — S1 Security Hardening Interlock`
- Frontend authority: `docs/frontend/FRONTEND_ARCH.md`
- Branch: `fix/frontend-orchestrator-read-authz-2026-08-25`
- Branch baseline: `main@6283b3618274d36a026a6ce791d3d291945a7f7f`

## Problem

The administrative Request-Orchestrator UI consumed two operational read endpoints:

- `GET /api/orchestrator/stats`
- `GET /api/orchestrator/ping-models`

The UI itself was rendered only inside the existing admin portal, but both HTTP endpoints were callable without the shared server-side admin authorization middleware. The browser also used unauthenticated `fetch()` calls for those reads, unlike the already protected mutation endpoints.

Client-side visibility is not an authorization boundary. OWASP API Security classifies administrative functions that are callable without the required privileges as Broken Function Level Authorization (API5:2023). The repository's ADR-0067 likewise requires authorization to be enforced at the application route/service boundary and to fail closed.

## Implemented control

### Server boundary

`server/orchestrator.ts` now applies the existing `requireOrchestratorAdmin` middleware to both operational GET routes. The middleware continues to delegate to the canonical shared IAM function:

`checkAdminAccess(req, 'orchestrator-config', SUPERVISOR_ZONE_ROLES)`

No second IAM role registry, owner list, token verifier or bespoke authorization path was introduced.

### Frontend consumer

`src/components/OrchestratorPanel.tsx` now uses the existing shared `authFetch()` adapter for both protected reads. This preserves the central Supabase-session bearer-token behavior and the existing global unauthorized-session handling.

### Regression guard

`tests/unit/orchestratorAdminReadBoundary.test.ts` statically enforces:

1. `/stats` is protected by `requireOrchestratorAdmin`;
2. `/ping-models` is protected by `requireOrchestratorAdmin`;
3. both frontend reads use `authFetch()`;
4. plain unauthenticated `fetch()` is not reintroduced for those paths;
5. the router remains mounted through the canonical application route composition.

## Security properties

- deny-by-default remains server-side;
- frontend gating is not treated as security enforcement;
- existing Supabase/IAM authorities are reused;
- no secrets, credentials or new external write paths are introduced;
- no Render, Supabase, Stripe or production mutation is required;
- no new package or open-source dependency is introduced.

## Best-practice / state-of-the-art check

Primary external reference reviewed on 2026-08-25:

- OWASP Web Security Testing Guide — API Broken Function Level Authorization (`WSTG-APIT-04`);
- OWASP API Security Top 10 2023 — authorization remains a primary API security concern.

The smallest compatible remediation is to enforce the existing repository IAM middleware on every administrative function rather than adding a new authorization library.

## Scope intentionally excluded

FO-01 does **not** change:

- proxy/client-IP trust semantics (`FO-02`);
- numeric configuration validation (`FO-03`);
- telemetry wording/coverage (`FO-04`);
- polling lifecycle or request cancellation (`FO-05`);
- physical migration of the legacy component to `src/features/governance` (`FO-07` / BB-8).

These remain separate work packages to avoid mixing trust-boundary changes.

## Validation status before PR

Repository-side static review confirms the intended four-file scope and exact authorization wiring. Hosted GitHub CI/build/test has intentionally not been triggered before PR creation under the repository cost-control policy.

Before PR creation, the branch must be synchronized again with the then-current `main`, correlated for security/IAM/frontend changes, and the targeted static/contract checks must be re-evaluated.
