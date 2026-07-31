# ADR-0012: Konsolidierung der ESS-Dokumentationsverantwortung, Vergabe von ESS-0010 und ESS-0011

## Status

**Accepted**

## Implementation-Status

✅ **COMPLETE** (verifiziert 2026-07-31) — Sämtliche sieben ESS-Dokumente tragen eine
Dokumentklasse und vollständige Cross-References. ESS-0010, ESS-0011 und ESS-0011-CONTRACTS
sind angelegt und in der Registry geführt. Die Responsibility Matrix ist als
`docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` verbindlich abgelegt.

Offen bleibt ausschließlich die **maschinelle** Durchsetzung: der
`DocumentResponsibilityValidator` setzt Umsetzungsstufe 4 aus
`docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` voraus und ist nicht Gegenstand dieser
Entscheidung.

## Datum

2026-07-31

## Verantwortlich

Platform Director

## Betroffene Dokumente

`.ai/skills/ESS-0001-Documentary-Architect.md` (ergänzt)

`.ai/skills/ESS-0001-Contracts.md` (ergänzt)

`.ai/skills/ESS-0002-Supervisor-Architect.md` (ergänzt)

`.ai/skills/ESS-0003-Platform-Director.md` (ergänzt)

`.ai/skills/ESS-0010-Documentary-Engine.md` (neu)

`.ai/skills/ESS-0011-Enterprise-Traceability.md` (neu)

`.ai/skills/ESS-0011-Contracts.md` (neu)

`.ai/registry/ess-registry.json` (fortgeschrieben)

`docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` (neu)

`docs/architecture/ESS_CONSOLIDATION_REPORT.md` (neu)

---

## Kontext

Eine vollständige Analyse des ESS-Dokumentenbestands (`ARCH-CONSOL-0001`) hat zehn Befunde
ergeben. Drei davon erforderten eine Architekturentscheidung.

**K-10 — Die Documentary Engine besaß keine eigene Spezifikation.**
Sie war über vier Dokumente verteilt beschrieben: 26 Nennungen in ESS-0001 (Vision),
42 in ESS-0001-CONTRACTS (Contracts), je eine Handvoll in ESS-0002 und ESS-0003. Als einzige
Kernkomponente mit 19 Unterverzeichnissen besaß sie kein Spezifikationsdokument, während
Supervisor (ESS-0002) und Platform Director (ESS-0003) je eines haben.

**K-05 — ESS-0001 vermischt Vision und technische Spezifikation.**
Acht der neun Kapitel enthalten technische Inhalte (AST-Analyse, JSON-Modellnamen,
Event-Modelle, Versionsmatrizen). Ohne Abgrenzung entsteht bei Anlage einer technischen
Spezifikation eine konkurrierende Zuständigkeit.

**K-02 — Nummernkonflikt.**
Die auslösende Aufgabenstellung wies die Documentary Engine der Nummer ESS-0004 zu. ESS-0004
ist jedoch über ESS-0001 (*Related Enterprise Specifications*) und die gemergte
`ess-registry.json` verbindlich als *Enterprise Version Manager* reserviert.
ESS-0001-CONTRACTS Chapter 16 legt fest: *„Reservierte Nummern werden niemals abweichend
belegt."*

Zusätzlich waren die Cross-References unvollständig (K-08): nur zwei von vier Dokumenten
führten maschinell auswertbare Referenzen, und diese ohne die geforderte Untergliederung.

---

## Entscheidung

### 1. Nummernvergabe aus dem freien Nummernraum

| Nummer | Dokument |
|---|---|
| **ESS-0010** | Documentary Engine — technische Spezifikation |
| **ESS-0011** | Enterprise Traceability — ETM-Spezifikation |
| **ESS-0011-CONTRACTS** | ETM Contracts (Vertragsteil, belegt keine eigene Nummer) |

Die Reservierung ESS-0004 = *Enterprise Version Manager* bleibt **unverändert bestehen**.

ESS-0010 war frei: Repository Governance war ursprünglich dafür vorgesehen, wurde jedoch in der
Registry als `not_required` eingestuft, da ESS-0001-CONTRACTS Chapter 16 den Bereich vollständig
und normativ abdeckt. Die Nummer wurde damit regulär weitervergeben. Der freie Nummernraum
beginnt nun bei ESS-0012.

