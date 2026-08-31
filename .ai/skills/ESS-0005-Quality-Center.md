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
    Dieses Dokument spezifiziert ausschliesslich src/platform/Quality.
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
    - Read-only 18-stage Value Chain Quality Projection
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
    - Market Data
    - UAI execution
    - Data Quality runtime ownership
    - fachliche Scoring- oder Rankingregeln
    - Market-Data-Provider-Routing
    - Quality-Schwellwerte
    - Governance Authorities
    - Compliance Regeln
    - IAM Berechtigungen
    - Release oder Deployment Autorisierung
    - Frontend Product Architecture
    - Financial Runtime Logic
    - Production state

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
  projectContract: docs/projects/quality-management/PROJECT_CONTRACT_V2.md
  projectRoadmap: docs/projects/quality-management/ROADMAP.md
  referralIndex: docs/projects/quality-management/TAKEOVER_INDEX.md
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

Das Quality Center fuehrt bestehende Validatoren aus, aggregiert Evidence, bewertet Quality-Zustaende und stellt einen einheitlichen Quality-/Panel-Report bereit. Es definiert keine fachlichen Governance-, Compliance-, Security-, Data-, Market-Data-, Scoring-, Ranking-, Release-, Frontend-Produkt- oder IAM-Regeln.

Ein Gate ohne vollstaendige Evidence darf nicht als bestanden gelten. Ein Quality Score darf weder manuell gesetzt noch aus fehlender Evidence konstruiert werden.

`CAPITAL-AI-QM-V2` nutzt den Quality Center als **unabhaengigen Assurance-Sidecar**. QM darf technische Remediation identifizieren, spezifizieren und nach Umsetzung verifizieren, aber nicht in einer fremden VC-Domaene ausfuehren.

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
| SC-MD-SPT / Domain Authorities | kanonische Finanz-/Runtime-Wertschoepfungskette und Domain-Mutation |
| ADR-0096 | Governance Control Plane, Registry, Lifecycle und Supersession |
| ADR-0103 | vorgeschlagene unabhaengige QM-Assurance-Koordination |
| `CAPITAL-AI-QM-V2` | Primary-Owner-Routing, Finding-/Referral-/Verification-Modell |
| **ESS-0005** | **Quality-Ausfuehrung, Aggregation, Messung und read-only Projektion** |

Quality besitzt keine Merge-, Release-, Deployment-, IAM-, Daten-, Scoring-, Ranking-, Routing- oder Produktionsmutations-Authority.

---

# Chapter 2 — Komponentenarchitektur

## ValidatorRegistry

`src/platform/Validators/ValidatorRegistry.ts` registriert und loest vorhandene Quality-Adapter deterministisch auf. Doppelte Domain-Registrierungen werden abgelehnt. CAPITAL-AI-QM fuehrt keine zweite ValidatorRegistry ein.

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

`AVAILABLE` beschreibt nur die Ausfuehrbarkeit. Repository-Konformitaet wird getrennt als `PASS`, `FAIL` oder `NOT_AVAILABLE` ausgewiesen. Eine Evidence-Luecke darf nicht als PASS verschleiert werden.

## RepositoryQualityCoordinator

`src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator.ts` fuehrt registrierte Repository-Quality-Adapter aus und normalisiert Evidence. Er ersetzt keine Domain-Validatoren und uebernimmt keine Remediation.

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
- fehlende, nicht identity-gebundene, unvollstaendige, abgebrochene oder nicht ausgefuehrte Evidence => `NOT_AVAILABLE`;
- `PASS` nur bei vollstaendiger, positiver und korrekt zugeordneter Evidence.

CI-Topologie und Required Checks verbleiben bei ADR-0073/ADR-0047.

## QualityScoreCalculator

Die sieben verbindlichen Achsen sind Documentation, Test, Architecture, Security, Knowledge, Metadata und Twin. Jede Messung benoetigt Wert, Source und Authority-Referenzen. Ein Gesamtwert wird nur bei vollstaendiger Messmenge gebildet.

Wo ESS-0001-CONTRACTS keine eindeutige numerische Formel autorisiert, darf Quality keine Ersatzformel oder Ersatzschwelle erfinden.

