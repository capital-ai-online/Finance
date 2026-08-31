---
skill:
  id: ESS-0005
  name: Quality Center
  version: 1.2.0
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
    - Release oder Deployment Autorisierung
    - Frontend Product Architecture
    - Financial Runtime Logic

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
    - ADR-0103
  projectRoadmap: docs/projects/quality-management/ROADMAP.md
  takeoverIndex: docs/projects/quality-management/TAKEOVER_INDEX.md
  runbooks:
    - docs/projects/quality-management/runbooks/QM_ROADMAP_TAKEOVER_AND_SYNC.md
    - docs/projects/quality-management/runbooks/QM_RUNTIME_QUALITY_TRIAGE.md
    - docs/projects/quality-management/runbooks/QM_CI_REGRESSION_GATE.md
    - docs/projects/quality-management/runbooks/QM_EVIDENCE_COLLECTION.md
    - docs/projects/quality-management/runbooks/QM_RELEASE_READINESS_HANDOFF.md
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
updated: 2026-08-31
---

# Quality Center

## Enterprise Purpose

`src/platform/Quality` ist die zentrale **read-only Ausfuehrungs-, Mess- und Orchestrierungsgrenze** fuer die in `ESS-0001-CONTRACTS` Chapter 12 definierten Validation-&-Quality-Contracts.

Das Quality Center fuehrt bestehende Validatoren aus, aggregiert Evidence und stellt einen einheitlichen Quality-/Panel-Report bereit. Es definiert keine fachlichen Governance-, Compliance-, Security-, Market-Data-, Scoring-, Ranking-, Release-, Frontend-Produkt- oder IAM-Regeln.

Ein Gate ohne vollstaendige Evidence darf nicht als bestanden gelten. Ein Quality Score darf weder manuell gesetzt noch aus fehlender Evidence konstruiert werden.

`docs/projects/quality-management/ROADMAP.md` koordiniert nach Wirksamwerden von ADR-0103 die **operative Ausfuehrung** von QM-Arbeitspaketen. Diese Projektroadmap erweitert keine technische oder fachliche Authority dieses ESS.

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
| SC-MD-SPT / bestehende Domain Authorities | kanonische Finanz-/Runtime-Wertschoepfungskette und Domain-Mutation |
| ADR-0096 | Governance Control Plane, Registry, Lifecycle und Supersession |
| ADR-0103 | vorgeschlagene Single-Execution-Authority fuer QM-Projektarbeit |
| **ESS-0005** | **Ausfuehrung, Aggregation, Messung und read-only Quality-Projektion** |

Quality besitzt keine Merge-, Release-, Deployment-, IAM-, Finanzdaten-, Scoring-, Ranking- oder Produktionsmutations-Authority.

---

# Chapter 2 — Komponentenarchitektur

## ValidatorRegistry

`src/platform/Validators/ValidatorRegistry.ts` registriert und loest vorhandene Quality-Adapter deterministisch auf. Doppelte Domain-Registrierungen werden abgelehnt. Die Registry definiert keine fachliche Regel. CAPITAL-AI-QM fuehrt keine zweite ValidatorRegistry ein.

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

`MandatoryValidatorCatalog` bildet alle 16 Identitaeten maschinenlesbar ab. `Chapter12ValidatorRunner` stellt fuer 16/16 einen ausfuehrbaren, seiteneffektfreien Pruefer oder Adapter auf eine bereits autoritative Source-of-Evidence bereit.

`AVAILABLE` beschreibt nur die Ausfuehrbarkeit eines Validators. Repository-Konformitaet wird getrennt als `PASS`, `FAIL` oder `NOT_AVAILABLE` ausgewiesen. Eine Evidence-Luecke darf nicht als PASS verschleiert werden.

## RepositoryQualityCoordinator

`src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator.ts` fuehrt registrierte Repository-Quality-Adapter aus und normalisiert Evidence. Er ersetzt keine Domain-Validatoren.

## QualityCenterContract

Der Quality-Center-Report verbindet Repository Quality Observation, Mandatory Validator Coverage, Chapter-12-Execution, acht Quality Gates, Quality Score Evidence, Test-/Code-Coverage, commitgebundene Contract-/Test-/Build-Evidence, Technical Debt, Quality Events und die read-only FinTech-Wertschoepfungsketten-Projektion.

## QualityGateRunner

Die acht Gate-IDs bleiben durch ESS-0001-CONTRACTS autorisiert:

1. Contract-Konformitaet
2. Architektur-Konformitaet
3. Versionskonformitaet
4. Dokumentationsstatus
5. Teststatus
6. Sicherheitsauswirkungen
7. Compliance-Auswirkungen
8. Build-Ergebnis

Gate-Semantik:

- echte Fehler-Evidence => `FAIL`;
- fehlende, nicht commitgebundene, unvollstaendige, abgebrochene oder nicht ausgefuehrte Evidence => `NOT_AVAILABLE`;
- `PASS` nur bei vollstaendiger, positiver und korrekt zugeordneter Evidence.

