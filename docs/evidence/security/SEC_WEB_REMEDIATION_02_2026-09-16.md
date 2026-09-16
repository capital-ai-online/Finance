# SEC-WEB-REMEDIATION-02 — Supabase SECURITY DEFINER Least Privilege

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Role:** bounded Security remediation + separate verification preparation  
**Main baseline:** `47a245be78b60494c0f57518f742bbb7923b70fa`  
**Branch:** `agent/security-supabase-definer-least-privilege-20260916`  
**Authority:** `/AGENTS.md@current-main`, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `CTRL-SEC-BOUNDED-REMEDIATION-001`, `ESS-0006 v1.2.0`  
**Finding:** `SEC-WEB-F02`  
**Implementation state:** `EVIDENCE_READY`  
**Verification state:** `NOT_VERIFIED` — implementation evidence is not independent verification

## Confirmed finding

Read-only connected Supabase evidence for project `AIFINANCIAL` showed direct `EXECUTE` privilege for `PUBLIC`/`anon`/`authenticated` on these `SECURITY DEFINER` trigger surfaces:

- `public.handle_new_user()`;
- `public.sync_stripe_subscription_to_public()`;
- `public.rls_auto_enable()`.

The finding is least-privilege overexposure. A direct remote exploit through these trigger/event-trigger return types was not proven and is not claimed by this remediation.

## Repository correlation

Current main already uses the canonical least-privilege pattern for privileged database functions: broad function execution is revoked from `PUBLIC`, `anon` and `authenticated`, then `EXECUTE` is granted only to the required privileged role. This package reuses that pattern and creates no second authorization architecture.

Current repository sources define:

- `public.handle_new_user()` in `supabase/migrations/20260731000100_harden_handle_new_user_search_path.sql`;
- `public.sync_stripe_subscription_to_public()` in `supabase/migrations/20260901162000_user_lifecycle_subscription_identity_authority.sql`.

`public.rls_auto_enable()` is present in the connected provider state but has no defining migration on current main. The remediation therefore treats it as provider-only history and conditionally hardens it via `to_regprocedure(...)`, so clean/local migration replay does not fail when that remote-only function is absent.

## Minimal remediation

`supabase/migrations/20260916160000_security_definer_least_privilege.sql` performs only function ACL changes:

1. `REVOKE ALL` from `PUBLIC`, `anon`, `authenticated` for `handle_new_user()`;
2. explicit `GRANT EXECUTE` to `service_role`;
3. the same ACL boundary for `sync_stripe_subscription_to_public()`;
4. the same boundary for `rls_auto_enable()` only when that provider-only function exists.

The migration does **not** redefine function bodies, replace triggers, change `search_path`, mutate business data, alter tables or introduce new runtime/authority components.

## Positive and negative repository tests

`tests/unit/securitySupabaseDefinerLeastPrivilege.test.ts` binds the intended invariant:

- negative: ordinary browser roles retain no direct execute privilege in the migration;
- positive: `service_role` keeps explicit execute authority;
- compatibility: provider-only `rls_auto_enable()` is optional during clean migration replay;
- semantics: canonical trigger function definitions remain present in their existing source migrations;
- scope: no function/trigger redefinition, table alteration or business DML is introduced;
- authority: the migration text itself records that connected Production application is separately gated.

Pre-PR executable test status at materialization time: `NOT RUN`. GitHub connector repository writes are evidence of source materialization, not proof that Vitest, TypeScript, migration replay or hosted CI passed.

## Protected external mutation boundary

**No connected Supabase schema mutation was performed.** Applying the new migration to Production is a protected external database mutation and requires its own applicable Human/Owner/OPS execution authority after repository integration. The connected provider remains in its pre-remediation state until that separately authorized step occurs.

Consequently:

- repository implementation may reach `EVIDENCE_READY`;
- provider finding `SEC-WEB-F02` is not `VERIFIED`/`CLOSED` merely because this branch exists;
- post-application provider readback must independently confirm that ordinary roles lost direct execute privilege and legitimate trigger behavior still operates.

## Adjacent findings intentionally not absorbed

### SEC-WEB-F01 — leaked-password protection

Remains `OWNER-ACCEPTED / TIER EXCEPTION` under the current Security Roadmap. This branch does not enable a paid/provider feature, alter Auth configuration or create a new subscription/license.

### SEC-WEB-F03 — `/api/docs-file`

Remains routed to `CAPITAL-AI-DOC / PVC-03 — Documentary Engine`. Production currently has a separate runtime immutability guard; retirement or business/Documentary behavior changes are outside this Security ACL slice.

## Verification handoff — SEC-WEB-VERIFICATION-03

Verification must bind to the exact final branch/PR head and independently check:

1. focused positive/negative least-privilege tests;
2. TypeScript / repository checks selected by the current PR-classifier;
3. `npm run supplychain:verify` when selected/applicable;
4. container heavy-path checks only if the final diff becomes container/dependency relevant;
5. passive Production/source-identity correlation only — no active production attack and no Production Supabase mutation;
6. `EVIDENCE_READY != VERIFIED` throughout the lifecycle.

Until those exact-head checks and any separately authorized provider application/readback exist, the final finding state remains **REMEDIATED_IN_REPOSITORY / PROVIDER_NOT_APPLIED / NOT_VERIFIED**.
