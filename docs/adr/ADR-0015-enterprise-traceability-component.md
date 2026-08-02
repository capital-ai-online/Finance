# ADR-0015: Einführung der Traceability-Komponente als Plattformmodul

## Status

**Accepted**

## Implementation-Status

🟡 **IN PROGRESS** — Stufen 1 bis 4 sind inzwischen codebasiert umgesetzt und getestet.
Das ursprüngliche ADR beschrieb die Komponente zum Entscheidungszeitpunkt noch als nicht
implementiert; dieser Zustand ist überholt.

**Verifiziert am 2026-08-02:**

1. **Stufe 1–2 umgesetzt:** Discovery, Models, Builder, CoverageAnalyzer, OrphanDetector,
   Registry und Reporter verarbeiten reale Repository-Quellen und erzeugen die Enterprise
   Traceability Matrix sowie Coverage-/Orphan-Artefakte.
2. **Stufe 3 teilweise umgesetzt:** sechs reale Traceability-Events werden über die Enterprise
   Event Mesh veröffentlicht. Die im Manifest deklarierten Consume-Events werden noch nicht
   abonniert; `CoverageThresholdViolatedEvent` und `OrphanResolvedEvent` werden bewusst nicht
   synthetisch erzeugt, solange die dafür notwendigen Laufzeitbedingungen fehlen.
3. **Stufe 4 umgesetzt:** generische Validator-Basisklasse und
   `traceabilityMatrixValidator.ts` sind produktiv im Traceability-Lauf verdrahtet.
4. `npm run traceability:build` ist ausführbar und Bestandteil des Repository-Toolings.
5. TypeScript-/Vitest-/Predeploy-Prüfungen wurden in den zugehörigen Implementierungs-Commits
   erfolgreich ausgeführt.

**Noch offen für COMPLETE:**

- die vollständige event-getriebene Consume-Seite der Traceability-Komponente;
- die vorgesehenen Coverage-Threshold-Transitions mit realem Zustandsvergleich;
- `OrphanResolvedEvent` auf Basis zweier persistierter Läufe;
- der weitergehende Knowledge-Graph-/Digital-Twin-Ausbau, soweit er für die vollständige
  Zielarchitektur aus ESS-0011/ESS-0001-CONTRACTS benötigt wird;
- vollständige Reife-/Acceptance-Verifikation aller in ESS-0011 vorgesehenen Achsen.

Die Komponente bleibt deshalb korrekt im aktiven ADR-Ordner und wird **nicht** nach
`resolved/` verschoben.

## Datum

2026-07-31

## Verantwortlich

Platform Director

## Betroffene Artefakte

`src/platform/Traceability/`

`docs/traceability/`

`.ai/registry/ess-registry.json`

`docs/architecture/ESS_RESPONSIBILITY_MATRIX.md`

---

## Kontext

ESS-0011 und ESS-0011-CONTRACTS spezifizieren die Enterprise Traceability Matrix seit
ADR-0013 vollständig. Es fehlte zunächst der **Ort** ihrer Umsetzung: Die Spezifikation nennt
`src/platform/Registry`, `Knowledge` und `Architecture` als verwandte Komponenten, ohne eine
eigene Komponente zu definieren.

Ohne eigene Komponente müsste die Matrixlogik auf drei bestehende Module verteilt werden.
Das verstößt gegen ESS-0001-CONTRACTS Chapter 3 (*eine Verantwortung, genau ein
Verzeichnis*) und würde die Zuständigkeit für die Matrix dauerhaft unklar lassen.

Zusätzlich fordert Chapter 2 für jedes neue Plattformmodul einen ADR.

---

## Entscheidung

### 1. Traceability wird eigenständiges Plattformmodul

```text
src/platform/Traceability/
  Contracts/  Core/       Discovery/  Events/
  Interfaces/ Models/     Registry/   Reports/
  Services/   Validators/ Versioning/
```

Die Struktur folgt der in der Aufgabenstellung geforderten Aufteilung. Jedes Unterverzeichnis
besitzt genau eine Verantwortung gemäß Chapter 3.

### 2. Einordnung als Querschnittsmodul mit erweitertem Zugriff

Die ETM benötigt Zugriff auf Core, Shared, Registry, Knowledge, Discovery und Documentary —
mehr als Chapter 16 für gewöhnliche Querschnittsmodule zulässt (nur Core und Shared).

