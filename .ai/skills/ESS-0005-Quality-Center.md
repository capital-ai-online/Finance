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

## Normative Verantwortungen

| Authority | Verantwortung |
|---|---|
| ESS-0001-CONTRACTS Chapter 12 | Validator-Vertrag, Severity, acht Quality Gates, Quality-Metriken, Schwellwerte |
| ESS-0001-CONTRACTS Chapter 11 / ESS-0006 | Security-/Compliance-Regeln und Evidence-Semantik |
| ESS-0012-CONTRACTS | Documentation-Governance-Regelwerk |
| ESS-0011-CONTRACTS | Traceability-/Coverage-Achsen |
| ESS-0013 | EventMesh-Katalog, Routing und Event-Vertrag |
| ESS-0017 | Vocabulary-/Terminologie-Regeln |
| Governance Control Plane | neutrale, wiederverwendbare Authority-/Evidence-Vertraege |
| **ESS-0005** | **Ausfuehrung, Aggregation und Messung im Quality Center** |

## Dependency Boundary

Das Quality Center konsumiert den neutralen Repository-Quality-Evidence-Vertrag aus `src/platform/Governance` und die zentrale Registry aus `src/platform/Validators`.

Fachliche Cross-Domain-Validatoren werden ueber eine Composition-Schicht injiziert. Dadurch entstehen keine direkten Quality-Abhaengigkeiten, die Governance-, Compliance-, Release-, Documentary- oder Vocabulary-Authority duplizieren.

Die EventMesh-Anbindung erfolgt ebenfalls ueber eine Composition-Schicht und den bereits bestehenden EventBus. Es wird keine zweite Event-Infrastruktur eingefuehrt.

Das Quality Center besitzt insbesondere keine Merge-, Release-, Deployment-, IAM- oder Produktionsmutations-Authority.

---

# Chapter 2 — Komponentenarchitektur

## ValidatorRegistry

`src/platform/Validators/ValidatorRegistry.ts`

Verantwortung:

- Registrierung und Aufloesung zentral konsumierter Validatoren;
- deterministische Reihenfolge;
- Duplicate-Domain-DENY;
- Erweiterbarkeit fuer die Pflichtvalidatoren aus Chapter 12.

Die Registry definiert keine Validator-Regel selbst. Der vollstaendige Pflichtvalidator-Katalog bleibt durch ESS-0001-CONTRACTS autoritativ; noch nicht angebundene Validatoren werden nicht als vorhanden behauptet.

## RepositoryQualityCoordinator

`src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator.ts`

Verantwortung:

- Ausfuehrung der registrierten Repository-Quality-Validatoren;
- normalisierte Evidence gemaess `repository-quality-observation/1.1.0`;
- deterministische Reihenfolge;
- `PASS`, `WARN`, `FAIL`, `NOT_AVAILABLE`;
- fail-closed bei fehlenden oder fehlerhaften Pflichtvalidatoren;
- optionale Bindung an einen vollstaendigen Source-Commit;
- ausdrueckliche Kennzeichnung als non-authorizing Evidence.

## QualityCenterContract

`src/platform/Quality/Contracts/QualityCenterContract.ts`

Der Vertrag `quality-center-contract/1.1.0` verbindet Repository-Evidence, Gate-Ergebnisse, Quality-Messungen, Coverage, Event-Publikationsstatus und Technical-Debt-Evidence zu einem einheitlichen Quality-Center-Report.

Dieser Vertrag ist eine Orchestrierungs- und Evidence-Schnittstelle. Er ersetzt keine bestehende Governance-, Compliance- oder EventMesh-Authority.

## QualityGateRunner

`src/platform/Quality/Gates/QualityGateRunner.ts`

Die acht Gate-IDs entsprechen Chapter 12:

1. Contract-Konformitaet
2. Architektur-Konformitaet
3. Versionskonformitaet
4. Dokumentationsstatus
5. Teststatus
6. Sicherheitsauswirkungen
7. Compliance-Auswirkungen
8. Build-Ergebnis

Ein Gate mit blockierender Evidence ist `FAIL`.

Ein Gate ohne vollstaendige technische Evidence ist `NOT_AVAILABLE` und wird niemals zu PASS hochgestuft.

Ein Gate ist nur `PASS`, wenn die fuer dieses Gate benoetigte Evidence vollstaendig vorliegt und keinen blockierenden Befund enthaelt.

## QualityScoreCalculator

`src/platform/Quality/Scoring/QualityScoreCalculator.ts`

Verbindliche Achsen gemaess Chapter 12:

- Documentation Score
- Test Score
- Architecture Score
- Security Score
- Knowledge Score
- Metadata Score
- Twin Score

Jede Messung besitzt einen Wertebereich 0..100 sowie eine Source und Authority-Referenzen. Fehlende Messachsen werden explizit ausgewiesen. Ein Quality Score wird niemals manuell gesetzt.

