---
skill:
  id: ESS-0006
  name: Security & Compliance
  version: 1.0.0
  status: Enterprise Approved
  maturity: Gold Standard
  owner: Platform Director
  category: Enterprise Architecture
  priority: Critical

capital_ai:
  platform: CAPITAL-AI Core
  repository: Finance
  architecture: Enterprise
  lifecycle: AI Native Development Lifecycle

classification:
  type: Component Specification
  role: Komponentenspezifikation Security Center und Compliance Center
  contractAuthority: ESS-0001-CONTRACTS
  note: >
    Dieses Dokument spezifiziert ausschliesslich die Komponenten
    src/platform/Security und src/platform/Compliance. Saemtliche Sicherheits- und
    Compliance-Regeln verbleiben in ESS-0001-CONTRACTS Chapter 11.

authority:

  controls:
    - Security Classification Registry
    - Audit Trail
    - Risk Register
    - Compliance Evidence
    - Security Review Verfahren

  collaborates:
    - Documentary Engine
    - Supervisor
    - Platform Director
    - Quality Center
    - Version Manager
    - Release Center

  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - Audit Trail Eintraege
    - IAM Regeln
    - Berechtigungen

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
  relatedEss:
    - ESS-0002
    - ESS-0003
    - ESS-0005
    - ESS-0011
    - ESS-0012
  relatedAdr:
    - ADR-0003.5
    - ADR-0007
    - ADR-0009
    - ADR-0012
    - ADR-0016
  relatedComponents:
    - src/platform/Security
    - src/platform/Compliance
    - src/platform/Telemetry
    - supabase/policies
  relatedSkills:
    - .ai/skills/ESS-0001-Contracts.md
    - .ai/skills/ESS-0002-Supervisor-Architect.md

created: 2026-07-31
---

# Security & Compliance

## Enterprise Purpose

Dieses Dokument spezifiziert die Komponenten `src/platform/Security` und
`src/platform/Compliance`.

ESS-0001-CONTRACTS Chapter 11 definiert die verbindlichen Sicherheits- und
Compliance-Verträge — Klassifizierung, Secret Contract, Audit Trail, Risk Contract,
Compliance Evidence.

Dieses Dokument beschreibt ausschließlich, **wie** beide Komponenten diese Verträge
durchsetzen.

Es definiert keine Sicherheitsregeln.

---

# Warum beide Komponenten in einem Dokument

Security und Compliance sind zwei Komponenten mit **einer** gemeinsamen Nachweiskette:

```text
Security Classification → Kontrolle → Audit-Eintrag → Compliance Evidence → Nachweis
```

Eine getrennte Spezifikation würde diese Kette an der Dokumentgrenze zerschneiden. Die
Nummernreservierung aus ESS-0001 führt beide Bereiche ebenfalls gemeinsam
(*Security & Compliance*).

Die Komponenten bleiben im Repository getrennt.

---

# Abgrenzung

| Dokument | Verantwortung |
|---|---|
| ESS-0001-CONTRACTS Chapter 11 | sämtliche Sicherheits- und Compliance-Regeln |
| ESS-0005 | Ausführung von Security-Validatoren |
| ESS-0012-CONTRACTS | Governance-Prüfung der Dokumentation |
| **ESS-0006** | **Komponentenspezifikation Security und Compliance** |

---

# Enterprise Principle

Sicherheit wird nachgewiesen, nicht behauptet.

Eine Compliance-Aussage ohne Nachweis besitzt keine Gültigkeit.

Der Audit Trail ist unveränderbar — auch für die Komponente, die ihn schreibt.

---

# Position in der Architektur

Beide Komponenten sind Querschnittsmodule gemäß ESS-0001-CONTRACTS Chapter 16.

Zulässige Abhängigkeiten: Core, Shared.

Unzulässig: Version Manager, Supervisor, Platform Director.

---

# End of Chapter 1

---

# Chapter 2

# Security Center

## Kernkomponenten

### ClassificationRegistry

Führung der Sicherheitsklassifizierung je Komponente.

Stufen gemäß Chapter 11: Public, Internal, Confidential, Restricted, Critical.

Eine Komponente ohne Klassifizierung ist nicht integrationsfähig.

---

### SecretGuard

Durchsetzung des Secret Contracts.

Prüft auf

Secrets im Repository

Secrets in Logs

Secrets in Events

Secrets in Dokumentation

Secrets in Fehlermeldungen

Ein Fund ist ausnahmslos ein Critical-Befund.

---

### AuditTrail

Unveränderbare Protokollierung gemäß Chapter 11.

Jeder Eintrag führt Zeitpunkt, auslösende Instanz, Komponente, Operation, Ergebnis, Version,
Correlation ID, ESS- und ADR-Referenzen.

Einträge werden **niemals** gelöscht oder verändert — auch nicht durch das Security Center
selbst.

---

### RiskRegister

Führung sämtlicher Risiken gemäß Chapter 11.

Jedes Risiko besitzt ID, Kategorie, Eintrittswahrscheinlichkeit, Auswirkung, betroffene
Komponenten, Maßnahme, Verantwortlichen, Status.

Ein Risiko wird niemals ohne Dokumentation geschlossen.

