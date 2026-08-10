# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-10
Baseline branch: `main`
Baseline commit: `65e9950b07cb8bad863ee387a811a52972697e11`
Platform version: `0.6.0`

This document is the canonical roadmap status index for CAPITAL-AI. Detailed architecture decisions remain authoritative in their ADRs; this file provides the current execution order, closure gates and evidence pointers.

## Status model

- `COMPLETE`: repository implementation and all required production evidence are complete.
- `TECHNICALLY COMPLETE`: repository implementation and CI evidence are complete; no additional production mutation is required for the roadmap invariant.
- `IMPLEMENTED / PRODUCTION HANDOFF PENDING`: repository implementation exists, but production migration/deploy/verification evidence is still required.
- `IN PROGRESS`: actively decomposed or implemented in reviewed phases.
- `OPEN`: accepted follow-up work has not yet reached an implementation closure boundary.

## Current roadmap balance

| ID / Workstream | Status | Architecture authority | Current closure evidence | Next gate |
|---|---|---|---|---|
| R-001 — No-Demo-Data + scoring provenance | TECHNICALLY COMPLETE | ADR-0032 | `docs/adr/evidence/ADR-0032-REVALIDATION-2026-08-08-R001.md` | Preserve provenance invariants in all later provider/scoring work |
| R-002 — Production runtime artifact immutability | COMPLETE | ADR-0044 | Runtime Artifact Guard, immutable release manifest, read-only production Documentary boundary, validated CI | Remove inert legacy compatibility code opportunistically without weakening guard |
| R-003 — Single Stripe owner + durable event inbox | TECHNICALLY COMPLETE / REPLAY-EVIDENCE OPEN | ADR-0045 | Production re-verified 2026-08-10 (read-only Supabase + Render inspection): migration `20260808090343_stripe_event_inbox` is applied (table RLS enabled, `service_role`-only grants, both RPC functions present with correct signatures/security definer), the handler-containing build is live on Render (deploy `dep-*` for main HEAD, `status: live`, delivered via the GitHub Actions `deploy_hook` pipeline, not Render's git auto-deploy), and `stripe_event_inbox` shows 6 real production events since 2026-08-08, all `status=processed`, `attempts=1`, zero `failed`/stuck rows | No real duplicate delivery has occurred yet in the observed window, so dedup is evidenced organically (clean first-attempt processing) but not yet proven against an actual retry. Needs either more organic production time, or the owner running a deliberate `stripe trigger`/manual redelivery duplicate test via Stripe CLI against the live webhook endpoint (requires `STRIPE_WEBHOOK_SECRET`; not attempted from this sandbox per CLAUDE.md's production-mutation-from-dev-step restriction) |
| R-004 — Transactional PDF-credit ledger | OPEN | Follow-up from ADR-0045 | Current PDF-credit mutation is explicitly outside the R-003 durable event transaction boundary | Design ADR, define idempotent credit ledger, migration contract, transactional grant semantics and replay tests |
| R-101 — Durable worker/outbox/lease | OPEN | Follow-up from ADR-0045 | Explicitly deferred from R-003 | Start only after R-004 transaction boundary is defined; design lease/retry/dead-letter/reconciliation semantics |
| ADR-0014 Phase 3 — `server.application.ts` decomposition | IN PROGRESS | ADR-0014 | Duplicate `src/server/**` retired; route, docs/history, AI and market-data boundaries progressively extracted | Complete compatibility cutovers, then scoring and lifecycle extraction |

## Production evidence snapshot — 2026-08-10 (supersedes the 2026-08-08 snapshot below)

Read-only production inspection (Supabase + Render MCP tools, no mutation performed) established:

- Supabase project `AIFINANCIAL` is `ACTIVE_HEALTHY`.
- `public.stripe_event_inbox` IS present (migration `20260808090343_stripe_event_inbox` applied), RLS enabled, `service_role`-only grants (`anon`/`authenticated` revoked) — matches ADR-0045 §6 exactly.
- `public.claim_stripe_event(...)` and `public.claim_subscription_confirmation(text)` ARE present, `security definer`, `execute` granted only to `service_role`/`postgres`.
- `stripe_event_inbox` contains 6 real events (2026-08-08 through 2026-08-09), all `status=processed`, `attempts=1`, zero `failed` or stuck `processing` rows.
- Render production service `Finance` no longer uses git-based auto-deploy (`autoDeploy=no`, `autoDeployTrigger=off`) — deploys are now triggered via a GitHub Actions `deploy_hook` per merge (superseding the `checksPass` trigger described in the superseded snapshot below), and the deploy history shows every recent `main` merge, including the PR that carries this roadmap update, deployed within ~2 minutes with `status=live`.

Consequence: the R-003 migration/deploy handoff gate is closed. The only remaining R-003 gap is a deliberate duplicate/replay proof (see table above) — this snapshot does not claim that has been demonstrated, only that the durable-inbox mechanism is live and organically healthy.

### Superseded snapshot — 2026-08-08 (kept for history; do not treat as current)

