# ADR-0003.5: Owner-IAM, Passkey/2FA-Absicherung & zugriffsbeschränkte Systemzonen

* **Status:** ACCEPTED
* **Datum:** 2026-07-10
* **Autor:** Sven Kulessa
* **Sicherheits-Bereich:** Capital-AI Sicherheitsmanagement & Capital-AI Compliance
* **Proof of Concept Pfad:** `/src/components/SicherheitsmanagementPoC.tsx`
* **Voraussetzung für:** ADR-0007 Stufe 6 (Zertifizierungs-Wahrheitskennzeichnung) und den produktiven Rollout der Compliance-Wertschöpfungskette

---

## ⊞ CAPITAL-AI CORE — SECURITY MEMORANDUM

## Kontext
Die aktuelle Autorisierungsprüfung für Admin-/Owner-Funktionen (`AuditLog.tsx`, `AdminPortal.tsx`, `server/systemEvents.ts`, `server/documentHygiene.ts`) basiert auf einem Vergleich einer im Request mitgeschickten E-Mail-Adresse (`req.query.email` / `req.body.email`) gegen eine hartcodierte Liste (`ADMIN_EMAILS`). Diese Liste ist zusätzlich im ausgelieferten Frontend-Bundle sichtbar. Damit besteht faktisch keine Authentifizierung, sondern ein für jeden Client erratbarer bzw. auslesbarer String-Vergleich.

Da die geplante Compliance-Wertschöpfungskette (ADR-0007) explizit einen **unveränderlichen, rechtlich belastbaren Audit-Trail** sowie eine **klare Governance-Instanz (Owner)** voraussetzt, muss die Zugriffskontrolle vor Inbetriebnahme des Compliance-Moduls auf ein echtes IAM-Fundament gestellt werden. Gleichzeitig soll der Owner (Sven Kulessa, zwei private Accounts) auch im Kompromittierungsfall nie vollständig ausgesperrt werden können ("Break-Glass"-Prinzip), ohne dass dies erneut eine ausnutzbare Hintertür erzeugt.

Diese Richtlinie erweitert die Enterprise Architektur von **CAPITAL-AI** um zwei neue, tragende Kernmodule:
1. **Capital-AI Sicherheitsmanagement**: Erzwungene FIDO2/Passkey Multi-Faktor-Klassifizierung und Step-Up Tokens.
2. **Capital-AI Compliance**: Revisionssichere und krypto-grafisch signierte Rollen-Audit-Trails zur vollautomatischen Wertschöpfung.

---

## Entscheidung

### 1. Owner-Authentifizierung: Passkey (WebAuthn/FIDO2) als Primärfaktor
- Beide Owner-Accounts werden über **Supabase Auth** verwaltet mit **WebAuthn/Passkey** als primärer Anmeldemethode.
- Passwort-Login für die Owner-Rolle wird deaktiviert bzw. nur als Fallback mit erzwungenem 2FA zugelassen.
- **2FA (TOTP, z. B. via Authenticator-App)** ist für beide Owner-Accounts verpflichtend als zweiter Faktor hinterlegt — unabhängig vom Passkey, für Wiederherstellungsfälle.
- Owner-E-Mail-Adressen werden **nirgends im Quellcode, Frontend-Bundle oder Client-Request** referenziert. Die Rollenprüfung erfolgt ausschließlich serverseitig gegen die Supabase-`users`-Tabelle.

### 2. Rollenmodell (IAM)
Einführung eines Rollenfelds in der Supabase-`users`-Tabelle:

| Rolle | Rechte |
| :--- | :--- |
| `owner` | Vollzugriff, inkl. Break-Glass, Rollenverwaltung, `EXTERNALLY_VERIFIED`-Freigabe (ADR-0007 Stufe 6) |
| `admin` | Admin-Panel, Audit-Log lesen, keine Rollenverwaltung |
| `supervisor` | Zugriff auf Documentary/Master-Supervisor-Funktionen, kein Zugriff auf IAM-Einstellungen |
| `user` | Standardzugriff, kein Admin-Bereich |

Jede Rollenzuweisung/-änderung wird selbst als eigener `AuditLogs`-Eintrag (Typ `IAM`) protokolliert (wer, wann, von wem geändert).

