# ADR-0003.5: Owner-IAM, Passkey/2FA-Absicherung & zugriffsbeschränkte Systemzonen

* **Status:** ACCEPTED
* **Implementation-Status:** 🟡 IN PROGRESS — M5A REVALIDATION (2026-08-12)
* **Datum:** 2026-07-10
* **Reaktiviert:** 2026-08-12 gemäß `docs/adr/README.md`, da eine Regression/Assurance-Lücke im als resolved geführten TOTP-Scope nachgewiesen wurde.
* **M5A Authority:** ESS-0020 + ADR-0064
* **Sicherheits-Bereich:** Capital-AI Sicherheitsmanagement & Capital-AI Compliance

## M5A Revalidation — 2026-08-12

Die ursprüngliche IAM-Härtung bleibt in wesentlichen Teilen gültig: JWT-only Admin-Auth, serverseitige Rollenprüfung, Break-Glass-Prinzip, Rate-Limiting, Audit/Access-Logging und purpose-bound Step-Up sind weiterhin Architekturbestandteile.

Der frühere `✅ COMPLETE`-Status ist für den TOTP-/Owner-MFA-Scope jedoch nicht mehr haltbar:

- beide Owner-Profile haben `totp_enabled=true` im CAPITAL-AI-Legacy-Modell;
- Supabase Auth besitzt produktiv **0 native MFA-Faktoren**;
- produktiv bestehen **0 AAL2-Sessions**;
- der eigene TOTP-Flow in `server/stepUp.ts` erzeugt einen CAPITAL-AI-Step-Up-Token, aber keinen Supabase-AAL2-Nachweis;
- `checkAdminAccess()` erzwingt derzeit keinen `aal2`-Claim;
- die Login-Step-Up-Logik kann bei Status-/Netzwerkfehlern fail-open werden;
- Passkey kann den Login-Step-Up alleine erfüllen, obwohl die ursprüngliche Entscheidung TOTP für Owner unabhängig vom Passkey vorsieht.

Deshalb wird dieser ADR aus `resolved/` zurück in den aktiven ADR-Bestand verschoben. ESS-0020 und ADR-0064 definieren die M5A-Remediation. Nach erfolgreicher Native-MFA-/AAL2-Verifikation kann ADR-0003.5 erneut als vollständig verifiziert klassifiziert werden.

---

## ⊞ CAPITAL-AI CORE — SECURITY MEMORANDUM

## Kontext

Die ursprüngliche Autorisierungsprüfung für Admin-/Owner-Funktionen basierte auf einem Vergleich einer im Request mitgeschickten E-Mail-Adresse gegen eine hartcodierte Liste. Damit bestand faktisch keine belastbare Authentifizierung. ADR-0003.5 ersetzte dieses Modell durch Supabase-Session-IAM, Step-Up, Recovery und Auditierung.

Da die Compliance-Wertschöpfungskette einen unveränderlichen Audit-Trail sowie eine klare Governance-Instanz voraussetzt, muss die Zugriffskontrolle auf einem echten IAM-Fundament bleiben. Gleichzeitig soll der Owner auch im Kompromittierungs-/Recovery-Fall nicht durch einen unsicheren Bypass wieder freigeschaltet werden.

## Entscheidung

### 1. Owner-Authentifizierung

- Owner-Accounts werden über **Supabase Auth** verwaltet.
- Passkey/WebAuthn bleibt ein starker primärer bzw. zusätzlicher Authentifizierungsmechanismus.
- **TOTP ist für Owner als zweiter Faktor verpflichtend.** Nach M5A gilt hierfür ausschließlich der in ESS-0020/ADR-0064 definierte Supabase-Native-MFA-/AAL2-Nachweis als Authority.
- Owner-E-Mail-Adressen werden nicht als Autorisierungsmerkmal im Client oder Request verwendet.
- Eine gültige IAM-Rolle ohne erforderliches AAL2 reicht für privilegierte Owner/Admin-Aktionen nicht aus.

