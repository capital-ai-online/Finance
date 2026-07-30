# ADR-0010: Erweiterung des Enterprise Standards um ESS-0001-CONTRACTS Chapter 11–20, ESS-0002, ESS-0003 und die ESS Registry

## Status

**Accepted**

## Implementation-Status

🟡 **IN PROGRESS** — Die Standarderweiterung ist vollständig verabschiedet und im Repository
abgelegt. Die maschinelle Durchsetzung der neuen Kapitel (Validatoren, Contract Tests,
Registry-Generierung) ist Gegenstand der nachgelagerten Umsetzungsstufen und noch nicht
implementiert. Siehe `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md`, Stufen 1 bis 11.

## Datum

2026-07-30

## Verantwortlich

Platform Director

## Betroffene Dokumente

- `.ai/skills/ESS-0001-Contracts.md` (Version 1.0.0 → 1.1.0)
- `.ai/skills/ESS-0002-Supervisor-Architect.md` (neu)
- `.ai/skills/ESS-0003-Platform-Director.md` (neu)
- `.ai/registry/ess-registry.json` (neu)
- `docs/architecture/*` (fünf Enterprise Reports, neu)

---

## Kontext

Der CAPITAL-AI Core besitzt mit ESS-0001 und ESS-0001-CONTRACTS eine vollständige
Enterprise-Architektur auf konzeptioneller Ebene.

Eine vollständige Konsistenzanalyse sämtlicher Enterprise-Artefakte (dokumentiert in
`docs/architecture/ARCHITECTURE_GAP_REPORT.md`) hat 29 Befunde ergeben, davon 9 der Stufe
Critical und 10 der Stufe High.

Drei Befunde betreffen unmittelbar die Vollständigkeit und Widerspruchsfreiheit des Standards
selbst:

1. **Abgebrochene Kapitelkette.** ESS-0001-CONTRACTS Chapter 10 verweist im Abschnitt
   *Integration* ausdrücklich auf Chapter 11, 12 und 13. Diese Kapitel existieren nicht. Das
   Dokument endet ohne Version History und ohne Approval-Abschnitt.

2. **Zehn Regelbereiche ohne technischen Vertrag.** Für Security, Compliance, Qualität,
   Erweiterungen, Migration, Lebenszyklus, Knowledge Graph, Repository Governance, AI
   Orchestration, Digital Twin, Automatisierung und den Standardabschluss existiert keine
   verbindliche Regelung.

3. **Zwei Regelkonflikte innerhalb der bestehenden Dokumente.** ESS-0001 Chapter 8 und
   ESS-0001-CONTRACTS Chapter 8 verwenden unterschiedliche Event-Namenskonventionen. Chapter 2
   listet `Core` nicht als Pflichtmodul, während Chapter 3 und Chapter 6 `Core` als Fundament
   der Layer-Hierarchie definieren.

Ohne Auflösung dieser Punkte ist der in Chapter 1 geforderte Determinismus KI-gestützter
Entwicklung nicht erreichbar: zwei KI-Systeme mit identischer Aufgabenstellung würden
unterschiedliche Event-Namen, unterschiedliche Modullisten und unterschiedliche
Governance-Auslegungen erzeugen.

---

## Entscheidung

### 1. ESS-0001-CONTRACTS wird um die Kapitel 11 bis 20 erweitert

| Kapitel | Gegenstand |
|---|---|
| 11 | Enterprise Security & Compliance Contracts |
| 12 | Enterprise Validation & Quality Contracts |
| 13 | Enterprise Plugin & Extension Contracts |
| 14 | Enterprise Migration & Lifecycle Contracts |
| 15 | Enterprise Knowledge Graph Contracts |
| 16 | Enterprise Repository Governance |
| 17 | Enterprise AI Orchestration Contracts |
| 18 | Enterprise Digital Twin Contracts |
| 19 | Enterprise Automation Contracts |
| 20 | Official Enterprise Standard |

Die Dokumentversion steigt von 1.0.0 auf **1.1.0**. Es handelt sich um eine additive
Erweiterung ohne Breaking Change: keine bestehende Regel wurde geändert, entfernt oder
umnummeriert.

### 2. Bestehende Regelkonflikte werden durch Klarstellung aufgelöst, nicht durch Änderung

Chapter 20 enthält den Abschnitt *Normative Clarifications*. Die Auflösung folgt
ausschließlich der bereits in Chapter 1 festgelegten Rangfolge
(ADR → ESS Contracts → ESS → Projektdokumentation → Implementierung):

- **Event Naming:** Verbindlich gilt das Suffix `Event` gemäß Contracts Chapter 8. Die
  Bezeichnungen in ESS-0001 Chapter 8 sind als Kategorienamen zu lesen. ESS-0001 bleibt
  unverändert.
- **Core:** `src/platform/Core` ist gemäß Chapter 3 und Chapter 6 verbindlicher Bestandteil
  der Plattform und wird als technische Basisschicht geführt, nicht als fachliches Modul.
