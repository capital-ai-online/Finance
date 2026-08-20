# Quality Center Core Orchestration

**Status:** CODE-BACKED IMPLEMENTATION  
**Date:** 2026-08-20  
**Authority:** ESS-0001-CONTRACTS Chapter 11/12, ESS-0005, ESS-0006, ESS-0013, ADR-0012, ADR-0018, ADR-0096

## Ziel

Die vorhandene Repository-Quality-Baseline ist zu einem zentral orchestrierten Quality Center erweitert, ohne Governance-, Compliance-, Security-, Release-, EventMesh- oder Dokumentationsregeln zu duplizieren.

## Komponenten

| Komponente | Pfad | Verantwortung |
|---|---|---|
| Governance Evidence Contract | `src/platform/Governance/Contracts/RepositoryQualityEvidence.ts` | neutraler, non-authorizing Evidence-Umschlag |
| Validator Registry | `src/platform/Validators/ValidatorRegistry.ts` | zentrale Registrierung/Aufloesung vorhandener Validatoren |
| Mandatory Validator Catalog | `src/platform/Validators/MandatoryValidatorCatalog.ts` | exakte 16er-Chapter-12-Coverage mit AVAILABLE/PARTIAL/NOT_AVAILABLE |
| Repository Quality Coordinator | `src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator.ts` | deterministische Evidence-Aggregation |
| Quality Center Contract | `src/platform/Quality/Contracts/QualityCenterContract.ts` | Quality-Report-, Gate-, Score-, Validator-Coverage-, Coverage-, Event- und Debt-Vertrag |
| Coverage Collector | `src/platform/Quality/Coverage/CoverageCollector.ts` | reale Testdatei-Abdeckung und optionale Code-Coverage-Artefakte |
| Gate Runner | `src/platform/Quality/Gates/QualityGateRunner.ts` | Auswertung der acht Chapter-12-Gates |
| Score Calculator | `src/platform/Quality/Scoring/QualityScoreCalculator.ts` | deterministische 0..100-Messachsen |
| Score Provider | `scripts/automation/repositoryQualityScoreProviders.ts` | reale Test-/Security-Messquellen ohne Ersatzwerte |
| Technical Debt Register | `src/platform/Quality/TechnicalDebt/TechnicalDebtRegister.ts` | technische Schulden mit evidenzpflichtigem Abschluss und Event-Publikation |
| QM Documentation Validator | `src/platform/Quality/Validators/DocumentationConsistencyValidator.ts` | Konsistenz von QM-Spezifikation, README, Manifest, Tests und CLI |
| Orchestrator | `src/platform/Quality/Orchestration/QualityCenterOrchestrator.ts` | zusammenhaengender Quality-Center-Report |
| Compliance Adapter | `scripts/automation/repositoryQualityAdapters.ts` | reine Projektion vorhandener `runAllScanners()`-Evidence |
| EventMesh Adapter | `scripts/automation/qualityEventMeshSink.ts` | Publikation ueber den bestehenden EventMesh-Bus |

## Authority Boundary

```text
Governance ---- Evidence Contract ----------------+
                                                  |
Compliance ---- existing scanners ----------------+--> Quality Center --> Evidence/Measurement
                                                  |          |
Other domain validators --------------------------+          +--> existing EventMesh
                                                  |
Chapter-12 mandatory identities -> coverage only -+
```

Das Quality Center darf keine Domain-Regel, Severity, Schwelle, IAM-Berechtigung oder Governance-Authority veraendern. Es darf keine Merge-, Release-, Deployment- oder Produktionsmutation autorisieren.

## Pflichtvalidator-Katalog

ESS-0001-CONTRACTS Chapter 12 definiert exakt 16 Pflichtvalidatoren. Der Code bildet diese Identitaeten in `MandatoryValidatorCatalog` 1:1 ab und bindet nur nachweisbar vorhandene Sources.

Aktuelle Baseline:

| Status | Anzahl | Bedeutung |
|---|---:|---|
| AVAILABLE | 5 | autoritative ausfuehrbare Source vorhanden |
| PARTIAL | 3 | relevante Teil-Evidence vorhanden, Pflichtvertrag aber nicht vollstaendig |
| NOT_AVAILABLE | 8 | keine hinreichende autoritative Runtime-Evidence vorhanden |

Der Katalog definiert **keine** Validator-Regel neu. Fehlende Implementierungen bleiben als `NOT_AVAILABLE` sichtbar. Dadurch wird die Chapter-12-Anforderung maschinenlesbar, ohne acht fehlende Validatoren zu erfinden oder Teil-Evidence als PASS auszugeben.

## Gate-Semantik

Die Gate-IDs entsprechen den acht Quality Gates aus ESS-0001-CONTRACTS Chapter 12. Wo die Codebasis noch keine vollstaendige Execution-Evidence fuer ein Gate liefert, wird `NOT_AVAILABLE` ausgegeben. Dieser Zustand ist absichtlich sichtbar und darf nicht als PASS behandelt werden. Ein real blockierender Befund bleibt `FAIL`.