### 3. Zeitlich begrenzte, signierte Tokens statt Query-Parameter
- Alle `/api/admin/*`-Routen prüfen künftig ein **signiertes Session-Token** (Supabase JWT) aus dem `Authorization`-Header, nicht mehr `req.query.email`/`req.body.email`.
- Token-Lebensdauer: kurze Standard-Session (z. B. 15–30 Minuten) für Admin-Rollen; kritische Owner-Aktionen (Rollenänderung, Break-Glass, `EXTERNALLY_VERIFIED`-Freigabe) verlangen **Step-up-Auth** (erneute Passkey-/2FA-Bestätigung unmittelbar vor der Aktion), unabhängig von der laufenden Session.
- Abgelaufene/ungültige Tokens führen zu 401, wiederholte Fehlversuche zu Rate-Limiting mit Protokollierung.

### 4. Zugriffsbeschränkte Systemzonen
- Verzeichnisse/Endpunkte mit erhöhter Sensitivität (`/server/config`, Audit-Log-Exporte, Rollenverwaltung, `.env`/Secrets) werden über serverseitige IAM-Prüfung pro Rolle gesperrt, nicht über Frontend-Sichtbarkeit allein.
- Zugriff auf diese Zonen wird unabhängig vom regulären Audit-Log in einem eigenen, restriktiveren Protokoll (`IAM_ACCESS_LOG`) mit Zeitstempel, Rolle, Token-ID (nicht das Token selbst) erfasst.

### 5. Break-Glass-Mechanismus (Owner-Notzugriff)
- Getrennter Wiederherstellungspfad, ausschließlich für die Rolle `owner`, aktivierbar nur mit 2FA **und** einem zusätzlichen Recovery-Faktor (z. B. Supabase-Recovery-Codes, sicher offline hinterlegt).
- Jede Nutzung des Break-Glass-Pfads erzeugt automatisch einen hervorgehobenen `IAM`-Alarm-Eintrag und (sofern konfiguriert) eine Benachrichtigung an eine hinterlegte, nicht öffentlich sichtbare Kontaktadresse.
- Break-Glass ändert niemals stillschweigend Rollen oder Daten — er stellt ausschließlich Zugriff wieder her; alle Folgeaktionen laufen über den normalen, protokollierten IAM-Pfad.

---

## Proof of Concept (PoC)
Als funktionales Fundament und Validierung dieser anspruchsvollen Architektur wurde ein interaktiver Proof of Concept (PoC) implementiert:
* **PoC-Pfad:** `/src/components/SicherheitsmanagementPoC.tsx`
* **Features des PoC:**
  - Simulation der Rollen-Basierten JWT Token-Generierung.
  - Simulierte WebAuthn/Passkey Registrierung & Verifizierung.
  - Step-Up Authentifizierungsschleife für kritische Stufe 6 Freigaben.
  - Echtzeit-Visualisierung der zugriffsbeschränkten Zonen (`/server/config`).
  - Anonymisierter und maskierter Audit-Trail (`IAM_ACCESS_LOG`) gemäß DSGVO.

---

## Konsequenzen

**Vorteile:**
- Schließt die aktuell aktiv ausnutzbare Authentifizierungslücke (Query-Parameter-Vergleich).
- Owner behält nachweisbar die letzte Instanz, auch bei Kompromittierungsversuchen — aber über einen gehärteten, protokollierten Pfad statt einer im Code sichtbaren Bypass-Liste.
- Schafft die Vertrauensbasis, die ADR-0007 für einen glaubwürdigen Audit-Trail voraussetzt.

**Herausforderungen:**
- Zusätzlicher Implementierungsaufwand (WebAuthn-Integration, Step-up-Auth, getrenntes IAM-Access-Log).
- Recovery-Codes/2FA-Secrets müssen sicher (offline, verschlüsselt) verwahrt werden — Verlust beider Owner-Faktoren gleichzeitig darf nicht zum vollständigen Systemausschluss führen, erfordert also einen definierten, dokumentierten Notfallprozess außerhalb der Anwendung selbst.
- Bestehende Client-Aufrufe (`?email=...`) müssen plattformweit auf Token-basierte Requests umgestellt werden — Breaking Change für alle Admin-Komponenten.
