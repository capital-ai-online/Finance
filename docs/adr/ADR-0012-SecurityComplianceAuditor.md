# ADR-0012: SecurityComplianceAuditor Integration

- **Status:** Accepted
- **Datum:** 31.07.2026
- **Projekt:** Capital-AI / AIF-CORE
- **Version:** 0.6.0
- **Autor:** Capital-AI Architecture Governance

## Implementation-Status

✅ **COMPLETE** (verifiziert 2026-07-31, siehe ADR-0017)

Ergänzt gemäß der Konvention aus `docs/adr/README.md`, die zwei getrennte Statusfelder
fordert. Der ursprüngliche Entscheidungstext wurde nicht verändert.

**Umgesetzt**

- `src/components/SecurityComplianceAuditor.tsx` vorhanden, kaputter Import auf
  `server/compliance/types` behoben (diese Datei existiert jetzt), alle Aufrufe auf
  `authFetch()` umgestellt.
- Einbindung in `src/components/AdminPortal.tsx` verifiziert (Import Zeile 27, Verwendung Zeile 329)
- Frontend-Build erfolgreich, `tsc --noEmit`-Fehler für diese Komponente auf 0 reduziert
- Versionsangleichung auf 0.6.0 in `package.json` und `package-lock.json` erfolgt
- **Backend-Anbindung implementiert (ADR-0017).** Alle sieben Aufrufe unter
  `/api/compliance/*` (`dashboard`, `risk`, `certificates`, `run`, `certify`, `report`) sind
  in `server/compliance/router.ts` implementiert, gemountet in `server.ts`, und jeweils über
  `checkAdminAccess()` gegen `ADMIN_ZONE_ROLES` geschützt.
- 21 Scanner-Module (`server/compliance/scanners.ts`) liefern reale, zur Laufzeit berechnete
  Befunde aus Repository-, Migrations- und Registry-Zustand statt Demo-Daten.
- Persistenz über eigene Tabellen `compliance_runs`/`compliance_certificates`
  (`server/compliance/store.ts`, Migration `20260731000200_compliance_runs.sql`).

**Bewusst abweichend vom ursprünglichen ADR-Text (siehe ADR-0017 Abschnitt 4)**

- **Datenquelle korrigiert.** Abschnitt *Audit Logging* nennt `audit_logs_iam` und
  `iam_access_log` als Datenquellen. Diese Tabellen sind IAM-Ereignis-Logs
  (Actor/Target/Action-Schema) und für Compliance-Scan-Ergebnisse strukturell ungeeignet —
  diese Abweichung war bereits vor ADR-0017 als offener Punkt dokumentiert. Gelöst über
  eigene, zweckgebundene Tabellen statt Zweckentfremdung der IAM-Tabellen.

**Weiterhin offen**

- Security Review der neuen Endpunkte durch eine zweite Instanz (bereits im ADR als offen
  markiert).
- Die 21 Scanner sind statische Repository-Analysen, kein Ersatz für einen externen
  SAST-/Dependency-Scanner (siehe ADR-0017 Folgeentscheidung 3).

## Enterprise-Referenzen

Ergänzt zur Einbindung in Traceability Matrix und Knowledge Graph. Der Entscheidungsinhalt
bleibt davon unberührt.

- **ESS-0001-CONTRACTS Chapter 11** — Security & Compliance Contracts
- **ESS-0002** — Supervisor Architect (der ADR nennt unter *10. Folgeentscheidungen*
  ausdrücklich eine Supervisor-Integration)
- **ESS-0011 / ESS-0011-CONTRACTS** — Enterprise Traceability
- **ESS-0012 / ESS-0012-CONTRACTS** — Documentation Governance
- **ADR-0003.5** — Owner-IAM (liefert die referenzierten Tabellen `audit_logs_iam`,
  `iam_access_log`)
- **ADR-0017** — Backend-Implementierung (`server/compliance/*`), Datenquellen-Korrektur
- **Komponente** — `src/components/SecurityComplianceAuditor.tsx`, `server/compliance/*`

---

## Kontext

Capital-AI besitzt eine sicherheitsorientierte Architektur mit zentralem IAM, Audit Logging und Produktionskontrollen.

