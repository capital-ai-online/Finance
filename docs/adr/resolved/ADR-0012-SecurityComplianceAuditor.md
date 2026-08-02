# ADR-0012: SecurityComplianceAuditor Integration

- **Status:** Accepted
- **Datum:** 31.07.2026
- **Projekt:** Capital-AI / AIF-CORE
- **Version at decision:** 0.6.0
- **Autor:** Capital-AI Architecture Governance

## Implementation-Status

✅ **COMPLETE** (verifiziert 2026-08-02; ursprüngliche Implementierungsfreigabe über ADR-0017)

Die ursprüngliche Architekturentscheidung ist vollständig umgesetzt. Seit der ersten Verifikation
wurde das produktive Compliance-Backend im Zuge der Plattformstruktur-Härtung physisch von
`server/compliance/` nach `src/platform/Compliance/` verschoben. Diese Pfadänderung verändert den
Entscheidungsinhalt nicht; sie korrigiert lediglich die Repository-Zuordnung zur ESS-0006-Komponente.

**Verifizierte Umsetzung**

- `src/components/SecurityComplianceAuditor.tsx` ist vorhanden und im Admin-Portal eingebunden.
- Die UI verwendet authentifizierte Backend-Aufrufe statt einer rein lokalen Mock-Oberfläche.
- Das Backend ist unter `src/platform/Compliance/router.ts` implementiert und stellt die benötigten
  `/api/compliance/*`-Routen bereit (`dashboard`, `risk`, `certificates`, `run`, `certify`, `report`).
- Sämtliche Compliance-Routen sind serverseitig über `checkAdminAccess()` und die zulässigen
  Admin-Zonenrollen geschützt.
- Die Scanner unter `src/platform/Compliance/scanners.ts` prüfen reale Repository-, Security-,
  Migrations- und Governance-Zustände und besitzen zusätzlich die dokumentierte interne
  ISO/IEC-27001:2022-Annex-A-Zuordnung.
- Persistenz erfolgt über die zweckgebundenen Compliance-Run-/Certificate-Strukturen statt über
  zweckfremde IAM-Audit-Tabellen.
- Die Compliance-Komponente ist im Manifest als `implemented` geführt und referenziert ADR-0012.
- TypeScript-, Unit-Test- und Production-Build-Gates wurden nach der Plattformmigration erfolgreich
  verifiziert.

**Bewusste Abweichung vom ursprünglichen ADR-Text**

Der ursprüngliche Abschnitt *Audit Logging* nannte `audit_logs_iam` und `iam_access_log` als
Datenquellen. Diese Tabellen bilden IAM-Aktionen ab und sind strukturell nicht für Compliance-Scan-
Resultate ausgelegt. ADR-0017 führte deshalb zweckgebundene Compliance-Persistenz ein. Diese
Korrektur verbessert die Datenintegrität und schwächt die Entscheidung nicht ab.

**Nicht Teil des Implementation-Status**

- Eine unabhängige zweite Security-Review-Instanz bleibt als betriebliche Assurance-Maßnahme
  sinnvoll, ist aber kein fehlender Codepfad dieser ADR.
- Die internen Scanner ersetzen keinen externen SAST-/Dependency-/Zertifizierungsauditor.
- Compliance-Berichte und ISO-Zuordnungen sind interne Nachweise und keine behördliche oder
  rechtliche Zertifizierung.

## Enterprise-Referenzen

- **ESS-0001-CONTRACTS Chapter 11** — Security & Compliance Contracts
- **ESS-0006** — Security & Compliance Component Specification
- **ESS-0002** — Supervisor Architect
- **ESS-0011 / ESS-0011-CONTRACTS** — Enterprise Traceability
- **ESS-0012 / ESS-0012-CONTRACTS** — Documentation Governance
- **ADR-0003.5** — Owner-IAM
- **ADR-0017** — Backend-/Persistenz-Implementierung
- **Komponenten** — `src/components/SecurityComplianceAuditor.tsx`, `src/platform/Compliance/*`

---

## Kontext

Capital-AI besitzt eine sicherheitsorientierte Architektur mit zentralem IAM, Audit Logging und
Produktionskontrollen.

Im Rahmen der Erweiterung des Admin-Portals wurde der SecurityComplianceAuditor als zentrale
Komponente zur Überwachung und Darstellung sicherheitsrelevanter Prüfungen eingeführt.

Während einer Produktionspipeline-Ausführung trat ursprünglich ein Build-Fehler auf:

```text
Could not resolve "./SecurityComplianceAuditor"
from "src/components/AdminPortal.tsx"
```

Ursache war eine fehlende bzw. nicht synchronisierte Frontend-Komponente. Nach Wiederherstellung der
Datei konnte die Deployment-Pipeline erfolgreich durchlaufen werden.

