---
skill:
  id: ESS-0013
  name: Enterprise Event Mesh
  version: 1.0.0
  status: Enterprise Approved
  maturity: Gold Standard
  owner: Platform Director
  category: Enterprise Architecture
  priority: High

capital_ai:
  platform: CAPITAL-AI Core
  repository: Finance
  architecture: Enterprise
  lifecycle: AI Native Development Lifecycle

classification:
  type: Technical Specification
  role: Spezifikation der Enterprise Event Mesh — Komponente, nicht Regelwerk
  contractAuthority: ESS-0001-CONTRACTS
  ownContracts: ESS-0013-CONTRACTS
  note: >
    Dieses Dokument beschreibt ausschließlich die Enterprise-Event-Mesh-Komponente
    (Core-Klassen, Registry-Mechanik, Validator-Kette, Report-Typen, Standard-Event-
    Katalog). Das Event- und Messaging-Regelwerk selbst — Namensregel, Contract-
    Pflichtfelder, Producer-/Consumer-Grundregeln, Routing-Prinzip, Validation-Kriterien
    — ist bereits vollständig in ESS-0001-CONTRACTS Chapter 8 normativ definiert und
    wird hier nicht wiederholt.

authority:

  controls:
    - Event Registry
    - Event Routing
    - Event Validation
    - Event Reports

  collaborates:
    - Documentary Engine
    - Enterprise Traceability Matrix
    - Knowledge Graph
    - Compliance Engine
    - Version Manager
    - Supervisor
    - Platform Director
    - Security

  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - fachliche Event-Inhalte anderer Komponenten
    - ESS-0001-CONTRACTS Chapter 8

crossReference:
  dependsOn:
    - ESS-0001-CONTRACTS
  relatedEss:
    - ESS-0001
    - ESS-0010
    - ESS-0011
    - ESS-0011-CONTRACTS
    - ESS-0012
    - ESS-0012-CONTRACTS
    - ESS-0013-CONTRACTS
  relatedAdr:
    - ADR-0010
    - ADR-0013
    - ADR-0014
    - ADR-0015
    - ADR-0018
  relatedComponents:
    - src/platform/EventMesh
    - src/platform/Traceability
    - src/platform/Documentary
    - src/platform/Knowledge
    - src/platform/Registry
  relatedSkills:
    - .ai/skills/ESS-0001-Contracts.md
    - .ai/skills/ESS-0010-Documentary-Engine.md
    - .ai/skills/ESS-0011-Enterprise-Traceability.md
    - .ai/skills/Enterprise-Event-Mesh.md

created: 2026-07-31
---

# Enterprise Event Mesh

## Enterprise Purpose

Dieses Dokument spezifiziert die Enterprise Event Mesh (EEM) des CAPITAL-AI Core als
konkrete Softwarekomponente.

Die Enterprise Event Mesh beantwortet eine einzige Frage lückenlos und maschinell:

> Welche Komponente hat wann welches Event veröffentlicht, wer hat es konsumiert, und
> ist dieser Fluss vertragskonform?

Die Enterprise Event Mesh erzeugt keine fachlichen Events.

Sie erzeugt keine Geschäftslogik.

Sie registriert, validiert, routet und protokolliert ausschließlich Events, die von
Fachkomponenten veröffentlicht werden.

---

## Verhältnis zu ESS-0001-CONTRACTS Chapter 8

**Chapter 8 ist bereits vollständig und bleibt unverändert.** Es definiert normativ:

