# ADR-0087: Eine kanonische Scoring-Architektur mit UAI und ScoringModelRegistry

- **Status:** Accepted
- **Datum:** 2026-08-19
- **Revalidierung:** 2026-08-23 — Equity Orchestrator P0 + P1 SEC Evidence Integration
- **Owner-Entscheidung:** „Es sollen keine parallel Architekturen mehr entstehen und am Ende eine komplett Architektur entstehen, die sich in das FinTech Wertschöpfungs Ökosystem einbindet.“
- **Authority:** `SC-MD-SPT-0001` bleibt kanonische Ausführungsautorität.

## Kontext

Das Finance-Repository besitzt weiterhin mehrere historisch gewachsene Score-Einstiegspunkte und Ergebnisformen. Der verifizierte Crypto-Pfad liefert bereits `CanonicalScoreResult`, während Traditional-, Commodity-/Sovereign- und ältere Agent-/Base-/DeFi-/Meme-/Raw-Materials-Pfade eigene Auswahl-, Input- oder Ergebnislogik besitzen. Dadurch kann dieselbe fachliche Fähigkeit über unterschiedliche Architekturen erreicht werden.

SC-2 des kanonischen Screening/Scoring/Market-Data-SPT fordert eine Model Registry und Universal-Asset-Interface-(UAI)-Adapter. Diese ADR konkretisiert SC-2, ohne eine neue parallele Roadmap zu erzeugen.

## Entscheidung

### 1. Eine Architektur, mehrere Adapter und Modelle

Es gibt künftig genau **eine** Scoring-Wertschöpfungskette:

`UAI Identity -> Evidence Acquisition -> Evidence/Quality Gate -> Feature Contract -> ScoringModelRegistry -> ScoringDispatcher -> Domain Executor Adapter -> CanonicalScoreResult -> Ranking/Eligibility -> EventMesh/Traceability/Supervisor`.

Assetklassen dürfen eigene Feature Contracts und deterministische Modelle besitzen. Sie dürfen keine eigene konkurrierende Scoring-Architektur, eigenes Provenance-Modell oder eigene Eligibility-Semantik etablieren.

### 2. UAI ist Identity, keine Evidence

Das UAI transportiert ausschließlich stabile Identität und Mapping-Metadaten (`assetId`, Symbol, Assetklasse, Instrumenttyp, optionale Provider-Symbole). Registry-/Catalog-Preise, Scores, Bootstrap-Werte oder AI-Schätzungen werden niemals in UAI-Identity aufgenommen und erhalten dadurch keine Evidence-Wirkung.

### 3. ScoringModelRegistry ist die einzige Modellauflösung

Die Registry verwaltet versionierte Modelldeskriptoren mit Assetklassen-/Instrument-Support, Feature-/Result-Contract, Evidence-Policy, Executor-Key, Lifecycle und Deployment-Alias.

- produktive Auflösung erfolgt nur über `lifecycle=canonical` + `alias=champion`;
- Challenger/Legacy/Blocked werden nie implizit als Fallback verwendet;
- keine registrierte Route oder Mehrdeutigkeit -> `SCORE_NOT_COMPUTABLE`;
- gleiche Priorität mehrerer Champions ist ein Routingfehler und fail-closed;
- Registry-Mutationen sind Git-/Review-gesteuert, nicht dynamisch aus Request-/LLM-Inhalten.

Das Champion/Challenger-/Versionierungsmodell entspricht dem in Enterprise-MLOps üblichen Registry-Prinzip aus versionierten Modellen, Lineage/Metadaten und kontrollierter Promotion. Für CAPITAL-AI gilt dies auch für deterministische Finanzmodelle.

### 4. Bestehende Engines werden strangler-artig migriert

