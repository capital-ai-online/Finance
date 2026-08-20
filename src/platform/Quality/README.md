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
- `Gates/QualityGateRunner.ts` — acht Chapter-12-Gates mit ehrlicher Evidence-Coverage;
- `Scoring/QualityScoreCalculator.ts` — sieben 0..100-Messachsen; keine manuellen Scores;
- `TechnicalDebt/TechnicalDebtRegister.ts` — explizites Erfassen und evidenzpflichtiges Schliessen technischer Schulden;
- `Validators/DocumentationConsistencyValidator.ts` — QM-spezifische Dokument-/Manifest-Konsistenz;
- `Orchestration/QualityCenterOrchestrator.ts` — einheitlicher Quality-Center-Report;
- zentrale `src/platform/Validators/ValidatorRegistry`;
- Composition-Adapter auf vorhandene Release-, Documentary-, Repository-, Vocabulary- sowie Security/Compliance-Pruefungen.

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
        +--------+---------+
        |        |         |
    GateRunner  Scoring  TechnicalDebtRegister
        \        |         /
         QualityCenterOrchestrator
                 |
                 v
      Quality Center Report
                 ^
                 |
      Compliance Evidence Adapter
```

Governance stellt nur den neutralen Evidence-Vertrag bereit. Compliance bleibt fachliche Authority fuer die bestehenden Scanner und deren Findings. Das Quality Center konsumiert deren Ergebnisse, veraendert aber keine Compliance-Regel.

## Quality Gate Semantics

Die acht Gates entsprechen ESS-0001-CONTRACTS Chapter 12. Ein Gate mit unvollstaendiger technischer Evidence wird als `NOT_AVAILABLE` ausgegeben und niemals zu PASS hochgestuft. Blockierende Evidence ergibt `FAIL`.

Der aktuelle Core besitzt vollstaendige Evidence fuer Versions- und QM-Dokumentationsstatus. Contract-, Test- und Build-Gates sowie Teile von Architektur/Security/Compliance benoetigen weitere bestehende oder kuenftige Validator-Evidence und bleiben bis dahin transparent `NOT_AVAILABLE`, sofern kein blockierender Befund vorliegt.

## Quality Scoring

Die sieben verbindlichen Achsen sind Documentation, Test, Architecture, Security, Knowledge, Metadata und Twin. Jede Messung muss einen Wert 0..100 sowie eine Source besitzen. Ein Gesamtwert wird nur bei vollstaendiger Messmenge ausgegeben; fehlende Messachsen werden explizit ausgewiesen.

## Technical Debt

Technische Schulden werden mit ID, Ursache, Auswirkung, Aufwand, Prioritaet, Zielversion und Source-Referenzen registriert. Ein Eintrag kann nur mit Resolution-Evidence geschlossen werden und wird niemals stillschweigend ueberschrieben oder entfernt.

## ESS / ADR References

- ESS-0001-CONTRACTS Chapter 11 und 12
- ESS-0005 — Quality Center
- ESS-0006 — Security & Compliance
- ESS-0012 — Documentation Governance
- ESS-0017 — Vocabulary Governance
- ADR-0012 — SecurityComplianceAuditor
- ADR-0016 — ESS Component Specifications
- ADR-0030 — Release Version Gate
- ADR-0096 — Governance Control Plane

## Events

Der Core erzeugt noch keine synthetischen EventMesh-Events. Die in ESS-0005 beschriebenen Events bleiben Zielzustand und duerfen erst bei realer EventMesh-Integration als implementiert deklariert werden.
