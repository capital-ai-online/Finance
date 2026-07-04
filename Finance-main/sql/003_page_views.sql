-- Real, minimal page-view counter for the Beta-phase visitor widget.
-- No personal data, no cookies required — counts a page load event with
-- just a date bucket and a coarse anonymous session marker (so a single
-- visitor refreshing repeatedly doesn't inflate the number within the
-- same day). This is intentionally simple: for serious analytics
-- (unique visitors over time, funnels, geography), use Plausible/Umami
-- instead — see Live_prio.md.

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  day date not null default current_date,
  anon_session_id text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists page_views_day_session_idx
  on public.page_views (day, anon_session_id);

-- Query used by GET /api/visitor-count
-- select count(*) from public.page_views where day = current_date;
