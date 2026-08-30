# S1-R2-00 — Entitlement Authority Trace

Status: **CONFIRMED AUTHORITY GAP / REMEDIATION CANDIDATE — PR VERIFY PENDING**  
Evidence date: 2026-08-30  
Repository baseline for the current PR: `main@3815c7fce44e30bccf227a4399220407f4095706`  
Supabase project: `AIFINANCIAL` / `ryzywoktpmyhwzxmstyu`  
Scope: production-reachable subscription/tier authority, browser simulation reachability, protected entitlement decisions and Stripe→Supabase persistence.

## 1. Question and classification rule

S1-R2-00 asks whether browser-controlled or simulated subscription state can become authority for a protected paid capability.

The control may be classified `NOT AUTHORITY` only if every production-reachable paid capability resolves its grant from a verified server/provider authority and no browser-only branch can independently confer that capability.

If a browser-controlled tier is sufficient at any production-reachable protected call site, the result is `CONFIRMED AUTHORITY GAP` and R2-06 activates immediately.

## 2. Confirmed server/provider subscription authority

The primary subscription truth remains correctly isolated from browser mutation.

### Authenticated tier projection

`src/app/auth/SessionComposition.tsx` requests `/api/stripe/user-subscription` with the Supabase bearer token and defaults the UI projection to `Free` on failure.

`GET /api/stripe/user-subscription` in `server/stripe.ts` calls `resolveVerifiedIdentity(req)` and resolves the tier with `getSubscription(identity.userId)`. Query/body user identifiers do not select the account.

### Protected server quota decisions

`server/quota.ts` resolves a verified identity and derives quota decisions from `getSubscription(identity.userId)`. Client `tier` / `subscriptionTier` input is not used as entitlement authority.

`/api/stripe/pdf-credits` and `/api/stripe/consume-pdf-credit` likewise resolve the bearer principal first and read subscription/credit state server-side. Enterprise unlimited PDF authorization is therefore robust when those endpoints are actually used.

### Production persistence

`server/db.ts#getSubscription()` reads `public.subscriptions` from privileged Supabase state in Production and fails closed to `Free` when the privileged store is unavailable. Its local JSON compatibility path is not production authority.

No production source call site invokes the historical privileged `saveSubscription()` helper outside its own definition.

## 3. Live Supabase readback

Read-only database inspection of project `ryzywoktpmyhwzxmstyu` confirmed:

- `public.subscriptions` has RLS enabled;
- `authenticated` has an own-row SELECT policy only;
- no `anon`/`authenticated` INSERT, UPDATE or DELETE policy exists for `public.subscriptions`;
- `stripe.subscriptions` and `stripe.customers` are not granted to normal browser roles;
- `stripe_subscription_sync_trigger` executes `public.sync_stripe_subscription_to_public()` AFTER INSERT/UPDATE on `stripe.subscriptions`;
- the trigger function derives paid tiers from Stripe subscription metadata / known Price IDs, refuses unknown Price IDs, demotes non-active/non-trialing state to `Free`, and upserts by verified Supabase user identity.

This proves that a browser cannot directly rewrite the persisted Stripe/Supabase subscription truth.

The separate provider evidence `docs/evidence/security/STRIPE_LEGACY_WEBHOOK_DECOMMISSION_2026-08-30.md` additionally records the enabled canonical Supabase Stripe webhook and successful subscription lifecycle ingestion.

## 4. Browser-controlled tier projection remains reachable

The production frontend still contains browser-writable presentation state:

1. `Dashboard.tsx` restores an encrypted local profile object that includes `subscriptionTier`;
2. the Stripe return fallback accepts `?payment=success&plan=...` and assigns `plan` to `profile.subscriptionTier`;
3. `Abonnements` / `SubscriptionModal` can update the same local profile tier through UI callbacks;
4. Checkout simulated success is DEV-only and therefore is not itself the production exploit path.

These mechanisms do **not** mutate `public.subscriptions` and do not bypass the verified server endpoints by themselves. They nevertheless mean `profile.subscriptionTier` must be treated strictly as presentation state.

## 5. Confirmed paid-capability authority gap

The baseline implementation of `src/components/ComplianceExporter.tsx` violated that rule.

