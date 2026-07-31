# ADR-0013: Documentation Governance Validator als Kernkomponente der Documentary Engine

## Status

**Accepted**

## Implementation-Status

🟡 **IN PROGRESS** — Spezifikation, Regelwerk, Verzeichnisstruktur, Metadaten und Skill sind
vollständig. Die **Implementierung** ist nicht begonnen und setzt die Umsetzungsstufen 1 bis 4
aus `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` voraus (Schemata, Core/Interfaces,
Enterprise Event Bus, Validator-Basisklasse).

Bis dahin sind die 57 Regeln aus ESS-0012-CONTRACTS manuell anzuwenden und als manuell
gekennzeichnet zu dokumentieren.

## Datum

2026-07-31

## Verantwortlich

Platform Director

## Betroffene Artefakte

`src/platform/Documentary/Governance/` (neu, 8 Unterverzeichnisse)

`.ai/skills/ESS-0012-Documentation-Governance.md` (neu)

`.ai/skills/ESS-0012-Contracts.md` (neu)

`.ai/skills/Documentation-Governance-Validator.md` (neu)

`.ai/registry/ess-registry.json` (fortgeschrieben)

`docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` (erweitert)

---

## Kontext

Die Plattform beschreibt sich seit ESS-0010 selbst (Documentary Engine) und verknüpft ihre
Artefakte seit ESS-0011 bidirektional (Traceability Matrix). Sie **prüft sich jedoch nicht
selbst**.

ESS-0001-CONTRACTS Chapter 12 definiert zwar 16 Pflichtvalidatoren, diese prüfen jedoch
Struktur und Schema — nicht die semantische Widerspruchsfreiheit der Governance-Dokumente
untereinander. Konkret ungeprüft blieben bislang:

- doppelte und widersprüchliche ESS-Regeln über Dokumentgrenzen hinweg
- widersprüchliche, veraltete oder undokumentierte ADRs
- doppelte, widersprüchliche und nicht referenzierte Contracts
- Breaking Changes ohne ADR
- aggregierte Governance- und Repository-Reife

Diese Lücke ist nicht theoretisch. Sämtliche bisherigen Befunde dieser Sitzung — GAP-006
(nicht registrierte Strukturabweichungen), GAP-013 bis GAP-015 (fehlende Metadaten), GAP-019
(vier widersprüchliche Versionsstände), K-02 (Nummernkonflikt), K-08 (fehlende
Cross-References) — wurden **manuell** gefunden. Keiner davon wäre durch eine bestehende
automatisierte Prüfung aufgefallen.

Zusätzlich wächst der Regelbestand: nach ADR-0010 (Chapter 11–20) und ADR-0012 (ESS-0010,
ESS-0011) umfasst der Standard sieben ESS-Dokumente mit 20 Contract-Kapiteln. Ohne
maschinelle Prüfung skaliert die manuelle Konsistenzsicherung nicht.

---

## Entscheidung

### 1. Anlage der Komponente unter `Documentary/Governance/`

Der Governance Validator wird als Unterkomponente der Documentary Engine geführt:

```text
src/platform/Documentary/Governance/
  Contracts/  Validators/  Rules/  Services/
  Reports/    Events/      Models/ Interfaces/
```

**Abweichung von der Aufgabenformulierung.** Die auslösende Aufgabe listete
`Governance/`, `Contracts/`, `Validators/`, `Reports/`, `Rules/`, `Events/`, `Services/`,
`Models/`, `Interfaces/` als Geschwister direkt unter `Documentary/`.

Fünf dieser Verzeichnisse — `Contracts/`, `Validators/`, `Events/`, `Models/`, `Interfaces/` —
existieren dort bereits und sind in ESS-0001-CONTRACTS Chapter 2 mit eigener Verantwortung
belegt. Eine erneute Anlage auf gleicher Ebene wäre entweder wirkungslos oder würde
Chapter 3 verletzen (*eine Verantwortung, genau ein Verzeichnis*).

Die Unterordnung unter `Governance/` erhält die Absicht der Aufgabe vollständig, vermeidet
die Kollision und lässt die bestehende Documentary-Struktur unverändert.

