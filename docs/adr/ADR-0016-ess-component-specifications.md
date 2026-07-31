# ADR-0016: Nachvergabe der reservierten ESS-Nummern 0004 bis 0009 als Komponentenspezifikationen

## Status

**Accepted**

## Implementation-Status

✅ **COMPLETE** (verifiziert 2026-07-31) — Sechs Dokumente angelegt, Registry vollständig,
kein reservierter Nummernplatz mehr ohne Dokument. Die beschriebenen Komponenten sind
weiterhin nicht implementiert; das ist Gegenstand der Umsetzungsstufen und nicht dieser
Entscheidung.

## Datum

2026-07-31

## Verantwortlich

Platform Director

## Betroffene Artefakte

`.ai/skills/ESS-0004-Enterprise-Version-Manager.md` (neu)

`.ai/skills/ESS-0005-Quality-Center.md` (neu)

`.ai/skills/ESS-0006-Security-Compliance.md` (neu)

`.ai/skills/ESS-0007-Enterprise-Release-Center.md` (neu)

`.ai/skills/ESS-0008-AI-Agent-Framework.md` (neu)

`.ai/skills/ESS-0009-Enterprise-Knowledge-Platform.md` (neu)

`.ai/registry/ess-registry.json` (fortgeschrieben)

`docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` (erweitert)

---

## Kontext

ESS-0001 reserviert im Abschnitt *Related Enterprise Specifications* die Nummern ESS-0002 bis
ESS-0009 mit festen Titeln. ESS-0002 und ESS-0003 wurden mit ADR-0013 angelegt.

Für **ESS-0004 bis ESS-0009** wurde damals entschieden, **kein** Dokument anzulegen. Die
Begründung lautete: Die jeweiligen Regelbereiche seien durch ESS-0001-CONTRACTS Chapter 9,
11, 12, 15 und 19 vollständig abgedeckt, ein eigenes Dokument wäre ein Duplikat und verstieße
gegen *Zero Duplication*.

Diese Einschätzung wurde vom Platform Director überprüft und **verworfen**. Der Befund
lautete: Sechs reservierte Nummern ohne Dokument sind eine Lücke, keine Duplikatsvermeidung.

Die Prüfung bestätigt das:

| Beobachtung | Bewertung |
|---|---|
| ESS-0002 und ESS-0003 sind Komponentenspezifikationen, keine Regelwerke | dasselbe Muster ist für 0004–0009 anwendbar |
| Chapter 9, 11, 12, 15 regeln **Verträge**, nicht **Komponenten** | die Komponente bleibt unspezifiziert |
| `src/agents` mit acht Agenten besitzt keinerlei Enterprise-Vertrag | echte Regelungslücke, kein Duplikat |
| Registry führte sechs Einträge mit `document: null` | für jede Auswertung ein Fehlzustand |

Die ursprüngliche Begründung verwechselte **Regelbereich** mit **Komponentenbeschreibung**.
Chapter 9 legt fest, *wie versioniert wird*; es beschreibt nicht, *woraus der Version Manager
besteht*.

---

## Entscheidung

### 1. Sechs Komponentenspezifikationen unter den reservierten Nummern

| Nummer | Titel (unverändert aus ESS-0001) | Spezifizierte Komponente |
|---|---|---|
| ESS-0004 | Enterprise Version Manager | `src/platform/VersionManager` |
| ESS-0005 | Quality Center | `src/platform/Quality` |
| ESS-0006 | Security & Compliance | `src/platform/Security`, `src/platform/Compliance` |
| ESS-0007 | Enterprise Release Center | `src/platform/Release` |
| ESS-0008 | AI Agent Framework | `src/agents`, `src/orchestrator` |
| ESS-0009 | Enterprise Knowledge Platform | `src/platform/Knowledge` |

Die Titel entsprechen exakt der Reservierung aus ESS-0001. Keine Umwidmung, keine
Umnummerierung.

### 2. Strikte Abgrenzung gegen die globalen Contracts

Jedes der sechs Dokumente führt im Frontmatter eine `classification.note`, die den
Geltungsbereich begrenzt, und einen Abschnitt *Abgrenzung* mit Verweistabelle.

| Dokument | beschreibt | beschreibt **nicht** |
|---|---|---|
| ESS-0004 | Komponentenaufbau, Interfaces, Events | Versionsstrategie (Chapter 9) |
| ESS-0005 | Validator-Ausführung, Gate-Runner | Validator-Vertrag, Severity (Chapter 12) |
| ESS-0006 | Security- und Compliance-Komponenten | Sicherheitsregeln (Chapter 11) |
| ESS-0007 | Release-Ausführung, Snapshots | Release-Contracts (Chapter 9, 19) |
| ESS-0008 | Agent-Rahmenwerk | Scoring-Algorithmen, KI-Orchestrierung (Chapter 10, 17) |
| ESS-0009 | Knowledge-Komponente | Wissensmodell (Chapter 4, Chapter 15) |

Keine globale Regel wurde wiederholt. Sämtliche Regelbereiche werden referenziert.

### 3. ESS-0006 führt zwei Komponenten in einem Dokument

Security Center und Compliance Center werden gemeinsam spezifiziert.