- das Enterprise-Prinzip (*„Jede relevante Änderung erzeugt ein Event"*)
- die Namensregel (Suffix `Event`)
- sieben Basiskategorien mit Beispielereignissen
- die Pflichtfelder des Event Contract
- die Grundregeln für Producer, Consumer, Routing
- die Integrationsabschnitte für Documentary, Supervisor, Platform Director, Version
  Manager
- die zehnteilige Validation-Checkliste

Dieses Dokument (ESS-0013) beschreibt **ausschließlich**, *woraus* die Komponente
besteht, die Chapter 8 umsetzt — analog zum bereits etablierten Verhältnis zwischen
Chapter 9 (Versionierungsregeln) und ESS-0004 (Version-Manager-Komponente), sowie
zwischen ESS-0011 (Traceability-Spezifikation) und `src/platform/Traceability`
(Implementierungsort).

Bei Konflikt zwischen diesem Dokument und ESS-0001-CONTRACTS Chapter 8 gilt ausnahmslos
Chapter 8.

---

## Architektur

Die Enterprise Event Mesh besteht mindestens aus folgenden Klassen bzw. Modulen, je
Unterverzeichnis von `src/platform/EventMesh/`:

### Core

| Klasse | Verantwortung |
|---|---|
| `EventBus` | zentrale Zustellinstanz; nimmt veröffentlichte Events entgegen |
| `EventDispatcher` | verteilt validierte Events an registrierte Consumer |
| `EventPublisher` | öffentliche Schnittstelle für Producer zur Veröffentlichung |
| `EventSubscriber` | öffentliche Schnittstelle für Consumer zur Registrierung eines Abonnements |
| `EventRouter` | einzige Instanz, die über Zustellwege entscheidet (Chapter 8, *Event Routing*) |

### Contracts

| Typ | Inhalt |
|---|---|
| `EventContract` | Gesamtvertrag eines Events — fasst die folgenden vier Typen zusammen |
| `EventPayload` | ausschließlich fachliche Information, keine Implementierungsdetails (Chapter 8) |
| `EventMetadata` | Name, Event-ID, Timestamp, Source/Target Component, Correlation ID |
| `EventVersion` | Major/Minor/Patch gemäß Chapter 8, *Event Versioning* |
| `EventSchema` | strukturelle Definition des Payloads zur Validierung |

### Registry

| Klasse | Verantwortung |
|---|---|
| `EventRegistry` | zentrale Registrierung aller bekannten Event-Typen |
| `ProducerRegistry` | welche Komponente welches Event veröffentlichen darf |
| `ConsumerRegistry` | welche Komponente welches Event abonniert hat |
| `EventCatalog` | konsolidierte, lesbare Sicht aus allen drei Registries (siehe Abschnitt *Event Registry*) |

### Validators

| Klasse | Prüft |
|---|---|
| `EventContractValidator` | Vollständigkeit der Pflichtfelder aus Chapter 8 |
| `EventSchemaValidator` | Payload gegen `EventSchema` |
| `EventVersionValidator` | Versionsformat und Versionssprung-Regeln |
| `EventCompatibilityValidator` | Breaking-Change-Erkennung zwischen Event-Versionen |

### Reports

| Report | Inhalt |
|---|---|
| `EventFlowReport` | tatsächliche Event-Flüsse Producer → Consumer über einen Zeitraum |
| `EventCoverageReport` | Anteil registrierter Komponenten mit mindestens einem Producer- oder Consumer-Eintrag |
| `EventHealthReport` | Fehlerraten, Zustellverzögerungen, unzustellbare Events |
| `EventDependencyReport` | aus Event-Flüssen abgeleitete effektive Abhängigkeiten zwischen Komponenten |

### Weitere Verzeichnisse

`Discovery/` erkennt automatisch mögliche Producer und Consumer anhand deklarierter
`manifest.json`-Felder (`events.produces`, `events.consumes`) — siehe Abschnitt
*Producer- und Consumer-Erkennung*.

`Policies/` definiert Routing-, Retry- und Kompatibilitätspolicies je Event-Kategorie.

`Interfaces/` stellt `IEventBus`, `IEventPublisher`, `IEventSubscriber`, `IEventRouter`,
`IEventRegistry` bereit — die einzigen zulässigen Zugriffspunkte für Fachkomponenten.

`Models/` enthält die Datenmodelle der Registry- und Katalogeinträge.

`Services/` orchestriert Registrierung, Validierung und Routing als ausführbare
Abfolge.

`Tests/` enthält Vertrags- und Kompatibilitätstests je Event-Kategorie.

---

## Event-Kategorien

Gemäß Anforderung werden mindestens folgende zwölf Kategorien geführt. Sie ordnen sich
den sieben Basiskategorien aus Chapter 8 unter bzw. ergänzen sie um die seither in
Chapter 11–19 hinzugekommenen Bereiche:

| Kategorie | Verhältnis zu Chapter 8 |
|---|---|
| Repository Events | = Chapter 8 *Repository Events* |
| Documentation Events | = Chapter 8 *Documentary Events* |
| Traceability Events | ergänzt Chapter 8 um ESS-0011 (Traceability besaß bereits einen eigenen Katalog, siehe `src/platform/Traceability/manifest.json`) |
| Knowledge Events | = Chapter 8 *Knowledge Events* |
| Compliance Events | Teilmenge von Chapter 8 *Security Events* + Chapter 11 |
| Security Events | Teilmenge von Chapter 8 *Security Events* + Chapter 11 |
| Versioning Events | = Chapter 8 *Version Events* |
| Release Events | Teilmenge von Chapter 8 *Version Events* |
| Supervisor Events | ergänzt Chapter 8 *Platform Events* |
| Platform Director Events | ergänzt Chapter 8 *Platform Events* |
| AI Events | neu — Chapter 10/17 (KI-Entwicklungssysteme, Orchestrierung) besaßen bislang keine eigene Event-Kategorie |
| System Events | neu — technische Meta-Events der Mesh selbst (siehe `manifest.json` → `events.produces`) |

Keine dieser Kategorien ersetzt oder verändert die sieben Basiskategorien aus
Chapter 8. Sie sind eine feingranularere Untergliederung für den Registry-Katalog.

---

## Standard Event Catalog

Die auslösende Anforderung nennt 15 Standardereignisse. Der Abgleich gegen
ESS-0001-CONTRACTS Chapter 8/15/18, ESS-0011 und ESS-0012-CONTRACTS ergab: **12 dieser
Namen sind bereits kanonisch**, **3 kollidierten mit bereits anders benannten,
äquivalenten Events** und wurden auf die bestehende kanonische Bezeichnung
abgebildet, um keine Duplikate zu erzeugen (verbindlich aus *Zero Duplication*,
ESS-0001).

| # | In der Anforderung genannt | Kanonischer Name im Katalog | Quelle | Kategorie | Producer |
|---|---|---|---|---|---|
| 1 | `RepositoryScannedEvent` | *unverändert* | Chapter 8 | Repository | Discovery |
| 2 | `DocumentationGeneratedEvent` | *unverändert* | Chapter 8 | Documentation | Documentary |
| 3 | `DocumentationValidatedEvent` | *unverändert* | Chapter 8, ESS-0012-CONTRACTS | Documentation | Documentary / Governance Validator |
| 4 | `TraceabilityUpdatedEvent` | **`TraceabilityBuildCompletedEvent`** | ESS-0011 (`Traceability/manifest.json`) | Traceability | Traceability |
| 5 | `KnowledgeGraphUpdatedEvent` | **`KnowledgeUpdatedEvent`** | Chapter 8, Chapter 15 | Knowledge | Knowledge Graph |
| 6 | `ComplianceValidatedEvent` | *unverändert* | Chapter 8 | Compliance | Compliance Engine |
| 7 | `ArchitectureValidatedEvent` | *unverändert* | Chapter 8 | Compliance | Compliance Engine |
| 8 | `VersionCalculatedEvent` | *unverändert* | Chapter 8 | Versioning | Version Manager |
| 9 | `ReleasePreparedEvent` | *unverändert* | Chapter 8 | Release | Version Manager |
| 10 | `ReleasePublishedEvent` | *unverändert* | Chapter 8 | Release | Version Manager |
| 11 | `SupervisorAlertEvent` | *unverändert* | Chapter 8 | Supervisor | Supervisor |
| 12 | `PlatformDecisionEvent` | *unverändert* | Chapter 8 | Platform Director | Platform Director |
| 13 | `SecurityViolationDetectedEvent` | *unverändert* | Chapter 11 | Security | Security |
| 14 | `GovernanceViolationDetectedEvent` | *unverändert* | ESS-0012-CONTRACTS | Documentation | Governance Validator |
| 15 | `DigitalTwinUpdatedEvent` | **`TwinSynchronizedEvent`** | Chapter 18, *Twin Events* | System | Digital Twin |

**Weitere in der Anforderung an anderer Stelle genannte Events**, ebenfalls
abgeglichen:

| Genannt | Befund |
|---|---|
| `ContractViolationDetectedEvent` | bereits kanonisch als `ContractViolationEvent` (Chapter 8, *Architecture Events*) — keine neue Variante eingeführt |
| `LayerViolationDetectedEvent` | bereits kanonisch als `LayerViolationEvent` (Chapter 8, *Architecture Events*) |
| `TraceabilityViolationEvent` | bereits kanonisch (ESS-0012-CONTRACTS, Governance-Validator-Events) |
| `VersionApprovedEvent` | neu — kein kanonisches Äquivalent gefunden; als neue Registrierung aufgenommen |
| `RoadmapUpdatedEvent` | neu — kein kanonisches Äquivalent gefunden; als neue Registrierung aufgenommen |
| `ArchitectureDecisionApprovedEvent` | neu — kein kanonisches Äquivalent gefunden; als neue Registrierung aufgenommen |
| `CriticalArchitectureViolationEvent` | neu — kein kanonisches Äquivalent gefunden; als neue Registrierung aufgenommen |
| `DependencyMappedEvent` | neu — kein kanonisches Äquivalent gefunden; als neue Registrierung aufgenommen |
| `KnowledgeRelationCreatedEvent` | neu — kein kanonisches Äquivalent gefunden; als neue Registrierung aufgenommen |
| `KnowledgeValidationCompletedEvent` | neu — kein kanonisches Äquivalent gefunden; als neue Registrierung aufgenommen |

Die vier bereits mit Producer/Consumer benannten Traceability-Events
(`TraceabilityBuildStartedEvent`, `TraceabilityBuildFailedEvent`,
`CoverageCalculatedEvent`, `CoverageThresholdViolatedEvent`, `OrphanDetectedEvent`,
`OrphanResolvedEvent`, `TraceabilityReportGeneratedEvent`) sind unverändert Teil des
Katalogs und werden nicht erneut definiert (Quelle: `Traceability/manifest.json`).

Der vollständige, laufend erweiterte Katalog wird durch `EventRegistry` /
`EventCatalog` geführt, nicht durch dieses Dokument — dieses Dokument definiert den
**Ausgangsbestand**.

---

## Event Contracts

Jedes Event besitzt — wie in Chapter 8 verbindlich vorgegeben — mindestens:

Event Name · Event ID · Version · Timestamp · Source Component · Target Component ·
Correlation ID · Payload · ESS-Referenzen · ADR-Referenzen

Ergänzend führt jedes über die Enterprise Event Mesh registrierte Event zusätzlich:

**ETM-Referenzen** — die Traceability-Achse „Event" (siehe ESS-0011, *Traceability-
Achsen*) verlangt, dass jedes Event auf mindestens ein Interface und mindestens eine
Komponente rückverfolgbar ist. Ohne diese Referenz wird ein Event von
`EventContractValidator` als unvollständig zurückgewiesen.

