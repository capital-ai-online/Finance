# ADR-0045 — Stripe Event Ownership & Durable Inbox

- **Status:** Accepted
- **Implementation-Status:** IN PR — production migration/deploy pending
- **Date:** 2026-08-08
- **Scope:** CAPITAL-AI billing ingress / Stripe webhook / Supabase / application-owned checkout side effects
- **Platform Version:** `0.6.0`
- **Roadmap:** R-003 — Single billing owner + Stripe event inbox
- **Related:** ADR-0017, ADR-0043, R-004, R-101

## 1. Context

CAPITAL-AI receives Stripe lifecycle data through more than one integration concern:

1. Supabase-managed Stripe synchronization projects subscription state into `stripe.subscriptions` and then `public.subscriptions`;
2. the application webhook handles `checkout.session.completed` for application-owned side effects such as PDF-credit grants and subscription confirmation e-mails.

The subscription projection is already the authoritative owner for subscription tier changes. Express no longer mutates the tier for `customer.subscription.updated` or `customer.subscription.deleted`.

The remaining integrity gap is Stripe's at-least-once webhook delivery model. Before this ADR, the application webhook executed checkout side effects without first durably claiming `event.id`. A retry could therefore re-enter the same application-side effect path.

The existing e-mail guard used the stable Checkout Session ID, but its Supabase sequence was `SELECT -> UPSERT`. Two concurrent requests could both observe an absent row and both proceed to SMTP before either reservation became authoritative.

## 2. Decision

CAPITAL-AI establishes one durable application-side Stripe ingress ledger:

`public.stripe_event_inbox`

Every signature-verified Stripe event that reaches the application webhook MUST be claimed by `event.id` before application-owned side effects execute.

The ownership split is:

| Concern | Authoritative owner |
|---|---|
| Stripe signature verification | application webhook ingress |
| Stripe event-ID deduplication | `public.stripe_event_inbox` |
| subscription lifecycle/tier projection | Supabase Stripe synchronization -> `public.subscriptions` |
| Checkout Session confirmation mail | application side-effect consumer with atomic session reservation |
| PDF purchase side effect | application side-effect consumer; durable credit ledger deferred to R-004 |
| durable worker/outbox/lease orchestration | deferred to R-101 |

Express MUST NOT regain subscription-tier ownership.

## 3. Durable inbox contract

The inbox stores at minimum:

- `event_id` as primary key;
- `event_type`;
- `livemode`;
- Stripe API version;
- logical ingress source;
- SHA-256 payload hash;
- processing status;
- attempt count;
- receive/processing/completion timestamps;
- last processing error.

Allowed states are:

- `processing`;
- `processed`;
- `failed`.

The service-role-only function `public.claim_stripe_event(...)` is the atomic claim boundary.

Claim semantics:

1. a new event is inserted as `processing`, attempt `1`;
2. a matching `processed` or `processing` event is a duplicate and MUST NOT re-enter side effects;
3. a matching `failed` event may be claimed again and increments the attempt counter;
4. the same `event_id` with a different event type, livemode, API version or payload hash is an integrity conflict and MUST fail closed;
5. application code does not automatically reclaim an existing `processing` event.

The final rule is deliberate. Until R-004 makes PDF-credit mutation transactional, automatically replaying a stale `processing` event could duplicate a side effect after a crash between side-effect completion and inbox finalization. A stuck `processing` row is therefore a visible reconciliation condition, not an invitation to guess.

## 4. Side-effect execution contract

`handleWebhookEvent()` becomes the canonical application-side Stripe processing authority.

Processing order:

1. Stripe signature is verified at the HTTP boundary;
2. `event.id` is durably claimed;
3. integrity conflict => fail closed, no side effects;
4. duplicate processing/processed event => return success without side effects;
5. claimed event => execute application-owned side effects;
6. if side effects fail before completion, mark the inbox event `failed` and allow a later retry;
7. after side effects complete, mark the inbox event `processed`;
8. if finalization fails after side effects completed, leave the row `processing` and return an error. Do not convert it to `failed`, because that would enable an unsafe automatic replay while R-004 remains open.

Unsupported Stripe event types may be recorded and completed with no application-side effect. Subscription lifecycle events remain owned by the Supabase Stripe projection.

## 5. Atomic confirmation-mail reservation

`public.claim_subscription_confirmation(session_id)` replaces the race-prone application sequence:

`SELECT -> UPSERT`

with one database operation:

`INSERT ... ON CONFLICT DO NOTHING`

