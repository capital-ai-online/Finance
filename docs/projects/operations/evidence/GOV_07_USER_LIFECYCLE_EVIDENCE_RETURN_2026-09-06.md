# CAPITAL-AI-OPS — GOV-07 User-Lifecycle Evidence Return

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Secondary OPS stages:** `PVC-08`, `PVC-18`  
**Correlation baseline:** `main@6a4a34f1b849763cce0f80b394817d3d83bdf24d`  
**Date:** `2026-09-06`  
**Return status:** `EVIDENCE_READY`  
**GOV-07 interpretation:** `PARTIAL / OWNER RETURNS PENDING` remains valid; this document supplies the refreshed OPS-owned return only.  
**Authority effect:** none

## 1. Objective and boundary

Refresh the OPS-owned User-Lifecycle evidence required for Governance `GOV-07` without creating a second lifecycle, Auth, Billing, Entitlement, Governance, Security, Release or provider authority.

This return reuses the already merged User-Lifecycle harness, identity correlation, Stripe server boundary, authenticated subscription readback, repository migration and provider-contract tests. No foreign-project mutation and no Production/provider mutation is performed.

## 2. Trust / authority correlation

Applied current-main sequence:

1. `/AGENTS.md` — repository trust root and lifecycle/owner boundary.
2. `docs/projects/PROJECT_VALUE_CHAIN.md` — `CAPITAL-AI-OPS` owns `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`.
3. `docs/projects/operations/ROADMAP.md` — User Lifecycle closeout is terminal for repository/read-only-provider scope; provider E2E and independent Security verification remain explicit open gates.
4. `ADR-0003.5` — `ACCEPTED`; Supabase Auth/session identity remains the IAM foundation and client/request e-mail is not an authorization identity.
5. `ADR-0045` — `Accepted`; Stripe provider event ownership/durable inbox remains the webhook replay/idempotency contract.
6. `ESS-0018` — `published`; Supabase agent/provider access remains least-privilege and protected mutations are not implied by read-only correlation.

No lower-precedence roadmap or evidence item is used to override these authorities.

## 3. Writer / overlap preflight

- Open Pull Requests against `main`: **none** at initial correlation.
- Historical User-Lifecycle closeout claim: `released`; PR #729 is merged/terminal.
- `CAPITAL-AI-OPS-ROADMAP-DR03-RECORRELATION-2026-09-05` is still marked `active/exclusive` in metadata, but its associated PR #747 is already Human-merged and its branch no longer exists. It is therefore stale coordination metadata, not a live parallel writer, and is terminalized in this bounded branch before Roadmap mutation.
- No foreign-project changed-file scope is modified.

## 4. Correlated code paths

| Path | Current finding | Disposition |
|---|---|---|
| `scripts/operations/userLifecycleHarness.ts` | Existing harness distinguishes `PASS`, `FAIL`, `NOT_AVAILABLE`; Supabase Local/Mailpit and Stripe Test Clock only run with real provider inputs; live Stripe keys are rejected for sandbox verification. | REUSE |
| `scripts/operations/authLifecycleCorrelation.ts` | Existing repository correlation separates findings by project owner and does not convert foreign findings into OPS implementation authority. | REUSE |
| `server/stripe.ts` | `/api/stripe/user-subscription` resolves `resolveVerifiedIdentity(req)` and calls `getSubscription(identity.userId)`; client-supplied query identity is not accepted. Checkout ignores client `userId`; authenticated identity has precedence. | PASS — server identity boundary |
| `src/lib/subscriptionReadback.ts` | Calls only `authFetch('/api/stripe/user-subscription')`; no `email` or `userId` query parameter; returned tier is validated against the canonical tier set. | PASS — presentation/readback only |
| `supabase/migrations/20260901162000_user_lifecycle_subscription_identity_authority.sql` | Reads `NEW.metadata->>'user_id'`, parses UUID, validates against `auth.users.id`, reads e-mail only after UUID validation and upserts `public.subscriptions` by `user_id`. | PASS — repository identity invariant |
| `tests/provider/userLifecycleProviderContract.test.ts` | Provider test contract preserves `NOT_AVAILABLE` when real Supabase Local/Mailpit or Stripe test-mode inputs are absent; strict mode requires all provider scenarios to PASS. | PASS — truthful test contract |

## 5. Identity authority result

Required invariant:

```text
Stripe subscription metadata.user_id
→ parse as UUID
→ validate against auth.users.id
→ project public.subscriptions.user_id
```

Current connected Supabase read-only evidence confirms the deployed `public.sync_stripe_subscription_to_public()` still implements that exact chain.

The connected migration history also contains:

```text
20260905103413  user_lifecycle_subscription_identity_authority
```

`public.subscriptions` currently has RLS enabled. The authenticated SELECT policy is scoped to:

```text
(select auth.uid()) = user_id
```

with a separate explicit `service_role` full-access policy.

### Authority exclusions

The following are **not** entitlement/identity authority:

- client-provided `userId`;
- client/request e-mail address;
- browser `localStorage`, including cached session/UI projection;
- client-projected `subscriptionTier`;
- checkout redirect/query state.