- `public.stripe_event_inbox` is not present in production.
- `public.claim_stripe_event(...)` is not present in production.
- `public.claim_subscription_confirmation(text)` is not present in production.
- Render production service `Finance` tracks repository `SvenKulessa/Finance`, branch `main`, with `autoDeploy=yes` and `autoDeployTrigger=checksPass`.
- Render reports commit `1809f03c3e7bc4a01e8922b35db00774936fecc4` as the current live deployment.

At the time of this snapshot, no Supabase, Render or Stripe mutation was performed during the inspection. The migration was applied shortly afterward (same day, per Supabase migration history) by a separate handoff step not captured in this document at the time.

## ADR-0014 execution order

The canonical production runtime is `server.ts -> server.application.ts -> server/** / src/routes/** / src/features/** / src/services/** / src/platform/**`. `server.application.ts` is temporary compatibility composition only and must shrink monotonically.

### Phase 3.1 — Route composition

Status: `BOUNDARY EXISTS / CUTOVER REMAINS`

Canonical boundary: `server/routes/registerApplicationRoutes.ts`.

Next action: replace the equivalent inline router-mount block in `server.application.ts` with the canonical route composer while preserving Stripe raw-body ordering, global middleware ownership, provider construction and runtime-secret validation.

### Phase 3.2 — Documentation and history

Status: `BOUNDARIES EXTRACTED / LEGACY CLEANUP REMAINS`

Canonical boundaries:

- `server/routes/documentationRoutes.ts`
- `server/routes/historyRoutes.ts`

The historic runtime documentation write path must not be migrated. R-002 already requires production runtime documentation to remain immutable. Remaining compatibility code should be retired only through a reviewed behavior-preserving cleanup.

### Phase 3.3 — AI sentiment and portfolio

Status: `PARTIALLY EXTRACTED / CUTOVER REMAINS`

Next action: move remaining compatibility handlers behind canonical AI route/service boundaries without changing model-routing, usage tracking, IAM or fail-closed semantics.

### Phase 3.4 — Market-data runtime

Status: `PREPARATION COMPLETE / FINAL CUTOVER NEXT`

Merged preparation includes:

- market-data HTTP adapter boundary;
- refresh coordinator;
- crypto provider priority preservation;
- Stooq and FMP provider stages;
- compatibility facade;
- runtime cache/coalescing facade;
- application-level market-data runtime wiring in `server/marketData/createApplicationMarketDataRuntime.ts`.

Immediate next implementation step: replace the legacy inline provider/cache/background-refresh implementation in `server.application.ts` with `createApplicationMarketDataRuntime(...)`, preserving provider priority, fallback labeling, registry synchronization, enrichment, score snapshots, alerts and stale-cache behavior.

### Phase 3.5 — Scoring route boundaries

Status: `OPEN AFTER MARKET-DATA CUTOVER`

Constraints:

- R-001/ADR-0032 provenance invariants are non-negotiable;
- bootstrap/catalog values must not silently become verified market evidence;
- score evidence must remain explicit and fail closed when required observations are unavailable.

### Phase 3.6 — Startup and lifecycle

Status: `OPEN AFTER SCORING EXTRACTION`

Already protected behavior includes Render port resolution, runtime-secret validation, graceful shutdown and network-independent health checks. Final extraction should centralize startup/background lifecycle only after domain ownership is stable.

## Priority queue

1. Complete ADR-0014 Phase 3.4 final market-data cutover in a narrow PR.
2. Complete route/docs/history compatibility cutovers that are already gated by extracted boundaries.
3. Close the remaining R-003 gap: a deliberate Stripe duplicate/replay proof (owner-run, requires `STRIPE_WEBHOOK_SECRET`) — migration and deployment evidence are otherwise closed as of 2026-08-10.
4. Start R-004 with a dedicated ADR and additive database design for transactional, idempotent PDF-credit grants.
5. Implement R-004 and prove replay-safe credit accounting.
6. Start R-101 durable worker/outbox/lease only after R-004 establishes the durable side-effect transaction boundary.
7. Finish scoring-route and startup/lifecycle decomposition under ADR-0014.

## Protected invariants for all remaining work

All future roadmap changes must preserve:

- ADR-0032 / R-001 market-evidence provenance;
- ADR-0044 / R-002 production runtime immutability;
- ADR-0045 / R-003 single subscription-state ownership and Stripe ingress semantics;
- ADR-0037 Render runtime port and graceful shutdown behavior;
- ADR-0040 CSP/security-response ownership;
- fail-closed IAM, runtime-secret and metrics contracts;
- network-independent `/healthz` behavior;
- no production Stripe, Supabase or Render mutation from development branches unless separately and explicitly authorized through the production handoff protocol.

## Closure discipline

A roadmap item may not be marked `COMPLETE` solely because code exists on `main`. Where the ADR defines production evidence, closure requires that evidence. Repository CI is technical validation, not proof of live migration, deployment or external-provider behavior.

Every roadmap-changing PR should update this file when it changes the status, next gate or execution order of an item.
