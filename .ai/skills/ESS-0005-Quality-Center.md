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
    Validator-Basisvertrag, Severity-Stufen, Quality Gates, Metriken und Schwellwerte
    verbleiben in ESS-0001-CONTRACTS Chapter 12.

authority:
  controls:
    - Validator Registry Integration
    - Mandatory Validator Coverage
    - Quality Gate Ausfuehrung
    - Quality Score Berechnung
    - Technical Debt Register
    - Testabdeckung
    - QM Dokumentationskonsistenz
    - Quality Event Publication
  collaborates:
    - Documentary Engine
    - Supervisor
    - Platform Director
    - Governance Control Plane
    - Security & Compliance
    - Enterprise Event Mesh
    - Release Center
  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - Quellcode
    - Schwellwerte
    - Governance Authorities
    - Compliance Regeln
    - IAM Berechtigungen

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
  relatedEss:
    - ESS-0002
    - ESS-0003
    - ESS-0006
    - ESS-0010
    - ESS-0011
    - ESS-0012
    - ESS-0013
    - ESS-0017
  relatedAdr:
    - ADR-0010
    - ADR-0012
    - ADR-0016
    - ADR-0018
    - ADR-0030
    - ADR-0096
  relatedComponents:
    - src/platform/Quality
    - src/platform/Validators
    - src/platform/Governance
    - src/platform/Compliance
    - src/platform/EventMesh
    - src/platform/Documentary/Governance
    - src/platform/Vocabulary
    - src/platform/Release
    - src/platform/Telemetry
    - tests
  relatedSkills:
    - .ai/skills/ESS-0001-Contracts.md
    - .ai/skills/ESS-0006-Security-Compliance.md
    - .ai/skills/ESS-0012-Documentation-Governance.md
    - .ai/skills/ESS-0013-Enterprise-Event-Mesh.md
    - .ai/skills/ESS-0017-Vocabulary-Governance.md

created: 2026-07-31
updated: 2026-08-20
---

# Quality Center

## Enterprise Purpose

`src/platform/Quality` ist die zentrale Ausfuehrungs-, Mess- und Orchestrierungsgrenze fuer die in ESS-0001-CONTRACTS Chapter 12 definierten Validation-&-Quality-Contracts.

Das Quality Center **fuehrt aus und misst**. Es legt keine fachlichen Regeln, Severity-Stufen, Schwellwerte, Governance-Authorities oder Compliance-Anforderungen fest.

Ein Quality Gate ohne ausfuehrbare oder nachvollziehbar als fehlend ausgewiesene Evidence darf niemals als bestanden gelten. Ein Score darf niemals manuell gesetzt oder aus fehlender Evidence konstruiert werden.

---

# Chapter 1 — Position und Abgrenzung

| Authority | Verantwortung |
|---|---|
| ESS-0001-CONTRACTS Chapter 12 | exakte 16 Pflichtvalidatoren, Severity, acht Quality Gates, Quality-Metriken, Schwellwerte |
| ESS-0001-CONTRACTS Chapter 11 / ESS-0006 | Security-/Compliance-Regeln und Evidence-Semantik |
| ESS-0012-CONTRACTS | Documentation-Governance-Regelwerk |
| ESS-0011-CONTRACTS | Traceability-/Coverage-Achsen |
| ESS-0013 | EventMesh-Katalog, Routing und Event-Vertrag |
| ESS-0017 | Vocabulary-/Terminologie-Regeln |
| Governance Control Plane | neutrale, wiederverwendbare Authority-/Evidence-Vertraege |
| **ESS-0005** | **Ausfuehrung, Aggregation und Messung im Quality Center** |

Das Quality Center konsumiert den neutralen Repository-Quality-Evidence-Vertrag aus `src/platform/Governance` und die zentrale Registry aus `src/platform/Validators`.

Fachliche Cross-Domain-Validatoren werden ueber Composition injiziert. Die EventMesh-Anbindung erfolgt ebenfalls ueber Composition und den bestehenden EventBus. Es wird keine zweite Rule-, Governance-, Compliance- oder Event-Infrastruktur eingefuehrt.

Das Quality Center besitzt keine Merge-, Release-, Deployment-, IAM- oder Produktionsmutations-Authority.

---

# Chapter 2 — Komponentenarchitektur

## ValidatorRegistry

