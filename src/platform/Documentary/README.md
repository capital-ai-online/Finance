# Documentary

## Enterprise Component

Status: Partial Implementation

Version: 1.10.0

Component Version Authority: `manifest.json#version`

Document Schema Version Authority: `Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`

Platform Version Authority: repository `package.json#version` via `src/platform/Release/Services/platformVersionControlPlane.ts`

Owner: CAPITAL-AI

---

## Purpose

Documentary wird schrittweise zu einer ausführbaren Plattformkomponente ausgebaut. Implementiert sind der bilinguale Vocabulary-Layer, D0 Version Authority, D1 Code Discovery, Documentation Hygiene als read-only Service, Status-Event Drift Detection (Phase B, read-only), Status-Event Drift Updater (Phase C, header-only, Draft-PR / dryRun default), D3 Document Models/Provenance, D2 Core Engine, D5/E1/E4 Traceability/Event-Integration, D4 Review/Lifecycle Governance, D6 Generatoren/Renderer und D7 Knowledge Projection.

## Implemented Scope

- `Contracts/BilingualDocumentReference.ts`
- `Documentation/BilingualDocumentaryProjection.ts`
- `Versioning/DocumentaryVersion.ts`
- `Governance/Services/DocumentationHygieneValidator.ts`
- `Discovery/CodeEvidence.ts`
- `Discovery/StatusEventEvidence.ts`
- `Discovery/StatusEventDriftDetector.ts`
- `Discovery/StatusEventDriftUpdater.ts`
- `Models/DocumentaryDocument.ts`
- `Models/DocumentaryProvenance.ts`
- `Interfaces/IDocumentaryEngine.ts`
- `Engine/DocumentaryEngine.ts`
- `Events/DocumentaryEvents.ts`
- `Events/DocumentaryEventConsumer.ts`
- `Events/DocumentaryEventPublisher.ts`
- `Traceability/DocumentaryTraceability.ts`
- `Lifecycle/DocumentaryLifecycle.ts`
- `Generators/DocumentaryRenderer.ts`
- `Knowledge/DocumentaryKnowledgeProjection.ts`
- `Architecture/documentary-baseline.json`

## Documentation Governance

Der Namespace `Governance/` bleibt gemäß ADR-0014 / ESS-0012 ausschließlich **Documentation-only**. Der integrierte `DocumentationHygieneValidator` prüft Root-Markdown, Document Registry, Lifecycle-/Sprachwerte und Registry-Zielpfade read-only und fail-closed. Er definiert keine globale Repository-Authority, keine Merge-Entscheidung und keine Produktionsmutationsberechtigung.

Die vollständige historische ESS-0012-Regelmenge ist nicht pauschal als umgesetzt zu interpretieren; weitere semantische Validatoren bleiben inkrementelle Documentary-Arbeit. Repository-weite Authority-Auflösung verbleibt im Governance Control Plane unter `src/platform/Governance` und ADR-0096.

## D7 Knowledge Integration

D7 erzeugt aus einem bereits gouvernierten `DocumentaryDocument` eine deterministische Knowledge-Projektion mit Dokumentknoten, gerichteten Beziehungen, Source Commit, Dokument-Fingerprint, Concept-IDs, Traceability-IDs, Provenance-Referenzen und SHA-256-Prüfsumme.

Die Projektion ist ausschließlich ein Übergabevertrag an die in ESS-0009 spezifizierte zentrale Knowledge Engine. Sie persistiert keine Daten in `.ai/knowledge/`, startet keinen Knowledge Build und führt keine zweite Knowledge Registry ein. `src/platform/Knowledge` bleibt eine eigenständige Authority und ist bis zu einem separaten Implementierungsscope weiterhin specification-only.

## D6 Generators & Renderer

D6 rendert ausschließlich bereits erzeugte `DocumentaryDocument`-Modelle. Unterstützt werden die Dokumenttypen `architecture`, `component`, `api`, `runbook`, `release-evidence` und `handoff` mit dokumenttyp-spezifischen Abschnittsprofilen.

Als primäres Ausgabeformat wird deterministisches Markdown erzeugt. Für jedes Dokument können DE- und EN-Artefakte mit lokalisierten Metadatenüberschriften erstellt werden. Dateinamen, Provenance, Concept-IDs und Traceability-IDs werden stabil normalisiert und sortiert.

Der Renderer verändert weder den Lifecycle-Status noch den Dokument-Fingerprint. Er führt keine Freigabe, Persistenz, Source-Code-Mutation oder Event-Publikation durch.

## D4 Review & Lifecycle Governance

Der kontrollierte Lifecycle lautet `generated -> reviewed -> approved`. Nach Approval sind `approved -> superseded`, `approved -> archived` und `superseded -> archived` zulässig. `suspended` ist im repository-weiten Governance Control Plane zusätzlich für explizit pausierte normative Altverträge verfügbar. Jeder Documentary-Übergang benötigt eine explizite Actor-ID, passende Aktion, einen Zeitpunkt und mindestens eine Evidence-Referenz.

## D5 / E1 / E4 Traceability & Event Value Chain

`DocumentaryTraceabilityRecord` verbindet Dokumente mit `correlationId`, `causationId`, Dokument-Fingerprint, Source Commit, Concept IDs, Traceability IDs und Provenance-Referenzen. Documentary nutzt ausschließlich den bestehenden EventMesh.

## D2 Core Engine

`DocumentaryEngine` orchestriert die Erzeugung strukturierter `DocumentaryDocument`-Models und erzeugt ausschließlich den Lifecycle-Status `generated`.

## Version Model

- Component Version: `manifest.json#version`.
- Document Schema Version: `DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`.
- Platform Version: ausschließlich `package.json#version`, gelesen über den Release Control Plane.
- `AGENTS.md` besitzt eine unabhängige Governance Control Plane Version und ist kein Produktversionsmirror.

## Implementation Baseline

Aktuell implementiert: `Contracts`, `Discovery`, `Documentation`, `Engine`, `Events`, `Generators`, `Governance` (Hygiene-Service), `Interfaces`, `Knowledge`, `Lifecycle`, `Models`, `Traceability`, `Versioning`.

Weiterhin geplant: `Mermaid`, `Migration`, `Plugins` sowie weitere Architecture-Runtime-Funktionen und zusätzliche ESS-0012-Validatoren.

## Boundaries

Keine autonome Approval-Transition, keine Source-Code-Mutation durch Validation, keine zweite Event- oder Knowledge-Infrastruktur und keine zweite Plattformversions-Authority. Phase-C Status-Header-Updates erfolgen nur header-only, allowlisted, dryRun-default und über Draft-PR.

## ESS / ADR

- ESS-0009 — Enterprise Knowledge Platform
- ESS-0010 — Documentary Engine
- ESS-0011 — Enterprise Traceability
- ESS-0012 — Documentation Governance (Documentation-only Scope)
- ESS-0017 / ESS-0017-CONTRACTS — Vocabulary Governance
- ADR-0014 — Documentation Governance Validator
- ADR-0096 — Governance Control Plane / Authority Boundary
- ADR-0046 — Vocabulary Governance Authority and Namespace
