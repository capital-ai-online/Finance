# Documentary

## Enterprise Component

Status: Partial Implementation

Version: 1.3.0

Component Version Authority: `manifest.json#version`

Document Schema Version Authority: `Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`

Platform Version Authority: repository `package.json#version` via the existing Version Manager / release-governance contract

Owner: CAPITAL-AI

---

## Purpose

Documentary wird schrittweise von einer Zielstruktur zu einer ausführbaren Plattformkomponente ausgebaut. Die vollständige Engine ist noch nicht implementiert.

Bereits vorhanden sind der bilinguale Vocabulary-basierte Projection-Layer, die D0-Versionierungsbaseline, D1 read-only Repository Code Discovery und D3 typisierte Document Models mit Provenance und Fingerprint.

## Implemented Scope

- `Contracts/BilingualDocumentReference.ts`
- `Documentation/BilingualDocumentaryProjection.ts`
- `Versioning/DocumentaryVersion.ts`
- `Discovery/CodeEvidence.ts`
- `Discovery/RepositoryCodeDiscovery.ts`
- `Models/DocumentaryDocument.ts`
- `Models/DocumentaryProvenance.ts`
- `Architecture/documentary-baseline.json`
- zugehörige Unit-/Contract-Tests

D1 liefert reproduzierbare Code-Evidence gebunden an einen Git-Commit. D3 überführt diese und weitere Authorities in ein strukturiertes Document Model.

## D3 Document Model

Jedes Documentary Document trägt `documentId`, `documentType`, `schemaVersion`, `componentVersion`, `platformVersion`, `sourceCommit`, `generatedAt`, `reviewStatus`, semantische Concept-/Traceability-IDs, Provenance und einen SHA-256-Fingerprint.

Unterstützte Provenance-Arten sind Code, ESS, ADR, Vocabulary, Event und manuelle Evidence. Code-Provenance erfordert zwingend Git-Commit und Repository-Pfad. Dokumente ohne Provenance werden fail-closed abgewiesen.

Der Reproduzierbarkeits-Fingerprint basiert auf stabilen Inhalts-, Versions- und Evidence-Feldern. `generatedAt` und `reviewStatus` sind Lifecycle-Metadaten und ändern den Fingerprint nicht.

Statusmodell: `draft`, `generated`, `reviewed`, `approved`, `superseded`, `archived`.

## Version Model

- Component Version: `manifest.json#version`.
- Document Schema Version: `DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`.
- Platform Version: zentrale Version-Manager-/`package.json`-Authority.

Diese drei Versionen bleiben semantisch unabhängig.

## Implementation Baseline

Aktuell implementiert: `Contracts`, `Discovery`, `Documentation`, `Models`, `Versioning`.

Weiterhin geplant: `Engine`, `Events`, `Generators`, `Governance`, `Interfaces`, `Knowledge`, `Mermaid`, `Migration`, `Plugins` sowie weitere Architecture-Runtime-Funktionen.

## Boundaries

Documentary mutiert in D3 keine Source-Dateien, APIs, Contracts, Events, DB-Schemas oder ENV Keys. D3 publiziert keine Events und implementiert noch keine Core Engine. Human-/Governance-Approval bleibt für geschützte Dokumentklassen ein späterer Engine-/Governance-Schritt.

## ESS / ADR

- ESS-0010 — Documentary Engine
- ESS-0011 — Enterprise Traceability
- ESS-0012 — Documentation Governance
- ESS-0017 / ESS-0017-CONTRACTS — Vocabulary Governance
- ADR-0046 — Vocabulary Governance Authority and Namespace
