-- CAPITAL-AI-SEC / SEC-WEB-REMEDIATION-02
-- Least-privilege hardening for confirmed SEC-WEB-F02.
--
-- Repository implementation only: this migration MUST NOT be applied to the connected
-- Production Supabase project without the separate protected-external-mutation authority.
-- Function bodies, triggers, business semantics and search_path configuration remain unchanged.

begin;

-- Auth signup trigger. Trigger execution remains intact; ordinary browser roles do not need
-- direct EXECUTE authority on this SECURITY DEFINER function.
revoke all on function public.handle_new_user()
  from public, anon, authenticated;
grant execute on function public.handle_new_user()
  to service_role;

-- Stripe -> public subscription projection trigger. Preserve the established server-owned
-- projection while removing direct browser-role EXECUTE authority.
revoke all on function public.sync_stripe_subscription_to_public()
  from public, anon, authenticated;
grant execute on function public.sync_stripe_subscription_to_public()
  to service_role;

-- rls_auto_enable() exists in the connected provider state but is not represented by a current
-- repository migration. Keep fresh/local database replays deterministic: harden it only when the
-- provider-specific event-trigger function is present instead of making repository migration
-- replay depend on remote-only history.
do $security_definer_acl$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
    execute 'grant execute on function public.rls_auto_enable() to service_role';
  end if;
end
$security_definer_acl$;

commit;
