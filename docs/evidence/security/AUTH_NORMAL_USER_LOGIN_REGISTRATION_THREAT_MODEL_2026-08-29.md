# Threat Model — Normaler Nutzer-Login, Registrierung und Google OAuth

**Datum:** 2026-08-29  
**Work Package:** `WP-AUTH-NORMAL-USER-LOGIN-REGISTRATION-2026-08-29`  
**Scope:** kanonischer Website-Primärlogin auf `/login`

## 1. Schutzgüter

- Benutzer-Credentials und Account-Integrität.
- Supabase-Session und Refresh-Token-Lifecycle.
- Verbindliche Profil-/Consent-Daten neuer Konten.
- MFA-/AAL2-Status bestehender und neuer Konten.
- OAuth-State und Redirect-Integrität.
- Schutz vor automatisierter Registrierung und Credential-Stuffing.

## 2. Trust Boundaries

1. Browser ↔ LEGACY_CHALLENGE_PROVIDER für kurzlebige Bot-Schutz-Tokens.
2. Browser ↔ Supabase Auth für Passwort-, Passkey- und Google-Primärauthentisierung.
3. Supabase Auth-Session ↔ `SessionComposition` als lokale Session-Projektion.
4. Session ↔ `RegistrationCompletionGate` für verpflichtetes Onboarding.
5. Session ↔ `LoginStepUpGate` für AAL-/MFA-Verifikation.

Es wird keine neue Identity-Authority eingeführt. Supabase bleibt alleinige Authentisierungs- und Session-Authority.

## 3. Bedrohungen und Kontrollen

| Bedrohung | Risiko | Kontrolle |
| --- | --- | --- |
| Credential-Stuffing / automatisierte Loginversuche | Kontoübernahme | frisches LEGACY_CHALLENGE_PROVIDER-Token für jeden Passwort-Login; Supabase-Auth-Rate-/Password-Controls bleiben maßgeblich |
| Bot-/Massenregistrierung | Missbrauch / Kosten / Spam | frisches LEGACY_CHALLENGE_PROVIDER-Token für `signUp()` |
| Account Enumeration | Offenlegung registrierter Accounts | keine eigene Account-Lookup-Logik; Supabase-Verhalten und neutrale UI-Nachrichten werden beibehalten |
| MFA-Bypass durch neuen Passwortpfad | Privilegieneskalation | jede erfolgreiche Supabase-Session konvergiert unverändert auf `LoginStepUpGate`; AAL2 bleibt fail-closed |
| Onboarding-/Consent-Bypass bei Selbstregistrierung | Compliance-Verstoß | neue Sessions konvergieren unverändert auf `RegistrationCompletionGate` |
| OAuth-State-/Callback-Manipulation | Session-Hijacking | OAuth bleibt vollständig bei Supabase; Redirect ist auf `${origin}/login` gebunden und muss in der Supabase-Allowlist liegen |
| Token-/CAPTCHA-Leak | Account-/Bot-Schutz-Kompromittierung | Tokens werden weder in Local/Session Storage persistiert noch geloggt; Service-Role/Secrets bleiben serverseitig |
| Parallel konkurrierende Auth-Authority | Session-Desynchronisation | keine zweite Sessionverwaltung; alle Primärmethoden verwenden denselben Supabase-Client und dieselbe `SessionComposition` |
| Passkey-only-Sicherheitsvertrag wird unbemerkt aufgeweicht | Governance-Drift | Work Package und Regressionstest dokumentieren die durch Owner-Vorgabe geänderte Produktgrenze explizit |

## 4. Negative / Fail-Closed Erwartungen

- fehlende Supabase-Konfiguration → Login/Registrierung werden blockiert;
- fehlender/fehlerhafter LEGACY_CHALLENGE_PROVIDER-Token → Passwort-Login/Registrierung dürfen keine Session erzeugen;
- ungültige Credentials → keine lokale Fallback-Session;
- neue Registrierung ohne bestätigte E-Mail, sofern Supabase Email Confirmation aktiv ist → keine künstliche lokale Session; UI fordert Bestätigung an;
- AAL2 erforderlich, Faktor fehlt/Fehler/Timeout → privater Zugriff bleibt blockiert;
- verpflichtetes Onboarding offen → privater Zugriff bleibt blockiert;
- Google OAuth-Startfehler → sichtbarer Fehler, kein alternativer lokaler Auth-Bypass.

## 5. Verifikation

- Regressionstest `tests/unit/authPrimaryLoginRegression.test.ts` schützt die drei Primärwege und deren CAPTCHA-/Gate-Konvergenz.
- Supabase-Produktions-Auth-Logs wurden vor Umsetzung geprüft; erfolgreiche Google-OAuth-Sequenzen waren vorhanden. Daher ist keine Provider-Neukonfiguration Teil dieses Changes.
- Klasse-C-Required-Checks nach PR-Erstellung sind merge-blockierend maßgeblich.

## 6. Residual Risk

- Wirksamkeit von LEGACY_CHALLENGE_PROVIDER hängt von korrekter öffentlicher Site-Key- und Supabase-CAPTCHA-Konfiguration ab.
- Passwortqualität/Leak-Erkennung wird durch Supabase-Projektpolicy bestimmt und in diesem repository-only Change nicht mutiert.
- Die OAuth-Redirect-Allowlist ist externe Supabase-Konfiguration und wird hier nicht verändert.

## 7. Rollback

Keine externe Mutation. Bei Regression wird ausschließlich der Human-reviewed Merge-Commit revertiert. Bestehende Benutzer-, MFA- und Provider-Konfigurationen bleiben davon unberührt.

