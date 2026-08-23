# ADR-0087: Eine kanonische Scoring-Architektur mit UAI und ScoringModelRegistry

- **Status:** Accepted
- **Datum:** 2026-08-19
- **Letzte Revalidierung:** 2026-08-23 — Equity P1 SEC / Comparable Filing / Quality-Valuation Enrichment
- **Owner-Entscheidung:** „Es sollen keine parallel Architekturen mehr entstehen und am Ende eine komplett Architektur entstehen, die sich in das FinTech Wertschöpfungs Ökosystem einbindet.“
- **Authority:** `SC-MD-SPT-0001` bleibt kanonische Ausführungsautorität.

## Kontext

Das Finance-Repository besitzt historisch mehrere Score-Einstiegspunkte und Ergebnisformen. Die Zielarchitektur benötigt eine einzige produktive Modellauflösung und Ausführung, während Assetklassen eigene Feature Contracts und deterministische Domain-Modelle besitzen dürfen.

SC-2 des kanonischen Screening/Scoring/Market-Data-SPT fordert eine Model Registry und Universal-Asset-Interface-(UAI)-Adapter. Diese ADR konkretisiert SC-2, ohne eine parallele Roadmap oder zweite Scoring-Authority zu erzeugen.

## Entscheidung

### 1. Eine produktive Scoring-Wertschöpfungskette

Es gibt genau eine produktive Scoring-Kette:

`UAI Identity -> Evidence Acquisition -> Evidence/Quality Gate -> Feature Contract -> ScoringModelRegistry -> ScoringDispatcher -> Domain Executor Adapter -> CanonicalScoreResult -> Ranking/Eligibility -> EventMesh/Traceability/Supervisor`.

Assetklassen dürfen eigene Feature Contracts, Research-Orchestratoren und deterministische Modelle besitzen. Sie dürfen keine konkurrierende Registry, keinen zweiten Dispatcher, kein eigenes Provenance-/DQ-Modell und keine eigene Ranking-/Eligibility-Authority etablieren.

### 2. UAI ist Identity, keine Evidence

UAI transportiert ausschließlich stabile Identität und Mapping-Metadaten. Registry-/Catalog-Preise, Scores, Bootstrap-Werte, Demo-Werte oder AI-Schätzungen werden nicht zu Evidence, nur weil sie in einem Asset-Kontext verfügbar sind.

### 3. ScoringModelRegistry ist die einzige Modellauflösung

- produktive Auflösung nur über `lifecycle=canonical` + `alias=champion` + score-eligible;
- Challenger/Legacy/Blocked werden nie implizit als Fallback verwendet;
- fehlende oder mehrdeutige Route -> `SCORE_NOT_COMPUTABLE`;
- gleiche Priorität mehrerer Champions ist fail-closed;
- Registry-Mutationen sind Git-/Review-gesteuert und nicht request-/LLM-gesteuert.

### 4. Bestehende Engines werden strangler-artig migriert

Bestehende Engines werden nacheinander hinter UAI + Registry + Dispatcher + Canonical Result gebracht. Ein alter direkter Einstieg wird erst entfernt, wenn der kanonische Pfad regressionsgetestet ist.

### 5. AI ist Research-/Extraction-Komponente, kein Evidence-Bypass

LLM-/Agent-Ausgaben dürfen verifizierte Finanzmerkmale, Risk-/Compliance-Gates oder produktive Scoring-Authority nicht ersetzen. AI kann Research, Extraction, Source Discovery und strukturierte Evidence Candidates liefern.

## Aktueller Registry-Stand

| Modell | Assets | Status | Feature Contract | Result Contract |
|---|---|---|---|---|
| `crypto-technical-provenance@0.7.0` | crypto | canonical/champion | `crypto-technical-features/0.7.0` | `scoring-integrity/1.1.0` |
| `crypto-meme-integrity@0.3.0` | crypto | challenger/research-only, `scoreEligible=false` | `crypto-meme-research-features/0.3.0` | `scoring-integrity/1.1.0` |
| `crypto-defi-fundamental@0.3.0` | crypto | challenger/research-only, `scoreEligible=false` | `crypto-defi-research-features/0.3.0` | `scoring-integrity/1.1.0` |
| `equity-multifactor@0.2.0` | stock | challenger/research-only, `scoreEligible=false` | `equity-multifactor-features/0.2.0` | `scoring-integrity/1.1.0` |
| `traditional-scoring@2.1.0` | stock/forex/index | canonical/champion | `traditional-features/2.1.0` | `scoring-integrity/1.0.0` |
| `commodity-evidence-scoring@1.0.0` | commodity | canonical/champion | `commodity-market-evidence/1.0.0` | `scoring-integrity/1.0.0` |
| `sovereign-benchmark-yield-scoring@1.0.0` | bond `government-benchmark-yield` | canonical/champion | `sovereign-benchmark-yield-features/1.0.0` | `scoring-integrity/1.0.0` |

Individuelle Bonds bleiben gemäß ADR-0022 ohne ausreichende Evidence nicht scorebar.

