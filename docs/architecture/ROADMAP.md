# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-10
Baseline branch: `main`
Baseline commit: `114356f`
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
| R-003 — Single Stripe owner + durable event inbox | COMPLETE | ADR-0045 | Owner-run production replay 2026-08-10 of a real Stripe redelivery (`evt_1TytDVPKr4joNbEcKgxL0mdK`, `checkout.session.completed`), independently re-verified read-only against Supabase: `status=processed`, `attempts=1`, `last_error=NULL`; Render logs show the second delivery classified `duplicate_processed` with no re-entry into checkout side effects (no second confirmation-mail attempt, no second PDF-credit grant). `attempts` staying at `1` is the **correct**, ADR-0045 §3-conformant result, not a defect — see "R-003 attempts-semantics clarification" below | None — R-003 is closed. Preserve the durable-inbox invariant in all future billing changes |
| R-004 — Transactional PDF-credit ledger | OPEN | Follow-up from ADR-0045 | Current PDF-credit mutation is explicitly outside the R-003 durable event transaction boundary | Design ADR, define idempotent credit ledger, migration contract, transactional grant semantics and replay tests |
| R-101 — Durable worker/outbox/lease | OPEN | Follow-up from ADR-0045 | Explicitly deferred from R-003 | Start only after R-004 transaction boundary is defined; design lease/retry/dead-letter/reconciliation semantics |
| ADR-0014 Phase 3 — `server.application.ts` decomposition | IN PROGRESS | ADR-0014 | Duplicate `src/server/**` retired; route, docs/history, AI and market-data boundaries progressively extracted | Complete compatibility cutovers, then scoring and lifecycle extraction |
| OPS-001 — Production SMTP authentication failing | OPEN | n/a (ops finding, not an ADR-governed workstream) | Real production log during the 2026-08-10 R-003 replay showed `Invalid login: 535 Authentication credentials invalid` for the checkout-confirmation SMTP attempt (`server/mailer.ts` -> `sendMail`). Independent of R-003: the durable-inbox/reservation logic behaved correctly (single attempted send, no duplicate), the send itself just failed at the SMTP layer, most likely rotated/expired `SMTP_PASSWORD` or provider-side credential change | Owner to verify/rotate `SMTP_USER`/`SMTP_PASSWORD` in Render env vars and confirm a real send succeeds; no code change expected. Do not action from a dev branch — production credential rotation requires the owner's direct authorization |

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

## R-003 attempts-semantics clarification (2026-08-10)

The real production replay test that closed R-003 (`evt_1TytDVPKr4joNbEcKgxL0mdK`) initially
looked like a failure: the redelivered event was correctly deduplicated (no side effects re-ran),
but `stripe_event_inbox.attempts` stayed at `1` instead of increasing, which the test's own
acceptance criteria (written when the test was set up, `attempts >= 2`) treated as a required
pass condition.

Root-cause analysis against ADR-0045 §3 (claim semantics) and the `claim_stripe_event(...)`
implementation in `supabase/migrations/20260808013000_stripe_event_inbox.sql` shows this was a
**flawed acceptance criterion, not a code defect**:

- ADR-0045 §3 rule 2: a matching `processed`/`processing` event "is a duplicate and MUST NOT
  re-enter side effects" — it says nothing about incrementing a counter.
- ADR-0045 §3 rule 3: only a matching **`failed`** event "may be claimed again and increments the
  attempt counter."
- The SQL matches this exactly: the `duplicate_processed`/`duplicate_processing` return branch
  performs no `UPDATE` at all (returns the existing `v_row.attempts` unchanged); only the
  `status = 'failed'` branch runs `UPDATE ... SET attempts = attempts + 1 ...`.

So `attempts` is architecturally a **processing/claim-attempt counter** (how many times the
application actually re-entered processing, i.e. only after a prior `failed` state), not a
**Stripe-delivery counter** (how many times Stripe has sent this event). Both the migration and
`server/stripeEventInbox.ts` implement the former correctly. No code or migration change was made
as a result of this investigation — doing so to force `attempts=2` on a duplicate would have
contradicted ADR-0045 §3 rule 2.