### 2. Rollenmodell

| Rolle | Rechte |
|---|---|
| `owner` | Vollzugriff inkl. Break-Glass, Rollenverwaltung und kritische Freigaben — jeweils unter den erforderlichen Step-Up/AAL2-Gates |
| `admin` | Admin-Panel und definierte Admin-Funktionen; privilegierte Aktionen benötigen AAL2 gemäß ESS-0020 |
| `supervisor` | Zugriff auf Documentary/Master-Supervisor-Funktionen gemäß Capability-/Policy-Regeln |
| `user` | Standardzugriff, kein Admin-Bereich |

Rollenänderungen bleiben auditpflichtig.

### 3. Session-Token und Step-Up

- `/api/admin/*` und andere privilegierte Routen verwenden verifizierte Supabase-Bearer-Tokens, nicht E-Mail-Queryparameter.
- Kritische Owner-Aktionen verlangen zusätzliche frische, zweckgebundene Step-Up-Evidence.
- M5A stellt klar: ein CAPITAL-AI-eigener `x-step-up-token` ist nur **Defense-in-Depth über einer gültigen AAL2-Session**. Er darf AAL2 nicht ersetzen oder simulieren.
- Ungültige, abgelaufene, AAL1- oder stale Sessions führen fail-closed zur Ablehnung.

### 4. Zugriffsbeschränkte Systemzonen

- Sensible Endpunkte werden serverseitig per IAM + erforderlichem AAL2 geschützt.
- Frontend-Sichtbarkeit ist keine Security Boundary.
- Zugriffe bleiben in `IAM_ACCESS_LOG` bzw. den aktuellen Audit-Authorities nachvollziehbar.

### 5. Break-Glass

- Break-Glass bleibt ausschließlich Owner-Recovery.
- Recovery darf niemals Rollen erhöhen oder einen künstlichen AAL2-Zustand erzeugen.
- Native MFA-Faktor-Reset wird nach M5A ausschließlich über einen Owner-kontrollierten, auditierten Serverpfad und unterstützte Supabase-Admin-MFA-Operationen ausgeführt.
- Unabhängige Passkeys dürfen nicht mehr automatisch als Nebeneffekt eines TOTP-Resets gelöscht werden, sofern dies nicht separat freigegeben ist.
- Bestehende Legacy-Recovery-Codes bleiben nur als Übergangsmechanismus erhalten, bis Native-MFA-Recovery verifiziert wurde.

## M5A Konsequenzen

### Beibehalten

- Supabase als Identitäts-/Session-Authority;
- IAM-Rollenmodell;
- Rate-Limiting;
- Audit/Access Logging;
- purpose-bound, single-use Step-Up als zusätzliche Kontrolle;
- Owner-kontrolliertes Break-Glass-Prinzip.

### Zu ersetzen/härten

- eigener TOTP als Autorisierungs-Authority → Supabase Native MFA;
- `profiles.totp_enabled` als MFA-Status → native Faktoren/AAL;
- fail-open Login-Step-Up für privilegierte Identitäten → fail-closed;
- Rolle-only Admin-Zugriff → Rolle + AAL2;
- Passkey-alone als generischer Owner-Step-Up → tatsächliche AAL-Evidence gemäß ESS-0020.

## Verification Gate

ADR-0003.5 darf erst wieder nach `docs/adr/resolved/` verschoben und als `✅ COMPLETE` markiert werden, wenn M5A folgende Evidence liefert:

1. Native TOTP enroll → challenge → verify PASS;
2. beide Owner-Identitäten verfügen über verifizierte Native-MFA-Faktoren;
3. privilegierte AAL1-/stale-/error-Pfade DENY;
4. serverseitige AAL2-Enforcement ist zentral implementiert;
5. Recovery/Backup-Verfahren PASS;
6. Security Advisor nach Mutation erneut geprüft;
7. CI und M5A Evidence `VERIFIED PASS`;
8. Roadmap/Traceability auf finalen Merge-/Mutation-Stand synchronisiert.
