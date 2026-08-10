# Documentary

## Enterprise Component

Status: Partial Implementation

Version: 1.6.0

Component Version Authority: `manifest.json#version`

Document Schema Version Authority: `Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`

Platform Version Authority: repository `package.json#version` via the existing Version Manager / release-governance contract

Owner: CAPITAL-AI

---

## Purpose

Documentary wird schrittweise zu einer ausführbaren Plattformkomponente ausgebaut. Implementiert sind der bilinguale Vocabulary-Layer, D0 Version Authority, D1 Code Discovery, D3 Document Models/Provenance, D2 Core Engine, D5/E1/E4 Traceability/Event-Integration und D4 Review/Lifecycle Governance.

## Implemented Scope

- `Contracts/BilingualDocumentReference.ts`
- `Documentation/BilingualDocumentaryProjection.ts`
- `Versioning/DocumentaryVersion.ts`
- `Discovery/CodeEvidence.ts`
- `Models/DocumentaryDocument.ts`
- `Models/DocumentaryProvenance.ts`
- `Interfaces/IDocumentaryEngine.ts`
- `Engine/DocumentaryEngine.ts`
- `Events/DocumentaryEvents.ts`
- `Events/DocumentaryEventConsumer.ts`
- `Events/DocumentaryEventPublisher.ts`
- `Traceability/DocumentaryTraceability.ts`
- `Lifecycle/DocumentaryLifecycle.ts`
- `Architecture/documentary-baseline.json`

## D4 Review & Lifecycle Governance

Der kontrollierte Lifecycle lautet `generated -> reviewed -> approved`. Nach Approval sind `approved -> superseded`, `approved -> archived` und `superseded -> archived` zulässig. Jeder Übergang benötigt eine explizite Actor-ID, passende Aktion, einen Zeitpunkt und mindestens eine Evidence-Referenz. Status-Sprünge, falsche Aktionen und evidence-freie Übergänge werden fail-closed blockiert.

D4 führt keine autonome Freigabe durch. Die Lifecycle-Schicht validiert lediglich explizit angeforderte Lifecycle-Transitions. Der Dokument-Fingerprint bleibt bei Lifecycle-only-Änderungen stabil.

Der separate Namespace `Governance/` bleibt dem in ESS-0012 spezifizierten Documentation Governance Validator vorbehalten. Dieser Validator ist weiterhin spezifiziert, aber nicht implementiert; D4 ändert diesen Implementierungsstatus nicht.

## D5 / E1 / E4 Traceability & Event Value Chain

`DocumentaryTraceabilityRecord` verbindet Dokumente mit `correlationId`, `causationId`, Dokument-Fingerprint, Source Commit, Concept IDs, Traceability IDs und Provenance-Referenzen. Documentary nutzt ausschließlich den bestehenden EventMesh.

## D2 Core Engine

`DocumentaryEngine` orchestriert die Erzeugung strukturierter `DocumentaryDocument`-Models und erzeugt ausschließlich den Lifecycle-Status `generated`.

## Version Model

- Component Version: `manifest.json#version`.
- Document Schema Version: `DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`.
- Platform Version: zentrale Version-Manager-/`package.json`-Authority.

## Implementation Baseline

Aktuell implementiert: `Contracts`, `Discovery`, `Documentation`, `Engine`, `Events`, `Interfaces`, `Lifecycle`, `Models`, `Traceability`, `Versioning`.

Weiterhin geplant: `Governance` (Documentation Governance Validator), `Generators`, `Knowledge`, `Mermaid`, `Migration`, `Plugins` sowie weitere Architecture-Runtime-Funktionen.

## Boundaries

Keine autonome Approval-Transition, keine Source-Code-Mutation, keine zweite Event-Infrastruktur. IAM-Step-Up/Persistenz, Governance Validator Runtime, Generatoren/Renderer und Knowledge Projection folgen separat.

## ESS / ADR

- ESS-0010 — Documentary Engine
- ESS-0011 — Enterprise Traceability
- ESS-0012 — Documentation Governance
- ESS-0017 / ESS-0017-CONTRACTS — Vocabulary Governance
- ADR-0046 — Vocabulary Governance Authority and Namespace
