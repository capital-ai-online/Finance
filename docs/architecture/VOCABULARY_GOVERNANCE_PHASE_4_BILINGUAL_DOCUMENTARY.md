# CAPITAL-AI Vocabulary Governance — Phase 4 Bilingual Documentary Integration

Status: In Progress  
Datum / Date: 2026-08-10  
Baseline: `main@a41c85bc24d4ada79bb9c47c5f01693bbcb2857e`  
Authorities: ESS-0001-CONTRACTS, ESS-0010, ESS-0012, ESS-0017, ESS-0017-CONTRACTS, ADR-0046

## Deutsch

### Zweck

Phase 4 verbindet die Canonical Vocabulary Registry mit der Documentary-Schicht, ohne eine noch nicht vorhandene vollständige Documentary Engine vorzutäuschen. Die bestehende Documentary-Zielstruktur bleibt erhalten; implementiert wird zunächst ein ausführbarer Bilingual-Contract-Layer.

### Verifizierte Baseline

Der Main-Commit `a41c85bc24d4ada79bb9c47c5f01693bbcb2857e` wurde durch CI #649 vollständig verifiziert. TypeScript, Unit-Tests, Production Build, CSP Delivery, Deployment Readiness, Docker Build, Runtime-Metadaten und der Render-Deploy-Gate waren erfolgreich.

### Implementationsgrenze

`src/platform/Documentary/README.md` dokumentiert aktuell, dass die vollständige Documentary Engine noch nicht implementiert ist. Phase 4 führt deshalb nur die kleinste belastbare Integration ein:

- `BilingualDocumentReference` als sprachgebundene Sicht auf eine sprachneutrale Concept-ID;
- `BilingualDocumentPair` als gekoppeltes DE/EN-Paar derselben Concept-ID;
- Projektion ausschließlich aus einem `approved` Vocabulary Concept;
- identischer `canonicalCodeTerm` für DE und EN;
- identische ESS-, ADR- und Traceability-Referenzen für beide Sprachen;
- fail-closed bei unbekannten Concepts, nicht freigegebenen Concepts oder fehlenden Übersetzungen;
- keine neuen Event-Typen und keine EventMesh-Änderung in Phase 4.

### Architekturfluss

```text
Canonical Vocabulary Registry
        │
        │ VocabularyConcept.id
        ▼
Bilingual Documentary Projection
        │
        ├── DE Reference
        └── EN Reference
             │
             └── identische ESS / ADR / Traceability IDs
```

Die Dokumentationssprache ist damit eine Darstellung desselben semantischen Concepts und keine zweite unabhängige Terminologiequelle.

### Nicht Teil dieses PRs

- keine vollständige Documentary Engine;
- keine automatische Legacy-Dokumentmigration;
- keine Event-Erzeugung für fehlende Übersetzungen;
- keine Änderungen an Knowledge Graph, Traceability Store oder EventMesh;
- keine aktiven Code-Renames.

Diese Punkte folgen inkrementell innerhalb Phase 4 bzw. Phase 5.

## English

### Purpose

Phase 4 connects the Canonical Vocabulary Registry to the Documentary layer without pretending that the full Documentary Engine already exists. The first executable integration is a bilingual contract/projection layer.

Both German and English views are derived from the same approved `VocabularyConcept.id`, retain the same canonical code term and language-neutral ESS/ADR/traceability references, and fail closed for unknown concepts, unapproved concepts or missing translations. No new EventMesh events are introduced in this phase.

### Exit direction

Phase 4 can be completed when Documentary consumers consistently derive DE/EN representations from shared concept identities, missing translations are handled through the existing event architecture, and the revalidated legacy-document migration can proceed file-by-file without semantic divergence.
