# CAPITAL-AI-SEC — User Lifecycle Subscription Identity Re-Verification

**Project:** `CAPITAL-AI-SEC`  
**Work item:** `SEC-VERIFY-ULS-001`  
**Project folder:** `docs/projects/security/`  
**Primary productive PVC:** `N/A — cross-cutting Security verification`  
**Affected productive owner:** `CAPITAL-AI-OPS / PVC-08` for provider/runtime evidence and remediation  
**Repository baseline:** `main@d5e2480236e49e178eb24a49ede11c458afd7cd5`  
**Branch:** `agent/security-verify-uls-001-20260907`  
**Date:** `2026-09-07`  
**Re-correlation:** current main after Human-merged PR #800; the delta changes only `docs/projects/operations/ROADMAP.md` and preserves the independent Security verification gate.  
**Verification result:** `PARTIAL / NOT VERIFIED`  
**Authority effect:** none

## 1. Objective and boundary

Independently verify the OPS evidence return for the User Lifecycle subscription-identity invariant without absorbing OPS implementation ownership and without promoting unrelated provider/E2E gaps to PASS.

The bounded invariant under review is:

```text
Stripe subscription metadata.user_id
-> parse as UUID
-> validate against auth.users.id
-> project public.subscriptions.user_id
```

This pass is read-only. It performs no Supabase, Stripe, Auth, billing, IAM, schema, production-data or deployment mutation.

## 2. Authority and ownership correlation

Applied current-main navigation:

1. `/AGENTS.md` v2.8.0 — current repository trust root and Security/Owner boundaries.
2. `docs/projects/README.md` + `docs/projects/PROJECT_VALUE_CHAIN.md` — `CAPITAL-AI-SEC` is cross-cutting and owns no productive PVC; `CAPITAL-AI-OPS` owns `PVC-08` Production Operations.
3. `docs/projects/security/ROADMAP.md` + `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md` — `SEC-VERIFY-ULS-001` is the next Security verification item after Human-merged PR #766 completed `SEC-ASSESS-ALIGN`.
4. `ESS-0006` v1.1.0 — Security owns independent verification; foreign productive remediation stays with the affected Primary Owner.
5. `ADR-0003.5` — Supabase Auth/session identity remains the IAM foundation and client/request e-mail is not an authorization identity.
6. OPS evidence return `docs/projects/operations/evidence/GOV_07_USER_LIFECYCLE_EVIDENCE_RETURN_2026-09-06.md` — input evidence only; `EVIDENCE_READY` does not imply Security `VERIFIED`.
7. Current `docs/projects/operations/ROADMAP.md` v2.6.1 — confirms the GOV-07 OPS owner return is Human-merged and independent Security verification remains an explicit gate.

No historical chat status, stale roadmap baseline or OPS self-classification is used as Security closure authority.

## 3. Reuse / implementation pre-check

No custom implementation is justified in this Security work item.

Reused surfaces:

- current repository migration and server identity/readback code;
- current connected Supabase read-only SQL capability;
- current Supabase Security Advisor;
- existing Security verification lifecycle and evidence directory.

No new library, plugin, runtime, schema, provider integration or Security component is introduced.

## 4. Repository contract verification

### 4.1 Repository migration

`supabase/migrations/20260901162000_user_lifecycle_subscription_identity_authority.sql` implements:

- `NEW.metadata->>'user_id'` as the subscription identity input;
- UUID parsing with fail-closed return on blank/malformed values;
- lookup against `auth.users.id` before any public subscription projection;
- e-mail read only after stable user-ID validation;
- `public.subscriptions.user_id = validated auth.users.id`;
- paid tier projection only for known plan metadata / known price IDs;
- non-`active`/`trialing` provider states projected to `Free`.

**Repository contract:** `PASS`.

### 4.2 Server checkout/readback boundary

Current `server/stripe.ts`:

- ignores client-supplied `userId`;
- uses `resolveVerifiedIdentity(req)` for authenticated checkout identity;
- writes the verified `identity.userId` into Stripe checkout/subscription metadata when an authenticated identity exists;
- reads `/user-subscription` only through the verified bearer identity and `getSubscription(identity.userId)`;
- leaves `metadata.user_id` blank for guest checkout rather than trusting client identity.

The checkout-completed webhook may resolve an e-mail to a user ID for bounded notification/PDF handling, but it does not make that e-mail-derived ID the `stripe.subscriptions -> public.subscriptions` subscription-identity authority.

**Repository server identity boundary:** `PASS` for the bounded authenticated identity/readback contract.

## 5. Connected Supabase independent read-only verification

### 5.1 Deployed function

The connected Production database currently exposes `public.sync_stripe_subscription_to_public()` with:

- `RETURNS trigger`;
- `LANGUAGE plpgsql`;
- `SECURITY DEFINER`;
- owner `postgres`;
- fixed `search_path=public, stripe, auth`;
- the same semantic identity chain as the repository migration: `metadata.user_id -> UUID -> auth.users.id -> public.subscriptions.user_id`.

