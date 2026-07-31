ADR-0012 — SecurityComplianceAuditor Integration

Status: Accepted
Datum: 31.07.2026
Projekt: Capital-AI / AIF-CORE
Version: 0.6.0
Entscheidungsträger: Capital-AI Architecture Governance

---

1. Kontext

Capital-AI besitzt eine sicherheitsorientierte Architektur mit zentralem IAM, Audit Logging und Produktionskontrollen.

Im Rahmen der Erweiterung des Admin-Portals wurde der SecurityComplianceAuditor als zentrale Komponente zur Überwachung und Darstellung sicherheitsrelevanter Prüfungen eingeführt.

Während einer Produktionspipeline-Ausführung trat ein Build-Fehler auf:

Could not resolve "./SecurityComplianceAuditor"
from "src/components/AdminPortal.tsx"

Ursache war eine fehlende bzw. nicht synchronisierte Frontend-Komponente.

Nach Wiederherstellung der Datei konnte die Deployment-Pipeline erfolgreich durchlaufen werden.

---

2. Entscheidung

Der SecurityComplianceAuditor wird als fester Bestandteil der Capital-AI Governance-Architektur integriert.

Die Komponente bleibt Bestandteil des Admin-Portals und dient als zentrale Oberfläche für:

- Sicherheitsstatus
- Compliance-Prüfungen
- IAM-Validierungen
- Audit-Übersicht
- Produktionskonformität

---

3. Architektur

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

4. Verantwortlichkeiten

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

5. Sicherheitsanforderungen

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

6. Entwicklungs- und Produktionsrichtlinie

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

7. Versionierung

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

8. Deployment Anforderungen

Vor Produktionsfreigabe:

- [x] SecurityComplianceAuditor vorhanden
- [x] Frontend Build erfolgreich
- [x] AdminPortal Import geprüft
- [x] Deployment Pipeline erfolgreich
- [ ] Verbindung zu produktiven Audit-Daten validieren
- [ ] Security Review durchführen

---

9. Konsequenzen

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

10. Folgeentscheidungen

Folgende ADRs können darauf aufbauen:

- ADR — Automated Compliance Checks
- ADR — Security Event Monitoring
- ADR — Capital-AI Supervisor Integration
- ADR — Audit Report Export

---

Entscheidung:
Der SecurityComplianceAuditor bleibt Bestandteil der Capital-AI Architektur und wird als Governance-Komponente weiterentwickelt.
