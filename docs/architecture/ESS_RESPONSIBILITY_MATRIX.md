# CAPITAL-AI ESS Responsibility Matrix

## Enterprise Governance Document

### Document ID

ARCH-RESP-0001

### Version

1.0.0

### Status

Enterprise Governance — verbindlich

### Datum

2026-07-31

### ADR-Referenz

ADR-0012 — ESS Documentation Responsibility Consolidation

---

# Enterprise Purpose

Dieses Dokument legt verbindlich fest, welches ESS-Dokument welche Verantwortung trägt.

Es beseitigt konkurrierende Zuständigkeiten und verhindert, dass künftige Erweiterungen
Inhalte an mehreren Orten gleichzeitig regeln.

Es definiert keine neuen Enterprise-Regeln.

Es ordnet ausschließlich bestehende Verantwortlichkeiten zu.

---

# Geltung

Diese Matrix gilt für sämtliche ESS-Dokumente des CAPITAL-AI Core.

Vor der Anlage eines neuen ESS-Dokumentes ist sie zu prüfen und zu erweitern.

Vor der Ergänzung eines bestehenden ESS-Dokumentes ist zu prüfen, ob der Inhalt der
zugewiesenen Verantwortung entspricht.

---

# Ablageort

Sämtliche ESS-Dokumente liegen verbindlich unter

```text
.ai/skills/
```

**Begründung**

ESS-0001-CONTRACTS Chapter 2 weist `.ai/` ausdrücklich Skills, Prompts, Contracts, Templates,
Schemas, Registries und Knowledge Seeds zu.

Chapter 5 (*AI Artifact Naming*) verortet KI-Artefakte ausschließlich unter `.ai/`.

ESS-0001, ESS-0002, ESS-0003, ESS-0010 und ESS-0011 tragen im Frontmatter den Schlüssel
`skill:` mit `id:` — sie sind formal als Skills modelliert.

Ein Verzeichnis `docs/ess/` wird **nicht** eingeführt. Es wäre eine Strukturänderung nach
Chapter 2 und Chapter 16 mit ADR-Pflicht und erforderte eine Migration sämtlicher Dokumente
samt Referenzanpassung, ohne einen Nutzen zu erzeugen.

---

# Dokumentklassen

| Klasse | Bedeutung | Kennzeichnung im Frontmatter |
|---|---|---|
| Foundational Architecture Document | Gründungs- und Visionsdokument | `classification.type: Foundational Architecture Document` |
| Master Enterprise Standard | einzige globale Contract-Referenz | Markdown-Abschnitt *Dokumentklassifizierung* |
| Component Specification | Spezifikation genau einer Plattformkomponente | `classification.type: Component Specification` |
| Technical Specification | technische Spezifikation eines Subsystems | `classification.type: Technical Specification` |
| Scoped Contracts | Contracts mit begrenzter Geltung | Markdown-Abschnitt *Dokumentklassifizierung* |

---

# Responsibility Matrix

| Dokument | Klasse | Verantwortung | Darf enthalten | Darf NICHT enthalten |
|---|---|---|---|---|
| **ESS-0001**<br>Documentary & Code Intelligence Architect | Foundational Architecture Document | Gründungs- und Visionsdokument der Documentary Engine | Motivation, Zielbild, Architekturidee, ursprüngliche Vision, Designprinzipien, historischer Architekturentwurf | verbindliche technische Spezifikationen, neue Contracts, Implementierungsvorgaben |
| **ESS-0001-CONTRACTS**<br>Enterprise Technical Contracts | Master Enterprise Standard | einzige globale Contract-Referenz der Plattform | globale Contracts, Repository Standards, Architekturregeln, Naming, Layer, Versionierung, Governance, AI Standards, normative Klarstellungen | komponentenspezifische Spezifikationen, Vision, historische Inhalte, ETM-Detailprozesse |
| **ESS-0002**<br>Supervisor Architect | Component Specification | Komponentenspezifikation Supervisor | Beobachtungsmodell, Health- und Lifecycle-Überwachung, Findings, Eskalation, supervisorspezifische Contracts | globale Contracts, Entscheidungsbefugnisse, Dokumentationserzeugung |
| **ESS-0003**<br>Platform Director | Component Specification | Komponentenspezifikation Platform Director | Entscheidungsbefugnis, Governance-Modell, Ausnahmen, Eigentümerschaft, Release-Autorität | globale Contracts, Überwachungslogik, Implementierungsdetails anderer Komponenten |
| **ESS-0010**<br>Documentary Engine | Technical Specification | technische Spezifikation der Documentary Engine | Komponenten, Services, APIs, Events, Workflows, Trigger, Discovery, Registry, Digital Twin, Integration | Vision, Motivation, historische Inhalte, globale Contracts |
| **ESS-0011**<br>Enterprise Traceability | Technical Specification | Spezifikation der Enterprise Traceability Matrix | ETM-Architektur, ETM-Komponenten, ETM-Prozesse, ETM-Reports, ETM-Integration, ETM-Workflows | allgemeine Enterprise-Regeln, globale Contracts |
| **ESS-0011-CONTRACTS**<br>ETM Contracts | Scoped Contracts | Traceability-Matrix-Contracts | ausschließlich ETM-bezogene Contracts | globale Repository-, Naming-, Layer- und Governance-Contracts |
| **ESS-0012**<br>Documentation Governance | Technical Specification | Spezifikation des Documentation Governance Validator | Prüfbereiche, Komponentenarchitektur des Validators, Trigger, Reports, Integration, Rollentrennung | Validator-Basisregeln, Severity-Definitionen, Coverage-Schwellwerte, Twin-Regeln, globale Contracts |
| **ESS-0012-CONTRACTS**<br>Governance Contracts | Scoped Contracts | Governance-Regelwerk und Scoring | Regel-IDs, Regeltexte, Schweregradzuordnung, Nachweistypen, Scoring-Formeln, Governance-Events | globale Repository-, Naming-, Layer- und Governance-Contracts, Severity-Definitionen, Orphan-Klassen |
| **SKILL-GOV-0001**<br>Documentation-Governance-Validator | Operational Skill | Handlungsanweisung für KI-Systeme | Anwendungsreihenfolge, Trigger, Pflichten je KI-System, Abbruchbedingungen, Verweise | normative Regeln, Regeltexte, Schweregrade, Schwellwerte |