The corrected, ADR-conformant pass criteria for a duplicate-delivery replay are: `status=processed`,
`attempts` **unchanged** from before the redelivery, `last_error=NULL`, and — verified independently
via Render logs, not just the inbox row — no second execution of checkout side effects (confirmation
mail, PDF-credit grant).

**Considered and deliberately not built:** a separate `delivery_count` column that would track every
observed Stripe delivery attempt regardless of claim outcome, purely for operational/forensic
visibility. Not implemented in this pass — the existing `claim_status` returned per call
(`claimed_processed` / `duplicate_processing` / `duplicate_processed` / `retry_claimed` /
`integrity_conflict`) already appears in application logs on every delivery, which gives the same
forensic trail without a schema change. Revisit only if operators actually need queryable historical
delivery counts beyond what logs provide.

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

Status: `COMPLETE` (2026-08-10)

Merged preparation includes:

- market-data HTTP adapter boundary;
- refresh coordinator;
- crypto provider priority preservation;
- Stooq and FMP provider stages;
- compatibility facade;
- runtime cache/coalescing facade;
- application-level market-data runtime wiring in `server/marketData/createApplicationMarketDataRuntime.ts`.

**Cutover complete (2026-08-10):** `server.application.ts`'s legacy inline
`fetchLiveMarketData()` (~500 lines), its module-level cache/coalescing state
(`cachedMarketData`/`lastMarketDataFetch`/`activeMarketDataPromise`/`cmcCoolDownUntil`/
`coingeckoCoolDownUntil`), and the duplicated startup/background-timer refresh blocks are removed
and replaced by a single `createApplicationMarketDataRuntime(...)` instance whose callbacks
(`enrichAsset`, `syncAsset`, `persistSnapshots`, `evaluateAlerts`) supply exactly the same
enrichment, registry sync, and Supervisor-wrapped snapshot/alert side effects as before. Verified
behavior-preserving by: (1) line-by-line comparison of every provider stage
(`server/marketData/*.ts`) against the deleted legacy code — confirmed byte-identical ticker lists,
matching URLs/cooldowns/formulas for the CMC→CoinGecko→Binance→Kraken→Coinbase→static crypto
cascade, the Stooq CSV parsing, and the FMP index stage; (2) full test suite green (110 files, 575
tests) including the pre-existing 289 lines of dedicated market-data module tests plus
`tests/unit/applicationMarketDataRuntime.test.ts`'s wiring-contract test; (3) a manual smoke test
(dev server started locally, sandbox has no outbound network so every live provider correctly
returned 403 and the pipeline fell through to the honest `dataSource: 'fallback'` static-registry
tier exactly as designed) — `GET /api/market-data` returned all 572 registry assets, correctly
enriched (`applicationArea`, `score`, `scoreBasis`) and cache-hit on a second request (~11ms); server
logs showed the expected `[Market Data] Initiating background fetch...` /
`Successfully pre-cached 572 assets on startup.` sequence. One micro-behavior difference, deliberate
and favorable: the Stooq-failure fallback branch no longer double-emits `type: 'index'` assets
(a pre-existing legacy edge-case quirk during a Stooq outage, not a regression).

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

1. Complete route/docs/history compatibility cutovers that are already gated by extracted boundaries.
2. Resolve OPS-001 (production SMTP authentication) — owner action, not a dev-branch code change.
3. Start R-004 with a dedicated ADR and additive database design for transactional, idempotent PDF-credit grants.
4. Implement R-004 and prove replay-safe credit accounting.
5. Start R-101 durable worker/outbox/lease only after R-004 establishes the durable side-effect transaction boundary.
6. Finish scoring-route (Phase 3.5) and startup/lifecycle (Phase 3.6) decomposition under ADR-0014.

R-003 (2026-08-10) and ADR-0014 Phase 3.4 (2026-08-10) are closed and have been removed from this
queue.

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
