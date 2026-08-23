# SC Commodity P2-B — Historical Vintage Acquisition & PIT Dataset Assembly Evidence

**Datum:** 2026-08-24  
**Status:** IMPLEMENTATION EVIDENCE — validation-only / non-authorizing  
**Branch:** `feat/commodity-p2b-historical-vintage-acquisition-2026-08-24`  
**Start-Baseline:** `main@cbae921a45e6bbac6bec3cae4433529046c2d4f6`  
**Parent authority:** ADR-0087, ADR-0101, SC-2 Commodity Roadmap  
**Vorgänger:** PR #519 / `commodity-historical-dataset/1.0.0` / `commodity-walk-forward-validation/1.0.0`  
**Source package:** Owner-/Google-Drive Commodity-Orchestrator-Dokumentation vom 2026-08-23

## 1. Ziel und Scope

PR #519 hat den deterministischen Historical Dataset-/Walk-forward/OOS-Consumer implementiert, aber Provider-Netzwerkzugriff bewusst ausgeschlossen. Dieses Arbeitspaket schließt die vorgelagerte Evidence-Lücke, ohne den Backtester zu einem Provider-Client oder zu einer zweiten Scoring-Authority zu machen.

Implementiert werden:

1. versionierter `CommodityHistoricalVintage`-Contract;
2. source-spezifische Evidence-Grades und PIT-Policies;
3. historische EIA-/USDA-/CFTC-Akquise über den bestehenden `ResearchEvidenceProviderHttp`;
4. archivierter Release-Capture als expliziter Upgrade-Pfad zu `PIT_VERIFIED`;
5. versionierte USGS Annual Releases und EU-CRMA Assessments;
6. `assembleCommodityHistoricalDataset()` als einzige Brücke zur in PR #519 gemergten Historical Validation Engine;
7. Fail-closed Negativtests gegen Retroactive-History-, Release-, Revision- und Availability-Leakage.

Bewusst **nicht** enthalten:

- produktive Commodity-Gewichte;
- Dispatcher-/Registry-/Ranking-/CanonicalScoreResult-Änderungen;
- Persistenz-/Datenbankmigration für Archive;
- Render-/Supabase-/Stripe-Mutation;
- automatische Modellpromotion;
- Legacy-Retirement;
- P2-C/P2-D/P2-E/P3-Runtime-Aktivierung.

## 2. Kernproblem: Historical Value ist nicht Historical Vintage

Ein Provider kann heute einen Wert für einen alten Zeitraum zurückgeben. Daraus folgt nicht automatisch, dass genau dieser Wert — inklusive damaliger Revision — am früheren Entscheidungszeitpunkt verfügbar war.

Der neue Contract trennt daher:

```text
observedAt   = wirtschaftlicher / statistischer Bezugszeitpunkt
availableAt  = erster belegter Zeitpunkt, ab dem genau dieser Vintage bekannt sein konnte
retrievedAt  = Zeitpunkt der konkreten Akquise / Archivabfrage
```

`PIT_VERIFIED` ist kein Caller-Boolean. Der Evidence-Grad wird aus Provider-Policy, Acquisition Mode, Zeitreihen-Lineage sowie Release-/Revision-/Availability-Evidence abgeleitet.

## 3. Evidence Grades

| Grade | Semantik | In PR-#519-PIT-Dataset zulässig |
|---|---|---:|
| `PIT_VERIFIED` | exakter Vintage mit belegter Availability/Release-Lineage | Ja |
| `CURRENT_HISTORY_ONLY` | heutige Abfrage historischer Werte, damaliger Vintage nicht belegt | Nein |
| `REFERENCE_STATIC` | versionierte Referenz/Methodik, aber für den konkreten PIT-Fall unvollständige Release-/Revision-Evidence | Nein |
| `INVALID` | Contract-/Zeit-/Wertfehler | Nein |

`commodityHistoricalVintageToPointInTimeValue()` liefert ausschließlich für `PIT_VERIFIED` einen PIT-Feature-Wert. Der Dataset-Assembler lehnt jeden anderen Grade explizit ab; er verwirft oder promoted ihn nicht stillschweigend.

## 4. Source-Truth-Matrix

