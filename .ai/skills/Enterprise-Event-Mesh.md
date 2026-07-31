---
skill:
  id: SKILL-EVT-0001
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
  type: Operational Skill
  role: Handlungsanweisung für KI-Systeme zur Nutzung der Enterprise Event Mesh
  specification: ESS-0013
  contractAuthority: ESS-0013-CONTRACTS
  note: >
    Dieser Skill ist kein ESS-Dokument und belegt keine ESS-Nummer. Er beschreibt
    ausschliesslich die Anwendung der in ESS-0013 spezifizierten Komponente sowie des
    in ESS-0001-CONTRACTS Chapter 8 definierten Regelwerks. Bei Abweichungen gelten
    Chapter 8, ESS-0013 und ESS-0013-CONTRACTS.

authority:

  controls:
    - Event-Veröffentlichung
    - Event-Konsum
    - Event-Registrierung

  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - fachliche Event-Inhalte anderer Komponenten
    - ESS-0001-CONTRACTS Chapter 8

crossReference:
  dependsOn:
    - ESS-0013
    - ESS-0013-CONTRACTS
  relatedEss:
    - ESS-0001-CONTRACTS
    - ESS-0010
    - ESS-0011
    - ESS-0011-CONTRACTS
    - ESS-0012
    - ESS-0012-CONTRACTS
  relatedAdr:
    - ADR-0018
  relatedComponents:
    - src/platform/EventMesh
  relatedSkills:
    - .ai/skills/ESS-0013-Enterprise-Event-Mesh.md
    - .ai/skills/ESS-0013-Contracts.md
    - .ai/skills/Documentation-Governance-Validator.md

created: 2026-07-31
---

# Enterprise Event Mesh

## Zweck dieses Skills

Dieser Skill beschreibt, **wie** ein KI-System die Enterprise Event Mesh anwendet —
als Producer, als Consumer, oder bei der Bewertung eines neuen Event-Vorschlags.

Er ersetzt keine Spezifikation. Die verbindlichen Regeln stehen in

ESS-0001-CONTRACTS Chapter 8 — Enterprise Event & Messaging Contracts (globales Regelwerk)

ESS-0013 — Komponentenspezifikation

ESS-0013-CONTRACTS — Katalog-, Kompatibilitäts-, Registry-, Routing-, Discovery-,
Policy- und Report-Contracts

Bei jeder Abweichung zwischen diesem Skill und den genannten Dokumenten gelten die
genannten Dokumente, in dieser Reihenfolge.

---

# Grundregel

> Die Enterprise Event Mesh vermittelt. Sie entscheidet nicht über fachliche Inhalte.

Ein KI-System, das eine neue Komponente oder Funktion unter `src/platform/` plant,
prüft **vor** jeder direkten Abhängigkeit auf eine andere Fachkomponente, ob der
Bedarf stattdessen über ein registriertes oder neu zu registrierendes Enterprise Event
gedeckt werden kann.

Ein KI-System erzeugt niemals ein neues Event, ohne zuvor den bestehenden
`EventCatalog` (bzw., solange dieser nicht implementiert ist: den Standard Event
Catalog aus ESS-0013 und die `events`-Felder der betroffenen `manifest.json`-Dateien)
auf ein bedeutungsgleiches Event zu prüfen.

---

# Event Governance

| Aufgabe | Beschreibung |
|---|---|
| Event-Namensregel prüfen | Suffix `Event`, Kategorie aus ESS-0013 |
| Katalog-Kollision prüfen | ESS-0013-CONTRACTS Abschnitt 1, *Event Catalog Contract* |
| Contract-Vollständigkeit prüfen | Pflichtfelder aus Chapter 8 plus ETM-Referenz (ESS-0013-CONTRACTS Abschnitt 9) |
| Versionssprung bewerten | ESS-0013-CONTRACTS Abschnitt 4, *Compatibility Contract* |
| Breaking Change ohne ADR blockieren | verbindlich, keine Ausnahme |

Die Governance über neue Event-**Typen** und -**Kategorien** obliegt dem Platform
Director (Chapter 8, *Platform Director Integration*). Ein KI-System schlägt vor, es
genehmigt nicht selbst.

---

# Event Producer

Ein KI-System, das eine Komponente als Event-Producer implementiert:

1. deklariert das Event in der eigenen `manifest.json` unter `events.produces`
2. prüft gegen den Standard Event Catalog (ESS-0013) und die `events`-Felder aller
   anderen Komponenten, ob ein bedeutungsgleiches Event bereits existiert
3. veröffentlicht ausschließlich über `EventPublisher` (sobald implementiert) — niemals
   über einen direkten Aufruf einer Consumer-Komponente
4. füllt den Payload ausschließlich mit fachlicher Information (Chapter 8, *Event
   Payload*) — keine Implementierungsdetails, keine Geschäftslogik

Bekannte mögliche Producer (siehe ESS-0013, Abschnitt *Producer- und
Consumer-Erkennung*): Documentary Engine, Traceability Engine, Knowledge Graph,
Compliance Engine, Version Manager, Supervisor, Platform Director, Security,
Repository Discovery.

---

# Event Consumer

Ein KI-System, das eine Komponente als Event-Consumer implementiert:

1. deklariert das konsumierte Event in der eigenen `manifest.json` unter
   `events.consumes`
2. abonniert ausschließlich über `EventSubscriber` (sobald implementiert)
3. greift niemals direkt auf die Producer-Komponente zu, auch wenn ein direkter
   Import technisch möglich wäre

