# Quality

## Enterprise Component

Status: Core Implementation

Version: 1.1.0

Owner: CAPITAL-AI

---

## Purpose

`src/platform/Quality` ist die Ausfuehrungs-, Mess- und Orchestrierungsgrenze des Quality Centers gemaess ESS-0005. Das Quality Center definiert **keine** fachlichen Governance-, Compliance-, Security-, Release- oder Dokumentationsregeln und besitzt keine Merge-/Release-/Deployment-Authority.

## Implemented Quality Center Core

- `RepositoryQuality/RepositoryQualityCoordinator.ts` — normalisierte read-only Repository-Evidence;
- `Contracts/QualityCenterContract.ts` — verbindender, non-authorizing Quality-Center-Vertrag;
- `Coverage/CoverageCollector.ts` — reale Testdatei-Abdeckung der sieben Pflicht-Testbereiche plus optionale `coverage-summary.json`-Messwerte;
- `Gates/QualityGateRunner.ts` — acht Chapter-12-Gates mit ehrlicher Evidence-Coverage;
- `Scoring/QualityScoreCalculator.ts` — sieben 0..100-Messachsen; keine manuellen Scores;
- `TechnicalDebt/TechnicalDebtRegister.ts` — explizites Erfassen und evidenzpflichtiges Schliessen technischer Schulden;
- `Validators/DocumentationConsistencyValidator.ts` — QM-spezifische Dokument-/Manifest-Konsistenz;
- `Orchestration/QualityCenterOrchestrator.ts` — einheitlicher Quality-Center-Report inklusive Coverage und Event-Publikationsstatus;
- zentrale `src/platform/Validators/ValidatorRegistry`;
- Composition-Adapter auf vorhandene Release-, Documentary-, Repository-, Vocabulary- sowie Security/Compliance-Pruefungen;
- `scripts/automation/repositoryQualityScoreProviders.ts` — reale Test- und Security-Score-Provider;
- `scripts/automation/qualityEventMeshSink.ts` — Anbindung an den bestehenden EventMesh-Bus.

## Contract Chain

```text
Governance Evidence Contract (neutral, read-only)
                 |
                 v
        ValidatorRegistry
                 |
                 v
 RepositoryQualityCoordinator
                 |
        +--------+-----------+-----------+
        |        |           |           |
    GateRunner  Scoring  CoverageCollector  TechnicalDebtRegister
        \        |           |           /
         QualityCenterOrchestrator
                 |
        +--------+--------+
        |                 |
 Quality Center Report   EventMesh
        ^
        |
 Compliance Evidence / Score Adapter
```

Governance stellt nur den neutralen Evidence-Vertrag bereit. Compliance bleibt fachliche Authority fuer die bestehenden Scanner und deren Findings/Score-Semantik. Das Quality Center konsumiert deren Ergebnisse, veraendert aber keine Compliance-Regel.

## Quality Gate Semantics

Die acht Gates entsprechen ESS-0001-CONTRACTS Chapter 12. Ein Gate mit unvollstaendiger technischer Evidence wird als `NOT_AVAILABLE` ausgegeben und niemals zu PASS hochgestuft. Blockierende Evidence ergibt `FAIL`.

Der aktuelle Core besitzt vollstaendige Evidence fuer Versions- und QM-Dokumentationsstatus. Contract- und Build-Gate sowie der Ausfuehrungsstatus der Test-Suite benoetigen weiterhin eigene reale Execution-Evidence; vorhandene Testdatei-Coverage allein wird nicht als bestandener Testlauf interpretiert.

## Coverage

Der CoverageCollector misst die sieben vorgesehenen Testbereiche:

- `tests/unit`
- `tests/integration`
- `tests/contract`
- `tests/architecture`
- `tests/security`
- `tests/performance`
- `tests/e2e`

Gezählt werden nur echte `*.test.*`-/`*.spec.*`-Dateien. Die blosse Existenz eines Verzeichnisses oder `.gitkeep` gilt nicht als Coverage-Evidence. Falls `coverage/coverage-summary.json` oder `.quality/coverage-summary.json` vorhanden ist, werden Statements, Branches, Functions und Lines als reale Messwerte eingelesen. Fehlt das Artefakt, lautet der Code-Coverage-Status `NOT_AVAILABLE`.

## Quality Scoring

Die sieben verbindlichen Achsen sind Documentation, Test, Architecture, Security, Knowledge, Metadata und Twin. Jede Messung muss einen Wert 0..100 sowie eine Source besitzen. Ein Gesamtwert wird nur bei vollstaendiger Messmenge ausgegeben; fehlende Messachsen werden explizit ausgewiesen.

Aktuell codebasiert angebunden:

- **Test Score:** prozentuale reale Belegung der sieben Pflicht-Testbereiche;
- **Security Score:** bestehende SecurityComplianceAuditor-Aggregation der `SECURITY`-Scanner.

Documentation, Architecture, Knowledge, Metadata und Twin erhalten erst dann Messwerte, wenn eine bereits autoritative numerische Messquelle existiert. Es werden keine Ersatzwerte erfunden.

## Technical Debt

Technische Schulden werden mit ID, Ursache, Auswirkung, Aufwand, Prioritaet, Zielversion und Source-Referenzen registriert. Ein Eintrag kann nur mit Resolution-Evidence geschlossen werden und wird niemals stillschweigend ueberschrieben oder entfernt.

## ESS / ADR References

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

## Events

Der Quality-Center-CLI publiziert ueber den vorhandenen EventMesh-Bus:

- `ValidationStartedEvent`
- `ValidationCompletedEvent` / `ValidationFailedEvent`
- `QualityGatePassedEvent` / `QualityGateFailedEvent`
- `QualityScoreChangedEvent`, wenn ein vorheriger vollstaendiger Score bereitgestellt wird und sich aendert
- `CoverageCalculatedEvent`

Event-Publikationsfehler werden im Quality-Center-Report als Evidence ausgewiesen, verleihen dem Quality Center aber keine Freigabe- oder Mutationsauthority. `TechnicalDebtDetectedEvent` und `TechnicalDebtResolvedEvent` bleiben katalogisierte Zielereignisse, bis Debt-Mutationen selbst an einen Event-Sink gekoppelt sind.
