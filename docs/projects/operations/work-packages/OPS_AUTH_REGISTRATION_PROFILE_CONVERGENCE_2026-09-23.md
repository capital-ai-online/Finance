# OPS-AUTH-REGISTRATION-PROFILE-01 — Registrierung, Profil und Security konvergieren

**Owner:** CAPITAL-AI-OPS  
**PVC:** PVC-02 / PVC-08 / PVC-18  
**Baseline:** `main@f4b00e7c04e3b4c68a84d9c70936da692be3f570`

## Owner-Richtung

Die produktive Registrierung wird auf einen vollständig backend-owned Supabase-Auth-Pfad konvergiert. Das bestehende Branding von `capital-ai.online` bleibt erhalten. Der abgelöste externe Challenge-Provider wird vollständig aus dem aktuellen Repository-Tree entfernt und providerseitig deaktiviert. Passkey bleibt bis zum anschließenden Owner-Benutzertest gesperrt.

## Scope

- Pflichtfelder Name, E-Mail, Passwort und Passwortbestätigung mit getrennten Nachweisen für AGB-Akzeptanz und Datenschutzkenntnisnahme; Marketing bleibt optional.
- Transaktionale Anlage von Profil, Free-Subscription und versionsgebundenen Nachweisen beim Auth-User-Insert.
- Verlustfreie Migration der Legacy-Nutzer- und Nutzungsdaten auf `auth.users.id`, danach Entfernung von `public.users`.
- Persistentes Profil mit privatem Avatar-Bucket, serverseitiger Dateitypprüfung und kurzlebigen signierten URLs.
- Backend-verifizierte Security-Ansicht für Passwort und native TOTP-Aktivierung; Passkey bleibt deaktiviert.
- Gebrandete Bestätigungs- und Recovery-Mailvorlagen mit Token-Hash-Rückweg über die bestehende HttpOnly-Session.
- Idempotente Supabase-Auth-Konfigurationskontrolle mit Read-before-write und Read-after-write bei Render-Start.

## Nachweise vor Mutation

- `public.users`: 2 Zeilen, beide eindeutig zu `auth.users` zugeordnet.
- `usage_log`: 46 Zeilen, alle 46 verlustfrei zuordenbar, 0 Orphans.
- Supabase Security Advisor: ausschließlich Auth-Warnung `auth_leaked_password_protection`; die Zielkonfiguration aktiviert diesen Schutz.
- Current-main-Korrelation: 18 neue Dateien seit der ersten Baseline, kein Changed-File-Overlap mit diesem Paket.

## Sicherheitsgrenzen

- Keine Supabase-Session oder Secret-/Service-Role-Credentials im Browser.
- Avatar-Bucket privat; kein direktes Browser-RLS-Schreibrecht.
- Registrierung bleibt fail-closed, wenn E-Mail-Bestätigung providerseitig nicht aktiv ist.
- Konten-Enumeration bleibt unterdrückt; Mail- und Credential-Endpunkte bleiben rate-limitiert.
- Migration bricht vor dem Entfernen der Legacy-Tabelle ab, falls auch nur ein Datensatz nicht zugeordnet werden kann.
- Human/CODEOWNER-Merge und kanonischer Migrations-/Deploy-Pfad bleiben erforderlich.

## Exit Gate

Exakter Branch-Head: Build/Test/Governance PASS; Supabase-Migration PASS; Security Advisor ohne Auth-Warnung; produktiver Registrierungstest einschließlich Bestätigungsmail, Login, Free-Badge, Profil, Avatar, TOTP und Passwort-Recovery. Erst danach kann der Owner Passkey freigeben.
