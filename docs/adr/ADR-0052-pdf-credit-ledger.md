# ADR-0052 — Transactional, Idempotent PDF-Credit Ledger

- **Status:** Accepted
- **Implementation-Status:** IMPLEMENTED IN PR -> PRODUCTION HANDOFF PENDING
- **Date:** 2026-08-10
- **Scope:** CAPITAL-AI PDF export credit balance and grant accounting
- **Platform Version:** `0.6.0`
- **Roadmap:** R-004 — Transactional PDF-credit ledger
- **Related:** ADR-0043, ADR-0045 (R-003), R-101

## 1. Context

ADR-0045 (R-003) established a durable Stripe event inbox for application-owned checkout side
effects, but explicitly deferred one of those side effects: the PDF-export credit grant. Its
ownership table lists the PDF purchase side effect as "application side-effect consumer; durable
credit ledger deferred to R-004", and its non-goals section states R-003 does not "make PDF
credits transactional or durable across Render instances."

Before this ADR, PDF credits were stored in `uploads/pdf_credits.json` (`server/db.ts`), a JSON
file on Render's local disk, read and written by `getLocalPdfCredits`/`saveLocalPdfCredits`:

1. **Not durable.** Render's filesystem is ephemeral, and production now redeploys on every merge
   to `main` via a GitHub Actions `deploy_hook` step. Every redeploy silently resets every
   customer's credit balance back to the implicit default of 3, discarding purchased credits.
2. **Not atomic.** `POST /consume-pdf-credit` (`server/stripe.ts`) performed a read-then-write
   sequence — read the current balance, check it is positive, write `current - 1` — with no
   locking. Concurrent requests could both read the same balance and both succeed, allowing
   over-consumption.
3. **No independent idempotency guard on grants.** The webhook's PDF-credit grant
   (`processStripeEventSideEffects`, `server/stripe.ts`) was deduplicated only by ADR-0045's
   Stripe-event-ID inbox one layer above it. ADR-0045 §3 rule 5 states application code does not
   automatically reclaim a stuck `processing` event specifically because "automatic re-entry
   could duplicate a non-transactional side effect (notably the legacy PDF-credit file path until
   R-004)" — i.e. a manually reconciled stuck event had no second line of defense against a
   double grant.
4. **No production guard.** Unlike `saveSubscription` (`server/db.ts`) and `claimStripeEvent`
   (`server/stripeEventInbox.ts`), which both call `assertPrivilegedSupabaseConfigured()` and fail
   closed in production when Supabase is not configured, `getLocalPdfCredits`/`saveLocalPdfCredits`
   silently used the local file even in production.

## 2. Decision

CAPITAL-AI establishes a durable, service-role-only PDF-credit ledger in Supabase, replacing the
local JSON file:

`public.pdf_credits` — current balance per `user_identifier`.
`public.pdf_credit_grants` — idempotency/audit ledger of grants, keyed by `grant_key`.

Two `SECURITY DEFINER` functions are the atomic boundary:

- `public.consume_pdf_credit(user_identifier)` — atomically decrements the balance by one,
  guarded by a single `UPDATE ... WHERE credits > 0` statement, replacing the read-then-write
  race.
- `public.grant_pdf_credits(grant_key, user_identifier, credits, source, reference)` —
  atomically grants credits, guarded by `grant_key` (`ON CONFLICT DO NOTHING` on
  `pdf_credit_grants`) as an independent idempotency check.

`grant_key` is the causing Stripe `event.id`. Because one Stripe checkout event corresponds to
exactly one PDF-credit grant, this ties the grant's own idempotency directly to the same identity
ADR-0045's inbox already uses, giving PDF-credit grants the second line of defense ADR-0045 §3
rule 5 flagged as missing.

