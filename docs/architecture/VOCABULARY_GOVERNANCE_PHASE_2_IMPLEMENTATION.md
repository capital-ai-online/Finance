# CAPITAL-AI Vocabulary Governance — Phase 2 Implementation

Status: Implemented on feature branch  
Datum / Date: 2026-08-09  
Authority: ESS-0017 / ESS-0017-CONTRACTS  
Architecture Decision: ADR-0046

## Deutsch

### Ziel

Phase 2 implementiert die Canonical Vocabulary Registry als eigenständige Plattformkomponente, ohne bestehende Runtime-Identifier umzubenennen und ohne parallele Event-, Knowledge- oder Traceability-Infrastruktur einzuführen.

### Implementierte Bausteine

- `VocabularyConcept` als typed Concept Contract;
- stabile Concept IDs im Format `VOC-<CATEGORY>-<NNNN>`;
- englischer `canonicalCodeTerm`;
- gemeinsame DE/EN Concept Identity;
- Alias- und Forbidden-Term-Verwaltung;
- deterministische Normalisierung und Collision Detection;
- immutable Registry Snapshots;
- öffentliches `IVocabularyRegistry` Interface;
- read-oriented `VocabularyService`;
- initiale, authority-referenzierte Seed-Concepts;
- Contract-Tests ohne neue Testframework-Abhängigkeit;
- `manifest.json`, `component.yaml`, README und CHANGELOG.

### Architektur-Integration

Die Komponente liegt unter `src/platform/Vocabulary` und referenziert ESS-0012 ausschließlich als Documentation-Governance-Abhängigkeit. ESS-0013 bleibt EventMesh-Authority. Phase 2 importiert keine EventMesh-Core-Implementierung und registriert keine neuen Event-Namen.

Knowledge, Documentary und Traceability können die Vocabulary Registry später über öffentliche Interfaces bzw. standardisierte Events konsumieren. Dadurch bleibt die bestehende Wertschöpfungskette erhalten und wird nicht durch eine zweite Infrastruktur fragmentiert.

### Safe-Rename-Grenze

Phase 2 führt keine aktiven Renames aus. Insbesondere werden keine Komponenten, Dateien, Imports/Exports, API-Routen, Schemas, Environment Keys oder bestehenden Event-Namen verändert. Die technische Rename-Impact-Prüfung bleibt Phase 3 vorbehalten.

### Validierung

Vorgesehener Contract-Test:

```text
npx tsx src/platform/Vocabulary/Tests/vocabularyRegistry.test.ts
```

Die Tests prüfen Auflösung, Normalisierung, doppelte IDs, Cross-Concept-Alias-Kollisionen, technische Naming-Regeln, Authority-Referenzen, Forbidden Terms und Immutable Snapshots.

### Phase-2-Exit

Phase 2 gilt nach erfolgreicher CI-/Contract-Test-Ausführung als abgeschlossen. Event-driven Lifecycle Integration, Safe Rename Gate und Documentary-Automation bleiben den nachfolgenden Roadmap-Phasen vorbehalten.

## English

### Goal

Phase 2 implements the Canonical Vocabulary Registry as an independent platform component without renaming existing runtime identifiers and without introducing parallel Event, Knowledge or Traceability infrastructure.

### Implemented scope

The implementation provides a typed concept contract, stable language-neutral IDs, English canonical technical terms, shared German/English mappings, alias and forbidden-term governance, deterministic collision detection, immutable registry snapshots, a public registry interface, a read-oriented service, initial authority-backed seed concepts, contract tests and full component metadata.

### Architecture integration

`src/platform/Vocabulary` treats ESS-0012 only as the Documentation Governance dependency and ESS-0013 as the EventMesh authority. Phase 2 does not import EventMesh core implementation and does not register new event names. Downstream lifecycle integration will use public interfaces and canonical events in later phases.

### Safety boundary

No components, files, imports/exports, API routes, schemas, environment keys or existing event names are renamed in Phase 2. Rename-impact enforcement remains Phase 3.
