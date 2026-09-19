-- Read-only canonical production schema fingerprint for CAPITAL-AI.
-- Scope is intentionally limited to application-owned public + fintech_core schemas.
-- The query normalizes table/view, column/default and constraint metadata and hashes the ordered
-- representation with SHA-256. Run it against the target Supabase Postgres project and bind the
-- result to buildSupabaseMigrationIntegrityEvidence.mjs provider evidence.
with schema_rows as (
  select concat_ws('|',
    n.nspname,
    c.relname,
    c.relkind,
    coalesce(a.attnum::text,''),
    coalesce(a.attname,''),
    coalesce(pg_catalog.format_type(a.atttypid,a.atttypmod),''),
    coalesce(a.attnotnull::text,''),
    coalesce(pg_get_expr(ad.adbin,ad.adrelid),''),
    coalesce(con.conname,''),
    coalesce(pg_get_constraintdef(con.oid,true),'')
  ) as row_repr
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  left join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
  left join pg_attrdef ad on ad.adrelid=c.oid and ad.adnum=a.attnum
  left join pg_constraint con on con.conrelid=c.oid and (con.conkey is null or a.attnum = any(con.conkey))
  where n.nspname in ('public','fintech_core')
    and c.relkind in ('r','p','v','m')
), canon as (
  select string_agg(row_repr, E'\n' order by row_repr) as payload from schema_rows
)
select encode(digest(coalesce(payload,''),'sha256'),'hex') as production_schema_sha256,
       (select count(*) from schema_rows) as canonical_row_count
from canon;