Chapter 16 kennt für genau diesen Fall bereits eine Regelung: **Release** besitzt erweiterten
Zugriff, „da es deren Ergebnisse zusammenführt“. Die ETM ist derselbe Fall.

Sie wird daher analog eingeordnet. **Die Layer-Hierarchie aus Chapter 6 bleibt unverändert**;
es wird keine neue Ebene eingeführt.

Verboten bleiben Abhängigkeiten auf Supervisor und Platform Director — die Kommunikation nach
oben erfolgt ausschließlich über Enterprise Events.

### 3. Vollständiger Metadatensatz als Referenzimplementierung

Die Komponente führte als erste im Repository einen vollständigen Metadatensatz nach dem damals
gültigen Governance-Modell ein, einschließlich `manifest.json`, `component.yaml`, `CHANGELOG.md`
und belegter README-Dokumentation.

Dieses Muster wurde später auf weitere Plattformkomponenten übertragen und durch zusätzliche
Manifest-Integrity-Tests abgesichert.

### 4. `docs/traceability/` als operative Ebene — bewusst ohne Spezifikationsinhalt

Die Dokumente beschreiben **Betrieb, Anwendung und Nachvollzug**. Sie enthalten ausdrücklich
**keine** normative Spezifikation und **keine** neuen Regeln.

| Ebene | Ort |
|---|---|
| Spezifikation | ESS-0011 |
| Regelwerk | ESS-0011-CONTRACTS |
| operative Doku | `docs/traceability/` |
| Implementierung | `src/platform/Traceability/` |

Damit bleibt die Trennung zwischen normativer Spezifikation und operativer Dokumentation erhalten.

### 5. Kein neues ESS-Dokument

ESS-0011 und ESS-0011-CONTRACTS existieren bereits und decken den Regelbedarf vollständig ab.
Eine erneute Anlage wäre ein Duplikat gewesen.

---

## Implementierungsfortschritt nach der Entscheidung

### Stufe 1–2 — umgesetzt

Die spätere Implementierung führte reale, repository-basierte Verarbeitung ein:

- Discovery der ESS-Registry, ADR-Historie, Komponenten-Manifeste und Tests;
- Models für Traceability-Entitäten und Beziehungen;
- Builder für die Matrix;
- CoverageAnalyzer;
- OrphanDetector;
- Registry;
- Reporter;
- Ausgabe nach `.ai/knowledge/traceability/` und `docs/traceability/`.

Die Implementierung erzeugt keine erfundenen Relationen, sondern leitet Links ausschließlich aus
real vorhandenen Repository-Artefakten ab.

### Stufe 3 — teilweise umgesetzt

`Services/runTraceability.ts` veröffentlicht reale Events über die Enterprise Event Mesh,
darunter:

- `TraceabilityBuildStartedEvent`;
- `TraceabilityBuildCompletedEvent`;
- `TraceabilityBuildFailedEvent`;
- `CoverageCalculatedEvent`;
- `OrphanDetectedEvent`;
- `TraceabilityReportGeneratedEvent`.

Nicht künstlich veröffentlicht werden:

- `CoverageThresholdViolatedEvent`, solange kein vertraglich wirksamer Threshold-Zustandsübergang
  berechnet wird;
- `OrphanResolvedEvent`, solange kein belastbarer Vergleich zweier Läufe die Auflösung belegt.

Die im Manifest vorgesehenen Consume-Events sind weiterhin nicht vollständig abonniert. Deshalb ist
Stufe 3 noch nicht als vollständige Event-Driven-Integration abgeschlossen.

### Stufe 4 — umgesetzt

`Validators/baseValidator.ts` stellt eine generische Validator-Basisklasse bereit;
`traceabilityMatrixValidator.ts` ist als konkrete Implementierung in den Traceability-Lauf
integriert.

### Stufe 5 / Zielarchitektur — offen

Der ursprünglich als harte Voraussetzung formulierte Knowledge-Graph-/Digital-Twin-Blocker war für
die ersten vier Ausbaustufen zu streng: die real vorhandenen Registry-, ADR-, Manifest- und
Testquellen reichen für eine belastbare erste ETM aus.

