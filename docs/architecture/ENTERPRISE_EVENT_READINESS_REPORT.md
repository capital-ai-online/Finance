# Enterprise Event Readiness Report

## Document ID

ARCH-EVENT-READY-0001

## Version

1.0.0

## Status

Analyse — vor jeglicher Code-Erzeugung erstellt, wie in der auslösenden Anforderung
gefordert

## Datum

2026-07-31

## Erstellt für

CAPITAL-AI Enterprise Event Mesh (EEM) — Vorbereitung von ADR-0018 und ESS-0013

## Analysierte Quellen

`docs/ess/` (existiert nicht — siehe Befund R-1), `docs/adr/`, `docs/traceability/`,
`docs/architecture/`, `src/platform/`, `.ai/skills/`, ergänzend `server/systemEvents.ts`
und die `CustomEvent`-Nutzung im Frontend, da beide die einzige real existierende
Event-ähnliche Kopplung der Plattform sind.

---

# 1. Ausgangslage — bereits normativ spezifiziert

**Zentraler Befund vor allen anderen:** Die Enterprise Event Mesh ist **kein neues
Konzept**. ESS-0001-CONTRACTS Chapter 8 („Enterprise Event & Messaging Contracts")
definiert sie bereits vollständig normativ — inklusive des Namens „Enterprise Event
Mesh" selbst:

> „Das Enterprise Event Mesh bildet die zentrale Kommunikationsschicht zwischen allen
> Komponenten." (Chapter 8, Enterprise Purpose)

Chapter 8 legt bereits verbindlich fest:

| Bereich | Inhalt |
|---|---|
| Event-Namensregel | Suffix `Event` |
| 7 Event-Kategorien | Repository, Documentary, Knowledge, Version, Architecture, Security, Platform |
| Event Contract | Name, Version, Timestamp, Source/Target Component, Correlation ID, Event Type, Payload, Schema Version, ESS-/ADR-Referenzen |
| Event Registry | Name, Version, Beschreibung, Producer, Consumer, Payload Schema, ESS-/ADR-Referenzen |
| Producer-/Consumer-Regeln | jede Komponente darf publizieren; Konsum ausschließlich über dokumentierte Events |
| Routing | zentral durch das Event Mesh, nicht durch die Komponenten |
| Documentary-/Supervisor-/Platform-Director-/Version-Manager-Integration | je ein eigener Abschnitt |
| Validation-Checkliste | 10 Kriterien |

`docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` führt zusätzlich bereits
**Stufe 3 — Enterprise Event Bus** als eigene Umsetzungsstufe mit `IEventBus` (Chapter 8)
als Kernschnittstelle und hält fest, dass Chapter 8, 11 bis 19 zusammen **über 80
verbindliche Enterprise Events** definieren.

**Konsequenz für diesen Auftrag:** Es wird kein neues Regelwerk benötigt und keines
erzeugt. Es fehlt — exakt wie zuvor bei ESS-0004 bis ESS-0009 (ADR-0016) — die
**Komponentenspezifikation**, die beschreibt, *woraus* die Enterprise Event Mesh als
Software-Komponente besteht (Core-Klassen, Contracts-Typen, Registry-Mechanik,
Validator-Klassen, Report-Typen), sowie der **Ort ihrer Umsetzung** unter
`src/platform/`. Chapter 8 legt fest, *dass* und *wie* Events fließen; es beschreibt
nicht, *woraus* die Mesh-Komponente selbst besteht — dieselbe Abgrenzung, die ADR-0015
für die Traceability Matrix bereits etabliert hat.

---

# 2. Befund R-1 — `docs/ess/` existiert nicht

Die Anforderung nennt `docs/ess/` als zu analysierenden Pfad. Dieses Verzeichnis
existiert nicht. Die ESS-Dokumente liegen — seit ADR-0013 verbindlich — unter
`.ai/skills/` (Registry: `.ai/registry/ess-registry.json`). Dieser Bericht analysiert
daher `.ai/skills/` anstelle des nicht existierenden Pfads.

---

# 3. Bestehende Events — Bestandsaufnahme

## 3.1 Spezifizierte Events (ohne Implementierung)

| Quelle | Anzahl (Größenordnung) | Status |
|---|---|---|
| ESS-0001-CONTRACTS Chapter 8, 11–19 | > 80 (laut REPOSITORY_STRUCTURE_ANALYSIS.md) | spezifiziert, nicht implementiert |
| `src/platform/Traceability/manifest.json` | 8 produzierte, 5 konsumierte | spezifiziert, nicht implementiert |
| `src/platform/PlatformDirector/manifest.json` | 0 (`events: []`) | leer |
| `src/platform/Supervisor/manifest.json` | 0 (`events: []`) | leer |
| `src/platform/VersionManager/manifest.json` | 0 (`events: []`) | leer |
| `src/platform/Security/manifest.json` | 0 (`events: []`) | leer |
| `src/platform/Quality/manifest.json` | 0 (`events: []`) | leer |
| `src/platform/Release/manifest.json` | 0 (`events: []`) | leer |

**Befund R-2:** Sechs von sieben bereits angelegten Plattformkomponenten führen das
Feld `events` in ihrem `manifest.json`, aber leer. Nur `Traceability` (ADR-0015, als
„Referenzimplementierung des Metadata Contracts" angelegt) hat produzierte und
konsumierte Events tatsächlich benannt. Dies ist keine Aufgabe der Enterprise Event
Mesh selbst — jede Komponente bleibt Eigentümerin ihrer eigenen Event-Liste —, aber ein
Befund, den die Enterprise Event Mesh in ihrem Registry-Katalog sichtbar machen kann,
ohne die fremden `manifest.json`-Dateien selbst zu verändern.

## 3.2 Real existierende Kopplungsmechanismen (Laufzeitcode, außerhalb `src/platform/`)

Zur Einordnung, wovon sich die Enterprise Event Mesh bewusst abgrenzt:

**`server/systemEvents.ts` — `logSystemEvent()`.** Eine einfache, dateibasierte
Audit-Log-Funktion (`SystemEvent` mit `type: 'AUTH' | 'SUBSCRIPTION' | 'CREDITS' |
'ORCHESTRATOR' | 'MARKET_DATA' | 'SECURITY'`). Wird direkt importiert und aufgerufen von
`decisionEngine.ts`, `documentHygiene.ts`, `versionManager.ts` — **elf** direkte
Importabhängigkeiten. Kein Pub/Sub, kein Routing, kein Contract, keine Producer-/
Consumer-Trennung, keine Versionierung. Dies ist die genaue Gegenprobe zu Chapter 8:
direkte Engine-zu-Engine-Abhängigkeit statt Event-Vermittlung.

**Frontend `window.dispatchEvent(new CustomEvent(...))`.** Sechs Fundstellen
(`PriceAlert.tsx`, `Charts.tsx`, `CryptoScoringEnterprise.tsx`, `alertStore.ts`,
`authFetch.ts` — `'auth:unauthorized'`, `dailyScreeningTracker.ts` —
`'dailyScreeningUpdated'`). Ausschließlich lokale Browser-Events innerhalb einzelner
Komponenten, keine plattformweite Wirkung, kein Contract, keine Registrierung.

**Einordnung:** Beide Mechanismen sind funktionsfähiger Produktivcode außerhalb von
`src/platform/` und **nicht Gegenstand dieser Erweiterung**. Die Enterprise Event Mesh
entsteht — wie alle bisherigen Komponenten unter `src/platform/` — als spezifizierte
Architekturkomponente der Plattformebene, nicht als Ersatz für den bestehenden,
funktionierenden Audit-Log-Mechanismus in `server.ts`/`server/systemEvents.ts`. Eine
Migration dieses Mechanismus auf die Enterprise Event Mesh wäre eine eigene,
hier nicht angeforderte Entscheidung mit Produktivcode-Auswirkung.

---

# 4. Mögliche Event Producer (identifiziert)

| Komponente | Ort | Aktueller Stand | Eignung als Producer |
|---|---|---|---|
| Documentary Engine | `src/platform/Documentary/` | spezifiziert (ESS-0010), nicht implementiert | hoch — Chapter 8 nennt sie explizit |
| Traceability (ETM) | `src/platform/Traceability/` | spezifiziert (ESS-0011), 8 Events bereits benannt | hoch — einzige Komponente mit vorhandenem Event-Katalog |
| Knowledge Graph | `src/platform/Knowledge/` | spezifiziert (ESS-0009), `events: []` | hoch — Chapter 15 referenziert |
| Compliance Engine | `src/platform/Compliance/` | spezifiziert (ESS-0006), `events: []` | hoch — Chapter 11 referenziert |
| Version Manager | `src/platform/VersionManager/` | spezifiziert (ESS-0004), `events: []` | hoch — Chapter 9 referenziert |
| Supervisor | `src/platform/Supervisor/` | spezifiziert (ESS-0002), `events: []` | hoch — Chapter 8 nennt sie explizit |
| Platform Director | `src/platform/PlatformDirector/` | spezifiziert (ESS-0003), `events: []` | hoch — Chapter 8 nennt sie explizit |
| Security | `src/platform/Security/` | spezifiziert (ESS-0006), `events: []` | hoch |
| Repository Discovery | `src/platform/Discovery/` | spezifiziert, `events: []` | mittel — Quelle für `RepositoryScannedEvent` |

## Mögliche Event Consumer

| Komponente | Konsumbedarf |
|---|---|
| Documentary | reagiert auf Repository-/Versions-/Release-/Contract-Events (Chapter 8, Documentary Integration) |
| Knowledge Graph | konsumiert Dokumentations- und Validierungsereignisse zur Graph-Erweiterung |
| Traceability | konsumiert `KnowledgeUpdatedEvent`, `TwinSynchronizedEvent`, `ComponentRegisteredEvent`, `ExceptionRegisteredEvent`, `ReleasePreparedEvent` (bereits in `manifest.json` benannt) |
| Version Manager | konsumiert Breaking-/Interface-/Release-/Migration-Events zur Versionsableitung |
| Supervisor | konsumiert alle Events zur Fluss-/Fehler-/Musterüberwachung |
| Platform Director | konsumiert Governance- und Architekturentscheidungs-relevante Events |
| Compliance | konsumiert Security-/Architektur-Validierungsevents |
| Security | konsumiert Zugriffs- und Verstoßevents |
| Release | konsumiert Versions- und Freigabeevents |

---

# 5. Aktuelle Kopplungen — Bewertung

| Kopplungsart | Vorkommen | Bewertung |
|---|---|---|
| Direkte Funktionsimporte zwischen Server-Modulen (`logSystemEvent`) | 11 Aufrufstellen in 3 Dateien | außerhalb Scope, siehe Abschnitt 3.2 |
| Direkte Importabhängigkeiten zwischen `src/platform/`-Komponenten | keine — da keine Komponente Code enthält | derzeit **keine** Kopplung, weil nichts implementiert ist |
| Lose Kopplung über Enterprise Events | 0 | vollständig offen |

**Befund R-3:** Weil bislang **keine** `src/platform/`-Komponente über ausführbaren
Code verfügt (0 `.ts`-Dateien im gesamten Baum, verifiziert), existiert auf dieser
Ebene aktuell auch **keine schädliche Kopplung, die aufgelöst werden müsste**. Die
Enterprise Event Mesh wird nicht als Refactoring bestehender Kopplungen eingeführt,
sondern als **vorausschauende Architekturentscheidung**, die künftige Implementierungen
von Anfang an entkoppelt hält — exakt die in der Anforderung beschriebene Zielsetzung
„Direkte Abhängigkeiten zwischen Engines sind langfristig zu vermeiden".

---

# 6. Ergebnis dieser Analyse

| Frage | Antwort |
|---|---|
| Ist ein neues Regelwerk (neuer Contract-Chapter) erforderlich? | **Nein.** Chapter 8 sowie 11–19 sind bereits vollständig. |
| Ist eine neue ESS-Komponentenspezifikation erforderlich? | **Ja**, unter der nächsten freien Nummer **ESS-0013** (nicht ESS-0014 — siehe Abschnitt 7). Analog ESS-0004 bis ESS-0009 und ESS-0011. |
| Ist ein neuer ADR erforderlich? | **Ja**, unter der nächsten freien Nummer **ADR-0018** (nicht ADR-0013 — bereits durch „ESS Documentation Responsibility Consolidation" vergeben). |
| Ist eine neue Komponente unter `src/platform/` erforderlich? | **Ja** — `src/platform/EventMesh/`, analog Traceability. |
| Muss bestehender Code geändert werden? | **Nein.** `server/systemEvents.ts` und die Frontend-`CustomEvent`-Nutzung bleiben unverändert (siehe Abschnitt 3.2). |
| Ist ein neuer Skill erforderlich? | **Ja** — `.ai/skills/Enterprise-Event-Mesh.md`, analog `Documentation-Governance-Validator.md` (operativer KI-Skill, keine ESS-Nummer). |

---

# 7. Korrektur der in der Anforderung genannten Nummern

Die Anforderung schlägt „ESS-0014" und „ADR-0013" vor. Beide Nummern sind nach Prüfung
der verbindlichen Register **nicht korrekt**:

| Vorschlag | Prüfung | Korrekte Nummer |
|---|---|---|
| ESS-0014 | `.ai/registry/ess-registry.json` → `freeNumberSpaceStartsAt: "ESS-0013"`. Register-Regel: „Zwischennummern sind nicht zulässig." | **ESS-0013** |
| ADR-0013 | `docs/adr/ADR-0013-ess-documentation-responsibility-consolidation.md` existiert bereits (ADR-0013, angelegt am 2026-07-31). Höchste vergebene Nummer ist ADR-0017. | **ADR-0018** |

Dies entspricht der bereits in dieser Session etablierten Praxis (siehe ADR-0013,
Abschnitt „Nummernaufloesung" für die externe ADR-0012-Integration): Vorgeschlagene
Nummern werden gegen die Register geprüft, nicht ungeprüft übernommen.

---

# 8. Nächste Schritte (in dieser Anforderung umgesetzt)

1. `src/platform/EventMesh/` — vollständige Verzeichnisstruktur, `README.md`,
   `manifest.json`, `component.yaml`, `CHANGELOG.md`.
2. `.ai/skills/ESS-0013-Enterprise-Event-Mesh.md` — Komponentenspezifikation.
3. `.ai/skills/ESS-0013-Contracts.md` — Vertragsteil, ausschließlich EventMesh-interne
   Regeln ohne Wiederholung von Chapter 8.
4. `docs/adr/ADR-0018-enterprise-event-mesh.md`.
5. `.ai/skills/Enterprise-Event-Mesh.md` — operativer KI-Skill.
6. `.ai/registry/ess-registry.json` — Eintrag ESS-0013, `freeNumberSpaceStartsAt` auf
   ESS-0014 fortschreiben.
7. `docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` — Erweiterung.
8. Abschließend: `docs/architecture/ENTERPRISE_EVENT_MESH_READINESS_REPORT.md`.

---

# End of Document

ARCH-EVENT-READY-0001
