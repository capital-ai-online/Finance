# ADR-0014 — Server Runtime Architecture Consolidation

Status: Accepted
Date: 2026-08-08
Scope: CAPITAL-AI production server architecture

## Context

ADR-0013 completed the extraction of the root `server.ts` entry point. During the follow-up review, a second server architecture was identified under `src/server/` in addition to the active production modules under `server/` and the compatibility composition module `server.application.ts`.

The duplicate `src/server/` scaffold contained an inactive `createApplication()` composition root and partial route/configuration modules. Repository code search found no production caller of `createApplication()`. Its architecture documentation also described modules such as `src/server/lifecycle/startup.ts`, `services/marketData.service.ts`, `scoring.routes.ts`, `sentiment.routes.ts` and `portfolio.routes.ts` that were not present in the repository tree.

At the same time, roadmap work R-001, R-002 and R-003 as well as ADR-0037 and ADR-0040 have hardened the active root-level `server/` runtime contracts. Maintaining two competing server composition trees created ambiguity over ownership, made future refactors prone to semantic drift and increased the risk that an inactive scaffold could be accidentally promoted over the production-hardened runtime.

## Decision

The canonical production server architecture is:

```text
server.ts                  # stable thin process entry
server.application.ts      # compatibility composition module during domain extraction
server/                    # canonical infrastructure/runtime modules
src/routes/                # application/domain route factories already owned here
src/features/              # feature-specific HTTP/domain modules
src/services/              # domain services and scoring engines
src/platform/              # governance, IAM, compliance and platform services
```

`src/server/` is retired and MUST NOT become a second production composition root.

No new server infrastructure module may be added under `src/server/` unless this ADR is superseded. Useful behavior must live in the canonical `server/`, `src/routes/`, `src/features/`, `src/services/` or `src/platform/` boundaries.

## Production invariants

The consolidation MUST preserve:

- R-001 / ADR-0032 scoring provenance semantics;
- R-002 / ADR-0044 runtime artifact immutability and preloaded Runtime Artifact Guard;
- R-003 / ADR-0045 Stripe event ownership, raw-body verification and durable inbox semantics;
- ADR-0037 Render runtime port resolution and graceful shutdown behavior;
- ADR-0040 CSP safe-rollout ownership through the active security-response path;
- process-wide quiet dotenv behavior;
- fail-closed IAM and metrics contracts;
- network-independent `/healthz` behavior.

## Migration record

### Phase 1 — authority reconciliation

Completed in PR #108:

1. `src/server/app.ts` was explicitly classified as an inactive legacy composition root before retirement.
2. `docs/architecture/SERVER_MODULARIZATION.md` was marked superseded by ADR-0013 and ADR-0014.
3. Repository code search established that `createApplication()` had no caller outside the legacy scaffold.

### Phase 2 — dead scaffold retirement

Completed in PR #108 after reference analysis.

Twelve files under `src/server/**` formed a closed, inactive dependency island and were retired together. This removed duplicate CSP, Stripe webhook, AI-provider, middleware and route-composition implementations without deleting active runtime behavior.

### Phase 3 — `server.application.ts` domain decomposition

Phase 3 proceeds only against the canonical runtime and is split into independently gated steps.

#### Phase 3.1 — route composition boundary

`server/routes/registerApplicationRoutes.ts` is the canonical route-mounting boundary. It preserves the exact production URL prefixes and provider arguments currently owned inline by `server.application.ts`.

The module deliberately does **not** own:

- Stripe raw-body webhook ingress or its ordering before `express.json()`;
- global middleware or CSP ordering;
- AI provider creation;
- scoring implementation or evidence semantics;
- runtime startup, background refresh or graceful shutdown.

The route-composition contract is gated independently before the high-contention compatibility module is changed.

#### Phase 3.2 — documentation and history boundaries

`server/routes/documentationRoutes.ts` establishes a canonical **read-only** documentation boundary for `GET /api/docs-file`.

The historic compatibility handler `POST /api/docs-file` is intentionally not migrated because it performs runtime writes into `docs/**`. That behavior conflicts with R-002 / ADR-0044 immutable production-runtime direction. It remains visible in `server.application.ts` as an explicit governance gap until a separately reviewed retirement or privileged non-production replacement is implemented.

`server/routes/historyRoutes.ts` extracts the registry-backed `GET /api/backtest-history` contract while preserving:

- `orchestrator.handle('Backtest Download')` governance;
- the existing 1Y/3Y/5Y/range limit behavior;
- `assetRegistry.getHistory()` as the authoritative source;
- explicit `history.source` propagation required by the No-Demo-Data policy.

Alpha Vantage quote/history provider logic remains in the compatibility module for now and moves later with the provider-adapter workstream. This prevents external-provider normalization, rate-limit semantics and route composition from being mixed prematurely.

#### Remaining Phase 3 order

1. wire the canonical route composer and remove the equivalent inline mount block;
2. wire read-only documentation and registry-backed history boundaries, then retire the incompatible runtime docs-write path;
3. AI sentiment and portfolio analysis routes;
4. market-data aggregation/provider adapters, including Alpha Vantage history/quote ownership;
5. scoring route boundaries;
6. startup/background refresh lifecycle.

Each extraction must be behavior-preserving unless an existing behavior conflicts with an already accepted production invariant. Such conflicts must be surfaced explicitly and retired through a separately gated change rather than silently normalized into the new architecture.

## Consequences

There is now one source of server architecture truth. `server.application.ts` is treated strictly as a temporary compatibility composition module whose responsibilities shrink monotonically. New domain logic must not be added there when an existing canonical domain boundary is available.