Alle Events sind versioniert nach Chapter 8, *Event Versioning*.

---

## Event Routing

Routing erfolgt ausschließlich über `EventRouter`. Es gibt keinen zweiten Zustellweg.

Direkte Engine-zu-Engine-Kommunikation soll langfristig vollständig durch registrierte
Events ersetzt werden — bereits bestehender Code (`server/systemEvents.ts`, Frontend-
`CustomEvent`-Nutzung) ist davon **nicht betroffen** (siehe
`docs/architecture/ENTERPRISE_EVENT_READINESS_REPORT.md` Abschnitt 3.2); die Regel gilt
für künftige Implementierungen unter `src/platform/`.

---

## Producer- und Consumer-Erkennung

`Discovery/` identifiziert mögliche Producer und Consumer **automatisch** anhand der
`events.produces`- bzw. `events.consumes`-Felder in `manifest.json` jeder Komponente
unter `src/platform/`. Aktueller Bestand (siehe
`docs/architecture/ENTERPRISE_EVENT_READINESS_REPORT.md` Abschnitt 3–4):

### Mögliche Producer

Documentary Engine · Traceability Engine · Knowledge Graph · Compliance Engine ·
Version Manager · Supervisor · Platform Director · Security · Repository Discovery

### Mögliche Consumer

