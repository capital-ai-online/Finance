# IAM Implementation Log — ADR-0003.5 / ADR-0008

**Zweck:** Übergabe-Grundlage von Prompt 1 (Entwicklung, kein DB-Zugriff) an Prompt 2 (Produktion, Capital-AI Systemadmin-Schnittstelle mit Supabase-Zugriff) und Prompt 3 (Nachweis).

---

## Eintrag 1 — Entwicklungsumgebung (Prompt 1)

- **Zeitstempel:** 2026-07-11
- **Agent/Autor:** Claude (Entwicklungsumgebung, kein DB-Zugriff)
- **Bezug:** ADR-0003.5, ADR-0008

### 1. Migration vorbereitet (NICHT ausgeführt)
- Datei: `supabase/migrations/20260711000000_iam.sql`
- Inhalt: `profiles.role`-Spalte (check-constraint `owner|admin|supervisor|user`, Default `user`), Tabellen `audit_logs_iam` und `iam_access_log`, RLS aktiviert auf `profiles`/`audit_logs_iam`/`iam_access_log`, Policy `profiles_select_own` (Nutzer darf eigene Zeile lesen), bewusst keine Update/Delete-Policies auf den Log-Tabellen.
- **Status: UNGETESTET gegen echte Datenbank.** Ausführung inkl. Backup/Dry-Run erfolgt in Prompt 2.

### 2. Server-Code (fertiggestellt, gegen Mock-Supabase-Client konzipiert)
- Neu: `server/iam/types.ts` — zentrale `Role`-Definition (`owner`, `admin`, `supervisor`, `user`).
- Neu: `server/iam/authMiddleware.ts` — `checkAdminAccess()`, `requireStepUp()`, `logIamEvent()`.
  - **Übergangs-Fallback aktiv:** solange `profiles.role`/`audit_logs_iam`/`iam_access_log` in der Ziel-DB nicht existieren, fällt die Middleware kontrolliert auf die alte `ADMIN_EMAILS`-Liste zurück (mit `console.warn`-Markierung `[IAM][LEGACY FALLBACK AKTIV]`). Das verhindert einen Admin-Ausfall zwischen Code-Deployment und Migrationsausführung.
  - `requireStepUp()` liefert aktuell immer `false` (Ausstellungs-Endpunkt für Step-up-Tokens ist Teil von Prompt 2 und noch zu ergänzen) — step-up-pflichtige Aktionen sind bis dahin serverseitig blockiert, nicht offen.
- Migrierte Routen (ADMIN_EMAILS entfernt, durch `checkAdminAccess` ersetzt):
  - `server/systemEvents.ts`: `/system-events` (GET/POST/Stream), `/doc-status`, `/agents`, `/agents/register`, `/agents/toggle`, `/orchestrators/status`.
  - `server/versionManager.ts`: zentrale `requireAdmin`-Middleware (gilt für alle daran hängenden Routen) auf `SUPERVISOR_ZONE_ROLES` umgestellt.
  - `server/documentHygiene.ts`: zentrale `requireAdmin`-Middleware auf `ADMIN_ZONE_ROLES` umgestellt.
  - `server.ts`: `/api/registry/assets/:symbol` (POST) — **zusätzlicher Fund:** diese Route hatte zuvor **keinerlei** Zugriffsprüfung (nur E-Mail-Auslesung fürs Logging). Jetzt über `checkAdminAccess(..., SUPERVISOR_ZONE_ROLES)` abgesichert.
  - `server/db.ts`: `getSubscription()` und `getLocalPdfCredits()` — Owner-Bypass von hartcodiertem E-Mail-Vergleich auf `profiles.role === 'owner'`-Prüfung umgestellt (Helper `isOwnerIdentifier()`, gleiches Übergangs-Fallback-Prinzip). `getLocalPdfCredits()` ist jetzt `async` — Aufrufer in `server/stripe.ts` (3 Stellen) auf `await` umgestellt.

### 3. Frontend-Code
- `src/components/AuditLog.tsx`: client-seitige `ADMIN_EMAILS`/`isAdmin`-Logik entfernt. Zugriff wird jetzt per Supabase-Session-Token (`Authorization: Bearer`) an den Server übergeben; UI reagiert auf 401/403 (`accessDenied`-State), trifft keine eigene Autorisierungsentscheidung mehr.
- `src/components/AdminPortal.tsx`: client-seitige `ADMIN_EMAILS`-Liste entfernt. Rollenanzeige jetzt über RLS-geschützte Supabase-Abfrage der eigenen `profiles`-Zeile (`auth.uid() = id`). Ausdrücklich nur UX-Hinweis — echte Autorisierung bleibt in jedem Kind-Panel serverseitig.
- `src/components/SicherheitsmanagementPoC.tsx`: Deprecation-Header ergänzt.
- `src/components/DocumentHygienePanel.tsx`: Warnbanner vor der eingebetteten PoC-Komponente ergänzt (Tab `sicherheit_poc` bleibt technisch bestehen, ist aber als PoC gekennzeichnet — **offener Punkt**, siehe unten).

