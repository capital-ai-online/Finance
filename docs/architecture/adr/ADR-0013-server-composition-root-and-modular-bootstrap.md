# ADR-0013 — Server Composition Root & Modular Bootstrap

Status: Proposed
Date: 2026-08-08
Scope: CAPITAL-AI production server architecture

## Context

`server.ts` currently combines process bootstrap, environment initialization, Express application construction, security middleware, provider initialization, observability, health/metrics endpoints, webhook handling, router composition, market-data orchestration and domain-specific scoring logic. This creates a large change surface, increases merge-conflict probability and makes isolated testing and rollback difficult.

The codebase already contains modular routers and services under `server/` and `src/`, therefore the remaining architectural problem is primarily composition and ownership rather than a need to introduce a new framework.

This migration runs in parallel with roadmap integrity work. The current baseline already contains:

- R-001 / ADR-0032 provenance enforcement for Crypto/Meme scoring;
- R-002 / ADR-0044 production runtime artifact immutability;
- process-wide quiet dotenv initialization.

These controls are authoritative constraints for this refactor and must not be weakened, duplicated or bypassed.

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
│   ├── runtime.ts
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

## Roadmap coexistence constraints

### R-001 — Provenance truth

The refactor MUST preserve the semantics introduced by ADR-0032 and R-001. In particular:

- bootstrap/catalog values from `AssetRegistry` must not become verified scoring evidence;
- moving market/scoring handlers between files must be behavior-preserving;
- no extraction may reintroduce synchronous liquidity, supply or regime factors without provider evidence;
- existing R-001 regression tests remain mandatory gates.

### R-002 — Runtime artifact immutability

The refactor MUST preserve ADR-0044. In particular:

- `server/runtime/runtimeArtifactGuard.mjs` remains outside the bundled application composition root and is not absorbed into Express middleware;
- Docker `NODE_OPTIONS` preload remains authoritative and executes before `dist/server.cjs`;
- production `docs/**` remains read-only;
- Documentary/version mutation HTTP boundaries remain fail-closed;
- immutable build/release manifest generation remains part of `npm run build`;
- the web runtime remains a read-only repository/release consumer and evidence emitter.

Therefore the server refactor must not modify `Dockerfile`, `package.json`, `server/runtime/runtimeArtifactGuard.mjs`, `scripts/automation/buildRuntimeReleaseManifest.ts` or R-002 validation tests unless a dedicated roadmap change explicitly requires it.

## Invariants

- Stripe webhook raw-body parsing remains registered before `express.json()`.
- CORS, CSP, HSTS, probe protection and global rate limiting retain existing security semantics.
- `/healthz` remains network-independent and suitable for Render health checks.
- `/metrics` remains fail-closed when `METRICS_TOKEN` is absent or invalid.
- AI provider absence remains fail-open only for routes with defined deterministic fallbacks.
- IAM authorization remains fail-closed.
- Render runtime port resolution remains centralized through `resolveRuntimePort()`.
- Environment access continues through `getCleanEnv()` where normalization is required.
- R-001 scoring evidence semantics remain unchanged.
- R-002 preload/control-plane/release-evidence boundaries remain unchanged.

## Consequences

Positive effects are smaller modules, clearer ownership boundaries, improved testability, lower regression risk, easier code review and reduced coupling between infrastructure and FinTech domain logic.

The principal migration risk is middleware/order regression or accidental overwrite of parallel roadmap work. For this reason the application will not be rewritten in one commit, and each migration phase must begin from current `main` or explicitly synchronize with it before touching shared files.

## Phase 1 implementation

Phase 1 introduces:

- `server/bootstrap/processLifecycle.ts`
- `server/bootstrap/providers.ts`
- `server/app/compositionRoot.ts`

These modules establish the future runtime boundary but are intentionally not wired into the production bootstrap yet.

## Phase 2 implementation

Phase 2 introduces `server/bootstrap/runtime.ts` as the single process-level bootstrap adapter. It composes the runtime context, AI-provider set and process lifecycle safety handlers behind one explicit invocation.

The intended entry-point cutover is deliberately narrow:

```ts
const runtime = bootstrapServerRuntime();
const { logger: serverLogger, port: PORT, isProduction: isProductionEnv } = runtime;
const { gemini: ai, anthropic, openai } = runtime.providers;
```

When that cutover is applied, the duplicate provider initialization and process listeners currently located in `server.ts` are removed. No route registration, middleware ordering, Stripe webhook semantics, Supabase configuration, Render configuration, R-001 scoring behavior or R-002 runtime guard behavior is changed as part of Phase 2.

The migration branch must remain synchronized with current `main` before any change to `server.ts` itself. If parallel roadmap work modifies `server.ts` or one of its directly imported runtime contracts, the cutover is re-derived from the new head rather than replaying an older file snapshot.
