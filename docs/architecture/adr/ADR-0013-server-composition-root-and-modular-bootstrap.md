# ADR-0013 — Server Composition Root & Modular Bootstrap

Status: Accepted
Implementation-Status: COMPLETE — server.ts extraction closed
Date: 2026-08-08
Scope: CAPITAL-AI production server architecture

## Context

`server.ts` historically combined process bootstrap, environment initialization, Express application construction, security middleware, provider initialization, observability, health/metrics endpoints, webhook handling, router composition, market-data orchestration and domain-specific scoring logic. This created a large shared-file change surface and increased merge-conflict and regression risk.

The migration was executed incrementally against the continuously advancing roadmap baseline. The authoritative constraints preserved during the work are:

- R-001 / ADR-0032 provenance enforcement for Crypto/Meme scoring;
- R-002 / ADR-0044 production runtime artifact immutability;
- R-003 / ADR-0045 Stripe event ownership and durable inbox;
- ADR-0040 CSP runtime/safe-rollout ownership through `server/securityResponse.ts`;
- ADR-0037 Render runtime and graceful-shutdown behavior;
- process-wide quiet dotenv initialization.

## Decision

`server.ts` is a stable, thin build/runtime entry point only. Application behavior is owned outside that file.

The final entry-point contract is:

```ts
import './server.application';
```

The exact pre-cutover application implementation is preserved byte-for-byte in `server.application.ts`. This final relocation step is intentionally behavior-neutral: it changes ownership and change surface, not runtime semantics. The production build continues to bundle from `server.ts`, so Docker/Render start contracts remain unchanged.

Already extracted architectural modules remain the target decomposition boundaries:

```text
server.ts                         # thin build/runtime entry only
server.application.ts             # behavior-preserving compatibility composition module
server/
├── app/
│   └── compositionRoot.ts
├── bootstrap/
│   ├── runtime.ts
│   ├── providers.ts
│   └── processLifecycle.ts
├── middleware/
│   ├── cors.ts
│   ├── securityHeaders.ts
│   ├── probeProtection.ts
│   ├── globalRateLimit.ts
│   └── observability.ts
└── routes/
    ├── health.ts
    └── metrics.ts
```

`server.application.ts` is a compatibility composition module, not a new domain authority. Existing modular routers/services under `server/` and `src/` remain authoritative for their domains. Future cleanup may progressively replace compatibility-owned blocks with the extracted modules, but no future change requires reopening `server.ts` itself.

## Migration record

1. Process-scoped lifecycle, AI provider and runtime-context boundaries were introduced.
2. Security/observability middleware policies were extracted as independently testable modules.
3. `/healthz` and `/metrics` were extracted as dedicated routers.
4. Parallel roadmap work was reconciled before shared-file changes, including R-003 billing ownership, ADR-0040 CSP and ADR-0037 Render runtime work.
5. The final cutover copied the current `server.ts` implementation byte-for-byte to `server.application.ts` and replaced `server.ts` with the thin import shell.

The final cutover deliberately used the exact current blob from the repository rather than reconstructing the large file. This prevents stale-snapshot loss and preserves all parallel changes already present on `main`.

## Roadmap coexistence constraints

### R-001 — Provenance truth

The refactor preserves ADR-0032 semantics. Bootstrap/catalog values from `AssetRegistry` must not become verified scoring evidence, and future route extraction must remain behavior-preserving with the R-001 regression suite as a mandatory gate.

### R-002 — Runtime artifact immutability

`server/runtime/runtimeArtifactGuard.mjs` remains outside the bundled application composition root and continues to preload through Docker `NODE_OPTIONS`. Production Documentary/release mutation boundaries and immutable build evidence remain unchanged.

### R-003 — Stripe event ownership

The application-side Stripe event inbox and event-ID ownership introduced by ADR-0045 remain authoritative. Stripe raw-body webhook ingress must continue to execute before `express.json()` and before middleware that would invalidate the signature-verification contract.

### ADR-0040 — CSP ownership

`server/securityResponse.ts` remains the authoritative CSP rollout/security-response implementation. The server modularization must not duplicate or fork CSP policy ownership.

## Invariants

- Stripe webhook raw-body parsing remains before `express.json()`.
- CORS, CSP, HSTS, probe protection and global rate limiting retain their protected semantics.
- `/healthz` remains network-independent and suitable for Render health checks.
- `/metrics` remains fail-closed when `METRICS_TOKEN` is absent or invalid.
- AI provider absence remains fail-open only where deterministic fallbacks are defined.
- IAM authorization remains fail-closed.
- Render runtime port resolution and graceful shutdown behavior remain unchanged.
- No secrets or key fragments are introduced into startup diagnostics.
- R-001 scoring evidence semantics remain unchanged.
- R-002 preload/control-plane/release-evidence boundaries remain unchanged.
- R-003 Stripe event ownership remains unchanged.

## Consequences

Positive consequences:

- `server.ts` is no longer a shared architectural hotspot;
- build and runtime entry semantics are stable and minimal;
- future modularization can occur without repeatedly touching the root entry file;
- all parallel roadmap changes present on the cutover baseline are preserved exactly;
- rollback is straightforward because the compatibility implementation is byte-identical to the former entry file.

Trade-off:

- `server.application.ts` intentionally retains compatibility-owned composition and legacy inline handlers. Further decomposition improves modularity but is no longer a prerequisite for the `server.ts` extraction invariant.

## Completion criterion

ADR-0013 is complete when all of the following are true:

1. `server.ts` contains only the stable thin-entry contract;
2. the former implementation exists outside `server.ts` without semantic drift;
3. the production TypeScript/build/test gates pass;
4. R-001/R-002/R-003 and protected CSP/Render invariants remain green;
5. no production configuration mutation is required for the cutover.

These criteria define the closure of the `server.ts` extraction workstream.
