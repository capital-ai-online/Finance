# M5A — Repository-Implementierung: Supabase Native TOTP MFA / AAL2

Status: CODE COMPLETE / CI PASS — PRODUKTIONSMUTATION NICHT AUTORISIERT
Datum: 2026-08-14
Authority: ESS-0020, ADR-0064, ADR-0003.5, `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md`
Basis: `main` nach PR #254

Dieses Dokument ist ausschließlich der Repository-Code-Nachweis (Stage B/C der
`M5A_SUPABASE_TOTP_AAL2_HARDENING.md`-Runbook-Sequenz). Es autorisiert **keine** Produktions-
mutation. Kein Supabase Auth-Faktor wurde erstellt, verifiziert, entfernt oder verändert. Kein
Owner-Profil wurde mutiert. Keine Secrets, Codes, Faktor-IDs oder TOTP-Payloads wurden gelesen,
angezeigt oder in diesem Dokument, Logs oder dem PR-Diff festgehalten.

## Umsetzung dieser Session

Diese Implementierung wurde **nicht** über den auditierten Systemadmin-SA4-Ausführungspfad
erzeugt — der Audit-Befund P1-2 (`docs/evidence/security/SECURITY_AUDIT_2026-08-14_ADR0069_DEVELOPMENT_CHAIN.md`)
stellte fest, dass der SA4-Host strukturell auf `REM-SA4-PILOT-001`/eine einzelne Zieldatei
verdrahtet ist und `REM-M5A-REPOSITORY-001` nicht ausführen kann. Der Owner hat sich explizit für
die risikoärmere Alternative entschieden: direkte Implementierung durch die aktuelle,
Owner-instruierte Claude-Code-Sitzung im normalen Branch → PR → Human-Review → CI → Merge-Zyklus,
ohne neue autonome Ausführungsinfrastruktur zu bauen.

## Umgesetzte Code-Slices

### Slice A — Authority und Service

| Datei | Änderung |
|---|---|
| `src/platform/Security/nativeMfa.ts` | **Neu.** Dünner, testbarer Wrapper um `supabase.auth.mfa.{enroll,challenge,verify,getAuthenticatorAssuranceLevel,listFactors,unenroll}`. Client wird injiziert (kein festes Modul-Import), damit Tests ohne Browser laufen. |
| `src/platform/Security/authMiddleware.ts` | **Neuer Export `requireVerifiedAal2(req)`.** Fragt `supabase.auth.mfa.getAuthenticatorAssuranceLevel(token)` direkt mit dem vorliegenden Bearer-Token ab (echter Netzwerk-Roundtrip gegen Supabase Auth, Token wird dabei erneut validiert). Fail-closed bei fehlendem Token, ungültigem Token, Lookup-Fehler oder `currentLevel !== 'aal2'`. Kein Caching zwischen Requests — jede Prüfung ist frisch, daher kein "stale aal2/aal1"-Zustand möglich. `requireStepUp()` ruft `requireVerifiedAal2()` jetzt zusätzlich zur bestehenden Token-Prüfung auf. |

Exit-Kriterien (verifiziert durch `tests/unit/authMiddlewareAal2.test.ts`, `tests/unit/nativeMfa.test.ts`):

- AAL1 für `requireVerifiedAal2`/`requireStepUp` → DENY;
- fehlender/ungültiger Bearer-Token → DENY;
- AAL-Lookup-Fehler (Netzwerk/Auth) → DENY (fail-closed);
- kein Vertrauen in Client-/UI-Marker als Autorität (server-seitige Prüfung liest ausschließlich das signierte JWT-Claim über die Supabase-API, nie einen Client-Header oder sessionStorage-Marker).

### Slice B — Enrollment/Login UI

