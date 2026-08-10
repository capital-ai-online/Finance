# Documentary

## Enterprise Component

Status: Partial Implementation

Version: 1.2.0

Component Version Authority: `manifest.json#version`

Document Schema Version Authority: `Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`

Platform Version Authority: repository `package.json#version` via the existing Version Manager / release-governance contract

Owner: CAPITAL-AI

---

## Purpose

Documentary wird schrittweise von einer Zielstruktur zu einer ausführbaren Plattformkomponente ausgebaut. Die vollständige Engine ist noch nicht implementiert.

Bereits vorhanden sind der bilinguale Vocabulary-basierte Projection-Layer, die D0-Versionierungsbaseline und seit D1 eine read-only Repository Code Discovery.

---

## Implemented Scope

- `Contracts/BilingualDocumentReference.ts`
- `Documentation/BilingualDocumentaryProjection.ts`
- `Versioning/DocumentaryVersion.ts`
- `Discovery/CodeEvidence.ts`
- `Discovery/RepositoryCodeDiscovery.ts`
- `Architecture/documentary-baseline.json`
- zugehörige Unit-/Contract-Tests

D1 inventarisiert deterministisch für einen angegebenen Git-Commit Module, Exports, Type-/Interface-Contracts, Routes, Event-Symbole, Platform-Manifeste und deklarierte Manifest-Abhängigkeiten. Jedes Evidence-Element erhält `evidenceId`, `componentId`, `sourceCommit`, Pfad und optional Symbol/Detail.

Die Discovery ist ausschließlich read-only. Sie mutiert weder Source Code noch APIs, Contracts, Events oder Manifeste.

---

## Version Model

- Component Version: `manifest.json#version`.
- Document Schema Version: `DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`.
- Platform Version: zentrale Version-Manager-/`package.json`-Authority.

Diese drei Versionen bleiben semantisch unabhängig.

---

## Implementation Baseline

Aktuell implementiert:
- `Contracts`
- `Discovery`
- `Documentation`
- `Versioning`

Weiterhin geplant bzw. nicht als Documentary Runtime implementiert:
- `Architecture` (abgesehen von Baseline-Metadaten)
- `Engine`
- `Events`
- `Generators`
- `Governance`
- `Interfaces`
- `Knowledge`
- `Mermaid`
- `Migration`
- `Models`
- `Plugins`

---

## Discovery Boundaries

D1 verwendet keine AST-basierte Mutation und keine GitHub-/Runtime-Schreiboperation. Ein gültiger `sourceCommit` ist verpflichtend; ohne Commit-Provenance schlägt Discovery fail-closed fehl. Evidence wird stabil sortiert, und IDs werden aus Kind, Commit, Pfad und Symbol gehasht.

Die Regex-basierte D1-Erkennung ist eine erste Evidence-Schicht. Semantisch tiefere AST-/Compiler-Analyse kann später ergänzt werden, muss aber ebenfalls read-only bleiben und denselben Evidence-Contract liefern.

---

## ESS / ADR

- ESS-0010 — Documentary Engine
- ESS-0011 — Enterprise Traceability
- ESS-0012 — Documentation Governance
- ESS-0017 / ESS-0017-CONTRACTS — Vocabulary Governance
- ADR-0046 — Vocabulary Governance Authority and Namespace

---

## Dependencies

- Vocabulary Registry für bilinguale Concept-Projektion.
- Version Manager für Plattformversions-Authority.

D1 erzeugt keine neue Abhängigkeit auf Supervisor, Platform Director, EventMesh Runtime oder produktive Datenquellen.

---

## Events

D1 erkennt vorhandene Event-Symbole als Code Evidence, publiziert oder konsumiert aber selbst keine Documentary Events. Die Event-Integration bleibt Bestandteil der nachfolgenden Workstreams E/D2-D5.