- **Querschnittsmodule:** Die 13 Pflichtmodule ohne eigene Layer-Ebene erhalten in Chapter 16
  eine verbindliche Abhängigkeitsregel. Die Hierarchie aus Chapter 6 bleibt unverändert.
- **Lifecycle vs. Version Category:** Beide Vokabulare bleiben unverändert bestehen. Chapter 14
  definiert die eindeutige Zuordnung.

### 3. Der ESS-Nummernraum wird verbindlich registriert

ESS-0001 reserviert in den Abschnitten *Integration Points* und *Related Enterprise
Specifications* die Nummern ESS-0002 bis ESS-0009 mit festen Titeln. Diese Reservierung ist
bindend und wird unverändert übernommen. Eine abweichende Belegung — etwa „ESS-0004 Documentary
Engine" — wäre eine Verletzung von ESS-0001 und zugleich ein Duplikat, da die Documentary
Engine bereits vollständig durch ESS-0001 spezifiziert ist.

Die Registry wird als `.ai/registry/ess-registry.json` geführt. Der freie Nummernraum beginnt
bei ESS-0010.

### 4. Es werden ausschließlich zwei neue ESS-Dokumente angelegt

| Dokument | Begründung |
|---|---|
| **ESS-0002 Supervisor Architect** | Der Supervisor ist Stufe 4 der Wertschöpfungskette und in Chapter 6 als eigener Layer geführt, besitzt jedoch keine Spezifikation. Echte Regelungslücke. |
| **ESS-0003 Platform Director** | Der Platform Director ist oberste Governance-Instanz und Freigabestufe, besitzt jedoch keine Spezifikation. Ergänzt ADR-0006, ersetzt es nicht. |

Für die reservierten Nummern ESS-0004 bis ESS-0007 sowie ESS-0009 wird **kein** Dokument
angelegt: die jeweiligen Regelbereiche sind durch die Kapitel 9, 11, 12, 15 und 19 vollständig
geregelt. Eigenständige Dokumente wären Duplikate und würden gegen das Verbot redundanter
Dokumente (ESS-0001, *Zero Duplication*) verstoßen. Die Begründung je Nummer ist in der ESS
Registry hinterlegt.

**ESS-0008 (AI Agent Framework)** bleibt reserviert und wird als offener Regelbedarf geführt:
die fachlichen Domänen-Agenten unter `src/agents` besitzen keine Spezifikation, und Chapter 17
regelt ausschließlich die Orchestrierung der KI-Systeme, nicht das Agentenmodell der
Fachdomänen.

**ESS-0010 (Repository Governance)** wird ausdrücklich **nicht** angelegt. Der Regelbereich ist
durch Chapter 16 vollständig und normativ abgedeckt; ein eigenes Dokument wäre ein Duplikat.
Die Nummer bleibt frei.

### 5. Zwei geprüfte Kapitelkandidaten werden nicht als eigene Kapitel geführt

Vor Abschluss des Standards wurde geprüft, ob über Chapter 20 hinaus weitere Kapitel notwendig
sind. Zwei Bereiche wurden untersucht und bewusst integriert statt separiert:

- **Registry & Discovery** — geregelt in Chapter 7 (Enterprise Registry), Chapter 15
  (Registry Relationship) und Chapter 16 (Repository Governance).
- **Observability & Telemetry** — geregelt in Chapter 12 (Observability Contract), Chapter 18
  (Twin States) und Chapter 19 (Execution Contract).

Ein eigenständiges Kapitel hätte in beiden Fällen bestehende Regeln wiederholt. Die Prüfung ist
in Chapter 20, Abschnitt *Completeness Assessment*, dokumentiert.

### 6. Fünf Enterprise Reports werden unter `docs/architecture/` geführt

| Report | Gegenstand |
|---|---|
| `ARCHITECTURE_GAP_REPORT.md` | 29 Befunde der Konsistenzanalyse |
| `REPOSITORY_STRUCTURE_ANALYSIS.md` | Strukturvergleich und priorisierter Umsetzungsplan (Stufen 0–11) |
| `COMPONENT_CONSISTENCY_REPORT.md` | Konformitätsprüfung sämtlicher 22 Komponenten |
| `AI_VALUE_CHAIN_VALIDATION.md` | Validierung der achtstufigen Wertschöpfungskette |
| `ENTERPRISE_MATURITY_REPORT.md` | Reifegradbewertung in 13 Kategorien |

Diese Reports sind Analyseartefakte, keine normativen Dokumente. Normative Wirkung besitzen
ausschließlich ESS-Dokumente und ADRs (Chapter 20, *Standard Definition*).

---

## Alternativen

**A) Keine Erweiterung, Regelung ad hoc bei Bedarf.**
Verworfen. Chapter 10 verweist bereits auf nicht existierende Kapitel; der Standard wäre
dauerhaft gebrochen. Ohne Verträge für Security, Qualität und Migration bleibt jede
KI-gestützte Änderung eine Einzelfallauslegung.

