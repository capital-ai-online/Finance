# EventMesh

## Enterprise Component

Status: Implemented / Operational

Version: 1.2.0

Layer: Querschnittsmodul mit erweitertem Zugriff

Owner: Platform Director

---

## Purpose

Die Enterprise Event Mesh (EEM) ist die zentrale Kommunikationsschicht der CAPITAL-AI Plattform. Sie registriert, validiert, routet und protokolliert standardisierte, versionierte Enterprise Events. Sie erzeugt keine fachlichen Entscheidungen.

## Authority

Normative Grundlagen sind ESS-0001-CONTRACTS Chapter 8, ESS-0013, ESS-0013-CONTRACTS und ADR-0018. Es gibt keinen zweiten EventBus und keine parallele Event-Registry.

## Implementierter Kern

- `Contracts/`: Event Contract, Payload, Metadata, Version und Schema.
- `Core/`: EventBus, Dispatcher, Publisher, Subscriber und Router.
- `Registry/`: Event-, Producer- und Consumer-Registry.
- `Validators/`: Contract-/Schema-/Policy-Validierung.
- `Discovery/`: Manifest-basierte Producer-/Consumer-Evidence.
- `Policies/EventReplayGuard.ts`: E2 Idempotency-/Ordering-Grenze.
- `Reports/EventReliabilityReport.ts`: E5 Failure-/Consumer-Health-/Poison-Evidence.

## E2 — Idempotency, Ordering & Replay

`EventReplayGuard` verwendet die unveränderliche `eventId` als Idempotency Key. Eine bereits verarbeitete Event-ID wird als `duplicate` klassifiziert. Ordering wird ausschließlich innerhalb derselben `correlationId` bewertet; ein Event mit älterem Timestamp als das zuletzt akzeptierte Event derselben Correlation wird als `stale` klassifiziert. Events anderer Correlations bleiben unabhängig.

Die Guard-Schicht ist fail-closed bei fehlender Event-ID, Correlation-ID oder ungültigem Timestamp. Sie verändert keine Payload und publiziert keine Folgeentscheidung. Der aktuelle Guard ist bewusst in-memory und damit pro Prozess gültig; durable Multi-Instance-Replay benötigt einen separaten persistenten Infrastruktur-Scope.

## E5 — Reliability & Observability Evidence

`EventReliabilityReport` leitet aus dem bestehenden Delivery Log deterministisch ab:

- total / delivered / failed / no-consumers;
- Failure Rate;
- betroffene Event-Typen;
- fehlgeschlagene Consumer;
- strukturierte Failure Evidence mit `eventId`, `correlationId`, Consumer und Reason;
- Poison-Event-Kandidaten anhand eines expliziten Failure-Thresholds.

Damit werden Zustellfehler nicht still verworfen. Die Auswertung bleibt read-only und erzeugt keine zweite Observability-Pipeline.

## Boundaries

Keine fachlichen Entscheidungen, keine autonome Retry-Mutation, keine zweite Queue, keine zweite Registry, keine direkte Documentary-/Knowledge-Abhängigkeit und keine Umgehung von Human-/Governance-Gates. Render-Deploy bleibt ausschließlich nach verifiziertem `main`-CI zulässig.

## Abhängigkeiten

Zulässig: Core, Shared, Registry, Discovery. Unzulässig: Supervisor, PlatformDirector, Documentary, Traceability, Knowledge, Compliance, VersionManager, Security, Release, Quality als direkte Implementierungsabhängigkeiten.

## Statushinweis

Die EventMesh ist seit ADR-0018 ausführbar und operativ. E0/E3 ergänzten Contract Inventory und versionierte Event Contracts; E2/E5 ergänzen Replay-/Ordering- sowie Reliability Evidence. Persistente Durable Queues, Multi-Instance-Deduplication und echte Retry-Orchestrierung sind ausdrücklich nicht Gegenstand dieses In-Memory-Scopes.
