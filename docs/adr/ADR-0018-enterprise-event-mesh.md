# ADR-0018: Einführung der Enterprise Event Mesh als Plattformmodul

## Status

**Accepted**

## Implementation-Status

🟡 **IN PROGRESS** — Komponentenstruktur, vollständiger Metadatensatz und
Spezifikation (ESS-0013/ESS-0013-CONTRACTS) sind angelegt. Die **Implementierung** ist
nicht begonnen und setzt die Umsetzungsstufen 1 bis 3 aus
`docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` voraus.

## Datum

2026-07-31

## Verantwortlich

Platform Director

## Betroffene Artefakte

`src/platform/EventMesh/` (neu, 12 Unterverzeichnisse)

`.ai/skills/ESS-0013-Enterprise-Event-Mesh.md` (neu)

`.ai/skills/ESS-0013-Contracts.md` (neu)

`.ai/skills/Enterprise-Event-Mesh.md` (neu)

`.ai/registry/ess-registry.json` (fortgeschrieben)

`docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` (erweitert)

`docs/architecture/ENTERPRISE_EVENT_READINESS_REPORT.md` (neu, vor dieser Entscheidung erstellt)

`docs/architecture/ENTERPRISE_EVENT_MESH_READINESS_REPORT.md` (neu, nach dieser Entscheidung erstellt)

---

## Kontext

Die auslösende Anforderung forderte die Entwicklung einer neuen Kernkomponente
„Enterprise Event Mesh" unter den vorgeschlagenen Nummern ESS-0014 und ADR-0013.

Die vorab durchgeführte Analyse (`ENTERPRISE_EVENT_READINESS_REPORT.md`) ergab drei
zentrale Befunde:

1. **Beide vorgeschlagenen Nummern waren belegt bzw. falsch.** `ess-registry.json`
   weist `freeNumberSpaceStartsAt: "ESS-0013"` aus; ADR-0013 existiert bereits
   (*ESS Documentation Responsibility Consolidation*). Korrekt sind **ESS-0013** und
   **ADR-0018**.
