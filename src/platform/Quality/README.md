# Quality

## Enterprise Component

Status: Implemented / Operationalized

Version: 1.1.0

Owner: CAPITAL-AI

---

## Purpose

`src/platform/Quality` ist die read-only Ausfuehrungs-, Mess- und Orchestrierungsgrenze des Quality Centers gemaess ESS-0005. Das Quality Center definiert **keine** fachlichen Governance-, Compliance-, Security-, Release-, Market-Data-, Scoring- oder Ranking-Regeln und besitzt keine Merge-/Release-/Deployment-/Produktionsauthority.

Der maschinenlesbare Panel-Datenvertrag ist `QualityCenterReport` (`quality-center-contract/1.3.0`). Das visuelle Panel ist keine eigene Authority; es projiziert ausschliesslich diesen Evidence-Vertrag.

## Implemented Quality Center

- `RepositoryQuality/RepositoryQualityCoordinator.ts` — normalisierte read-only Repository-Evidence;
- `Contracts/QualityCenterContract.ts` — non-authorizing Quality-Center-/Panel-Vertrag;
- `src/platform/Validators/Chapter12ValidatorRunner.ts` — alle 16 Pflichtvalidatoren aus ESS-0001-CONTRACTS Chapter 12 als ausfuehrbare Pruefer/Adapter;
- `Gates/QualityGateRunner.ts` — acht fail-closed Quality Gates;
- `Execution/QualityExecutionEvidence.ts` + `scripts/automation/runQualityExecution.ts` — commitgebundene Contract-/Test-/Build-Evidence;
- `Coverage/CoverageCollector.ts` — reale Belegung der sieben Pflicht-Testbereiche plus optionale echte Code-Coverage;
- `Scoring/QualityScoreCalculator.ts` — sieben 0..100-Messachsen ohne erfundene Ersatzwerte;
- `TechnicalDebt/TechnicalDebtRegister.ts` — evidenzpflichtiges Debt-Management;
- `Validators/DocumentationConsistencyValidator.ts` — QM-Dokument-/Manifest-Konsistenz;
- `ValueChain/FintechValueChainQualityProjection.ts` — read-only Homogenitaetsprojektion der kanonischen SC-MD-SPT-FinTech-Wertschoepfungskette;
- `Orchestration/QualityCenterOrchestrator.ts` — einheitlicher Quality-Center-Report;
- `Operations/QualityCenterSnapshotStore.ts` — atomare, commitgebundene Persistenz des bestehenden Reports fuer Build und Runtime;
- bestehende Governance-, Compliance-, Documentary-, Release-, EventMesh- und Traceability-Authorities werden adaptiert, nicht kopiert.

## Operationalisierung

Die operative Kette verwendet weiterhin genau einen fachlichen Datenvertrag:

```text
QualityCenterOrchestrator
  -> QualityCenterReport 1.3.0
  -> buildQualityCenterSnapshot.ts
  -> .quality/quality-center-report.json
  -> dist/quality/quality-center-report.json
  -> GET /api/admin/quality-center
  -> Performance-Zentrale / Quality Evidence Panel
```

`scripts/automation/repositoryQualityReport.ts` ist die gemeinsame Composition-Factory fuer CLI-Validierung und Build-Snapshot. Dadurch existiert keine zweite Quality-Orchestrierung.

`npm run build` erzeugt den Runtime-Snapshot erst nach dem bestehenden Google-Marketing-Guard, dem realen Production Build, dem Runtime Release Manifest und der commitgebundenen Build-Evidence. Ungueltige oder nicht an einen exakten 40-stelligen Commit gebundene Reports werden nicht persistiert.

Der Runtime-Endpoint ist ausschliesslich `GET`, verwendet die bestehende `checkAdminAccess`-/`DIAGNOSTIC_ZONE_ROLES`-Boundary, setzt `Cache-Control: no-store` und fuehrt keinen Live-Repository-Scan aus. Fehlt ein gueltiger Build-Snapshot, wird `503 quality_snapshot_not_available` ausgegeben statt Ersatzdaten zu erzeugen.

Die UI ist in die bestehende Performance-Zentrale eingebettet und ueber die kanonische Governance-UI-Fassade auffindbar. Sie zeigt Gates, Validatorabdeckung, FinTech-Kette, Coverage, Technical Debt, Source Commit und den vorhandenen Quality Score Status. `null` und `NOT_AVAILABLE` werden sichtbar belassen.

## Mandatory Validator Coverage

ESS-0001-CONTRACTS Chapter 12 definiert exakt 16 Pflichtvalidatoren.

**Implementierungsabdeckung:** `16/16 AVAILABLE`.

Das bedeutet ausschliesslich: Jeder Pflichtvalidator besitzt einen ausfuehrbaren Pruefer oder einen Adapter auf eine bereits autoritative Pruefquelle. Es bedeutet **nicht**, dass das Repository automatisch konform ist. Die reale Ausfuehrung wird separat im `Chapter12ValidationReport` mit `PASS`, `FAIL` oder `NOT_AVAILABLE` ausgewiesen.

Insbesondere duerfen Knowledge- oder Twin-Luecken nicht als „Validator fehlt“ verschleiert werden: Der Validator laeuft und meldet die fehlende fachliche Evidence explizit.

## Quality Gate Semantics

Die acht Gates entsprechen ESS-0001-CONTRACTS Chapter 12:

1. Contract-Konformitaet
2. Architektur-Konformitaet
3. Versionskonformitaet
4. Dokumentationsstatus
5. Teststatus
6. Sicherheitsauswirkungen
7. Compliance-Auswirkungen
8. Build-Ergebnis

