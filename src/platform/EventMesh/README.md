# EventMesh

## Enterprise Component

Status: Implemented / Operational

Version: 1.2.0

Layer: Querschnittsmodul mit erweitertem Zugriff

Owner: Platform Director

---

## Purpose

Die Enterprise Event Mesh (EEM) ist die zentrale Kommunikationsschicht der CAPITAL-AI
Plattform. Sie vermittelt sämtliche Kommunikation zwischen Plattformkomponenten als
standardisierte, versionierte Enterprise Events.

Sie erzeugt keine fachlichen Events selbst. Sie registriert, validiert, routet und
protokolliert Events, die von den Fachkomponenten veröffentlicht werden.

Direkte Engine-zu-Engine-Abhängigkeiten sind langfristig durch registrierte Enterprise
Events zu ersetzen.

---

## Verhältnis zur Spezifikation

Diese Komponente **implementiert** ESS-0013 sowie den bereits bestehenden,
übergeordneten Rahmen aus **ESS-0001-CONTRACTS Chapter 8** (*Enterprise Event &
Messaging Contracts*).

| Dokument | Rolle |
|---|---|
| ESS-0001-CONTRACTS Chapter 8 | globales Regelwerk — Event-Prinzip, Namensregel, Contract-Pflichtfelder, Producer-/Consumer-Regeln, Routing-Prinzip, Validation-Kriterien |
| ESS-0013 | Spezifikation der EventMesh-**Komponente** — Core-Klassen, Registry-Mechanik, Validator-Kette, Report-Typen |
| ESS-0013-CONTRACTS | Regelwerk — Event-Katalog, Kompatibilitätsregeln, Policy-Regeln |
| **diese Komponente** | **Implementierungsort** |

Chapter 8 wird hier **nicht wiederholt**. Bei Abweichungen gilt Chapter 8, danach
ESS-0013.

---

## Struktur

```text
EventMesh/
  Contracts/    Event-Contract-Definitionen (EventContract, EventPayload, EventMetadata, EventVersion, EventSchema)
  Core/         EventBus, EventDispatcher, EventPublisher, EventSubscriber, EventRouter
  Discovery/    automatische Erkennung möglicher Producer und Consumer
  Events/       konkrete Enterprise-Event-Klassen je Kategorie
  Interfaces/   öffentliche Schnittstellen (IEventBus, IEventPublisher, IEventSubscriber, IEventRouter, IEventRegistry)
  Models/       Datenmodelle für Registry-Einträge, Katalogeinträge, Abonnements
  Policies/     Routing-Policies, Retry-Policies, Kompatibilitätspolicies
  Registry/     EventRegistry, ProducerRegistry, ConsumerRegistry, EventCatalog
  Reports/      EventFlowReport, EventCoverageReport, EventHealthReport, EventDependencyReport
  Services/     Ausführung und Orchestrierung des Routings
  Tests/        Vertrags- und Kompatibilitätstests
```

Jedes Unterverzeichnis besitzt genau eine Verantwortung gemäß ESS-0001-CONTRACTS
Chapter 3.

---

## Abhängigkeiten

**Zulässig:** Core, Shared, Registry, Discovery

**Unzulässig:** Supervisor, PlatformDirector, Documentary, Traceability, Knowledge,
Compliance, VersionManager, Security, Release, Quality — **jede** fachliche Komponente
kommuniziert mit der EventMesh ausschließlich über die in `Interfaces/` definierten
Schnittstellen, niemals über einen direkten Modul-Import.

Diese Regel ist die Umkehrung der üblichen Abhängigkeitsrichtung: Während andere
Querschnittsmodule (z. B. Traceability, Release) begrenzten Zugriff *auf* mehrere
Komponenten benötigen, darf **keine** Fachkomponente einen direkten Zugriff *auf* die
EventMesh-Implementierung besitzen — nur auf ihre öffentlichen Interfaces. Andernfalls
entstünde exakt die Kopplung, die die EventMesh auflösen soll.

Die Einordnung als Querschnittsmodul mit erweitertem Zugriff folgt derselben Regelung
aus ESS-0001-CONTRACTS Chapter 16 (*Cross Cutting Modules*), die bereits für `Release`
und `Traceability` angewendet wurde (ADR-0015).

---

## Rollentrennung

| Instanz | Rolle |
|---|---|
| **EventMesh** | **registriert, validiert, routet, protokolliert Events** |
| Fachkomponenten (Documentary, Traceability, Knowledge, Compliance, Version Manager, Supervisor, Platform Director, Security, Release) | erzeugen und konsumieren fachliche Events |
| Governance Validator | prüft Event-Contracts auf Dokumentationsregeln |
| Supervisor | überwacht Event-Flüsse, -Ausfälle, -Muster |
| Platform Director | entscheidet über neue Event-Typen und -Kategorien |