**B) Bestehende Dokumente ändern, um Konflikte zu beseitigen.**
Verworfen. Eine Änderung an ESS-0001 (etwa der Event-Namen) wäre ein Breaking Change an der
Enterprise Baseline und hätte sämtliche darauf verweisenden Artefakte entwertet. Die
Rangfolge aus Chapter 1 löst den Konflikt bereits ohne Änderung.

**C) Eigene ESS-Nummerierung nach thematischer Logik vergeben.**
Verworfen. Die Reservierung in ESS-0001 ist bindend. Eine abweichende Vergabe hätte zwei
widersprüchliche Dokumentregistrierungen und ein Duplikat der Documentary-Spezifikation
erzeugt.

**D) Für jede reservierte Nummer ein Dokument anlegen.**
Verworfen. Acht zusätzliche Dokumente hätten überwiegend bestehende Kapitelinhalte
wiederholt und gegen *Zero Duplication* verstoßen.

---

## Konsequenzen

### Positiv

- Die Kapitelkette ist geschlossen; Chapter 10 verweist nicht mehr ins Leere.
- Zehn zuvor ungeregelte Bereiche besitzen einen verbindlichen technischen Vertrag.
- Beide Regelkonflikte sind aufgelöst, ohne eine bestehende Regel zu verändern.
- Der ESS-Nummernraum ist eindeutig; künftige Erweiterungen sind deterministisch.
- Der Digital Twin besitzt erstmals messbare Kriterien (Twin States, Drift-Toleranz null).
- Die AI-Wertschöpfungskette ist erstmals normativ definiert, inklusive Auslöser, Übergabe­artefakten und Abbruchbedingungen.
- Die Definition-Dimension des Reifegrads steigt in acht Kategorien deutlich an
  (siehe `ENTERPRISE_MATURITY_REPORT.md`).

### Negativ / Aufwand

- Die Zahl der maschinell durchzusetzenden Regeln steigt erheblich: Chapter 12 fordert 16
  Pflichtvalidatoren, die Kapitel 11 bis 19 definieren über 80 Enterprise Events. Keine dieser
  Regeln ist derzeit implementiert.
- Bei vollständiger Durchsetzung von Chapter 18 (Drift-Toleranz null, nur `Synchronized` ist
  freigabefähig) wäre gegenwärtig keine Produktionsfreigabe zulässig, da der Twin-Zustand
  sämtlicher Komponenten `Unknown` lautet. Die Durchsetzung tritt erst mit der Implementierung
  der Validatoren ein; bis dahin gilt der Bestandsbetrieb unverändert weiter.
- Chapter 16 macht die bestehenden Root-Abweichungen (`server/`, `sql/`, `server.ts`)
  formal sichtbar. Sie sind über einen gesonderten ADR als Ausnahme zu registrieren.

### Neutral

- Es wurde kein produktiver Code geändert. Diese Entscheidung betrifft ausschließlich
  Standard- und Analysedokumente.
- Bestehende produktionsreife Komponenten (`server/documentHygiene.ts`,
  `server/systemEvents.ts`, `server/versionManager.ts`, `server/decisionEngine.ts`,
  `server/iam/`) bleiben unverändert. Chapter 14 schreibt ausdrücklich Registrierung und
  Kapselung statt Neuentwicklung vor.

---

## Folgeentscheidungen

Die folgenden Punkte erfordern eigene ADRs und sind mit dieser Entscheidung **nicht** getroffen:

1. Bestandsschutz und Zielstruktur für die Root-Verzeichnisse `server/` und `sql/` sowie für
   `server.ts` (Chapter 2, Chapter 16).
2. Auflösung der vier widersprüchlichen Versionsstände und Zuweisung der Versionshoheit
   (GAP-019, Chapter 9).
3. Überführung der Domänenlogik aus `src/agents`, `src/orchestrator`, `src/services` nach
   `src/features/<domain>` (Chapter 2, Chapter 14).
4. Eröffnung von ESS-0008 (AI Agent Framework) bei nachgewiesenem Regelbedarf.
5. Nachdokumentation von ADR-0001 bis ADR-0003 als Dokumente sowie Ergänzung von ADR-0009 in
   `adr_history.json` (GAP-026).

---

## Referenzen

- ESS-0001 — Documentary & Code Intelligence Architect
- ESS-0001-CONTRACTS — Enterprise Technical Contracts, Version 1.1.0
- ESS-0002 — Supervisor Architect
- ESS-0003 — Platform Director
- ADR-0006 — Plattform-Direktor (ergänzt, nicht ersetzt)
- ADR-0007 — Compliance-Wertschöpfungskette
- `docs/architecture/ARCHITECTURE_GAP_REPORT.md`
- `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md`
- `docs/architecture/COMPONENT_CONSISTENCY_REPORT.md`
- `docs/architecture/AI_VALUE_CHAIN_VALIDATION.md`
- `docs/architecture/ENTERPRISE_MATURITY_REPORT.md`
