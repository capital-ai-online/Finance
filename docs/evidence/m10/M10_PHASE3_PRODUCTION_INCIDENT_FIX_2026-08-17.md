# M10 — Phase 3 Production Incident: Migration Never Applied + Error-Handling Bug (2026-08-17)

Status: BEHOBEN — Migration gegen Produktion angewendet (Owner-autorisiert), Fehlerbehandlungs-Bug
im Code geschlossen und getestet
Authority: Owner-Bericht „die Passkey Registrierung im Supervisor Dashboard registriert die Passkey
erstellung nicht", 2026-08-17; Owner-Wahl „Ja, Migration jetzt gegen Produktion anwenden
(empfohlen)" via `AskUserQuestion`.

## 0. Zweck

Dokumentiert einen realen, vom Owner gemeldeten Produktionsfehler direkt im Anschluss an
`docs/evidence/m10/M10_PHASE3_LIVE_WIRING_2026-08-17.md` (PR #411): Passkey-Registrierung im
Supervisor-Dashboard schlug fehl. Root-Cause-Analyse fand **zwei unabhängige Ursachen**, beide
behoben.

## 1. Root Cause 1: Migration nie gegen Produktion angewendet

`M10_PHASE3_LIVE_WIRING_2026-08-17.md` §2 behauptete: „Migration wurde nicht gegen eine echte
Instanz angewendet, rollt über den bestehenden Deploy-Prozess aus." **Diese Annahme war falsch —
es existiert kein solcher Prozess.** Verifiziert:

- `grep` über alle `.github/workflows/*.yml`: kein Workflow enthält `supabase db push`,
  `supabase migration`, oder ein `SUPABASE_ACCESS_TOKEN`-Secret für automatisiertes Migrations-
  Deployment.
- `supabase/`-Verzeichnis enthält keine `config.toml` — das Repository ist nicht einmal lokal an
  ein Supabase-CLI-Projekt gebunden.
- Der Kommentar in der bereits bestehenden Migration
  `20260731000400_security_events_stepup_totp.sql` bestätigt das historische Muster: frühere
  Strukturen wurden „bereits ausserhalb der versionierten Migrationshistorie auf der
  Produktivinstanz angelegt" — Migrationen in diesem Repository werden **grundsätzlich manuell**
  angewendet, nie automatisch durch CI/CD.
- Direkte Verifikation via `mcp__Supabase__list_tables` gegen das reale Produktionsprojekt
  (`ryzywoktpmyhwzxmstyu`, „AIFINANCIAL"): weder `m10_registration_challenges` noch
  `m10_owner_credentials` existierten.

**Korrektur:** Der Owner wurde explizit gefragt (`AskUserQuestion`), da das Anwenden einer
Migration eine Produktions-Datenbank-Mutation ist, die laut CLAUDE.md eine explizite Freigabe
erfordert — Lesezugriff zur Diagnose ist unproblematisch, das tatsächliche Schreiben nicht.
Owner-Wahl: „Ja, Migration jetzt gegen Produktion anwenden (empfohlen)". Die exakt bereits per PR
#411 review-geprüfte, rein additive Migration (zwei neue, isolierte `CREATE TABLE IF NOT EXISTS`,
kein Eingriff in bestehende Tabellen) wurde via `mcp__Supabase__apply_migration` angewendet.
Verifiziert: beide Tabellen existieren jetzt mit `rls_enabled: true`; `mcp__Supabase__get_advisors`
(Security) zeigt **keinen** Fund für die beiden neuen Tabellen — die `service_role_full_access`-
Policies wurden korrekt angelegt.

## 2. Root Cause 2: Unbehandelte Store-Fehler in `credentialEnrollment.ts`

Selbst mit angewendeter Migration hätte ein künftiger Datenbankfehler (Netzwerkausfall, RLS-
Ablehnung, o. ä.) das Problem erneut ausgelöst: `beginM10CredentialEnrollment()`,
`completeM10CredentialEnrollment()` und `revokeM10Credential()` riefen mehrere Store-Methoden
**ohne try/catch** auf. Ein von der Supabase-gestützten Store-Implementierung geworfener Fehler
(`credentialEnrollmentSupabaseStore.ts`s `save()`-Methoden werfen explizit bei einem Insert-Fehler)
wurde nicht abgefangen — die Exception propagierte unbehandelt durch den Router
(`credentialEnrollmentRouter.ts`, dessen Handler ebenfalls kein eigenes try/catch um den
Funktionsaufruf hat), was zu einem hängenden Request statt einer sauberen Fehlermeldung führte —
exakt das vom Owner beschriebene Symptom „registriert die Passkey erstellung nicht" (kein
Fehlerdialog, einfach kein Ergebnis).

