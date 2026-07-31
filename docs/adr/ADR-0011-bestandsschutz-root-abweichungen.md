# ADR-0011: Bestandsschutz und Zielstruktur für die Root-Abweichungen `server/`, `sql/` und `server.ts`

## Status

**Accepted**

## Implementation-Status

🟡 **IN PROGRESS** — Die Ausnahmen sind registriert und damit vertragskonform getragen
(`.ai/registry/exception-registry.json`).

**Vier von acht Ausnahmen sind aufgelöst:**

| ID | Pfad | Aufgelöst am | Nachweis |
|---|---|---|---|
| EXC-0003 | `sql/` | 2026-07-30 | `docs/migration/MIGRATION_EXC-0003_sql_to_supabase.md` |
| EXC-0005 | `ORCHESTRATORS_AND_SCORING_ENGINES.md` | 2026-07-31 | `docs/migration/MIGRATION_EXC-0005_EXC-0007_root_docs.md` |
| EXC-0007 | `favicon.svg` | 2026-07-31 | `docs/migration/MIGRATION_EXC-0005_EXC-0007_root_docs.md` |

EXC-0003: byteidentische Überführung nach `supabase/migrations/20260730000000_user_quota.sql`,
Verzeichnis entfernt. Dabei wurde FND-EXC-0003-01 festgestellt — die Migration ist im
aktuellen Codebestand verwaist (`src/lib/freeTierLimits.ts` existiert nicht und hat nie
existiert). Klärung, ob `public.user_quota` in der Zielumgebung Daten enthält, steht aus.

EXC-0005: byteidentische Überführung nach `docs/architecture/`. Die in ADR-0011 zusätzlich
vorgesehene Ergänzung von ESS-/ADR-Referenzen wurde bewusst nicht miterledigt, um die
Prüfsumme als Nachweis der reinen Strukturverlagerung zu erhalten (bleibt unter GAP-029 offen).

EXC-0007: byteidentische Überführung nach `public/`. `index.html` war unverändert lassbar, da
die Referenz bereits root-absolut (`/favicon.svg`) war. Dabei wurde FND-EXC-0007-01
aufgedeckt: da `public/` zuvor leer war und Vite ausschließlich `publicDir` nach `dist/`
kopiert, gelangte das Favicon vermutlich nie in den Produktions-Build. Diese Migration behebt
den Fehler als Nebeneffekt der Strukturkonformität.

**Drei Ausnahmen bleiben mit Permanent-Status bestehen** (EXC-0004, EXC-0006, EXC-0008) —
das ist der beabsichtigte Endzustand, keine offene Arbeit.

**EXC-0001 und EXC-0002 bestehen unverändert fort.** Ihre Überführung ist Gegenstand der
Umsetzungsstufen 3, 9 und 11 aus `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md`
(Enterprise Event Bus, Security & Compliance, Legacy Migration) und wurde bewusst nicht
begonnen — siehe Abschnitt *Bewertung von EXC-0001/EXC-0002* unten. Die maschinelle
Überwachung sämtlicher Ausnahmen setzt zudem den Structure Validator aus Chapter 12 voraus,
der noch nicht implementiert ist.

## Datum

2026-07-30

## Verantwortlich

Platform Director

## Betroffene Pfade

`server/`, `server.ts`, `sql/`, `AGENTS.md`, `ORCHESTRATORS_AND_SCORING_ENGINES.md`,
`index.html`, `favicon.svg`, Toolchain-Konfiguration im Root

---

## Kontext

ESS-0001-CONTRACTS Chapter 2 definiert die zulässigen Root-Verzeichnisse abschließend:

```text
.ai/  docs/  scripts/  src/  supabase/  tests/  public/  dist/
```

Als Root-Dokumente sind ausschließlich `README.md`, `CHANGELOG.md`, `LICENSE`,
`CODE_OF_CONDUCT.md` und `CONTRIBUTING.md` zugelassen. Chapter 2 legt zusätzlich fest, dass
`src/` den gesamten Quellcode der Plattform enthält.