Neu angelegt wurden ausschließlich `Governance/` und dessen acht Unterverzeichnisse. Damit
ist dies eine Strukturerweiterung nach Chapter 2 und Chapter 16 — der vorliegende ADR erfüllt
die dortige ADR-Pflicht.

### 2. ESS-0012 und ESS-0012-CONTRACTS

Die Notwendigkeitsprüfung nach der Prüfliste aus `ARCH-RESP-0001` ergab, dass die
semantische Governance-Prüfung von keinem bestehenden Dokument abgedeckt ist. Der
Nachweis ist in ESS-0012, Abschnitt *Notwendigkeitsnachweis*, tabellarisch geführt.

Beide Dokumente sind scharf abgegrenzt. Sie enthalten **nicht**:

| Inhalt | Verbleibt in |
|---|---|
| Validator-Basisvertrag, Severity, Quality Gates | Chapter 12 |
| Coverage-Schwellwerte, Orphan-Klassen | ESS-0011-CONTRACTS |
| Twin-Zustände, Drift-Toleranz | Chapter 18 |
| Knoten- und Beziehungsregeln | Chapter 15 |
| Metadaten-Pflichtfelder | Chapter 7 |
| Event-Namenskonvention | Chapter 8 |

ESS-0012-CONTRACTS definiert 57 Regeln in neun Bereichen mit stabilen IDs (`GOV-<AREA>-<NNN>`),
Nachweispflicht und deterministischem Scoring.

### 3. ADR-Nummer 0013 statt 0011

**Abweichung von der Aufgabenformulierung.** Die Aufgabe nannte „ADR-0011 Documentation
Governance Validator". ADR-0011 ist jedoch bereits vergeben (*Bestandsschutz und Zielstruktur
für die Root-Abweichungen*, gemergt über PR #2). ADR-0012 ist ebenfalls vergeben
(ESS-Konsolidierung).

ESS-0001-CONTRACTS Chapter 16 legt fest: *„Vergebene Nummern werden niemals umbenannt"* und
*„ADR-Nummern sind vierstellig und fortlaufend"*. Die nächste freie Nummer ist **ADR-0013**.

### 4. Read-Only-Prinzip

Der Validator besitzt **keinen** Schreibzugriff auf Quellcode, Dokumentation, Metadaten,
Registry, Knowledge Graph, Digital Twin, ESS- oder ADR-Dokumente. Er schreibt ausschließlich
in seinen eigenen Befund- und Berichtsspeicher.

**Begründung:** Eine Prüfinstanz, die den Prüfgegenstand verändert, kann ihn nicht mehr
unabhängig beurteilen. Dieselbe Trennung gilt bereits für den Supervisor (ESS-0002).

### 5. Rollentrennung

| Instanz | Rolle |
|---|---|
| Governance Validator | stellt fest |
| Supervisor | bewertet und eskaliert |
| Platform Director | entscheidet und empfiehlt |
| Version Manager | leitet Versionsauswirkung ab |

Der Validator blockiert selbst nicht, empfiehlt keine Version und erzeugt keine
Handlungsempfehlung. Er liefert ausschließlich Befunde und Kennzahlen.

### 6. Verbindlichkeit für alle KI-Systeme

Claude Code, Google AI Studio, ChatGPT und künftige Systeme verwenden denselben Validator und
dieselben Regeln. Eigene Prüfregeln, Deaktivierung von Regeln, Änderung von Schweregraden und
Prüfergebnisse ohne Ausführung sind unzulässig.

Dies konkretisiert Chapter 10 und Chapter 17 für die Dokumentations-Governance, ohne neue
AI-Governance-Regeln einzuführen.

---

## Alternativen

**A) Governance-Prüfungen in Chapter 12 ergänzen.**
Verworfen. Chapter 12 ist Teil des Master Enterprise Standard und regelt Validator-Grundlagen
global. 57 dokumentspezifische Regeln dort aufzunehmen hätte den globalen Standard mit
Detailregeln überfrachtet und der in `ARCH-RESP-0001` festgelegten Verantwortungsabgrenzung
widersprochen.