**Fix:** Jeder Store-Aufruf in allen drei Funktionen ist jetzt einzeln in try/catch gekapselt und
liefert bei einem Fehler ein sauberes `{verdict: 'DENY', reason: '...'}` statt einer unbehandelten
Exception:

- `beginM10CredentialEnrollment`: `credentialStore.listActiveForOwner()` und
  `challengeStore.save()`.
- `completeM10CredentialEnrollment`: `challengeStore.get()`, `challengeStore.markConsumed()`,
  `credentialStore.save()`.
- `revokeM10Credential`: `credentialStore.revoke()`.

**Wichtige Klarstellung zur tatsächlichen Fehlerursache:** Von den betroffenen Store-Methoden
werfen in der realen Supabase-Implementierung ausschließlich die beiden `save()`-Methoden
tatsächlich (`get`/`markConsumed`/`listActiveForOwner`/`revoke` fangen Fehler bereits intern ab und
liefern `null`/`false`/`[]`). Der konkrete Produktionsfehler traf daher exakt
`challengeStore.save()` in `beginM10CredentialEnrollment()` — der erste Schritt beim Klick auf
„Passkey registrieren". Die übrigen Kapselungen sind Verteidigung in der Tiefe für den Fall einer
künftigen Store-Implementierung, die auch bei anderen Methoden wirft.

## 3. Testabdeckung

6 neue Regressionstests in `tests/unit/m10CredentialEnrollment.test.ts`:

- `beginM10CredentialEnrollment`: `credentialStore.listActiveForOwner()` wirft → `DENY` mit dem
  Fehlertext, nicht crash; `challengeStore.save()` wirft (exakt der reale Fehler — „relation ...
  does not exist") → `DENY`.
- `completeM10CredentialEnrollment`: `challengeStore.get()` wirft → `DENY`;
  `challengeStore.markConsumed()` wirft → `DENY`; `credentialStore.save()` wirft nach erfolgreicher
  Verifikation → `DENY` (nicht stillschweigend als Erfolg behandelt).
- `revokeM10Credential`: `credentialStore.revoke()` wirft → `DENY`.

**Testlauf:** `npx vitest run` — **200 Dateien, 1298 Tests, alle PASS** (davon neu: 6).
`npm run lint` (`tsc --noEmit`) PASS.

## 4. Produktionszustand nach diesem Fix

- Beide Tabellen existieren in Produktion mit aktivem RLS und korrekten Service-Role-Policies.
- Der Code fängt jetzt jeden Store-Fehler sauber ab.
- **Der Owner kann jetzt tatsächlich einen Passkey über das Supervisor-Dashboard registrieren** —
  vorbehaltlich des nächsten Deploys, der den Code-Fix (try/catch) auf Produktion bringt (die
  Migration selbst ist bereits unabhängig vom Code-Deploy wirksam).

## 5. Lektion für künftige Live-Wiring-Schritte

Die Annahme „Migration rollt automatisch über den Deploy-Prozess aus" war unbegründet und wurde
nicht vor der PR-Erstellung verifiziert. **Für jede künftige Migration in diesem Repository muss
explizit mit dem Owner geklärt werden, ob/wie sie angewendet wird** — es gibt keinen impliziten
Automatismus.

## Related Documents

- `docs/evidence/m10/M10_PHASE3_LIVE_WIRING_2026-08-17.md`
- `docs/evidence/m10/M10_PHASE3_OWNER_CREDENTIAL_ENROLLMENT_2026-08-17.md`
- `supabase/migrations/20260817020000_m10_passkey_owner_enrollment.sql`
- `server/m10/credentialEnrollment.ts`
- `server/m10/credentialEnrollmentSupabaseStore.ts`
- `tests/unit/m10CredentialEnrollment.test.ts`
