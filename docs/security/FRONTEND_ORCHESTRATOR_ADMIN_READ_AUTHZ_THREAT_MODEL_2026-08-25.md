# Frontend Orchestrator Admin Read Authorization — Threat Model

**Date:** 2026-08-25  
**Scope:** FO-01 — Request-Orchestrator administrative read boundary  
**Branch:** `fix/frontend-orchestrator-read-authz-2026-08-25`  
**Authority:** ADR-0067 / existing CAPITAL-AI IAM

## Security objective

Operational Request-Orchestrator telemetry and model-integration status must be readable only by identities already authorized for the Supervisor/Admin zone. A hidden or inaccessible React view is not a security control; authorization must be enforced by the server for every administrative function.

## Assets

- Request-Orchestrator operational counters and queue state;
- recent request telemetry exposed by `getStats()`;
- model integration/configuration status from `/ping-models`;
- integrity of the existing admin authorization boundary;
- availability of the admin interface for legitimate operators.

## Trust boundaries

```text
Browser / untrusted HTTP client
        |
        | Bearer session token
        v
Express /api/orchestrator
        |
        | checkAdminAccess + SUPERVISOR_ZONE_ROLES
        v
Verified Supabase identity / profiles.iam_role
        |
        v
Operational orchestrator read handlers
```

The browser remains untrusted. `AdminPortal` visibility and client-side owner/admin checks are presentation controls only.

## Threat actors

1. unauthenticated internet client discovering `/api/orchestrator/*`;
2. authenticated standard user attempting vertical privilege escalation;
3. automated scanner or script bypassing the React UI;
4. future frontend refactor accidentally reverting protected reads to unauthenticated `fetch()`.

## Attack paths and controls

| Attack path | Pre-change risk | Control |
|---|---|---|
| Direct `GET /api/orchestrator/stats` without login | telemetry readable without server authorization | `requireOrchestratorAdmin` before handler |
| Direct `GET /api/orchestrator/ping-models` without login | integration/configuration state readable without server authorization | `requireOrchestratorAdmin` before handler |
| Standard user calls admin read with valid but insufficient token | vertical privilege escalation | canonical `checkAdminAccess(..., SUPERVISOR_ZONE_ROLES)` role check |
| Legitimate UI calls newly protected endpoint without bearer token | admin UI regression | existing `authFetch()` attaches verified Supabase session token |
| Future code removes route guard or reintroduces plain `fetch()` | authorization regression | `orchestratorAdminReadBoundary.test.ts` static contract |

## Deny / negative expectations

- missing bearer credentials → no operational payload;
- invalid credentials → no operational payload;
- authenticated role outside `SUPERVISOR_ZONE_ROLES` → no operational payload;
- IAM/Supabase unavailable → existing `checkAdminAccess` fail-closed behavior remains authoritative;
- rate-limited admin authorization attempt → no operational payload;
- direct browser/API access cannot rely on React component visibility to obtain authorization.

## Positive expectation

An identity already authorized by the canonical CAPITAL-AI IAM for `SUPERVISOR_ZONE_ROLES` can continue to read stats/model status through `authFetch()` without a new credential or role model.

## Data / privacy considerations

No new telemetry fields are introduced. The existing Request-Orchestrator masks client IP values before stats are returned. FO-01 only changes who may access the existing payload.

## Residual risks outside FO-01

- `FO-02`: trusted reverse-proxy/client-IP derivation and rate-limit identity;
- `FO-03`: server-side bounds/validation for mutable orchestrator configuration;
- `FO-04`: telemetry wording and coverage truthfulness;
- `FO-05`: polling lifecycle, request cancellation and backoff;
- in-memory orchestrator/rate-limit state remains single-instance and requires a separate scaling trigger before horizontal scaling.

## Rollback

Repository-only rollback is possible through a Human-reviewed revert. No external platform, schema, credential or secret mutation is part of this change. A rollback would intentionally reopen the identified BFLA exposure and therefore requires explicit security review before merge.