`PASS` entsteht nur bei vollstaendiger zugeordneter Evidence. Ein echter Fehler ergibt `FAIL`; fehlende oder commitfremde Evidence bleibt `NOT_AVAILABLE`.

Contract/Test/Build werden nicht aus Dateiexistenz abgeleitet. `npm test` und `npm run build` erzeugen Evidence erst nach dem real ausgefuehrten Prozess. Build-PASS setzt zusaetzlich den erfolgreichen Runtime-Release-Manifest-Finalizer voraus. Evidence ist an den exakten 40-stelligen Git-Commit gebunden.

## FinTech Value Chain / Quality Panel

Die kanonische SC-MD-SPT-Kette wird als read-only Panel-Projektion in 14 Stufen geprueft. Die konkrete Stufendefinition liegt ausschliesslich in `FintechValueChainQualityProjection.ts`; das Frontend rendert deren Ergebnis und fuehrt keine eigene Kettenlogik ein.

Eine Stufe ist `CONNECTED`, wenn ihre kanonischen Runtime- und Test-/Evidence-Artefakte vorhanden sind. `homogeneous=true` verlangt zusaetzlich Hot-Path-Isolation: MarketDataGateway, ScoringDispatcher, Executor, Ranking, Orchestrator und Application Runtime duerfen keine direkte Quality-Abhaengigkeit erhalten.

Diese Isolation ist beabsichtigt. Quality beobachtet die Wertschoepfungskette seitlich; es darf keine Marktdaten veraendern, keine Klassifikation oder Scores berechnen, keine Confidence-/Ranking-Gewichte aktivieren, kein Provider-Routing und keine Eligibility-/Release-Entscheidung ueberschreiben.

## Coverage

Der CoverageCollector misst `tests/unit`, `tests/integration`, `tests/contract`, `tests/architecture`, `tests/security`, `tests/performance` und `tests/e2e`. Nur echte `*.test.*`-/`*.spec.*`-Dateien zaehlen.

`coverage/coverage-summary.json` oder `.quality/coverage-summary.json` wird nur eingelesen, wenn das Artefakt real existiert. Fehlt es, bleibt Statements/Branches/Functions/Lines `NOT_AVAILABLE`.

## Quality Scoring

Verbindliche Achsen:

- Documentation
- Test
- Architecture
- Security
- Knowledge
- Metadata
- Twin

Aktuell existieren autoritative numerische Quellen fuer:

- **Test Score:** reale Belegung der sieben Pflicht-Testbereiche;
- **Security Score:** bestehende SecurityComplianceAuditor-Aggregation der `SECURITY`-Scanner.

ESS-0001-CONTRACTS definiert fuer Documentation, Architecture, Knowledge, Metadata und Twin derzeit keine eindeutige numerische Berechnungsformel. Das Quality Center erfindet deshalb keine Werte. Diese Achsen bleiben solange explizit fehlend; ein Gesamt-Quality-Score wird erst bei vollstaendiger autoritativer Messmenge ausgegeben. Das ist ein Fail-Safe-Evidence-Verhalten und kein offener Implementierungs-TODO.

## Technical Debt

Technische Schulden werden mit ID, Ursache, Auswirkung, Aufwand, Prioritaet, Zielversion und Source-Referenzen registriert. Ein Eintrag kann nur mit Resolution-Evidence geschlossen werden. Detect-/Resolve-Events werden ueber den bestehenden EventMesh-Sink publiziert; Transportfehler werden als Evidence festgehalten.

Der aktuelle Build-Snapshot bildet den Zustand des bestehenden Registers ab. Historische Trend-Persistenz oder ein produktiver Debt-Write-Store werden in diesem Slice bewusst nicht eingefuehrt; eine solche Persistenz benoetigt eine separat autorisierte Storage-/Produktionsentscheidung.

## Authority Boundaries

Quality Center darf nicht:

- Merge, Release oder Deployment autorisieren;
- produktive Mutationen ausfuehren;
- Governance-/Compliance-/Security-Regeln neu definieren;
- Finanzdaten, Scores, Confidence, Ranking oder Eligibility veraendern;
- fehlende Evidence zu PASS oder einem Ersatzscore hochstufen.

## ESS / ADR / Roadmap References

- ESS-0001-CONTRACTS Chapter 11 und 12
- ESS-0005 — Quality Center
- ESS-0006 — Security & Compliance
- ESS-0012 — Documentation Governance
- ESS-0013 — Enterprise Event Mesh
- ESS-0017 — Vocabulary Governance
- ADR-0012 — SecurityComplianceAuditor
- ADR-0016 — ESS Component Specifications
- ADR-0018 — Enterprise Event Mesh
- ADR-0030 — Release Version Gate
- ADR-0096 — Governance Control Plane
- SC-MD-SPT-0001 — Screening / Scoring / Market Data / SPT Master-Roadmap

## Events

Der Quality-Center-Core publiziert ueber den vorhandenen EventMesh-Sink:

- `ValidationStartedEvent`
- `ValidationCompletedEvent` / `ValidationFailedEvent`
- `QualityGatePassedEvent` / `QualityGateFailedEvent`
- `QualityScoreChangedEvent`
- `CoverageCalculatedEvent`
- `TechnicalDebtDetectedEvent` / `TechnicalDebtResolvedEvent`

Event-Publikation erzeugt keine Freigabe- oder Mutationsauthority.
