# M9 — `requireStepUp()` Purpose-Filter-Fix, Finding F2 (2026-08-17)

Status: BEHOBEN — Finding F2 aus `M9_INDEPENDENT_EVIDENCE_REVIEW_2026-08-16.md` geschlossen
Authority: Owner-Entscheidung „F2 beheben, dann M9 formal COMPLETE erklären" via `AskUserQuestion`,
im Anschluss an die Owner-Anweisung „starte mit M10 der Passkey autorisierung für pull requests"
(Gate-Reconfirm: „doch erst M9 vollständig abschließen").

## 0. Zweck und Abgrenzung

Behebt den einzigen von `M9_INDEPENDENT_EVIDENCE_REVIEW_2026-08-16.md` als tatsächlich behebbar
eingestuften Fund (F2, MEDIUM–HIGH): `requireStepUp()` (`src/platform/Security/authMiddleware.ts`)
las das bei Ausstellung (`server/stepUp.ts`) gespeicherte `purpose`-Feld beim Konsum nie zurück.
Ein für eine kritische Aktion ausgestelltes Step-up-Token (z. B. Versions-Bump) hätte innerhalb
seines 5-Minuten-Fensters für **jeden anderen** Step-up-gated Endpunkt wiederverwendet werden
können (Rollenverwaltung, Break-Glass-Aktivierung). Betraf **alle** drei realen Aufrufer von
`requireStepUp()`, nicht nur Break-Glass.

Die übrigen vier vom Review als „teilweise erfüllt" eingestuften Exit-Gate-Punkte (2, 3, 4, 5, 8)
beruhen auf strukturellen Fakten der aktuellen Systemarchitektur (u. a. SA3B als einziger realer
Aufrufer, Mocked-Supabase-Testmethodik) und sind **nicht** Gegenstand dieses Fixes — sie werden im
finalen M9-Closure-Dokument als bewusst akzeptierte, dokumentierte Residualzustände festgehalten.

## 1. Root Cause

`requireStepUp(req: Request): Promise<boolean>` fragte `step_up_tokens` ausschließlich nach
`user_id`, `token_hash`, `used_at IS NULL` und `expires_at > now()` ab — das `purpose`-Feld wurde
bei Ausstellung (`server/stepUp.ts:300`, `purpose || 'owner-action'`) zwar gespeichert, aber nie
Teil der Konsum-Abfrage. Alle drei realen Aufrufer riefen die Funktion ohne jeden
Zweck-Bezeichner auf:

- `server/adminDiagnostics.ts` (`requireOwnerWithStepUp`, für `/capabilities/grant`,
  `/capabilities/revoke`, `/approvals`);
- `server/systemadmin/breakGlassRouter.ts` (`requireOwnerWithStepUp`, für `/activate`, `/revoke`);
- `src/platform/VersionManager/versionManager.ts` (`requireFreshStepUp`, für Versions-Bump/Rollback).

## 2. Fix

`requireStepUp(req: Request, purpose: string): Promise<boolean>` — `purpose` ist jetzt ein
Pflichtparameter (leerer String wird sofort, ohne jede Supabase-Abfrage, abgelehnt) und wird als
zusätzliche `.eq('purpose', purpose)`-Bedingung in dieselbe atomare `UPDATE ... WHERE used_at IS
NULL`-Abfrage aufgenommen, die den Token-Konsum bereits Race-sicher macht.

Kein neuer Zweck-Namensraum erfunden — jeder Aufrufer reicht den bereits vorhandenen, pro Aktion
eindeutigen Bezeichner weiter, den er ohnehin schon an `checkAdminAccess()` als `zone` übergibt (bei
`adminDiagnostics.ts` und `breakGlassRouter.ts`) bzw. das exakte `purpose`-Literal, das die einzige
existierende Frontend-Aufrufstelle (`VersionManagerPanel.tsx:756`, `<StepUpModal
purpose="version-bump" .../>`) bereits bei der Token-Ausstellung sendet:

| Aufrufer | Neuer erforderlicher `purpose`-Wert |
|---|---|
| `adminDiagnostics.ts` `/capabilities/grant` | `admin-diagnostics:capability-grant` |
| `adminDiagnostics.ts` `/capabilities/revoke` | `admin-diagnostics:capability-revoke` |
| `adminDiagnostics.ts` `/approvals` | `admin-diagnostics:approval-issue` |
| `breakGlassRouter.ts` `/activate` | `systemadmin:break-glass-activate` |
| `breakGlassRouter.ts` `/revoke` | `systemadmin:break-glass-revoke` |
| `versionManager.ts` (Bump/Rollback) | `version-bump` (bereits realer Frontend-Vertrag, unverändert) |

**Bewusst nicht geändert:** die Ausstellungsseite (`server/stepUp.ts`) validiert `purpose` weiterhin
nicht gegen eine feste Allowlist. Das ist ausreichend, weil Ausstellung ohnehin immer einen frischen,
gültigen TOTP-Code voraussetzt — ein Angreifer mit bereits kompromittierter AAL2-Sitzung könnte sich
so oder so ein Token mit einem beliebigen `purpose`-Wert ausstellen lassen; die eigentliche Bedrohung,
die dieser Fix schließt, ist die **unbeabsichtigte** Zweck-Wiederverwendung eines legitim für Zweck A
ausgestellten, noch gültigen Tokens für einen anderen, sensibleren Zweck B ohne erneute bewusste
TOTP-Eingabe — genau das verhindert die Konsum-seitige Filterung unabhängig von der
Ausstellungsseite.

**Auswirkung auf reale Nutzung:** `adminDiagnostics.ts`s und `breakGlassRouter.ts`s Endpunkte hatten
zum Zeitpunkt dieses Fixes **keinen** Frontend-Aufrufer (verifiziert per Repository-Suche) — nur
manuelle/direkte API-Nutzung. Der Fix ist daher für diese beiden nicht breaking (kein realer
Nutzungspfad hing vom alten Default-`purpose` ab); ein zukünftiger Owner-Aufruf muss lediglich den
korrekten `purpose`-Wert beim `/api/auth/step-up/verify`-Aufruf mitschicken. `versionManager.ts`s
einziger realer Frontend-Aufrufer sendet bereits exakt `'version-bump'` — für diesen Pfad ist der
Fix vollständig rückwärtskompatibel, keine Frontend-Änderung nötig.

## 3. Testabdeckung

`tests/unit/authMiddlewareAal2.test.ts` — Mock-Kette um eine dritte `.eq()`-Ebene erweitert
(`user_id` → `token_hash` → `purpose`) plus einen `eqCallsMock`, der jeden `.eq()`-Aufruf mit seinen
exakten Argumenten aufzeichnet. 3 neue Tests:

1. Leerer/fehlender `purpose` wird sofort abgelehnt, ohne jede Supabase-Abfrage.
2. Die Konsum-Abfrage filtert nachweislich sowohl nach `user_id` als auch nach `purpose` (nicht nur
   nach den bereits vorher geprüften Feldern) — Beweis, dass der Filter tatsächlich verdrahtet ist,
   nicht nur behauptet.
3. Ein für einen anderen Zweck ausgestelltes Token (`version-bump-token`, angefragt mit
   `systemadmin:break-glass-activate`) wird verweigert — simuliert exakt das reale
   Datenbankverhalten (kein Zeilentreffer in der purpose-gefilterten `WHERE`-Klausel).

Alle sechs bereits bestehenden Tests des Describe-Blocks bleiben unverändert PASS (nur um das neue
Pflichtargument ergänzt, `'test-purpose'` als neutraler Wert).

**Testlauf:** `npx vitest run` — **195 Dateien, 1207 Tests, alle PASS** (davon neu: 3).
`npm run lint` (`tsc --noEmit`) PASS.

## 4. Related Documents

- `docs/evidence/m9/M9_INDEPENDENT_EVIDENCE_REVIEW_2026-08-16.md` (Finding F2)
- `docs/evidence/m9/M9_BREAK_GLASS_LIVE_WIRING_2026-08-16.md` §3 (ursprüngliche Fund-Dokumentation)
- `src/platform/Security/authMiddleware.ts`
- `server/adminDiagnostics.ts`
- `server/systemadmin/breakGlassRouter.ts`
- `src/platform/VersionManager/versionManager.ts`
- `tests/unit/authMiddlewareAal2.test.ts`
