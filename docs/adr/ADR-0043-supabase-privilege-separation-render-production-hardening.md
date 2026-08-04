# ADR-0043 — Supabase Privilege Separation & Render Production Hardening

- **Status:** Accepted / Implementation in progress
- **Date:** 2026-08-04
- **Scope:** Production security, Supabase access model, billing/IAM persistence, Render deployment governance
- **Related:** ADR-0003.5, ADR-0008, ADR-0036, ADR-0040, Issue #92

## Context

Issue #92 identified two production-hardening gaps:

1. `server/db.ts` selected one generic Supabase client from a credential fallback chain that mixed elevated `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` credentials with low-privilege publishable/anon credentials. This made server authorization and persistence semantics dependent on environment configuration.
2. The live Render `Finance` service did not match the repository `render.yaml` contract for deployment gating and the platform health check.

The security review also found legacy RLS policy patterns that targeted `PUBLIC` and then tested `auth.role() = 'service_role'`, a hard-coded owner e-mail in the `security_events` read policy, missing explicit client-deny policy on `screening_slo_evidence`, and unpinned actions in the general CI workflow.

## Decision

### 1. Explicit Supabase client classes

The backend SHALL expose two distinct access contracts:

- **Privileged server client:** created only from `SUPABASE_SECRET_KEY` or legacy `SUPABASE_SERVICE_ROLE_KEY`; backend-only; elevated access; no publishable/anon fallback.
- **RLS-bound server client:** created only from publishable/anon credentials; intended for low-privilege/RLS semantics; no elevated-key fallback.

`getServerSupabase()` remains temporarily as a deprecated compatibility alias to the privileged client so existing IAM, billing, audit, quota and evidence call sites can be migrated without an unsafe all-at-once refactor. Its behavior is now unambiguously privileged.

### 2. Production persistence fails closed

Production subscription state SHALL NOT silently fall back to mutable container-local files.

- Privileged writes fail when privileged Supabase credentials are unavailable.
- Production subscription reads that cannot obtain authoritative database state fall back to the least-privileged `Free` tier, never a locally cached paid tier.
- Local subscription persistence remains development-only for compatibility.

### 3. RLS policy hardening

Service-only policies SHALL target `TO service_role` explicitly rather than granting a policy to `PUBLIC` and evaluating `auth.role()` per row.

Authenticated ownership policies SHALL use `(select auth.uid())` where semantically valid.

`security_events` owner visibility SHALL be determined by server-managed IAM state (`profiles.iam_role = 'owner'`) plus the existing `phone_verified` assurance gate. Authorization SHALL NOT depend on a hard-coded e-mail address.

`screening_slo_evidence` SHALL remain server-only and SHALL have an explicit restrictive deny policy for `anon` and `authenticated`, plus revoked direct table privileges for those roles.

### 4. Supply-chain and configuration governance

General CI actions SHALL be pinned to immutable commit SHAs, use read-only repository permissions, and avoid persisted checkout credentials.

A production configuration guard SHALL verify the repository invariants for:

- `autoDeployTrigger: checksPass`
- `healthCheckPath: /healthz`
- dedicated privileged Supabase secret declaration
- no publishable/anon fallback in privileged server access
- no production-local subscription authority
- pinned CI actions

`server/db.ts`, `render.yaml`, Supabase migrations, ADR-0043, and the relevant security tests SHALL be CODEOWNER-protected.

### 5. Render source-of-truth contract

`render.yaml` is the normative repository declaration for the `Finance` production service. The intended live state is:

- branch: `main`
- runtime: Docker
- auto deploy trigger: checks pass
- health check path: `/healthz`

If the Render management surface cannot mutate these service fields programmatically, the drift remains a production handoff item and Issue #92 must not be considered fully closed until live Render evidence matches the contract.

### 6. Supabase Auth leaked-password protection

Supabase Security Advisor findings are release evidence. Leaked-password protection SHOULD be enabled for password authentication. If the connected management API does not expose this Auth setting, it is an explicit dashboard handoff rather than a reason to bypass or suppress the advisor.

## Consequences

### Positive

- Privileged database operations can no longer silently downgrade to an RLS-bound key.
- Production billing state cannot be promoted from stale/mutable local container state.
- RLS intent is role-explicit and easier to review.
- Owner audit authorization no longer relies on an identity literal in SQL.
- CI supply-chain risk from mutable action tags is reduced.
- Repository drift for the Render/Supabase contract becomes fail-closed in CI.

### Trade-offs

- Missing privileged Supabase credentials can now surface as production errors for privileged writes instead of silently persisting locally. This is intentional.
- Existing `getServerSupabase()` call sites still need gradual naming migration to `getPrivilegedServerSupabase()` for maximum code readability; security behavior is already enforced by the compatibility alias.
- Render live configuration and some Supabase Auth settings may require control-plane capabilities not exposed by the active connector.

## Validation & Evidence

Required evidence before closing Issue #92:

1. Unit test proves publishable/anon credentials are never accepted as privileged configuration.
2. Unit test proves production subscription persistence fails closed without a privileged credential.
3. Supabase migration applies successfully.
4. Supabase Security Advisor no longer reports the `screening_slo_evidence` no-policy finding.
5. Supabase performance advisor no longer reports the remediated application RLS init-plan and public security FK findings.
6. GitHub CI, unit tests, lint, production build and predeploy checks pass.
7. Render deploy reaches `live` and `/healthz` remains operational.
8. Live Render service metadata is reconciled to `checksPass` and `/healthz`, or the unavailable control-plane mutation is explicitly recorded as the only remaining handoff.
9. Supabase leaked-password protection is enabled, or the unavailable Auth control-plane mutation is explicitly recorded as the only remaining Supabase handoff.

## Rollback

- Reverting application code must not restore publishable/anon fallback for privileged operations.
- Database policy rollback requires an IAM/security review because broadening policies back to `PUBLIC` is a security regression.
- Render rollback may restore a prior application deploy, but must not weaken the declared health-check or checks-gated deployment contract.