| Datei | Änderung |
|---|---|
| `src/components/TotpSettings.tsx` | Neuer, additiver Abschnitt „Native Zwei-Faktor-Authentifizierung (empfohlen)“ oberhalb des bestehenden Legacy-Abschnitts (jetzt „(Legacy)“ beschriftet). Enroll → QR/Secret anzeigen → Challenge → Verify. Legacy-Abschnitt unverändert funktionsfähig (ADR-0064 Punkt 5: Migration, keine Löschung). |
| `src/components/LoginStepUpGate.tsx` | Prüft beim Laden zuerst den nativen AAL-Status (`getCurrentAssuranceLevel`). Existiert ein verifizierter nativer Faktor (`nextLevel === 'aal2'`), hat der native Challenge-Pfad Vorrang vor Passkey/Legacy-TOTP. Ohne nativen Faktor bleibt der bisherige Passkey-/Legacy-Pfad unverändert aktiv. Siehe Nachtrag unten: die ursprünglich hier vorgesehene Break-Glass-Recovery-Option für den nativen Pfad wurde durch explizite Owner-Policy noch vor Merge verworfen und nicht umgesetzt. |

Exit-Kriterien (verifiziert durch `tests/integration/nativeMfaAal2.test.ts`, `tests/unit/nativeMfa.test.ts`):

- unterstützter Supabase-nativer Ablauf (enroll → challenge → verify);
- ein `verify()`-Erfolg ohne tatsächliche AAL2-Sitzung zählt NICHT als Erfolg;
- Session/AAL wird nach Verify serverseitig unabhängig neu bewertet, nicht aus dem Client-Ergebnis übernommen;
- kein Secret/Code/Faktor-ID-Leak in Logs oder Evidence (Code enthält keine entsprechenden Log-Aufrufe).

### Slice C — Purpose-bound Step-up

| Datei | Änderung |
|---|---|
| `server/stepUp.ts` | `/step-up/verify` verlangt jetzt zusätzlich zum bestehenden Legacy-TOTP-Code eine gültige AAL2-Sitzung (`requireVerifiedAal2`), bevor ein Step-Up-Token ausgestellt wird — HTTP 428 `aal2_required` sonst. Siehe Nachtrag unten: `/break-glass/redeem` wurde durch explizite Owner-Policy vollständig entfernt statt (wie ursprünglich hier vorgesehen) um natives MFA erweitert. |
| `tests/unit/totp.test.ts` | Unverändert — bleibt als Migrations-/Regressionstest für die weiterhin vorhandene Legacy-RFC-6238-Implementierung bestehen. |

Exit-Kriterien (verifiziert durch `tests/unit/authMiddlewareAal2.test.ts`):

- Step-Up-Ausstellung ohne AAL2 → DENY (428);
- Step-Up-Konsum (`requireStepUp`) ohne AAL2 → DENY, auch mit sonst gültigem, ungenutztem Token;
- Legacy-Verhalten (User-Scope, Hash-Match, Unused, Unexpired) unverändert erhalten.

## Pflicht-Negativtests (Runbook Stage C, 11 Fälle)

| # | Fall | Testdatei |
|---|---|---|
| 1 | Owner/Admin AAL1 verweigert | `authMiddlewareAal2.test.ts` |
| 2 | fehlender Faktor verweigert | `nativeMfaAal2.test.ts` (kein Faktor → `insufficient-aal`) |
| 3 | unverifizierter Faktor kein Erfolg | `nativeMfa.test.ts`, `nativeMfaAal2.test.ts` |
| 4 | falscher TOTP-Code verweigert | `nativeMfa.test.ts`, `nativeMfaAal2.test.ts` |
| 5 | ungültige/abgelaufene Challenge verweigert | `nativeMfa.test.ts` (Challenge-Fehler → `NativeMfaError`) |
| 6 | stale `aal2/aal1` verweigert | `authMiddlewareAal2.test.ts` (kein Cache — jede Prüfung frisch) |
| 7 | Auth-/AAL-Lookup-Fehler verweigert | `authMiddlewareAal2.test.ts` (`aal-lookup-failed`, `internal-error`) |
| 8 | Step-Up ohne AAL2 verweigert | `authMiddlewareAal2.test.ts` |
| 9 | falscher User/Purpose verweigert | bestehende Logik unverändert (User-Scope in `requireStepUp`/`step_up_tokens`-Query) |
| 10 | Replay verweigert | bestehende Logik unverändert (`used_at IS NULL` atomar) |
| 11 | unautorisierter Faktor-Reset verweigert | kein neuer serverseitiger Fremd-Reset-Pfad eingeführt; Faktor-Entfernung ausschließlich Self-Service (eigene Session) — kein Break-Glass-Pfad mehr, siehe Nachtrag |

