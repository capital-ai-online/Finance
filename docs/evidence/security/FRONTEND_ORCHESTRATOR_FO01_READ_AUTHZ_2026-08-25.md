# Frontend Orchestrator FO-01 — Admin Read Authorization Evidence

**Status:** IMPLEMENTED / HTTP AUTHORIZATION EVIDENCE ADDED

## Traceability

- Work package: `FO-01 — Admin Read Boundary schließen`
- Security authority: `ADR-0067 — S1 Security Hardening Interlock`
- Frontend authority: `docs/frontend/FRONTEND_ARCH.md`
- Branch: `fix/frontend-orchestrator-read-authz-2026-08-25`
- Current synchronized baseline: `main@877dd1e6351ce813d57bace23daa7b81cd9aa6a7`
- Protected endpoints:
  - `GET /api/orchestrator/stats`
  - `GET /api/orchestrator/ping-models`

## Problem

The administrative Request-Orchestrator UI consumed operational read endpoints that were reachable without the shared server-side IAM guard. UI visibility is not an authorization boundary; a direct HTTP client must not be able to bypass the admin portal and obtain operational telemetry or model-integration state.

This is a Broken Function Level Authorization class of defect: authorization must be enforced at the server route/service boundary and must fail closed independently of the React presentation layer.

## Implemented control

### Server boundary

`server/orchestrator.ts` applies `requireOrchestratorAdmin` before both operational GET handlers. The guard delegates to the existing canonical authority:

`checkAdminAccess(req, 'orchestrator-config', SUPERVISOR_ZONE_ROLES)`

`SUPERVISOR_ZONE_ROLES` remains the single role set for this surface (`owner`, `admin`, `supervisor`). No second token verifier, role list, owner list or alternate authorization path is introduced.

### Frontend consumer

`src/components/OrchestratorPanel.tsx` uses the shared `authFetch()` adapter for both reads, so the existing verified Supabase session bearer is attached. The client supplies identity evidence only; it does not decide authorization.

## Evidence layers

FO-01 now has two independent repository-level evidence layers.

### Layer 1 — structural contract

`tests/unit/orchestratorAdminReadBoundary.test.ts` enforces that:

1. `/stats` is guarded by `requireOrchestratorAdmin`;
2. `/ping-models` is guarded by `requireOrchestratorAdmin`;
3. the guard remains bound to `checkAdminAccess(..., SUPERVISOR_ZONE_ROLES)`;
4. both frontend reads use `authFetch()`;
5. unauthenticated plain `fetch()` is not reintroduced;
6. the router remains mounted through the canonical application composition.

### Layer 2 — real HTTP/router execution

`tests/integration/orchestratorAdminReadAuthz.test.ts` starts the real Express router over `node:http` and calls both protected endpoints through `fetch()`.

The external identity-verification boundary is deliberately mocked. This follows the existing repository security-test pattern: mock the external verification decision, exercise the application's own orchestration and enforcement. The test therefore proves that the router cannot bypass a canonical IAM DENY and that an IAM ALLOW reaches the handler. It does not replace the dedicated tests of `checkAdminAccess()` itself.

The HTTP matrix covers both `/stats` and `/ping-models`:

| Scenario | Canonical IAM decision represented | Expected HTTP result | Operational handler/payload |
|---|---|---:|---|
| No bearer token | `no-valid-credentials` | `401` | denied |
| Invalid bearer token | `no-valid-credentials` | `401` | denied |
| Valid standard-user identity | `insufficient-role` | `401` | denied |
| Rate-limited authorization attempt | `rate-limited` | `429` | denied |
| Authorized supervisor | `iam-role` | `200` | allowed |

Additional assertions prove that:

- the actual Express request is delegated to `checkAdminAccess` with zone `orchestrator-config` and exactly `SUPERVISOR_ZONE_ROLES`;
- `orchestrator.getStats()` is **never executed** for missing, invalid, insufficient-role or rate-limited scenarios;
- a DENY response never contains the marker used by the mocked operational stats payload;
- no `supertest` or other new dependency is introduced; native `node:http` + `fetch` matches repository convention.

## Canonical IAM behavior correlated

The router evidence is chained to the existing `checkAdminAccess()` authority. That authority independently remains fail-closed for:

- missing Supabase configuration;
- unavailable IAM schema;
- missing bearer credentials;
- tokens that do not resolve to a permitted IAM role;
- role outside the supplied allowed-role set;
- rate limiting;
- unexpected internal errors.

A route-level ALLOW therefore cannot be manufactured by React state or by a client-supplied role field: the server consumes the canonical IAM result.

## Security properties

- deny-by-default remains server-side;
- frontend gating is presentation only;
- IAM authority and role registry are not duplicated;
- handler non-execution is verified for DENY cases;
- rate-limit denial is preserved as `429`;
- no secrets, credentials, schema, Render, Supabase or Stripe state are mutated;
- no new package/dependency is introduced.

## Main synchronization / correlation

After PR #536 merged, this branch was synchronized to `main@877dd1e6351ce813d57bace23daa7b81cd9aa6a7`. The imported main delta only releases the terminal Vocabulary work claim under `.ai/work-claims/**`; it does not overlap with the FO-01 server, frontend, test or security-evidence paths.

The currently open PR set was also re-correlated. FO-01 has no file-level overlap with the other open PRs at the time of this evidence update.

## Best-practice check

The control follows the standard API authorization model: enforce function-level authorization at the server boundary, keep the browser untrusted, use a single canonical identity/role authority, test negative paths, and verify that protected handlers are unreachable after a DENY.

No additional authorization library is warranted for this bounded fix because CAPITAL-AI already has a central IAM implementation and role registry.

## Scope intentionally excluded

FO-01 does **not** change:

- proxy/client-IP trust semantics (`FO-02`);
- numeric configuration validation (`FO-03`);
- telemetry wording/coverage (`FO-04`);
- polling lifecycle/cancellation/backoff (`FO-05`);
- physical component migration (`FO-07` / BB-8).

These remain separate trust-boundary or architecture work packages.

## Hosted validation

Exact-head GitHub CI/Governance remains authoritative after each branch mutation. The HTTP evidence is part of the normal Vitest suite and the PR classifier treats the resulting scope as Runtime/Class R, so TypeScript, unit/integration tests, production build, CSP/predeploy checks and Docker/runtime checks are all required before merge.
