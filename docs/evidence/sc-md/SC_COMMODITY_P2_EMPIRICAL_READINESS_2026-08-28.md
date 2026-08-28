# SC-2 Commodity P2-A → P2-C — Empirical Evidence Readiness

**Datum:** 2026-08-28  
**Pull Request:** #576  
**Branch:** `feat/commodity-p2abc-evidence-pipeline-2026-08-28`  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md` → P2-A / P2-B / P2-C  
**Issues:** #499, #500  
**Authorities:** ADR-0087, ADR-0101 v1.1.0, ADR-0102

## 1. Zweck

Dieser Nachweis trennt die auf PR #576 bereits implementierte technische P2-A→P2-C-Composition von den weiterhin erforderlichen **realen empirischen Inputs**. Ein technischer Contract, ein Unit-Test oder ein aktueller API-Historienwert wird nicht als Ersatz für ein historisch tatsächlich verfügbares Point-in-Time-Vintage behandelt.

## 2. CI-/Governance-Fortführung auf PR #576

Der erste Hosted-CI-Lauf auf dem initialen PR-Head bestätigte:

- `npm ci`: PASS, keine gemeldeten Vulnerabilities;
- TypeScript/Lint (`tsc --noEmit`): PASS;
- `tests/unit/commodityP2EvidencePipeline.test.ts`: PASS;
- 355 Vitest-Dateien PASS, eine Governance-Datei FAIL;
- einziger fachfremder Blocker: Governance-Control-Plane-Registry-Konsistenz.

Die reproduzierten Governance-Fehler waren:

1. `REGISTRY_VERSION_MISMATCH`: ADR Registry `1.23.0`, Authority Registry projizierte noch `1.22.0`;
2. `ADR_AUTHORITY_UNRESOLVED`: `AUTH-ADR-COMMODITY-DOMAIN-RESEARCH-CHALLENGERS-2026-08-23` fehlte in `docs/governance/authority-registry.json`.

Die Fortführung auf diesem PR synchronisiert deshalb die Authority Registry mit ADR-0101/ADR Registry. Es wird keine Governance-Ausnahme oder Validator-Umgehung eingeführt.

## 3. Repository-Inventur — reale empirische Inputs

Der Repository-Abgleich zeigt:

- `src/services/commodityHistoricalArchiveEvidence.ts` implementiert content-addressed Archive-Manifeste, SHA-256-/Byte-Length-Verifikation, offizielle HTTPS-Origin-Gates und `CommodityVerifiedArchivedReleaseEvidence`;
- `src/services/commodityHistoricalOfficialAcquisition.ts` trennt aktuelle Historienabfragen von verifizierter Archived-Release-Evidence;
- `CommodityHistoricalVintage`, Dataset Assembly und Walk-forward/OOS sind vorhanden;
- Tests decken Archive-Tampering, PIT-BYPASS, Release-/Revision-Lineage und aktuelle History als non-PIT ab;
- im Repository wurden **keine persistierten realen Commodity-Archive-Payloads bzw. realen Domain-PIT-Datasets** gefunden. `commodity-archive:` ist im aktuellen Stand auf Contract-/Service-/Test-/Dokumentationsevidence begrenzt.

Damit ist der verbleibende Blocker empirisch und nicht mehr primär strukturell.

## 4. Primärquellen-Abgleich für die nächsten realen Captures

| Quelle | Offiziell verfügbare Historie | PIT-/Revision-Besonderheit | Repository-Status | Gate |
|---|---|---|---|---|
| CFTC COT | jährliche Historical-Compressed-Artefakte sowie Historical Viewable Reports | CFTC weist ausdrücklich darauf hin, dass Historical-Viewable-Daten das **Report Date**, nicht automatisch das Release Date, anzeigen; einzelne archivierte Reports tragen einen `Updated`-Veröffentlichungstag | Contracts/Verifier vorhanden, keine persistierten realen Bytes/Manifeste | OFFEN |
| USDA FAS PSD | API, Release Dates und pro Release erzeugte Download-Datasets | USDA weist darauf hin, dass Forecast-Werte über mehrere Market Years bei einem Release revidiert werden können; ein aktueller Wert beweist keinen früheren Vintage | aktuelle History wird korrekt non-PIT behandelt; keine release-spezifischen realen Captures | OFFEN |
| EIA | Open Data API v2 und Bulk-/Zeitreihendaten | aktuelle API-Historie ist historische Observation, aber ohne archivierten release-spezifischen Payload kein Beweis des damaligen Vintages | aktuelle History wird korrekt `CURRENT_HISTORY_ONLY`; keine realen Archived-Release-Captures | OFFEN |
| USGS MCS | versionierte jährliche Veröffentlichungen | Statistikjahr und Release-/Version-Verfügbarkeit sind getrennte Zeitachsen | Version-/Release-Contracts vorhanden; keine ausreichende reale Multi-Period-Domain-Serie | OFFEN |
| EU CRMA | regulatorische Methodik/Assessments | Economic Importance und Supply Risk bleiben getrennt; numerische PIT-Evidence benötigt versionierte Assessment-Evidence | Contracts vorhanden; keine reale historische Assessment-Serie | OFFEN |
| Market/Curve Evidence | provider-/market-spezifische historische Captures erforderlich | heutige Preis-/Curve-Historie darf keine unbekannte historische Availability erfinden | keine ausreichenden governed Historical Market/Curve Captures für vollständige Domain-Datasets | OFFEN |

## 5. P2-A — abgearbeitete und verbleibende Schritte

### Repository-verifizierbar erledigt

- Drive-Gewichte bleiben Research Hypothesis / non-executable;
- Latent-Factor Candidate Weight Validation;
- `WITHIN_LATENT_FACTOR_ONLY` Missing-Renormalisierung;
- Correlation-/Redundancy-/Double-Counting-Gates;
- Sensitivity/Weight-Stability;
- effective-feature/effective-weight Fingerprint-Lineage;
- PR #576 bindet Correlation-/Sensitivity-Evidence-IDs deterministisch in denselben P2-B/P2-C-Run.

### Empirisch weiterhin erforderlich

1. reale normalisierte PIT-Feature-Serien je Domain;
2. Correlation Report **auf exakt diesen PIT-Inputs**;
3. Candidate Weight Profile gegen Champion-/naive-/sinnvolle Single-Factor-Baselines;
4. kontrollierte Sensitivity-/Weight-Stability-Runs auf demselben Dataset;
5. persistierter Evidence-Nachweis der Ergebnisse und Fingerprints.

**Status #499:** OPEN. Das Exit Gate verlangt Backtest-, Sensitivity- und Correlation-Evidence; ohne reale PIT-Inputs wäre ein Schließen nicht evidenzkonform.

## 6. P2-B — abgearbeitete und verbleibende Schritte

### Repository-verifizierbar erledigt

- versionierter Backtest Run Contract;
- observedAt/availableAt/retrievedAt-Trennung;
- Release-/Revision-/Availability-Gates;
- immutable Dataset Fingerprint;
- Historical Universe Membership und Normalization Evidence Contracts;
- Walk-forward/Expanding-Window-OOS mit Outcome-Availability-Gate;
- versionierte Cost/Slippage/Spread-Annahmen;
- Rank IC, Rank Monotonicity, Hit Rate, Return/Risk, Drawdown, Turnover, Regime-/Domain-Diagnostik;
- Champion- und naive Benchmark Contracts;
- Archive Manifest/Byte-Integrity-Verifikation;
- PR #576 führt P2-B mit exakt denselben P2-A-Evidence-IDs aus und liefert ausschließlich bei gültigem Dataset einen OOS-Identifier.

### Empirisch weiterhin erforderlich

1. exakte, rechtmäßig verfügbare offizielle Archive-Payloads erfassen und kryptografisch manifestieren;
2. daraus `PIT_VERIFIED` Vintages erzeugen;
3. historische Universe Membership, Outcomes und Benchmark Returns source-backed binden;
4. Normalisierung leakage-safe aus dem jeweiligen Trainingsfenster erzeugen;
5. reale Walk-forward/OOS-Runs;
6. empirisch begründete Cost-/Slippage-Annahmen;
7. Regime-/Domain-Stability und Leakage Review.

**Status #500:** OPEN. Die Engine ist vorhanden, aber das Exit Gate ist ohne reale OOS-/Stress-/Leakage-Evidence nicht erfüllt.

## 7. P2-C — abgearbeitete und verbleibende Schritte

### Repository-verifizierbar erledigt

- immutable Model Descriptor;
- Descriptor-/Dataset-/Weight-/Evidence-Lineage;
- Provider-Resilience-Policy und Report;
- Stress-/Regime-Policy und Evidence;
- Champion/Challenger-Diff + Rollback Target;
- Promotion Review Package;
- exakte Human-Owner-Decision-Bindung an Package Fingerprint;
- keine Registry-/Dispatcher-/Ranking-/Execution-Mutation;
- PR #576 bindet den von P2-B tatsächlich erzeugten OOS-Identifier in Stress und Descriptor statt eine freie Caller-ID zu akzeptieren.

### Empirisch weiterhin erforderlich

- Provider Resilience aus einem belastbaren realen Beobachtungsfenster;
- Stress-/Regime-Resultate aus realen OOS-Datasets;
- vollständige P2-A-/P2-B-Evidence;
- erst danach `readyForOwnerReview=true`.

Eine technische P2-C-Reviewfähigkeit ist **keine** Champion-Promotion. Controlled Promotion bleibt separat und human-gated.

## 8. Warum keine aktuellen API-Werte als Ersatz eingecheckt werden

Die Primärquellen bestätigen die zentrale Zeitachsenproblematik:

- CFTC stellt Historical Reports bereit und unterscheidet Report Date von Veröffentlichung; historische Archive sind real, die Availability muss dennoch evidenzgebunden sein.
- USDA PSD weist explizit auf revisionsfähige Forecasts über mehrere Market Years hin und stellt Release-Date-Semantik bereit.
- EIA API v2 stellt offizielle historische Zeitreihen bereit, aber eine heutige Abfrage belegt nicht automatisch, welcher revidierte Wert zu einem früheren Entscheidungszeitpunkt verfügbar war.

Daher bleibt der Repository-Contract fail-closed: aktuelle History ist Research-Evidence, aber ohne historische Release-/Capture-Provenance nicht promotionsfähiges PIT-Evidence.

## 9. Ergebnis dieser Fortführung

Mit diesem PR können alle **repository-verifizierbaren** P2-A/P2-B/P2-C-Folgeschritte einschließlich CI-/Governance-Konsistenz, Composition, Lineage, Negativtests und Source-Readiness abgearbeitet werden. Die verbleibenden offenen Gates benötigen dagegen reale historische Payloads bzw. reale Beobachtungsfenster und werden nicht synthetisch erzeugt.

Das nächste zulässige Evidence-Artefakt ist ein durch `CommodityHistoricalArchiveManifest` an exakte offizielle Bytes gebundener Capture. Erst daraus dürfen reale Domain-PIT-Datasets und anschließend Correlation/Sensitivity/OOS/Stress-Resultate entstehen.
