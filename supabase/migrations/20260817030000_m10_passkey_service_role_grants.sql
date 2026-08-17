-- M10 (ADR-0066, ESS-0022) Phase 3 — service_role table privileges for the M10 passkey tables.
--
-- Context: 20260817020000 created m10_registration_challenges and m10_owner_credentials with RLS
-- enabled and a service_role-only policy, but granted no table-level privilege to service_role.
-- This project does not carry Supabase's default service_role grants (ADR-0043,
-- 20260804200909_issue_92_service_role_dml_grants.sql) - table privileges are checked before RLS,
-- so enabling RLS does not substitute for a grant. The same gap was previously found and fixed for
-- the SEO engine tables (20260815210000_seo_engine_service_role_grants.sql). Real production
-- symptom: Owner passkey enrollment failed with "permission denied for table
-- m10_registration_challenges" on INSERT.
--
-- Least privilege: only the operations server/m10/credentialEnrollmentSupabaseStore.ts actually
-- performs (insert/select/update; no delete, no truncate, on either table).

begin;

revoke all on table public.m10_registration_challenges from service_role;
grant select, insert, update on table public.m10_registration_challenges to service_role;

revoke all on table public.m10_owner_credentials from service_role;
grant select, insert, update on table public.m10_owner_credentials to service_role;

commit;
