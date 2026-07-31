# ESS-0013-CONTRACTS

## Enterprise Event Mesh Contracts

### Version

1.0.0

### Status

Enterprise Specification

---

## Dokumentklassifizierung

Dieses Dokument definiert **ausschließlich** Enterprise-Event-Mesh-Komponenten-Contracts:
Event-Katalog-Pflege, Kompatibilitätsprüfung, Registry-Konsistenz, Routing-Garantien,
Discovery-Regeln und Report-Inhalte.

Es ist kein globaler Enterprise Standard.

Nicht zulässig sind in diesem Dokument

globale Event-Namensregeln (bleiben in ESS-0001-CONTRACTS Chapter 8)

globale Repository Contracts

globale Layer Contracts

allgemeine Governance-Regeln (bleiben in ESS-0012-CONTRACTS)

Diese verbleiben ausnahmslos in ihrem jeweils zuständigen Dokument.

Bei Konflikt zwischen diesem Dokument und ESS-0001-CONTRACTS gilt ausnahmslos
ESS-0001-CONTRACTS.

---

## Cross Reference

Dieses Dokument besitzt kein YAML-Frontmatter. Die Referenzen werden als
Markdown-Abschnitt geführt, analog zu ESS-0001-CONTRACTS und ESS-0011-CONTRACTS.

**Depends On**

ESS-0001-CONTRACTS

ESS-0013

**Related ESS**

ESS-0001 — Documentary & Code Intelligence Architect

ESS-0010 — Documentary Engine

ESS-0011 — Enterprise Traceability

ESS-0011-CONTRACTS — Link Contract, Coverage, Orphans

ESS-0012 — Documentation Governance

ESS-0012-CONTRACTS — 57 Governance-Regeln, u. a. die sechs Governance-Validator-Events

**Related ADR**

ADR-0010 — Enterprise Standard Extension

ADR-0013 — ESS Documentation Responsibility Consolidation

ADR-0015 — Enterprise Traceability Component

ADR-0018 — Enterprise Event Mesh

**Related Components**

`src/platform/EventMesh`

`src/platform/Traceability`

`src/platform/Documentary`

`src/platform/Knowledge`

---

## 1. Event Catalog Contract

Der `EventCatalog` führt jedes Event genau einmal.

Ein Event-Name wird niemals zweifach mit unterschiedlicher Bedeutung vergeben.

Bevor ein neues Event registriert wird, prüft `EventContractValidator` gegen den
bestehenden Katalog, ob ein bedeutungsgleiches Event bereits existiert (siehe ESS-0013,
Abschnitt *Standard Event Catalog*, für drei bereits aufgelöste Kollisionen).

Ein Event, das ausschließlich einen bereits registrierten Sachverhalt unter neuem Namen
beschreibt, wird abgelehnt. Der Producer muss das bestehende Event verwenden.

---

## 2. Naming Contract

Jedes Event trägt das Suffix `Event` (Chapter 8, unverändert).

Jedes Event trägt zusätzlich eine der zwölf in ESS-0013 definierten Kategorien als
Katalog-Metadatum — nicht als Namensbestandteil.

---

## 3. Registry Contract

`EventRegistry`, `ProducerRegistry` und `ConsumerRegistry` werden ausschließlich
generiert. Manuelle Einträge sind nicht zulässig.

Ein Event ohne mindestens einen registrierten Producer erhält den Status `proposed`
und nicht `registered`.

Ein Event ohne mindestens einen registrierten Consumer ist zulässig (nicht jedes Event
muss konsumiert werden), wird jedoch im `EventCoverageReport` gesondert ausgewiesen.

---

## 4. Compatibility Contract

Vor jeder neuen Event-Version prüft `EventCompatibilityValidator`:

Eine neue Pflichtfeld-Anforderung im Payload ist ein Breaking Change → Major Version
(Chapter 8, *Event Versioning*, unverändert referenziert).

Eine neue optionale Payload-Eigenschaft ist eine Minor Version.

Eine Beschreibungs- oder Metadatenkorrektur ohne Strukturänderung ist eine Patch
Version.

Ein Breaking Change ohne begleitenden ADR wird von `EventCompatibilityValidator`
zurückgewiesen — konsistent mit dem repositoryweiten Verbot „Breaking Changes ohne
ADR".

---

## 5. Routing Contract

`EventRouter` ist der einzige Ort, an dem eine Zustellentscheidung getroffen wird.

Kein Producer bestimmt selbst seine Consumer. Die Zuordnung erfolgt ausschließlich über
`ConsumerRegistry`-Einträge.

Ein Routing-Fehlschlag erzeugt `EventRoutingFailedEvent` (System Events) und wird
niemals stillschweigend verworfen.

---

## 6. Discovery Contract

`Discovery/` liest ausschließlich deklarierte `manifest.json`-Felder
(`events.produces`, `events.consumes`). Es leitet Producer/Consumer niemals aus
Quellcode-Analyse ab, solange keine Komponente über ausführbaren Code verfügt.

Eine Komponente mit leerem `events`-Feld gilt als „kein deklarierter Producer/Consumer",
nicht als Fehler. Der `EventCoverageReport` weist dies als offenen Punkt aus, keine
Verletzung.

---

## 7. Policy Contract

`Policies/` definiert je Event-Kategorie mindestens eine Routing-Policy (wer darf
konsumieren) und optional eine Retry-Policy (Zustellversuche bei Fehlschlag).

Eine Policy darf ein Event niemals inhaltlich verändern — ausschließlich
Zustellverhalten.

---

## 8. Report Contract

| Report | Pflichtangaben |
|---|---|
| `EventFlowReport` | Zeitraum, Producer, Consumer, Event-Anzahl je Paar |
| `EventCoverageReport` | Komponenten ohne Producer-Eintrag, Komponenten ohne Consumer-Eintrag, Events ohne Consumer |
| `EventHealthReport` | Fehlerrate, mittlere Zustellzeit, unzustellbare Events der letzten Periode |
| `EventDependencyReport` | aus Flüssen abgeleitete Komponentenpaare, absteigend nach Häufigkeit |

Reports werden ausschließlich berechnet, niemals manuell gepflegt (ESS-0001-CONTRACTS
Chapter 12, analog übernommen).

---

## 9. ETM-Referenz-Contract

Jedes registrierte Event führt eine ETM-Referenz (mindestens eine Interface- und eine
Komponentenreferenz gemäß ESS-0011 Traceability-Achsen). Fehlt sie, bleibt das Event im
Status `proposed`.

---

## 10. Abgrenzung gegenüber Chapter 8

Dieses Dokument wiederholt keine der folgenden, bereits in Chapter 8 verbindlichen
Regeln: Event-Prinzip, Namensregel (Suffix), Pflichtfelder des Event Contract,
Producer-Grundregel („jede Komponente darf veröffentlichen"), Consumer-Grundregel
(„ausschließlich dokumentierte Events"), zehnteilige Validation-Checkliste.

Bei Erweiterung dieses Dokuments ist vor jeder neuen Regel zu prüfen, ob sie nicht
bereits durch Chapter 8 abgedeckt ist (`GOV-ESS-004`, Zero Duplication).

---

## End of ESS-0013-CONTRACTS