Bestehende Engines werden nicht durch eine zweite neue Engine ersetzt. Sie werden nacheinander hinter UAI + Registry + Canonical-Result-Adapter gesetzt. Erst wenn ein alter Einstieg vollständig über den kanonischen Dispatcher erreichbar und regressionsgetestet ist, wird der direkte Parallelpfad entfernt.

### 5. AI ist Research-/Extraction-Komponente, kein Evidence-Bypass

LLM-/Agent-Ausgaben dürfen keine verifizierten Finanzmerkmale ersetzen. AI kann Research, Extraction, Source Discovery und strukturierte Evidence Candidates liefern. Ein AI-Modell selbst ist keine Finanzdaten-Provenance.

Eine mögliche erneute Gemini-Anbindung ist **nicht Bestandteil von A1/A2**. ADR-0072 bleibt gültig. Jede Wiedereinführung benötigt eine neue explizite ADR und darf nur als Adapter innerhalb derselben Acquisition-/Evidence-Architektur erfolgen; ein `GEMINI_API_KEY` darf keinen separaten Scoring-Pfad reaktivieren.

## Aktueller Registry-Stand nach Equity-P0-Revalidierung

| Modell | Assets | Status | Feature Contract | Result Contract |
|---|---|---|---|---|
| `crypto-technical-provenance@0.7.0` | crypto | canonical/champion | `crypto-technical-features/0.7.0` | `scoring-integrity/1.1.0` |
| `crypto-meme-integrity@0.3.0` | crypto | challenger/research-only, `scoreEligible=false` | `crypto-meme-research-features/0.3.0` | `scoring-integrity/1.1.0` |
| `crypto-defi-fundamental@0.3.0` | crypto | challenger/research-only, `scoreEligible=false` | `crypto-defi-research-features/0.3.0` | `scoring-integrity/1.1.0` |
| `equity-multifactor@0.1.0` | stock | challenger/research-only, `scoreEligible=false` | `equity-multifactor-features/0.1.0` | `scoring-integrity/1.1.0` |
| `traditional-scoring@2.1.0` | stock/forex/index | canonical/champion | `traditional-features/2.1.0` | `scoring-integrity/1.0.0` |
| `commodity-evidence-scoring@1.0.0` | commodity | canonical/champion | `commodity-market-evidence/1.0.0` | `scoring-integrity/1.0.0` |
| `sovereign-benchmark-yield-scoring@1.0.0` | bond `government-benchmark-yield` | canonical/champion | `sovereign-benchmark-yield-features/1.0.0` | `scoring-integrity/1.0.0` |

Individuelle Bonds bleiben gemäß ADR-0022 ohne ausreichende Evidence nicht scorebar.

## Revalidierung 2026-08-21 — P0 Multi-Class Integrity

Die P0-Härtung erweitert **keine** Authority und führt keinen zweiten Dispatcher ein. Sie konkretisiert die bereits akzeptierte Entscheidung durch folgende Runtime-Invarianten:

1. **Crypto Champion Authority:** Nur `crypto-technical-provenance@0.7.0` ist produktiv scorefähig. Meme- und DeFi-Modelle bleiben Challenger und dürfen vor expliziter Validierung/Promotion keinen produktiven Score erzeugen.
2. **Faktorautorität:** `exchange_liquidity` und `regime_bonus` sind keine Faktoren des kanonischen Crypto-0.7.0-Scores. Legacy-Felder dürfen den `final_score` nicht verändern.
3. **Caller-Isolation:** Request-/Caller-Classification (`tier`, `confidence`) besitzt keine Autorität über Rank-Score oder Top-N-Eligibility.
4. **Replay-/Lineage-Bindung:** Effective-Feature- und Effective-Weight-Fingerprints sind deterministisch und binden Modell-, Feature- und Evidence-Contract-Version; der Weight-Fingerprint bindet zusätzlich die Nominal-Weights-Version. Missing Evidence und dynamische Renormalisierung bleiben dadurch reproduzierbar und revisionssensitiv.
5. **Evidence/DQ fail-closed:** `VERIFIED` verlangt echte Provenance, valide Zeitstempel und eine Freshness innerhalb des freigegebenen `maxAgeMs`. Als `VERIFIED` deklarierte, aber veraltete Evidence ist nicht admissible und muss als stale/degraded behandelt werden.
6. **No-Demo Universe SLA:** Der Zielwert beträgt 24 reale, identity-deduped und evidence-admitted Assets je Assetklasse sowie je ausgewiesener Unterkategorie. Bei geringerer realer Verfügbarkeit wird `INSUFFICIENT_REAL_UNIVERSE`, `PROVIDER_DEGRADED` oder `EVIDENCE_INSUFFICIENT` ausgewiesen; Filler, synthetische Assets oder Interpolation sind verboten.
7. **Single Dispatcher bleibt erhalten:** Alle produktiven Domain-Executors bleiben hinter `ScoringDispatcher`; die P0-Härtung ändert weder diese Topologie noch führt sie einen parallelen Model-Selection-Pfad ein.