Das Repository weicht davon an mehreren Stellen ab. Die Abweichungen bestanden bereits vor
Einführung des Enterprise Standards. Mit ADR-0010 wurde Chapter 16 (Repository Governance)
verabschiedet, wodurch diese Abweichungen erstmals formal sichtbar werden:

> Nicht dokumentierte Abweichungen sind Befunde der Stufe Critical.
> — ESS-0001-CONTRACTS Chapter 16, *Root Governance*

Betroffen sind acht Positionen, dokumentiert als GAP-006 in
`docs/architecture/ARCHITECTURE_GAP_REPORT.md`.

Die schwerwiegendste Position ist `server/`: dort liegt der vollständige produktive
Backend-Code, darunter vier Komponenten, die ESS-0001 Chapter 2 (*Existing Documentary
Detection*) ausdrücklich vor Neuentwicklung schützt — `documentHygiene.ts`,
`systemEvents.ts`, `versionManager.ts` und `decisionEngine.ts`.

Damit besteht ein Zielkonflikt zwischen zwei verbindlichen Regeln:

- Chapter 2 fordert sämtlichen Quellcode unter `src/`.
- ESS-0001 Chapter 2 untersagt die Neuentwicklung produktionsreifer Bestandskomponenten.

Beide Regeln bleiben gültig. Chapter 14 (*Legacy Contract*, *Adapter Contract*) löst den
Konflikt auf, setzt jedoch eine registrierte Ausnahme als Zwischenzustand voraus.

---

## Entscheidung

### 1. Sämtliche acht Root-Abweichungen werden als Ausnahmen registriert

Die Registrierung erfolgt in `.ai/registry/exception-registry.json` gemäß Exception Contract
aus Chapter 16 mit den dort geforderten Feldern: Exception ID, betroffener Pfad, verletzter
Contract, Begründung, Risiko, Zielzustand, Verantwortlicher, ADR-Referenz und Status.

| ID | Pfad | Status | Frist | Risiko |
|---|---|---|---|---|
| EXC-0001 | `server/` | Time Limited | 2027-01-31 | Medium |
| EXC-0002 | `server.ts` | Time Limited | 2027-01-31 | High |
| EXC-0003 | `sql/` | Time Limited | 2026-09-30 | Low |
| EXC-0004 | `AGENTS.md` | Permanent | — | Low |
| EXC-0005 | `ORCHESTRATORS_AND_SCORING_ENGINES.md` | Time Limited | 2026-09-30 | Low |
| EXC-0006 | `index.html` | Permanent | — | Low |
| EXC-0007 | `favicon.svg` | Time Limited | 2026-09-30 | Low |
| EXC-0008 | Toolchain-Konfiguration (10 Dateien) | Permanent | — | Low |

Damit wandelt sich GAP-006 von einem nicht registrierten Critical-Befund in ein bewusst
getragenes, überwachtes und mit Zielzustand versehenes Risiko. Die Abweichung besteht
unverändert fort — sie ist ab sofort lediglich vertragskonform dokumentiert.

### 2. Kein produktiver Code wird im Rahmen dieser Entscheidung verschoben

Diese Entscheidung verschiebt keine einzige Datei. Sie registriert den Ist-Zustand und legt
den Zielzustand fest. Jede tatsächliche Verlagerung erfolgt ausschließlich als Migration
gemäß Chapter 14 — mit Impact Analyse, Reihenfolge, Validierung und Rollback-Plan.

**Begründung:** `server.ts` wird unmittelbar von `package.json` (`dev`, `build`) und dem
`Dockerfile` referenziert. Eine Verlagerung ohne gleichzeitige Anpassung von Build, Container
und Deployment unterbricht den Wirkbetrieb. Chapter 14 verbietet Migrationen ohne
Rollback-Strategie ausdrücklich.

### 3. Drei Ausnahmen erhalten Permanent-Status

`AGENTS.md`, `index.html` und die Toolchain-Konfiguration verbleiben dauerhaft im Root.

Der Grund ist in allen drei Fällen derselbe: Werkzeugbindung. Die Dateien werden von ihrer
jeweiligen Werkzeugkette ausschließlich im Repository-Root gelesen. Eine Verlagerung würde
ihre Wirkung aufheben, ohne einen Vorteil zu erzeugen.