### 4. Tests
- Keine automatisierten Tests in dieser Umgebung ausgeführt (kein Testrunner-Zugriff in dieser Session). **Offener Punkt für Prompt 2/Follow-up:** Unit-Tests für `checkAdminAccess()` (401/403/200-Fälle, Legacy-Fallback, Rate-Limiting) gemäß ursprünglichem Architektur-Prompt Abschnitt 2.2 fehlen noch.

### 5. Offene Punkte / Annahmen (zu verifizieren in Produktion)
1. **Tabellenname `profiles` angenommen** — im Code bereits mehrfach verwendet (`ProfilePage.tsx`, `AdminPanel.tsx` u.a.), aber nicht explizit als Supabase-Schema-Definition im Repo vorgefunden. In Prompt 2 vor der Migration verifizieren, dass `public.profiles` existiert und eine `id`-Spalte (UUID, = `auth.users.id`) sowie eine `email`-Spalte besitzt.
2. **Rate-Limiting** aus dem ursprünglichen Architektur-Prompt (Abschnitt 2.2) ist **noch nicht implementiert** — `authMiddleware.ts` protokolliert Zugriffe, drosselt aber noch keine wiederholten Fehlversuche.
3. **Step-up-Ausstellungs-Endpunkt** existiert noch nicht — `requireStepUp()` ist ein Platzhalter, der aktuell alles blockiert, was ihn benötigt (sicherer Standardzustand, aber funktional unvollständig).
4. **Zusätzliche, bisher nicht in ADR-0003.5 erfasste hartcodierte Owner-Vergleiche** gefunden in: `src/components/AdminPanel.tsx`, `src/components/Dashboard.tsx`, `src/components/ProfilePage.tsx`, `src/components/Abonnements.tsx`, `src/components/DocumentHygienePanel.tsx` (Formularvorbelegung), `src/components/VersionManagerPanel.tsx`, `src/App.tsx`. Diese waren **nicht Teil des vereinbarten Prompt-1-Scopes** und wurden bewusst nicht verändert, um den Umfang nicht unkontrolliert auszuweiten. **Empfehlung:** eigener Folge-Prompt nach Abschluss von Prompt 2/3, da einige davon (`AdminPanel.tsx`) vermutlich denselben unautorisierten Zugriffscharakter haben wie die migrierten Dateien.
5. **`SicherheitsmanagementPoC.tsx`** bleibt über den Tab `sicherheit_poc` in `DocumentHygienePanel.tsx` technisch erreichbar (jetzt mit Warnbanner). Vollständige Entfernung aus der Navigation war nicht Teil des Scopes und sollte im Folge-Prompt entschieden werden.

### 6. Sqlfluff/Syntax-Prüfung der Migration
- Manuelle Review durchgeführt: Syntax ist Standard-PostgreSQL/Supabase-kompatibel (idempotente `IF NOT EXISTS`/`DO`-Blöcke). Kein `sqlfluff` in dieser Umgebung verfügbar — Ergebnis daher als "manuell geprüft, nicht automatisiert validiert" zu werten.

### 7. TypeScript-Prüfung (Einschränkung)
- `tsc` ist in dieser Umgebung vorhanden, aber `node_modules` (express-, react-, supabase-Typen) fehlen und konnten ohne Netzwerkzugriff nicht installiert werden — ein vollständiger `npm run lint` (`tsc --noEmit`) war daher nicht möglich.
- Ersatzweise durchgeführt: Klammer-/Parenthesen-Bilanzprüfung aller geänderten Dateien (unauffällig) sowie manuelle Zeile-für-Zeile-Durchsicht jeder Änderung.
- **Offener Punkt für Prompt 2:** vor dem produktiven Deployment `npm install && npm run lint` in einer Umgebung mit Netzwerkzugriff ausführen und Ergebnis hier ergänzen.

**Ende Eintrag 1. Nächster Eintrag wird von Prompt 2 (Produktion) ergänzt.**

---

## Eintrag 2 — Finaler Stand (Runde 1-6, Produktion, mit Supabase-DB-Zugriff)

