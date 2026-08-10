# Documentary D5 + E1 + E4 — Traceability & Event Integration

Status: IMPLEMENTED IN DRAFT
Date: 2026-08-10
Basis: D2 / PR #168 / main `c805914e544d63c6cdce1ed8a759b8bc48664fce`

## Deutsch

D5 verknuepft Documentary-Dokumente mit correlationId, causationId, Source Commit, Document Fingerprint, Concept IDs, Traceability IDs und Provenance-Referenzen. E1 bindet Documentary als kontrollierten Consumer und Producer an den bestehenden EventMesh an. E4 schliesst die End-to-End Evidence Chain zwischen vorgelagertem Event und Documentary Output.

Consumer: `RepositoryScannedEvent` und `PlatformDecisionEvent`. Die Event-ID des ausloesenden Events wird als `causationId` uebernommen; die bestehende `correlationId` wird unveraendert fortgefuehrt.

Producer: `DocumentationGeneratedEvent` und `DocumentationValidatedEvent`. Beide tragen Source Commit, Document Fingerprint, causationId und den vollstaendigen DocumentaryTraceabilityRecord im Payload.

Schutzgrenzen: kein zweiter EventBus, keine zweite Registry, keine automatische Approval-Transition, keine Source-Code-Mutation und keine Aenderungen an Stripe, Supabase, Render, DB-Schemas oder ENV Keys.

## English

D5/E1/E4 establishes an evidence-preserving bridge between canonical upstream events, Documentary documents and Traceability. Correlation IDs are preserved end-to-end, the triggering event ID becomes the causation ID, and generated/validated document events carry commit, fingerprint and traceability evidence through the existing EventMesh only.
