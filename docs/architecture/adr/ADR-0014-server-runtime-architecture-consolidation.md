# ADR-0014 — Server Runtime Architecture Consolidation

Status: Proposed
Date: 2026-08-08
Scope: CAPITAL-AI production server architecture

## Context

ADR-0013 completed the extraction of the root `server.ts` entry point. During the follow-up review, a second server architecture was identified under `src/server/` in addition to the active production modules under `server/` and the compatibility composition module `server.application.ts`.

The duplicate `src/server/` scaffold contains an inactive `createApplication()` composition root and partial route/configuration modules. Repository code search shows no production caller of `createApplication()`. Its architecture documentation also describes modules such as `src/server/lifecycle/startup.ts`, `services/marketData.service.ts`, `scoring.routes.ts`, `sentiment.routes.ts` and `portfolio.routes.ts` that are not present in the current repository tree.

At the same time, roadmap work R-001, R-002 and R-003 as well as ADR-0037 and ADR-0040 have hardened the active root-level `server/` runtime contracts. Maintaining two competing server composition trees creates ambiguity over ownership, makes future refactors prone to semantic drift and increases the risk that an inactive scaffold is accidentally promoted over the production-hardened runtime.

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

## Migration plan

### Phase 1 — authority reconciliation

1. Mark `src/server/app.ts` as legacy/inactive and prevent new production dependencies on it.
2. Mark `docs/architecture/SERVER_MODULARIZATION.md` as superseded by ADR-0013 and ADR-0014.
3. Establish repository evidence that the inactive composition root has no caller.

### Phase 2 — dead scaffold retirement

1. Inventory every remaining `src/server/**` file.
2. For each file, classify it as duplicate, obsolete, or containing behavior that must be migrated.
3. Delete files that are proven unreferenced and semantically superseded.
4. Migrate only non-duplicated behavior to the canonical runtime tree through focused PRs.

### Phase 3 — `server.application.ts` domain decomposition

After the duplicate scaffold is retired, progressively move compatibility-owned blocks out of `server.application.ts` into canonical modules. Recommended order:

1. route registration/composition;
2. documentation and history endpoints;
3. AI sentiment and portfolio analysis routes;
4. market-data aggregation/provider adapters;
5. scoring route boundaries;
6. startup/background refresh lifecycle.

Each extraction must be behavior-preserving and independently gated by TypeScript, unit tests, production build and deployment-readiness checks.

## Consequences

Positive consequences are a single source of architectural truth, lower merge-conflict probability, clearer ownership and a safer path for continued decomposition of `server.application.ts`.

The primary cost is that some earlier modularization work under `src/server/` will be retired rather than promoted directly. This is intentional because runtime correctness and preservation of the current roadmap invariants take precedence over preserving an inactive scaffold.
