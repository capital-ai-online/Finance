# ESS-0020 — Supabase Native MFA / AAL2 Hardening

## Enterprise Specification

**Version:** 1.0.0
**Status:** PROPOSED — HUMAN/OWNER REVIEW REQUIRED
**Implementation Status:** NOT STARTED — M5A BASELINE COMPLETE
**Owner:** Platform Director
**Security Authority:** CAPITAL-AI IAM / Security & Compliance
**Roadmap Phase:** M5A — Supabase MFA/TOTP/AAL2 Hardening
**Related ADR:** ADR-0003.5, ADR-0058, ADR-0064
**Related ESS:** ESS-0018, ESS-0019

## 1. Zweck

ESS-0020 definiert den verbindlichen Authentifizierungsvertrag für privilegierte CAPITAL-AI-Identitäten und ersetzt für den M5A-Scope die bisherige Annahme, dass ein in `public.profiles` gespeichertes `totp_enabled` oder ein CAPITAL-AI-eigenes TOTP-Secret einen Supabase-MFA-Nachweis darstellt.

Für M5A ist **Supabase Auth die MFA-Authority**. Ein privilegierter Request gilt nur dann als MFA-verifiziert, wenn die vertrauenswürdig verifizierte Supabase-Session einen aktuellen, nicht-stalen `aal2`-Zustand nachweist.

## 2. Verifizierte Ausgangslage 2026-08-12

Read-only Evidence gegen `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`) und `Finance@main`:

- `auth.mfa_factors`: **0** Faktoren;
- `auth.sessions`: **2 × aal1**, **0 × aal2**;
- `public.profiles`: **2 Owner-Profile mit legacy `totp_enabled=true`**, 2 User-Profile ohne Legacy-TOTP;
- `public.break_glass_codes`: **20 unbenutzte Legacy-Recovery-Codes**;
- `public.step_up_tokens`: **0 aktive Tokens**;
- Supabase Security Advisor: `auth_insufficient_mfa_options` aktiv;
- Organization Plan: **Free**; Leaked Password Protection bleibt planbedingt separat deferred;
- Repository-Code implementiert TOTP aktuell selbst in `src/platform/Security/totp.ts` und `server/stepUp.ts` und verwendet nicht `supabase.auth.mfa.enroll/challenge/verify`;
- `checkAdminAccess()` verifiziert Identität und IAM-Rolle, aber aktuell **kein `aal`**;
- `loginStepUpRequirement()` enthält für Status-/Netzwerkfehler einen **fail-open**-Pfad;
- Passkey-Bestätigung kann den aktuellen Login-Step-Up alleine erfüllen, obwohl ADR-0003.5 TOTP für Owner unabhängig vom Passkey fordert.

Keine Secret-Werte, E-Mail-Adressen, Factor-IDs, Recovery-Codes oder Token-Werte werden in dieser Evidence gespeichert.

## 3. Authority Contract

### 3.1 Verbindliche MFA-Quelle

Für M5A zählen ausschließlich Supabase-Auth-Nachweise:

- verifizierter Supabase-Bearer/JWT;
- `aal === 'aal2'`;
- Faktorstatus über Supabase Auth (`mfa.listFactors` / serverseitig validierte AAL-Evidence);
- TOTP-Verifikation über den unterstützten Supabase-Flow `enroll → challenge → verify`.

Folgende Signale sind **keine MFA-Authority**:

- `profiles.totp_enabled`;
- `profiles.totp_secret_encrypted`;
- Browser-`sessionStorage`-Marker;
- UI-Zustand;
- bloßes Vorhandensein eines Faktors ohne erfolgreiche Challenge/Verify;
- Passkey allein, solange dessen Supabase-Session keinen für M5A akzeptierten `aal2`-Nachweis liefert;
- CAPITAL-AI-eigener `x-step-up-token` ohne gleichzeitig gültige AAL2-Session.

### 3.2 Privilegierte Rollen

Für `owner` und `admin` gilt bei privilegierten Aktionen:

```text
VALID SUPABASE SESSION
  + AUTHORIZED IAM ROLE
  + CURRENT AAL2
  + NON-STALE FACTOR STATE
  + PURPOSE-BOUND STEP-UP WHERE THE ACTION CONTRACT REQUIRES IT
  = PRIVILEGED ACTION ELIGIBLE
```

