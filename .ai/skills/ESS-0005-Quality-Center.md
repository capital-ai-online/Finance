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
  collaborates:
    - Documentary Engine
    - Supervisor
    - Platform Director
    - Governance Control Plane
    - Security & Compliance
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
    - ESS-0017
  relatedAdr:
    - ADR-0010
    - ADR-0012
    - ADR-0016
    - ADR-0030
    - ADR-0096
  relatedComponents:
    - src/platform/Quality
    - src/platform/Validators
    - src/platform/Governance
    - src/platform/Compliance
    - src/platform/Documentary/Governance
    - src/platform/Vocabulary
    - src/platform/Release
    - src/platform/Telemetry
    - tests
  relatedSkills:
    - .ai/skills/ESS-0001-Contracts.md
    - .ai/skills/ESS-0006-Security-Compliance.md
    - .ai/skills/ESS-0012-Documentation-Governance.md
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
| ESS-0017 | Vocabulary-/Terminologie-Regeln |
| Governance Control Plane | neutrale, wiederverwendbare Authority-/Evidence-Vertraege |
| **ESS-0005** | **Ausfuehrung, Aggregation und Messung im Quality Center** |

## Dependency Boundary

Das Quality Center konsumiert den neutralen Repository-Quality-Evidence-Vertrag aus `src/platform/Governance` und die zentrale Registry aus `src/platform/Validators`.

Fachliche Cross-Domain-Validatoren werden ueber eine Composition-Schicht injiziert. Dadurch entstehen keine direkten Quality-Abhaengigkeiten, die Governance-, Compliance-, Release-, Documentary- oder Vocabulary-Authority duplizieren.

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

Der Vertrag `quality-center-contract/1.0.0` verbindet Repository-Evidence, Gate-Ergebnisse, Quality-Messungen und Technical-Debt-Evidence zu einem einheitlichen Quality-Center-Report.

Dieser Vertrag ist eine Orchestrierungs- und Evidence-Schnittstelle. Er ersetzt keine bestehende Governance- oder Compliance-Authority.

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

## TechnicalDebtRegister

`src/platform/Quality/TechnicalDebt/TechnicalDebtRegister.ts`

Jede technische Schuld besitzt mindestens:

- ID
- betroffene Komponente
- Ursache
- Auswirkung
- Aufwand
- Prioritaet
- Zielversion
- Erstellungszeitpunkt
- Source-Referenzen
- Status

Ein Eintrag wird niemals stillschweigend ueberschrieben, geloescht oder geschlossen. `resolve()` verlangt Resolution-Evidence und einen nachvollziehbaren Abschlusszeitpunkt.

## DocumentationConsistencyValidator

`src/platform/Quality/Validators/DocumentationConsistencyValidator.ts`

Der Validator ergaenzt den bestehenden Documentation-Hygiene-Validator ausschließlich um QM-spezifische Konsistenzpruefungen:

- Quality-/Validator-Manifeste;
- ESS-0005-/README-/Registry-Versionskonsistenz;
- deklarierte Quality-Vertraege;
- Existenz deklarierter Quality-Tests;
- CLI-Vertrag;
- veraltete No-Implementation-Aussagen.

Er dupliziert keine der 57 Documentation-Governance-Regeln aus ESS-0012-CONTRACTS.

## QualityCenterOrchestrator

`src/platform/Quality/Orchestration/QualityCenterOrchestrator.ts`

Der Orchestrator erzeugt aus Coordinator, GateRunner, ScoreCalculator und TechnicalDebtRegister einen zusammenhaengenden, read-only Quality-Center-Report.

Der Report fuehrt Governance- und Compliance-Referenzen explizit mit und traegt einen non-authorizing Contract-Hinweis.

## CoverageCollector

Der CoverageCollector bleibt Teil des ESS-0005-Zielbilds. Ein produktiver Collector darf erst als implementiert gelten, wenn reale Messdaten aus den vorgesehenen Testbereichen vorliegen:

```text
tests/unit
tests/integration
tests/contract
tests/architecture
tests/security
tests/performance
tests/e2e
```

Verzeichnisexistenz allein ist keine Coverage-Evidence.

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

# Chapter 4 — Governance- und Compliance-Orchestrierung

## Governance

`src/platform/Governance` stellt den neutralen Evidence-Vertrag bereit. Governance fuehrt keine Quality-Validatoren aus und das Quality Center darf Governance-Authorities nicht veraendern.

## Compliance