Für die **vollständige Zielarchitektur** bleiben Knowledge-Graph-/Digital-Twin-Beziehungen jedoch
offen. Dieser Punkt wird nicht als bereits erfüllt dargestellt.

---

## Alternativen

**A) Matrixlogik auf Registry, Knowledge und Architecture verteilen.**  
Verworfen. Verstößt gegen Chapter 3 und würde die Zuständigkeit für die Matrix dauerhaft aufteilen.

**B) Traceability als Unterkomponente von Documentary.**  
Verworfen. Die ETM verknüpft auch Artefakte außerhalb der Documentary Engine — ADRs, Exceptions,
Tests, Releases und Komponentenmetadaten.

**C) Neue Layer-Ebene für Traceability einführen.**  
Verworfen. Chapter 6 definiert die Hierarchie abschließend; Chapter 16 deckt den benötigten
Querschnittszugriff bereits ab.

**D) `docs/traceability/` mit Spezifikationsinhalt füllen.**  
Verworfen. Das wäre ein Duplikat zu ESS-0011 / ESS-0011-CONTRACTS.

---

## Konsequenzen

### Positiv

- Die ETM besitzt einen eindeutigen Ort und eine eindeutige Zuständigkeit.
- Matrix-, Coverage- und Orphan-Artefakte werden real aus Repository-Quellen erzeugt.
- Traceability ist an die Enterprise Event Mesh angebunden, ohne nicht belegte Zustandsereignisse
  zu simulieren.
- Eine generische Validator-Basis ist vorhanden.
- Die Trennung Spezifikation / operative Doku / Implementierung bleibt erhalten.

### Negativ / Aufwand

- Die vollständige Event-Consume-Seite ist noch offen.
- Knowledge Graph und Digital Twin sind für die endgültige Enterprise-Zielarchitektur noch nicht
  produktiv verfügbar.
- Coverage-/Orphan-Zustandsübergänge benötigen persistierte Vergleichsbasis, bevor die dazugehörigen
  Events ehrlich ausgelöst werden können.

### Neutral

- Der aktualisierte ADR-Status ändert keine fachliche Scoring-, Billing-, Auth- oder Datenbanklogik.
- Die ursprüngliche Architekturentscheidung bleibt bestehen; nur der tatsächliche
  Implementierungsfortschritt wird nachgezogen.

---

## Folgeentscheidungen / verbleibende Arbeit

1. Event-Subscriptions für die in ESS-0011 vorgesehenen Consume-Events implementieren, sofern die
   jeweiligen realen Producer vorhanden sind.
2. Persistierten Vergleich zwischen Traceability-Läufen etablieren, bevor
   `OrphanResolvedEvent` aktiviert wird.
3. Coverage-Threshold-Policy versionieren und erst danach
   `CoverageThresholdViolatedEvent` produktiv aktivieren.
4. Knowledge-Graph-/Digital-Twin-Achsen ergänzen, sobald deren reale Komponenten und Contracts
   implementiert sind.
5. Danach vollständige ESS-0011-Acceptance durchführen und erst bei vollständigem PASS nach
   `docs/adr/resolved/` verschieben.

---

## Implementierungs-Evidence

- Commit `964379f81607f4f7686b2891e5d8ffa0101b56ac` — Traceability Stufe 1–2.
- Commit `665d46f42da4fbd61b0fe818b4026678f90f1c9a` — EventMesh-Anbindung und Validator-Basis.
- `src/platform/Traceability/manifest.json` — aktueller Implementierungsstand und Event-Grenzen.
- `tests/unit/traceabilityValidator.test.ts` sowie weitere Traceability-Tests.
- `npm run traceability:build` — operativer Buildpfad.

---

## Referenzen

- ESS-0011 — Enterprise Traceability
- ESS-0011-CONTRACTS — Link Contract, Coverage, Orphans
- ESS-0001-CONTRACTS — Chapter 2, 3, 6, 7, 9, 12, 16, 19
- ESS-0012-CONTRACTS — Governance-/Traceability-Regeln
- ADR-0013 — ESS Documentation Responsibility Consolidation
- ADR-0014 — Documentation Governance Validator
- ADR-0018 — Enterprise Event Mesh
- `docs/traceability/` — operative Dokumentation
- `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` — Umsetzungsstufen