**B) Prüfungen in ESS-0011 (Traceability) unterbringen.**
Verworfen. ESS-0011 verknüpft Artefakte; es bewertet ihre inhaltliche Qualität nicht.
Die Vermischung hätte zwei Verantwortungen in einem Dokument erzeugt — genau das, was
ADR-0012 gerade beseitigt hat.

**C) Kein eigenes Dokument, Prüfregeln direkt im Skill.**
Verworfen. Ein Skill ist eine Handlungsanweisung ohne normative Wirkung. Regeln mit
Blockadewirkung für Produktionsfreigaben benötigen Contract-Rang.

**D) Sofortige Implementierung in TypeScript.**
Verworfen. Ohne Core, Interfaces, Models und Event Bus (Stufen 1–3) wäre der Validator ein
isoliertes Skript ohne Event-Anbindung, ohne Registry-Eintrag und ohne Twin-Integration — und
damit nach seinen eigenen Regeln `GOV-REPO-009` und `GOV-KG-001` selbst ein Governance-Verstoß.

---

## Konsequenzen

### Positiv

- Die semantische Governance-Prüfung ist erstmals spezifiziert und regelbasiert.
- 57 Regeln mit stabilen IDs, Nachweispflicht und deterministischem Scoring.
- Sämtliche bisher manuell gefundenen Befundklassen sind künftig maschinell erfassbar.
- Die Rollentrennung Validator/Supervisor/Director/Version Manager ist eindeutig.
- Alle KI-Systeme erhalten dasselbe Prüfregelwerk.
- Das neue Manifest erfüllt erstmals den vollständigen Metadata Contract aus Chapter 7
  (`layer`, `lifecycle`, `health`, `quality`, `security`, `ai`, `repository`) und dient als
  Referenz für die Nachpflege der 22 Bestandsmanifeste (GAP-015).

### Negativ / Aufwand

- 57 zusätzliche Regeln erhöhen den Implementierungsaufwand von Stufe 4 erheblich.
- Die Schwellwerte aus Chapter 3 (Governance Score ≥ 80, Repository Health ≥ 80) würden beim
  aktuellen Repository-Zustand **nicht erreicht** — die Regeln beschreiben einen Zielzustand,
  der zunächst systematisch verletzt wird. Das ist beabsichtigt und macht den Rückstand
  messbar, erzeugt aber bei Aktivierung zunächst eine große Befundmenge.
- Bis zur Implementierung ist die Prüfung manuell und damit weder vollständig noch
  reproduzierbar.

### Neutral

- Kein produktiver Code wurde verändert.
- Die bestehende Documentary-Struktur (19 Unterverzeichnisse) bleibt unangetastet.
- Kein bestehendes Dokument wurde inhaltlich überschrieben.

---

## Folgeentscheidungen

Nicht Gegenstand dieser Entscheidung:

1. Implementierung des Validators (Umsetzungsstufen 1–4).
2. Zeitpunkt der Aktivierung der Schwellwerte aus ESS-0012-CONTRACTS Chapter 3 — eine
   Aktivierung vor Behebung der Bestandsbefunde würde jede Produktionsfreigabe blockieren.
3. Nachpflege der 22 Bestandsmanifeste auf den vollständigen Metadata Contract (GAP-015).
4. `component.yaml` und `CHANGELOG.md` je Komponente (GAP-013, GAP-014) — beides ist durch
   `GOV-REPO-002` und `GOV-REPO-004` künftig prüfbar.

---

## Referenzen

- ESS-0012 — Documentation Governance
- ESS-0012-CONTRACTS — Documentation Governance Contracts, 57 Regeln
- `.ai/skills/Documentation-Governance-Validator.md` — SKILL-GOV-0001
- ESS-0010 — Documentary Engine
- ESS-0011 / ESS-0011-CONTRACTS — Enterprise Traceability
- ESS-0001-CONTRACTS — Chapter 2, 3, 7, 8, 9, 10, 12, 15, 16, 17, 18
- ADR-0010 — Enterprise Standard Extension
- ADR-0012 — ESS Documentation Responsibility Consolidation
- `docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` — ARCH-RESP-0001
- `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` — Umsetzungsstufen 1–4