Its production-reachable click path was:

```text
browser profile.subscriptionTier === Enterprise
        |
        v
ComplianceExporter.isEnterprise === true
        |
        +-- userEmail present --> PdfExportModal --> authenticated server ledger
        |
        `-- userEmail absent  --> generatePDFReport() directly in browser
```

`Dashboard.tsx` renders `ComplianceExporter` without a `userEmail` prop. Therefore the second branch is the normal Dashboard call site.

A browser-controlled local `Enterprise` projection could consequently satisfy the only gate and execute client-side PDF generation without `/api/stripe/pdf-credits` or `/api/stripe/consume-pdf-credit`.

This is a production-reachable paid-capability bypass even though the underlying persisted subscription remains protected.

**Classification: `CONFIRMED AUTHORITY GAP`.**

## 6. Candidate remediation in PR #624

The current branch removes the alternate authority path:

### `ComplianceExporter.tsx`

- `subscriptionTier === 'Enterprise'` remains only a UX pre-filter;
- an Enterprise-looking browser state can only open `PdfExportModal`;
- absence of `userEmail` can no longer call `generatePDFReport()` directly;
- report generation is prepared first, but the download commit is reachable only after the modal's server authorization flow succeeds.

### `PdfExportModal.tsx`

- credit/subscription state is loaded whenever the modal opens, independent of a browser email string;
- `/api/stripe/pdf-credits` is called through `authFetch`;
- `/api/stripe/consume-pdf-credit` is called through `authFetch`;
- PDF-credit Checkout also uses `authFetch`, allowing the server to prefer the verified principal;
- `email` is optional presentation/checkout metadata, not an authorization prerequisite.

The resulting authority chain is:

```text
browser presentation tier
        |
        v
open export modal only
        |
        v
authFetch bearer identity
        |
        v
server getSubscription(identity.userId) / PDF credit ledger
        |
        v
ALLOW -> commit prepared PDF download
DENY  -> fail closed, no download
```

## 7. Negative evidence / abuse matrix

| Abuse case | Baseline result | Candidate result |
|---|---|---|
| Browser forges another user ID on subscription read | DENY | DENY |
| Browser writes `public.subscriptions` | DENY by RLS | DENY by RLS |
| Browser writes `stripe.subscriptions` | DENY | DENY |
| Browser sends `tier=Enterprise` to quota API | DENY | DENY |
| Production Checkout enters local demo mode | DENY | DENY |
| Browser locally projects `Enterprise` and starts compliance PDF | **ALLOW — authority gap** | Modal only; server ledger decides |
| Missing browser email skips PDF server authorization | **ALLOW — authority gap** | DENY / authenticated ledger required |
| New production call site invokes `saveSubscription()` | Not present | CI regression contract denies introduction |

## 8. R2-06 activation

R2-06 is **ACTIVE / REMEDIATION REQUIRED** because R2-00 established a real production-reachable browser-to-paid-capability authority gap.

The PDF bypass is contained by this candidate, but R2-06 must remain open until the broader entitlement inventory is resolved. In particular:

- browser `profile.subscriptionTier` restoration/Stripe-return mutation should be reduced to a server-refreshed presentation projection rather than an independently writable premium-looking state;
- product claims such as Pro-only Realtime AI Newsfeed must be reconciled with actual server enforcement or explicitly reclassified as non-protected/public capability;
- every paid server capability must have a verified-identity + server-subscription/ledger decision point;
- regression coverage must prevent future client-only premium gates from becoming the sole authorization layer.

No claim of global `HARDENED / VERIFIED` is made.

## 9. R2-00 disposition

R2-00 trace work is complete as a finding:

**`CONFIRMED AUTHORITY GAP / REMEDIATION CANDIDATE — PR VERIFY PENDING`.**

Promotion to merged evidence requires:

- exact-head Unit/TypeScript/Build and Governance checks PASS;
- the R2-00 regression test confirms the PDF path cannot commit a download without the authenticated ledger path;
- branch remains correlated with current `main`;
- Human/CODEOWNER merge.

R2-00 does not require a Supabase/Stripe provider mutation. The live provider readback was read-only. R2-06 remains the active remediation control after this trace.