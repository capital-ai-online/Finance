# R-101 — Outbox-Produktionsmigration Evidence

Status: **VERIFIED PASS**  
Datum: 2026-08-14  
Authority: ADR-0054  
Repository-Migration: `supabase/migrations/20260810160000_outbox_jobs.sql`

## 1. Autorisierung und Ziel

Der Owner wählte ausdrücklich Variante 2: read-only Preflight, anschließende produktive Migration
und Post-Mutation-Verifikation.

- Supabase-Projekt: `AIFINANCIAL`
- Projekt-Ref: `ryzywoktpmyhwzxmstyu`
- Region: `eu-west-1`
- Projektstatus vor Mutation: `ACTIVE_HEALTHY`
- Weitere Supabase-Projekte: keine
- Keine Stripe-, Render-Konfigurations- oder Credential-Mutation

Secret-Werte wurden weder gelesen noch protokolliert.

## 2. Pre-Mutation-Baseline

Vor der Mutation ergab die produktive Schemaabfrage:

- `public.outbox_jobs`: nicht vorhanden;
- `enqueue_outbox_job`, `claim_outbox_job`, `complete_outbox_job`,
  `fail_outbox_job`: nicht vorhanden;
- die Repository-Migration war noch nicht in der produktiven Migrationshistorie registriert;
- Render meldete im 15-Sekunden-Takt:
  `claim_outbox_job ... could not find the function ... in the schema cache`.

Die Migration ist additiv, durch `begin/commit` atomar, aktiviert RLS und vergibt Rechte
ausschließlich an `service_role`.

## 3. Ausgeführte Mutation

- Executor: Supabase Migration API im Owner-autorisierten ChatGPT/Codex-Work-Schritt
- Operation: exakt der versionierte SQL-Inhalt der Repository-Migration
- Migrationsname: `outbox_jobs`
- registrierte Produktionsversion: `20260814221830_outbox_jobs`
- Ergebnis: `success: true`

Keine bestehenden Tabellen, Funktionen, Benutzer-, Billing- oder IAM-Daten wurden verändert.

## 4. Post-Mutation-Verifikation

| Kontrolle | Ergebnis |
|---|---|
| `public.outbox_jobs` vorhanden | PASS |
| RLS aktiviert | PASS |
| vorhandene Zeilen nach Migration | 0 |
| vier erwartete RPC-Signaturen | PASS |
| alle vier Funktionen `SECURITY DEFINER` | PASS |
| Execute für `anon` | DENY |
| Execute für `authenticated` | DENY |
| Execute für `service_role` | ALLOW |
| Policy `service_role_full_access` | PASS |
| leerer Claim-Test | PASS, Ergebnis `[]`, keine Testdaten |
| neue Supabase-Advisor-Funde für Outbox | keine |
| Render-Outbox-Fehler nach 22:18:35 UTC | keine |
| Render-App-Fehler nach 22:18:35 UTC | keine |

Bestehende Advisor-Hinweise zu anderen Objekten sind nicht durch diese Migration entstanden und
bleiben separate Arbeitspakete.

## 5. Nachfolgender Live-Deploy

Der nachfolgende aktuelle Produktionsdeploy bestätigt die dauerhafte Kompatibilität:

- Render-Service: `srv-d91o1o9o3t8c73edi55g`
- Deploy: `dep-d9vpf3dbedkc73et92ag`
- Commit: `ef711596f0020764441ff6ea9e1cf350b6ad2c1a`
- Status: `live`
- Outbox- oder allgemeine Error-Logs seit Start: keine
- Document Hygiene: Produktions-Read-only-Modus aktiv
- Alpaca: konfiguriert und authentifiziert; `STALE` außerhalb der Handelszeit, Feed `iex`

## 6. Rollback

Kein Rollback wurde benötigt. Falls eine spätere bestätigte Regression einen Rollback verlangt:

1. Outbox-Verbraucher per human-autorisierter Codeänderung stoppen;
2. vorhandene Jobs sichern und auf `processing`/`dead_letter` prüfen;
3. ausschließlich die vier R-101-RPCs und `public.outbox_jobs` in einer kontrollierten
   Supabase-Migration entfernen;
4. Render- und Supabase-Nachprüfung ausführen.

Ein Rollback darf nicht blind erfolgen, sobald produktive Jobs vorhanden sind.

## 7. Abschluss

R-101s Repository-Implementierung, produktive Datenbankmigration, Least-Privilege-Grenze und
laufender Worker sind damit **VERIFIED PASS**. Für diesen Abschluss ist keine weitere
Plattformmutation erforderlich.
