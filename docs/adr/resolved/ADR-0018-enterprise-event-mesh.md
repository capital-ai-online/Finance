# ADR-0018: Einführung der Enterprise Event Mesh als Plattformmodul

## Status

**Accepted**

## Implementation-Status

✅ **COMPLETE** (verifiziert 2026-07-31) — Komponentenstruktur, vollständiger
Metadatensatz, Spezifikation (ESS-0013/ESS-0013-CONTRACTS) und alle vier vom Platform
Director freigegebenen Folgeentscheidungen sind umgesetzt:

1. Implementierung Stufe 1–4 (`src/platform/EventMesh/{Contracts,Interfaces,Models,
   Registry,Core,Validators,Reports,Policies,Discovery,Services,Events,Tests}/`) —
   erste Komponente im gesamten `src/platform/`-Baum mit ausführbarem Code.
2. Manifest-Nachpflege in 12 Komponenten (`events.produces`/`events.consumes`
   befüllt, Documentary-Manifest korrigiert).
3. `server/systemEvents.ts` additiv auf die Enterprise Event Mesh erweitert (bestehender
   Audit-Log-Mechanismus vollständig erhalten).
4. 7 neu identifizierte Events registriert.

Verifiziert: `npx tsx src/platform/EventMesh/Tests/eventBus.test.ts` (7/7 bestanden),
`npx tsc --noEmit` unverändert 9 vorbestehende Fehler (keine neuen), `npx vite build`
erfolgreich.

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

Die Erstentscheidung änderte bestehenden Produktivcode noch nicht. Die später vom Platform
Director freigegebene Folgeentscheidung erweiterte `server/systemEvents.ts` ausschließlich
additiv: der bestehende Audit-Log-Mechanismus blieb erhalten, während zusätzlich ein
Enterprise Event publiziert wird.

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
Verworfen. Die spätere Integration wurde additiv umgesetzt; der bestehende Audit-Log blieb
bestehen.

---

## Konsequenzen

### Positiv

- Die Enterprise Event Mesh besitzt einen eindeutigen Ort, eine definierte Klassenstruktur
  und einen vollständigen Standard-Event-Ausgangskatalog.
- Potenzielle Event-Namen-Duplikate wurden vor ihrer Entstehung erkannt und aufgelöst.
- Chapter 8 bleibt vollständig unverändert; keine Doppelregelung entstand.
- Event Bus, Registry, Validatoren, Reports, Discovery und additive System-Audit-Bridge sind
  real implementiert und getestet.

### Negativ / Aufwand

- Der in-memory Bus teilt seinen Zustand nicht automatisch zwischen mehreren Prozessinstanzen;
  dieser Betriebsaspekt bleibt bei horizontaler Skalierung gesondert zu behandeln.
- Events dürfen weiterhin nur dann publiziert werden, wenn ein realer Producer und ein realer
  Zustandsübergang existieren.

### Neutral

- Kein bestehender kanonischer Event-Name wurde umbenannt.
- EventMesh ersetzt keine fachlichen Audit-, Security- oder Business-Datenbanken.

---

## Folgeentscheidungen

Alle vier wurden am 2026-07-31 vom Platform Director zur Ausführung freigegeben und
sind umgesetzt:

1. ✅ **Implementierung der Stufen 1 bis 4** — `src/platform/EventMesh/`.
2. ✅ **Nachpflege der `events`-Felder** in den betroffenen Plattformkomponenten.
3. ✅ **`server/systemEvents.ts` additiv erweitert** — bestehender Audit-Log-Mechanismus
   erhalten, EventMesh-Publikation ergänzt.
4. ✅ **7 neu identifizierte Events registriert** (`VersionApprovedEvent`,
   `RoadmapUpdatedEvent`, `ArchitectureDecisionApprovedEvent`,
   `CriticalArchitectureViolationEvent`, `DependencyMappedEvent`,
   `KnowledgeRelationCreatedEvent`, `KnowledgeValidationCompletedEvent`).

Details und Testergebnisse:
`docs/architecture/ENTERPRISE_EVENT_MESH_READINESS_REPORT.md`.

---

## Referenzen

- ESS-0001-CONTRACTS Chapter 8 — Enterprise Event & Messaging Contracts
- ESS-0013 — Enterprise Event Mesh
- ESS-0013-CONTRACTS — Event-Katalog-, Kompatibilitäts-, Registry-, Routing-,
  Discovery-, Policy- und Report-Contracts
- ESS-0011 — Enterprise Traceability
- ESS-0012-CONTRACTS — Governance-Validator-Events
- ADR-0013 — ESS Documentation Responsibility Consolidation
- ADR-0014 — Documentation Governance Validator
- ADR-0015 — Enterprise Traceability Component
- ADR-0016 — Vergabe ESS-0004 bis ESS-0009
- `docs/architecture/ENTERPRISE_EVENT_READINESS_REPORT.md`
- `docs/architecture/ENTERPRISE_EVENT_MESH_READINESS_REPORT.md`
- `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md`
- `.ai/registry/ess-registry.json`