Diese Vergabe verletzt keine bestehende Regel und erfordert keine Aufhebung einer Reservierung.

### 2. ESS-0001 wird als Foundational Architecture Document gekennzeichnet

ESS-0001 erhält im Frontmatter `classification.type: Foundational Architecture Document` sowie
im Dokumentkopf einen Abschnitt *Dokumentklassifizierung* mit folgender Vorrangregel:

> Die Kapitel 2 bis 9 beschreiben den ursprünglichen technischen Architekturentwurf. Für die
> verbindliche technische Spezifikation gilt ausschließlich ESS-0010. Bei Abweichungen besitzt
> ESS-0010 Vorrang.

**Kein Inhalt wurde entfernt.** Die technischen Kapitel bleiben vollständig erhalten. Die
Umwidmung ist ausschließlich deklaratorisch — sie ordnet die Autorität zu, ohne den Text zu
verändern. Diese Systematik entspricht der bereits in Chapter 20 etablierten *Normative
Clarification*.

### 3. Verbindliche Responsibility Matrix

`docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` legt für alle sieben ESS-Dokumente fest:
Dokumentklasse, Verantwortung, zulässige und unzulässige Inhalte, Vorrangregeln bei Konflikt
sowie eine Prüfliste vor Neuanlage.

Sie definiert **keine** neuen Enterprise-Regeln, sondern ordnet ausschließlich bestehende
Verantwortlichkeiten zu.

### 4. Einheitliche Cross-Reference-Konvention

Jedes ESS-Dokument führt fünf Felder: `dependsOn`, `relatedEss`, `relatedAdr`,
`relatedComponents`, `relatedSkills`.

| Dokumenttyp | Form |
|---|---|
| mit YAML-Frontmatter | Schlüssel `crossReference:` |
| ohne Frontmatter (`*-CONTRACTS`) | Markdown-Abschnitt *Cross Reference* |

Die Zweiform ist bewusst: ESS-0001-CONTRACTS besitzt kein Frontmatter, dessen nachträgliche
Einführung wäre eine Änderung statt einer Ergänzung. In ESS-0002 und ESS-0003 blieb der
ursprüngliche flache `references:`-Block unverändert erhalten; `crossReference:` wurde
additiv daneben ergänzt.

### 5. `docs/ess/` wird nicht eingeführt

Sämtliche ESS-Dokumente verbleiben unter `.ai/skills/`.

Chapter 2 weist `.ai/` ausdrücklich Skills und Contracts zu, Chapter 5 verortet KI-Artefakte
dort, und fünf der sieben Dokumente tragen den Frontmatter-Schlüssel `skill:`. Ein neues
Root-Unterverzeichnis wäre eine Strukturänderung mit ADR-Pflicht und erforderte eine Migration
sämtlicher Dokumente samt Referenzanpassung — ohne erkennbaren Nutzen.

### 6. Kein neuer Contract für die Documentary Integration

Die geforderte automatische Prüfung auf doppelte Verantwortlichkeiten, widersprüchliche Regeln,
konkurrierende Standards und fehlende Referenzen ist bereits vertraglich gedeckt:

| Prüfung | Bestehender Contract |
|---|---|
| doppelte Verantwortlichkeiten | Chapter 3 — eine Verantwortung, genau ein Verzeichnis |
| widersprüchliche Regeln | Chapter 12, Chapter 20 — Rangfolge |
| konkurrierende Standards | Chapter 16 — ESS Registry Contract |
| fehlende Referenzen | Chapter 7 — Validation |
| Wissenskonflikte | Chapter 15 — `KnowledgeConflictDetectedEvent` |

Erforderlich ist ausschließlich ein `DocumentResponsibilityValidator` als weiterer Validator
in der Umsetzung von Chapter 12 — keine neue Regel.

---

## Alternativen

**A) ESS-0004 umwidmen, wie in der Aufgabenstellung formuliert.**
Verworfen. Erfordert die Aufhebung einer in ESS-0001 verankerten und bereits gemergten
Reservierung, widerspricht Chapter 16 und der Vorgabe *„ohne bestehende Enterprise-Regeln zu
verändern"*. Der Version Manager verlöre seine Nummer und benötigte eine neue — ein
Folgekonflikt ohne Gegenwert.

