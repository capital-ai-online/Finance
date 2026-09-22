# Auth E-Mail & Billing Provider Correlation — 2026-09-22

**Baseline:** `main@4c4a88e7f83150191c81134439e7bc9a1145ad4a`  
**Supabase project:** `ryzywoktpmyhwzxmstyu`  
**Mutation state:** READ-ONLY PROVIDER CORRELATION; no production DDL/data mutation

## Confirmed live state

- `auth.users.on_auth_user_created -> public.handle_new_user()`.
- New Auth UUIDs receive `public.profiles` + `public.subscriptions(Free)`.
- `stripe.subscriptions.stripe_subscription_sync_trigger` is active after INSERT/UPDATE.
- `public.sync_stripe_subscription_to_public()` reads `metadata.user_id`, validates it as an
  `auth.users.id` UUID, derives only known paid tiers and upserts `public.subscriptions`.
- `public.subscriptions` is RLS-enabled and users have own-row SELECT only.
- `stripe.*` provider tables expose the required subscription/customer/items/price/product
  columns for the current Sync Engine.
- Live counts at readback: 3 Stripe customers, 3 Stripe subscriptions, 3 Stripe subscription
  items, 5 canonical public subscription rows, 2 legacy public user rows.

## Observed legacy drift

`sven.kulessa@gmx.net` has a current Auth identity and canonical Free subscription but a historical
`public.users` Pro row whose old Stripe subscription ID is no longer represented by current
`stripe.subscriptions`. Repository search found no productive entitlement reader of these
`public.users.tier/stripe_*` fields.

Conclusion: the legacy row must not be used to infer current billing. No destructive cleanup is
performed in this slice because `public.usage_log.user_id` still references `public.users.id`.

## Mail/provider boundary

Supabase current documentation requires token-hash email links for a robust server-side
confirmation/recovery flow. The connected MCP can inspect DB/Auth data but cannot mutate hosted
Auth SMTP/template configuration. Final provider PASS therefore requires readback or owner action
in Supabase Auth settings after the repository contract is merged.
