# ADR-0012: SecurityComplianceAuditor Integration

- **Status:** Accepted
- **Datum:** 31.07.2026
- **Projekt:** Capital-AI / AIF-CORE
- **Version:** 0.6.0
- **Autor:** Capital-AI Architecture Governance

## Implementation-Status

🟡 **IN PROGRESS** (verifiziert 2026-07-31)

Ergänzt gemäß der Konvention aus `docs/adr/README.md`, die zwei getrennte Statusfelder
fordert. Der ursprüngliche Entscheidungstext wurde nicht verändert.

**Umgesetzt**

- `src/components/SecurityComplianceAuditor.tsx` vorhanden (695 Zeilen)
- Einbindung in `src/components/AdminPortal.tsx` verifiziert (Import Zeile 27, Verwendung Zeile 329)
- Frontend-Build erfolgreich
- Versionsangleichung auf 0.6.0 in `package.json` und `package-lock.json` erfolgt

**Offen**

- **Backend-Anbindung fehlt vollständig.** Die Komponente ruft sieben Endpunkte unter
  `/api/compliance/*` auf (`dashboard`, `risk`, `certificates`, `run`, `certify`, `report`).
  Keiner dieser Endpunkte existiert in `server.ts` oder `server/*.ts`. Sämtliche Aufrufe
  laufen derzeit ins Leere.
- **Abweichung zwischen ADR und Implementierung.** Abschnitt *Audit Logging* nennt
  `audit_logs_iam` und `iam_access_log` als Datenquellen. Die Komponente referenziert keine
  dieser Tabellen, sondern ausschließlich die genannte REST-Schnittstelle.
- Verbindung zu produktiven Audit-Daten validieren (bereits im ADR als offen markiert)
- Security Review durchführen (bereits im ADR als offen markiert)

**Bewertung**

Die unter *6. Entwicklungs- und Produktionsrichtlinie* beschriebene aktive Produktions-
integration mit Supabase IAM, Audit Logs und Compliance Reports ist derzeit **nicht**
gegeben. Die Komponente ist eingebunden, jedoch ohne Datengrundlage funktionslos.

Dieser Befund wurde durch eine Traceability-Prüfung ermittelt und ist ein Anwendungsfall der
Verknüpfungsart `DECIDES` aus ESS-0011-CONTRACTS: Die Entscheidung existiert, das
umsetzende Artefakt existiert, die Verbindung zur beschriebenen Datenquelle fehlt.

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
- **Komponente** — `src/components/SecurityComplianceAuditor.tsx`

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