**B) Technische Kapitel aus ESS-0001 nach ESS-0010 verschieben.**
Verworfen. Verstößt gegen die Vorgabe *„Vorhandene Inhalte dürfen nicht gelöscht oder
überschrieben werden."* Die deklaratorische Vorrangregel erreicht dieselbe Eindeutigkeit ohne
Substanzverlust und erhält das Dokument als historischen Nachweis.

**C) Keine Konsolidierung, Verantwortlichkeiten im Einzelfall klären.**
Verworfen. Die Documentary Engine wäre weiterhin über vier Dokumente verteilt beschrieben.
Jede künftige Erweiterung müsste erneut entscheiden, wo sie hingehört — genau die
Nichtdeterminiertheit, die Chapter 1 ausschließt.

**D) `docs/ess/` einführen und alle Dokumente verschieben.**
Verworfen. Strukturänderung mit ADR-Pflicht, Migration von sieben Dokumenten, Anpassung von
mindestens elf referenzierenden Stellen — ohne Nutzen gegenüber der vertragskonformen
Ablage unter `.ai/skills/`.

---

## Konsequenzen

### Positiv

- Die Documentary Engine besitzt erstmals eine eigene technische Spezifikation.
- Die Doppelzuständigkeit zwischen ESS-0001 und der technischen Ebene ist durch eine
  ausdrückliche Vorrangregel beseitigt, ohne Inhalt zu verlieren.
- Sämtliche sieben ESS-Dokumente führen vollständige, maschinell auswertbare Cross-References
  (zuvor: zwei von vier, unvollständig).
- Die Enterprise Traceability Matrix ist erstmals spezifiziert und besitzt eigene, klar
  begrenzte Contracts.
- Die Nummernvergabe bleibt lückenlos und regelkonform; keine Reservierung wurde angetastet.
- Künftige ESS-Anlagen haben eine verbindliche Prüfliste.

### Negativ / Aufwand

- ESS-0011-CONTRACTS führt sechs zusätzliche Coverage-Schwellwerte und acht Orphan-Klassen ein,
  die maschinell zu prüfen sind. Ohne den `TraceabilityValidator` ist das eine Zusage, keine
  Durchsetzung.
- Zwei Cross-Reference-Formen (YAML und Markdown) erhöhen den Parseraufwand geringfügig. Der
  Alternativweg — nachträgliches Frontmatter in ESS-0001-CONTRACTS — wäre eine Änderung an
  einem bestehenden Dokument gewesen und wurde deshalb verworfen.
- ESS-0001 enthält weiterhin technische Inhalte, die formal nicht mehr seiner Klasse
  entsprechen. Das ist eine bewusst getragene Folge des Löschverbots und durch die Vorrangregel
  entschärft, aber nicht beseitigt.

### Neutral

- Kein produktiver Code wurde berührt.
- Kein Dokument wurde gelöscht, verschoben oder inhaltlich überschrieben.
- Sämtliche Änderungen an bestehenden Dokumenten sind reine Ergänzungen im Frontmatter oder
  im Dokumentkopf.

---

## Folgeentscheidungen

Nicht Gegenstand dieser Entscheidung:

1. `DocumentResponsibilityValidator` und `TraceabilityValidator` als ausführbare Validatoren
   (Umsetzungsstufe 4).
2. Eröffnung von ESS-0004 (Enterprise Version Manager) bei nachgewiesenem Regelbedarf.
3. Nachdokumentation von ADR-0001 bis ADR-0003 sowie Ergänzung von ADR-0009 in
   `adr_history.json` (GAP-026).
4. Ergänzung von ESS-/ADR-Referenzen in den Bestandsdokumenten unter `docs/` (GAP-029).

---

## Referenzen

- ESS-0001-CONTRACTS — Chapter 1, Chapter 2, Chapter 3, Chapter 5, Chapter 7, Chapter 12,
  Chapter 15, Chapter 16, Chapter 20
- ESS-0001 — *Related Enterprise Specifications* (Nummernreservierung)
- ADR-0010 — Enterprise Standard Extension
- ADR-0011 — Bestandsschutz Root-Abweichungen
- `docs/architecture/ESS_CONSOLIDATION_REPORT.md` — ARCH-CONSOL-0001, Befunde K-01 bis K-10
- `docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` — ARCH-RESP-0001
- `.ai/registry/ess-registry.json`