**Zeitstempel:** 2026-07-30
**Agent/Autor:** Claude (Produktionsumgebung, mit Supabase-MCP-Zugriff)
**Bezug:** ADR-0003.5, ADR-0008, ADR-0009

Alle in Eintrag 1 offenen Punkte wurden über mehrere Runden bearbeitet:

1. **`profiles`-Tabellenname/Schema verifiziert:** `public.profiles` existiert, hat
   **keine** `email`-Spalte (die liegt in `auth.users`) - das war Ursache eines eigenen,
   bis dahin unentdeckten Bugs (`isOwnerIdentifier()` in `server/db.ts` griff bei jeder
   E-Mail-basierten Prüfung fälschlich auf eine Legacy-Liste zurück). Behoben: Owner-
   Prüfung läuft ausschließlich über `profiles.id` gegen `profiles.iam_role`.
2. **Rate-Limiting implementiert:** dependency-freier In-Memory-Limiter
   (`server/iam/rateLimiter.ts`), zentral in `checkAdminAccess()` integriert - deckt
   dadurch alle Admin-Zonen einheitlich ab. Bekannte Grenze: pro Prozess/Instanz, kein
   geteilter Zustand bei horizontaler Skalierung.
3. **Step-up-Ausstellungs-Endpunkt gebaut:** `server/stepUp.ts` - TOTP-Setup/Verifikation
   (RFC 6238, ohne externe Dependency), Step-Up-Token-Ausstellung (`step_up_tokens`,
   einmalig, 5 Min. gültig), Break-Glass-Recovery (`break_glass_codes`, an Supabases
   eigenen Passwort-Reset-Flow gekoppelt, nicht als eigenständiger Auth-Bypass).
4. **Zusätzliche hartcodierte Owner-Vergleiche behoben:** alle in Punkt 4 (Eintrag 1)
   gelisteten Dateien wurden bereinigt (`AdminPanel.tsx`, `Dashboard.tsx`,
   `ProfilePage.tsx`, `Abonnements.tsx`, `DocumentHygienePanel.tsx`,
   `VersionManagerPanel.tsx`, `App.tsx`). `App.tsx` enthielt zusätzlich einen
   automatischen Dev-Login, der über jede `*.run.app`-Domain oder eine fehlkonfigurierte
   `NODE_ENV` ausgelöst werden konnte - jetzt auf exakten `localhost`-Hostnamen plus
   explizites Build-Flag beschränkt.
5. **`SicherheitsmanagementPoC.tsx` entfernt:** Tab `sicherheit_poc` und Komponente
   vollständig aus `DocumentHygienePanel.tsx` entfernt, ersetzt durch die echte
   Supabase-native Passkey-Integration in `src/components/ProfilePage.tsx`.
6. **TypeScript-Prüfung weiterhin eingeschränkt:** kein Netzwerkzugriff in dieser Sandbox
   für `npm install`/`npm run lint` - **weiterhin offener Punkt für dich**, vor jedem
   Merge lokal/in CI zu verifizieren.

**Zusätzlich in diesen Runden gefunden und behoben (nicht in Eintrag 1 antizipiert):**
- `server/stripe.ts`: mehrere unauthentifizierte Endpunkte erlaubten IDOR (fremde
  Abo-/Credit-Daten abfragen/verändern, beliebige Stripe-Billing-Portal-Sessions).
- `server/orchestrator.ts`: hartcodierter Fallback-Admin-Token (`aif-admin-2026`), im
  Frontend sogar standardmäßig vorausgefüllt; unauthentifizierter Endpunkt zum Schreiben
  gefälschter "Compliance-Audit"-Dateien.
- ADR-0009 (CORS-Hardening): Wildcard-artige Origin-Prüfung (`*.run.app`) ersetzt durch
  feste Produktions-Allowlist.
- Supabase-Stripe-Sync-Engine-Integration: ein bereits vorhandener, fehlerhafter DB-
  Trigger (Type-Fehler + gefährlicher Pro-Default bei unbekannter Price-ID) behoben.
- "Passwort vergessen": fehlende `PASSWORD_RECOVERY`-Event-Behandlung gefunden und
  behoben - Funktion sendete zuvor nur die E-Mail, ohne je ein Formular zum tatsächlichen
  Setzen eines neuen Passworts zu zeigen.

**Ausdrücklich NICHT Teil dieser Runden:** ADR-0004 bis ADR-0007 (Branding, Frontend-
Modul-Integration, Plattform-Direktor, Compliance-Wertschöpfungskette) - siehe
`docs/adr/README.md` für den Status dieser ADRs.

**Ende Eintrag 2.**