---

## Entscheidung

Der SecurityComplianceAuditor wird als fester Bestandteil der Capital-AI Governance-Architektur
integriert.

Die Komponente bleibt Bestandteil des Admin-Portals und dient als zentrale Oberfläche für:

- Sicherheitsstatus
- Compliance-Prüfungen
- IAM-Validierungen
- Audit-Übersicht
- Produktionskonformität

---

## Architektur

```text
Capital-AI Admin Portal
        |
        v
SecurityComplianceAuditor
        |
        +--------------------+
        |                    |
        v                    v
Security / IAM        Compliance Backend
                             |
                             v
                  zweckgebundene Evidence-/
                  Run-/Certificate-Persistenz
```

---

## Verantwortlichkeiten

### SecurityComplianceAuditor

Verantwortlich für:

- Anzeige des Sicherheitszustands
- Darstellung von Compliance-Ergebnissen
- Verbindung zu Audit-/Compliance-Daten
- Reporting und Remediation-Übersicht

### IAM Integration

Der Auditor berücksichtigt:

- Rollenmodell
- Owner/Admin-Berechtigungen
- Step-Up-Authentifizierung
- TOTP-Anforderungen
- Zugriffskontrollen

### Audit / Evidence

IAM-Ereignisse und Compliance-Scan-Ergebnisse bleiben getrennte Datenklassen. Compliance-Resultate
werden nicht in IAM-Tabellen gepresst, sondern über die dafür vorgesehenen Compliance-Strukturen
geführt.

---

## Sicherheitsanforderungen

Der SecurityComplianceAuditor darf:

- keine Berechtigungen vergeben
- keine IAM-Regeln verändern
- keine Sicherheitsmechanismen umgehen
- keine Produktionsdaten außerhalb der freigegebenen Compliance-Workflows manipulieren

Seine Governance-Rolle bleibt Analyse-, Reporting- und kontrollierte Compliance-Ausführung innerhalb
der serverseitig autorisierten Endpunkte.

---

## Entwicklungs- und Produktionsrichtlinie

### Entwicklungsumgebung

Erlaubt:

- UI-Entwicklung
- Testdatenstrukturen, sofern eindeutig als Test gekennzeichnet
- Dokumentation
- Testintegration

Nicht erlaubt:

- direkte Änderungen an Produktions-IAM
- direkte Änderungen an Produktionsdatenbanken

### Produktionsumgebung

Aktive Integration:

- Supabase IAM
- Audit-/Security-Evidence
- Produktionsrollen
- Compliance Runs / Reports / Certificates

---

## Versionierung

Die Entscheidung wurde für Capital-AI `0.6.0` getroffen. Die aktuelle Plattformversion bleibt über
ADR-0030 / `package.json#version` geregelt; diese ADR führt keine eigene Versionshoheit ein.

---

## Deployment-Anforderungen — Abschlussstand

- [x] SecurityComplianceAuditor vorhanden
- [x] Frontend Build erfolgreich
- [x] AdminPortal Import geprüft
- [x] Backend-Routen vorhanden und autorisiert
- [x] produktive Compliance-Evidence-Persistenz angebunden
- [x] Scanner und Reports mit Tests / Build-Gates verifiziert

Eine unabhängige Security Review bleibt als zusätzliche Assurance-Maßnahme empfehlenswert, ohne den
bereits implementierten Architecture Contract wieder auf `IN PROGRESS` zu setzen.

---

## Konsequenzen

### Vorteile

- zentrale Security-/Compliance-Governance-Oberfläche
- bessere Auditierbarkeit
- automatisierte, repository-basierte Compliance-Prüfungen
- kontrollierte Remediation- und Reporting-Pfade
- zweckgebundene Evidence-Persistenz

### Nachteile / Grenzen

- zusätzlicher Wartungsaufwand
- interne Scanner ersetzen keine externen regulatorischen oder unabhängigen Prüfungen
- Aussagen müssen strikt als interne Governance-/Compliance-Nachweise gekennzeichnet bleiben

---

## Implementation Evidence

- `src/components/SecurityComplianceAuditor.tsx`
- `src/components/AdminPortal.tsx`
- `src/platform/Compliance/router.ts`
- `src/platform/Compliance/scanners.ts`
- `src/platform/Compliance/store.ts`
- `src/platform/Compliance/manifest.json`
- `tests/unit/complianceScanners.test.ts`
- ADR-0017
- Commit `52fd5fb04756bba1f608e8e279597fc98230ee94` — physische Plattformmigration von Security/Compliance

**Entscheidung:** SecurityComplianceAuditor bleibt Bestandteil der Capital-AI Architektur; die
Integration ist codebasiert umgesetzt und verifiziert.