Die Implementierung erzeugt keinen Gesamtwert aus einer unvollstaendigen Messmenge. Ein vollstaendiger Gesamtwert wird deterministisch aus den sieben vorhandenen Messachsen berechnet; die Schwellwerte verbleiben unveraendert in Chapter 12.

Aktuell reale Messquellen:

- Test Score aus der gemessenen Belegung der sieben Pflicht-Testbereiche;
- Security Score aus der bereits bestehenden SecurityComplianceAuditor-Aggregation der `SECURITY`-Scanner.

Documentation, Architecture, Knowledge, Metadata und Twin bleiben ohne autoritative numerische Messquelle explizit offen.

## CoverageCollector

`src/platform/Quality/Coverage/CoverageCollector.ts`

Der CoverageCollector misst reale Testdateien in:

```text
tests/unit
tests/integration
tests/contract
tests/architecture
tests/security
tests/performance
tests/e2e
```

Nur ausfuehrbare `*.test.*`-/`*.spec.*`-Dateien gelten als Testbereich-Evidence. Verzeichnisexistenz und `.gitkeep` gelten nicht als Coverage.

Optional liest der Collector reale Code-Coverage aus `coverage/coverage-summary.json` oder `.quality/coverage-summary.json`. Ohne ein solches Artefakt bleiben Statement-, Branch-, Function- und Line-Coverage `NOT_AVAILABLE`.

## TechnicalDebtRegister

`src/platform/Quality/TechnicalDebt/TechnicalDebtRegister.ts`

Jede technische Schuld besitzt mindestens ID, betroffene Komponente, Ursache, Auswirkung, Aufwand, Prioritaet, Zielversion, Erstellungszeitpunkt, Source-Referenzen und Status.

Ein Eintrag wird niemals stillschweigend ueberschrieben, geloescht oder geschlossen. `resolve()` verlangt Resolution-Evidence und einen nachvollziehbaren Abschlusszeitpunkt.

## DocumentationConsistencyValidator

`src/platform/Quality/Validators/DocumentationConsistencyValidator.ts`

ergaenzt den bestehenden Documentation-Hygiene-Validator ausschliesslich um QM-spezifische Konsistenzpruefungen. Er dupliziert keine der 57 Documentation-Governance-Regeln aus ESS-0012-CONTRACTS.

## QualityCenterOrchestrator

`src/platform/Quality/Orchestration/QualityCenterOrchestrator.ts`

erzeugt aus Coordinator, GateRunner, ScoreCalculator, CoverageCollector und TechnicalDebtRegister einen zusammenhaengenden, read-only Quality-Center-Report.

Event-Publikationsfehler werden als Evidence ausgewiesen und verleihen dem Quality Center keine zusaetzliche Authority.

---

# Chapter 3 — Interfaces

## IValidatorRegistry

```text
register(validator)
resolve(domain)
list()
domains()
```

## RepositoryQualityObservation

```text
observe(scope)
```

Contract: `repository-quality-observation/1.1.0`

## IQualityGate

```text
identifier()
validators()
execute(scope)
result()
```

Ausfuehrbare Core-Entsprechung: `QualityGateRunner.run(observation)`.

## IScoreCalculator

```text
calculate(measurements)
threshold(lifecycle)
```

Der Core implementiert die Messwertberechnung. Lifecycle-Schwellwerte werden nicht im Quality Center neu definiert oder veraendert.

## ICoverageCollector

```text
collect(repoRoot, checkedAt) -> QualityCoverageSnapshot
```

## ITechnicalDebtRegister

```text
record(debt)
list(component?)
resolve(id, evidence)
snapshot()
```

## IQualityCenter

```text
run(scope) -> QualityCenterReport
```

---

# Chapter 4 — Governance-, Compliance- und EventMesh-Orchestrierung

## Governance

`src/platform/Governance` stellt den neutralen Evidence-Vertrag bereit. Governance fuehrt keine Quality-Validatoren aus und das Quality Center darf Governance-Authorities nicht veraendern.

## Compliance

Die bestehende Compliance-Komponente und `runAllScanners()` bleiben unveraendert fachliche Source-of-Evidence. Der Quality-Adapter projiziert reale Scanner-Ergebnisse in den gemeinsamen Evidence-Vertrag.

Mapping fuer die Quality-Orchestrierung:

- `CRITICAL` / `HIGH` -> blockierende `error` Evidence;
- `MEDIUM` -> `warning`;
- `LOW` -> `info`.

Die Original-Severity bleibt als `sourceSeverity` erhalten. Das Mapping veraendert keine Compliance-Regel und keine ISO-Zuordnung.

Der Security Score verwendet dieselbe gerundete arithmetische Mittelwertbildung der `SECURITY`-Scanner wie `src/platform/Compliance/store.ts`.