Coverage-Evidence beweist Testbelegung, aber nicht automatisch einen bestandenen Testlauf. Deshalb wird der Test-Gate-Status nicht aus Testdatei-Coverage zu PASS hochgestuft.

## Coverage

Der `CoverageCollector` prueft alle sieben vorgesehenen Bereiche:

```text
tests/unit
tests/integration
tests/contract
tests/architecture
tests/security
tests/performance
tests/e2e
```

Nur echte `*.test.*`-/`*.spec.*`-Dateien zaehlen. `.gitkeep` oder reine Verzeichnisexistenz sind keine Evidence. Die sieben Bereiche sind im aktuellen Branch mit realen Tests belegt.

Optional werden `coverage/coverage-summary.json` oder `.quality/coverage-summary.json` eingelesen. `AVAILABLE` ist dabei eine starke Invariante: Statements, Branches, Functions und Lines muessen jeweils einen endlichen `pct`-Wert von 0..100 enthalten. Unvollstaendige oder ungueltige Coverage-Artefakte werden fail-closed als `NOT_AVAILABLE` behandelt; innerhalb von `AVAILABLE.metrics` existieren keine `null`-Werte. Ohne ein solches vollstaendiges Artefakt bleibt Code Coverage `NOT_AVAILABLE`.

## Scoring-Semantik

Die sieben Achsen aus Chapter 12 werden als gemessene 0..100-Werte mit Source und Authority-Referenzen akzeptiert. Fehlende Messachsen werden ausgewiesen; ein Gesamtwert wird nicht aus fehlender Evidence konstruiert.

Aktuell reale Provider:

- `Test Score` = gemessene Belegung der sieben Pflicht-Testbereiche;
- `Security Score` = bestehende SecurityComplianceAuditor-Aggregation der `SECURITY`-Scanner.

Weitere Achsen bleiben ohne autoritative numerische Messquelle bewusst offen.

## Technical Debt

Technical Debt wird explizit erfasst. Ein Eintrag kann nur mit nichtleerer Resolution-Evidence geschlossen werden. Das Register besitzt keinen stillen Auto-Close-, Delete- oder Auto-Fix-Pfad.

Bei injiziertem `QualityEventSink` erzeugt `record()` `TechnicalDebtDetectedEvent` und `resolve()` `TechnicalDebtResolvedEvent`. Der Register-Snapshot fuehrt Event-Publikationsstatus und Fehler. Ein Transportfehler veraendert keine Governance-Authority und fuehrt nicht zu einer stillen Ruecknahme eines bereits protokollierten Debt-Zustands.

## EventMesh

Der Quality-Center-Core publiziert ueber den existierenden EventMesh-Sink:

- `ValidationStartedEvent`;
- `ValidationCompletedEvent` / `ValidationFailedEvent`;
- `QualityGatePassedEvent` / `QualityGateFailedEvent`;
- `QualityScoreChangedEvent` bei nachgewiesener Score-Aenderung;
- `CoverageCalculatedEvent`;
- `TechnicalDebtDetectedEvent` / `TechnicalDebtResolvedEvent` bei Debt-Mutationen eines mit Sink komponierten Registers.

Die Event-Namen sind im zentralen `STANDARD_EVENT_CATALOG` registriert. Publikationsfehler werden als Evidence sichtbar und veraendern keine Quality-/Governance-Authority.

## Dokumentationskonsistenz

Der QM-spezifische Validator prueft insbesondere:

- Quality-/Validator-Manifeste;
- ESS-0005-/README-/Registry-Versionskonsistenz;
- deklarierte Quality-Vertraege;
- Existenz deklarierter Quality-Tests;
- CLI-Vertrag `repository:quality:check`;
- historische No-Implementation-Aussagen.

Er ersetzt nicht den bestehenden Documentation Hygiene Validator aus ESS-0012, sondern ergaenzt diesen ausschließlich um QM-spezifische Konsistenzregeln.

## Code-basierter Testnachweis

Zusätzlich zu den bestehenden Unit-/Integrationstests existieren Quality-spezifische Tests in:

- `tests/unit/mandatoryValidatorCatalog.test.ts`;
- `tests/unit/technicalDebtRegister.test.ts`;
- `tests/contract/qualityCenterContract.test.ts`;
- `tests/architecture/qualityCenterBoundary.test.ts`;
- `tests/security/qualityCenterAuthorityBoundary.test.ts`;
- `tests/performance/qualityCenterDeterminism.test.ts`;
- `tests/e2e/qualityCenterOrchestration.test.ts`.

## Noch offen innerhalb des bestehenden ESS-0005-Zielbilds

- vollstaendige Execution-Evidence fuer Contract-, Test- und Build-Gate;
- echte Implementierung/Anbindung der aktuell `PARTIAL` oder `NOT_AVAILABLE` markierten Chapter-12-Pflichtvalidatoren;
- reale numerische Provider fuer Documentation, Architecture, Knowledge, Metadata und Twin;
- echte Statement-/Branch-/Function-/Line-Coverage erst nach Erzeugung eines vollstaendigen Coverage-Artefakts.

Diese offenen Punkte bleiben maschinenlesbar unvollstaendig und werden nicht als PASS oder Score simuliert.