## Verifikation dieser Session

```text
npm run lint            -> tsc --noEmit, Exit 0
npx vitest run           -> siehe unten
npm audit --omit=dev --audit-level=high -> 0 Vulnerabilities
verifyGoogleMarketingInvariants.ts       -> 34/34 PASS
verifyProductionConfigInvariants.ts      -> 11/11 PASS
verifyDockerHardening.mjs                -> PASS
npm run build                            -> PASS
```

Testergebnis: `142` bestehende + `3` neue Testdateien, `812` Tests bestanden, `2` architekturell
übersprungen (unverändert gegenüber Baseline).

## Nicht Teil dieses Work-Packages

- keine Änderung an `checkAdminAccess()` selbst oder an den ~9 weiteren Server-Dateien, die
  `checkAdminAccess`/`requireStepUp` verwenden (`adminDiagnostics.ts`, `agentEvaluationRouter.ts`,
  `ai.ts`, `documentHygiene.ts`, `orchestrator.ts`, `scoreExplainability.ts`, `scoreValidation.ts`,
  `supervisorRouter.ts`, `systemEvents.ts`) — außerhalb der REM-M5A-REPOSITORY-001-Pfad-Allowlist;
  `requireStepUp()` ändert sein Verhalten für den einzigen produktiven Aufrufer
  (`adminDiagnostics.ts`) ausschließlich durch die geänderte gemeinsame Funktion, ohne dass diese
  Datei selbst angefasst wurde;
- keine Löschung von Legacy-TOTP-Code oder -Spalten (ADR-0064 Punkt 5: Migration, kein
  sofortiger Cutover). Der Break-Glass-Recovery-*Anwendungscode* wurde dagegen entfernt (siehe
  Nachtrag) — die `break_glass_codes`-*Produktionsdaten* selbst wurden davon nicht berührt;
- keine Supabase-Projektkonfigurations-Mutation;
- keine Owner-Faktor-Registrierung.

## Betriebliche Konsequenz — WICHTIG für die Owner-Freigabe

Sobald dieser PR nach `main` gemergt und deployed ist, verlangt `/step-up/verify` server-seitig
eine echte AAL2-Sitzung. Da laut `M5A_SUPABASE_TOTP_AAL2_BASELINE.md` aktuell **0 native
MFA-Faktoren** in Produktion existieren, können **beide Owner-Profile ab diesem Deploy keine
neuen Step-Up-Token mehr erhalten**, bis mindestens ein Owner-Profil native MFA über die neue
Oberfläche in `TotpSettings.tsx` eingerichtet hat. Das betrifft ausschließlich
Step-Up-geschützte kritische Aktionen (aktuell: `adminDiagnosticsRouter`s
`requireOwnerWithStepUp`) — normaler Login, normale App-Nutzung und alle anderen
`checkAdminAccess`-geschützten Admin-Zonen sind davon **nicht** betroffen, da deren Code in
diesem PR unverändert bleibt.

