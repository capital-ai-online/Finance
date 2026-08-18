# PR #414 — Production Privacy Migration Evidence

**Datum:** 2026-08-19  
**Scope:** ADR-0085 / DSGVO Remediation  
**Produktionsprojekt:** Supabase `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`)  
**Region:** `eu-west-1`  
**Postgres:** 17.6.1.127 / Engine 17  
**PR:** #414 — `agent/dsgvo-remediation-controller-rights` → `main`

## 1. Zweck

Dieses Evidence-Artefakt dokumentiert die tatsächlich ausgeführte Produktionsmigration aus
`supabase/migrations/20260819010000_privacy_governance_and_requests.sql` und die unmittelbar danach ausgeführten technischen Verifikationen.

Es ist **kein juristisches Zertifikat** und ersetzt weder eine anwaltliche Prüfung noch externe AVV/DPA-, SCC-/Transfer- oder Subprocessor-Nachweise.

## 2. Pre-Mutation Verification

Vor Ausführung wurde gegen das aktive Produktionsprojekt geprüft:

- Projektstatus: `ACTIVE_HEALTHY`.
- Projektregion: `eu-west-1`.
- `public.privacy_requests`: nicht vorhanden.
- `public.user_consents.evidence_kind`: nicht vorhanden.
- Die Migration `privacy_governance_and_requests` war nicht in der Supabase-Migrationshistorie vorhanden.

Damit war der erwartete Vorzustand bestätigt und es lag keine bereits teilweise angewendete gleichnamige Migration vor.

## 3. Mutation

Die Migration wurde über die Supabase-Migrationsschnittstelle gegen das Produktionsprojekt angewendet.

**Ergebnis:** `success: true`

Supabase hat anschließend folgenden Migrationseintrag ausgewiesen:

- Version: `20260818232108`
- Name: `privacy_governance_and_requests`

Die durch Supabase vergebene History-Version weicht vom Repository-Dateipräfix `20260819010000` ab; maßgeblich für den Produktionsnachweis ist der von Supabase registrierte Eintrag zusammen mit dem identischen SQL-Inhalt aus dem PR-Branch.

## 4. Post-Mutation Verification

Direkte SQL-Verifikation gegen Produktion ergab:

| Kontrolle | Ergebnis |
| --- | --- |
| `public.privacy_requests` vorhanden | PASS |
| RLS auf `privacy_requests` aktiviert | PASS |
| `user_consents.evidence_kind` vorhanden und NOT NULL | PASS |
| `trg_classify_user_consent_evidence` vorhanden | PASS |
| `trg_touch_privacy_request_updated_at` vorhanden | PASS |
| `purge_expired_privacy_operational_data(timestamptz)` vorhanden | PASS |

### RLS Policies

Verifiziert wurden exakt:

1. `privacy_requests_select_own`
   - Rolle: `authenticated`
   - Operation: `SELECT`
   - Predicate: `(select auth.uid()) = user_id`

2. `privacy_requests_service_role`
   - Rolle: `service_role`
   - Operation: `ALL`
   - `USING (true)` / `WITH CHECK (true)`

### Tabellenrechte

Verifiziert:

- `authenticated`: ausschließlich `SELECT` auf `public.privacy_requests`.
- `service_role`: serverseitige DML-Rechte einschließlich `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Kein `anon`-Grant auf `privacy_requests`.

Damit können Browser-/Client-Sessions Requests nicht direkt anlegen oder verändern; Mutation bleibt im serverseitigen, authentifizierten Privacy-API-Pfad.

### Retention-Funktion

Für `public.purge_expired_privacy_operational_data(timestamptz)` wurde verifiziert:

- `service_role`: `EXECUTE`
- `postgres` / DB-Owner: `EXECUTE`
- keine `anon`- oder `authenticated`-Execute-Berechtigung

## 5. Supabase Security Advisor

Der Security Advisor wurde unmittelbar nach der DDL-Mutation ausgeführt.

**Für die neu eingeführten Privacy-Objekte wurde kein Security-Advisor-WARN/ERROR gemeldet.**

Vorhandene projektweite, nicht durch diese Migration erzeugte Findings:

- INFO: RLS ohne Policy auf `public.agent_audit_events`.
- INFO: RLS ohne Policy auf `public.seo_content_inventory`.
- INFO: RLS ohne Policy auf `public.seo_keywords`.
- INFO: RLS ohne Policy auf `public.seo_rank_snapshots`.
- WARN: Supabase Auth `Leaked Password Protection` ist deaktiviert.

Diese Findings werden nicht als durch PR #414 behoben behauptet und sollten separat priorisiert werden.

## 6. Supabase Performance Advisor

Der Performance Advisor wurde ebenfalls nach der Migration ausgeführt.

Für die neu angelegten Indizes

- `idx_privacy_requests_user_created`
- `idx_privacy_requests_status_due`

meldet der Advisor aktuell nur `unused_index` (INFO). Direkt nach Einführung einer neuen, noch nicht produktiv genutzten Tabelle ist dies erwartbar und kein Fehlernachweis.

Weitere Advisor-Hinweise betreffen vorbestehende Tabellen/Policies und gehören nicht zum Scope dieser Migration.

## 7. GitHub-/Repository-Evidence

Der PR-Branch enthält:

- `docs/roadmaps/DSGVO_REMEDIATION_2026-08-19.md`
- `docs/adr/ADR-0085-privacy-governance-single-source-of-truth.md`
- `docs/DATENSCHUTZ_PROTOKOLL.md`
- `supabase/migrations/20260819010000_privacy_governance_and_requests.sql`
- Privacy-Regressionstests und serverseitige Privacy-Routen.

Der letzte vollständige Klasse-R-CI-Lauf vor der Produktionsmutation war erfolgreich für:

- Repository-Integrität
- Dependency Audit
- TypeScript
- Unit Tests
- Production Build
- CSP
- Predeploy-/Produktionskonfiguration
- Docker-Hardening
- Production Docker Image

Governance/Security war ebenfalls PASS.

## 8. Externe Evidence-Grenzen

Eine Repository-Suche nach belastbaren, projektspezifischen Artefakten für

- unterzeichnete AVV/DPA,
- SCC / Standardvertragsklauseln,
- Transfer Impact Assessment,
- verbindliche Subprocessor-Liste,
- vertraglich zugesicherte Hosting-/Processing-Regionen

lieferte keine entsprechenden Nachweisdateien im Repository.

Daher wird **nicht** behauptet, diese externen Legal-/Vendor-Evidences seien durch GitHub erbracht. Sie müssen aus den jeweiligen Vendor-/Account-/Vertragsunterlagen beigebracht und separat versioniert bzw. referenziert werden.

## 9. Ergebnis

**Produktionsmigration: PASS**  
**Post-Migration Schema/RLS/Grant Verification: PASS**  
**Security Advisor für neue Privacy-Objekte: keine neuen WARN/ERROR Findings**  
**Performance Advisor: nur erwartbare INFO-Hinweise für bislang ungenutzte neue Indizes**  
**Externe DPA/SCC/Subprocessor Evidence: OPEN / nicht im Repository nachweisbar**