`src/platform/Validators/ValidatorRegistry.ts` registriert und loest vorhandene Quality-Adapter deterministisch auf und lehnt doppelte Domain-Registrierungen ab. Die Registry definiert keine fachliche Validator-Regel.

## MandatoryValidatorCatalog

`src/platform/Validators/MandatoryValidatorCatalog.ts` bildet die **exakt 16** in ESS-0001-CONTRACTS Chapter 12 genannten Pflichtvalidator-Identitaeten maschinenlesbar ab.

Jeder Eintrag fuehrt:

- Validator-Name;
- `AVAILABLE`, `PARTIAL` oder `NOT_AVAILABLE`;
- vorhandene autoritative Source-Pfade;
- abgedeckte Repository-Quality-Domaenen;
- Authority-Referenzen;
- Begruendung der Abdeckung.

Der Katalog erzeugt keine fehlenden Validatorregeln. `PARTIAL` und `NOT_AVAILABLE` sind explizite Lueckenzustaende und keine Quality-PASS-Aussage.

Aktuelle codebasierte Baseline: 5 `AVAILABLE`, 3 `PARTIAL`, 8 `NOT_AVAILABLE`.

## RepositoryQualityCoordinator

`src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator.ts` fuehrt registrierte Repository-Quality-Adapter aus, normalisiert Evidence gemaess `repository-quality-observation/1.1.0`, arbeitet deterministisch und fail-closed bei fehlenden/fehlerhaften Pflichtdomaenen.

## QualityCenterContract

`quality-center-contract/1.1.0` verbindet Repository-Evidence, Pflichtvalidator-Abdeckung, Gate-Ergebnisse, Quality-Messungen, Coverage, Event-Publikationsstatus und Technical-Debt-Evidence zu einem einheitlichen Quality-Center-Report.

## QualityGateRunner

Die acht Gate-IDs entsprechen Chapter 12:

1. Contract-Konformitaet
2. Architektur-Konformitaet
3. Versionskonformitaet
4. Dokumentationsstatus
5. Teststatus
6. Sicherheitsauswirkungen
7. Compliance-Auswirkungen
8. Build-Ergebnis

Ein Gate mit blockierender Evidence ist `FAIL`. Ein Gate ohne vollstaendige technische Evidence ist `NOT_AVAILABLE`. Ein Gate wird niemals wegen Teil-Evidence zu PASS hochgestuft.

## QualityScoreCalculator

Die sieben verbindlichen Achsen sind Documentation, Test, Architecture, Security, Knowledge, Metadata und Twin. Jede Messung besitzt 0..100, Source und Authority-Referenzen. Fehlende Messachsen werden explizit ausgewiesen; ein Gesamtwert wird nicht aus einer unvollstaendigen Messmenge konstruiert.

Aktuell reale Messquellen:

- Test Score aus der gemessenen Belegung der sieben Pflicht-Testbereiche;
- Security Score aus der bestehenden SecurityComplianceAuditor-Aggregation der `SECURITY`-Scanner.

Documentation, Architecture, Knowledge, Metadata und Twin bleiben ohne autoritative numerische Messquelle offen.

## CoverageCollector

`src/platform/Quality/Coverage/CoverageCollector.ts` misst reale `*.test.*`-/`*.spec.*`-Dateien in `unit`, `integration`, `contract`, `architecture`, `security`, `performance` und `e2e`.

Optional wird reale Code-Coverage aus `coverage/coverage-summary.json` oder `.quality/coverage-summary.json` gelesen. Ohne Artefakt bleiben Statements, Branches, Functions und Lines `NOT_AVAILABLE`.

## TechnicalDebtRegister

`src/platform/Quality/TechnicalDebt/TechnicalDebtRegister.ts` erfasst technische Schulden mit ID, Komponente, Ursache, Auswirkung, Aufwand, Prioritaet, Zielversion und Source-Referenzen. `resolve()` verlangt Resolution-Evidence.

Bei injiziertem `QualityEventSink` publiziert `record()` `TechnicalDebtDetectedEvent` und `resolve()` `TechnicalDebtResolvedEvent`. Event-Transportfehler werden im Debt-Snapshot als Evidence gespeichert; sie erzeugen keine Quality-/Governance-Autorisierungswirkung.

## DocumentationConsistencyValidator