Für die Toolchain-Konfiguration kommt hinzu, dass ESS-0001 Chapter 2 `package.json`,
`package-lock.json`, `tsconfig.json`, `vite.config.*`, `Dockerfile`, `.env.example` und
`render.yaml` ausdrücklich als im Root zu erkennende Konfigurationsdateien führt und ihre
dortige Lage damit voraussetzt. Die Root-Regel in Contracts Chapter 2 zielt auf Dokumente
und Quellcode, nicht auf Werkzeugkonfiguration.

Permanent-Status entbindet nicht von der Überwachung. Die Positionen bleiben in der Registry
geführt und werden vom Structure Validator geprüft.

### 4. `sql/` wird als Duplikat behandelt, nicht nur als Strukturabweichung

`sql/` enthält genau eine Datei: `001_user_quota.sql`. Für denselben Artefakttyp existiert
bereits `supabase/migrations/` mit `20260711000000_iam.sql`.

Damit liegt zusätzlich zu Chapter 2 eine Verletzung von Chapter 2 (*File Placement Rules*)
und Chapter 3 (eine Verantwortung, genau ein Verzeichnis) vor: Migrationen sind auf zwei
Orte verteilt. Eine Migration kann dadurch übersehen oder doppelt ausgeführt werden.

Diese Position besitzt die kürzeste Frist und das beste Aufwand-Nutzen-Verhältnis aller acht
Ausnahmen — eine Datei, ein Zielort, geringes Risiko.

### 5. Zielstruktur für `server/`

Die Zuordnung folgt ausschließlich den in Chapter 3 definierten Verzeichnisverantwortlichkeiten.
Sie legt fest, wohin eine Komponente gehört — nicht, wann sie dorthin überführt wird.

| Bestand | Zielkomponente | Contract-Grundlage |
|---|---|---|
| `documentHygiene.ts` | `src/platform/Documentary/` | Chapter 3 — Documentary Directory |
| `documentSanitizer.ts` | `src/platform/Documentary/` | Chapter 3 |
| `fileWatcher.ts` | `src/platform/Documentary/Discovery/` | ESS-0001 Chapter 2 |
| `decisionEngine.ts` | `src/platform/Documentary/Engine/` | Chapter 3 |
| `systemEvents.ts` | `src/platform/Events/` + `src/platform/Telemetry/` | Chapter 8, Chapter 12 |
| `versionManager.ts` | `src/platform/VersionManager/` | Chapter 9 |
| `iam/` (5 Dateien) | `src/platform/Security/` | Chapter 11 |
| `stepUp.ts` | `src/platform/Security/` | Chapter 11 |
| `stripe.ts` | `src/features/billing/` | Chapter 2 — Feature Isolation |
| `mailer.ts` | `src/features/notifications/` | Chapter 2 |
| `ai.ts` | `src/features/ai/` bzw. AI Gateway | Chapter 2, Chapter 10 |
| `orchestrator.ts` | `src/features/<domain>/` | Chapter 2 |
| `db.ts` | `src/platform/Shared/` | Chapter 3 — Shared Layer |
| `env.ts`, `ownerConfig_server.ts` | `src/config/` | Chapter 2 — Configuration |

Bis zur Überführung erfolgt die Anbindung ausschließlich über Adapter gemäß Chapter 14: Der
Adapter kapselt die Legacy-Implementierung vollständig, veröffentlicht ausschließlich
Enterprise Interfaces, erzeugt Enterprise Events — und verändert die Legacy-Implementierung
nicht.

### 6. Reihenfolge der Auflösung

| Reihenfolge | Ausnahme | Voraussetzung |
|---|---|---|
| 1 | EXC-0003 `sql/` | keine — sofort umsetzbar |
| 2 | EXC-0005, EXC-0007 | keine — reine Verlagerung |
| 3 | EXC-0001 `server/` | Event Bus (Stufe 3), Adapter-Fähigkeit (Stufe 11) |
| 4 | EXC-0002 `server.ts` | EXC-0001 überwiegend abgeschlossen |

