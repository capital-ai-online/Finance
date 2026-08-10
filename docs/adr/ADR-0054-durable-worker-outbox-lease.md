# ADR-0054 — Durable Worker/Outbox/Lease

- **Status:** Accepted
- **Implementation-Status:** IMPLEMENTED IN PR -> PRODUCTION HANDOFF PENDING
- **Date:** 2026-08-10
- **Scope:** CAPITAL-AI generic durable job retry infrastructure (first consumer: checkout-confirmation e-mail)
- **Platform Version:** `0.6.0`
- **Roadmap:** R-101 — Durable worker/outbox/lease
- **Related:** ADR-0043, ADR-0045 (R-003), ADR-0052 (R-004)

## 1. Context

ADR-0045 (R-003) established a durable Stripe event inbox and explicitly deferred "a generic
queue, worker lease, outbox or dead-letter system" to this workstream. ADR-0052 (R-004) repeated
the same deferral for the credit ledger. Both ADRs list the concern in their ownership table as
"durable worker/outbox/lease orchestration | deferred to R-101" and both name R-101 as the
follow-up.

The concrete motivating failure is already recorded in production, not hypothetical. `ROADMAP.md`
OPS-001 documents a real 2026-08-10 production log: the checkout-confirmation SMTP attempt
(`server/mailer.ts` -> `sendMail`) failed with `535 Invalid login: Authentication credentials
invalid`. The durable-inbox/reservation logic itself behaved correctly — `claim_subscription_
confirmation(session_id)` (ADR-0045 §5) gave exactly one caller the reservation, so there was no
duplicate attempt — but because the reservation is consumed at "attempted," not "delivered," the
SMTP failure was terminal for that Checkout Session. No later automated retry occurs today; the
customer confirmation mail can never be sent again through the direct-send code path. ADR-0045 §5
already named this trade-off explicitly: "SMTP delivery itself remains best-effort. This ADR
guarantees reservation/idempotency ownership, not guaranteed message delivery."

R-101 generalizes a fix for this class of problem instead of hand-rolling a one-off retry for
this one call site.

## 2. Decision

CAPITAL-AI establishes one generic, durable, service-role-only job outbox:

`public.outbox_jobs`

Any application code that wants a side effect retried with backoff and eventually dead-lettered
enqueues a row instead of executing the side effect inline and discarding the outcome on failure.
Four `SECURITY DEFINER` functions are the atomic boundary, directly mirroring the shape ADR-0045
and ADR-0052 already proved in production:

- `public.enqueue_outbox_job(job_type, payload, idempotency_key, max_attempts, available_at)` —
  inserts a job, or returns the existing job's id unchanged when `idempotency_key` already exists.
- `public.claim_outbox_job(lease_owner, lease_seconds)` — atomically leases one eligible job
  (`FOR UPDATE SKIP LOCKED`), incrementing `attempts`.
- `public.complete_outbox_job(job_id, lease_owner)` — marks a held lease `succeeded`.
- `public.fail_outbox_job(job_id, lease_owner, error, backoff_seconds)` — below `max_attempts`,
  reschedules the job (`pending`, `available_at` pushed out by the backoff); at or beyond
  `max_attempts`, moves it to `dead_letter`.

`server/outbox.ts` is the sole application-side module that touches these functions, mirroring
`server/stripeEventInbox.ts`'s and `server/pdfCreditLedger.ts`'s structure (production fail-closed
via `assertPrivilegedSupabaseConfigured()`, a no-op skip — not a crash — when Supabase is
legitimately absent in local development). `server/outboxWorker.ts` is a poll loop with a
`job_type -> handler` registry: `claimOutboxJob()` -> dispatch to the registered handler ->
`completeOutboxJob()` on success or `failOutboxJob()` on a thrown error. A `job_type` with no
registered handler is itself recorded as a failure rather than silently dropped.

