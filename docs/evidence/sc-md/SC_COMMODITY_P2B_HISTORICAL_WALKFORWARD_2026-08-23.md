# SC Commodity P2-B — Historical Point-in-Time & Walk-forward Evidence

**Datum:** 2026-08-23  
**Status:** IMPLEMENTATION EVIDENCE — validation-only / non-authorizing  
**Branch:** `feat/commodity-p2b-historical-walkforward-2026-08-23`  
**Start-Baseline:** `main@14e4f3c8a309faae63fb336a432aac38ab08ceda`  
**Parent authority:** ADR-0087, ADR-0101, `SC-MD-SPT-0001`  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md` — P2-B  
**Source package:** Owner-/Google-Drive Commodity-Orchestrator-Dokumentation vom 2026-08-23  
**Vorgänger:** PR #518 / Merge `14e4f3c8a309faae63fb336a432aac38ab08ceda`

## 1. Ziel

Dieser Scope schließt die Lücke zwischen den in PR #518 eingeführten P2-B-Contracts und einer tatsächlich reproduzierbaren historischen Out-of-Sample-Validierung. Er implementiert **keine produktive Commodity-Scoring-Engine** und verändert weder `ScoringDispatcher`, `ScoringModelRegistry`, `CanonicalScoreResult`, Ranking noch den aktuellen Commodity-Champion.

Der Historical Executor konsumiert ausschließlich bereits historisierte und versionierte Point-in-Time-Daten. Provider-Netzwerkzugriff, Datenbeschaffung und API-Schlüssel bleiben außerhalb dieses Executors.

## 2. Implementierte Contracts

### Historical Dataset

`commodity-historical-dataset/1.0.0`

Pflichtbindung:

- `datasetId` / `datasetVersion`;
- Model-/Universe-Identität;
- `normalizationContractVersion`;
- immutable Historical Observations;
- `decisionAt`, `realizedAt`, `realizedReturn`;
- Confidence;
- historische Universe-Membership-Evidence;
- Normalization-Evidence;
- bestehender `CommodityPointInTimeFeatureSnapshot`;
- normalisierte Latent-Factor-Werte;
- Raw-Feature → Latent-Factor-Evidence-Bindung;
- Benchmark-Definitionen und evidenzgebundene Benchmark-Returns;
- `authority=VALIDATION_ONLY`.

### Walk-forward Execution

`commodity-walk-forward-validation/1.0.0`

Unterstützt:

- `walk-forward`;
- `expanding-window`;
- Mindestzahl historischer Trainingsbeobachtungen;
- `minConfidence` vor Split-Bildung;
- strikt temporale Train/Test-Grenzen;
- Outcome-Availability-Gate;
- Top-N-Selektion;
- versionierte Commission-/Slippage-/Spread-Annahmen;
- Champion- und naive Benchmark-Abdeckung;
- deterministische OOS-Evidence-ID.

## 3. Point-in-Time / Leakage-Grenzen

Eine Beobachtung ist nur für Historical Validation verwendbar, wenn:

1. Feature-Evidence die bestehende PIT-Policy erfüllt (`observedAt`, `availableAt`, `retrievedAt`);
2. CFTC-/EIA-/USDA-Release-/Revision-Lineage nach bestehendem Contract vorhanden ist;
3. historische Universe-Zugehörigkeit separat belegt ist;
4. der Normalisierungsschritt über `normalizationEvidenceId` und `normalizationContractVersion` identifizierbar ist;
5. jede verwendete Raw-Evidence nur dem vorgesehenen Latent Factor zugeordnet ist;
6. Training `decisionAt < testDecisionAt` erfüllt;
7. zusätzlich `training.realizedAt <= testDecisionAt` gilt.

Punkt 7 verhindert Target-/Outcome-Leakage: Ein historisches Feature darf nicht als Trainingsfall gelten, wenn sein späterer Return zum Testzeitpunkt noch nicht bekannt war.

## 4. Reproduzierbarkeit

`validateCommodityHistoricalDataset()` erzeugt einen SHA-256-basierten `datasetFingerprint`. Gebunden werden insbesondere:

- Dataset-/Model-/Universe-Versionen;
- Normalisierungsvertrag;
- PIT-Evidence und Release-/Revision-Vintages;
- normalisierte Faktorwerte;
- Universe-Membership-Evidence;
- Normalization-Evidence;
- historische Outcomes;
- Benchmark-Definitionen/-Returns.

Damit kann ein Dataset-Identifier nicht stillschweigend mit geänderten historischen Inhalten wiederverwendet werden, ohne dass sich der Fingerprint ändert.

Die OOS-Evidence-ID `commodity-oos:<sha256>` bindet zusätzlich:

- Dataset-Fingerprint;
- Backtest Request;
- Candidate Weight Profile/Version;
- Cost Assumptions;
- Split-Identitäten;
- OOS-Portfolio-Returns;
- Benchmark-Summaries.

## 5. Weight- und Authority-Grenze

Für Historical Validation werden nur Profile akzeptiert, die bereits `validateCommodityCandidateWeightProfile()` passieren. Diese Profile bleiben:

- `status=research-candidate`;
- `executable=false`;
- `scoreEligible=false`.

Das numerische Anwenden eines Research-Candidate-Profils im Historical Replay dient ausschließlich der empirischen Validierung. Es autorisiert weder Runtime-Gewichte noch Champion-Promotion.

## 6. Metriken

Der Executor erzeugt ausschließlich Validation-Metriken:

- Rank Information Coefficient (Spearman);
- Rank Monotonicity;
- Top-N Hit Rate;
- annualisierte Rendite;
- annualisierte Volatilität;
- Max Drawdown;
- Profit Factor;
- Turnover;
- Average Holding Period;
- Regime-Diagnostik;
- Domain-Diagnostik;
- Benchmark-Summaries.

Kosten werden über versionierte Commission-/Slippage-/Spread-Basis-Punkte auf den gemessenen Portfolio-Turnover angewendet.

## 7. Benchmarks

Ein vollständiger Historical Dataset Contract verlangt mindestens:

1. `CURRENT_CHAMPION` — Referenz auf den zum Research-Zeitpunkt aktuellen Commodity-Champion;
2. `NAIVE_BASELINE` — einfache, fachlich dokumentierte Baseline.

Jede OOS-Testperiode benötigt für jeden definierten Benchmark einen zeitlich passenden evidenzgebundenen Return. Unvollständige Benchmark-Coverage blockiert das OOS-Evidence-Paket.

## 8. Negative Tests / Fail-Closed

`tests/unit/commodityHistoricalBacktestEngine.test.ts` deckt mindestens ab:

- PIT-Vintage erst nach `decisionAt` verfügbar → block;
- fehlende historische Universe-Membership-Evidence → block;
- fehlende Normalization-Evidence → block;
- Raw-Feature über mehrere Latent Factors wiederverwendet → block;
- fehlende naive/champion Benchmark-Definition → block;
- Outcome erst nach Testentscheidung realisiert → nicht für Training zulässig;
- `minConfidence` reduziert Train/Test-Menge vor Split-Bildung;
- weniger als zwei OOS-Testperioden → block;
- Dataset-Fingerprint ändert sich bei veränderter Historical Lineage;
- Walk-forward und expanding-window bleiben strikt pre-test;
- OOS-Evidence-ID ist bei identischem Input deterministisch;
- sämtliche Outputs bleiben `VALIDATION_ONLY`, `canonical=false`, `scoreEligible=false`.

## 9. Architektur-/Security-Befund

Keine neuen Dependencies. Kein Python-/Zipline-/Backtrader-/Vectorbt-Runtime-Stack. Keine Provider-, Datenbank-, Render-, Supabase-, Stripe-, IAM- oder Secret-Mutation.

Keine neue Authority:

- kein zweiter Dispatcher;
- keine zweite Model Registry;
- kein neuer Provider Gateway;
- kein Ranking-Writer;
- kein produktiver Domain Executor;
- kein automatischer Champion-Flip.

Der neue Executor ist pure/deterministische Validation-Logik auf bereits gebundenen Inputs.

## 10. Best-Practice-/State-of-the-Art-Abgleich

Der Scope folgt den für Model Validation relevanten Prinzipien:

- Point-in-Time/Vintage statt heutiger revidierter Daten für historische Entscheidungen;
- Out-of-Sample Walk-forward/expanding-window;
- keine Target-Leakage;
- explizite Universe-Evidence gegen Survivorship-Bias;
- Benchmarks;
- versionierte Kostenannahmen;
- reproduzierbare, content-addressed Evidence;
- Validation getrennt von produktiver Model Authority.

CFTC-Positioning wird weiterhin mit tatsächlicher Release-Availability behandelt; Dienstag-Observation darf nicht vor regulärer Freitagsveröffentlichung in historische Decision Snapshots gelangen.

## 11. Bewusst offene Folgepunkte

Dieser Scope **schließt P2-B strukturell, aber nicht empirisch für eine Modellpromotion ab**. Noch erforderlich sind insbesondere:

- reale Historical Dataset Acquisition aus den bereits governeden Provider-/Official-Evidence-Adaptern;
- belastbare Normalisierungs-/Transformation-Contracts pro Domain;
- reale Runs für Energy, Industrial Metals, Precious Metals und Agriculture;
- Stress-/Regime-Auswertung mit realen Marktperioden;
- empirische Correlation-/Sensitivity-Evidence auf denselben PIT-Datasets;
- Cost-/Slippage-Kalibrierung aus belastbarer Evidence;
- danach erst P2-C Promotion Package / Model Versioning.

Bis diese Evidence vorliegt, bleiben alle vier Commodity-Kategorie-Challenger nicht produktiv.

## 12. Pre-PR-Validierungsstatus

- Hosted CI vor PR: **nicht ausgelöst**.
- Source-/Contract-Review: laufend / vor PR abzuschließen.
- Branch basiert auf `main@14e4f3c8a309faae63fb336a432aac38ab08ceda`.
- Roadmap-Issues wurden in diesem Scope **nicht verändert**.
- Finaler Main-/Open-PR-/Production-Sync ist unmittelbar vor PR erneut durchzuführen.