**Deployed function contract:** `PASS`.

### 5.2 Trigger binding

Current provider readback confirms:

```text
stripe_subscription_sync_trigger
AFTER INSERT OR UPDATE ON stripe.subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_stripe_subscription_to_public()
```

**Trigger binding:** `PASS`.

### 5.3 Migration presence

Current connected migration history contains:

```text
20260905103413  user_lifecycle_subscription_identity_authority
```

**Migration presence:** `PASS`.

### 5.4 RLS / policy boundary

`public.subscriptions` currently has RLS enabled.

Observed policies:

- authenticated `SELECT`: `(select auth.uid()) = user_id`;
- `service_role`: explicit full-access policy.

There is no authenticated/anon DML RLS policy in the observed policy set. Although base table grants are broad, RLS remains the row-authorization boundary and no client DML PASS is inferred without a dedicated runtime negative test.

`anon` and `authenticated` also have no `USAGE` on the `stripe` schema and no `INSERT`/`UPDATE` privilege on `stripe.subscriptions`.

**Observed RLS/policy configuration:** `PASS` for the bounded own-row read boundary; cross-user provider E2E remains `NOT_AVAILABLE`.

### 5.5 Live identity-lineage integrity

A PII-minimized aggregate correlation was executed between:

- `public.subscriptions.user_id`;
- `auth.users.id`;
- `public.subscriptions.stripe_subscription_id`;
- `stripe.subscriptions.id`;
- `stripe.subscriptions.metadata.user_id`.

Observed result:

```text
public subscription rows:                    5
orphaned public user IDs:                    0
public rows without synced Stripe row:       2
Stripe metadata/user mismatches overall:     2
active paid public projections:              3
active paid missing synced Stripe row:       0
active paid metadata/user mismatch:          2
active paid identity-state MATCH:            1
active paid identity-state MISSING_METADATA: 2
non-active paid-tier mismatch:               0
```

The two active paid mismatches are specifically `missing_metadata_user_id`; no different valid UUID was observed in those two rows.

This means the newly deployed trigger contract is correct, but the current live paid dataset does **not** prove that every active paid projection is presently backed by the required `Stripe metadata.user_id -> auth.users.id -> public.subscriptions.user_id` lineage.

**Live identity-lineage result:** `PARTIAL / NOT VERIFIED`.

## 6. Security Advisor observation

The connected Supabase Security Advisor still reports:

```text
auth_leaked_password_protection = WARN / disabled
```

This is a separate defense-in-depth provider configuration finding. It is not changed or accepted by this verification.

## 7. Security disposition

### Verified within the bounded scope

- repository identity migration semantics;
- deployed trigger-function semantics;
- trigger binding to `stripe.subscriptions`;
- remote migration presence;
- own-row authenticated SELECT RLS policy;
- absence of orphaned `public.subscriptions.user_id` values in the current aggregate check.

### Not verified / remains open

- complete live lineage for all active paid subscription projections;
- isolated Supabase Local + Mailpit lifecycle;
- cross-user provider E2E / negative RLS replay;
- Stripe Sandbox/Test Clock lifecycle;
- payment failure/cancellation/renewal/expiry/reactivation;
- provider duplicate/redelivery E2E;
- historical clean migration-baseline replay;
- leaked-password protection enablement/readback.

`EVIDENCE_READY` is therefore **not** promoted to `VERIFIED` or `CLOSED`.

## 8. Owner routing / required return

The live lineage gap is productive provider/runtime evidence and possible remediation work owned by `CAPITAL-AI-OPS / PVC-08`, not by Security.

OPS must determine, without relying on e-mail as entitlement authority, why two active paid projections currently reference synchronized Stripe subscription rows with no `metadata.user_id`, and return reproducible evidence for the resulting state.

Acceptable Security re-verification input must establish one of the following for every active paid projection:

1. the corresponding Stripe subscription contains the same stable `metadata.user_id` as the validated `auth.users.id` and `public.subscriptions.user_id`; or
2. a separately authorized, owner-controlled legacy reconciliation/remediation has produced an equivalent stable-ID lineage with exact provider/data evidence.

Security does not authorize or prescribe a Production data mutation from this document.

## 9. Verification conclusion

`SEC-VERIFY-ULS-001` result:

```text
DEPLOYED CONTRACT: PASS
RLS / OWN-ROW READ CONFIG: PASS
LIVE ACTIVE-PAID IDENTITY LINEAGE: PARTIAL / NOT VERIFIED
OVERALL SECURITY DISPOSITION: PARTIAL / NOT VERIFIED
```

The bounded identity projection cannot be closed until the live lineage gap is resolved and independently re-verified. Unrelated provider E2E gaps remain explicitly open and do not inherit PASS.