`src/platform/Quality/Validators/DocumentationConsistencyValidator.ts` ergaenzt ESS-0012 ausschliesslich um QM-spezifische Konsistenzpruefungen und dupliziert keine Documentation-Governance-Regeln.

## QualityCenterOrchestrator

`src/platform/Quality/Orchestration/QualityCenterOrchestrator.ts` erzeugt den einheitlichen Quality-Center-Report aus Repository-Evidence, Pflichtvalidator-Coverage, Gates, Scoring, Coverage und Technical Debt und publiziert Quality-Lifecycle-Evidence ueber einen injizierten Event-Sink.

---

# Chapter 3 — Interfaces

## IValidatorRegistry

```text
register(validator)
resolve(domain)
list()
domains()
```

## IMandatoryValidatorCatalog

```text
resolve(name)
snapshot() -> mandatory-validator-coverage/1.0.0
```

## RepositoryQualityObservation

```text
observe(scope) -> repository-quality-observation/1.1.0
```

## IQualityGate

```text
execute(scope)
result()
```

## IScoreCalculator

```text
calculate(measurements)
```

Lifecycle-Schwellwerte verbleiben normativ in ESS-0001-CONTRACTS Chapter 12.

## ICoverageCollector

```text
collect(repoRoot, checkedAt) -> quality-coverage/1.0.0
```

## ITechnicalDebtRegister

```text
record(debt)
list(component?)
resolve(id, evidence)
snapshot() -> technical-debt-register/1.1.0
```

## IQualityCenter

```text
run(scope) -> quality-center-report/1.1.0
```

---

# Chapter 4 — Governance-, Compliance- und EventMesh-Orchestrierung

## Governance

Governance stellt den neutralen Evidence-Vertrag bereit. Quality darf Governance-Authorities nicht veraendern.

## Compliance

`runAllScanners()` bleibt unveraendert fachliche Source-of-Evidence. Der Quality-Adapter projiziert bestehende Scanner-Ergebnisse. `CRITICAL/HIGH` werden fuer Quality-Evidence blockierend normalisiert, `MEDIUM` als Warning und `LOW` als Info; die Original-Severity bleibt erhalten.

Der Security Score verwendet dieselbe gerundete arithmetische Mittelwertbildung der `SECURITY`-Scanner wie `src/platform/Compliance/store.ts`.

## EventMesh

Quality publiziert ueber den bestehenden EventMesh-Sink:

- `ValidationStartedEvent`;
- `ValidationCompletedEvent` / `ValidationFailedEvent`;
- `QualityGatePassedEvent` / `QualityGateFailedEvent`;
- `QualityScoreChangedEvent` bei nachgewiesener vollstaendiger Score-Aenderung;
- `CoverageCalculatedEvent`;
- `TechnicalDebtDetectedEvent` / `TechnicalDebtResolvedEvent` bei Debt-Mutationen eines mit Sink komponierten Registers.

Alle Event-Namen sind im zentralen `STANDARD_EVENT_CATALOG` registriert. Es wird kein zweiter Bus eingefuehrt.

## Supervisor

Quality liefert Evidence. Technische `blocking`-Kennzeichnungen sind keine Human-/Supervisor-Freigabeentscheidung.

## Release / Version

Die Plattformversions-Authority bleibt unter ADR-0096 `package.json#version` ueber den Release Control Plane. Quality konsumiert diese Projektion read-only.

---

# Chapter 5 — Testarchitektur

Die sieben vorgesehenen Testbereiche sind mit realen Testdateien belegt. Quality-spezifische Pruefungen umfassen insbesondere:

- `tests/unit/mandatoryValidatorCatalog.test.ts`;
- `tests/unit/coverageCollector.test.ts`;
- `tests/unit/technicalDebtRegister.test.ts`;
- `tests/contract/qualityCenterContract.test.ts`;
- `tests/architecture/qualityCenterBoundary.test.ts`;
- `tests/security/qualityCenterAuthorityBoundary.test.ts`;
- `tests/performance/qualityCenterDeterminism.test.ts`;
- `tests/e2e/qualityCenterOrchestration.test.ts`.

Testdatei-Coverage ist kein Ersatz fuer einen bestandenen Testlauf. Der Test-Gate-Status bleibt ohne Execution-Evidence `NOT_AVAILABLE`.

---

# Chapter 6 — Implementierungsstatus 2026-08-20

