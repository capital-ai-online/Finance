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
    Validator-Basisvertrag, Severity-Stufen, Quality Gates, Metriken und normative
    Schwellwerte verbleiben in ESS-0001-CONTRACTS Chapter 12.

authority:
  controls:
    - Validator Registry Integration
    - Mandatory Validator Execution Coverage
    - Quality Gate Ausfuehrung
    - Quality Score Aggregation
    - Technical Debt Register
    - Test- und Coverage-Evidence
    - QM Dokumentationskonsistenz
    - Quality Event Publication
    - Read-only FinTech Value Chain Quality Projection
  collaborates:
    - Documentary Engine
    - Supervisor
    - Platform Director
    - Governance Control Plane
    - Security & Compliance
    - Enterprise Event Mesh
    - Traceability
    - Release Center
  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - fachliche Scoring- oder Rankingregeln
    - Market-Data-Provider-Routing
    - Quality-Schwellwerte
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
    - src/platform/Traceability
    - src/platform/Supervisor
    - src/platform/Documentary/Governance
    - src/platform/Vocabulary
    - src/platform/Release
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

`src/platform/Quality` ist die zentrale **read-only Ausfuehrungs-, Mess- und Orchestrierungsgrenze** fuer die in ESS-0001-CONTRACTS Chapter 12 definierten Validation-&-Quality-Contracts.

Das Quality Center fuehrt bestehende Validatoren aus, aggregiert Evidence und stellt einen einheitlichen Quality-/Panel-Report bereit. Es definiert keine fachlichen Governance-, Compliance-, Security-, Market-Data-, Scoring-, Ranking-, Release- oder IAM-Regeln.

Ein Gate ohne vollstaendige Evidence darf nicht als bestanden gelten. Ein Quality Score darf weder manuell gesetzt noch aus fehlender Evidence konstruiert werden.

---

# Chapter 1 — Authority und Abgrenzung

| Authority | Verantwortung |
|---|---|
| ESS-0001-CONTRACTS Chapter 12 | 16 Pflichtvalidatoren, Severity, acht Quality Gates, Quality-Metriken und normative Schwellen |
| ESS-0001-CONTRACTS Chapter 11 / ESS-0006 | Security-/Compliance-Regeln und Evidence-Semantik |
| ESS-0012 | Documentation-Governance-Regelwerk |
| ESS-0011 | Traceability-/Coverage-Achsen |
| ESS-0013 | EventMesh-Katalog und Routing |
| ESS-0017 | Vocabulary-/Terminologie-Regeln |
| SC-MD-SPT-0001 | kanonische Screening-/Scoring-/Market-Data-Wertschoepfungskette |
| Governance Control Plane | neutrale Authority-/Evidence-Vertraege |
| **ESS-0005** | **Ausfuehrung, Aggregation, Messung und read-only Panel-Projektion** |

Quality besitzt keine Merge-, Release-, Deployment-, IAM-, Finanzdaten- oder Produktionsmutations-Authority.

---

# Chapter 2 — Komponentenarchitektur

## ValidatorRegistry

`src/platform/Validators/ValidatorRegistry.ts` registriert und loest vorhandene Quality-Adapter deterministisch auf. Doppelte Domain-Registrierungen werden abgelehnt. Die Registry definiert keine fachliche Regel.

## MandatoryValidatorCatalog und Chapter12ValidatorRunner

ESS-0001-CONTRACTS Chapter 12 definiert exakt 16 Pflichtvalidatoren:

1. RepositoryStructureValidator
2. DirectoryResponsibilityValidator
3. NamingValidator
4. LayerValidator
5. DependencyValidator
6. InterfaceValidator
7. ManifestValidator
8. ComponentValidator
9. MetadataValidator
10. DocumentationValidator
11. EventValidator
12. VersionValidator
13. SecurityValidator
14. ComplianceValidator
15. KnowledgeValidator
16. TwinValidator

`MandatoryValidatorCatalog` bildet alle 16 Identitaeten maschinenlesbar ab. `Chapter12ValidatorRunner` stellt fuer **16/16** einen ausfuehrbaren, seiteneffektfreien Pruefer oder Adapter auf eine bereits autoritative Source-of-Evidence bereit.