`aal1` muss fail-closed abgewiesen werden. Ein Zustand `currentLevel=aal2` und `nextLevel=aal1` ist als stale/downgraded zu behandeln und darf keine privilegierte Aktion autorisieren.

### 3.3 Enrollment

Native TOTP-Einschreibung:

1. `supabase.auth.mfa.enroll({ factorType: 'totp' })`;
2. QR/Secret nur dem aktuell authentifizierten Benutzer anzeigen;
3. `supabase.auth.mfa.challenge({ factorId })`;
4. `supabase.auth.mfa.verify({ factorId, challengeId, code })`;
5. Session/AAL nach erfolgreicher Verifikation neu bewerten;
6. `aal2` muss technisch nachgewiesen sein, bevor die Einschreibung als abgeschlossen gilt.

Enrollment ohne erfolgreiche Verification ist kein MFA-Erfolg.

### 3.4 Login und Session Restore

Nach Primärlogin und bei wiederhergestellten Sessions muss vor privilegiertem Zugriff `getAuthenticatorAssuranceLevel()` bzw. eine äquivalente serverseitig validierte AAL-Prüfung stattfinden.

Die Logik ist fail-closed für privilegierte Rollen:

- `aal1/aal1`: kein verifizierter MFA-Faktor → privilegierter Zugriff gesperrt / Enrollment erforderlich;
- `aal1/aal2`: Faktor vorhanden, Challenge fehlt → Challenge erzwingen;
- `aal2/aal2`: MFA erfolgreich → Zugriff nach IAM-/Action-Gates möglich;
- `aal2/aal1`: stale/downgraded Session → Zugriff sperren, Session aktualisieren/re-authentifizieren.

Netzwerk-/Auth-Fehler dürfen bei Owner/Admin **nicht** zu `none` bzw. Dashboard-Freigabe degradieren.

### 3.5 Server/API Enforcement

Eine zentrale serverseitige AAL2-Prüfung muss privilegierten Endpunkten vorgeschaltet werden. Die Browser-UI ist ausschließlich UX, nicht Security Boundary.

Die Prüfung muss mindestens validieren:

- Bearer-Token gehört zu einem realen Supabase-Benutzer;
- IAM-Rolle erlaubt die Zielzone;
- AAL2 wird aus vertrauenswürdig validierter Session/JWT-Evidence abgeleitet;
- stale/downlevel Zustand fail-closed;
- Fehlerpfade liefern keine autorisierte Entscheidung.

Für direkt durch `authenticated` aufgerufene sensible Datenbankpfade ist nach separater Tabellen-/Policy-Inventur ein restriktiver AAL2-RLS-Contract zu verwenden. Service-Role-Serverpfade werden nicht durch RLS geschützt und müssen AAL2 deshalb vor dem privilegierten Server-Apply selbst erzwingen.

### 3.6 Purpose-bound Step-Up

Der bestehende `x-step-up-token` kann als zusätzliche, kurzlebige, einmalige und zweckgebundene Kontrolle erhalten bleiben, aber nur als **Defense-in-Depth über AAL2**.

Er darf AAL2 niemals ersetzen. Ausstellung und Konsum müssen an dieselbe verifizierte Identität gebunden sein. Für besonders kritische Owner-Aktionen ist frische MFA-Evidence zu testen und zu dokumentieren; Annahmen über AMR-Freshness dürfen nicht ohne Integrationstest als erfüllt gelten.

## 4. Recovery / Break-Glass

Supabase Native MFA besitzt für App-Benutzer keinen eingebauten Recovery-Code-Vertrag, der den vorhandenen CAPITAL-AI-Codes entspricht. M5A definiert daher:

- primär mindestens einen getesteten Backup-Faktor-/Recovery-Prozess für Owner;
- vorhandene Legacy-Recovery-Codes gelten während der Migration nicht automatisch als Native-MFA-Recovery;
- ein Owner-kontrollierter Break-Glass-Pfad darf native Faktoren nur serverseitig über die unterstützte Admin-MFA-Factor-Operation entfernen;
- das Entfernen eines verifizierten Faktors muss als Security-Critical Event auditiert werden und aktive Sessions entsprechend Supabase-Verhalten invalidieren;
- Passkeys dürfen nicht mehr implizit zusammen mit TOTP gelöscht werden, sofern eine getrennte Recovery-Entscheidung möglich ist;
- keine Recovery-Operation darf Rollen erhöhen oder `aal2` simulieren.