`server.ts` wird zuletzt aufgelöst, weil sich sein Umfang mit jeder aus `server/` überführten
Komponente verringert. Eine frühe Verlagerung würde denselben Aufwand mehrfach erzeugen.

---

## Alternativen

**A) Abweichungen unregistriert lassen.**
Verworfen. Chapter 16 stuft nicht dokumentierte Abweichungen als Critical ein. Der Zustand
wäre dauerhaft nicht konform, ohne dass ein Weg zur Auflösung existierte.

**B) Chapter 2 ändern und `server/` sowie `sql/` als zulässige Root-Verzeichnisse aufnehmen.**
Verworfen. Das wäre eine Änderung am Enterprise Standard zur Anpassung an einen Ist-Zustand.
Chapter 2 trifft eine bewusste Architekturaussage — sämtlicher Quellcode unter `src/`. Eine
Aufweichung würde die Feature Isolation und die Layer-Zuordnung gleichermaßen entwerten und
für jede künftige Abweichung als Präzedenzfall dienen.

**C) Sofortige Verlagerung des gesamten Backends.**
Verworfen. Verletzt Chapter 14 (keine Migration ohne Impact Analyse und Rollback) und
gefährdet den Wirkbetrieb. `server.ts` allein umfasst 1.934 Zeilen und ist direkt an Build,
Container und Deployment gebunden.

**D) Sämtliche Ausnahmen als Permanent führen.**
Verworfen. Permanent-Status ist ausschließlich bei Werkzeugbindung gerechtfertigt. Für
`server/`, `server.ts` und `sql/` besteht keine solche Bindung; ein Permanent-Status wäre
lediglich ein dauerhafter Verzicht auf die Zielarchitektur.

---

## Konsequenzen

### Positiv

- GAP-006 ist aufgelöst: aus einem nicht registrierten Critical-Befund wird ein registriertes,
  befristetes und mit Zielzustand versehenes Risiko.
- Der Zielkonflikt zwischen Chapter 2 und ESS-0001 Chapter 2 ist entschieden, ohne eine der
  beiden Regeln zu verändern.
- Für jede der 15 Dateien unter `server/` existiert erstmals eine verbindliche Zielkomponente.
- Die Auflösungsreihenfolge ist festgelegt; `sql/` ist sofort umsetzbar.
- Die Exception Registry ist angelegt und kann vom Structure Validator unmittelbar ausgewertet
  werden, sobald dieser existiert.

### Negativ / Aufwand

- Vier Ausnahmen tragen Fristen. Läuft eine Frist ohne Auflösung ab, entsteht gemäß Chapter 16
  automatisch ein Befund. Die Fristen sind damit eine bewusst gesetzte Verpflichtung.
- Die Überwachung der Registry setzt den Structure Validator (Chapter 12) voraus. Bis dahin
  erfolgt die Prüfung manuell — die Registry ist bis dahin eine Zusage, keine Durchsetzung.
- Die Zielstruktur für `server/` bindet 14 Überführungen an Chapter 14 und erzeugt damit
  Migrationsaufwand, der zuvor nicht ausgewiesen war.

### Neutral

- Kein produktiver Code wurde geändert oder verschoben. Der Wirkbetrieb ist unberührt.
- Die vier durch ESS-0001 geschützten Documentary-Komponenten bleiben unverändert und werden
  gekapselt, nicht neu entwickelt.

---

## Bewertung von EXC-0001/EXC-0002 zum Stand 2026-07-31

Bei der Umsetzung der übrigen sechs Ausnahmen wurde geprüft, ob EXC-0001 (`server/`) und
EXC-0002 (`server.ts`) im selben Arbeitsgang aufgelöst werden können. Das Ergebnis ist Nein —
und zwar aus genau den Gründen, die dieses ADR für sie selbst bereits festgehalten hat.

**Befund**

`server/` enthält 15 Dateien, deren Zielkomponenten sich über sechs verschiedene Bereiche
verteilen (`Documentary`, `Events`, `Telemetry`, `VersionManager`, `Security`,
`src/features/*`, `src/config/`). `server.ts` (1.934 Zeilen) verdrahtet sämtliche dieser
Module zu einer laufenden Express-Anwendung und wird direkt von `package.json` (`dev`,
`build`) und dem `Dockerfile` referenziert. Darunter befindet sich sicherheitskritischer
Code — `server/iam/` (Authentifizierung, Rate Limiting, Secret-Verschlüsselung, TOTP) und
`server/stripe.ts` (Zahlungsverkehr).

