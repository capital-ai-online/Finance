# ADR-0014 — Server Runtime Architecture Consolidation

Status: Proposed
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

`src/server/` is classified as a legacy/incomplete scaffold and MUST NOT become a second production composition root.

No new server infrastructure module may be added under `src/server/` unless this ADR is superseded. Existing useful implementation ideas from that scaffold may be migrated into the canonical `server/`, `src/routes/`, `src/features/` or `src/services/` boundaries only after their behavior is reconciled against current production invariants.

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

Completed on the PR #108 branch after reference analysis.

The following twelve files formed a closed, inactive dependency island and were removed together:

- `src/server/app.ts`
- `src/server/config/security.ts`
- `src/server/integrations/ai/providers.ts`
- `src/server/integrations/stripe/webhook.ts`
- `src/server/middleware/errorHandler.ts`
- `src/server/middleware/globalRateLimit.ts`
- `src/server/middleware/processSafety.ts`
- `src/server/routes/core.routes.ts`
- `src/server/routes/documentation.routes.ts`
- `src/server/routes/marketData.routes.ts`
- `src/server/routes/marketHistory.routes.ts`
- `src/server/routes/system.routes.ts`

Reference searches for the exported composition/route symbols resolved only inside that scaffold. No production import was found.

The retirement also removes known semantic drift rather than losing production behavior. Examples include:

- the legacy security module carried its own CSP implementation and therefore did not represent ADR-0040 safe-rollout ownership;
- the legacy documentation router exposed a direct runtime write path to `docs/**`, conflicting with the R-002 immutable production-runtime direction;
- the legacy Stripe wrapper was a second webhook composition path rather than the authoritative R-003 production ingress;
- the legacy AI provider factory duplicated provider bootstrap already established under the canonical runtime architecture.

No active production runtime file is deleted by Phase 2.

### Phase 3 — `server.application.ts` domain decomposition

Next, progressively move compatibility-owned blocks out of `server.application.ts` into canonical modules. Recommended order:

1. route registration/composition;
2. documentation and history endpoints;
3. AI sentiment and portfolio analysis routes;
4. market-data aggregation/provider adapters;
5. scoring route boundaries;
6. startup/background refresh lifecycle.

Each extraction must be behavior-preserving and independently gated by TypeScript, unit tests, production build and deployment-readiness checks.

## Consequences

Positive consequences are a single source of architectural truth, lower merge-conflict probability, clearer ownership and a safer path for continued decomposition of `server.application.ts`.

The primary cost is that earlier incomplete modularization work under `src/server/` is retired rather than promoted directly. This is intentional because runtime correctness and preservation of current roadmap invariants take precedence over preserving an inactive scaffold.
