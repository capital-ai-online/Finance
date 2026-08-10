# Documentary D6 — Generators & Renderers

Status: IMPLEMENTED IN DRAFT
Date: 2026-08-10
Basis: D4 / PR #171 / verified main `114356fbfb2a7a3743cfb85f73b04ab673847546`

## Deutsch

D6 führt eine deterministische Output-Schicht für bereits gouvernierte `DocumentaryDocument`-Modelle ein. Die Core Engine bleibt die Erzeugungs-Authority; der Renderer transformiert ausschließlich ein vorhandenes Dokument in ein transportierbares Markdown-Artefakt.

Unterstützte Dokumenttypen sind `architecture`, `component`, `api`, `runbook`, `release-evidence` und `handoff`. Jeder Typ besitzt ein eigenes Abschnittsprofil. Für jedes Dokument können deutsche und englische Markdown-Artefakte erzeugt werden. Metadatenüberschriften werden lokalisiert; Inhalt, Fingerprint, Source Commit, Provenance, Concept-IDs und Traceability-IDs bleiben unverändert beziehungsweise deterministisch sortiert.

D6 führt keine automatische Übersetzung fachlicher Inhalte durch. Eine echte bilinguale Content-Generierung bleibt an die vorhandenen Vocabulary-/Documentary-Contracts gebunden und darf nicht durch implizite Modellübersetzung ersetzt werden.

Schutzgrenzen: kein Approval, keine Lifecycle-Transition, keine Persistenz, keine Source-Code-Mutation, kein neuer EventBus, keine neue Version Authority.

## English

D6 adds a deterministic output layer for existing governed `DocumentaryDocument` models. The Core Engine remains the creation authority; the renderer only transforms an existing document into a portable Markdown artifact.

Supported document types are `architecture`, `component`, `api`, `runbook`, `release-evidence`, and `handoff`. Each type has a dedicated section profile. German and English Markdown artifacts can be generated with localized metadata labels while preserving content, fingerprint, source commit, provenance, concept IDs, and traceability IDs.

D6 does not autonomously translate domain content and does not perform approval, lifecycle transitions, persistence, source-code mutation, event-bus creation, or version-authority changes.