2. **Die Enterprise Event Mesh ist kein neues Konzept.** ESS-0001-CONTRACTS Chapter 8
   („Enterprise Event & Messaging Contracts") definiert Namen, Architektur-Grundprinzip,
   Event-Kategorien, Contract-Pflichtfelder, Registry-Konzept, Producer-/
   Consumer-Regeln, Routing-Prinzip und eine zehnteilige Validation-Checkliste bereits
   vollständig. `REPOSITORY_STRUCTURE_ANALYSIS.md` führt zusätzlich bereits „Stufe 3 —
   Enterprise Event Bus" mit `IEventBus` als eigene Umsetzungsstufe.
3. **Es fehlt die Komponentenspezifikation und der Implementierungsort** — exakt das
   Muster, das ADR-0016 bereits für ESS-0004 bis ESS-0009 etabliert hat: Chapter X legt
   *die Regel* fest, ESS-000Y legt *die Komponente* fest.

Zusätzlich zeigte der Abgleich der 15 in der Anforderung genannten Standardereignisse
gegen Chapter 8/15/18, ESS-0011 und ESS-0012-CONTRACTS: 12 Namen sind bereits
kanonisch, 3 (`TraceabilityUpdatedEvent`, `KnowledgeGraphUpdatedEvent`,
`DigitalTwinUpdatedEvent`) hätten mit bereits existierenden, bedeutungsgleichen Events
(`TraceabilityBuildCompletedEvent`, `KnowledgeUpdatedEvent`, `TwinSynchronizedEvent`)
kollidiert.

---

## Entscheidung

### 1. Enterprise Event Mesh wird eigenständiges Plattformmodul

```text
src/platform/EventMesh/
  Contracts/  Core/       Discovery/  Events/     Interfaces/ Models/
  Policies/   Registry/   Reports/    Services/   Tests/      Validators/
```

Zwölf Unterverzeichnisse, wie in der Anforderung vorgegeben. Jedes besitzt genau eine
Verantwortung gemäß ESS-0001-CONTRACTS Chapter 3.

### 2. Nummernkorrektur statt ungeprüfter Übernahme

ESS-0013 und ADR-0018 werden vergeben, nicht die in der Anforderung genannten
ESS-0014/ADR-0013. Dies folgt der bereits etablierten Praxis dieser Session (siehe
ADR-0013, Abschnitt zur externen ADR-0012-Integration): Vorgeschlagene Nummern werden
gegen `ess-registry.json` und `docs/adr/` geprüft, nicht ungeprüft übernommen.

### 3. ESS-0013 als Komponentenspezifikation — Chapter 8 bleibt unverändert

ESS-0013 und ESS-0013-CONTRACTS wiederholen **keine** der in Chapter 8 bereits
verbindlichen Regeln. Sie spezifizieren ausschließlich die Komponente: fünf Core-Klassen
(`EventBus`, `EventDispatcher`, `EventPublisher`, `EventSubscriber`, `EventRouter`),
fünf Contract-Typen, vier Registry-Klassen, vier Validator-Klassen, vier Report-Typen —
exakt wie in der Anforderung vorgegeben.

**Begründung, warum trotz Chapter 8 ein eigenes ESS-Dokument gerechtfertigt ist:**
dasselbe Muster wie bei ESS-0004 bis ESS-0009 (ADR-0016) — ein Regelkapitel beschreibt
nicht die Komponente, die es umsetzt. Ohne ESS-0013 gäbe es für die künftige
Implementierung keinen spezifizierten Ort und keine spezifizierte Klassenstruktur.

### 4. Standard-Event-Katalog mit korrigierten Namen statt Duplikaten

Drei der 15 angeforderten Standardereignisse wurden auf bereits bestehende, kanonische
Event-Namen abgebildet statt als neue, bedeutungsgleiche Events eingeführt:

| Angefordert | Verwendet | Quelle |
|---|---|---|
| `TraceabilityUpdatedEvent` | `TraceabilityBuildCompletedEvent` | ESS-0011 (`Traceability/manifest.json`) |
| `KnowledgeGraphUpdatedEvent` | `KnowledgeUpdatedEvent` | Chapter 8, Chapter 15 |
| `DigitalTwinUpdatedEvent` | `TwinSynchronizedEvent` | Chapter 18, *Twin Events* |

Ebenso wurden `ContractViolationDetectedEvent` und `LayerViolationDetectedEvent` (an
anderer Stelle der Anforderung genannt) auf die bereits kanonischen
`ContractViolationEvent` und `LayerViolationEvent` (Chapter 8) abgebildet.

**Begründung:** ESS-0013-CONTRACTS Abschnitt 1 (*Event Catalog Contract*) verbietet
ausdrücklich, ein bereits registriertes Event unter neuem Namen zu duplizieren. Dieselbe
Regel wurde hier auf die eigene Erstbefüllung angewendet.

### 5. Umgekehrte Abhängigkeitsregel

Anders als bei Traceability (die *Zugriff auf* mehrere Komponenten braucht) darf **keine**
Fachkomponente die EventMesh-Implementierung direkt importieren — ausschließlich über
`Interfaces/`. Diese Umkehrung ist notwendig, weil die Mesh sonst selbst zum
Kopplungspunkt würde, den sie auflösen soll.

### 6. Kein Eingriff in bestehenden Produktivcode

`server/systemEvents.ts` (Audit-Log, 11 direkte Importabhängigkeiten) und die
Frontend-`CustomEvent`-Nutzung (6 Fundstellen) bleiben unverändert. Beide sind
funktionierender Code außerhalb von `src/platform/` und nicht Gegenstand dieser
Erweiterung — eine Migration wäre eine eigene, hier nicht angeforderte Entscheidung mit
Produktivauswirkung.

### 7. Vollständiger Metadatensatz als zweite Referenzimplementierung

`README.md`, `manifest.json`, `component.yaml`, `CHANGELOG.md` — nach `Traceability`
(ADR-0015) die zweite Komponente im Repository mit vollständigem Metadatensatz.

---

## Alternativen

**A) Kein neues ESS-Dokument, ausschließlich Implementierung von Chapter 8.**
Verworfen. Ohne Komponentenspezifikation gäbe es keinen definierten Ort und keine
definierte Klassenstruktur für die Umsetzung — derselbe Fall, den ADR-0016 bereits für
sechs andere Komponenten entschieden hat.

**B) Die drei kollidierenden Event-Namen unverändert aus der Anforderung übernehmen.**
Verworfen. Hätte drei Paare bedeutungsgleicher, aber unterschiedlich benannter Events
erzeugt und damit *Zero Duplication* verletzt.

**C) Vorgeschlagene Nummern ESS-0014/ADR-0013 unverändert übernehmen.**
Verworfen. ADR-0013 ist bereits vergeben; ESS-0014 hätte eine Zwischennummer vor der
tatsächlich freien ESS-0013 übersprungen — ausdrücklich durch die Registry-Regel
„Zwischennummern sind nicht zulässig" verboten.

