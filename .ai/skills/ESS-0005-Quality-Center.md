---
skill:
  id: ESS-0005
  name: Quality Center
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
  role: Komponentenspezifikation Quality Center
  contractAuthority: ESS-0001-CONTRACTS
  note: >
    Dieses Dokument spezifiziert ausschliesslich die Komponente src/platform/Quality.
    Validator-Basisvertrag, Severity-Stufen und Quality Gates verbleiben in
    ESS-0001-CONTRACTS Chapter 12.

authority:

  controls:
    - Validator Registry
    - Quality Gate Ausfuehrung
    - Quality Score Berechnung
    - Technical Debt Register
    - Testabdeckung

  collaborates:
    - Documentary Engine
    - Supervisor
    - Platform Director
    - Version Manager
    - Release Center

  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - Quellcode
    - Schwellwerte

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
  relatedEss:
    - ESS-0002
    - ESS-0003
    - ESS-0010
    - ESS-0011
    - ESS-0012
  relatedAdr:
    - ADR-0010
    - ADR-0016
  relatedComponents:
    - src/platform/Quality
    - src/platform/Validators
    - src/platform/Telemetry
    - tests
  relatedSkills:
    - .ai/skills/ESS-0001-Contracts.md
    - .ai/skills/ESS-0012-Documentation-Governance.md

created: 2026-07-31
---

# Quality Center

## Enterprise Purpose

Dieses Dokument spezifiziert die Komponente `src/platform/Quality`.

ESS-0001-CONTRACTS Chapter 12 definiert die verbindlichen Validierungs- und
Qualitätsverträge — 16 Pflichtvalidatoren, Severity-Stufen, acht Quality Gates.

Dieses Dokument beschreibt ausschließlich, **wie** das Quality Center diese Verträge
ausführt.

Es definiert keine Regeln, keine Schweregrade und keine Schwellwerte.

---

# Abgrenzung

| Dokument | Verantwortung |
|---|---|
| ESS-0001-CONTRACTS Chapter 12 | Validator-Vertrag, Severity, Quality Gates, Metriken |
| ESS-0011-CONTRACTS | Coverage-Achsen der Traceability |
| ESS-0012-CONTRACTS | Governance-Regelwerk |
| **ESS-0005** | **Komponentenspezifikation Quality Center** |

Das Quality Center **führt aus**. Es legt nicht fest.

---

# Enterprise Principle

Qualität ist keine Bewertung.

Qualität ist eine Messung.

Ein Quality Gate ohne ausführbare Prüfung ist eine Absichtserklärung.

Ein Score, der manuell gesetzt werden kann, ist kein Score.

---

# Position in der Architektur

Querschnittsmodul gemäß ESS-0001-CONTRACTS Chapter 16.

Zulässige Abhängigkeiten: Core, Shared.

Zusätzlich lesend: Registry, Knowledge, Documentary — zur Auswertung der Prüfgegenstände.

Unzulässig: Version Manager, Supervisor, Platform Director.

---

# End of Chapter 1

---

# Chapter 2

# Komponentenarchitektur

## Kernkomponenten

### ValidatorRegistry

Registrierung und Auflösung sämtlicher Validatoren.

Verantwortung

Registrierung der 16 Pflichtvalidatoren aus Chapter 12

Registrierung zusätzlicher Validatoren

Versionierung der Validatoren

Auflösung von Ausführungsreihenfolgen

---

### GateRunner

Ausführung der acht Quality Gates.

Verantwortung

Zuordnung Validator zu Gate

Ausführung in fester Reihenfolge

Aggregation der Ergebnisse

Gate-Entscheidung bestanden oder nicht bestanden

Ein Gate gilt ausschließlich als bestanden, wenn keine Critical- und keine High-Befunde
vorliegen.

---

### ScoreCalculator

Berechnung der Qualitätskennzahlen aus Chapter 12.

Documentation Score

Test Score

Architecture Score

Security Score

Knowledge Score

Metadata Score

Twin Score

Sämtliche Werte werden ausschließlich berechnet.

---

### TechnicalDebtRegister

Erfassung technischer Schulden gemäß Chapter 12.

Verantwortung

Aufnahme mit ID, Ursache, Auswirkung, Aufwand, Priorität, Zielversion

Verfolgung bis zur Behebung

