# GOV-07 Frontend User-Lifecycle Projection Evidence — 2026-09-07

**Handoff:** `GOV07-FE-ULS-PROJECTION-001`  
**Project:** `CAPITAL-AI-FE`  
**Project folder:** `docs/projects/frontend/`  
**Primary productive PVC:** `N/A` — cross-cutting Frontend presentation project  
**Primary Owner:** `CAPITAL-AI-FE`  
**Branch:** `agent/frontend-uls-projection-20260907`  
**Initial current-main baseline:** `eee9a8af3f3d2532a213154dd61f678454a2200b`  
**Authority effect:** none

## Objective

Implement the bounded Frontend presentation portion of `GOV-CHAT-041` without creating browser-local authentication, entitlement, billing or Governance authority. The UI consumes existing Auth, Billing, Subscription and Stripe server contracts and preserves fail-closed states.

## Implemented Frontend scope

### FE-ULS-01 — authentication UX

Existing current-main authentication implementation remains the authority consumer:

- `/login` uses Supabase password login, registration and Google OAuth;
- `SessionComposition` retains onboarding/AAL gates;
- normal logout remains explicit Supabase `local` scope;
- global logout remains a distinct explicit `global` action with the existing residual JWT-lifetime disclosure.

No new authentication authority was introduced in this branch.

### FE-ULS-02 — pricing projection

Productive subscription UI is moved into `src/features/billing/ui` and projects prices from `src/features/billing/billingContract.ts` (`SUBSCRIPTION_PRICES_EUR`). It no longer derives yearly prices with a local discount multiplier.

The current catalog projection therefore includes the Owner-decided annual Pro price of `248 EUR`. Enterprise yearly price may be displayed as catalog information, but its entitlement contract remains `on_request` and the UI does not expose yearly Enterprise self-service checkout.

### FE-ULS-03 — entitlement projection

Capability descriptions are projected from `src/config/subscriptionEntitlements.ts` (`SUBSCRIPTION_ENTITLEMENTS`). They are display values only. The UI explicitly states that protected capability authorization remains server-side.

Browser state is not used to grant paid capabilities. Existing target-specific server authorization remains outside this Frontend slice.

### FE-ULS-04 — checkout synchronization

`src/features/billing/ui/Checkout.tsx`:

- uses `authFetch('/api/stripe/create-checkout-session', ...)`;
- does not send client `userId` as entitlement identity;
- redirects back with `checkout=pending`, not `payment=success`;
- never invokes a local tier-success callback to activate a paid tier;
- shows Stripe/checkout failures rather than synthesizing success.

`src/features/billing/ui/Abonnements.tsx`:

- performs authenticated `/api/stripe/user-subscription` readback through the existing helper;
- represents `loading`, `synchronized` and `failed` states explicitly;
- updates the presented tier only when the authoritative readback differs from the last verified projection;
- keeps checkout return state pending until server confirmation.

### FE-ULS-05 — portal and cancellation

The canonical subscription surface exposes **Abrechnung / Kündigung verwalten** for non-Free tiers. Portal-session creation uses `authFetch('/api/stripe/create-portal-session', ...)` and sends only a return URL. Provider/backend authority remains responsible for the actual subscription mutation and cancellation timing.

A pre-existing secondary ProfilePage portal consumer still uses its legacy request implementation. The canonical billing surface now provides the supported discoverable path; ProfilePage consolidation remains a bounded follow-up rather than being hidden in this migration.

### FE-ULS-06 — accessibility and responsive behavior

The new billing/checkout surfaces include:

- semantic `role="dialog"` + `aria-modal="true"` for modal surfaces;
- initial focus on the close action;
- Escape close behavior;
- focus restoration to the previously focused element;
- visible `focus-visible` rings;
- 44px-equivalent `min-h-11` interactive controls;
- textual status/error messaging in addition to color;
- responsive one-column-to-three-column plan layout;
- horizontally scrollable comparison table rather than clipped mobile content.

## Architecture evidence

Productive implementations:

