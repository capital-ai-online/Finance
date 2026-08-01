-- Nachholmigration (Audit ARCH-AUDIT-0002, Befund AUD2-F-011): server/iam/authMiddleware.ts
-- schreibt beim Zugriffsprotokollieren user_id, reason, ip_address, user_agent in
-- iam_access_log, obwohl die urspruengliche Migration (20260711000000_iam.sql) diese Spalten
-- nie angelegt hatte. Die Spalten wurden bereits ausserhalb der versionierten Migrationshistorie
-- auf der Produktivinstanz ergaenzt ("iam_access_log_add_context", 2026-07-15) - diese Datei
-- holt das im Repository nach, damit eine Neuprovisionierung aus supabase/migrations/ denselben
-- Stand ergibt. IF NOT EXISTS macht sie als Wiederholung gegen die bereits aktuelle
-- Produktivinstanz sicher.

alter table public.iam_access_log
  add column if not exists user_id uuid,
  add column if not exists reason text,
  add column if not exists ip_address inet,
  add column if not exists user_agent text;
