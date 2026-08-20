# Quality Center Core Orchestration

**Status:** IMPLEMENTATION BASELINE  
**Date:** 2026-08-20  
**Authority:** ESS-0001-CONTRACTS Chapter 11/12, ESS-0005, ESS-0006, ADR-0012, ADR-0096

## Ziel

Die bereits vorhandene Repository-Quality-Baseline wird zu einem zentral orchestrierten Quality Center erweitert, ohne Governance-, Compliance-, Security-, Release- oder Dokumentationsregeln zu duplizieren.

## Komponenten

| Komponente | Pfad | Verantwortung |
|---|---|---|
| Governance Evidence Contract | `src/platform/Governance/Contracts/RepositoryQualityEvidence.ts` | neutraler, non-authorizing Evidence-Umschlag |
| Validator Registry | `src/platform/Validators/ValidatorRegistry.ts` | zentrale Registrierung/Aufloesung vorhandener Validatoren |
| Repository Quality Coordinator | `src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator.ts` | deterministische Evidence-Aggregation |
| Quality Center Contract | `src/platform/Quality/Contracts/QualityCenterContract.ts` | Quality-Report-, Gate-, Score- und Debt-Vertrag |
| Gate Runner | `src/platform/Quality/Gates/QualityGateRunner.ts` | Auswertung der acht Chapter-12-Gates |
| Score Calculator | `src/platform/Quality/Scoring/QualityScoreCalculator.ts` | deterministische 0..100-Messachsen |
| Technical Debt Register | `src/platform/Quality/TechnicalDebt/TechnicalDebtRegister.ts` | technische Schulden mit evidenzpflichtigem Abschluss |
| QM Documentation Validator | `src/platform/Quality/Validators/DocumentationConsistencyValidator.ts` | Konsistenz von QM-Spezifikation, README, Manifest, Tests und CLI |
| Orchestrator | `src/platform/Quality/Orchestration/QualityCenterOrchestrator.ts` | ein zusammenhaengender Quality-Center-Report |
| Compliance Adapter | `scripts/automation/repositoryQualityAdapters.ts` | reine Projektion vorhandener `runAllScanners()`-Evidence |

## Authority Boundary

```text
Governance ---- Evidence Contract ----+
                                      |
Compliance ---- existing scanners ----+--> Quality Center --> Evidence/Measurement
                                      |
Other domain validators --------------+
```

Das Quality Center darf keine Domain-Regel, Severity, Schwelle, IAM-Berechtigung oder Governance-Authority veraendern. Es darf keine Merge-, Release-, Deployment- oder Produktionsmutation autorisieren.

## Gate-Semantik

Die Gate-IDs entsprechen den acht Quality Gates aus ESS-0001-CONTRACTS Chapter 12. Wo die vorhandene Codebasis noch keine vollstaendige Evidence fuer ein Gate liefert, wird `NOT_AVAILABLE` ausgegeben. Dieser Zustand ist absichtlich sichtbar und darf nicht als PASS behandelt werden. Ein real blockierender Befund bleibt `FAIL`.

## Scoring-Semantik

Die sieben Achsen aus Chapter 12 werden als gemessene 0..100-Werte mit Source und Authority-Referenzen akzeptiert. Fehlende Messachsen werden ausgewiesen; ein Gesamtwert wird nicht aus fehlender Evidence konstruiert.

## Technical Debt

Technical Debt wird explizit erfasst. Ein Eintrag kann nur mit nichtleerer Resolution-Evidence geschlossen werden. Das Register besitzt keinen stillen Auto-Close-, Delete- oder Auto-Fix-Pfad.

## Dokumentationskonsistenz

Der QM-spezifische Validator prueft insbesondere:

- Quality-/Validator-Manifeste;
- ESS-0005-/README-/Registry-Versionskonsistenz;
- deklarierte Quality-Vertraege;
- Existenz deklarierter Quality-Tests;
- CLI-Vertrag `repository:quality:check`;
- historische No-Implementation-Aussagen.

Er ersetzt nicht den bestehenden Documentation Hygiene Validator aus ESS-0012, sondern ergaenzt diesen ausschließlich um QM-spezifische Konsistenzregeln.

## Noch offen innerhalb des bestehenden ESS-0005-Zielbilds

- vollstaendige Evidence-Abdeckung aller acht Gates;
- vollstaendige Abdeckung aller Pflichtvalidatoren aus Chapter 12;
- produktiver `CoverageCollector` mit gemessener Testabdeckung;
- reale Messquellen fuer alle sieben Quality-Score-Achsen;
- EventMesh-Anbindung der in ESS-0005 vorgesehenen Quality Events.