**Hinweis zu SKILL-GOV-0001:** Der Skill ist kein ESS-Dokument und belegt keine ESS-Nummer.
Er besitzt keine normative Wirkung — bei Abweichung gelten ESS-0012 und ESS-0012-CONTRACTS.
Er ist hier aufgeführt, weil er als einziges Nicht-ESS-Artefakt unter `.ai/skills/` liegt und
damit derselben Verantwortungsabgrenzung unterliegt.

---

# Vorrangregeln

Bei inhaltlichen Abweichungen zwischen Dokumenten gilt verbindlich:

| Konfliktfall | Vorrang |
|---|---|
| ESS-0001 gegen ESS-0010 | **ESS-0010** — technische Autorität |
| ESS-0001 gegen ESS-0001-CONTRACTS | **ESS-0001-CONTRACTS** — Chapter 1, Rangfolge |
| ESS-0011-CONTRACTS gegen ESS-0001-CONTRACTS | **ESS-0001-CONTRACTS** — globale Wirkung schlägt begrenzte |
| ESS-0012-CONTRACTS gegen ESS-0001-CONTRACTS | **ESS-0001-CONTRACTS** — globale Wirkung schlägt begrenzte |
| ESS-0012 gegen ESS-0011-CONTRACTS (Coverage, Orphans) | **ESS-0011-CONTRACTS** — Traceability ist dort geregelt |
| SKILL-GOV-0001 gegen ESS-0012 | **ESS-0012** — Skills besitzen keine normative Wirkung |
| Komponenten-ESS gegen ESS-0001-CONTRACTS | **ESS-0001-CONTRACTS** |
| ADR gegen jedes ESS-Dokument | **ADR** — Chapter 1, Rangfolge |

Die Gesamtrangfolge aus ESS-0001-CONTRACTS Chapter 1 bleibt unverändert gültig:

```text
ADR → ESS Contracts → Enterprise Specifications → Projektdokumentation → Implementierung
```

---

# Cross-Reference-Konvention

Jedes ESS-Dokument führt fünf Referenzfelder.

```text
Depends On          hierarchisch übergeordnete Dokumente
Related ESS         fachlich verbundene ESS-Dokumente
Related ADR         zugehörige Architekturentscheidungen
Related Components  Komponenten unter src/platform/
Related Skills      zugehörige Artefakte unter .ai/skills/
```

**Formvorgabe**

| Dokumenttyp | Form |
|---|---|
| Dokumente mit YAML-Frontmatter | Schlüssel `crossReference:` im Frontmatter |
| Dokumente ohne Frontmatter (`*-CONTRACTS`) | Markdown-Abschnitt *Cross Reference* nach dem Status-Abschnitt |

Beide Formen sind gleichwertig. Die Unterscheidung ist historisch bedingt: ESS-0001-CONTRACTS
besitzt kein Frontmatter, und dessen nachträgliche Einführung wäre eine Änderung an einem
bestehenden Dokument statt einer Ergänzung.

