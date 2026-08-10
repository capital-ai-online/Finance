# EventMesh E2 + E5 — Replay, Ordering & Reliability Evidence

Status: IMPLEMENTED IN DRAFT
Date: 2026-08-10
Basis: D7 / PR #175 / verified main `3db07f55c161453dfc285f318cd95780416b6bcf` / main CI #717 / Render production verified

## Deutsch

E2 führt eine explizite Replay-/Ordering-Grenze für Event-Verarbeitung ein. `eventId` ist der Idempotency Key. Deliberate Replays derselben Event-ID werden als `duplicate` erkannt. Ordering wird nur innerhalb derselben `correlationId` bewertet; verspätete Events werden als `stale` klassifiziert, ohne andere Correlations zu blockieren.

E5 leitet aus dem bestehenden EventMesh Delivery Log strukturierte Reliability Evidence ab: Delivery-/Failure-/No-Consumer-Zähler, Failure Rate, betroffene Event-Typen, fehlgeschlagene Consumer, Failure Evidence und Poison-Event-Kandidaten. Die Auswertung ist deterministisch und read-only.

Schutzgrenzen: keine zweite EventMesh, keine neue Registry, keine autonome Retry-Orchestrierung, keine fachliche Entscheidung, keine direkte Knowledge-/Documentary-Kopplung. Die aktuelle Replay-Guard ist in-memory; durable Multi-Instance-Deduplication bleibt ein separater Infrastruktur-Scope.

## English

E2 adds an explicit replay and ordering boundary. `eventId` is the idempotency key; deliberate duplicate deliveries are classified as `duplicate`, while ordering is scoped to a single `correlationId` and older arrivals are classified as `stale`.

E5 derives deterministic reliability evidence from the existing EventMesh delivery log: delivery/failure/no-consumer counts, failure rate, failing event types and consumers, structured failure evidence, and poison-event candidates. No second event bus, registry, retry pipeline, or business decision path is introduced.