The authoritative readback chain remains:

```text
Bearer token
→ verified Supabase identity
→ identity.userId
→ server-side subscription lookup
→ validated tier projection
```

E-mail may remain contact/display/customer data and an operational lookup input on explicitly bounded non-entitlement paths, but it does not select the subject of the paid subscription projection.

## 6. Provider evidence classification

| Evidence surface | Classification | Evidence / reason |
|---|---|---|
| Connected Supabase deployed subscription projection function | `PASS` | Fresh read-only function definition matches `metadata.user_id -> auth.users.id -> public.subscriptions.user_id`. |
| Connected Supabase `public.subscriptions` RLS configuration | `PASS` | RLS enabled; authenticated SELECT is own-row by `auth.uid() = user_id`. |
| Connected Supabase migration presence | `PASS` | `user_lifecycle_subscription_identity_authority` present as remote version `20260905103413`. |
| Supabase Local registration/session/local+global logout/Mailpit lifecycle | `NOT_AVAILABLE` | No isolated Supabase Local + Mailpit execution host/provider credentials were available in this ChatGPT repository/provider execution surface. Hosted Production state is not substituted for isolated provider E2E. |
| Supabase Local own-row/cross-user RLS mutation replay | `NOT_AVAILABLE` | No isolated reproducible local application schema/provider fixture was executed. The historical migration-baseline replay gap remains separate. |
| Stripe annual Pro Test Clock lifecycle | `NOT_AVAILABLE` | No explicit `sk_test_` fixture set plus sandbox-mutation opt-in was executed; Production/live mutation is prohibited by this work item. |
| Stripe payment failure / cancellation / renewal / expiry / reactivation | `NOT_AVAILABLE` | Same verified Stripe sandbox/Test Clock gate. |
| Stripe provider duplicate/redelivery E2E | `NOT_AVAILABLE` | Repository durable-inbox contract exists, but no new real provider redelivery was executed for this exact branch state. Historical evidence is not relabeled as current provider PASS. |
| Repository webhook/readback/identity contracts | `PASS` | Current-main source correlation confirms the existing server-owned identity and fail-closed provider-test vocabulary. This is repository evidence, not provider E2E. |

`NOT_AVAILABLE` is never promoted to `PASS`.

## 7. Security / provider observation

The current Supabase Security Advisor still reports:

```text
auth_leaked_password_protection = WARN / disabled
```

This is recorded as a residual provider-configuration finding only. Enabling it is a protected provider/Auth configuration mutation and is not authorized by this evidence-return work item.

No Security finding is marked `VERIFIED` or `CLOSED` by OPS. Independent verification remains `CAPITAL-AI-SEC` owned.

## 8. Tests executed

### Executed in this pass

- Read-only connected Supabase function-definition correlation — `PASS`.
- Read-only connected Supabase RLS/policy correlation — `PASS`.
- Read-only connected Supabase migration-history correlation — `PASS`.
- Supabase Security Advisor read — `PASS` as evidence retrieval; one WARN remains.
- Current-main repository source/test inspection for the bounded code paths — completed.

### Not run

- `tests/provider/userLifecycleProviderContract.test.ts` — `NOT_RUN` locally because this execution surface has no repository checkout/runtime test host.
- Supabase Local + Mailpit provider E2E — `NOT_AVAILABLE`.
- Stripe sandbox/Test Clock provider E2E — `NOT_AVAILABLE`.
- Hosted GitHub CI — `NOT_RUN` pre-PR; current trust-root cost-control keeps hosted checks after PR creation.

No `NOT_RUN` or `NOT_AVAILABLE` item is represented as PASS.

## 9. Residual gaps and owner boundaries

### OPS-owned residuals

1. Isolated, reproducible Supabase Local/Mailpit provider E2E remains unexecuted.
2. Stripe sandbox/Test Clock provider E2E remains unexecuted.
3. Historical Supabase migration-baseline replay remains insufficiently proven for a clean local full-schema reset.
4. The stale terminal DR-03 coordination claim requires metadata release so it no longer appears as an active Roadmap writer.

No new OPS runtime/code defect requiring custom implementation was identified in the bounded identity/readback paths.

### Foreign-owner dependencies

- `CAPITAL-AI-SEC`: independent User-Lifecycle/security re-verification and closure authority.
- `CAPITAL-AI-FE`: broader lifecycle/pricing/entitlement UX return required by GOV-07.
- `CAPITAL-AI-COMP` / Human-Legal: applicable independent compliance/legal evidence and decisions.
- `CAPITAL-AI-GOV / PVC-05`: final GOV-07 governance re-evaluation/closeout decision after owner returns.
- Product/shared pricing authority owners: Annual Pro preview drift remains outside this OPS evidence-return mutation scope.

## 10. Exit gate

**OPS return:** `EVIDENCE_READY`.

The OPS-owned stable-user-ID identity/readback evidence is refreshed against current main and current connected Supabase read-only state. There is no justified new OPS-owned runtime implementation in the bounded path.

**GOV-07 overall:** remains `PARTIAL / OWNER RETURNS PENDING` because isolated provider E2E, independent Security verification and foreign-owner returns are still not complete.
