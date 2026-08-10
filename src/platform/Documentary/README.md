# Documentary

## Enterprise Component

Status: Partial Implementation

Version: 1.4.0

Component Version Authority: `manifest.json#version`

Document Schema Version Authority: `Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`

Platform Version Authority: repository `package.json#version` via the existing Version Manager / release-governance contract

Owner: CAPITAL-AI

---

## Purpose

Documentary wird schrittweise zu einer ausführbaren Plattformkomponente ausgebaut. Implementiert sind inzwischen der bilinguale Vocabulary-Layer, D0 Version Authority, D1 Code Discovery, D3 Document Models/Provenance und D2 Core Engine.

## Implemented Scope

- `Contracts/BilingualDocumentReference.ts`
- `Documentation/BilingualDocumentaryProjection.ts`
- `Versioning/DocumentaryVersion.ts`
- `Discovery/CodeEvidence.ts`
- `Discovery/RepositoryCodeDiscovery.ts`
- `Models/DocumentaryDocument.ts`
- `Models/DocumentaryProvenance.ts`
- `Interfaces/IDocumentaryEngine.ts`
- `Engine/DocumentaryEngine.ts`
- `Architecture/documentary-baseline.json`
- zugehörige Unit-/Contract-Tests

## D2 Core Engine

`DocumentaryEngine` orchestriert die Erzeugung strukturierter `DocumentaryDocument`-Models aus D1-Code-Evidence, D3-Provenance-/Version-Contracts, Vocabulary Concept IDs und Traceability IDs.

Die Engine arbeitet fail-closed:
- vollständiger 40-stelliger `sourceCommit` ist verpflichtend;
- Evidence Map und jedes Evidence-Element müssen denselben Source Commit tragen;
- mindestens eine Code-Evidence, Concept-ID und Traceability-ID sind Pflicht;
- vollständiger Documentary Version Context ist Pflicht;
- eine `correlationId` darf idempotent wiederholt werden, aber nicht für einen abweichenden Request wiederverwendet werden.

Die Engine erzeugt ausschließlich den Lifecycle-Status `generated`. Sie führt keine autonome Review-/Approval-Transition durch.

## D3 Document Model

Jedes Documentary Document trägt `documentId`, `documentType`, `schemaVersion`, `componentVersion`, `platformVersion`, `sourceCommit`, `generatedAt`, `reviewStatus`, semantische Concept-/Traceability-IDs, Provenance und einen SHA-256-Fingerprint.

Der Reproduzierbarkeits-Fingerprint basiert auf stabilen Inhalts-, Versions- und Evidence-Feldern. `generatedAt` und `reviewStatus` sind Lifecycle-Metadaten und ändern den Fingerprint nicht.

## Version Model

- Component Version: `manifest.json#version`.
- Document Schema Version: `DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`.
- Platform Version: zentrale Version-Manager-/`package.json`-Authority.

Diese drei Versionen bleiben semantisch unabhängig.

## Implementation Baseline

Aktuell implementiert: `Contracts`, `Discovery`, `Documentation`, `Engine`, `Interfaces`, `Models`, `Versioning`.

Weiterhin geplant: `Events`, `Generators`, `Governance`, `Knowledge`, `Mermaid`, `Migration`, `Plugins` sowie weitere Architecture-Runtime-Funktionen.

## Boundaries

D2 rendert keine Markdown-/Diagramm-Ausgaben, publiziert keine Events, mutiert keinen Source Code und genehmigt keine geschützten Dokumente. Event-Integration, Governance/Approval, Generatoren und Knowledge Projection folgen in separaten Roadmap-Schritten.

## ESS / ADR

- ESS-0010 — Documentary Engine
- ESS-0011 — Enterprise Traceability
- ESS-0012 — Documentation Governance
- ESS-0017 / ESS-0017-CONTRACTS — Vocabulary Governance
- ADR-0046 — Vocabulary Governance Authority and Namespace