**Wichtig:** `AVAILABLE` beschreibt nur die Ausfuehrbarkeit des Validators. Repository-Konformitaet wird getrennt im `chapter12-validation-report/1.0.0` mit `PASS`, `FAIL` oder `NOT_AVAILABLE` ausgewiesen. Knowledge-/Twin-Luecken bleiben dadurch reale Findings und werden nicht als fehlende Validatorimplementierung oder PASS verschleiert.

## RepositoryQualityCoordinator

`src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator.ts` fuehrt registrierte Repository-Quality-Adapter aus und normalisiert Evidence gemaess `repository-quality-observation/1.1.0`.

## QualityCenterContract

Der aktuelle Panel-/Report-Vertrag ist `quality-center-contract/1.3.0` / `quality-center-report/1.3.0`.

Er verbindet Repository Quality Observation, Mandatory Validator Implementation Coverage, Chapter-12-Execution, acht Quality Gates, Quality Score Evidence, Test-/Code-Coverage, commitgebundene Contract-/Test-/Build-Evidence, Technical Debt, Quality Events und `fintech-value-chain-quality/1.0.0`.

## QualityGateRunner

Die acht Gate-IDs sind Contract-Konformitaet, Architektur-Konformitaet, Versionskonformitaet, Dokumentationsstatus, Teststatus, Sicherheitsauswirkungen, Compliance-Auswirkungen und Build-Ergebnis.

Gate-Semantik:

- echte Fehler-Evidence => `FAIL`;
- fehlende, nicht zum Commit passende oder unvollstaendige Evidence => `NOT_AVAILABLE`;
- `PASS` nur bei vollstaendiger zugeordneter Evidence.

Contract/Test/Build werden nicht aus Dateiexistenz abgeleitet. `quality-execution-evidence/1.0.0` wird durch real ausgefuehrte Prozesse erzeugt und an den exakten 40-stelligen Git-Commit gebunden. Build-PASS erfordert den erfolgreichen Runtime-Release-Manifest-Finalizer.

## QualityScoreCalculator

Die sieben verbindlichen Achsen sind Documentation, Test, Architecture, Security, Knowledge, Metadata und Twin. Jede Messung benoetigt Wert `0..100`, Source und Authority-Referenzen. Ein Gesamtwert wird nur bei vollstaendiger Messmenge gebildet.

Autoritativ numerisch angebunden sind Test Score aus der realen Belegung der sieben Pflicht-Testbereiche und Security Score aus der bestehenden SecurityComplianceAuditor-Aggregation der SECURITY-Scanner.

ESS-0001-CONTRACTS definiert fuer Documentation, Architecture, Knowledge, Metadata und Twin aktuell keine eindeutige numerische Formel. Quality darf diese Formeln nicht erfinden. Diese Achsen bleiben daher explizit fehlend; dies ist **beabsichtigtes Fail-Safe-Verhalten und kein offener Implementierungsrest**.

## CoverageCollector

`CoverageCollector` misst reale Testdateien in `unit`, `integration`, `contract`, `architecture`, `security`, `performance` und `e2e`. Optionale Statement-/Branch-/Function-/Line-Coverage wird nur aus einem real vorhandenen `coverage-summary.json` gelesen. Ohne Artefakt lautet der Status `NOT_AVAILABLE`.

## TechnicalDebtRegister

Technical Debt wird mit ID, Komponente, Ursache, Auswirkung, Aufwand, Prioritaet, Zielversion und Evidence erfasst. `resolve()` verlangt Resolution-Evidence. Es gibt keine stille Schliessung.

## DocumentationConsistencyValidator

QM-spezifische Manifest-/Vertrags-/Versionskonsistenz wird durch `DocumentationConsistencyValidator` geprueft. Fachliche Documentation-Governance verbleibt bei ESS-0012.

## FintechValueChainQualityProjection

`src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts` projiziert die kanonische SC-MD-SPT-Kette read-only in den Quality-Center-Report.

