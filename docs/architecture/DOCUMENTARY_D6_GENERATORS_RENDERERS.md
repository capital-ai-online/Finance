# Documentary D6 — Generators & Renderers

Status: IMPLEMENTED BASELINE
Date: 2026-09-01
Basis: current Documentary D6/D7 model and projection contracts

## Deutsch

D6 führt eine deterministische Output-Schicht für bereits gouvernierte `DocumentaryDocument`-Modelle ein. Die Core Engine bleibt die Erzeugungs-Authority; Renderer transformieren ausschließlich vorhandene Documentary-Modelle oder deren deterministische Projektionen in transportierbare Textartefakte.

### Markdown-Rendering

Unterstützte Dokumenttypen sind `architecture`, `component`, `api`, `runbook`, `release-evidence` und `handoff`. Jeder Typ besitzt ein eigenes Abschnittsprofil. Für jedes Dokument können deutsche und englische Markdown-Artefakte erzeugt werden. Metadatenüberschriften werden lokalisiert; Inhalt, Fingerprint, Source Commit, Provenance, Concept-IDs und Traceability-IDs bleiben unverändert beziehungsweise deterministisch sortiert.

D6 führt keine automatische Übersetzung fachlicher Inhalte durch. Eine echte bilinguale Content-Generierung bleibt an die vorhandenen Vocabulary-/Documentary-Contracts gebunden und darf nicht durch implizite Modellübersetzung ersetzt werden.

### Deterministische Mermaid-Projektion — WP-DOC-05

`Mermaid/DocumentaryMermaidRenderer.ts` rendert die bereits vorhandene `DocumentaryKnowledgeProjection` als Mermaid-Quelltext. Dadurch werden keine zweiten Graph-, Knowledge- oder Diagrammverträge eingeführt: Node- und Relationship-Semantik stammen ausschließlich aus der bestehenden D7-Projektion.

Der Generator ist pure/read-only und deterministisch:

- Node-Aliase werden aus der vollständigen SHA-256-Prüfsumme der vorhandenen Node-ID gebildet;
- Nodes und gerichtete Relationships werden unabhängig von der Eingabereihenfolge stabil sortiert;
- Relationship-Typen sind auf die bestehenden D7-Werte `REFERENCES_CONCEPT`, `TRACEABLE_TO` und `DERIVED_FROM` begrenzt;
- Evidence-Labels werden für Mermaid neutralisiert; Steuerzeichen, Quotes, HTML-Grenzzeichen und literal `://`-URL-Tokens werden escaped;
- erzeugt werden ausschließlich `flowchart TD` oder `flowchart LR` sowie ein `text/vnd.mermaid`-Artefakt mit eigener SHA-256-Prüfsumme;
- Mermaid wird weder ausgeführt noch im Browser gerendert; es werden keine `click`-, URL-, HTML-, Script- oder externe Ressourcen-Direktiven erzeugt.

Die Projektion persistiert keinen Graphen, verändert weder `DocumentaryDocument` noch `DocumentaryKnowledgeProjection`, führt keine Lifecycle-Transition aus und publiziert keine Events.

Schutzgrenzen: kein Approval, keine Lifecycle-Transition, keine Persistenz, keine Source-Code-Mutation, kein neuer EventBus, keine neue Knowledge-/Diagramm-Registry, keine neue Version Authority und keine Runtime-/Deployment-Autorität.

## English

D6 provides a deterministic output layer for existing governed `DocumentaryDocument` models. The Core Engine remains the creation authority; renderers only transform existing Documentary models or their deterministic projections into portable text artifacts.

### Markdown rendering

Supported document types are `architecture`, `component`, `api`, `runbook`, `release-evidence`, and `handoff`. Each type has a dedicated section profile. German and English Markdown artifacts can be generated with localized metadata labels while preserving content, fingerprint, source commit, provenance, concept IDs, and traceability IDs.

D6 does not autonomously translate domain content. Bilingual content generation remains bound to the existing Vocabulary/Documentary contracts and must not be replaced by implicit model translation.

### Deterministic Mermaid projection — WP-DOC-05

`Mermaid/DocumentaryMermaidRenderer.ts` renders the existing `DocumentaryKnowledgeProjection` as Mermaid source text. No second graph, Knowledge, or diagram contract is introduced: node and relationship semantics are consumed directly from the existing D7 projection.

The generator is pure/read-only and deterministic:

- node aliases are derived from the full SHA-256 checksum of the existing node identifier;
- nodes and directed relationships are stably sorted regardless of input ordering;
- relationship types are restricted to existing D7 values `REFERENCES_CONCEPT`, `TRACEABLE_TO`, and `DERIVED_FROM`;
- evidence labels are neutralized for Mermaid; control characters, quotes, HTML boundary characters, and literal `://` URL tokens are escaped;
- output is limited to `flowchart TD` or `flowchart LR` plus a `text/vnd.mermaid` artifact with its own SHA-256 checksum;
- Mermaid is not executed or browser-rendered, and no `click`, URL, HTML, script, or external-resource directives are emitted.

The projection persists no graph, mutates neither `DocumentaryDocument` nor `DocumentaryKnowledgeProjection`, performs no lifecycle transition, and publishes no events.

Boundaries: no approval, lifecycle transition, persistence, source-code mutation, new EventBus, new Knowledge/diagram registry, new version authority, or runtime/deployment authority.