Eine Verlagerung dieser Art ist keine Structural Migration wie bei EXC-0003, EXC-0005 und
EXC-0007. Dort genügte ein reiner Git-Rename mit Prüfsummenvergleich, weil jeweils genau eine
Datei ohne Code-Abhängigkeiten betroffen war. Hier stehen dem gegenüber:

- Import-Pfade in `server.ts` und in sämtlichen 15 verschobenen Dateien müssten gleichzeitig
  umgeschrieben werden.
- Der Enterprise Event Bus, über den die Zielkomponenten laut Chapter 8 und Chapter 17
  kommunizieren sollen, existiert nicht — die Module könnten am neuen Ort nicht in die
  vertraglich vorgesehene Architektur eingebettet werden, sondern nur erneut als loses
  Dateikonvolut.
- Der Adapter-Mechanismus aus Chapter 14, der die Legacy-Implementierung kapseln soll, ohne
  sie zu verändern, setzt Enterprise Interfaces voraus, die ebenfalls nicht existieren.
- Ein Fehler in Authentifizierung oder Zahlungsverkehr wäre, anders als bei den bisherigen vier
  Ausnahmen, keine Dokumentations- oder Struktur-Regression, sondern ein Sicherheits- oder
  Compliance-Vorfall.

**Entscheidung**

EXC-0001 und EXC-0002 werden mit diesem ADR **nicht** aufgelöst. Sie werden im
Ausnahmestatus `Time Limited` bis 2027-01-31 belassen, wie bereits festgelegt.

Diese Entscheidung ist keine Abweichung von ADR-0011 — sie ist seine Bestätigung: ADR-0011
hat die Reihenfolge selbst vorgegeben (Abschnitt *Reihenfolge der Auflösung*) und EXC-0001
sowie EXC-0002 ausdrücklich als von Stufe 3 (Event Bus) und Stufe 11 (Legacy Migration)
abhängig markiert. Diese Stufen sind nicht Gegenstand dieses ADR und wurden im Rahmen dieser
Arbeit nicht umgesetzt.

**Nächster zulässiger Schritt**

Sobald der Enterprise Event Bus (Stufe 3) und mindestens ein funktionierender Adapter-Mechanismus
(Stufe 11) vorliegen, kann für `server/` ein eigener Migrationsplan mit Impact Analyse,
Reihenfolge je Datei und Rollback-Strategie gemäß Chapter 14 erstellt werden. Bis dahin bleibt
`server/` unverändert im Wirkbetrieb.

---

## Folgeentscheidungen

Nicht Gegenstand dieser Entscheidung und weiterhin offen:

1. Versionshoheit und Auflösung der vier widersprüchlichen Versionsstände, einschließlich der
   abweichenden Versionsangabe in `metadata.json` (GAP-019).
2. Zielstruktur der Domänenlogik aus `src/agents`, `src/orchestrator`, `src/services` nach
   `src/features/<domain>` (GAP-009). Betrifft `src/`, nicht den Root, und wird gesondert
   entschieden.
3. Konkrete Migrationspläne je Ausnahme mit Impact Analyse und Rollback gemäß Chapter 14.

---

## Referenzen

- ESS-0001 — Chapter 2 (*Existing Documentary Detection*, Konfigurationsdateien)
- ESS-0001-CONTRACTS — Chapter 2, Chapter 3, Chapter 11, Chapter 14, Chapter 16
- ADR-0010 — Enterprise Standard Extension (Einführung Chapter 16)
- ADR-0003.5 — Owner-IAM (betrifft `server/iam/`, Implementation-Status COMPLETE)
- `.ai/registry/exception-registry.json`
- `docs/architecture/ARCHITECTURE_GAP_REPORT.md` — GAP-006, GAP-009, GAP-020, GAP-029
- `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` — Umsetzungsstufen 3, 9, 11
