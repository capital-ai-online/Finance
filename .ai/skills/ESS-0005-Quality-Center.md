---
skill:
  id: ESS-0005
  name: Quality Center
  version: 1.1.0
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
    - Governance Control Plane
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
    - ESS-0017
  relatedAdr:
    - ADR-0010
    - ADR-0016
    - ADR-0096
  relatedComponents:
    - src/platform/Quality
    - src/platform/Governance
    - src/platform/Documentary/Governance
    - src/platform/Vocabulary
    - src/platform/Release
    - src/platform/Validators
    - src/platform/Telemetry
    - tests
  relatedSkills:
    - .ai/skills/ESS-0001-Contracts.md
    - .ai/skills/ESS-0012-Documentation-Governance.md
    - .ai/skills/ESS-0017-Vocabulary-Governance.md

created: 2026-07-31
updated: 2026-08-20
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

Für repository-weite Quality-Observation wird der neutrale Evidence-Contract aus
`src/platform/Governance` konsumiert. Cross-Domain-Validatoren werden über eine externe
Composition-Schicht injiziert; dadurch entstehen keine direkten Quality-Abhängigkeiten auf
Release, VersionManager, Documentary Governance oder Vocabulary.

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

### RepositoryQualityCoordinator — P0-P2 Baseline

Der `RepositoryQualityCoordinator` ist die erste ausführbare Teilimplementierung des
Quality Centers. Er aggregiert ausschließlich bereits erzeugte, normalisierte und
read-only Quality Evidence.

Verantwortung

- deterministische Reihenfolge erforderlicher Quality-Domänen;
- Aggregation zu `PASS`, `WARN`, `FAIL` oder `NOT_AVAILABLE`;
- fail-closed Evidence bei fehlenden/fehlerhaften Adaptern;
- Bindung an optionalen vollständigen Source-Commit;
- ausdrückliche Kennzeichnung als non-authorizing Evidence.

Er definiert keine Validator-Regeln, keine Schwellwerte, keine Release-Entscheidung und
keine Mutation. Die vollständige ValidatorRegistry und die acht Quality Gates bleiben ein
separater inkrementeller ESS-0005-Scope.

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

## RepositoryQualityObservation — P0-P2

```text
observe(scope)           read-only Quality-Evidence-Aggregation
```

Der konkrete Evidence-Contract ist `repository-quality-observation/1.0.0` in
`src/platform/Governance/Contracts/RepositoryQualityEvidence.ts` und darf keine
Autorisierungswirkung entfalten.

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

Die Event-Liste beschreibt den Zielzustand des vollständigen Quality Centers. Die P0-P2
Repository-Quality-Baseline erzeugt und konsumiert bewusst keine synthetischen EventMesh-Events.

---

# End of Chapter 4

---

# Chapter 5

# Integration

## Supervisor

Das Quality Center liefert dem Supervisor gemäß ESS-0002 Gate-Ergebnisse, Befunde und
Kennzahlen. Der Supervisor bewertet und blockiert.

Das Quality Center blockiert selbst nicht — es stellt fest.

Ein `blocking: true` in `RepositoryQualityObservation` kennzeichnet deshalb ausschließlich
einen technischen Fail-closed-Befund. Es ist keine Merge-, Release- oder
Produktionsautorisierung und keine eigenständige Supervisor-Entscheidung.

## Release / Platform Version Authority

ADR-0096 ersetzt die historische mutierende Version-Manager-Authority. Die aktuelle
Plattformversions-Authority ist ausschließlich `package.json#version` über den Release
Control Plane.

P0-P2 liest diese Projektion ausschließlich über einen Composition-Adapter. Das Quality
Center besitzt keine direkte Release-/VersionManager-Abhängigkeit und verändert keine Version.

## Governance Validator

ESS-0012 ist ein Validator im Sinne von Chapter 12. Sein Regelwerk verbleibt in
ESS-0012-CONTRACTS und ist unter ADR-0096 auf Documentation-only Scope begrenzt.

P0-P2 konsumiert den bereits implementierten read-only Documentation-Hygiene-Service über
die Composition-Schicht. Die spätere formale Registrierung in einer vollständigen
ValidatorRegistry bleibt inkrementeller ESS-0005-Scope.

## Vocabulary Governance

ESS-0017 bleibt die fachliche Authority für kanonische Terminologie. P0-P2 normalisiert
vorhandene Vocabulary-Findings lediglich in den gemeinsamen Quality-Evidence-Contract und
erfindet keine Naming-/Terminologie-Regeln.

## Enterprise Traceability

Die Test-Achse der Matrix speist sich aus den Ergebnissen des Quality Center.

---

# Bekannter Bestand

Der historische Initialzustand mit null Testdateien und null Validatoren ist nicht mehr
aktuell. Das Repository besitzt inzwischen eine breite Vitest-/Node-Testbasis sowie mehrere
ausführbare, domänenspezifische Validatoren.

Mit Repository Quality P0-P2 ist `src/platform/Quality` erstmals teilweise implementiert:

- `repository-quality-observation/1.0.0` als neutraler Governance-Evidence-Contract;
- `RepositoryQualityCoordinator` als read-only Aggregator;
- Composition-Adapter für Platform Version, Documentation Hygiene,
  Repository Conventions und Vocabulary Governance;
- gezielte Unit-Tests für Aggregation, Fail-closed-Verhalten und Adapter-Mapping;
- `npm run repository:quality:check` als read-only CLI-Einstieg.

Nicht als umgesetzt gelten dadurch die vollständige ValidatorRegistry, sämtliche 16
Pflichtvalidatoren, alle acht Quality Gates, ScoreCalculator, TechnicalDebtRegister und
CoverageCollector. Diese bleiben inkrementelle Folgearbeit gemäß ESS-0005 und
ESS-0001-CONTRACTS Chapter 12.

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

**Version** 1.1.0

---

# Governance Statement

ESS-0005 ist die verbindliche Komponentenspezifikation des Quality Center.

Abweichungen erfordern eine neue Architecture Decision Record. Die Version 1.1.0 ändert
keine Quality-Regeln oder Schwellenwerte; sie synchronisiert den Implementierungsstand mit
ADR-0096 und der P0-P2-Teilimplementierung.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Komponentenspezifikation des Quality Center |
| 1.1.0 | Implementation sync | ADR-0096-/P0-P2-Abgleich; read-only Repository Quality Baseline dokumentiert, keine Regel-/Threshold-Aenderung |

---

# End of Document

ESS-0005

CAPITAL-AI Quality Center

Version 1.1.0