Bekannte mögliche Consumer: Documentary, Knowledge Graph, Traceability, Version
Manager, Supervisor, Platform Director, Compliance, Security, Release.

---

# Event Contracts

Jedes Event führt mindestens die in Chapter 8 verbindlichen Felder:

Event Name · Event ID · Version · Timestamp · Source Component · Target Component ·
Correlation ID · Payload · ESS-Referenzen · ADR-Referenzen

Zusätzlich verbindlich (ESS-0013): ETM-Referenz (mindestens ein Interface, mindestens
eine Komponente).

Ein Event ohne vollständige Pflichtfelder wird von `EventContractValidator` als
unvollständig zurückgewiesen und niemals mit Lücken registriert.

---

# Routing

Routing erfolgt ausschließlich über `EventRouter`. Ein KI-System implementiert niemals
einen zweiten, parallelen Zustellweg — auch nicht „vorübergehend" oder „zur
Vereinfachung".

Ein Routing-Fehlschlag wird als `EventRoutingFailedEvent` gemeldet, niemals
stillschweigend verworfen.

---

# Trigger

Der Skill wird verbindlich angewendet bei

| Auslöser | Umfang |
|---|---|
| Planung einer neuen Abhängigkeit zwischen zwei `src/platform/`-Komponenten | vollständig — Event-Alternative prüfen |
| Implementierung eines neuen Event-Producers | vollständig |
| Implementierung eines neuen Event-Consumers | vollständig |
| Vorschlag eines neuen Event-Typs | vollständig — Katalog-Kollisionsprüfung |
| Änderung eines bestehenden Event-Contracts | vollständig — Kompatibilitätsprüfung |
| vor jeder Release-Vorbereitung | vollständig — `EventHealthReport` prüfen |

---

# ETM-Integration

Die Enterprise Event Mesh **liefert** die Event-Achse der Enterprise Traceability
Matrix (ESS-0011). Sie erzeugt keine neue Traceability-Achse und keine neue
Verknüpfungsart.

Fehlt die ETM-Referenz eines Events, bleibt es im Status `proposed` — es wird niemals
ohne Referenz als `registered` geführt.

---

# Documentary-Integration

Die Documentary Engine (ESS-0010) dokumentiert automatisch jedes registrierte Event
(Chapter 8, *Documentary Integration*). Die Enterprise Event Mesh liefert die Daten,
die Documentary Engine erzeugt daraus Dokumentation. Die Mesh selbst erzeugt keine
Dokumentation.

---

# Versionierung

| Änderung | Versionsauswirkung |
|---|---|
| neues Pflichtfeld im Payload | Major (Breaking Change, ADR erforderlich) |
| neues optionales Feld | Minor |
| Beschreibungs-/Metadatenkorrektur | Patch |
| neues, kollisionsfreies Event | Minor (neue Registrierung) |
| Umbenennung eines bestehenden Events | **nicht zulässig** — Events werden niemals umbenannt, nur `deprecated` gesetzt und durch ein neues Event ersetzt |

Der Version Manager (ESS-0004) leitet aus Event-Änderungen die Plattformversion ab.
Die Mesh selbst trifft keine Versionsentscheidung für die Plattform, nur für den
einzelnen Event Contract.

---

# Pflichten je KI-System

| System | Pflicht |
|---|---|
| **Claude Code** | prüft vor jeder neuen `src/platform/`-Abhängigkeit die Event-Alternative; deklariert Producer/Consumer in `manifest.json` |
| **Google AI Studio** | prüft Event-Vorschläge in Entwürfen gegen den Standard Event Catalog vor Übergabe an Claude Code |
| **ChatGPT** | prüft neue Event-Kategorien und -Typen auf Governance-Konformität vor Aufnahme in ESS oder ADR |
| **Future Enterprise AI** | identische Pflicht |

Verbindlich für alle:

✗ kein direkter Import einer Fachkomponente durch eine andere Fachkomponente, wenn ein
Event-basierter Weg möglich ist

✗ kein neues Event ohne Katalog-Kollisionsprüfung

✗ keine Umbenennung bestehender Events

✗ kein Breaking Change ohne ADR

✗ keine eigene Routing-Logik außerhalb `EventRouter`

---

# Aktueller Anwendungsstand

Dieser Skill ist **spezifiziert, nicht ausführbar**.

Die Ausführung setzt die Umsetzungsstufen 1 bis 3 aus
`docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` voraus — insbesondere den
Enterprise Event Bus.

Bis dahin wenden KI-Systeme die Prinzipien aus Chapter 8 und ESS-0013 **manuell** an:
Neue `src/platform/`-Komponenten deklarieren ihre beabsichtigten Events bereits jetzt in
`manifest.json` (`events.produces`/`events.consumes`), auch ohne lauffähigen Event Bus,
damit `Discovery/` nach Implementierung ohne Nacherfassung arbeiten kann.

---

# Related Documents

ESS-0013 — Enterprise Event Mesh

ESS-0013-CONTRACTS — Enterprise Event Mesh Contracts

ESS-0001-CONTRACTS — Chapter 8 (Regelwerk), Chapter 9, Chapter 11–19

ESS-0011 — Enterprise Traceability

ESS-0012-CONTRACTS — Governance-Validator-Events

ADR-0018 — Enterprise Event Mesh

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Fassung des Enterprise-Event-Mesh-Skills |

---

# End of Document

SKILL-EVT-0001

CAPITAL-AI Enterprise Event Mesh

Version 1.0.0
