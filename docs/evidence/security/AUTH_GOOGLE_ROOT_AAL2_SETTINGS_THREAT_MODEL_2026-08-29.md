# Threat Model — Google Root Redirect + Settings-bound AAL2 Passkey

- **Datum:** 2026-08-29
- **Work Package:** `WP-AUTH-GOOGLE-ROOT-AAL2-SETTINGS-2026-08-29`
- **Basis:** `main@ee8d14d831ce5483a7ea41e176805b355a952774`

## Schutzobjekte

- Supabase-Session und OAuth-State
- Benutzeridentität nach Google-/Passwort-Primärlogin
- AAL2-/MFA-Status
- WebAuthn-MFA-Credentials
- Onboarding-/Consent-Gates
- kanonische öffentliche Routing-Grenze `/` vs. `/login`

## Trust Boundaries

1. Browser ↔ Google OAuth
2. Google OAuth ↔ Supabase Auth Callback
3. Supabase Auth ↔ Browser-Session
4. Browser-Session ↔ `SessionComposition`
5. `SessionComposition` ↔ `LoginStepUpGate`
6. Benutzer-Einstellungen ↔ Supabase `auth.mfa.webauthn`

## Bedrohungen und Kontrollen

### OAuth Redirect Loop

**Risiko:** Ein erfolgreicher Google-Login kehrt auf `/login` zurück und wird erneut als Login-Oberfläche dargestellt oder in eine Redirect-/Session-Race-Situation gebracht.

**Kontrolle:** Der Google-OAuth-Start bindet `redirectTo` an die kanonische Root-URL `/`. Die Root-Route ist bereits die Landingpage. Onboarding/AAL werden davor zentral durch `SessionComposition` ausgewertet.

### Vermischung Primärlogin-Passkey und MFA-Passkey

**Risiko:** Ein `auth.registerPasskey()`-Credential wird fälschlich als AAL2-Faktor behandelt, obwohl der AAL2-Vertrag auf `auth.mfa.*` basiert.

**Kontrolle:** Settings verwenden ausschließlich `auth.mfa.webauthn` über `registerWebauthnMfaFactor()`. Primärlogin-Passkeys zählen im Last-Factor-Guard nicht als MFA.

### MFA-Bypass nach Google Login

**Risiko:** Ein Benutzer mit aktiviertem WebAuthn-MFA erreicht nach Google-Primärlogin die Anwendung ohne zweiten Faktor.

**Kontrolle:** `SessionComposition` übergibt jede etablierte registrierte Session an das bestehende Assurance-Gate. `LoginStepUpGate` prüft den Supabase-AAL-Status; bei `nextLevel === 'aal2'` wird ein verifizierter WebAuthn-/TOTP-Faktor benötigt. Fehler und Timeouts bleiben fail-closed.

### Unbeabsichtigte AAL2-Abfrage ohne Enrollment

**Risiko:** Alle Google-Nutzer werden unabhängig von ihren Einstellungen zu WebAuthn gezwungen.

**Kontrolle:** Es wird kein clientseitiges "Passkey aktiviert"-Flag als Authority eingeführt. Maßgeblich bleibt ausschließlich der von Supabase ermittelte Assurance-Level/Faktorstatus. Ohne erforderliches `nextLevel=aal2` wird kein WebAuthn-Step-up ausgelöst.

### Entfernen des letzten echten MFA-Faktors

**Risiko:** Ein verpflichtetes Konto entfernt seinen letzten echten WebAuthn-/TOTP-Faktor, während ein alter Primärlogin-Passkey fälschlich als verbleibender MFA-Schutz gezählt wird.

**Kontrolle:** `mfaLastFactorGuard` zählt nur verifizierte native MFA-Faktoren sowie den bestehenden Legacy-TOTP-Status. Primärlogin-Passkeys ersetzen kein AAL2.

### Silent Credential Migration

**Risiko:** Bestehende Primärlogin-Passkeys werden ohne Benutzerinteraktion gelöscht, konvertiert oder neu registriert.

**Kontrolle:** Keine automatische Migration und keine externe Supabase-Mutation. Bestehende Credentials bleiben unangetastet. Ein AAL2-WebAuthn-Faktor wird ausschließlich durch eine neue, explizite Benutzeraktion in den Einstellungen registriert.

## Negative / Fail-Closed Cases

- Supabase nicht konfiguriert → Auth/Settings blockieren.
- CAPTCHA für E-Mail/Passwort fehlt/fehlschlägt → kein Primärlogin/Signup.
- OAuth-Start schlägt fehl → Fehlermeldung, keine künstliche lokale Session.
- AAL-Prüfung schlägt fehl oder läuft in Timeout → Step-up blockiert.
- WebAuthn-Faktorliste schlägt fehl → kein implizites AAL2-PASS.
- WebAuthn-Challenge schlägt fehl → Session wird nicht als AAL2 freigegeben.
- Letzter verpflichtender MFA-Faktor → UI-Guard verweigert Entfernung.

## Residual Risks

- Der Last-Factor-Guard bleibt eine clientseitige Self-Service-Schutzschicht und ersetzt keine serverseitige Autorisierung.
- Bereits vorhandene Primärlogin-Passkeys können weiterhin bei Supabase existieren, sind aber auf der kanonischen Loginseite nicht erreichbar.
- Änderungen an der externen Supabase Redirect-Allowlist sind nicht Bestandteil dieser repository-only Änderung und müssen bei Bedarf getrennt owner-gated verifiziert werden.

## Rollback

Human-reviewed Git-Revert. Da keine externe Provider-, Credential- oder Schema-Mutation erfolgt, ist kein Plattform-Rollback erforderlich.
