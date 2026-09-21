# Quality

## Enterprise Component

Status: Implemented

Version: 1.1.0

Owner: CAPITAL-AI

---

## Purpose

`src/platform/Quality` ist die read-only Ausfuehrungs-, Mess- und Orchestrierungsgrenze des Quality Centers gemaess ESS-0005. Das Quality Center definiert **keine** fachlichen Governance-, Compliance-, Security-, Release-, Market-Data-, Scoring- oder Ranking-Regeln und besitzt keine Merge-/Release-/Deployment-/Produktionsauthority.

Der maschinenlesbare Panel-Datenvertrag bleibt `QualityCenterReport` (`quality-center-contract/1.3.0`, Report-Schema `quality-center-report/1.3.0`). Runtime-API und UI projizieren ausschliesslich diesen bestehenden Evidence-Vertrag und erhalten dadurch keine neue Authority.

## Implemented Quality Center

- `RepositoryQuality/RepositoryQualityCoordinator.ts` — normalisierte read-only Repository-Evidence;
- `Contracts/QualityCenterContract.ts` — non-authorizing Quality-Center-/Panel-Vertrag;
- `src/platform/Validators/Chapter12ValidatorRunner.ts` — alle 16 Pflichtvalidatoren aus ESS-0001-CONTRACTS Chapter 12 als ausfuehrbare Pruefer/Adapter;
- `Gates/QualityGateRunner.ts` — acht fail-closed Quality Gates;
- `Execution/QualityExecutionEvidence.ts` + `scripts/automation/runQualityExecution.ts` — commitgebundene Contract-/Test-/Build-Evidence;
- `Coverage/CoverageCollector.ts` — reale Belegung der sieben Pflicht-Testbereiche plus optionale echte Code-Coverage;
- `Scoring/QualityScoreCalculator.ts` — sieben 0..100-Messachsen ohne erfundene Ersatzwerte;
- `TechnicalDebt/TechnicalDebtRegister.ts` — evidenzpflichtiges Debt-Management;
- `Findings/UnifiedFindingContract.ts` — einheitlicher, stabil fingerprintbarer Evidence-Vertrag fuer Gitleaks, OSV, Vitest-Coverage, Knip und jscpd; die Findings sind nicht-autorisierend und werden ausserhalb des Runtime-Hot-Paths erzeugt;
- `Validators/DocumentationConsistencyValidator.ts` — QM-Dokument-/Manifest-Konsistenz;
- `ValueChain/FintechValueChainQualityProjection.ts` — read-only Homogenitaetsprojektion der aktuellen 18-stufigen SC-MD-SPT-FinTech-Wertschoepfungskette;
- `Orchestration/QualityCenterOrchestrator.ts` — einheitlicher `QualityCenterReport`;
- `Operations/QualityCenterSnapshotStore.ts` — atomare, commitgebundene Snapshot-Persistenz fuer Build und Runtime;
- `server/qualityCenter.ts` — IAM-geschuetzte, ausschliesslich lesende Admin-Projektion des Build-Snapshots;
- bestehende Governance-, Compliance-, Documentary-, Release-, EventMesh- und Traceability-Authorities werden adaptiert, nicht kopiert.

## Mandatory Validator Coverage

ESS-0001-CONTRACTS Chapter 12 definiert exakt 16 Pflichtvalidatoren.

**Implementierungsabdeckung:** `16/16 AVAILABLE`.

Das bedeutet ausschliesslich: Jeder Pflichtvalidator besitzt einen ausfuehrbaren Pruefer oder einen Adapter auf eine bereits autoritative Pruefquelle. Es bedeutet **nicht**, dass das Repository automatisch konform ist. Die reale Ausfuehrung wird separat im `Chapter12ValidationReport` mit `PASS`, `FAIL` oder `NOT_AVAILABLE` ausgewiesen.

Knowledge- oder Twin-Luecken duerfen nicht als „Validator fehlt“ verschleiert werden: Der Validator laeuft und meldet fehlende fachliche Evidence explizit.

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

Contract/Test/Build werden nicht aus Dateiexistenz abgeleitet. `npm test` und `npm run build` erzeugen Evidence erst nach dem real ausgefuehrten Prozess. Build-PASS setzt den erfolgreichen Runtime-Release-Manifest- und Quality-Snapshot-Finalizer voraus. Evidence ist an den exakten 40-stelligen Git-Commit gebunden.

## FinTech Value Chain / Quality Panel

Die kanonische SC-MD-SPT-Kette wird als read-only Panel-Projektion in **18 Stufen** geprueft:

1. Request Intake
2. Identity / Access
3. Entitlement / Usage Gate
4. Asset Discovery / Universal Asset Identity
5. Orchestration / Runtime Guard
6. Market-Data / Evidence Acquisition
7. Data Validation / Provenance / DQ
8. Verified Display / Research Lane
9. Classification + Feature Contract
10. ScoringModelRegistry
11. ScoringDispatcher
12. Domain Executor Adapter
13. CanonicalScoreResult + execution lineage
14. Confidence / DQ Composite
15. Ranking comparability gate
16. Ranking / Eligibility / SLO
17. EventMesh / Traceability / Supervisor
18. API / UI / Alerts / downstream evidence

Eine Stufe ist `CONNECTED`, wenn ihre kanonischen Runtime- und Test-/Evidence-Artefakte vorhanden sind. `homogeneous=true` verlangt zusaetzlich Hot-Path-Isolation: MarketData, Scoring, Ranking, Orchestrierung und Application Runtime duerfen keine direkte Quality-Entscheidungsabhaengigkeit erhalten.

Diese Isolation ist beabsichtigt. Quality beobachtet die Wertschoepfungskette seitlich; es darf keine Marktdaten veraendern, keine Klassifikation oder Scores berechnen, keine Confidence-/Ranking-Gewichte aktivieren, kein Provider-Routing und keine Eligibility-/Release-Entscheidung ueberschreiben.

## Operationalization / Runtime Identity

Der Build erzeugt denselben `QualityCenterReport` als Snapshot unter:

- `.quality/quality-center-report.json`;
- `dist/quality/quality-center-report.json`.

Die read-only Route `GET /api/admin/quality-center` verwendet die bestehende IAM-Boundary `checkAdminAccess` mit `DIAGNOSTIC_ZONE_ROLES`. Sie fuehrt **keinen** Live-Repository-Scan im Requestpfad aus.

Zur Laufzeit muss der Snapshot-Commit exakt der bestehenden Release-Identitaet aus `platformVersionControlPlane` entsprechen. Fehlende/ungueltige Release-Identitaet oder ein commitfremder Snapshot ergeben fail-closed HTTP 503. `Cache-Control: no-store` verhindert die Wiederverwendung veralteter Admin-Evidence.

Die neue Admin-Route ist im bestehenden M8-Provider-Bypass-Audit registriert. Es existiert kein provider-spezifischer Bypass und keine Quality-Write-Route.

## Coverage

Der `CoverageCollector` misst `tests/unit`, `tests/integration`, `tests/contract`, `tests/architecture`, `tests/security`, `tests/performance` und `tests/e2e`. Nur echte `*.test.*`-/`*.spec.*`-Dateien zaehlen.

`coverage/coverage-summary.json` oder `.quality/coverage-summary.json` wird nur eingelesen, wenn das Artefakt real existiert. Fehlt es, bleibt Statements/Branches/Functions/Lines `NOT_AVAILABLE`.

Der Projekt-Dependency-Graph installiert weiterhin keinen verpflichtenden Coverage-Provider. Der separate, read-only `OSS Quality Assurance`-Workflow erzeugt jedoch fuer relevante Pull Requests reale V8-Coverage mit exakt `vitest@4.1.11` + `@vitest/coverage-v8@4.1.11` als ephemer gepinnter Toolchain und schreibt `.quality/coverage-summary.json`. Anschliessend liest der bestehende `CoverageCollector` genau dieses Artefakt und der bestehende Quality-Center-Snapshot muss `codeCoverage.status=AVAILABLE` bestaetigen. Ausserhalb einer tatsaechlich ausgefuehrten Coverage-Lane bleibt fehlende Evidence korrekt `NOT_AVAILABLE`; es wird kein synthetischer Coverage-Wert erzeugt.

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

ESS-0001-CONTRACTS definiert fuer Documentation, Architecture, Knowledge, Metadata und Twin derzeit keine eindeutige numerische Berechnungsformel. Das Quality Center erfindet deshalb keine Werte. Diese Achsen bleiben explizit fehlend; ein Gesamt-Quality-Score wird erst bei vollstaendiger autoritativer Messmenge ausgegeben.

## Technical Debt

Technische Schulden werden mit ID, Ursache, Auswirkung, Aufwand, Prioritaet, Zielversion und Source-Referenzen registriert. Ein Eintrag kann nur mit Resolution-Evidence geschlossen werden. Detect-/Resolve-Events werden ueber den bestehenden EventMesh-Sink publiziert; Transportfehler werden als Evidence festgehalten.

## Historie

Der Runtime-Snapshot ist commitgebunden, aber noch keine langfristige Trend-Zeitreihe. Eine commitbezogene GitHub-Workflow-Artefakt-Historie ist als separater repository-seitiger Folgeschritt identifiziert und benoetigt eine eigenstaendig autorisierte Workflow-Security-Aenderung. Eine produktive Persistenz benoetigt zusaetzlich eine eigene Produktions-/Storage-Entscheidung.

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
