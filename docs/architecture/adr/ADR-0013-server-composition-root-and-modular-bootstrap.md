# ADR-0013 — Server Composition Root & Modular Bootstrap

Status: Proposed
Date: 2026-08-08
Scope: CAPITAL-AI production server architecture

## Context

`server.ts` currently combines process bootstrap, environment initialization, Express application construction, security middleware, provider initialization, observability, health/metrics endpoints, webhook handling, router composition, market-data orchestration and domain-specific scoring logic. This creates a large change surface, increases merge-conflict probability and makes isolated testing and rollback difficult.

The codebase already contains modular routers and services under `server/` and `src/`, therefore the remaining architectural problem is primarily composition and ownership rather than a need to introduce a new framework.

## Decision

CAPITAL-AI will migrate `server.ts` to a thin Composition Root. The target responsibility of the root file is limited to constructing the application runtime and starting the HTTP process.

Target shape:

```text
server.ts
server/
├── app/
│   ├── compositionRoot.ts
│   ├── createApp.ts
│   └── registerRoutes.ts
├── bootstrap/
│   ├── providers.ts
│   ├── processLifecycle.ts
│   └── startup.ts
├── middleware/
│   ├── cors.ts
│   ├── securityHeaders.ts
│   ├── probeProtection.ts
│   ├── globalRateLimit.ts
│   └── observability.ts
├── routes/
│   ├── health.ts
│   └── metrics.ts
└── billing/
    └── webhook.ts
```

Domain logic must not move into the Composition Root. Market-data, scoring, portfolio, sentiment and other business workflows remain in domain services/routes and are injected or registered through explicit boundaries.

## Migration strategy

The refactor is incremental and production-safe.

1. Establish process-scoped bootstrap modules and runtime context without changing production behavior.
2. Extract process lifecycle and provider initialization from `server.ts`.
3. Extract security/observability middleware while preserving middleware order.
4. Extract health, metrics and webhook endpoints.
5. Introduce `registerRoutes()` for existing modular routers.
6. Move remaining market-data and scoring handlers into dedicated domain route modules.
7. Reduce `server.ts` to the final bootstrap shell.

Every phase must be independently buildable, reviewable and rollbackable. No phase may combine unrelated Stripe, Supabase or Render infrastructure mutations.

## Invariants

- Stripe webhook raw-body parsing remains registered before `express.json()`.
- CORS, CSP, HSTS, probe protection and global rate limiting retain existing security semantics.
- `/healthz` remains network-independent and suitable for Render health checks.
- `/metrics` remains fail-closed when `METRICS_TOKEN` is absent or invalid.
- AI provider absence remains fail-open only for routes with defined deterministic fallbacks.
- IAM authorization remains fail-closed.
- Render runtime port resolution remains centralized through `resolveRuntimePort()`.
- Environment access continues through `getCleanEnv()` where normalization is required.

## Consequences

Positive effects are smaller modules, clearer ownership boundaries, improved testability, lower regression risk, easier code review and reduced coupling between infrastructure and FinTech domain logic.

The principal migration risk is middleware/order regression. For this reason the application will not be rewritten in one commit. Existing behavior remains the reference contract until each extracted module is validated.

## Phase 1 implementation

Phase 1 introduces:

- `server/bootstrap/processLifecycle.ts`
- `server/bootstrap/providers.ts`
- `server/app/compositionRoot.ts`

These modules establish the future runtime boundary but are intentionally not wired into the production bootstrap yet. Wiring is performed in the next phase after compile/type validation of the isolated modules.