## 5. Legacy-TOTP-Migration

Die bestehenden eigenen Secrets werden nicht in-place als Supabase-Faktoren behandelt.

Verbindlicher Cutover:

1. Native MFA-Codepfad implementieren und testen;
2. Owner re-enrollen ihren TOTP-Faktor über Supabase Auth;
3. AAL2 für beide Owner-Identitäten verifizieren;
4. Recovery/Backup-Faktor testen;
5. privilegierte Serverpfade auf AAL2 schalten;
6. Legacy-TOTP-Pfade auf read-only/deprecated setzen;
7. erst nach separatem Owner-Approval Legacy-Secrets/-Spalten/-Tabellen entfernen.

DDL-/Datenbereinigung ist **nicht** Bestandteil der M5A-Baseline.

## 6. Mutation Classification

| Bereich | Status nach Baseline |
|---|---|
| Repository/Application Code | **REQUIRED** |
| Supabase Auth Factor Enrollment | **REQUIRED** für die beiden Owner-Identitäten |
| Supabase Project Auth Configuration | **CONDITIONAL / NOT YET VERIFIED** — Connector kann die Dashboard-Verification-Einstellung nicht auslesen |
| Postgres DDL für Native MFA | **NOT REQUIRED** |
| Legacy TOTP Schema Cleanup | **DEFERRED / SEPARATE OWNER-APPROVED MUTATION** |
| Render | **NOT REQUIRED** für Baseline/Design; Deployment erst nach Code-Merge über bestehende Chain |
| Stripe | **NOT REQUIRED** |

## 7. Required Negative Tests

M5A darf nicht `VERIFIED PASS` werden, bevor mindestens diese Fälle fail-closed bewiesen sind:

1. Owner/Admin mit `aal1` → DENY;
2. eingeschriebener aber nicht verifizierter Faktor → DENY;
3. falscher TOTP-Code → DENY;
4. abgelaufene/ungültige Challenge → DENY;
5. fehlender Faktor → DENY;
6. stale `aal2/aal1` → DENY;
7. Auth-/AAL-Check Netzwerkfehler → DENY für privilegierte Rollen;
8. `x-step-up-token` ohne AAL2 → DENY;
9. AAL2 ohne erforderlichen purpose-bound Step-Up bei Critical Action → DENY;
10. Step-Up-Token für falschen Purpose/User → DENY;
11. verbrauchter/replayed Step-Up → DENY;
12. Recovery ohne Owner-/Recovery-Gate → DENY.

Positive Tests:

- verifizierter Owner + `aal2/aal2` + gültiger Action-Step-Up → ALLOW für explizit erlaubte Aktion;
- Standardnutzer bleiben gemäß Produktpolicy ohne globale MFA-Pflicht nutzbar, solange kein privilegierter Pfad betroffen ist.

## 8. Evidence / Audit

M5A Evidence muss ohne Secrets dokumentieren:

- aggregierte Factor-/Session-Zustände;
- getestete AAL-Transitions;
- negative Testresultate;
- Advisor vor/nach Mutation;
- PR/CI/Merge SHA;
- Mutation State;
- Recovery-Testresultat;
- Rollback-Entscheidung.

## 9. Exit Gate

M5A ist erst `COMPLETE / VERIFIED PASS`, wenn:

1. ESS-0020 + ADR-0064 Human/Owner-approved sind;
2. Native MFA-Code und zentrale serverseitige AAL2-Enforcement implementiert sind;
3. Required CI PASS ist;
4. zwei Owner-Identitäten native TOTP-Faktoren erfolgreich verifiziert haben;
5. privilegierte AAL1-/stale-/error-Pfade fail-closed getestet sind;
6. Recovery/Backup-Verfahren verifiziert ist;
7. Security Advisor nach Mutation erneut ausgeführt wurde;
8. Evidence und Roadmap final synchronisiert sind.

M6 bleibt bis dahin blockiert.