Im Rahmen der Erweiterung des Admin-Portals wurde der SecurityComplianceAuditor als zentrale Komponente zur Überwachung und Darstellung sicherheitsrelevanter Prüfungen eingeführt.

Während einer Produktionspipeline-Ausführung trat ein Build-Fehler auf:

Could not resolve "./SecurityComplianceAuditor"
from "src/components/AdminPortal.tsx"

Ursache war eine fehlende bzw. nicht synchronisierte Frontend-Komponente.

Nach Wiederherstellung der Datei konnte die Deployment-Pipeline erfolgreich durchlaufen werden.

---

## Entscheidung

Der SecurityComplianceAuditor wird als fester Bestandteil der Capital-AI Governance-Architektur integriert.

Die Komponente bleibt Bestandteil des Admin-Portals und dient als zentrale Oberfläche für:

- Sicherheitsstatus
- Compliance-Prüfungen
- IAM-Validierungen
- Audit-Übersicht
- Produktionskonformität

---

## Architektur

Die Integration erfolgt innerhalb der bestehenden Architektur:

Capital-AI Admin Portal

        |
        |
        v

SecurityComplianceAuditor

        |
        +----------------+
        |                |
        v                v

IAM System        Audit Logging

        |
        |
        v

Supabase Security Tables

---

## Verantwortlichkeiten

SecurityComplianceAuditor

Verantwortlich für:

- Anzeige des Sicherheitszustands
- Darstellung von Compliance-Ergebnissen
- Verbindung zu Audit-Daten
- Vorbereitung zukünftiger automatisierter Prüfungen

---

IAM Integration

Der Auditor berücksichtigt:

- Rollenmodell
- Owner/Admin Berechtigungen
- Step-Up Authentifizierung
- TOTP Anforderungen
- Zugriffskontrollen

---

Audit Logging

Datenquellen:

- "audit_logs_iam"
- "iam_access_log"

Ziel:

Nachvollziehbarkeit kritischer Aktionen gemäß Security Governance.

---

## Sicherheitsanforderungen

Der SecurityComplianceAuditor darf:

- keine Berechtigungen vergeben
- keine IAM-Regeln verändern
- keine Sicherheitsmechanismen umgehen
- keine Produktionsdaten manipulieren

Er besitzt ausschließlich:

- Leserechte
- Analysefunktion
- Reporting-Funktion

---

## Entwicklungs- und Produktionsrichtlinie

Entwicklungsumgebung

Erlaubt:

- UI-Entwicklung
- Mock-Datenstrukturen
- Dokumentation
- Testintegration

Nicht erlaubt:

- direkte Änderungen an Produktions-IAM
- direkte Änderungen an Produktionsdatenbanken

---

Produktionsumgebung

Aktive Integration:

- Supabase IAM
- Audit Logs
- Produktionsrollen
- Compliance Reports

---

## Versionierung

Die Integration gehört zu:

Capital-AI v0.6.0
AIF-CORE Governance Layer

Die Projektdateien müssen konsistent versioniert werden:

package.json:

{
  "name": "capital-ai",
  "version": "0.6.0"
}

package-lock.json muss synchronisiert werden.

---

## Deployment Anforderungen

Vor Produktionsfreigabe:

- [x] SecurityComplianceAuditor vorhanden
- [x] Frontend Build erfolgreich
- [x] AdminPortal Import geprüft
- [x] Deployment Pipeline erfolgreich
- [ ] Verbindung zu produktiven Audit-Daten validieren
- [ ] Security Review durchführen

---

## Konsequenzen

Vorteile

- zentrale Security Governance
- bessere Auditierbarkeit
- Vorbereitung automatisierter Compliance-Prüfungen
- bessere Produktionskontrolle

Nachteile

- zusätzliche Frontend-Komponente
- zusätzlicher Wartungsaufwand
- zukünftige Backend-Anbindung erforderlich

---

## Folgeentscheidungen

Folgende ADRs können darauf aufbauen:

- ADR — Automated Compliance Checks
- ADR — Security Event Monitoring
- ADR — Capital-AI Supervisor Integration
- ADR — Audit Report Export

---

Entscheidung:
Der SecurityComplianceAuditor bleibt Bestandteil der Capital-AI Architektur und wird als Governance-Komponente weiterentwickelt.