| Quelle | Live-/Current-History-Akquise | PIT-Promotion-Regel | Implementierter Pfad |
|---|---|---|---|
| EIA API v2 | historische Perioden über governed Series-ID/Date-Range | aktuelle API-Historie bleibt `CURRENT_HISTORY_ONLY`; PIT benötigt archivierten Release-Capture inkl. Release + Revision + Availability Evidence | `fetchEiaCurrentHistoricalVintages`, `buildArchivedOfficialHistoricalVintages` |
| USDA FAS PSD | Market-Year-Historie + `dataReleaseDates` | aktuelle PSD-Historie bleibt wegen revisionsfähiger Forecasts `CURRENT_HISTORY_ONLY`; PIT benötigt release-spezifischen Capture inkl. Revision | `fetchUsdaCurrentHistoricalVintages`, `buildArchivedOfficialHistoricalVintages` |
| CFTC COT PRE | Historical Disaggregated Futures Only Rows | `report_date` ist Observation, nicht Availability; heutige PRE-Historie bleibt `CURRENT_HISTORY_ONLY`; PIT benötigt archiviertes Report-Artefakt mit realem Publikationszeitpunkt | `fetchCftcHistoricalVintages` |
| USGS MCS | Annual/Versioned Release | Statistikjahr = Observation; Release-/Versionsdatum = Availability; PIT nur ab dokumentierter Release-Verfügbarkeit | `buildUsgsHistoricalReleaseVintages` |
| EU CRMA | regulatorische Methodik / versioniertes Assessment | EI/SR bleiben getrennt; numerical PIT benötigt veröffentlichte versionierte Assessment-Evidence | `buildEuCrmaHistoricalAssessmentVintages` |
| Governed Market/Curve Capture | Marktdaten-/Futures-Capture | PIT bei gebundenem Capture-/Availability-Nachweis und korrekter Instrumentidentität | `CommodityHistoricalVintage` Policy |

## 5. Primärquellen-Abgleich

### EIA

Die aktuelle EIA API v2 unterstützt Series-/Route-Abfragen und historische Date-Range-Parameter. Ein heute abgefragter alter Datenpunkt bleibt jedoch eine aktuelle API-Repräsentation; der Code behauptet deshalb nicht, damit sei der historische Veröffentlichungs-Vintage bewiesen.

Referenz: `https://www.eia.gov/opendata/documentation.php`

### USDA FAS PSD

USDA PSD stellt `dataReleaseDates` bereit und weist in der API-/Release-Semantik darauf hin, dass Forecast-/Market-Year-Daten bei Releases über mehrere Jahre revidiert werden können. Deshalb bindet dieses Arbeitspaket heutige PSD-Historie nicht rückwirkend als PIT-Evidence.

Referenz: `https://apps.fas.usda.gov/opendatawebV2/`

### CFTC

CFTC stellt historische Commitments-of-Traders-Daten/Compressed Reports bereit. Für den Backtest bleibt der Report-Beobachtungstag von der Veröffentlichung getrennt. Der Code leitet `availableAt` ausdrücklich **nicht** nur aus einer angenommenen Friday-Regel ab; `PIT_VERIFIED` verlangt Evidence des veröffentlichten/archivierten Report-Artefakts.

Referenzen:

- `https://www.cftc.gov/MarketReports/CommitmentsofTraders/HistoricalCompressed/index.htm`
- PRE Dataset `72hh-3qpy`

### USGS MCS

Mineral Commodity Summaries erscheinen als datierte/versionierte Releases. Ein Statistikwert für ein Vorjahr ist für PIT erst ab Veröffentlichung der jeweiligen Release verfügbar. Der Adapter trennt deshalb Statistikjahr (`observedAt`) und Release-Verfügbarkeit (`availableAt`).

Referenz: `https://doi.org/10.5066/P1WKQ63T`

### EU CRMA

Regulation (EU) 2024/1252 behandelt Economic Importance und Supply Risk als getrennte Dimensionen und verwendet mehrjährige Datenbasen. Der Code übernimmt keine regulatorische Methodik als erfundenen Zahlenwert, sondern verlangt eine versionierte numerical Assessment-Evidence.

Referenz: `https://eur-lex.europa.eu/eli/reg/2024/1252/oj`

## 6. Architektur

```text
Official / Governed Historical Source
  -> existing ProviderMatrix / ResearchEvidenceProviderHttp (für HTTP-Quellen)
  -> CommodityHistoricalVintage
       -> policy-derived Evidence Grade
       -> observedAt / availableAt / retrievedAt
       -> release / revision / availability evidence
       -> content fingerprint
  -> Archived / Versioned Release Evidence
  -> PIT_VERIFIED only
  -> Commodity Historical Normalization Artifact
  -> assembleCommodityHistoricalDataset()
  -> validateCommodityHistoricalDataset()   [PR #519]
  -> Walk-forward / Expanding OOS            [PR #519]
  -> Validation-only Evidence
```

Nicht eingeführt wurden:

- zweiter Provider-Gateway;
- zweite DQ-Authority;
- zweite Model Registry;
- zweiter Scoring Dispatcher;
- neue DB/Persistenz;
- neue Netzwerkfähigkeit im Backtest-Executor.

## 7. Datenintegritätskontrollen

### 7.1 Policy statt Caller-Promotion

`evidenceGrade` wird intern abgeleitet. `LIVE_API_CURRENT_HISTORY` kann unabhängig von altem `observedAt` niemals `PIT_VERIFIED` werden.

### 7.2 Temporal Ordering

Ungültig sind mindestens:

- `observedAt > availableAt`;
- `availableAt > retrievedAt`;
- PIT Vintage mit `availableAt > decisionAt` im Dataset-Assembler.

### 7.3 Provider-spezifische Pflicht-Evidence

- EIA: Release + Revision + Availability Evidence.
- USDA PSD: Release + Revision + Availability Evidence.
- CFTC: Release + Availability Evidence; Revision nicht pauschal erzwungen.
- USGS MCS: Annual Release + Version/Revision + Availability Evidence.
- EU CRMA: versioniertes numerical Assessment + Release/Revision + Availability Evidence.