## Revalidierung 2026-08-21 — P0 Multi-Class Integrity

1. Nur `crypto-technical-provenance@0.7.0` ist produktiver Crypto-Champion.
2. `exchange_liquidity` und `regime_bonus` sind keine Faktoren des kanonischen Crypto-0.7.0-Scores.
3. Caller-Klassifikation besitzt keine Authority über Rank-Score/Top-N-Eligibility.
4. Effective-Feature-/Weight-Fingerprints binden Feature-/Evidence-/Weight-Semantik reproduzierbar.
5. `VERIFIED` Evidence benötigt echte Provenance und gültige Freshness.
6. Universe-SLA wird ausschließlich mit realen, identity-deduped und evidence-admitted Assets erfüllt; keine Filler/Synthetic/Demo-Assets.
7. Alle produktiven Domain-Executors bleiben hinter `ScoringDispatcher`.

## Revalidierung 2026-08-22 — Meme/DeFi Model Supersession

1. Die historische Meme-35/25/20/20-Formel ist non-authorizing; Trend/Momentum/Volatilität bleiben als `meme-price-path` korrelationsgebunden.
2. DeFi TVL/Fees/Revenue bleiben gemeinsam `defi-scale-activity`; keine dreifache additive Gewichtung ohne validierte De-Korrelation.
3. DeFiLlama ist Evidence-Provider, keine Score-/Eligibility-Authority.
4. Meme/DeFi bleiben `challenger`, `scoreEligible=false`, `research-only:not-executable`.
5. Produktive Gewichte/Fingerprints erfordern explizite Promotion.

## Revalidierung 2026-08-23 — Equity P0 Foundation

1. Equity ist eine Domain-Research-Grenze innerhalb derselben Architektur, kein zweiter Master-Orchestrator/Dispatcher.
2. Industry/Taxonomy, Size Bucket, Style Tags und genau ein Primary Scoring Profile werden getrennt modelliert.
3. Top-Level-Gewichte existieren ausschließlich für sechs Familien: `quality`, `valuation`, `growth`, `momentum`, `financialStrength`, `capitalAllocation`.
4. Subfeatures derselben ökonomischen Familie werden nicht als zusätzliche Top-Level-Faktoren erneut addiert.
5. Research-Familien benötigen admissible `market-evidence-dq/1.0.0` Evidence.
6. Research-Composite benötigt mindestens vier admissible Familien, mindestens 70% nominale Weight Coverage und profile-semantische Pflichtfamilien.
7. Regime, Sektorrotation, Sentiment und Pattern bleiben context-only ohne `scoreImpact`/`rankingImpact`.
8. Produktiver Stock-Pfad bleibt `traditional-scoring@2.1.0`.
9. Eine spätere Equity-Promotion muss `stock` atomar aus Traditional entfernen und den Equity-Champion im selben Change aktivieren.

## Revalidierung 2026-08-23 — Equity P1 SEC / Comparable Filing / 0.2.0

Die P1-Erweiterung ändert weiterhin **keine produktive Authority**. Aufgrund neuer research-score-wirksamer Features wurde die Challenger-Lineage auf `equity-multifactor@0.2.0` / `equity-multifactor-features/0.2.0` angehoben. Equity 0.1.0 bleibt historische P0-Evidence.

### SEC EDGAR als Evidence Acquisition

1. `server/secEdgarCompanyFacts.ts` nutzt SEC CompanyFacts serverseitig, keyless und mit deklarierter User-Agent-/Fair-Access-Governance.
2. Ticker -> CIK wird ausschließlich aus SEC-publizierter Zuordnung übernommen; kein Guessing/Fuzzy Fallback.
3. `filedAt <= asOf` verhindert Filing-Look-Ahead; Filing Availability, Period End und Retrieval Time bleiben getrennt.
4. Instant/Periodic/YTD-Kontexte werden deterministisch getrennt; Bridges besitzen zusätzliche Duration-Gates.
5. SEC-spezifische Facts werden vor Scoring in providerneutrale Filing Contracts projiziert.
6. SEC ist keine Registry-, Dispatcher-, DQ-, Ranking-, Persistence- oder Execution-Authority.

### Current-/Comparable Filing Features

1. Financial Strength kann aus Current Ratio, Long-Term-Debt/Equity und Interest Coverage entstehen; SEC darf vendor-derived Leverage in derselben Korrelationsgruppe nur bei ausreichender Filing-Coverage **ersetzen**, nicht stapeln.
2. YTD FCF, Shareholder Distributions, Distribution Coverage und Reinvestment Intensity bleiben deterministische Research-Metriken.
3. Comparable SEC Periods müssen Kontext/Unit/Periodenlänge sowie ungefähr ein Fiskaljahr Abstand erfüllen.
4. Comparable Revenue/EPS/FCF Growth kann Vendor-Quarterly-Growth innerhalb derselben Growth-Korrelationsgruppe ersetzen, nicht additiv ergänzen.
5. Capital Allocation wird nur aus unabhängiger Share-Count-Change-Evidence plus Distribution Coverage freigeschaltet; Dividend Yield allein bleibt unzureichend.
6. Reinvestment Intensity bleibt context-only, bis Peer-/Profile-Normalisierung eine belastbare Richtung definiert.