Documentary · Knowledge Graph · Traceability · Version Manager · Supervisor ·
Platform Director · Compliance · Security · Release

**Befund:** Von diesen neun potenziellen Producern führt aktuell nur `Traceability`
tatsächlich befüllte `events`-Felder. Die übrigen acht führen `events: []`. Dies ist
kein Mangel der Enterprise Event Mesh, sondern ein offener Punkt der jeweils
eigenständigen Fachkomponenten — siehe Folgeentscheidungen in ADR-0018.

---

## Komponenten-Integration (Sollzustand gemäß Chapter 8, hier konkretisiert)

### Documentary Engine

Veröffentlicht mindestens: `DocumentationGeneratedEvent`, `DocumentationValidatedEvent`,
`TwinSynchronizedEvent`.

**Präzisierung gegenüber der Erstfassung (Folgeentscheidung 2, ADR-0018):** Die
Manifest-Nachpflege ordnet `RepositoryScannedEvent` stattdessen `src/platform/Discovery`
als tatsächlichem Producer zu — Discovery führt den technischen Scan aus, Documentary
**konsumiert** `RepositoryScannedEvent` und löst darauf die Dokumentationserzeugung aus
(konsistent mit Chapter 8, *Documentary Integration*: „Die Documentary Engine reagiert
automatisch auf RepositoryScannedEvent"). Kein Widerspruch zur auslösenden Anforderung,
die Documentary lediglich als eine der veröffentlichenden Instanzen nannte — die
Detailzuordnung erfolgt hier erstmals granular.

### Enterprise Traceability Matrix

Veröffentlicht: die bereits in `Traceability/manifest.json` benannten acht Events,
insbesondere `TraceabilityBuildCompletedEvent` (deckt den in der Anforderung genannten
Zweck von „TraceabilityUpdatedEvent" ab) sowie `TraceabilityViolationEvent`
(ESS-0012-CONTRACTS, produziert vom Governance Validator, nicht von der ETM selbst).

### Knowledge Graph

Veröffentlicht: `KnowledgeUpdatedEvent`, `KnowledgeRelationCreatedEvent` (neu),
`KnowledgeValidationCompletedEvent` (neu).

### Enterprise Architecture Compliance Engine

Veröffentlicht: `ArchitectureValidatedEvent`, `ComplianceValidatedEvent`,
`LayerViolationEvent`, `ContractViolationEvent` (beide bereits kanonisch, siehe
Standard Event Catalog).

### Version Manager

Veröffentlicht: `VersionCalculatedEvent`, `VersionApprovedEvent` (neu),
`ReleasePreparedEvent`, `ReleasePublishedEvent`.

### Supervisor

Veröffentlicht: `SupervisorAlertEvent`, `GovernanceViolationDetectedEvent` (produziert
vom Governance Validator, vom Supervisor konsumiert und bei Bedarf eskaliert),
`CriticalArchitectureViolationEvent` (neu).

### Platform Director

Veröffentlicht: `PlatformDecisionEvent`, `RoadmapUpdatedEvent` (neu),
`ArchitectureDecisionApprovedEvent` (neu).

---

## Event Registry

`EventRegistry` führt je Event mindestens: Name, Kategorie, Version, Producer,
Consumer, ESS-Referenz, ADR-Referenz, ETM-Referenz, Status
(`proposed` / `registered` / `deprecated`).

Jedes Event wird bei Veröffentlichung automatisch registriert — eine manuelle
Nachpflege der Registry ist nicht vorgesehen und widerspräche dem Prinzip, dass die
Registry ausschließlich generiert wird (analog zur ETM-Regel aus ESS-0011).

---

## Enterprise Traceability Matrix — Integration

Die Enterprise Event Mesh liefert die **Event-Achse** der bereits in ESS-0011
definierten sieben Traceability-Achsen (`ESS · ADR · Exception · Component ·
Interface · Event · Test`). Sie erzeugt selbst keine neue Achse und keine neue
Verknüpfungsart — sie befüllt die bestehende Achse „Event" mit Daten.

Die in der Anforderung beschriebene Kette

```text
ESS → ADR → Event → Producer → Consumer → Komponente → Release → Version
```

ist eine Spezialisierung der bereits in ESS-0011 definierten Vorwärtskette
(`ESS-Kapitel → ADR → Component → Interface → Event → Test`) für den Blickwinkel
„ausgehend vom Event". Beide Ketten sind konsistent: Producer und Consumer sind
Komponenten im Sinne von ESS-0011, Release und Version sind die dort bereits
vorgesehenen Endpunkte der Versionierungs-Traceability (ESS-0004).

---

## Knowledge Graph — Integration

Jedes registrierte Event wird gemäß ESS-0009 automatisch Teil des Knowledge Graph als
Knoten mit Kanten zu Producer- und Consumer-Komponenten. Diese Regel ist keine neue
Regel dieses Dokuments, sondern eine Anwendung der bereits in ESS-0009 definierten
Graph-Aufbauregeln auf die neue Datenquelle „Event Registry".

---

## Digital Twin — Integration

Jedes Event aktualisiert den Digital Twin gemäß der bereits in
ESS-0001-CONTRACTS Chapter 18 definierten `TwinSynchronizedEvent`-Kette. Dieses
Dokument führt hierfür **kein** neues Event ein — `DigitalTwinUpdatedEvent` aus der
auslösenden Anforderung ist durch `TwinSynchronizedEvent` bereits abgedeckt (siehe
Standard Event Catalog).

---

## AI Integration

Google AI Studio, Claude Code und ChatGPT müssen, sobald die Enterprise Event Mesh
implementiert ist, dieselbe Mesh verwenden. Neue Komponenten dürfen ausschließlich über
registrierte Enterprise Events kommunizieren — konkretisiert die bereits in Chapter 10
und Chapter 17 definierte KI-Governance für den Kommunikationskanal.

---

## Validation

Vor jeder Integration eines Events wird geprüft (Erweiterung der zehnteiligen
Chapter-8-Checkliste um ETM-Bezug):

✓ ESS kompatibel — Chapter 8 sowie ggf. domänenspezifisches Kapitel

✓ ADR kompatibel — ADR-0018 sowie ggf. domänenspezifischer ADR

✓ ETM integriert — Event-Achse befüllt

✓ Documentary integriert — Event wird dokumentiert

✓ Knowledge Graph integriert — Event wird zum Graph-Knoten

✓ Version Manager integriert — Breaking-Change-Bewertung möglich

✓ Supervisor integriert — Event-Fluss überwachbar

✓ Platform Director integriert — Event-Governance anwendbar

✓ Compliance Engine integriert — Event unterliegt Sicherheitsregeln aus Chapter 11

✓ Enterprise Contracts erfüllt — alle Pflichtfelder aus Chapter 8 vorhanden

---

## Implementierungsstand

Diese Komponente ist **implementiert (Stufe 1–4)** — als erste Komponente im gesamten
`src/platform/`-Baum mit ausführbarem Code (ADR-0018, Folgeentscheidung 1, 2026-07-31).

| Stufe | Voraussetzung | Zustand |
|---|---|---|
| 1 | JSON-Schemata für Event Contract | ✅ erledigt |
| 2 | Core, Interfaces, Models, Registry | ✅ erledigt |
| 3 | Enterprise Event Bus (Routing) | ✅ erledigt |
| 4 | Validator-Kette | ✅ erledigt |

`Discovery/ManifestDiscovery.ts` fand zur Laufzeit 23 Komponenten unter
`src/platform/` (mehr als die neun in der Vorab-Analyse identifizierten). Sieben
Vertrags- und Kompatibilitätstests (`Tests/eventBus.test.ts`) bestehen.

Unverändert gültig bleibt: Ohne Knowledge Graph und Digital Twin (Stufe 5) kann kein
Event vollständig gemäß der Validation-Checkliste (ETM-Referenz, Knowledge-Graph-
Verknüpfung) durchlaufen — die Implementierung deckt den Zustellmechanismus ab, nicht
die vorgelagerten Datenquellen. Dieselbe Abhängigkeitskette ist bereits für die ETM in
ESS-0011 dokumentiert.

---

## Notes

Vollständige Analyse: `docs/architecture/ENTERPRISE_EVENT_READINESS_REPORT.md` (vor
dieser Spezifikation erstellt) und
`docs/architecture/ENTERPRISE_EVENT_MESH_READINESS_REPORT.md` (danach erstellt).

Operativer KI-Skill: `.ai/skills/Enterprise-Event-Mesh.md`.