Das ist eine bewusste, im Runbook (`M5A_SUPABASE_TOTP_AAL2_HARDENING.md`, Abschnitt „Rollback“)
bereits antizipierte Konsequenz eines Hard-Cutovers, keine unbeabsichtigte Nebenwirkung.
**Seit dem Nachtrag unten gibt es dafür keinen Break-Glass-Notfallpfad mehr** — Verlust von
Passkey und Authenticator gleichzeitig kann nur noch außerhalb der Anwendung (Supabase-Dashboard
durch den Owner) behoben werden. Empfehlung: unmittelbar nach Merge mindestens ein Owner-Profil
über die neue Oberfläche registrieren, um die Lücke zu schließen — die Dringlichkeit dafür ist
durch den Wegfall des Notfallpfads höher als ursprünglich in diesem Dokument dargestellt.

## Nächster Schritt

Nach Merge und CI `VERIFIED PASS`: separates, explizites Owner-Mutation-Gate für die native
TOTP-Registrierung der beiden Owner-Identitäten gemäß Runbook Stage D–I. Dieses Dokument
autorisiert diesen nächsten Schritt nicht selbst.

## Nachtrag 2026-08-14 — Entfernung des Break-Glass-Recovery-Pfads (Owner-Policy)

Nach Erstellung der obigen Fassung (noch vor Merge, gleiche PR/Branch) hat der Owner explizit
angewiesen: „Es soll kein Notfall-Bypass-Code in der Anwendung stehen (Policy)“, konkretisiert
über `AskUserQuestion` als „Break-Glass-Recovery-System komplett entfernen“. Damit sind die
Aussagen weiter oben zu einer weiterhin nutzbaren Break-Glass-Recovery-Option **überholt** und
durch diesen Nachtrag korrigiert.

Umgesetzt in derselben Session, zusätzlich zu Slice A–C:

| Datei | Änderung |
|---|---|
| `server/stepUp.ts` | Route `/break-glass/redeem` vollständig entfernt (~113 Zeilen, inkl. Passkey- und nativer-MFA-Faktor-Bereinigung). `/totp/verify-setup` erzeugt keine Recovery-Codes mehr und liefert nur noch `{ success: true }`. Kein `break_glass_codes`-Zugriff mehr im Anwendungscode. |
| `src/components/TotpSettings.tsx` | Stage `'recovery-codes'` und die zugehörige UI (Codes-Grid, Copy-Button, Bestätigungsbutton) entfernt. Nach erfolgreicher Verifikation direkter Übergang zu `stage: 'idle'` mit Erfolgsmeldung. |
| `src/components/LoginStepUpGate.tsx` | Recovery-Code-Eingabe, zugehörige States und `handleRecoveryRedeem` entfernt. Statischer Hinweistext: kein automatischer Recovery-Weg, Kontakt zum Owner bei Verlust von Passkey/Authenticator. |
| `src/platform/Security/totp.ts` | Zusätzlich, unabhängig von der Break-Glass-Entfernung: `TOTP_WINDOW_STEPS = 1` als benannte Konstante extrahiert und mit RFC-6238-§5.2-Zitat dokumentiert (Owner-Anfrage „MFA-Faktor auf die empfohlenen Best-Practice-Anzahl ändern“ — Antwort: der bestehende Wert **war bereits** die von der RFC selbst empfohlene Zahl; keine funktionale Änderung, nur Benennung/Dokumentation). |

Ausdrücklich **nicht** Teil dieses Nachtrags: die `break_glass_codes`-Tabelle und ihre 20
unbenutzten Produktions-Zeilen (siehe `M5A_SUPABASE_TOTP_AAL2_BASELINE.md`) wurden **nicht**
gelöscht oder verändert. Das ist eine separate, noch zu treffende Produktions-Datenmutations-
Entscheidung außerhalb des Anwendungscodes und wird hier nur referenziert, nicht ausgeführt.

Verifikation: `npx tsc --noEmit` (0 Fehler), betroffene Testdateien (`totp.test.ts`,
`nativeMfa.test.ts`, `authMiddlewareAal2.test.ts`, `nativeMfaAal2.test.ts`) grün.