- `src/features/billing/ui/Abonnements.tsx`
- `src/features/billing/ui/Checkout.tsx`
- `src/features/billing/ui/SubscriptionModal.tsx`

Compatibility-only paths:

- `src/components/Abonnements.tsx`
- `src/components/Checkout.tsx`
- `src/components/SubscriptionModal.tsx`

Feature facade:

- `src/features/billing/ui/index.ts`

This preserves `src/app -> src/features -> src/shared` direction and does not add a new productive implementation under the legacy component zone.

## Regression evidence

Added static contract regression:

`tests/unit/userLifecycleFrontendProjection.test.ts`

The test guards:

- productive billing implementation location;
- canonical pricing and entitlement imports;
- no local annual discount calculation;
- no URL-return entitlement grant;
- bearer-authenticated checkout/portal calls;
- existing login/OAuth/local/global logout semantics;
- dialog/focus/Escape/44px/responsive state semantics.

## Validation disposition

| Check | Result | Evidence |
|---|---|---|
| Current main / trust root / project mapping / Roadmap / architecture / inventory precheck | `PASS` | repository correlation in executing chat |
| Open PR correlation at branch creation | `PASS` | zero open PRs observed |
| Existing `frontend-*` branch correlation | `PASS_WITH_SCOPE_BOUNDARY` | roadmap-only branch observed; this slice does not edit `docs/frontend/FRONTEND_ROADMAP.md` |
| OPS User-Lifecycle contract correlation | `PASS` | stable identity/readback/checkout/logout/cancellation contract consumed |
| Source-tree architecture review | `PASS` by repository inspection | productive billing code under `src/features/billing/ui`; legacy paths compatibility-only |
| Regression test authored | `PASS` for presence/inspection | `tests/unit/userLifecycleFrontendProjection.test.ts` |
| Vitest execution | `NOT_RUN` | connected remote execution device is offline in this execution surface |
| TypeScript check | `NOT_RUN` | connected remote execution device is offline in this execution surface |
| Frontend architecture check | `NOT_RUN` | connected remote execution device is offline in this execution surface |
| Production build | `NOT_RUN` | connected remote execution device is offline in this execution surface |
| Browser keyboard/focus/mobile E2E | `NOT_RUN` | no attached browser/device execution surface |
| Stripe/Supabase provider E2E | `NOT_RUN / FOREIGN_ASSURANCE_REMAINS` | no provider mutation or E2E executed by FE |

No unexecuted check is represented as PASS.

## Open findings / boundaries

1. The legacy `src/components/Dashboard.tsx` still contains the historical `payment=success&plan=...` fallback. The new canonical checkout no longer emits that marker, so this branch does not use the fallback; removal should be bounded to the Dashboard/BB-2 owner wave rather than expanded here.
2. `src/components/ProfilePage.tsx` retains a secondary legacy billing-portal request path. The canonical subscription page now exposes the supported bearer-authenticated portal path; ProfilePage consolidation remains follow-up work.
3. Full provider lifecycle E2E and independent Security/Compliance verification remain external dependencies and are not self-closed by Frontend evidence.
4. `docs/frontend/COMPONENT_INVENTORY.md` predates current BB-2/recovery work and this physical billing migration; a dedicated inventory re-correlation remains appropriate rather than silently rewriting the stale inventory inside this bounded GOV-07 slice.

## Exit-gate assessment

- Lifecycle/auth presentation: `IMPLEMENTED / EXISTING CONTRACT CONSUMED`.
- Pricing projection: `IMPLEMENTED` from canonical billing contract.
- Entitlement projection: `IMPLEMENTED / PRESENTATION_ONLY`.
- Checkout synchronization states: `IMPLEMENTED / SERVER_READBACK_BOUND`.
- Portal/cancellation access: `IMPLEMENTED` on canonical billing surface.
- Accessibility/responsive semantics: `IMPLEMENTED BY SOURCE INSPECTION`; runtime E2E remains `NOT_RUN`.
- Local authorization/entitlement authority introduced: `NO`.

The branch is implementation-complete for the bounded FE-owned repository slice, subject to executable validation and final current-main/open-writer correlation before any PR-creation approval request.