## Revalidierung 2026-08-22 — Meme/DeFi Model Supersession

Supersession B ändert keine produktive Modellautorität. Sie entfernt stattdessen zwei Modellkorrelationen aus der Zukunftsprojektion:

1. **Meme:** Die historische 35/25/20/20-Formel aus `MemeCoinScoringService` ist nicht kanonisch und wird nicht in den Challenger übernommen. Trend, Momentum und Volatilität werden als korrelierte `meme-price-path`-Evidence gebunden. Contract-/Manipulationsrisiko ist zwingende Promotion-Voraussetzung. Es existieren keine ausführbaren Meme-Gewichte.
2. **DeFi:** TVL, Fees und Revenue bleiben Raw Evidence, sind aber als `defi-scale-activity` correlation-bound. Eine spätere Promotion muss De-Korrelation oder einen validierten Latent-Factor nachweisen; drei unabhängige additive positive Gewichte sind nicht zulässig.
3. **DeFiLlama:** ADR-0100 akzeptiert DeFiLlama ausschließlich als Evidence-Provider. `READY` verlangt vollständig VERIFIED Evidence; ein komplett stale Set ist explizit `STALE`. Providerstatus oder Providername darf nie Gewicht/Eligibility beeinflussen.
4. **No Score Promotion:** `crypto-meme-integrity@0.3.0` und `crypto-defi-fundamental@0.3.0` bleiben `challenger`, `scoreEligible=false`, `research-only:not-executable`.
5. **Fingerprint-Gate:** Produktive Weight-Fingerprints entstehen erst für ausdrücklich freigegebene Modellgewichte; Research-Weights bleiben nicht-autorisierend. Eine spätere Owner-approved Promotion muss die bestehende `scoringFingerprint` Authority für Effective-Feature-/Effective-Weight-Lineage nutzen.

## Revalidierung 2026-08-23 — Equity Orchestrator P0 Challenger

Der Equity-Ausbau ändert die produktive Scoring-Authority **nicht**. Er nutzt die in dieser ADR bereits erlaubte assetklassenspezifische Feature-/Modelllogik innerhalb derselben Wertschöpfungskette.