The ownership split (extending ADR-0045 §2's table):

| Concern | Authoritative owner |
|---|---|
| PDF-credit balance persistence | `public.pdf_credits` |
| PDF-credit grant idempotency | `public.pdf_credit_grants` via `grant_pdf_credits(...)` |
| PDF-credit consumption atomicity | `consume_pdf_credit(...)` |
| Stripe event-ID deduplication (one layer up) | `public.stripe_event_inbox` (ADR-0045, unchanged) |
| durable worker/outbox/lease orchestration | deferred to R-101 |

`server/pdfCreditLedger.ts` is the sole application-side module that touches these tables/
functions, mirroring `server/stripeEventInbox.ts`'s structure: it normalizes the identifier,
preserves the existing owner-identity unlimited-credits bypass (`isOwnerIdentifier`, unchanged),
calls `assertPrivilegedSupabaseConfigured()` to fail closed in production when Supabase is not
configured, and keeps a local-file fallback for local development only (weaker guarantees
accepted there, same trade-off `stripeEventInbox.ts` already accepts for its
`localDevelopmentClaims` fallback).

`server/stripe.ts`'s three call sites (`GET /pdf-credits`, `POST /consume-pdf-credit`,
`processStripeEventSideEffects`'s PDF-grant branch) call this module exclusively; the HTTP
response contracts consumed by `src/components/PdfExportModal.tsx` are unchanged.

## 3. Ledger contract

`pdf_credits`: `user_identifier` primary key, `credits integer not null default 3 check (credits
>= 0)`, `updated_at`. A first-seen identifier is lazily initialized at the default of 3, matching
the legacy default.

`pdf_credit_grants`: `grant_key` primary key (the Stripe `event.id`), `user_identifier`,
`credits_granted`, `source`, `reference` (e.g. Checkout Session id), `granted_at`.

`consume_pdf_credit(p_user_identifier)`:

1. lazily inserts the balance row at 3 if absent (`ON CONFLICT DO NOTHING`);
2. atomically decrements via `UPDATE ... SET credits = credits - 1 WHERE user_identifier = $1 AND
   credits > 0 RETURNING credits` — the row lock this statement takes makes the check-then-write
   atomic;
3. returns `(success: true, credits: <new balance>)` on success, or `(success: false, credits:
   <unchanged balance>)` when the balance was already 0.

`grant_pdf_credits(p_grant_key, p_user_identifier, p_credits, p_source, p_reference)`:

1. inserts into `pdf_credit_grants` with `ON CONFLICT (grant_key) DO NOTHING`;
2. if the key already existed (no row inserted), returns `(granted: false, credits: <current
   balance, untouched>)`;
3. otherwise upserts `pdf_credits` — `INSERT ... VALUES (user_identifier, 3 + p_credits) ON
   CONFLICT (user_identifier) DO UPDATE SET credits = pdf_credits.credits + p_credits` — so a
   first-time purchaser starts from the implicit default of 3 before the purchased credits are
   added, matching legacy semantics exactly;
4. returns `(granted: true, credits: <new balance>)`.

## 4. Security and database boundary

Both tables follow the exact `stripe_event_inbox` pattern from ADR-0045 §6:

- RLS enabled on both tables;
- no `anon`/`authenticated` table privileges;
- service-role `SELECT`, `INSERT`, `UPDATE` only;
- both functions are `SECURITY DEFINER` with an explicit `search_path = public, pg_temp`;
- execute privilege is granted only to `service_role`.

`server/pdfCreditLedger.ts` uses the privileged server Supabase client defined by ADR-0043. No
publishable/anon fallback is permitted for credit-balance persistence.

## 5. Production handoff and deployment order

Production currently deploys on merge to `main` via a GitHub Actions `deploy_hook` step (Render's
own git-based `autoDeploy`/`checksPass` is disabled). The database migration MUST therefore be
applied before the PR is merged, the same constraint ADR-0045 §7 already established for the
Stripe inbox, adapted to the current deploy trigger:

1. obtain review approval for the PR, but keep it unmerged;
2. apply the additive migration `supabase/migrations/20260810110642_pdf_credit_ledger.sql` to the
   production Supabase project through the controlled production handoff;
3. verify `pdf_credits`, `pdf_credit_grants`, `consume_pdf_credit(...)` and
   `grant_pdf_credits(...)` exist and remain service-role-only;
4. verify the currently deployed application remains healthy against the additive, unused
   database objects;
5. merge the reviewed PR, which fires the `deploy_hook`;
6. verify `/healthz` and deployment identity after the deploy becomes live;
7. verify a real PDF-credit purchase and consumption round-trip against the new tables.

No live Supabase, Render or Stripe mutation is performed by the development branch or by this
ADR. Application deployment before the database migration is intentionally unsupported because
the new production code fails closed (`assertPrivilegedSupabaseConfigured`) when the durable
ledger contract is unavailable.

## 6. Explicit non-goals

R-004 does NOT:

- change the `GET /pdf-credits` or `POST /consume-pdf-credit` HTTP response shape — the frontend
  (`src/components/PdfExportModal.tsx`) needs no changes;
- change how `isOwnerIdentifier` resolves ownership (`server/db.ts`) — reused as-is;
- implement a generic queue, worker lease, outbox or dead-letter system — that remains R-101;
- backfill `uploads/pdf_credits.json`'s existing contents. That file's balances are already
  unreliable (reset on every redeploy), so there is nothing trustworthy to migrate; new purchases
  and consumption become durable from this migration's rollout forward.

## 7. Validation contract

Automated validation MUST prove:

1. `consumePdfCredit` returns a decremented balance on success and leaves the balance unchanged
   with `success: false` when it was already 0;
2. `grantPdfCredits` credits the balance once for a first-seen `grant_key` and returns
   `granted: false` with the unchanged balance for a duplicate `grant_key`;
3. the owner identity bypasses the ledger entirely (unlimited credits, no RPC/table call);
4. production without a configured privileged Supabase client fails closed for all three exported
   functions rather than silently touching the local file;
5. TypeScript, Vitest, production build and deployment-readiness remain green.

## 8. Decision

Accepted. PDF-export credit balance and grant accounting move from an ephemeral, non-atomic local
JSON file to a durable, service-role-only Supabase ledger with atomic consume/grant functions,
ported directly from the pattern ADR-0045 already proved in production for the Stripe event
inbox. Because production deploys on merge, the additive Supabase migration is a mandatory
pre-merge production gate. Generic worker durability remains a separate roadmap item, R-101.
