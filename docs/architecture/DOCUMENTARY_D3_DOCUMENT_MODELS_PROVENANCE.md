# Documentary D3 — Document Models, Schemas & Provenance

Status: IMPLEMENTED IN DRAFT

Authority: ESS-0010, ESS-0011, ESS-0012

D3 definiert den kanonischen strukturierten Documentary-Output. Dokumente tragen Document-ID/-Typ, Schema-/Component-/Platform-Versionen, Source Commit, Lifecycle-Status, Concept-/Traceability-IDs, Provenance-Referenzen und einen deterministischen SHA-256-Fingerprint.

Unterstützte Provenance-Arten sind Code, ESS, ADR, Vocabulary, Event und manuelle Evidence. Code-Provenance erfordert Git-Commit und Repository-Pfad. Dokumente ohne Provenance werden fail-closed abgewiesen.

Der Fingerprint umfasst stabile Inhalte, Versionen, Source Commit, semantische IDs und Provenance. Lifecycle-Metadaten wie `generatedAt` und `reviewStatus` verändern den Fingerprint nicht.

D3 implementiert noch keine Core Engine, Renderer, Event-Publikation, automatische Approval-Transitions oder Source-Code-Mutation.