## CoverageCollector

`CoverageCollector` misst reale Testevidence in `unit`, `integration`, `contract`, `architecture`, `security`, `performance` und `e2e`. Ohne reales Coverage-Artefakt lautet der entsprechende Status `NOT_AVAILABLE`.

## TechnicalDebtRegister

Technical Debt wird mit ID, Komponente, Ursache, Auswirkung, Aufwand, Prioritaet, Zielversion und Evidence erfasst. Resolution verlangt Resolution-Evidence; stille Schliessung ist unzulaessig. Bei Fremddomaenen wird ein Primary Owner referenziert; QM implementiert die Behebung nicht selbst.

## DocumentationConsistencyValidator

QM-spezifische Manifest-/Vertrags-/Versionskonsistenz wird durch `DocumentationConsistencyValidator` geprueft. Fachliche Documentation-Governance verbleibt bei ESS-0012.

## FintechValueChainQualityProjection

`src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts` projiziert die bestehende Wertschöpfungskette read-only in den Quality-Center-Report. Die aktuelle Implementierung besitzt 18 Stufen:

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

Die fruehere 14-Stufen-Projektion ist keine aktuelle Architekturprojektion mehr.

Quality beobachtet die Wertschoepfungskette seitlich. Eine Stufe wird nur anhand vorhandener kanonischer Runtime-/Test-/Evidence-Artefakte bewertet. Fehlende Evidence bleibt `NOT_AVAILABLE`.

Hot-Path-Isolation ist zwingend: MarketData, UAI, Data Quality Runtime, ScoringDispatcher, Domain Executor, Ranking, Orchestrator und Application Runtime duerfen keine fachliche Rueckabhaengigkeit von Quality erhalten.

## QualityCenterOrchestrator

`QualityCenterOrchestrator` verbindet Evidence zu einem nicht-autorisierenden Panel-/Report-Snapshot und publiziert Quality-Lifecycle-Evidence ueber den bestehenden EventMesh. Es wird kein zweiter EventBus eingefuehrt.

---

# Chapter 3 — CAPITAL-AI-QM-V2 Assurance Coordination

`docs/projects/quality-management/ROADMAP.md` ist nach ADR-0103-Aktivierung die operative Roadmap fuer unabhaengige Quality-/Assurance-Arbeit.

QM besitzt keine produktive VC-Stufe:

```text
primary_value_chain_ownership: []
executes_as_primary_owner: []
remediation_execution_local: false
```

Die acht Workstreams sind:

- `QM-01` Quality Criteria;
- `QM-02` Quality Gates;
- `QM-03` Quality Measurement;
- `QM-04` Findings;
- `QM-05` Regression;
- `QM-06` Technical Debt;
- `QM-07` Evidence;
- `QM-08` Continuous Improvement.

Die Primary-Owner-Zuordnung fuer Findings lautet:

| VC | Primary Owner |
|---|---|
| VC-01 | `CAPITAL-AI-CLIENT` |
| VC-02 | `CAPITAL-AI-OPS` |
| VC-03 | `CAPITAL-AI-DOC` |
| VC-04 | `CAPITAL-AI-OPS` |
| VC-05 | `CAPITAL-AI-GOV` |
| VC-06 | `CAPITAL-AI-OPS` |
| VC-07 | `CAPITAL-AI-OPS` |
| VC-08 | `CAPITAL-AI-OPS` |
| VC-09 | `CAPITAL-AI-DATA` |
| VC-10 | `CAPITAL-AI-DATA` |
| VC-11 | `CAPITAL-AI-DATA` |
| VC-12 | `CAPITAL-AI-FINTECH` |
| VC-13 | `CAPITAL-AI-FINTECH` |
| VC-14 | `CAPITAL-AI-FINTECH` |
| VC-15 | `CAPITAL-AI-FINTECH` |
| VC-16 | `CAPITAL-AI-FINTECH` |
| VC-17 | `CAPITAL-AI-FINTECH` |
| VC-18 | `CAPITAL-AI-OPS` |

Ein bestaetigtes Finding benoetigt `finding_id`, `affected_vc_stage`, `target_project`, `severity`, `evidence`, `required_remediation`, `verification_gate` und `status`.