The ownership split (extending ADR-0045 §2 / ADR-0052 §2's table):

| Concern | Authoritative owner |
|---|---|
| Generic durable job retry (enqueue/claim/complete/fail) | `public.outbox_jobs` via `server/outbox.ts` |
| Outbox job dispatch to a handler | `server/outboxWorker.ts` |
| Checkout-confirmation mail retry (first concrete consumer) | `subscription_confirmation_mail` job type, handled by `server/mailer.ts`'s `processSubscriptionConfirmationMailJob` |
| Stripe event-ID deduplication | `public.stripe_event_inbox` (ADR-0045, unchanged) |
| PDF-credit grant/consume atomicity | `public.pdf_credits` / `grant_pdf_credits`/`consume_pdf_credit` (ADR-0052, unchanged) |

## 3. Idempotent-handler contract and the reclaim divergence from ADR-0045

ADR-0045 §3 rule 5 deliberately refuses to auto-reclaim a stuck `processing` Stripe event row:
"automatically replaying a stale `processing` event could duplicate a side effect after a crash
between side-effect completion and inbox finalization" — a real risk at the time, because the
side effects it guarded (PDF-credit grants) were not yet transactional.

R-101 makes the opposite, and equally deliberate, choice: `claim_outbox_job` **does** automatically
reclaim a job whose lease has expired (`status = 'processing' and lease_expires_at < now()`) and
re-dispatches it. This is safe specifically because R-101's contract requires every registered
`job_type` handler to be idempotent — safely re-runnable with the same payload, including after a
crash between handler completion and `complete_outbox_job()`. This is not a hypothetical
constraint for the one handler this PR ships: `processSubscriptionConfirmationMailJob` calls
`sendMail()` again, which is inherently at-least-once (SMTP itself gives no exactly-once
guarantee, and neither did the pre-R-101 direct-send path). A future job type that is not safely
re-runnable must not be registered against this worker without first making its side effect
idempotent (e.g. the same `grant_pdf_credits`-style `ON CONFLICT` idempotency key pattern), the
same discipline ADR-0052 applied to make the PDF-credit grant safe to sit behind ADR-0045's inbox.

## 4. Outbox contract

`outbox_jobs`: `id` (uuid, surrogate key), `job_type`, `idempotency_key` (nullable, unique when
present — Postgres unique indexes treat `NULL` as distinct, so unkeyed jobs are never
deduplicated against each other), `payload` (jsonb), `status` (`pending` / `processing` /
`succeeded` / `failed` / `dead_letter`), `attempts`, `max_attempts` (default 5), `available_at`
(claim eligibility / backoff scheduling), `lease_owner`, `lease_expires_at`, `last_error`,
`created_at`, `updated_at`.

`claim_outbox_job` selects one candidate — pending and due, or processing with an expired lease —
ordered by `available_at`, via `FOR UPDATE SKIP LOCKED` so multiple worker instances (multiple
Render dynos, if CAPITAL-AI scales beyond one) can poll concurrently without blocking each other.
`complete_outbox_job` and `fail_outbox_job` both require the caller to hold the current
`lease_owner`, so a worker that lost its lease to a reclaim cannot finalize a job it no longer
owns. `fail_outbox_job` compares `attempts` to `max_attempts` to decide between rescheduling with
backoff and moving to `dead_letter`.

`dead_letter` rows are not deleted or archived elsewhere. They remain directly queryable by any
service-role Supabase access (`select * from outbox_jobs where status = 'dead_letter'`) — the
same "visible reconciliation condition, not an invitation to guess" posture ADR-0045 established
for stuck inbox rows, adapted from "manual reconciliation of a stuck claim" to "manual
reconciliation of an exhausted retry budget."

## 5. First concrete consumer: checkout-confirmation mail retry

`server/mailer.ts`'s `sendSubscriptionConfirmation()` is unchanged up through the SMTP attempt.
When the customer or owner leg's `sendMail()` call reports failure, it now additionally calls
`scheduleConfirmationMailRetry(kind, sessionId, to, message)`, which enqueues a
`subscription_confirmation_mail` job with `idempotency_key =
"subscription_confirmation_mail:<sessionId>:<kind>"` — so even a hypothetical duplicate
scheduling attempt for the same Checkout Session and recipient kind cannot enqueue two retry
jobs. Scheduling is best-effort and never throws into the webhook response path, matching
`sendMail()`'s own never-throws contract: a failure to enqueue is logged and the request
completes exactly as it did before this ADR.

`processSubscriptionConfirmationMailJob` (the registered handler) re-attempts `sendMail()` from
the stored payload and throws on failure so the worker records a backoff retry or eventual
dead-letter. It does not re-check the Checkout Session reservation, since that reservation was
already durably won before the job was ever scheduled.

## 6. Security and database boundary

`outbox_jobs` follows the exact `stripe_event_inbox` / `pdf_credits` pattern:

- RLS enabled;
- no `anon`/`authenticated` table privileges;
- service-role `SELECT`, `INSERT`, `UPDATE` only;
- all four functions are `SECURITY DEFINER` with an explicit `search_path = public, pg_temp`;
- execute privilege is granted only to `service_role`.

`server/outbox.ts` uses the privileged server Supabase client defined by ADR-0043. No
publishable/anon fallback is permitted.

## 7. Production handoff and deployment order

Production currently deploys on merge to `main` via a GitHub Actions `deploy_hook` step. The
database migration MUST therefore be applied before the PR is merged, the same constraint
ADR-0045 §7 and ADR-0052 §5 already established:

1. obtain review approval for the PR, but keep it unmerged;
2. apply the additive migration `supabase/migrations/20260810160000_outbox_jobs.sql` to the
   production Supabase project through the controlled production handoff;
3. verify `outbox_jobs`, `enqueue_outbox_job(...)`, `claim_outbox_job(...)`,
   `complete_outbox_job(...)` and `fail_outbox_job(...)` exist and remain service-role-only;
4. verify the currently deployed application remains healthy against the additive, unused
   database objects;
5. merge the reviewed PR, which fires the `deploy_hook`;
6. verify `/healthz` and deployment identity after the deploy becomes live;
7. verify the outbox worker poll loop is running (application logs) and that a real SMTP failure
   (or a manually enqueued test job) is retried with backoff and eventually either succeeds or
   reaches `dead_letter` after `max_attempts`.

No live Supabase, Render or Stripe mutation is performed by the development branch or by this
ADR. Application deployment before the database migration is intentionally unsupported because
`server/outbox.ts` fails closed (`assertPrivilegedSupabaseConfigured`) in production when the
durable outbox contract is unavailable.

## 8. Explicit non-goals

R-101 does NOT:

- migrate the Stripe-event inbox (ADR-0045) or the PDF-credit ledger (ADR-0052) onto the generic
  outbox — both remain on their existing, already-production-proven claim tables; only the
  confirmation-mail retry gap identified by OPS-001 is wired to the new outbox in this PR;
- introduce a distributed task scheduler, cron system, or priority queue — `claim_outbox_job`'s
  ordering is `available_at` only;
- change `claim_subscription_confirmation`'s reservation semantics (ADR-0045 §5) — the
  reservation is still won exactly once, before any SMTP attempt, exactly as before;
- guarantee eventual delivery — a job that keeps failing past `max_attempts` reaches
  `dead_letter` and requires manual reconciliation, the same bounded guarantee ADR-0045 gives for
  a stuck inbox row.

## 9. Validation contract

Automated validation MUST prove:

1. `enqueueOutboxJob` inserts a new job and returns its id, and returns `enqueued: false` with the
   existing job's id for a duplicate `idempotencyKey`;
2. `claimOutboxJob` returns the claimed job's fields when the RPC returns a row, and `null` when
   nothing is claimable;
3. `completeOutboxJob` / `failOutboxJob` pass through the RPC's boolean/outcome result;
4. the outbox worker completes a job whose handler succeeds, records a failure (never throwing)
   when a handler rejects, and records a failure for a `job_type` with no registered handler;
5. `sendSubscriptionConfirmation` schedules exactly one retry job per failed leg (keyed by
   session + recipient kind) and never throws when scheduling itself fails;
6. production without a configured privileged Supabase client fails closed for
   `enqueueOutboxJob`/`claimOutboxJob`/`completeOutboxJob`/`failOutboxJob` rather than silently
   degrading;
7. TypeScript, Vitest, production build and deployment-readiness remain green.

## 10. Decision

Accepted. CAPITAL-AI establishes a generic, service-role-only, lease-based job outbox —
`outbox_jobs` plus `enqueue_outbox_job`/`claim_outbox_job`/`complete_outbox_job`/`fail_outbox_job`
— ported directly from the claim-table pattern ADR-0045 and ADR-0052 already proved in
production, with one deliberate divergence: because every registered job handler must be
idempotent, a stale lease is safely auto-reclaimed instead of left for manual reconciliation. The
first concrete consumer closes the OPS-001 gap: a failed checkout-confirmation SMTP send is now
retried with backoff instead of permanently lost. Because production deploys on merge, the
additive Supabase migration is a mandatory pre-merge production gate.
