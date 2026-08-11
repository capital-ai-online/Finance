# ADR-0055 — Event-Driven CAPITAL-AI Value Chain Governance Integration

> **Renumbering note (2026-08-11):** originally filed as `ADR-0045`, which collided with the
> already-established `ADR-0045-stripe-event-ownership-durable-inbox.md` (2026-08-08, heavily
> referenced by ADR-0052, ADR-0054, ROADMAP.md and multiple call sites). Renumbered to `ADR-0055`
> to resolve the collision; no content changed beyond the number.

Status: Proposed  
Datum / Date: 2026-08-09  
Authority: ESS-0001-CONTRACTS  
Related: ESS-0003, ESS-0009, ESS-0010, ESS-0011, ESS-0012, ADR-0044

## Deutsch

### Kontext
CAPITAL-AI besitzt bereits Platform Director, Supervisor, Documentary, Knowledge, Traceability, Quality, Security, Compliance, Versioning und Release-Komponenten. Neue Ereignisse sollen diese Komponenten künftig autonom und deterministisch miteinander verzahnen, statt isolierte manuelle Folgearbeiten zu erzeugen.

### Entscheidung
CAPITAL-AI verwendet ein standardisiertes Domain-Event-Modell für relevante Lifecycle-Änderungen. Ereignisse werden durch einen zentralen Event-Router an zuständige Plattformkomponenten verteilt.

Vorgesehene Ereignisklassen umfassen mindestens:
- requirement.created
- architecture.decision.accepted
- vocabulary.updated
- implementation.started
- component.changed
- contract.changed
- documentation.updated
- traceability.updated
- quality.validated
- compliance.validated
- release.candidate.created
- deployment.validated
- release.published

Jedes Event enthält mindestens eventId, eventType, schemaVersion, occurredAt, source, aggregateType, aggregateId, actor, correlationId, optional causationId und Evidence-Referenzen.

### Orchestrierungsregel
Automatische Folgeprozesse dürfen Knowledge, Documentary, Traceability, Quality, Compliance und Release-Evidence aktualisieren. Human-Approval-Gates für neue PRs, geschützte Architektur-/Security-Änderungen, produktionskritische Mutationen und Releases bleiben verbindlich.

### Fehler- und Wiederholungsmodell
Event Handler müssen idempotent, nachvollziehbar und fehlertolerant implementiert werden. Ein Fehler in einem Consumer darf keine unkontrollierte Teilmutation auslösen. Wiederholungen müssen anhand eventId/correlationId erkennbar sein.

## English

### Context
CAPITAL-AI already contains Platform Director, Supervisor, Documentary, Knowledge, Traceability, Quality, Security, Compliance, Versioning, and Release capabilities. New events should connect these components autonomously and deterministically instead of creating isolated manual follow-up work.

### Decision
CAPITAL-AI adopts a standardized domain-event model for relevant lifecycle changes. A central event router distributes events to responsible platform components.

The lifecycle includes requirement, architecture, vocabulary, implementation, component, contract, documentation, traceability, quality, compliance, release-candidate, deployment-validation, and release events.

Every event carries stable identity, version, timestamp, source, aggregate context, actor context, correlation, optional causation, and evidence references.

### Orchestration rule
Automation may update Knowledge, Documentary, Traceability, Quality, Compliance, and release evidence. It must not bypass human approval gates for PR creation, protected architecture/security changes, production-critical mutations, or releases.

### Reliability model
Event handlers must be idempotent, observable, and failure-tolerant. Consumer failures must not cause uncontrolled partial mutation, and replay must be detectable through event and correlation identifiers.