Contract/Test/Build werden nicht aus Dateiexistenz abgeleitet. CI-Topologie und Required Checks verbleiben bei ADR-0073/ADR-0047.

## QualityScoreCalculator

Die sieben verbindlichen Achsen sind Documentation, Test, Architecture, Security, Knowledge, Metadata und Twin. Jede Messung benoetigt Wert, Source und Authority-Referenzen. Ein Gesamtwert wird nur bei vollstaendiger Messmenge gebildet.

Wo ESS-0001-CONTRACTS keine eindeutige numerische Formel autorisiert, darf Quality keine Formel oder Ersatzschwelle erfinden. Die Achse bleibt dann explizit unvollstaendig.

## CoverageCollector

`CoverageCollector` misst reale Testevidence in `unit`, `integration`, `contract`, `architecture`, `security`, `performance` und `e2e`. Optionale Statement-/Branch-/Function-/Line-Coverage wird nur aus realer Coverage-Evidence gelesen. Ohne Artefakt lautet der Status `NOT_AVAILABLE`.

## TechnicalDebtRegister

Technical Debt wird mit ID, Komponente, Ursache, Auswirkung, Aufwand, Prioritaet, Zielversion und Evidence erfasst. Resolution verlangt Resolution-Evidence; stille Schliessung ist unzulaessig.

## DocumentationConsistencyValidator

QM-spezifische Manifest-/Vertrags-/Versionskonsistenz wird durch `DocumentationConsistencyValidator` geprueft. Fachliche Documentation-Governance verbleibt bei ESS-0012.

## FintechValueChainQualityProjection

`src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts` projiziert die bestehende Wertschöpfungskette read-only in den Quality-Center-Report. Die aktuelle Implementierung besitzt **18 Stufen**:

1. `VC-01-REQUEST-INTAKE`
2. `VC-02-IDENTITY-ACCESS`
3. `VC-03-ENTITLEMENT-USAGE`
4. `VC-04-ASSET-UAI`
5. `VC-05-ORCHESTRATION-RUNTIME-GUARD`
6. `VC-06-EVIDENCE-ACQUISITION`
7. `VC-07-DATA-VALIDATION-PROVENANCE`
8. `VC-08-DISPLAY-RESEARCH`
9. `VC-09-CLASSIFICATION-FEATURE-CONTRACT`
10. `VC-10-SCORING-MODEL-REGISTRY`
11. `VC-11-SCORING-DISPATCHER`
12. `VC-12-DOMAIN-EXECUTOR`
13. `VC-13-CANONICAL-SCORE-LINEAGE`
14. `VC-14-CONFIDENCE-DQ`
15. `VC-15-RANKING-COMPARABILITY`
16. `VC-16-RANKING-ELIGIBILITY-SLO`
17. `VC-17-EVENT-TRACEABILITY-SUPERVISOR`
18. `VC-18-DELIVERY-SURFACES`

Die fruehere 14-Stufen-Projektion ist keine aktuelle Architekturprojektion mehr. ADR-0096 und die Runtime-Implementierung sind fuer die aktuelle 18-Stufen-Sicht massgeblich.

Eine Stufe wird nur anhand vorhandener kanonischer Runtime-/Test-/Evidence-Artefakte bewertet. Quality beobachtet die Wertschöpfungskette seitlich und veraendert weder Marktdaten noch Identity/Entitlement, Klassifikation, Scores, Confidence, Ranking, Eligibility, Provider-Auswahl oder Delivery-Semantik.

Hot-Path-Isolation bleibt zwingend: MarketData, ScoringDispatcher, Domain Executor, Ranking, Orchestrator und Application Runtime duerfen keine fachliche Rueckabhaengigkeit von Quality erhalten.

## QualityCenterOrchestrator

`QualityCenterOrchestrator` verbindet die Evidence-Typen zu einem nicht-autorisierenden Panel-/Report-Snapshot und publiziert Quality-Lifecycle-Evidence ueber den **bestehenden** EventMesh. CAPITAL-AI-QM fuehrt keinen zweiten EventBus ein.

---

# Chapter 3 — Project Execution Coordination

`docs/projects/quality-management/ROADMAP.md` ist nach ADR-0103-Aktivierung die operative Projektroadmap fuer Quality-Management-Arbeitspakete.

Sie darf:

- bestehende Validatoren und Tests orchestrieren;
- Quality Work Packages aus Fachroadmaps uebernehmen;
- Evidence, Runtime-Qualitaet, Performance, Regressionen, Coverage, Technical Debt und Drift bearbeiten;
- read-only Cross-Domain-Quality-Projektionen erzeugen.

Sie darf nicht:

- ESS-0005 oder ESS-0001-CONTRACTS ueberschreiben;
- Quality-Schwellwerte veraendern;
- Domain-Authority uebernehmen;
- fachliche Security/IAM/Compliance/Governance/Release/Frontend/Financial-Regeln definieren;
- parallel zum Quellprojekt einen zweiten operativen QM-Status pflegen.