1. **Equity Challenger:** `equity-multifactor@0.1.0` wird ausschließlich als `challenger`, `research-only`, `scoreEligible=false` für `stock` registriert.
2. **Produktiver Stock-Pfad unverändert:** `traditional-scoring@2.1.0` bleibt bis zu einer separaten Owner-approved Promotion der einzige canonical/champion Stock-Pfad.
3. **Keine Parallelarchitektur:** `EquityOrchestrator` ist eine reine Domain-Research-Grenze ohne Asset-Routing, Provider-I/O, öffentliche Route, Persistence-, Ranking- oder CanonicalScoreResult-Autorität. Ein produktiver Equity Executor darf ausschließlich hinter dem bestehenden `ScoringDispatcher` aktiviert werden.
4. **Klassifikation getrennt:** Industry-/Taxonomy-Metadaten, Size Bucket, Style Tags und genau ein Primary Scoring Profile werden getrennt modelliert. Externe Taxonomien wie GICS dürfen nur bei zulässiger Provider-/Lizenznutzung als Metadaten verwendet werden.
5. **Anti-Korrelation:** Equity 0.1.0 gewichtet ausschließlich sechs Faktor-Familien (`quality`, `valuation`, `growth`, `momentum`, `financialStrength`, `capitalAllocation`). Einzelmetriken innerhalb derselben ökonomischen Familie dürfen nicht als zusätzliche Top-Level-Faktoren wiederholt werden.
6. **Evidence/DQ:** Research-Familien werden nur mit admissible `market-evidence-dq/1.0.0` Evidence zugelassen. Missing/stale/conflicting/unverified Evidence bleibt missing und darf nicht als 0, neutral oder PASS ersetzt werden.
7. **Coverage Gate:** Ein Research-Composite erfordert mindestens vier zugelassene Faktor-Familien und mindestens 70 % nominale Gewichtsabdeckung; die effektiven Gewichte werden reproduzierbar fingerprinted.
8. **Context-only Signale:** Regime, Sektorrotation, Sentiment und Pattern besitzen in Equity 0.1.0 weder `scoreImpact` noch `rankingImpact`.
9. **Atomic Promotion:** Eine spätere produktive Promotion muss `stock` atomar vom Traditional-Champion auf einen Equity-Champion umstellen; zwei gleichberechtigte canonical Champions oder ein route-lokaler Equity-Fallback bleiben verboten.

## Revalidierung 2026-08-23 — Equity P1 SEC Evidence Integration

P1 ergänzt SEC EDGAR ausschließlich als **Evidence-Provider innerhalb der bestehenden Equity-Research-Kette**. Die produktive Modell- und Routing-Authority bleibt unverändert.

1. **Evidence-only Provider:** `server/secEdgarCompanyFacts.ts` nutzt SEC CompanyFacts serverseitig, keyless und mit deklarierter User-Agent-/Fair-Access-Governance. Der Adapter besitzt keine Score-, Registry-, Dispatcher-, Ranking- oder Persistence-Authority.
2. **Point-in-Time:** Facts werden nur zugelassen, wenn `filedAt <= asOf`. Filing-Verfügbarkeit, Accounting-Period-Ende und Retrieval-Zeit bleiben getrennt; Quarter-/Annual-/YTD-Kontexte werden deterministisch unterschieden.
3. **Providerneutrale Grenze:** `server/equitySecEvidenceBridge.ts` projiziert SEC-spezifische Facts in `EquityFilingEvidenceSnapshot`; `EquityFilingDerivedMetrics` bleibt providerneutral und akzeptiert ausschließlich admissible Market-Evidence-DQ-Inputs.
4. **Derived Metrics ohne Eigenautorität:** Current Ratio, Long-Term-Debt/Equity, Interest Coverage, YTD Free Cash Flow, Shareholder Distributions, Distribution Coverage und Reinvestment Intensity sind deterministische Research-Metriken und bleiben `scoreEligible=false`, `normalizationRequired=true`.
5. **Correlation De-Duplication:** SEC filing-derived Financial-Strength-Komponenten dürfen vendor-derived Leverage nur ersetzen, wenn mindestens zwei unabhängige Filing-Komponenten admissible sind. SEC/FMP/AlphaVantage-Werte derselben ökonomischen Korrelationsgruppe werden nicht additiv gestapelt.
6. **Capital Allocation bleibt fail-closed:** Distribution Coverage, FCF und Reinvestment Intensity erzeugen allein keinen Capital-Allocation-Family-Score. Eine zweite unabhängige, governance-fähige Größe wie Share-Count-Change und/oder peer-relative Normalisierung bleibt Voraussetzung.
7. **Research Runtime:** `equity-research-runtime/0.2.0` bindet Existing Fundamentals, provenance-aware History und SEC Evidence ohne öffentliche Route, Persistence Writer oder `CanonicalScoreResult`; produktives Stock-Routing bleibt `traditional-scoring@2.1.0`.
8. **Promotion unverändert:** Peer-/Sector-Normalisierung, mehrperiodige Filing-Historie, Backtesting und explizite Owner-Promotion bleiben getrennte Gates. P1 SEC allein berechtigt keinen Champion-Cutover.