## EventMesh

`scripts/automation/qualityEventMeshSink.ts` publiziert ueber den bestehenden `eventMeshBus`. Die Quality-Events sind im zentralen `STANDARD_EVENT_CATALOG` registriert.

Der Quality-Center-CLI publiziert real:

- `ValidationStartedEvent`;
- `ValidationCompletedEvent` / `ValidationFailedEvent`;
- `QualityGatePassedEvent` / `QualityGateFailedEvent`;
- `QualityScoreChangedEvent`, wenn ein vorheriger vollstaendiger Score vorliegt und sich aendert;
- `CoverageCalculatedEvent`.

`TechnicalDebtDetectedEvent` und `TechnicalDebtResolvedEvent` sind katalogisiert, werden aber erst dann als produktiv erzeugt bewertet, wenn `TechnicalDebtRegister.record()` und `resolve()` selbst an einen Event-Sink gekoppelt sind.

## Supervisor

Das Quality Center liefert Evidence, Gate-Ergebnisse, Messungen und Debt-Status. Eine technische `blocking`-Kennzeichnung ist ein Evidence-Zustand und keine eigenstaendige Human-/Supervisor-Freigabeentscheidung.

## Release / Version

Die Plattformversions-Authority bleibt unter ADR-0096 `package.json#version` ueber den Release Control Plane. Quality liest diese Projektion nur read-only.

---

# Chapter 5 — Testarchitektur

Die vorgesehenen Testbereiche sind codebasiert belegt. Quality-spezifische Pruefungen existieren mindestens in:

- `tests/unit/coverageCollector.test.ts`;
- `tests/contract/qualityCenterContract.test.ts`;
- `tests/architecture/qualityCenterBoundary.test.ts`;
- `tests/security/qualityCenterAuthorityBoundary.test.ts`;
- `tests/performance/qualityCenterDeterminism.test.ts`;
- `tests/e2e/qualityCenterOrchestration.test.ts`.

`tests/integration` war bereits mit realen Integrationstests belegt.

Testdatei-Coverage ist kein Ersatz fuer einen bestandenen Testlauf. Der Test-Gate-Status bleibt daher ohne Execution-Evidence `NOT_AVAILABLE`.

---

# Chapter 6 — Implementierungsstatus 2026-08-20

## Implementiert

- neutraler Governance-Evidence-Contract;
- zentrale ValidatorRegistry;
- RepositoryQualityCoordinator;
- Composition-Adapter fuer Platform Version, Documentation Hygiene, QM Documentation Consistency, Repository Conventions, Vocabulary und Compliance;
- QualityCenterContract `1.1.0`;
- QualityGateRunner fuer alle acht Gate-IDs mit Evidence-Coverage-Semantik;
- QualityScoreCalculator;
- CoverageCollector mit realer Pflicht-Testbereich-Messung und optionaler Code-Coverage-Ingestion;
- reale Test- und Security-Score-Provider;
- TechnicalDebtRegister;
- QualityCenterOrchestrator;
- QM-Dokumentationskonsistenz-Validator;
- EventMesh-Publikation fuer Quality-Lifecycle-/Gate-/Coverage-Ereignisse;
- CLI `npm run repository:quality:check`;
- Unit-, Contract-, Architecture-, Security-, Performance-, Integration- und E2E-Testbereiche mit realen Testdateien.

## Noch nicht als vollstaendig implementiert zu bewerten

- komplette Abdeckung aller Pflichtvalidatoren aus Chapter 12;
- vollstaendige Execution-Evidence aller acht Gates, insbesondere Contract/Test/Build;
- reale Measurement-Provider fuer Documentation, Architecture, Knowledge, Metadata und Twin;
- Statement-/Branch-/Function-/Line-Coverage ohne erzeugtes Coverage-Artefakt;
- Technical-Debt-Events direkt aus Debt-Mutationsoperationen.

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

- saemtliche Pflichtvalidatoren aus Chapter 12 registriert und ausfuehrbar sind;
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

ESS-0005 bleibt die verbindliche Komponentenspezifikation des Quality Centers. Dieses Implementation-Sync aendert keine Quality-Regeln, Severity-Stufen oder Lifecycle-Schwellwerte; es aktualisiert den realen Umsetzungsstand innerhalb der bereits bestehenden Authority-Grenzen.

## Version History

| Version | Status | Beschreibung |
|---|---|---|
| 1.0.0 | Initial Release | Erste Komponentenspezifikation des Quality Center |
| 1.1.0 | Implementation sync | ADR-0096-/P0-P2-Abgleich und codebasierte Quality-Center-Core-Orchestrierung mit Coverage, Scoring-Providern und EventMesh-Integration |

---

# End of Document

ESS-0005

CAPITAL-AI Quality Center

Version 1.1.0
