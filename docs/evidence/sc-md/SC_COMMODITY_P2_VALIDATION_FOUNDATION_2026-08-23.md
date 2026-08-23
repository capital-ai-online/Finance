# SC Commodity P2 — Validation Foundation Evidence

**Datum:** 2026-08-23  
**Status:** IMPLEMENTATION EVIDENCE — non-authorizing  
**Branch:** `feat/commodity-p2-validation-foundation-2026-08-23`  
**Start-Baseline:** `main@b35c86dfc9e038c629377d0d9a0761df1a65d663`  
**Parent authority:** ADR-0087, ADR-0101, `SC-MD-SPT-0001`  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md`  
**Work Items:** #499 P2-A, #500 P2-B  
**Source package:** Owner-/Google-Drive Commodity-Orchestrator-Dokumentation vom 2026-08-23

## 1. Ziel und Scope

Dieses Arbeitspaket baut die Validierungsgrundlage zwischen den in P0/P1 eingeführten Commodity-Research-Challengern und einer späteren P2/P3-Promotion auf. Es verändert weder den produktiven Commodity-Champion noch `ScoringDispatcher`, Ranking oder `CanonicalScoreResult`.

Implementiert werden:

1. P2-A: nicht-produktive Weight-/Correlation-Governance auf Latent-Factor-Ebene;
2. P2-A: Sensitivity-/Weight-Stability-Evidence und bestehende effective-weight-Fingerprint-Lineage;
3. P2-B: versionierter Backtest-Request-/Result-Contract;
4. P2-B: Point-in-Time-/Release-/Revision-Leakage-Gates;
5. P2-B: versionierte, weiterhin nicht-ausführbare Cost-/Slippage-Annahmen;
6. Promotion-Evidence-Completeness als Review-Gate, niemals als automatische Promotion.

Bewusst **nicht** enthalten:

- produktive Gewichtsausführung;
- neue Commodity-Scoring-Engine;
- Dispatcher-/Ranking-/Canonical-Result-Änderungen;
- vollständiger historischer Backtest-Executor oder ein zweiter Backtesting-Stack;
- tatsächliche empirische Kalibrierung/Promotion eines Challengers;
- P2-C/P2-D/P2-E oder P3.

## 2. Drive-Referenz und Übernahmeentscheidung

Die Owner-Dokumentation definiert für die vier Commodity-Domänen folgende Research-Gruppengewichte:

| Faktorgruppe | Energie | Industriemetalle | Edelmetalle | Agrar |
|---|---:|---:|---:|---:|
| Commodity Fundamentals | 35 % | 35 % | 25 % | 45 % |
| Technische Struktur | 20 % | 20 % | 20 % | 15 % |
| Makro-Regime | 15 % | 20 % | 25 % | 10 % |
| Sentiment / Positioning | 10 % | 10 % | 15 % | 10 % |
| Risiko / Liquidität | 20 % | 15 % | 15 % | 20 % |

Diese Werte bleiben unverändert als `research-hypothesis`, `executable=false`. Die Implementierung expandiert die fünf Owner-Gruppen **nicht automatisch** auf einzelne Features. Die vorhandenen Commodity-Contracts besitzen bereits fachlich konkretere `latentFactor`- und `correlationGroup`-Zuordnungen. Eine Zuordnung der Owner-Gruppengewichte auf diese Faktoren benötigt reale P2-Korrelation-, Sensitivitäts- und Point-in-Time-Backtest-Evidence.

Die Drive-Dokumentation definiert außerdem einen Backtest-Vertrag mit `modelId`, `modelVersion`, `universeId`, `assetClass`, `domains`, Zeitraum, Rebalance, Holding Period, Top-N, Confidence sowie Result-Metriken und Equity Curve. Dieser Vertrag wird übernommen und um die für reproduzierbare Enterprise-Validierung nötige Point-in-Time-, OOS- und Kosten-Lineage erweitert.

## 3. Best-Practice-/State-of-the-Art-Abgleich

### Model Risk Management

Die aktuelle US-amerikanische Interagency Guidance **SR 26-2 — Supervisory Guidance on Model Risk Management** behandelt Outcome Analysis einschließlich Backtesting als wesentlichen Teil der Modellvalidierung und fordert laufendes Monitoring sowie dokumentierte Modellgrenzen. Daraus folgt für CAPITAL-AI: ein Challenger darf nicht allein aufgrund einer plausiblen Gewichtsmatrix produktiv werden; Gewichtung und Modellverhalten benötigen unabhängige historische Outcome-Evidence.

### NIST AI RMF

NIST AI RMF / Measure verlangt quantitative und qualitative Evaluation, dokumentierte Unsicherheit, Benchmarks und nachvollziehbare Test-/Monitoring-Ergebnisse. Die P2-Verträge binden deshalb Modell-/Contract-Versionen und Evidence-IDs, anstatt einen unversionierten Backtest-Output zu erzeugen.

### CFTC Point-in-Time

Commitments-of-Traders-Daten beziehen sich regulär auf Positionen vom Dienstag und werden üblicherweise erst am Freitag veröffentlicht. Deshalb trennt der PIT-Contract:

- `observedAt` — wirtschaftlicher Beobachtungszeitpunkt;
- `availableAt` — erster Zeitpunkt, an dem genau dieser Wert/Vintage tatsächlich verfügbar war;
- `retrievedAt` — Zeitpunkt, an dem CAPITAL-AI den Wert abgerufen hat.

Für die historische Entscheidung ist `availableAt <= decisionAt` maßgeblich. Ein Dienstagwert darf nicht bereits am Mittwoch in einen Backtest eingehen, wenn die Veröffentlichung erst Freitag erfolgte.

### Revisionsfähige Fundamentals

USDA FAS PSD und EIA können Datenstände bzw. Forecast-/Fundamental-Vintages revidieren. Für diese Quellen sind deshalb `releaseId` und `revisionId` verpflichtend. Ein späterer API-Abruf darf in einem historischen Backtest nur verwendet werden, wenn der exakte damals verfügbare Vintage identifiziert ist.

## 4. Wiederverwendung statt Parallelarchitektur

### Effective scoring fingerprint

`src/platform/Scoring/scoringFingerprint.ts` bleibt die einzige Authority für `effectiveFeatureFingerprint` und `effectiveWeightFingerprint`. P2 verwendet `buildEffectiveScoringFingerprintMetadata()` auch für Faktor-Level-Candidate-Weights; es entsteht kein zweiter Hash-/Lineage-Mechanismus.

### Bestehende Commodity Contracts

Die P0/P1-Verträge liefern bereits:

- `latentFactor`;
- `correlationGroup`;
- Feature Contract Version;
- Evidence-/DQ-Version;
- `research-hypothesis` Owner-Gewichte;
- `scoreEligible=false`.

P2 erweitert diese Strukturen und definiert keine zweite Model Registry.

### Open Source / Plugins

Für diesen Scope ist keine zusätzliche Quant-/Backtesting-Library erforderlich. Ein zusätzlicher Python-/Quant-Stack würde Dependency-, Supply-Chain-, Lizenz- und Architekturkomplexität erhöhen, ohne die heute benötigten Contracts/Gates besser abzudecken. Die vorhandenen TypeScript-Verträge, Vitest und Scoring-Lineage werden wiederverwendet. Verfügbare Plugins wurden geprüft; kein spezialisiertes Model-Validation-/Backtesting-Plugin stand zur Verfügung.

## 5. P2-A — Correlation & Double-Counting Control

`CommodityModelValidation.ts` führt folgende nicht-produktive Verträge ein:

- `commodity-weight-validation/1.0.0`;
- `commodity-correlation-policy/1.0.0`;
- `commodity-weight-stability/1.0.0`.

### Normalisierte Korrelationsserien

Korrelationsdiagnostik akzeptiert ausschließlich `NORMALIZED_FEATURE_VALUE` und bindet eine `normalizationContractVersion`. Rohlevels mit verschiedenen Einheiten bzw. nicht-stationären Trends werden nicht stillschweigend miteinander korreliert. Damit wird vermieden, dass reine Level-Trends eine Scheinkorrelation als Double-Counting-Evidence erzeugen.

### Correlation fail-closed

Für Feature-Paare über verschiedene Latent Factors gilt:

- zu wenig paarweise Historie -> `CORRELATION_DATA_INSUFFICIENT`;
- konstante Serie -> `CORRELATION_SERIES_CONSTANT`;
- hohe absolute Korrelation oberhalb der versionierten Research-Schwelle -> `HIGH_CROSS_FACTOR_CORRELATION`.

Die Default-Schwelle `|r| >= 0.8` und das Minimum von 20 Beobachtungen sind ausdrücklich **Research-Screening-Parameter**, keine produktiven Modell- oder Promotion-Schwellen. Änderungen müssen später empirisch begründet werden.

### Weight Candidate Governance

Kandidatengewichte werden nur auf Latent-Factor-Ebene akzeptiert. Erlaubte Missing-Renormalisierung:

`WITHIN_LATENT_FACTOR_ONLY`

Ein fehlendes Feature/Faktor darf kein Gewicht auf andere Faktoren übertragen. Jeder Kandidat muss alle vom Modell definierten Faktoren und deren exakte Feature-Zuordnung enthalten, Summe 1.0 besitzen und `research-candidate`, `executable=false` bleiben.

### Sensitivity

Weight-Stability erfasst mindestens:

- L1-Distanz zur Referenz;
- maximale absolute Gewichtsänderung;
- Änderung des Top-Faktors;
- Gewichtssumme.

Es gibt bewusst noch keinen automatisch genehmigenden Stabilitäts-Threshold. Die tatsächliche Toleranz ist erst nach empirischer P2-Evidence festzulegen.

## 6. P2-B — Point-in-Time Backtesting Foundation

Neue Contracts:

- `commodity-backtest-contract/1.0.0`;
- `commodity-point-in-time-policy/1.0.0`;
- `commodity-backtest-costs/1.0.0`.

Der Request bindet:

- Modell-ID/-Version;
- Universe;
- Commodity Domain(s);
- Start/Ende;
- Rebalance;
- Holding Period;
- Top-N;
- Confidence;
- Walk-forward oder Expanding Window;
- Minimum Training Observations;
- Point-in-Time Policy;
- versionierte Kostenannahme.

Das Result besitzt die Drive-Metrikfamilie einschließlich Rank IC, Monotonicity, Hit Rate, Return/Volatility, Max Drawdown, Profit Factor, Turnover und Average Holding Period sowie Regime-/Domain-Diagnostics.

### Promotion-Evidence Gate

`promotionEvidenceEligible=true` bedeutet ausschließlich: das Evidence-Paket ist vollständig genug für eine Owner-/Model-Risk-Review. Es benötigt:

- gültigen Backtest Request;
- keine Leakage Blocker;
- PIT validiert;
- Cost Assumptions validiert;
- Out-of-Sample validiert;
- mindestens einen Benchmark;
- Correlation Evidence ID;
- Sensitivity Evidence ID.

Auch dann bleiben:

- `authority = VALIDATION_ONLY`;
- `canonical = false`;
- `scoreEligible = false`.

Eine automatische Registry-Promotion ist ausgeschlossen.

## 7. Negative Tests

Neu abgedeckt:

- Drive-Gewichte bleiben research-only und werden nicht automatisch auf Features verteilt;
- Candidate Weight Sum / Faktorzuordnung / Missing Aggregation fail-closed;
- Cross-Factor-Renormalisierung ist ausgeschlossen;
- deterministic effective-weight fingerprint;
- Correlation benötigt versionierten Normalization Contract;
- Cross-Factor High Correlation blockiert Evidence;
- unzureichende Cross-Factor-Historie blockiert Evidence;
- Model/Domain mismatch im Backtest Request;
- CFTC Observation vor realer Veröffentlichung = Lookahead Block;
- CFTC ohne Release Lineage = Block;
- USDA/EIA ohne Release-/Revision-Lineage = Block;
- spätere Retrievals sind nur mit identifizierbarem historischen Vintage zulässig;
- Cost Assumptions bleiben versioniert und validation-only;
- Backtest Result ohne Correlation/Sensitivity/PIT/OOS/Benchmark-Evidence ist nicht promotion-evidence-fähig.

## 8. Main-/Parallel-Work-Korrelation bei Start

Startzustand: `main@b35c86dfc9e038c629377d0d9a0761df1a65d663`.

Seit dem Merge von Commodity P0/P1 (PR #513, Merge `402af4bb2db1c199dcaad9a5f911d2fb84db722d`) wurden 13 Main-Commits geprüft. Der einzige gemeinsame Plattformbereich war eine additive Newsfeed-Erweiterung in `ProviderMatrix`; bestehende Commodity Provider-/Scoring-Definitionen blieben erhalten.

Offener PR #517 betrifft Legal/Billing-/Consumer-Contract-Code und hat keine direkte Commodity-/Scoring-Dateiüberschneidung.

Der gemergte P0/P1-Work-Claim war auf `main` noch `active/exclusive`. Dieser stale Coordination Lock wird im P2-Branch auf `verified`, `exclusive=false` gesetzt; der neue P2-Claim ist enger auf #499/#500 begrenzt.

## 9. Noch offene Gates

### #499 P2-A bleibt offen

Die Infrastruktur für Correlation-/Weight-/Sensitivity-Evidence ist implementiert. Das Exit Gate ist **noch nicht** erfüllt, weil reale normalisierte historische Feature-Serien, empirische Correlation Reports, Sensitivity Runs und Point-in-Time-Backtests noch erzeugt und bewertet werden müssen.

### #500 P2-B bleibt offen

Backtest Contracts und Leakage-Gates sind implementiert. Noch offen:

- historische PIT Dataset-/Vintage-Acquisition;
- tatsächlicher Walk-forward-/Expanding-window Executor;
- OOS-Split-/Rebalance-Ausführung;
- Transaction-Cost-Kalibrierung mit belegter Quelle;
- Benchmark-Ausführung gegen `commodity-evidence-scoring@1.0.0` und naive Baselines;
- Regime-/Domain-Stability Reports;
- Stress-/Leakage-Evidence aus realen Runs.

Erst danach kann #500 geschlossen werden.

## 10. Validierungsstatus vor PR

- Hosted GitHub CI vor PR: **nicht ausgelöst**.
- Dependency-/Workflow-/Docker-/IAM-/Supabase-/Render-/Stripe-Mutation: **keine**.
- Runtime-Scoring-/Dispatcher-/Ranking-Pfad: **nicht verändert**.
- Neue produktive Gewichte: **keine**.
- Source-/Contract-/Negativtest-Review: **durchgeführt**.
- TypeScript/Vitest/Production Build: **noch nicht als PASS behauptet; Hosted Exact-Head-CI erst nach PR**.
- Finaler Main-Sync: **unmittelbar vor PR erneut erforderlich**.
