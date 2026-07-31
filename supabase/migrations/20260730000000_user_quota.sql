-- AIF-CORE: Server-side quota enforcement table
-- Backs server/quota.ts (ADR-0017). Run this against the Supabase project
-- used by both staging and production before deploying the 0.5.0 build.

create table if not exists public.user_quota (
  email        text not null,
  quota_kind   text not null check (quota_kind in ('screening', 'monte_carlo', 'full_ai_analysis')),
  window_start timestamptz not null default now(),
  count        integer not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (email, quota_kind)
);

create index if not exists idx_user_quota_email on public.user_quota (email);

-- Keep updated_at fresh on every write (useful for support/debug queries)
create or replace function public.touch_user_quota_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_user_quota on public.user_quota;
create trigger trg_touch_user_quota
before update on public.user_quota
for each row execute function public.touch_user_quota_updated_at();

-- RLS: only the service role (used server-side via SUPABASE_SERVICE_ROLE_KEY)
-- may read/write this table. No anon/public access. Quota must never be
-- readable or writable directly from the browser.
alter table public.user_quota enable row level security;

drop policy if exists "service_role_full_access" on public.user_quota;
create policy "service_role_full_access" on public.user_quota
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