Meldung wachsender Schulden

Technische Schulden werden niemals stillschweigend geschlossen.

---

### CoverageCollector

Sammlung der Testabdeckung aus den Testbereichen gemäß Chapter 12.

```text
tests/unit  tests/integration  tests/contract
tests/architecture  tests/security  tests/performance  tests/e2e
```

---

# End of Chapter 2

---

# Chapter 3

# Interfaces

## IValidatorRegistry

```text
register(validator)      Aufnahme eines Validators
resolve(contractArea)    Validatoren je Vertragsbereich
list()                   sämtliche registrierten Validatoren
```

## IQualityGate

```text
identifier()             Gate-Kennung
validators()             zugeordnete Validatoren
execute(scope)           Ausführung
result()                 bestanden oder nicht bestanden
```

## IScoreCalculator

```text
calculate(component)     sämtliche Kennzahlen
threshold(lifecycle)     Schwellwert je Lebenszyklus
```

## ITechnicalDebtRegister

```text
record(debt)             Aufnahme
list(component)          Schulden je Komponente
resolve(id, evidence)    Schließen mit Nachweis
```

---

# End of Chapter 3

---

# Chapter 4

# Events

## Erzeugte Events

ValidationStartedEvent

ValidationCompletedEvent

ValidationFailedEvent

QualityGatePassedEvent

QualityGateFailedEvent

QualityScoreChangedEvent

TechnicalDebtDetectedEvent

TechnicalDebtResolvedEvent

CoverageCalculatedEvent

## Konsumierte Events

ImplementationCompletedEvent

DocumentationGeneratedEvent

KnowledgeUpdatedEvent

TwinSynchronizedEvent

VersionCalculatedEvent

---

# End of Chapter 4

---

# Chapter 5

# Integration

## Supervisor

Das Quality Center liefert dem Supervisor gemäß ESS-0002 Gate-Ergebnisse, Befunde und
Kennzahlen. Der Supervisor bewertet und blockiert.

Das Quality Center blockiert selbst nicht — es stellt fest.

## Version Manager

Liefert die Qualitätsachse der Versionsbewertung: nicht bestandene Gates blockieren eine
Release-Vorbereitung gemäß Chapter 9.

## Governance Validator

ESS-0012 ist ein Validator im Sinne von Chapter 12 und wird über die ValidatorRegistry
registriert. Sein Regelwerk verbleibt in ESS-0012-CONTRACTS.

## Enterprise Traceability

Die Test-Achse der Matrix speist sich aus den Ergebnissen des Quality Center.

---

# Bekannter Bestand

Das Repository enthält derzeit **null Testdateien** und **null Validatoren**.

`package.json` kennt keinen Test-Runner; `npm run lint` führt ausschließlich `tsc --noEmit`
aus.

Damit ist kein einziges Quality Gate ausführbar. Die acht Gates aus Chapter 1 existieren
ausschließlich als Vertrag.

Dies ist der schwerwiegendste offene Punkt der Plattform: Ohne ausführbare Prüfungen bleibt
jede Regel dieses Standards eine Absichtserklärung.

Umsetzung gemäß Stufe 4 aus `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md`.

---

# Enterprise Rules

Kein Contract ohne Validator.

Kein Quality Gate ohne ausführbare Prüfung.

Keine Kennzahl ohne Berechnung.

Keine Integration mit Critical-Befunden.

Keine Änderung von Schwellwerten durch das Quality Center.

Keine Blockade durch das Quality Center selbst.

---

# Success Criteria

✓ sämtliche 16 Pflichtvalidatoren registriert und ausführbar

✓ sämtliche acht Quality Gates ausführbar

✓ sämtliche Kennzahlen deterministisch berechnet

✓ sämtliche Testbereiche belegt

✓ technische Schulden vollständig erfasst

✓ keine nicht konforme Änderung integrierbar

---

# Enterprise Final Summary

**Document ID** ESS-0005

**Titel** CAPITAL-AI Quality Center

**Status** Enterprise Specification

**Version** 1.0.0

---

# Governance Statement

ESS-0005 ist die verbindliche Komponentenspezifikation des Quality Center.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Komponentenspezifikation des Quality Center |

---

# End of Document

ESS-0005

CAPITAL-AI Quality Center

Version 1.0.0
