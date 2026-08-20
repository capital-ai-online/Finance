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
- `TechnicalDebt/TechnicalDebtRegister.ts` — evidenzpflichtiges Debt-Management plus Detect/Resolve-Event-Publikation ueber abstrakten Sink;
- `Validators/DocumentationConsistencyValidator.ts` — QM-spezifische Dokument-/Manifest-Konsistenz;
- `Orchestration/QualityCenterOrchestrator.ts` — einheitlicher Quality-Center-Report inklusive Pflichtvalidator-, Coverage- und Eventstatus;
- zentrale `src/platform/Validators/ValidatorRegistry`;
- `src/platform/Validators/MandatoryValidatorCatalog.ts` — exakte maschinenlesbare Abdeckung der 16 Chapter-12-Pflichtvalidatoren;
- Composition-Adapter auf vorhandene Release-, Documentary-, Repository-, Vocabulary- sowie Security/Compliance-Pruefungen;
- `scripts/automation/repositoryQualityScoreProviders.ts` — reale Test- und Security-Score-Provider;
- `scripts/automation/qualityEventMeshSink.ts` — Anbindung an den bestehenden EventMesh-Bus.

## Mandatory Validator Coverage

ESS-0001-CONTRACTS Chapter 12 definiert exakt 16 Pflichtvalidatoren. Der Quality-Center-Report fuehrt deren Implementierungsabdeckung maschinenlesbar mit.

Aktueller Code-basierter Stand:

- **5 AVAILABLE:** Naming, Documentation, Version, Security, Compliance;
- **3 PARTIAL:** Repository Structure, Manifest, Event;
- **8 NOT_AVAILABLE:** noch ohne vollstaendige autoritative Runtime-Evidence.

Der Katalog erfindet keine fehlenden Validator-Regeln. `PARTIAL` und `NOT_AVAILABLE` bleiben sichtbare Luecken und werden niemals als PASS interpretiert.

## Contract Chain

```text
Governance Evidence Contract (neutral, read-only)
                 |
                 v
 ValidatorRegistry + MandatoryValidatorCatalog
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

Der CoverageCollector misst `tests/unit`, `tests/integration`, `tests/contract`, `tests/architecture`, `tests/security`, `tests/performance` und `tests/e2e`. Gezaehlt werden nur echte `*.test.*`-/`*.spec.*`-Dateien. Reine Verzeichnisexistenz oder `.gitkeep` gilt nicht als Coverage-Evidence.

Falls `coverage/coverage-summary.json` oder `.quality/coverage-summary.json` vorhanden ist, werden Statements, Branches, Functions und Lines als reale Messwerte eingelesen. Fehlt das Artefakt, lautet der Code-Coverage-Status `NOT_AVAILABLE`.

## Quality Scoring

Die sieben verbindlichen Achsen sind Documentation, Test, Architecture, Security, Knowledge, Metadata und Twin. Jede Messung muss einen Wert 0..100 sowie eine Source besitzen. Ein Gesamtwert wird nur bei vollstaendiger Messmenge ausgegeben; fehlende Messachsen werden explizit ausgewiesen.

Aktuell codebasiert angebunden:

- **Test Score:** prozentuale reale Belegung der sieben Pflicht-Testbereiche;
- **Security Score:** bestehende SecurityComplianceAuditor-Aggregation der `SECURITY`-Scanner.

Documentation, Architecture, Knowledge, Metadata und Twin erhalten erst dann Messwerte, wenn eine bereits autoritative numerische Messquelle existiert. Es werden keine Ersatzwerte erfunden.

## Technical Debt

Technische Schulden werden mit ID, Ursache, Auswirkung, Aufwand, Prioritaet, Zielversion und Source-Referenzen registriert. Ein Eintrag kann nur mit Resolution-Evidence geschlossen werden und wird niemals stillschweigend ueberschrieben oder entfernt.

Wenn ein `QualityEventSink` injiziert ist, publiziert `record()` `TechnicalDebtDetectedEvent` und `resolve()` `TechnicalDebtResolvedEvent`. Transportfehler werden im Debt-Snapshot erfasst; sie rollen den bereits nachvollziehbar ausgefuehrten Debt-Zustandswechsel nicht still zurueck und erzeugen keine Autorisierungswirkung.

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

Der Quality-Center-Core publiziert ueber den vorhandenen EventMesh-Sink:

- `ValidationStartedEvent`
- `ValidationCompletedEvent` / `ValidationFailedEvent`
- `QualityGatePassedEvent` / `QualityGateFailedEvent`
- `QualityScoreChangedEvent`, wenn ein vorheriger vollstaendiger Score bereitgestellt wird und sich aendert
- `CoverageCalculatedEvent`
- `TechnicalDebtDetectedEvent` / `TechnicalDebtResolvedEvent` bei Debt-Mutationen eines mit Sink komponierten Registers

Event-Publikationsfehler werden als Evidence ausgewiesen und verleihen dem Quality Center keine Freigabe- oder Mutationsauthority.
