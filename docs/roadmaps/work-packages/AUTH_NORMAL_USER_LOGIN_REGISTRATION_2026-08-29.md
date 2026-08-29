# WP-AUTH-NORMAL-USER-LOGIN-REGISTRATION-2026-08-29

## Status

`IMPLEMENTED / PR VALIDATION PENDING`

## Baseline

- Repository: `SvenKulessa/Finance`
- Basis vor Umsetzung: `main@60abba4d24986c2401922ec5eea27aa3f8fa63db`
- Branch: `fix/auth-normal-user-login-registration-google-20260829`
- Datum: 2026-08-29

## Anlass

Der kanonische `/login`-Pfad hatte E-Mail-/Passwort-Anmeldung und Selbstregistrierung im Zuge der Passkey-only-Härtung bewusst entfernt. `SessionComposition.handleLogin()` und `handleRegister()` blieben zusätzlich fail-closed. Damit konnte ein normaler Nutzer weder ein klassisches Konto registrieren noch sich mit E-Mail und Passwort anmelden.

Die aktuelle Owner-Vorgabe ersetzt diese Produktgrenze: normale Nutzer müssen sich wieder registrieren und mit E-Mail/Passwort anmelden können; Google OAuth muss parallel als regulärer Login erhalten bleiben.

## Korrelationsbefund

1. `LoginPage.tsx` ist der kanonische interaktive Auth-Einstiegspunkt für `/login`.
2. `SessionComposition.tsx` bleibt alleiniger Session-Projektionspunkt und erzwingt nach jeder von Supabase ausgestellten Session weiterhin `RegistrationCompletionGate` und `LoginStepUpGate`.
3. `RegistrationCompletionGate.tsx` ist bereits explizit für E-Mail/Passwort- und Google-OAuth-Neuregistrierungen ausgelegt.
4. `LoginStepUpGate.tsx` akzeptiert E-Mail/Passwort, Google OAuth und Passkey als Primärauthentisierung und erzwingt vorhandene AAL2-/MFA-Anforderungen.
5. Supabase-Produktionslogs vom 2026-08-29 zeigen erfolgreiche Google-Sequenzen `/authorize -> /callback -> /user 200`; der Google-Provider selbst ist daher nicht grundsätzlich ausgefallen.
6. Der bestehende `authFetch()`-Refresh-/Retry-Schutz sowie die bereits gemergte Authentisierung der Orchestrator-Stats-Widgets werden nicht verändert.
7. Kein offener Auth-PR und kein konkurrierender Auth-Branch wurde vor Beginn gefunden.

## Scope

### Code

- `src/features/public/ui/LoginPage.tsx`
  - E-Mail-/Passwort-Login wiederherstellen.
  - Selbstregistrierung normaler Nutzer wiederherstellen.
  - frisches hCaptcha-Token an `signInWithPassword()` und `signUp()` binden.
  - `full_name` bei Registrierung an Supabase übergeben.
  - E-Mail-Bestätigungsredirect auf den kanonischen `/login`-Pfad binden.
  - nativen Passkey und Google OAuth als parallele Anmeldeoptionen beibehalten.

### Regression

- `tests/unit/authPrimaryLoginRegression.test.ts`
  - E-Mail-/Passwort-Login und Registrierung als verpflichtete Funktionen absichern.
  - CAPTCHA-Bindung absichern.
  - Google OAuth und Passkey weiterhin absichern.
  - Konvergenz auf bestehendes Onboarding/MFA absichern.

## Nicht im Scope

- keine Änderung an Supabase-RLS, Auth-Provider-Konfiguration oder Secrets;
- keine Render-/Stripe-/Supabase-Produktionsmutation;
- keine Lockerung von `RegistrationCompletionGate` oder `LoginStepUpGate`;
- keine Abschaltung von Passkeys;
- keine Änderung an Owner-/M10-Passkey-Autorisierung;
- kein Passwort-Reset in diesem Work Package.

## Sicherheitsvertrag

- Supabase Auth bleibt die einzige Identity-/Session-Authority.
- E-Mail-/Passwort-Requests sind an ein frisches, nicht persistiertes hCaptcha-Token gebunden.
- Neue Konten umgehen weder verpflichtetes Profil-/Consent-Onboarding noch MFA.
- Bestehende Konten mit AAL2-Anforderung umgehen den Step-up nicht.
- Google OAuth behält den kanonischen `/login`-Callback und `select_account`.
- Keine Credentials, Tokens oder CAPTCHA-Werte werden persistiert oder geloggt.

## Akzeptanzkriterien

1. `/login` bietet sichtbar **Anmelden** und **Registrieren** für normale Nutzer.
2. Login verwendet Supabase `signInWithPassword()` mit hCaptcha.
3. Registrierung verwendet Supabase `signUp()` mit hCaptcha und `full_name`.
4. Registrierung mit aktiver E-Mail-Bestätigung zeigt einen neutralen Bestätigungshinweis; eine automatisch ausgestellte Session läuft direkt in die bestehenden Gates.
5. Google OAuth bleibt sichtbar und unverändert über Supabase `signInWithOAuth({ provider: 'google' })` erreichbar.
6. Native Passkeys bleiben verfügbar, sofern der bestehende Feature-Flag aktiv ist.
7. Onboarding und AAL/MFA bleiben fail-closed.
8. Klasse-C-PR-Checks und `build-and-test` müssen vor Merge PASS sein.

## Rollback

Repository-only: Human-reviewed `git revert` des späteren Merge-Commits. Es gibt keine externe Plattformmutation zurückzusetzen.
