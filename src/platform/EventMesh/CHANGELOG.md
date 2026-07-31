# Changelog — EventMesh

Alle Änderungen an dieser Komponente werden hier dokumentiert.

Format gemäß ESS-0001-CONTRACTS Chapter 7, *CHANGELOG Contract*: Version, Datum,
Beschreibung, Breaking Changes, Autor.

Die Versionierung folgt ESS-0001-CONTRACTS Chapter 9 (Semantic Versioning).

---

## [1.1.0] — 2026-07-31

### Hinzugefügt

- Ausführbare Implementierung von Stufe 1 bis 4 (ADR-0018, Folgeentscheidung 1) —
  erste Komponente im gesamten `src/platform/`-Baum mit Code:
  - `Contracts/` — `EventVersion`, `EventMetadata`, `EventPayload`, `EventSchema`, `EventContract`
  - `Interfaces/` — `IEventBus`, `IEventPublisher`, `IEventSubscriber`, `IEventRouter`, `IEventRegistry`
  - `Models/` — `EventDeliveryRecord`, `ManifestEventsDeclaration`
  - `Registry/` — `EventRegistry`, `ProducerRegistry`, `ConsumerRegistry`, `EventCatalog`
  - `Core/` — `EventBus`, `EventDispatcher`, `EventPublisher`, `EventSubscriber`, `EventRouter`
  - `Validators/` — `EventContractValidator`, `EventSchemaValidator`, `EventVersionValidator`, `EventCompatibilityValidator`
  - `Reports/` — `EventFlowReport`, `EventCoverageReport`, `EventHealthReport`, `EventDependencyReport`
  - `Policies/RoutingPolicy.ts` — Retry-Policies je Event-Kategorie
  - `Discovery/ManifestDiscovery.ts` — liest `manifest.json` aller Komponenten zur Laufzeit
  - `Services/EventMeshService.ts` — Bootstrap (Katalog-Seed + Discovery)
  - `Events/StandardEventCatalog.ts` — Ausgangsbestand von 36 Events (inkl. `SystemAuditEvent`)
  - `Tests/eventBus.test.ts` — sieben Vertrags- und Kompatibilitätstests, `npx tsx`-ausführbar
- `Services/SystemAuditBridge.ts` (Folgeentscheidung 3): additive Brücke zwischen dem
  bestehenden, produktiven Audit-Log (`server/systemEvents.ts`) und der Enterprise
  Event Mesh. `logSystemEvent()` veröffentlicht zusätzlich ein `SystemAuditEvent` in
  einem eigenen `try/catch` — ein Fehler dort kann niemals den bestehenden
  Datei-Schreibvorgang oder das SSE-Broadcast an das Admin-Portal gefährden. Per
  Rauchtest verifiziert: bestehendes Verhalten unverändert, Event wird zusätzlich
  zugestellt.
- Manifest-Nachpflege (Folgeentscheidung 2/4): `events`-Felder in 12 zuvor leeren
  Komponenten-Manifesten befüllt, 7 neue Events registriert.

### Befund während der Implementierung

`Discovery/ManifestDiscovery.ts` fand zur Laufzeit **23 Komponenten** unter
`src/platform/` — mehr als die neun in der Vorab-Analyse identifizierten. Zusätzlich
gefunden: `Core`, `Contracts`, `Events`, `Interfaces`, `Models`, `Registry`, `Shared`,
`Telemetry`, `Validators`, `Plugins`, `Generators` — bislang nicht einzeln geprüfte
Querschnittsverzeichnisse. Bestätigt den Wert automatisierter Discovery gegenüber
rein manueller Analyse.

Ein echter Fehler wurde durch die Testsuite gefunden und korrigiert: `EventRegistry.
registerProducer()`/`registerConsumer()` legten keinen Katalogeintrag an, wenn das
Event zuvor nicht über `registerEvent()` geseedet worden war — im Widerspruch zu
ESS-0013-CONTRACTS Abschnitt 3 ("Jedes Event wird bei Veröffentlichung automatisch
registriert"). Behoben durch automatisches Anlegen eines minimalen Katalogeintrags.

### Breaking Changes

Keine.

### Autor

Platform Director

---

## [1.0.0] — 2026-07-31

### Hinzugefügt

- Komponentenstruktur mit zwölf Unterverzeichnissen gemäß ADR-0018
  (`Contracts`, `Core`, `Discovery`, `Events`, `Interfaces`, `Models`, `Policies`,
  `Registry`, `Reports`, `Services`, `Tests`, `Validators`)
- `manifest.json` mit vollständigem Metadatensatz nach Chapter 7
- `component.yaml` als menschen- und KI-lesbarer Komponentendeskriptor
- `README.md` mit Verantwortungsabgrenzung, umgekehrter Abhängigkeitsregel und
  Standard-Event-Katalog-Verweis
- Diese Changelog-Datei

### Referenzen

- ESS-0001-CONTRACTS Chapter 8 — Enterprise Event & Messaging Contracts (Regelwerk, unverändert)
- ESS-0013 — Enterprise Event Mesh (Spezifikation)
- ESS-0013-CONTRACTS — Event-Katalog, Kompatibilitäts- und Policy-Regeln
- ADR-0018 — Einführung der Enterprise Event Mesh als Plattformmodul

### Breaking Changes

Keine. Die Komponente wird ergänzend eingeführt und verändert keine bestehende
Komponente, keinen bestehenden Contract und keinen produktiven Code.

### Implementierungsstand

Spezifiziert, nicht implementiert. Es existiert kein ausführbarer Code.

Die Umsetzung entspricht Stufe 3 aus `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md`
(Enterprise Event Bus) und setzt Stufe 1 und 2 (Schema/Metadata Foundation,
Core/Contracts) voraus.

### Autor

Platform Director

---

## Hinweis zur Erstfassung

Diese Komponente ist die **zweite** im Repository mit vollständigem Metadatensatz
(`component.yaml`, `CHANGELOG.md`), nach `src/platform/Traceability/` (ADR-0015), und
folgt demselben Muster.
