-- Nachtrag zur vorherigen Migration: dieses Projekt verlaesst sich NICHT auf implizite
-- Default-Grants (siehe z.B. 20260804200909_issue_92_service_role_dml_grants) - jede Tabelle
-- braucht ihre GRANTs explizit. Ohne diese Migration wuerde weder der service-role-Client
-- (server/stepUp.ts) Zeilen einfuegen koennen, noch könnte ein Nutzer via
-- user_consents_select_own die eigene Zustimmungs-Historie einsehen, obwohl die RLS-Policy
-- existiert - RLS ersetzt keine fehlende Tabellen-GRANT.
GRANT SELECT ON public.user_consents TO authenticated;
GRANT INSERT, SELECT ON public.user_consents TO service_role;
