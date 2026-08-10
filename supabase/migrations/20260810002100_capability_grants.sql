-- ESS-0018 Phase 2 / ADR-0051 — Capability/Grant-IAM foundation.
--
-- Grants are additive, explicit, and scoped to a single named capability string (see
-- src/platform/Security/capabilities.ts for the allowlisted constants). There is no wildcard
-- capability and no way to grant "all capabilities" in one row. Issuance/revocation is
-- backend-only (checkCapability()/grantCapability()/revokeCapability() via
-- getPrivilegedServerSupabase()) and gated at the application layer behind OWNER role + fresh
-- TOTP step-up (CLAUDE.md: only a verified human OWNER with fresh step-up may create, change,
-- extend or revoke capabilities) - RLS below only enforces that no other client can touch this
-- table directly, it does not replace the application-layer gate.

create table if not exists public.capability_grants (
  id                  uuid primary key default gen_random_uuid(),
  capability          text not null,
  grantee_user_id     uuid not null,
  granted_by_user_id  uuid not null,
  granted_at          timestamptz not null default now(),
  expires_at          timestamptz,
  revoked_at          timestamptz,
  revoked_by_user_id  uuid,
  reason              text
);

comment on table public.capability_grants is 'ESS-0018 Phase 2: explicit, named agent-capability grants. Service-Role-only, no client access. One row = one (grantee, capability) authorization, never a wildcard.';

create index if not exists idx_capability_grants_lookup
  on public.capability_grants (grantee_user_id, capability)
  where revoked_at is null;

alter table public.capability_grants enable row level security;

drop policy if exists "service_role_full_access" on public.capability_grants;
create policy "service_role_full_access" on public.capability_grants
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
