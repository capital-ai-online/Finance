# EventMesh

## Enterprise Component

Status: Development

Version: 1.0.0

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

Diese Komponente ist **spezifiziert, nicht implementiert**.

| Stufe | Voraussetzung | Zustand |
|---|---|---|
| 1 | JSON-Schemata für Event Contract, vollständige Metadaten | offen |
| 2 | Core, Interfaces, Models, Registry | offen |
| 3 | Enterprise Event Bus (Routing, Zustellung) | offen — Stufe 3 aus `REPOSITORY_STRUCTURE_ANALYSIS.md` |
| 4 | Validator-Kette (`Validators/`) | offen |

Kein bestehender Code wurde verändert. `server/systemEvents.ts` (Audit-Log) und die
Frontend-`CustomEvent`-Nutzung bleiben unverändert und außerhalb des Geltungsbereichs
dieser Komponente — siehe `docs/architecture/ENTERPRISE_EVENT_READINESS_REPORT.md`
Abschnitt 3.2.

---

## Notes

Vollständige Analyse und Begründung: `docs/architecture/ENTERPRISE_EVENT_READINESS_REPORT.md`
(vor dieser Komponente erstellt) und
`docs/architecture/ENTERPRISE_EVENT_MESH_READINESS_REPORT.md` (nach dieser Komponente
erstellt).

Diese Komponente ist die **zweite** im Repository mit vollständigem Metadatensatz
einschließlich `component.yaml` und `CHANGELOG.md`, nach `Traceability` (ADR-0015).