### 7.4 Keine stille Datenbereinigung

Nicht-PIT-Vintages werden nicht aus einer Decision entfernt, damit ein Backtest nachträglich valide aussieht. Die gesamte Decision Assembly blockiert stattdessen fail-closed.

### 7.5 Normalisierungs-Lineage

Dataset Assembly akzeptiert nur eine explizite `normalizationContractVersion` und `normalizationEvidenceId`. Die Acquisition-Schicht berechnet selbst keine faktorübergreifenden Normalisierungen und keine Gewichte.

## 8. Implementierte Negativ-/Regressionstests

`tests/unit/commodityHistoricalVintage.test.ts`

- alle offiziellen Retroactive-Live-APIs sind nicht implizit PIT-fähig;
- alte EIA-Perioden aus heutiger API bleiben `CURRENT_HISTORY_ONLY`;
- EIA-Archive ohne Revision bleiben `REFERENCE_STATIC`;
- Dataset Assembly blockiert jeden `CURRENT_HISTORY_ONLY`-Vintage;
- vollständige Energy-PIT-Decision kann in den bestehenden immutable Historical Dataset Contract überführt werden;
- annual/versioned Release Availability bleibt zeitlich vom Statistikjahr getrennt.

`tests/unit/commodityHistoricalOfficialAcquisition.test.ts`

- EIA Current History bleibt non-PIT;
- USDA Current History bleibt non-PIT und nutzt den offiziellen `API_KEY`-Header;
- archivierter USDA Release mit Release/Revision/Availability wird PIT-fähig;
- CFTC Current PRE History bleibt non-PIT; archiviertes Report-Artefakt wird PIT-fähig;
- USGS Statistikjahr und Release-Availability werden getrennt;
- CRMA Economic Importance und Supply Risk bleiben separate versionierte Features.

## 9. Security / Compliance / Governance

- keine Secrets im Repository;
- keine neue IAM-/Credential-Authority;
- keine externe Schreibmutation;
- keine Datenbank-/Schemaänderung;
- keine produktive Modellpromotion;
- keine Runtime-Gewichte;
- alle Historical Outputs `canonical=false`, `scoreEligible=false` bzw. nur Validation-Inputs;
- HTTP-Akquise nutzt die bestehende Rate-Limit-/Circuit-Breaker-/Provider-Health-Infrastruktur;
- aktuelle mutable Provider-Historie wird ausdrücklich nicht als revisionssicher dargestellt.

## 10. Noch offene empirische Datensätze

Dieses Paket schafft den sicheren Akquise-/Assembly-Pfad. Es legt **keine erfundenen oder aus heutigen mutable APIs rückprojizierten PIT-Datensätze** ins Repository.

Für echte empirische Runs fehlen als nachfolgende Evidence-Arbeit noch:

1. archivierte EIA Release-Captures für freigegebene Energy-Series;
2. archivierte USDA PSD Release-Snapshots je Commodity/Market-Year;
3. CFTC Historical Report-Artefakte mit belastbarer Publication-/Capture-Evidence;
4. gewünschte ältere USGS MCS Releases inklusive Version/Publication Metadata;
5. veröffentlichte/versionierte CRMA numerical Assessment-Reihen, sofern für die Commodity-Domäne verwendet;
6. governed Historical Market/Curve Captures;
7. leakage-safe, versionierte Normalisierungs-/Transformationsevidence;
8. Historical Universe Membership und Outcome-/Benchmark-Evidence.

Erst wenn diese Inputs `PIT_VERIFIED` sind, werden daraus echte P2-B-Datasets für Energy, Agriculture, Industrial/Precious Metals assembled und mit der PR-#519-Walk-forward-Engine ausgeführt.

## 11. Nächster technischer Schritt nach Merge dieses Pakets

Der nächste kohärente Schritt ist **Historical Archive Manifest + erste empirische Domain-Dataset-Pipeline**:

1. archive/capture manifests content-addressed versionieren;
2. zunächst eine kleine Energy- und Agriculture-Stichprobe mit echten Release-Artefakten aufbauen;
3. governed Market/Outcome-/Universe-Evidence zeitlich ausrichten;
4. Normalisierung ausschließlich aus dem jeweiligen Trainingsfenster fitten und als eigenes Evidence-Artefakt speichern;
5. erste reale Walk-forward/OOS-Runs erzeugen;
6. Correlation-/Sensitivity-Evidence auf exakt denselben PIT-Datasets berechnen;
7. erst danach P2-C Promotion Package bewerten.

## 12. Validierungsstatus vor PR

- Branch vom gemergten `main@cbae921a45e6bbac6bec3cae4433529046c2d4f6`: ja.
- Roadmap-Issues mutiert: nein.
- neue Runtime-/Scoring-Authority: nein.
- externe Plattformmutation: nein.
- neue Dependencies: nein.
- Hosted CI vor PR: nein.
- statische Source-/Contract-/Scope-Prüfung: erforderlich vor PR-Abschluss.