## Konsequenzen

- Neue Scoring-Features müssen UAI + Registry + Evidence Gate nutzen.
- `/api/crypto/analyze` darf langfristig keinen alternativen kanonischen Finanzscore erzeugen; Agenten-Ausgaben werden Research/Enrichment.
- `scoring.service.ts`, Meme-/Raw-Materials- und route-lokale Scorer bleiben während der Migration nur temporäre Implementierungsdetails und erhalten keinen neuen Architekturstatus.
- Equity-Research-Ergebnisse bleiben bis zur expliziten Promotion ohne CanonicalScoreResult-, Ranking-, Eligibility- oder Execution-Wirkung.
- SEC EDGAR ist Evidence Acquisition, kein eigenes Equity-Modell und keine alternative DQ-/Provider-Routing-Authority.
- Score-Gewichte, Provider-Routing, `scoreImpact`, `rankingImpact` und Eligibility-Schwellen werden außerhalb explizit versionierter und reviewter Modelländerungen nicht implizit verändert.
- Änderungen an Feature-/Evidence-/Weight-Verträgen müssen in der Runtime-Lineage erkennbar sein und einen neuen Replay-Fingerprint erzeugen, soweit sie dessen fachliche Semantik beeinflussen.
- Universe-Verfügbarkeitsziele dürfen niemals durch No-Demo-Data-Verstöße erfüllt werden.

## Migration / Exit Criteria

1. vollständiges A1 Entry-Point-Inventar;
2. UAI-Adapter für alle aktiven Asset-Katalogpfade;
3. alle produktiven Modellexecutoren versioniert in einer Registry;
4. jeder öffentliche Score-Einstieg löst sein Modell über die Registry auf;
5. alle Resultate werden zu `CanonicalScoreResult` adaptiert;
6. direkte Parallel-Model-Selection wird entfernt;
7. P0 Runtime-Lineage bindet effektive Feature-/Weight-Semantik und Evidence-Vertrag revisionssicher;
8. Universe-SLA wird produktiv nur aus real entdeckten und zugelassenen Assets gespeist;
9. Meme/DeFi-Challenger bleiben ohne validierte Evidence/Weights/Promotion nicht ausführbar;
10. Equity-Challenger einschließlich SEC-derived Research bleibt bis zur separat validierten und Owner-approved atomaren Stock-Promotion research-only und `scoreEligible=false`;
11. Main-Sync/Korrelationsprüfung vor PR-Erstellung und erneut vor Merge.

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
- `src/services/scoringIntegrity.ts`
- `src/platform/MarketData/contracts.ts`
- `src/platform/MarketData/evidenceQualityContracts.ts`
- `src/platform/Scoring/scoringFingerprint.ts`
- `src/platform/Scoring/CryptoResearchModelContracts.ts`
- `src/platform/Scoring/EquityModelContracts.ts`
- `src/platform/Scoring/EquityResearchScoring.ts`
- `src/platform/Scoring/EquityFilingDerivedMetrics.ts`
- `src/platform/Scoring/EquityFilingFeatureComposer.ts`
- `src/platform/Scoring/EquityOrchestrator.ts`
- `server/secEdgarCompanyFacts.ts`
- `server/equitySecEvidenceBridge.ts`
- `server/equityResearchRuntime.ts`
- `src/platform/Scoring/UniverseSla.ts`