### Quality / Valuation Enrichment

1. `quality.freeCashFlowConversion` wird ausschließlich aus einem **same-provider/same-observation** TTM-FCF/share/EPS-Provenance-Paar abgeleitet. Gemergte AlphaVantage/FMP-Displaywerte werden dafür nicht cross-provider gemischt.
2. `valuation.freeCashFlowYield` wird nur aus attributable FCF/share plus einem frischen, provenance-aware realen History-Close abgeleitet.
3. Beide Features reichern nur bereits vorhandene Quality-/Valuation-Familien an; ein einzelnes Derived Signal darf keine neue Family-Coverage erzeugen.
4. Die Runtime `equity-research-runtime/0.4.0` bleibt ohne öffentliche Route, Persistence Writer, `CanonicalScoreResult`, Ranking oder Execution.
5. Sämtliche absoluten Normalisierungen bleiben research-only und `promotionReady=false`; Peer-/Sector-relative Normalisierung bleibt Promotion-Voraussetzung.

## Konsequenzen

- Neue produktive Scoring-Features müssen UAI + Registry + Evidence Gate + Dispatcher nutzen.
- Equity Research bleibt bis expliziter Promotion ohne CanonicalScoreResult-, Ranking-, Eligibility- oder Execution-Wirkung.
- SEC EDGAR ist Evidence Acquisition, kein eigenes Equity-Modell und keine alternative Provider-/DQ-Authority.
- Vendor-/Filing-/Market-Evidence derselben ökonomischen Korrelationsgruppe darf nicht doppelt gewichtet werden.
- Änderungen an Feature-/Evidence-/Weight-Semantik müssen in Model-/Feature-Version und Replay-Lineage sichtbar sein.
- No-Demo-Data bleibt für Universe- und Evidence-Verfügbarkeit verbindlich.

## Migration / Exit Criteria

1. vollständiges A1 Entry-Point-Inventar;
2. UAI-Adapter für alle aktiven Asset-Katalogpfade;
3. alle produktiven Modellexecutoren versioniert in einer Registry;
4. jeder öffentliche Score-Einstieg löst sein Modell über die Registry auf;
5. alle produktiven Resultate werden zu `CanonicalScoreResult` adaptiert;
6. direkte Parallel-Model-Selection entfernt;
7. Runtime-Lineage bindet effektive Feature-/Weight-/Evidence-Semantik revisionssicher;
8. Universe-SLA ausschließlich aus realen admitted Assets;
9. Meme/DeFi-Challenger ohne Promotion nicht ausführbar;
10. Equity-Challenger einschließlich SEC-/Comparable-/Derived Research bleibt bis zu Peer-Normalisierung, kontrolliertem Backtesting und Owner-approved atomarem Stock-Cutover research-only und `scoreEligible=false`;
11. Main-Sync/Korrelationsprüfung vor PR und erneut vor Merge.

## Referenzen

- `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md`
- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- `docs/roadmaps/work-packages/SC-2E_EQUITY_ORCHESTRATOR_CHALLENGER.md`
- `docs/evidence/sc-md/SC2_P0_MULTICLASS_INTEGRITY_2026-08-21.md`
- `docs/evidence/sc-md/SC2_MEME_DEFI_MODEL_SUPERSESSION_2026-08-22.md`
- `docs/evidence/sc-md/SC2_EQUITY_ORCHESTRATOR_P0_CHALLENGER_2026-08-23.md`
- `docs/evidence/sc-md/SC2_EQUITY_P1_EVIDENCE_RUNTIME_2026-08-23.md`
- `docs/evidence/sc-md/SC2_EQUITY_P1_SEC_EDGAR_2026-08-23.md`
- ADR-0022, ADR-0032, ADR-0033, ADR-0072, ADR-0100
- `src/platform/MarketData/evidenceQualityContracts.ts`
- `src/platform/Scoring/scoringFingerprint.ts`
- `src/platform/Scoring/EquityModelContracts.ts`
- `src/platform/Scoring/EquityFeatureComposer.ts`
- `src/platform/Scoring/EquityVendorDerivedFeatureComposer.ts`
- `src/platform/Scoring/EquityFilingDerivedMetrics.ts`
- `src/platform/Scoring/EquityFilingFeatureComposer.ts`
- `src/platform/Scoring/EquityComparableFilingMetrics.ts`
- `src/platform/Scoring/EquityComparableFilingFeatureComposer.ts`
- `src/platform/Scoring/EquityResearchScoring.ts`
- `src/platform/Scoring/EquityOrchestrator.ts`
- `server/secEdgarCompanyFacts.ts`
- `server/equitySecEvidenceBridge.ts`
- `server/equitySecComparableEvidence.ts`
- `server/equityResearchRuntime.ts`
