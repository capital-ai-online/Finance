-- ADR-0034 — central subscription entitlements.
-- Repository migration only. Apply through the controlled production Supabase handoff
-- before enabling the Warren-Buffett quota endpoint in production.

alter table public.user_quota
  drop constraint if exists user_quota_quota_kind_check;

alter table public.user_quota
  add constraint user_quota_quota_kind_check
  check (quota_kind in (
    'screening',
    'monte_carlo',
    'full_ai_analysis',
    'buffett_value_check'
  ));

-- Atomic quota consumption. The caller is the backend service-role path; no browser
-- access is granted. SECURITY INVOKER deliberately preserves the table's RLS/grants.
create or replace function public.consume_user_quota(
  p_email text,
  p_quota_kind text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  current_count integer,
  remaining integer,
  window_start timestamptz,
  next_eligible_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.user_quota%rowtype;
begin
  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'Invalid quota configuration';
  end if;

  -- Serialize the same identity/quota-kind pair without requiring a second table.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(pg_catalog.lower(pg_catalog.trim(p_email)) || ':' || p_quota_kind)
  );

  select *
    into v_row
    from public.user_quota
   where email = pg_catalog.lower(pg_catalog.trim(p_email))
     and quota_kind = p_quota_kind
   for update;

  if not found or v_row.window_start + pg_catalog.make_interval(secs => p_window_seconds) <= v_now then
    insert into public.user_quota (email, quota_kind, window_start, count)
    values (pg_catalog.lower(pg_catalog.trim(p_email)), p_quota_kind, v_now, 1)
    on conflict (email, quota_kind)
    do update set window_start = excluded.window_start, count = 1
    returning * into v_row;

    return query
      select true, 1, pg_catalog.greatest(p_limit - 1, 0), v_row.window_start,
             v_row.window_start + pg_catalog.make_interval(secs => p_window_seconds);
    return;
  end if;

  if v_row.count >= p_limit then
    return query
      select false, v_row.count, 0, v_row.window_start,
             v_row.window_start + pg_catalog.make_interval(secs => p_window_seconds);
    return;
  end if;

  update public.user_quota
     set count = count + 1
   where email = v_row.email
     and quota_kind = v_row.quota_kind
   returning * into v_row;

  return query
    select true, v_row.count, pg_catalog.greatest(p_limit - v_row.count, 0), v_row.window_start,
           v_row.window_start + pg_catalog.make_interval(secs => p_window_seconds);
end;
$$;
