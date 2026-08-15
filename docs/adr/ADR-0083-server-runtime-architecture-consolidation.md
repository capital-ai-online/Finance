# ADR-0083 — Server Runtime Architecture Consolidation

**Status:** Accepted  
**Implementation-Status:** 🟡 IN PROGRESS (Phase 3 domain decomposition ongoing)  
**Date:** 2026-08-08 (decision); numbered into canonical registry 2026-08-16  
**Scope:** CAPITAL-AI production server architecture

## Numbering / location note

This decision was historically filed under `docs/architecture/adr/ADR-0014-server-runtime-architecture-consolidation.md` and misused the number **ADR-0014**, which is reserved for the Documentation Governance Validator (`docs/adr/ADR-0014-documentation-governance-validator.md`).

Per Owner decision 2026-08-16 (unified ADR location = `docs/adr/` only):

- Canonical file is **this** document under `docs/adr/` as **ADR-0083**.
- Architecture phase notes no longer claim `ADR-0014` as primary ID; they point here as parent.
- Former path under `docs/architecture/adr/` is retained only as a short redirect stub until cleaned.

## Context

ADR-0013 (canonical ESS documentation responsibility) is unrelated. The server composition extraction under the architecture tree completed the extraction of the root `server.ts` entry point. During the follow-up review, a second server architecture was identified under `src/server/` in addition to the active production modules under `server/` and the compatibility composition module `server.application.ts`.

The duplicate `src/server/` scaffold contained an inactive `createApplication()` composition root and partial route/configuration modules. Repository code search found no production caller of `createApplication()`. Its architecture documentation also described modules that were not present in the repository tree.

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
2. `docs/architecture/SERVER_MODULARIZATION.md` was marked superseded by the server composition work and this consolidation decision.
3. Repository code search established that `createApplication()` had no caller outside the legacy scaffold.

### Phase 2 — dead scaffold retirement

Completed in PR #108 after reference analysis. Twelve files under `src/server/**` formed a closed, inactive dependency island and were retired together.

### Phase 3 — `server.application.ts` domain decomposition

Phase 3 proceeds only against the canonical runtime and is split into independently gated steps. Phase notes live under `docs/architecture/` as **phase documents** (not ADR numbers):

- Phase 3.1 — route composition boundary (`server/routes/registerApplicationRoutes.ts`)
- Phase 3.2 — documentation and history boundaries
- Phase 3.3 — AI analysis route extraction (`PHASE-3.3-ai-analysis-extraction-note.md`)
- Phase 3.4 — market-data adapters and stages (`PHASE-3.4-*` notes)
- Phase 3.4.6 — market-data compatibility facade
- Phase 3.4.7 — runtime facade (ADR-0075)

Each extraction must be behavior-preserving unless an existing behavior conflicts with an already accepted production invariant.

## Consequences

There is now one source of server architecture truth. `server.application.ts` is treated strictly as a temporary compatibility composition module whose responsibilities shrink monotonically. New domain logic must not be added there when an existing canonical domain boundary is available.

## References

- ADR-0036 (related modularization note in docs/adr)
- ADR-0037, ADR-0040, ADR-0044, ADR-0045
- ADR-0075 (Phase 3.4.7 runtime facade)
- Architecture phase notes under `docs/architecture/` (PHASE-3.x naming)