Die 14 geprueften Stufen sind:

1. Asset Catalog / Request
2. Universal Asset Identity
3. Evidence Acquisition
4. Evidence / Data Quality Gate
5. Classification + Feature Contract
6. ScoringModelRegistry
7. ScoringDispatcher
8. Domain Executor Adapter
9. CanonicalScoreResult + execution lineage
10. Confidence / DQ Composite
11. Ranking comparability gate
12. Ranking / Eligibility / SLO
13. EventMesh / Traceability / Supervisor
14. API / UI / Alerts / downstream evidence

Eine Stufe ist `CONNECTED`, wenn die kanonischen Runtime- und Test-/Evidence-Artefakte vorhanden sind.

`homogeneous=true` verlangt zusaetzlich Hot-Path-Isolation. MarketDataGateway, ScoringDispatcher, Executor, Ranking, Orchestrator und Application Runtime duerfen keine direkte Quality-Abhaengigkeit erhalten.

Quality beobachtet damit die Wertschoepfungskette **seitlich**. Es veraendert keine Marktdaten, Klassifikation, Scores, Confidence, Ranking, Eligibility oder Provider-Auswahl.

## QualityCenterOrchestrator

`QualityCenterOrchestrator` verbindet alle Evidence-Typen zu einem einzigen nicht-autorisierenden Panel-/Report-Snapshot und publiziert Quality-Lifecycle-Evidence ueber den bestehenden EventMesh.

---

# Chapter 3 — Interfaces

```text
ValidatorRegistry
  register(adapter)
  resolve(domain)
  list()

MandatoryValidatorCatalog
  resolve(name)
  snapshot() -> mandatory-validator-coverage/1.0.0

Chapter12ValidatorRunner
  run(scope) -> chapter12-validation-report/1.0.0

RepositoryQualityCoordinator
  observe(scope) -> repository-quality-observation/1.1.0

QualityGateRunner
  run(observation, evidence) -> quality-gate-report/1.0.0

CoverageCollector
  collect(repoRoot, checkedAt) -> quality-coverage/1.0.0

FintechValueChainQualityProjection
  project(repoRoot, checkedAt) -> fintech-value-chain-quality/1.0.0

QualityCenterOrchestrator
  run(scope) -> quality-center-report/1.3.0
```

---

# Chapter 4 — Governance, Compliance, EventMesh und Traceability

Governance stellt neutrale Evidence-Vertraege bereit; Quality veraendert keine Governance-Authority.

`runAllScanners()` bleibt Security-/Compliance-Source-of-Evidence. Quality konsumiert bestehende Scanner-Ergebnisse und Severity-/Score-Semantik, ohne Regeln zu kopieren.

Quality publiziert ueber den bestehenden EventMesh-Sink `ValidationStartedEvent`, `ValidationCompletedEvent` / `ValidationFailedEvent`, `QualityGatePassedEvent` / `QualityGateFailedEvent`, `QualityScoreChangedEvent`, `CoverageCalculatedEvent` sowie `TechnicalDebtDetectedEvent` / `TechnicalDebtResolvedEvent`. Es wird kein zweiter EventBus eingefuehrt.

Traceability bleibt eigene Authority fuer Beziehungen und Coverage. Die FinTech-Wertschoepfungsketten-Projektion verweist auf bestehende Runtime-/Test-Artefakte und ersetzt keine Traceability-Matrix.

Quality liefert Supervisor-Evidence. `blocking` ist ein technischer Befund und keine Human-/Supervisor-Freigabeentscheidung.

Versions- und Release-Authority verbleibt beim Release Control Plane. Quality konsumiert Version-/Build-Evidence read-only.

---

# Chapter 5 — Testarchitektur

Quality-spezifisch abgesichert sind insbesondere:

- `tests/unit/validatorRegistry.test.ts`;
- `tests/unit/mandatoryValidatorCatalog.test.ts`;
- `tests/unit/chapter12ValidatorRunner.test.ts`;
- `tests/unit/qualityGateRunner.test.ts`;
- `tests/unit/qualityExecutionEvidence.test.ts`;
- `tests/unit/qualityScoreCalculator.test.ts`;
- `tests/unit/coverageCollector.test.ts`;
- `tests/unit/technicalDebtRegister.test.ts`;
- `tests/unit/documentationConsistencyValidator.test.ts`;
- `tests/unit/qualityCenterOrchestrator.test.ts`;
- `tests/contract/qualityCenterContract.test.ts`;
- `tests/architecture/qualityCenterBoundary.test.ts`;
- `tests/architecture/qualityFintechValueChainProjection.test.ts`;
- `tests/security/qualityCenterAuthorityBoundary.test.ts`;
- `tests/performance/qualityCenterDeterminism.test.ts`;
- `tests/e2e/qualityCenterOrchestration.test.ts`.

Testdatei-Coverage ist kein Ersatz fuer einen bestandenen Testlauf.

---

# Chapter 6 — Implementierungsstatus 2026-08-20

## Contract-complete

Codebasiert umgesetzt sind:

- 16/16 ausfuehrbare Chapter-12-Pflichtvalidatoren;
- separater realer Chapter-12-Konformitaetsreport;
- acht Quality Gates;
- commitgebundene Contract-/Test-/Build-Evidence;
- QualityCenterContract / Report `1.3.0`;
- CoverageCollector;
- QualityScoreCalculator ohne Ersatzwerte;
- autoritative Test-/Security-Score-Provider;
- TechnicalDebtRegister;
- DocumentationConsistencyValidator;
- Governance-/Compliance-Adapter;
- EventMesh-Publikation;
- read-only 14-stufige FinTech-Wertschoepfungsketten-Projektion;
- Hot-Path-Isolationspruefung;
- CLI `npm run repository:quality:check`;
- Unit-, Contract-, Architecture-, Security-, Performance-, Integration- und E2E-Evidence.

## Bewusste Evidence-Grenzen

Folgende Zustaende sind **kein Implementierungs-TODO** und duerfen nicht synthetisch geschlossen werden:

- fehlende numerische Formeln fuer Documentation/Architecture/Knowledge/Metadata/Twin;
- fehlende Statement-/Branch-/Function-/Line-Coverage ohne reales Coverage-Artefakt;
- fachliche Knowledge-/Twin-Artefaktluecken, die der ausfuehrbare Validator als Finding meldet;
- fehlende Execution-Evidence fuer einen noch nicht real ausgefuehrten Commit.

---

# Enterprise Rules

Kein Quality Gate ohne vollstaendige oder explizit fehlend ausgewiesene Evidence.

Keine Kennzahl ohne autoritative Messung.

Keine manuelle Vergabe von Quality Scores.

Keine stille Schliessung technischer Schulden.

Keine Aenderung von Quality-Schwellwerten durch das Quality Center.

Keine Duplikation von Governance-, Compliance-, Security-, Release-, EventMesh-, Traceability-, Vocabulary-, Documentation-, Market-Data-, Scoring- oder Ranking-Regeln.

Keine direkte Quality-Kopplung in die finanzielle Hot Path.

Keine Merge-, Release-, Deployment- oder Produktionsautorisierung durch Quality Evidence.

---

# Success Criteria

Das ESS-0005-Implementierungsziel ist erreicht, wenn:

- alle 16 Pflichtvalidatoren ausfuehrbar sind;
- reale Validatorergebnisse separat von Implementierungsabdeckung ausgewiesen werden;
- alle acht Quality Gates reale Evidence konsumieren und fail-closed arbeiten;
- Contract/Test/Build an den exakten Commit gebunden nachgewiesen werden;
- Quality Scores ausschliesslich aus autoritativen Messwerten entstehen;
- Technical Debt evidenzpflichtig verwaltet wird;
- Quality Events den bestehenden EventMesh verwenden;
- die kanonische FinTech-Wertschoepfungskette strukturell/evidenzbasiert im Panel sichtbar ist;
- die finanzielle Hot Path frei von direkter Quality-Kopplung bleibt;
- fehlende fachliche oder numerische Evidence niemals als PASS oder Ersatzscore simuliert wird.
