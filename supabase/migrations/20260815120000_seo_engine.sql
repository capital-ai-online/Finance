-- SEO-ROADMAP-0001 / S1 — SeoEngine persistence (draft; apply after security review).
-- Rank positions only from Search Console or manual import — never synthetic generators.

create table if not exists public.seo_keywords (
  id text primary key,
  phrase text not null,
  locale text not null check (locale in ('de', 'en')),
  intent text not null check (intent in ('informational', 'commercial', 'navigational', 'transactional')),
  target_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists seo_keywords_phrase_locale_uidx
  on public.seo_keywords (lower(phrase), locale);

create table if not exists public.seo_rank_snapshots (
  id text primary key,
  keyword_id text not null references public.seo_keywords (id) on delete cascade,
  position integer check (position is null or (position >= 1 and position <= 1000)),
  source text not null check (source in ('search-console', 'manual-import')),
  captured_at timestamptz not null default now(),
  source_ref text
);

create index if not exists seo_rank_snapshots_keyword_captured_idx
  on public.seo_rank_snapshots (keyword_id, captured_at desc);

create table if not exists public.seo_content_inventory (
  id text primary key,
  path text not null unique,
  title text not null,
  primary_keyword_id text references public.seo_keywords (id) on delete set null,
  status text not null check (status in ('draft', 'published', 'archived')),
  last_reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seo_keywords enable row level security;
alter table public.seo_rank_snapshots enable row level security;
alter table public.seo_content_inventory enable row level security;

-- Service role / backend only for now (no public anon policies).
-- Owner-facing access goes through Express + checkAdminAccess, not direct client queries.