In ESS-0002 und ESS-0003 bleibt der ursprüngliche flache `references:`-Block unverändert
erhalten; `crossReference:` wurde additiv daneben ergänzt.

---

# Aktueller Referenzstand

| Dokument | Form | Depends On | Related ESS | Related ADR | Related Components | Related Skills |
|---|---|---|---|---|---|---|
| ESS-0001 | `crossReference:` | ✓ | ✓ | ✓ | ✓ | ✓ |
| ESS-0001-CONTRACTS | Markdown | ✓ | ✓ | ✓ | ✓ | ✓ |
| ESS-0002 | `crossReference:` | ✓ | ✓ | ✓ | ✓ | ✓ |
| ESS-0003 | `crossReference:` | ✓ | ✓ | ✓ | ✓ | ✓ |
| ESS-0010 | `crossReference:` | ✓ | ✓ | ✓ | ✓ | ✓ |
| ESS-0011 | `crossReference:` | ✓ | ✓ | ✓ | ✓ | ✓ |
| ESS-0011-CONTRACTS | Markdown | ✓ | ✓ | ✓ | ✓ | ✓ |
| ESS-0012 | `crossReference:` | ✓ | ✓ | ✓ | ✓ | ✓ |
| ESS-0012-CONTRACTS | Markdown | ✓ | ✓ | ✓ | ✓ | ✓ |
| SKILL-GOV-0001 | `crossReference:` | ✓ | ✓ | ✓ | ✓ | ✓ |

Vollständig — zehn von zehn Artefakten unter `.ai/skills/`.

---

# Nummernvergabe

Die ESS Registry unter `.ai/registry/ess-registry.json` ist die alleinige Quelle der
Nummernvergabe.

Verbindlich gilt ESS-0001-CONTRACTS Chapter 16, *ESS Registry Contract*:

- Jede ESS-Nummer wird genau einmal vergeben.
- Vergebene Nummern werden niemals umbenannt.
- Reservierte Nummern werden niemals abweichend belegt.
- Neue Dokumente erhalten die nächste freie Nummer.
- Zwischennummern sind nicht zulässig.
- Kein KI-System vergibt Nummern eigenständig.

**Stand 2026-07-31**

| Bereich | Zustand |
|---|---|
| ESS-0001 bis ESS-0003 | vergeben |
| ESS-0004 bis ESS-0009 | reserviert durch ESS-0001, unverändert |
| ESS-0010, ESS-0011 | vergeben |
| freier Nummernraum | ab **ESS-0012** |

---

# Prüfung vor Neuanlage

Vor der Anlage eines neuen ESS-Dokumentes ist verbindlich zu prüfen:

✓ Ist der Regelbereich bereits durch ein bestehendes Dokument abgedeckt?

✓ Wäre das neue Dokument ein Duplikat im Sinne von *Zero Duplication*?

✓ Ist die nächste freie Nummer aus der Registry verwendet?

✓ Ist eine Dokumentklasse zugewiesen?

✓ Sind sämtliche fünf Referenzfelder befüllt?

✓ Ist die Verantwortung in dieser Matrix ergänzt?

✓ Existiert ein ADR für die Nummernvergabe?

Wird eine dieser Prüfungen nicht bestanden, ist das Dokument nicht anzulegen.

---

# Automatisierte Durchsetzung

Die in dieser Matrix festgelegten Zuordnungen sind maschinell prüfbar.

Die Prüfung erfolgt künftig durch den `DocumentResponsibilityValidator` als Bestandteil der
Validatoren aus ESS-0001-CONTRACTS Chapter 12.

Zu prüfen sind

doppelte Verantwortlichkeiten

widersprüchliche Regeln

konkurrierende Standards

fehlende Referenzen

Es ist **kein** neuer Contract erforderlich — die Prüfungen sind bereits durch Chapter 3,
Chapter 7, Chapter 12, Chapter 15 und Chapter 16 gedeckt.

Der Validator gehört in Umsetzungsstufe 4 aus
`docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md`.

---

# Related Documents

`docs/architecture/ESS_CONSOLIDATION_REPORT.md` — ARCH-CONSOL-0001

`.ai/registry/ess-registry.json`

ADR-0012 — ESS Documentation Responsibility Consolidation

ESS-0001-CONTRACTS Chapter 1, Chapter 16, Chapter 20

---

# Version History

| Version | Status | Beschreibung |
|---|---|---|
| 1.0.0 | Initial Release | Verbindliche Verantwortungszuordnung für sieben ESS-Dokumente |

---

# End of Document

ARCH-RESP-0001

CAPITAL-AI ESS Responsibility Matrix

Version 1.0.0