---

### SecurityReviewCoordinator

Steuerung der Review-Pflicht gemäß Chapter 11 — verbindlich bei Restricted- und
Critical-Komponenten, Änderungen an Authentifizierung, Autorisierung, Zahlungsprozessen,
Datenbank-Policies und Secret-Verwaltung.

---

# End of Chapter 2

---

# Chapter 3

# Compliance Center

## Kernkomponenten

### ComplianceRequirementRegistry

Zuordnung der Compliance-Anforderungen je Komponente.

Datenschutz, Finanzaufsicht, Aufbewahrungs-, Nachweis-, Protokoll- und Exportpflichten.

---

### EvidenceCollector

Sammlung der Nachweise gemäß Chapter 11, *Compliance Evidence*.

Zulässige Nachweise: Audit Trail, Security Report, Compliance Report, Validation Report,
Test Report, Architecture Report.

Behauptungen ohne Nachweis werden verworfen.

---

### ComplianceReporter

Aufbereitung der Nachweisdaten.

Die physische Berichtserzeugung erfolgt durch die Documentary Engine gemäß ESS-0010.

---

# End of Chapter 3

---

# Chapter 4

# Interfaces

## ISecurityClassifier

```text
classify(component)      Klassifizierung ermitteln
requiresReview(change)   Review-Pflicht prüfen
```

## IAuditTrail

```text
append(entry)            Eintrag hinzufügen, niemals ändern
query(filter)            Auswertung
verify()                 Integritätsprüfung
```

## IRiskRegister

```text
record(risk)             Aufnahme
assess(risk)             Bewertung
close(id, evidence)      Schließen ausschließlich mit Nachweis
```

## IComplianceEvidence

```text
collect(requirement)     Nachweise sammeln
verify(requirement)      Erfüllung prüfen
```

---

# End of Chapter 4

---

# Chapter 5

# Events

## Erzeugte Events

SecurityScanCompletedEvent

SecurityClassificationChangedEvent

SecurityViolationDetectedEvent

SecretExposureDetectedEvent

ComplianceValidatedEvent

ComplianceViolationDetectedEvent

RiskDetectedEvent

RiskResolvedEvent

AuditCompletedEvent

PermissionChangedEvent

## Konsumierte Events

RepositoryScannedEvent

ImplementationCompletedEvent

ComponentRegisteredEvent

VersionChangedEvent

MigrationCompletedEvent

---

# End of Chapter 5

---

# Chapter 6

# Integration und Bestand

## Supervisor

Sicherheitsvorfälle werden gemäß ESS-0002 unmittelbar auf Eskalationsstufe 5 gemeldet.

## Platform Director

Entscheidet über Sicherheitsausnahmen und Risikoakzeptanz — ausschließlich per ADR.

## Version Manager

Sicherheitskorrekturen besitzen gemäß Chapter 11 jederzeit Vorrang vor funktionalen
Änderungen.

---

# Bekannter Bestand

Security besitzt den höchsten Implementierungsgrad der Plattform.

`server/iam/` umfasst Authentifizierungs-Middleware, Rate Limiting, Secret-Verschlüsselung
und TOTP. `server/stepUp.ts` ergänzt Step-Up-Authentifizierung. ADR-0003.5 ist als
abgeschlossen verifiziert, ADR-0009 (CORS Hardening) ebenfalls.

Die Datenbank führt `audit_logs_iam`, `iam_access_log`, `security_events`,
`step_up_tokens` und `break_glass_codes`.

**Diese Implementierung ist gemäß Chapter 14 zu registrieren und zu kapseln — niemals neu zu
entwickeln.**

## Offene Befunde

| Befund | Regel |
|---|---|
| keine Komponente besitzt eine Sicherheitsklassifizierung | `GOV-REPO-007` |
| kein Audit Trail im Sinne von Chapter 11 | Chapter 11 |
| Security Metadata in 23 von 24 Manifesten unvollständig | `GOV-REPO-007` |
| ADR-0012: Compliance-Endpunkte existieren nicht | `FND-ADR-0012-01` |

---

# Enterprise Rules

Keine Komponente ohne Security Classification.

Keine Restricted-Komponente ohne Security Review.

Keine Compliance-Aussage ohne Nachweis.

Keine Manipulation des Audit Trails.

Keine Secrets im Repository.

Keine Ausnahme ohne ADR.

---

# Success Criteria

✓ sämtliche Komponenten klassifiziert

✓ Audit Trail lückenlos und unveränderbar

✓ sämtliche Risiken dokumentiert und bewertet

✓ sämtliche Compliance-Anforderungen mit Nachweis belegt

✓ keine Freigabe ohne Sicherheitsprüfung

✓ Bestandsimplementierung gekapselt statt ersetzt

---

# Enterprise Final Summary

**Document ID** ESS-0006

**Titel** CAPITAL-AI Security & Compliance

**Status** Enterprise Specification

**Version** 1.0.0

---

# Governance Statement

ESS-0006 ist die verbindliche Komponentenspezifikation von Security Center und
Compliance Center.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Komponentenspezifikation Security und Compliance |

---

# End of Document

ESS-0006

CAPITAL-AI Security & Compliance

Version 1.0.0