The boolean return value identifies the single caller that won the Checkout Session reservation.

Consequences:

- concurrent delivery for one Checkout Session has one winner;
- a later Stripe resend for the same Checkout Session is suppressed even when Stripe uses a different event ID;
- when privileged Supabase persistence is configured but the reservation RPC fails, production mail sending is blocked rather than falling back to Render-local files;
- a local file reservation remains development-only when Supabase is intentionally absent.

SMTP delivery itself remains best-effort. This ADR guarantees reservation/idempotency ownership, not guaranteed message delivery.

## 6. Security and database boundary

`stripe_event_inbox` is service-role-only:

- RLS enabled;
- no `anon`/`authenticated` table privileges;
- service-role `SELECT`, `INSERT`, `UPDATE` only;
- claim functions are `SECURITY DEFINER` with an explicit `search_path`;
- execute privilege is granted only to `service_role`.

The production application continues using the privileged server Supabase client defined by ADR-0043. No publishable/anon fallback is permitted for billing persistence.

## 7. Production handoff and deployment order

The Render production service currently deploys branch `main` automatically with:

- `autoDeploy = yes`;
- `autoDeployTrigger = checksPass`.

Therefore the database migration MUST be installed before the PR is merged. A merge-first procedure is unsafe because the successful merge checks can trigger the application deployment before the required RPC/table contract exists.

The safe handoff sequence is:

1. obtain human/code-owner approval for the reviewed PR, but keep the PR unmerged;
2. apply the additive migration `supabase/migrations/20260808013000_stripe_event_inbox.sql` to the production Supabase project through the controlled production handoff;
3. verify `stripe_event_inbox`, `claim_stripe_event(...)` and `claim_subscription_confirmation(...)` exist and remain service-role-only;
4. verify the currently deployed application remains healthy against the additive, unused database objects;
5. merge the reviewed PR;
6. allow Render `checksPass` auto-deploy from `main` to deploy the merged application;
7. verify `/healthz` and deployment identity after the Render deploy becomes live;
8. execute controlled Stripe webhook replay/duplicate tests;
9. verify duplicate delivery does not re-run application-owned side effects and inspect inbox state/evidence.

No live Supabase, Render or Stripe mutation is performed by the development branch or by this ADR. The pre-merge migration is a production-handoff operation requiring explicit protected-change authorization.

If the migration cannot be installed before merge, the PR MUST remain unmerged unless Render auto-deploy is deliberately disabled through an independently approved production change. Application deployment before the database migration is intentionally unsupported because the new production code fails closed when the durable claim contract is unavailable.

## 8. Explicit non-goals

R-003 does NOT:

- replace Supabase Stripe subscription projection;
- implement a generic queue, worker lease, outbox or dead-letter system;
- make PDF credits transactional or durable across Render instances;
- introduce new Stripe products/prices/coupons;
- mutate live Stripe, Supabase or Render configuration from the development branch.

Those concerns remain respectively under existing subscription ownership, R-101 and R-004.

## 9. Validation contract

Automated validation MUST prove:

1. a claimed Checkout event executes application-owned side effects once;
2. a duplicate event ID executes no side effects;
3. an event-ID/payload integrity conflict fails closed;
4. a pre-completion side-effect failure is recorded as `failed`;
5. a post-side-effect finalization failure is NOT converted to `failed` automatically;
6. subscription confirmation reservation has exactly one winner under concurrent calls;
7. a durable reservation failure blocks SMTP attempts rather than falling back to production-local state;
8. TypeScript, Vitest, production build and deployment-readiness remain green.

## 10. R-003 closure boundary

Repository implementation and CI are necessary but not sufficient to close R-003.

R-003 becomes **COMPLETE** only after:

- the migration is applied to production Supabase before the merge-triggered Render deploy;
- the application version containing this handler is deployed;
- a controlled duplicate/replay verification demonstrates durable event-ID deduplication;
- subscription projection remains owned by Supabase;
- no production-local fallback is used for event or confirmation reservation.

Until then the roadmap state is:

`IMPLEMENTED IN PR -> PRODUCTION HANDOFF PENDING`

## 11. Decision

Accepted. Stripe subscription state remains owned by the Supabase projection, while application-owned checkout side effects are gated by a durable service-role-only Stripe Event Inbox. Checkout confirmation mail uses an independent atomic Checkout Session reservation. Because Render auto-deploys passing `main` changes, the additive Supabase migration is a mandatory pre-merge production gate. Generic worker durability and transactional PDF credits remain separate roadmap items R-101 and R-004.