Die bestehende Compliance-Komponente und `runAllScanners()` bleiben unveraendert fachliche Source-of-Evidence. Der Quality-Adapter projiziert reale Scanner-Ergebnisse in den gemeinsamen Evidence-Vertrag.

Mapping fuer die Quality-Orchestrierung:

- `CRITICAL` / `HIGH` -> blockierende `error` Evidence;
- `MEDIUM` -> `warning`;
- `LOW` -> `info`.

Die Original-Severity bleibt als `sourceSeverity` erhalten. Das Mapping veraendert keine Compliance-Regel und keine ISO-Zuordnung.

## Supervisor

Das Quality Center liefert Evidence, Gate-Ergebnisse, Messungen und Debt-Status. Eine technische `blocking`-Kennzeichnung ist ein Evidence-Zustand und keine eigenstaendige Human-/Supervisor-Freigabeentscheidung.

## Release / Version

Die Plattformversions-Authority bleibt unter ADR-0096 `package.json#version` ueber den Release Control Plane. Quality liest diese Projektion nur read-only.

---

# Chapter 5 — Events

Der in ESS-0005 definierte Zielkatalog bleibt:

- ValidationStartedEvent
- ValidationCompletedEvent
- ValidationFailedEvent
- QualityGatePassedEvent
- QualityGateFailedEvent
- QualityScoreChangedEvent
- TechnicalDebtDetectedEvent
- TechnicalDebtResolvedEvent
- CoverageCalculatedEvent

Der aktuelle Quality-Center-Core erzeugt **keine synthetischen EventMesh-Events**. Events duerfen erst nach realer EventMesh-Integration als implementiert deklariert werden.

---

# Chapter 6 — Implementierungsstatus 2026-08-20

## Implementiert

- neutraler Governance-Evidence-Contract;
- zentrale ValidatorRegistry;
- RepositoryQualityCoordinator;
- Composition-Adapter fuer Platform Version, Documentation Hygiene, QM Documentation Consistency, Repository Conventions, Vocabulary und Compliance;
- QualityCenterContract;
- QualityGateRunner fuer alle acht Gate-IDs mit Evidence-Coverage-Semantik;
- QualityScoreCalculator;
- TechnicalDebtRegister;
- QualityCenterOrchestrator;
- QM-Dokumentationskonsistenz-Validator;
- CLI `npm run repository:quality:check`;
- gezielte Unit-Tests fuer Registry, Coordinator, Adapter, Gates, Scoring, Debt, Dokumentationskonsistenz und Orchestrator.

## Noch nicht als vollstaendig implementiert zu bewerten

- komplette Abdeckung aller Pflichtvalidatoren aus Chapter 12;
- vollstaendige Evidence-Abdeckung aller acht Gates;
- produktiver CoverageCollector mit realen Coverage-Messungen;
- reale Measurement-Provider fuer alle sieben Quality-Score-Achsen;
- EventMesh-Integration der Quality Events.

Diese offenen Punkte werden transparent als fehlende Evidence behandelt und niemals als PASS oder Messwert simuliert.

---

# Enterprise Rules

Kein Contract ohne Validator-Abdeckung.

Kein Quality Gate ohne ausfuehrbare oder explizit fehlend ausgewiesene Evidence.

Keine Kennzahl ohne Messung.

Keine manuelle Vergabe von Quality Scores.

Keine stille Schliessung technischer Schulden.

Keine Aenderung von Quality-Schwellwerten durch das Quality Center.

Keine Duplikation von Governance-, Compliance-, Security-, Release-, Vocabulary- oder Documentation-Regeln.

Keine Merge-, Release-, Deployment- oder Produktionsautorisierung durch Quality Evidence.

---

# Success Criteria

Das vollstaendige ESS-0005-Zielbild ist erreicht, wenn:

- saemtliche Pflichtvalidatoren aus Chapter 12 registriert und ausfuehrbar sind;
- saemtliche acht Quality Gates vollstaendige Evidence besitzen;
- saemtliche sieben Quality-Metriken aus realen Messquellen deterministisch berechnet werden;
- die vorgesehenen Testbereiche mit realer Coverage-Evidence belegt sind;
- technische Schulden vollstaendig erfasst und evidenzbasiert geschlossen werden;
- QM-Dokumentation und Implementierungsmetadaten driftfrei bleiben;
- reale Quality Events ueber EventMesh integriert sind.

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
| 1.1.0 | Implementation sync | ADR-0096-/Repository-Quality-Abgleich; Quality-Center-Core dokumentiert, keine neue Rule-/Threshold-Authority |
