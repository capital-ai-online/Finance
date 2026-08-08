# CAPITAL-AI Server Modularization

## Status

**SUPERSEDED** by ADR-0013 and ADR-0014 as of 2026-08-08.

This document records an earlier modularization scaffold under `src/server/`. It is retained temporarily as migration evidence only and is **not** the authoritative production server architecture.

## Canonical runtime

The production architecture is now:

```text
server.ts                  # stable thin process entry
server.application.ts      # compatibility composition module during decomposition
server/                    # canonical runtime/infrastructure modules
src/routes/                # domain route factories
src/features/              # feature modules
src/services/              # domain services/scoring
src/platform/              # governance/security/platform services
```

See:

- `docs/architecture/adr/ADR-0013-server-composition-root-and-modular-bootstrap.md`
- `docs/architecture/adr/ADR-0014-server-runtime-architecture-consolidation.md`

## Historical scaffold

The earlier target described the following `src/server/` structure:

```text
src/server/
├── app.ts
├── config/
├── integrations/
├── middleware/
└── routes/
```

The historical document also referenced `lifecycle/startup.ts`, `services/marketData.service.ts`, `scoring.routes.ts`, `sentiment.routes.ts` and `portfolio.routes.ts`. Those paths are not present in the current repository tree. The scaffold therefore must not be treated as a completed production replacement for `server.application.ts`.

## Consolidation rule

No new production dependency may target `src/server/app.ts`. Existing files under `src/server/` are subject to ADR-0014 Phase 2 inventory and retirement. Any unique behavior found there must first be reconciled against current R-001/R-002/R-003, ADR-0037 and ADR-0040 invariants and then migrated into the canonical runtime tree.

## Historical objectives retained as design guidance

The original goals remain valid as guidance: small route modules, explicit infrastructure registration, dependency injection for AI providers, preserved Stripe raw-body ordering, network-independent health checks, deterministic lifecycle ownership and isolated domain services.

Those goals are now implemented incrementally through the canonical architecture rather than by activating the duplicate `src/server/` composition root.