## Implementiert

- neutraler Governance-Evidence-Contract;
- zentrale ValidatorRegistry;
- exakter 16er-Pflichtvalidator-Katalog mit maschinenlesbarer Coverage;
- RepositoryQualityCoordinator;
- Composition-Adapter fuer Platform Version, Documentation Hygiene, QM Documentation Consistency, Repository Conventions, Vocabulary und Compliance;
- QualityCenterContract `1.1.0`;
- QualityGateRunner fuer alle acht Gate-IDs mit Evidence-Coverage-Semantik;
- QualityScoreCalculator;
- CoverageCollector mit realer Pflicht-Testbereich-Messung und optionaler Code-Coverage-Ingestion;
- reale Test- und Security-Score-Provider;
- TechnicalDebtRegister mit Event-Publikation bei injiziertem Sink;
- QualityCenterOrchestrator;
- QM-Dokumentationskonsistenz-Validator;
- EventMesh-Publikation fuer Quality-Lifecycle-, Gate-, Coverage- und Technical-Debt-Ereignisse;
- CLI `npm run repository:quality:check`;
- Unit-, Contract-, Architecture-, Security-, Performance-, Integration- und E2E-Testbereiche mit realen Testdateien.

## Noch nicht als vollstaendig implementiert zu bewerten

- echte Ausfuehrungsimplementierung/Anbindung der aktuell `PARTIAL` oder `NOT_AVAILABLE` markierten Pflichtvalidatoren;
- vollstaendige Execution-Evidence aller acht Gates, insbesondere Contract/Test/Build;
- reale Measurement-Provider fuer Documentation, Architecture, Knowledge, Metadata und Twin;
- Statement-/Branch-/Function-/Line-Coverage ohne erzeugtes Coverage-Artefakt.

Diese offenen Punkte werden transparent als fehlende Evidence behandelt und niemals als PASS oder Messwert simuliert.

---

# Enterprise Rules

Kein Contract ohne Validator-Abdeckung.

Kein Quality Gate ohne ausfuehrbare oder explizit fehlend ausgewiesene Evidence.

Keine Kennzahl ohne Messung.

Keine manuelle Vergabe von Quality Scores.

Keine stille Schliessung technischer Schulden.

Keine Aenderung von Quality-Schwellwerten durch das Quality Center.

Keine Duplikation von Governance-, Compliance-, Security-, Release-, EventMesh-, Vocabulary- oder Documentation-Regeln.

Keine Merge-, Release-, Deployment- oder Produktionsautorisierung durch Quality Evidence.

---

# Success Criteria

Das vollstaendige ESS-0005-Zielbild ist erreicht, wenn:

- saemtliche 16 Pflichtvalidatoren aus Chapter 12 mit autoritativer Execution-Evidence `AVAILABLE` sind;
- saemtliche acht Quality Gates vollstaendige Execution-Evidence besitzen;
- saemtliche sieben Quality-Metriken aus realen Messquellen deterministisch berechnet werden;
- die vorgesehenen Testbereiche mit realer Coverage-Evidence belegt sind;
- technische Schulden vollstaendig erfasst und evidenzbasiert geschlossen werden;
- QM-Dokumentation und Implementierungsmetadaten driftfrei bleiben;
- alle vorgesehenen Quality Events real ueber EventMesh erzeugt werden.

---

# Enterprise Final Summary

**Document ID:** ESS-0005  
**Titel:** CAPITAL-AI Quality Center  
**Status:** Enterprise Specification  
**Version:** 1.1.0

## Governance Statement

ESS-0005 bleibt die verbindliche Komponentenspezifikation des Quality Centers. Dieses Implementation-Sync aendert keine Quality-Regeln, Severity-Stufen oder Lifecycle-Schwellwerte; es aktualisiert den realen Umsetzungsstand innerhalb der bestehenden Authority-Grenzen.

## Version History

| Version | Status | Beschreibung |
|---|---|---|
| 1.0.0 | Initial Release | Erste Komponentenspezifikation des Quality Center |
| 1.1.0 | Implementation sync | Codebasierte Quality-Center-Core-Orchestrierung mit Pflichtvalidator-Coverage, Coverage, Scoring-Providern, Technical-Debt-Events und EventMesh-Integration |

---

# End of Document

ESS-0005

CAPITAL-AI Quality Center

Version 1.1.0