Lifecycle:

```text
DISCOVERED -> TRIAGED -> CONFIRMED -> REFERRED -> REMEDIATING
-> EVIDENCE_READY -> VERIFIED -> CLOSED
```

Bei technischer Remediation wird der Marker verwendet:

```text
[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

QM darf den technischen Arbeitsschritt identifizieren, spezifizieren und priorisieren. Die technische Umsetzung erfolgt durch den Primary Owner im Zielprojekt. QM verifiziert anschliessend die bereitgestellte Evidence.

Der fruehere Draft-Mechanismus `HANDED_OFF_TO_QM` darf nicht dazu verwendet werden, Fremddomaenen-Execution in QM zu verschieben.

---

# Chapter 4 — Governance, Compliance, EventMesh und Traceability

Governance stellt neutrale Evidence-Vertraege bereit; Quality veraendert keine Governance-Authority.

Security-/Compliance-Scanner bleiben Source-of-Evidence ihrer fachlichen Authorities. Quality konsumiert Ergebnisse und bestehende Severity-/Score-Semantik, ohne Regeln zu kopieren.

Traceability bleibt eigene Authority fuer Beziehungen und Coverage. Die 18-stufige Projektion ersetzt keine Traceability-Matrix.

`blocking` ist ein technischer Quality-Befund und keine Human-/Supervisor-/Release-Freigabeentscheidung.

---

# Chapter 5 — Test- und Performance-Architektur

Bestehende Unit-, Contract-, Architecture-, Security-, Performance-, Integration- und E2E-Tests werden wiederverwendet. Eine Testdatei ist kein Nachweis eines bestandenen Testlaufs.

Insbesondere bleibt `tests/unit/securityPerformancePriorityRemediation.test.ts` bestehende Regressionsevidence fuer Frontend-Lazy-Loading und Bundle-Grenzen; QM erzeugt keine zweite Public Shell, Routing- oder `vendor-react`-Architektur.

Runtime-/Frontend-Performance-Messungen muessen reproduzierbare Runtime-Identitaet, Umgebung, Timing-/Network-/Rendering-/Auth-Bootstrap-Evidence und bekannte Limitationen enthalten. Externe Best-Practice-Schwellen sind advisory, solange sie nicht durch eine bestehende CAPITAL-AI-Authority adoptiert wurden.

---

# Chapter 6 — Evidence und Implementierungsstatus 2026-08-31

Codebasiert vorhanden bzw. im bestehenden Quality-Center-Design vorgesehen sind insbesondere:

- 16/16 ausfuehrbare Chapter-12-Pflichtvalidatoren bzw. autoritative Adapter;
- acht Quality Gates;
- commitgebundene Contract-/Test-/Build-Evidence;
- CoverageCollector;
- QualityScoreCalculator ohne synthetische Ersatzwerte;
- TechnicalDebtRegister;
- DocumentationConsistencyValidator;
- Governance-/Compliance-Evidence-Adapter;
- EventMesh-Publikation ueber den bestehenden Bus;
- read-only 18-stufige Wertschoepfungsketten-Projektion;
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
3. Keine synthetische Vergabe von Quality Scores.
4. Keine stille Schliessung technischer Schulden.
5. Keine Aenderung normativer Quality-Schwellwerte durch Quality Center oder QM-Projekt.
6. Keine Duplikation von Governance-, Compliance-, Security-, Release-, EventMesh-, Auth-, Router-, Validator-, Data-, Scoring-, Ranking- oder Value-Chain-Authority.
7. `QUALITY READY` ist keine Merge-, Deployment-, Release- oder Production-Freigabe.
8. Fehlende, falschem Snapshot zugeordnete oder nicht ausgefuehrte Evidence ist `NOT_AVAILABLE`.
9. Die 18-stufige Runtime-Projektion bleibt read-only Sidecar.
10. Jedes bestaetigte Finding mit technischer Remediation hat einen Primary Owner und einen Cross-Project-Handoff.
11. QM implementiert keine fremde technische Remediation.
12. Historische ADR/ESS bleiben tracebar und werden nur gemaess ADR-0096 explizit superseded/suspended/historical gesetzt.