**Begründung:** Beide teilen eine durchgehende Nachweiskette
(`Classification → Kontrolle → Audit → Evidence → Nachweis`). Eine Trennung hätte diese Kette
an der Dokumentgrenze zerschnitten. Die Reservierung in ESS-0001 führt beide Bereiche
ebenfalls gemeinsam. Die Komponenten bleiben im Repository getrennt.

### 4. ESS-0008 schließt eine echte Lücke

Chapter 10 und Chapter 17 regeln die **KI-Entwicklungssysteme** — Claude Code, Google AI
Studio, ChatGPT. Sie regeln **nicht** die acht produktiven Domänen-Agenten unter `src/agents`.

ESS-0008 führt für diese verbindlich ein: Agent Contract, stabile Agent-Identität,
**Determinismus-Deklaration**, Data Integrity Contract, Orchestrator Contract und
Registrierungspflicht.

Besonders relevant: Ein nicht deterministischer, LLM-gestützter Agent darf niemals alleinige
Quelle einer sicherheits-, abrechnungs- oder compliancerelevanten Entscheidung sein.

**ESS-0008 verändert keine Scoring-Algorithmen und keine Bewertungslogik.**

### 5. Aufgabe 2 der Anforderung war bereits erfüllt

Die auslösende Anforderung nannte erneut die Erstellung von Chapter 11 bis 20 in
ESS-0001-CONTRACTS. Die Prüfung ergab: **Chapter 1 bis 20 sind lückenlos vorhanden**
(ADR-0010, gemergt via PR #1). Es wurde nichts dupliziert.

---

## Alternativen

**A) Bei der ursprünglichen Entscheidung bleiben (keine Dokumente).**
Verworfen. Der Platform Director hat die Einschätzung ausdrücklich überprüft und verworfen.
Sechs reservierte Nummern ohne Dokument sind für jede maschinelle Auswertung ein Fehlzustand,
und `src/agents` bliebe dauerhaft ohne Vertrag.

**B) Titel nach der zuletzt genannten Themenliste vergeben** (etwa ESS-0004 = Documentary
Engine, ESS-0005 = Knowledge Graph).
Verworfen. Das widerspricht der bindenden Reservierung aus ESS-0001 und Chapter 16.
Documentary Engine ist bereits ESS-0010, Knowledge Graph ist Chapter 15 und ESS-0009. Eine
Neuvergabe hätte drei bestehende Dokumente entwertet.

**C) Die Inhalte in ESS-0001-CONTRACTS als weitere Kapitel ergänzen.**
Verworfen. Komponentenbeschreibungen gehören nicht in den Master Enterprise Standard. Das
widerspricht der Responsibility Matrix, die für ESS-0001-CONTRACTS ausdrücklich
*komponentenspezifische Spezifikationen* als unzulässigen Inhalt führt.

**D) Ein Sammeldokument für alle sechs Bereiche.**
Verworfen. Sechs Komponenten mit unterschiedlichen Ownern und Lebenszyklen in einem Dokument
hätten dieselbe Vermischung erzeugt, die ADR-0013 gerade beseitigt hat.

---

## Konsequenzen

### Positiv

- Kein reservierter Nummernplatz ohne Dokument; die Registry ist erstmals vollständig
  (15 von 15 Einträgen mit Dokument).
- `src/agents` besitzt erstmals einen Enterprise-Vertrag, einschließlich
  Determinismus-Deklaration und Data Integrity Contract.
- Jede Kernkomponente der Wertschöpfungskette besitzt nun eine eigene Spezifikation.
- Die Abgrenzung zwischen Vertrag (ESS-0001-CONTRACTS) und Komponente (ESS-000x) ist an
  sechs weiteren Beispielen durchgezogen.

### Negativ / Aufwand

- Sechs weitere Dokumente erhöhen die Pflegelast. Jede Änderung an Chapter 9, 11, 12, 15
  oder 19 erfordert künftig eine Prüfung, ob die zugehörige Komponentenspezifikation
  nachzuziehen ist.
- Die Zahl spezifizierter, aber nicht implementierter Komponenten steigt weiter. Der
  Enterprise Score wird dadurch nicht steigen — die Definitionsdimension war bereits hoch.
- Das Risiko schleichender Duplikation wächst. Es wird ausschließlich durch die
  Abgrenzungsabschnitte und die Regel `GOV-ESS-004` beherrscht.

### Neutral

- Kein produktiver Code verändert.
- Kein bestehendes ESS- oder ADR-Dokument inhaltlich verändert.
- Keine Reservierung umgewidmet.

---

## Folgeentscheidungen

1. Umsetzung der spezifizierten Komponenten (Stufen 1 bis 5).
2. Registrierung der acht Agenten gemäß ESS-0008 Chapter 4.
3. Nachpflege der Determinismus-Deklaration je Agent.
4. `DocumentResponsibilityValidator` muss die Abgrenzung der sechs neuen Dokumente prüfen.

---

## Referenzen

- ESS-0001 — *Related Enterprise Specifications* (Nummernreservierung)
- ESS-0001-CONTRACTS — Chapter 4, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 19
- ADR-0010 — Enterprise Standard Extension (Chapter 11–20)
- ADR-0013 — ESS Documentation Responsibility Consolidation
- ADR-0015 — Enterprise Traceability Component
- `docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` — ARCH-RESP-0001
- `.ai/registry/ess-registry.json`