Die EventMesh erzeugt keine fachlichen Entscheidungen. Sie vermittelt.

---

## Event-Katalog (Referenzstand)

Der vollständige, versionierte Katalog liegt in `Registry/` (`EventCatalog`) und wird
automatisch aus den Producer-Deklarationen der Fachkomponenten aufgebaut. Der
Ausgangsbestand von 15 Standardereignissen sowie deren korrekte kanonische Namen und
Quellkapitel sind in ESS-0013 Abschnitt *Standard Event Catalog* dokumentiert — dort
auch die Korrektur dreier in der auslösenden Anforderung abweichend benannter Events
(`TraceabilityUpdatedEvent` → `TraceabilityBuildCompletedEvent`,
`KnowledgeGraphUpdatedEvent` → `KnowledgeUpdatedEvent`,
`DigitalTwinUpdatedEvent` → `TwinSynchronizedEvent`), um Duplikate zu bereits
kanonischen Event-Namen aus Chapter 8/15/18 und ESS-0011 zu vermeiden.

---

## E2 — Idempotency, Ordering & Replay

`Policies/EventReplayGuard.ts` verwendet `eventId` als Idempotency Key. Ein deliberate Replay derselben Event-ID wird als `duplicate` klassifiziert. Ordering wird ausschließlich innerhalb derselben `correlationId` bewertet; ein älter eintreffendes Event wird dort als `stale` klassifiziert, ohne unabhängige Correlations zu blockieren.

Die Guard-Schicht ist fail-closed bei fehlender Event-ID, Correlation-ID oder ungültigem Timestamp. Sie bleibt in-memory und pro Prozess. Durable Multi-Instance-Deduplication bleibt ein separater Infrastruktur-Scope.

## E5 — Reliability & Observability Evidence

`Reports/EventReliabilityReport.ts` leitet aus dem bestehenden Delivery Log deterministisch Delivery-/Failure-/No-Consumer-Zähler, Failure Rate, fehlgeschlagene Event-Typen und Consumer, strukturierte Failure Evidence sowie Poison-Event-Kandidaten ab. Die Auswertung ist read-only und erzeugt keine zweite Observability-Pipeline oder autonome Retry-Entscheidung.

---

## ESS Reference

ESS-0013 — Enterprise Event Mesh

ESS-0013-CONTRACTS — Enterprise Event Mesh Contracts

ESS-0001-CONTRACTS Chapter 8 — Enterprise Event & Messaging Contracts (Regelwerk, unverändert)

ESS-0011 — Enterprise Traceability (Event-Achse der ETM)

ESS-0010 — Documentary Engine

---

## ADR References

ADR-0018 — Einführung der Enterprise Event Mesh als Plattformmodul

ADR-0015 — Enterprise Traceability Component (Vorbild für Querschnittsmodul-Einordnung)

ADR-0014 — Documentation Governance Validator

ADR-0013 — ESS Documentation Responsibility Consolidation

---

## Implementierungsstand

Diese Komponente ist **implementiert (Stufe 1–4)** — als erste Komponente im
gesamten `src/platform/`-Baum mit ausführbarem Code (ADR-0018, Folgeentscheidung 1).

| Stufe | Voraussetzung | Zustand |
|---|---|---|
| 1 | JSON-Schemata für Event Contract, vollständige Metadaten | ✅ erledigt — `Contracts/` |
| 2 | Core, Interfaces, Models, Registry | ✅ erledigt |
| 3 | Enterprise Event Bus (Routing, Zustellung) | ✅ erledigt — `Core/EventBus.ts` |
| 4 | Validator-Kette (`Validators/`) | ✅ erledigt — vier Validatoren |

In-Memory, ohne externe Abhängigkeiten. E2/E5 ergänzen Replay-/Ordering- und Reliability-Evidence, führen aber bewusst keine persistente Queue oder zweite Event-Infrastruktur ein.

`Discovery/ManifestDiscovery.ts` liest `manifest.json` aller `src/platform/`-Komponenten zur Laufzeit und bildet Producer-/Consumer-Evidence aus dem realen Repository-Bestand.

`server/systemEvents.ts` (Audit-Log) und die Frontend-`CustomEvent`-Nutzung wurden additiv erweitert (ADR-0018, Folgeentscheidung 3); der bestehende Mechanismus bleibt erhalten.

---

## Notes

Vollständige Analyse und Begründung: `docs/architecture/ENTERPRISE_EVENT_READINESS_REPORT.md`, `docs/architecture/ENTERPRISE_EVENT_MESH_READINESS_REPORT.md` und `docs/architecture/EVENTMESH_E2_E5_REPLAY_RELIABILITY.md`.