Cross-Roadmap Takeover bedeutet ausschliesslich Execution Ownership fuer den explizit abgetrennten Quality-Anteil. Die eindeutige Zuordnung erfolgt ueber `docs/projects/quality-management/TAKEOVER_INDEX.md`.

---

# Chapter 4 — Governance, Compliance, EventMesh und Traceability

Governance stellt neutrale Evidence-Vertraege bereit; Quality veraendert keine Governance-Authority.

Security-/Compliance-Scanner bleiben Source-of-Evidence ihrer fachlichen Authorities. Quality konsumiert Ergebnisse und bestehende Severity-/Score-Semantik, ohne Regeln zu kopieren.

Quality publiziert ueber den bestehenden EventMesh Quality-/Validation-Lifecycle-Evidence. Es wird kein zweiter EventBus eingefuehrt.

Traceability bleibt eigene Authority fuer Beziehungen und Coverage. Die 18-stufige Projektion verweist auf bestehende Runtime-/Test-Artefakte und ersetzt keine Traceability-Matrix.

`blocking` ist ein technischer Quality-Befund und keine Human-/Supervisor-/Release-Freigabeentscheidung.

---

# Chapter 5 — Test- und Performance-Architektur

Bestehende Quality-spezifische Unit-, Contract-, Architecture-, Security-, Performance-, Integration- und E2E-Tests werden wiederverwendet. Eine Testdatei ist kein Nachweis eines bestandenen Testlaufs.

Insbesondere bleibt `tests/unit/securityPerformancePriorityRemediation.test.ts` eine bestehende Regressionsevidence fuer Frontend-Lazy-Loading und Bundle-Grenzen; QM erzeugt keine zweite Public Shell, Routing- oder `vendor-react`-Architektur.

Runtime-/Frontend-Performance-Messungen muessen reproduzierbare Runtime-Identitaet, Umgebung, Timing-/Network-/Rendering-/Auth-Bootstrap-Evidence und bekannte Limitationen enthalten. Externe Best-Practice-Schwellen sind nur advisory, solange sie nicht durch eine bestehende CAPITAL-AI-Authority normativ adoptiert wurden.

---

# Chapter 6 — Evidence und Implementierungsstatus 2026-08-31

Codebasiert vorhanden und durch das bestehende Quality-Center-Design vorgesehen sind insbesondere:

- 16/16 ausfuehrbare Chapter-12-Pflichtvalidatoren bzw. autoritative Adapter;
- acht Quality Gates;
- commitgebundene Contract-/Test-/Build-Evidence;
- CoverageCollector;
- QualityScoreCalculator ohne synthetische Ersatzwerte;
- TechnicalDebtRegister;
- DocumentationConsistencyValidator;
- Governance-/Compliance-Evidence-Adapter;
- EventMesh-Publikation ueber den bestehenden Bus;
- read-only **18-stufige** FinTech-Wertschoepfungsketten-Projektion;
- Hot-Path-Isolationspruefung;
- QualityCenterOrchestrator;
- vorhandene Quality Unit-/Contract-/Architecture-/Security-/Performance-/Integration-/E2E-Tests.

Bewusste Evidence-Grenzen bleiben fail-safe:

- fehlende numerische Formeln duerfen nicht synthetisch ergaenzt werden;
- fehlende Coverage-Artefakte sind `NOT_AVAILABLE`;
- fachliche Knowledge-/Twin-Luecken bleiben Findings;
- fehlende Execution-Evidence fuer einen Commit bleibt `NOT_AVAILABLE`;
- ein vorhandener Test oder Workflow ist kein PASS-Nachweis.

---

# Enterprise Rules

1. Kein Quality Gate ohne vollstaendige oder explizit fehlend ausgewiesene Evidence.
2. Keine Kennzahl ohne autoritative Messung.
3. Keine manuelle oder synthetische Vergabe von Quality Scores.
4. Keine stille Schliessung technischer Schulden.
5. Keine Aenderung normativer Quality-Schwellwerte durch Quality Center oder QM-Projekt.
6. Keine Duplikation von Governance-, Compliance-, Security-, Release-, EventMesh-, Auth-, Router-, Validator-, Scoring-, Ranking- oder Value-Chain-Authority.
7. `QUALITY READY` ist keine Merge-, Deployment- oder Production-Freigabe.
8. Fehlende, falschem Commit zugeordnete oder nicht ausgefuehrte Evidence ist `NOT_AVAILABLE`.
9. Die 18-stufige Runtime-Projektion ist zu dokumentieren; veraltete 14-Stufen-Projektionen duerfen nicht als aktuelle Architektur fortgefuehrt werden.
10. Historische ADR/ESS bleiben tracebar und werden nur gemaess ADR-0096 explizit superseded/suspended/historical gesetzt.