**D) EventMesh als Unterkomponente von Documentary oder Traceability.**
Verworfen. Die Mesh ist Kommunikationsinfrastruktur für **alle** Komponenten,
einschließlich Documentary und Traceability selbst — eine Unterordnung unter eine der
Komponenten, die sie bedient, wäre ein Zirkelbezug.

**E) Bestehende Audit-Log-Funktion (`server/systemEvents.ts`) durch die Mesh ersetzen.**
Verworfen als Teil dieser Entscheidung. Produktivcode-Änderung mit eigenem
Migrationsaufwand, nicht durch die Anforderung gedeckt und nicht ohne gesonderte
Risikoabwägung durchführbar.

---

## Konsequenzen

### Positiv

- Die Enterprise Event Mesh besitzt erstmals einen eindeutigen Ort, eine definierte
  Klassenstruktur und einen vollständigen Standard-Event-Ausgangskatalog.
- Drei potenzielle Event-Namen-Duplikate wurden vor ihrer Entstehung erkannt und
  aufgelöst.
- Zweite Komponente mit vollständigem Metadatensatz — festigt das mit ADR-0015
  begonnene Muster.
- Chapter 8 bleibt vollständig unverändert; keine Doppelregelung entstanden.

### Negativ / Aufwand

- Ein weiteres Plattformmodul ohne Implementierung. Die Zahl der spezifizierten,
  nicht implementierten Komponenten steigt weiter.
- Acht der neun identifizierten potenziellen Producer-Komponenten führen weiterhin
  leere `events`-Felder in ihrem `manifest.json` — ein Befund, den diese Entscheidung
  sichtbar macht, aber nicht selbst behebt (fremde Komponentenverantwortung).
- Die Mesh kann wie die ETM erst nach den vorgelagerten Umsetzungsstufen produktiv
  funktionieren.

### Neutral

- Kein produktiver Code verändert.
- Kein bestehendes ESS- oder ADR-Dokument inhaltlich verändert.
- Kein bestehendes Event umbenannt — ausschließlich neue, kollisionsfreie Registrierung.

---

## Folgeentscheidungen

1. Implementierung der Stufen 1 bis 4 (Schema/Metadata, Core/Contracts, Event Bus,
   Validator-Kette).
2. Nachpflege der `events`-Felder in `PlatformDirector/`, `Supervisor/`,
   `VersionManager/`, `Security/`, `Quality/`, `Release/manifest.json` durch die
   jeweils zuständigen Komponenten-Owner.
3. Migration von `server/systemEvents.ts` auf die Enterprise Event Mesh — eigene,
   gesondert zu entscheidende Folgeentscheidung mit Produktivcode-Auswirkung.
4. Registrierung der acht neu identifizierten Events (`VersionApprovedEvent`,
   `RoadmapUpdatedEvent`, `ArchitectureDecisionApprovedEvent`,
   `CriticalArchitectureViolationEvent`, `DependencyMappedEvent`,
   `KnowledgeRelationCreatedEvent`, `KnowledgeValidationCompletedEvent`) durch die
   jeweils zuständige Fachkomponente, sobald diese implementiert wird.

---

## Referenzen

- ESS-0001-CONTRACTS Chapter 8 — Enterprise Event & Messaging Contracts (Regelwerk,
  unverändert)
- ESS-0013 — Enterprise Event Mesh (Komponentenspezifikation)
- ESS-0013-CONTRACTS — Event-Katalog-, Kompatibilitäts-, Registry-, Routing-,
  Discovery-, Policy- und Report-Contracts
- ESS-0011 — Enterprise Traceability (Event-Achse)
- ESS-0012-CONTRACTS — Governance-Validator-Events
- ADR-0013 — ESS Documentation Responsibility Consolidation
- ADR-0014 — Documentation Governance Validator
- ADR-0015 — Enterprise Traceability Component (Vorbild für Querschnittsmodul-Einordnung)
- ADR-0016 — Vergabe ESS-0004 bis ESS-0009 (Vorbild für Komponente vs. Regelkapitel)
- `docs/architecture/ENTERPRISE_EVENT_READINESS_REPORT.md` — ARCH-EVENT-READY-0001
- `docs/architecture/ENTERPRISE_EVENT_MESH_READINESS_REPORT.md`
- `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` — Umsetzungsstufen
- `.ai/registry/ess-registry.json`
