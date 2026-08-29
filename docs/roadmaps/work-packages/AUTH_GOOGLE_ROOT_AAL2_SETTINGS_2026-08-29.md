# AUTH Google Root + AAL2 Settings — Work Package

- **Claim-ID:** `WP-AUTH-GOOGLE-ROOT-AAL2-SETTINGS-2026-08-29`
- **Status:** IMPLEMENTED ON BRANCH / PR VALIDATION PENDING
- **Basis:** `main@ee8d14d831ce5483a7ea41e176805b355a952774`
- **Datum:** 2026-08-29

## Ziel

Den öffentlichen Authentisierungsvertrag nach PR #601 korrigieren:

1. Google OAuth darf nach erfolgreicher Provider-Anmeldung nicht auf `/login` zurückführen.
2. Google OAuth kehrt auf die kanonische Root-/Landingpage `/` zurück.
3. Der native Primärlogin-Passkey wird auf `/login` nicht mehr angeboten.
4. Primäre Anmeldung bleibt E-Mail/Passwort oder Google OAuth.
5. Ein Benutzer kann in seinen Einstellungen einen WebAuthn-Passkey als echten Supabase-MFA-/AAL2-Faktor aktivieren.
6. Ist ein solcher verifizierter Faktor vorhanden, erzwingt das bestehende `LoginStepUpGate` nach erfolgreichem Primärlogin die AAL2-Verifikation.
7. Ohne AAL2-Faktor erfolgt keine Passkey-Abfrage.

## Architekturentscheidung

Es wird **kein neuer Auth-Mechanismus** eingeführt. Die vorhandenen Komponenten werden entsprechend ihrer bestehenden Verantwortlichkeit verwendet:

- `LoginPage.tsx`: Primärauthentisierung E-Mail/Passwort + Google OAuth.
- `SessionComposition.tsx`: zentrale Supabase-Session-Konvergenz, Onboarding und Übergabe an Assurance-Gate.
- `LoginStepUpGate.tsx`: AAL-Auswertung und Challenge verifizierter TOTP-/WebAuthn-MFA-Faktoren.
- `nativeMfa.ts`: bestehender Wrapper um `supabase.auth.mfa.*`.
- `PasskeySettings.tsx`: Self-Service Enrollment/Removal eines WebAuthn-MFA-Faktors.

Die zuvor parallel existierende Primärlogin-Passkey-Fähigkeit (`auth.signInWithPasskey` / `auth.registerPasskey`) wird auf der kanonischen Login-Oberfläche nicht mehr exponiert. Bestehende Primärlogin-Credentials werden in diesem Work Package weder gelöscht noch automatisch konvertiert.

## Änderungen

### Google OAuth

`LoginPage.tsx` verwendet für Google:

```text
redirectTo = <window.location.origin>/
```

Damit wird nach dem Supabase-/Google-Callback die kanonische Root-Route geladen. Die Root-Route ist bereits die Landingpage; kein neues Routing wird eingeführt.

### Passkey Login

Aus `/login` entfernt:

- `PasskeyLoginPanel`
- `isNativePasskeyLoginEnabled`
- der native Passkey-Anmeldebutton

### Passkey in Benutzereinstellungen

`PasskeySettings.tsx` verwendet nun:

- `listVerifiedNativeMfaFactors()`
- `registerWebauthnMfaFactor()`
- `supabase.auth.mfa.unenroll()`

Es verwendet ausdrücklich **nicht** mehr:

- `auth.registerPasskey()`
- `auth.passkey.list()`
- `auth.passkey.delete()`
- `auth.signInWithPasskey()`

### Last-Factor Guard

`mfaLastFactorGuard.ts` zählt für die MFA-Pflicht nur noch echte verifizierte Supabase-MFA-Faktoren sowie den bestehenden Legacy-TOTP-Status. Primärlogin-Passkeys gelten nicht als Ersatz für AAL2.

## Erwarteter Flow

### Google ohne AAL2-Passkey

`/login` → Google → Supabase Callback → `/` → SessionComposition → kein erforderliches AAL2 → Landingpage

### Google mit aktiviertem AAL2-Passkey

`/login` → Google → Supabase Callback → `/` → SessionComposition → `nextLevel=aal2` → LoginStepUpGate → WebAuthn → Landingpage

### E-Mail/Passwort

Bleibt der in PR #601 wiederhergestellte Primärlogin. Bestehende Onboarding-/AAL-Regeln werden nicht umgangen.

## Nicht im Scope

- keine Supabase-Dashboard-/Provider-Credential-Mutation
- keine Löschung bestehender Primärlogin-Passkeys
- keine automatische Credential-Migration
- keine Änderung an Google Client ID/Secret
- keine Änderung an serverseitiger IAM-Authority
- keine Änderung an Billing/Stripe

## Regression Boundary

`tests/unit/authPrimaryLoginRegression.test.ts` sichert insbesondere:

- Google `redirectTo` zeigt auf `/`, nicht `/login`.
- `/login` exponiert keinen nativen Passkey-Login.
- E-Mail/Passwort und Registrierung bleiben aktiv und CAPTCHA-gebunden.
- Settings-Passkeys verwenden WebAuthn MFA.
- `LoginStepUpGate` bleibt an `nextLevel === 'aal2'` gebunden.
- Primärlogin-Passkeys zählen nicht als echter MFA-Faktor im Last-Factor-Guard.

## Rollback

Repository-only. Rücksetzung über human-reviewed Git-Revert des späteren Merge-Commits. Keine externe Provider- oder Datenmutation muss rückgängig gemacht werden.
