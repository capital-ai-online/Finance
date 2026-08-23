# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 2.1.0  
**Status:** IN IMPLEMENTATION — FT-0 bis FT-6B, Supersession A+B und Meme/DeFi Research Scoring 0.3.0 auf `main`; P1 Portfolio Allocation auf Main-Sync-Branch; FT-7 blockiert  
**Current baseline:** `main@14e4f3c8a309faae63fb336a432aac38ab08ceda`  
**FT-6A Merge:** PR #481  
**FT-6B Merge:** PR #483  
**Supersession A+B Merge:** PR #484  
**Primary Architecture Decision:** `ADR-0099` v1.9.0 on P1 branch  
**Protected Scoring Authority:** `ADR-0087`  
**DeFi Evidence Authority:** `ADR-0100`

## 1. Authority Boundary

Der FinTech Core ist `financial_workflow_composition_authority`. Er ist keine Trading-/Investment-Strategie, keine Suitability-Authority, keine produktive Scoring Engine, keine Compliance-Policy-Authority, keine IAM-Authority, kein Exchange-/Broker-Gateway und kein Custody-System.

Kanonische produktive Scoring-Kette:

```text
UAI Identity
  -> Evidence Acquisition
  -> Evidence/Data Quality Gate
  -> Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor Adapter
  -> CanonicalScoreResult
  -> Ranking/Eligibility
  -> EventMesh/Traceability/Supervisor
```

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`. Meme/DeFi Research Evaluators, Sentiment, Momentum, Regime, Pattern Confluence, Signal Fusion, P1 Portfolio Composition und Kill-Switch Telemetry duerfen die produktive Dispatcher-/Risk-/Execution-Authority nicht umgehen.

## 2. Nicht verhandelbare Invarianten

1. `ScoringDispatcher` bleibt einzige produktive Scoring-Execution-Authority.
2. Keine zweite Model Registry, Queue, Event-Journal-, Order-Ledger-, Portfolio-Ledger-, Reconciliation- oder Persistence-Architektur.
3. `public.outbox_jobs` bleibt Queue-/Lease-Authority.
4. Privates Schema bleibt `fintech_core`.
5. `anon`/`authenticated` erhalten keine direkte Finance-Capability.
6. Financial Quantity/Price/Money verwendet `atoms:string + scale:number`.
7. FT-5 Risk-/Compliance-Decisions sind die einzige Approval-Quelle fuer FT-6.
8. LLM-/Agent-Outputs, Research Scores und P1 Portfolio Proposals duerfen keine Risk-/Compliance-Freigabe erzeugen oder ueberschreiben.
9. P1 Target Weights muessen aus einer expliziten, versionierten Upstream-Strategy-/Allocation-Authority stammen; FinTechCore erzeugt keine Score-to-Weight-/Suitability-Logik.
10. `PAPER` bleibt simuliert; reale Kapitalbewegung ist ausgeschlossen.
11. `GUARDED_LIVE` und `PRODUCTION` bleiben bis FT-7 fail-closed.
12. Meme/DeFi-Challenger duerfen keinen produktiven Score liefern, solange keine explizite Promotion erfolgt.
13. Stale/missing/invalid Evidence kann kein REQUIRED-/HARD_GATE erfuellen und wird nie zu 0/PASS/neutral umgedeutet.
14. Correlated raw features duerfen nicht mehrfach additiv gewichtet werden.
15. Pattern-/Regime-/Portfolio-Erweiterungen muessen bestehende Authorities wiederverwenden.
16. Kill-Switch-Empfehlungen im Research Layer sind Telemetrie, keine Runtime-Mutation.

## 3. Phasenstatus

| Phase | Status | Ergebnis |
|---|---|---|
| FT-0 Contract/Governance Foundation | DONE | Contracts + ADR-0099 |
| FT-1 Core Engine Foundation | DONE | Engine/Module Registry/Workflow State |
| FT-2A Category Profile Resolution | DONE | Crypto Category Profiles |
| FT-2B Category Feature Contracts | DONE | Typed category evidence |
| FT-2C Pattern Research Foundation | DONE | Research-only pattern contracts |
| FT-2D Meme/DeFi Research Scoring & Signal Context | DONE ON MAIN | source-backed 0.3.0 evaluators + feature kit, non-executable |
| FT-3 Durable Workflow & Traceability | DONE | private schema + append-only persistence |
| FT-4 Research & Paper Trading | DONE | deterministic Fixed Point + replay |
| FT-5 Deterministic Risk + Compliance | DONE | versioned policy/evidence decisions |
| FT-6A Decision Binding Foundation | DONE / MERGED #481 | decision/hash-bound PAPER intent scaffold |
| FT-6B OrderIntent & Reconciliation Closure | DONE / MERGED #483 | canonical intent, Fixed Point, policy binding, typed reconciliation, v2 persistence |
| Supersession A+B | DONE / MERGED #484 | authority/current-state cleanup + Meme/DeFi foundation + fail-closed operating modes |
| P1 Portfolio Allocation / Position Sizing | IMPLEMENTED ON MAIN-SYNC BRANCH | deterministic governed targets -> constraints/deltas -> bounded FT-5 portfolio-risk projection |
| FT-7 Guarded Live / Single CEX | BLOCKED | separate explicit architecture/security decision required |
| FT-8 Production Hardening | PLANNED | trace, SLO, BCP/DR, chaos/recovery |
| FT-9 DEX/Bridge/Cross-Chain | PLANNED | no productive DeFi/DEX execution authorized here |

## 4. FT-6B Canonical OrderIntent

`FinTechCoreOrderIntent` ist die einzige Domain-Authority. Financial Values sind Fixed Point; `clientOrderId`, `idempotencyKey` und `intentHash` werden deterministisch aus immutable Feldern abgeleitet.

Kanonische Persistenz:

```text
BOUND -> fintech_core_append_order_intent_v2
```

Legacy/research compatibility:

```text
UNBOUND -> fintech_core_append_order_intent_v1
```

Der v1-Pfad ist nicht kanonisch und wird erst nach Consumer-/Replay-/Bestandsdaten-Nachweis entfernt.

## 5. Operating Modes — fail-closed

```text
RESEARCH      real=false simulated=false newOrders=false
PAPER         real=false simulated=true  newOrders=true
GUARDED_LIVE  real=false simulated=false newOrders=false
PRODUCTION    real=false simulated=false newOrders=false
EMERGENCY     real=false simulated=false newOrders=false
```

`isOrderIntentEligibleForRealExecution(...)` bleibt fuer jeden Modus `false`. FT-7+ benoetigt eine neue Architektur-/Security-Entscheidung.

## 6. FT-2D — Meme Research Scoring 0.3.0

`crypto-meme-integrity@0.3.0`:

- `challenger` / `research-only` / `scoreEligible=false`;
- executor `research-only:not-executable`;
- feature contract `crypto-meme-research-features/0.3.0`;
- deterministic Research Evaluator mit source-defined Gewichten;
- keine produktive Registry-/Execution-Authority.

Research-Faktoren:

```text
liquidity        0.25
marketStructure  0.20
sentiment        0.18
narrative        0.15
distribution     0.12
exchangeAccess   0.10
```

Risk-Faktoren:

```text
liquidity      0.25
concentration  0.18
contract       0.18
market         0.17
sentiment      0.12
tokenomics     0.07
regulatory     0.03
```

Hard Gates:

- Buy-/Sell-Honeypot Simulation;
- Liquidity Lock Policy;
- Transfer Tax Policy;
- Contract Integrity;
- Manipulation Evidence.

Social Evidence benoetigt mindestens zwei Market Confirmations. Holder-/Rug-/Liquidity-Subfeatures werden innerhalb ihrer jeweiligen Latent-/Correlation-Familie nur einmal komponiert.

## 7. FT-2D — DeFi Research Scoring 0.3.0

`crypto-defi-fundamental@0.3.0`:

- `challenger` / `research-only` / `scoreEligible=false`;
- executor `research-only:not-executable`;
- feature contract `crypto-defi-research-features/0.3.0`;
- deterministic Research Evaluator mit source-defined Gewichten;
- DeFiLlama bleibt Evidence-only.

Research-Faktoren:

```text
fundamentals      0.20
utilization       0.18
liquidity         0.17
contractSecurity  0.15
governance        0.12
tokenomics        0.10
ecosystem         0.08
```

Risk-Faktoren:

```text
contract      0.22
liquidity     0.16
oracle        0.15
governance    0.12
fundamentals  0.15
tokenomics    0.10
bridge        0.10
```

TVL + Fees + Revenue bleiben in `defi-scale-activity`; keine dreifache additive Top-Level-Gewichtung.

Hard Gates blockieren unverifizierte Smart-Contract Evidence, Oracle Risk ausserhalb Policy, unbekannte Mint-Authority und unresolved Exploits.

`riskAdjustedScore` bleibt ohne explizit governte `riskPenaltyWeight` bewusst `null`.

## 8. FT-2D — Added Feature Kit

### Sentiment

- polarity, intensity, novelty, credibility;
- bot probability;
- source weight;
- mention intensity;
- recency decay;
- regime adjustment;
- evidence references.

Kein neutraler 50-Default bei fehlender Evidence.

### Momentum

- H1/H4/D1 returns;
- volume ratio/acceleration;
- trend/relative strength;
- open interest/liquidity change;
- RSI/funding/liquidity penalties.

Missing Open Interest wird per Effective-Weight-Renormalisierung behandelt, nicht als 0.

MACD/ADX/Trend-Slope/ATR/Volume-Expansion werden inventarisiert, bleiben mangels source-defined Gewichtsmatrix zunaechst unweighted telemetry.

### Regime

Source-Phasen werden in bestehendes `MarketRegime` gemappt; keine zweite Taxonomie/Authority.

### Pattern

`PatternResearchEngine` + `PatternSignalResolver` bleiben Authority. Confluence verlangt mindestens zwei gleichgerichtete Timeframes plus `>=4h` Confirmation.

### Signal Fusion

Research-only Source-Gewichte:

```text
regimeFit        0.30
momentum         0.25
patternQuality   0.20
sentiment        0.15
executionQuality 0.10
```

Source-Grenzen `>=70` / Regime Fit `>=60` erzeugen nur Kontext, keine Trade-Freigabe.

### Kill Switch

L1-L4 werden read-only ausgewertet. Source-Limits sind `RESEARCH_DEFAULT_NOT_PRODUCTION_POLICY`; keine Broker-/Order-/Runtime-Mutation.

## 9. Fingerprint / Promotion

Die Research Evaluators verwenden die bestehende `scoringFingerprint`-Authority fuer Research-Lineage. Diese Fingerprints dokumentieren die Research-Ausfuehrung, machen die Challenger jedoch **nicht** produktiv executable.

Produktive Promotion benoetigt in derselben reviewten Modellversion:

- verifizierte Evidence-/DQ-/Freshness-Contracts;
- produktive executable weights + nominal-weights version;
- Effective-Feature-Fingerprint;
- Effective-Weight-Fingerprint;
- Out-of-sample Challenger-vs-Champion-Validierung;
- Stress-/Manipulation-/Exploit-/Liquidity-Shock-Tests;
- Korrelations-/Double-Counting-Analyse;
- explizite Owner-Freigabe.

## 10. P1 — Deterministic Portfolio Allocation / Position Sizing

P1 schliesst die Composition-Stufe zwischen extern govern­ten Portfolio-Targets und FT-5.

Contract:

```text
fintech-core/portfolio-allocation/0.1.0
```

P1 akzeptiert:

```text
versioned allocation policy
+ complete portfolio valuation
+ explicit target weights
  + targetAuthorityId
  + targetAuthorityVersion
  + evidenceRefs
```

P1 erzeugt keine Target Weights aus Scores/LLMs/Providern. Upstream Strategy/Suitability bleibt eine separate Authority.

Zunaechst gelten:

```text
RESEARCH/PAPER only
longOnly=true
leverageAllowed=false
```

Deterministische Gates:

- Workflow-/Portfolio-Identity und Zeitordnung;
- Fixed-Point-/Quote-Scale-Integritaet;
- cash + positions = total equity;
- per-asset concentration;
- max deployment;
- min cash reserve;
- rebalance threshold;
- target authority/evidence.

Ergebnis ist ein Proposal mit Target/Current/Delta Notionals und Replay-Hashes, immer `executionHandoffEligible=false`.

### Bounded FT-5 Portfolio-Risk Projection

Contract:

```text
fintech-core/portfolio-risk-projection/0.1.0
```

P1 projiziert ausschliesslich:

```text
projectedGrossExposure
currentEquity
portfolioEvidenceAuthorityId
portfolioEvidenceRefs
```

in den bestehenden FT-5 Risk-Evidence-Vertrag.

Nicht von P1 geliefert werden Order Notional, Peak Equity, Liquidity, Market Freshness oder Counterparty Evidence. FT-5 bleibt alleinige Risk-/Compliance-Decision-Authority. Die Projection besitzt eine explizite Authority ID/Version und prueft Target Notionals + Reserved Cash = Current Equity.

### P1 Persistence Decision

Keine neue Tabelle, Queue, Portfolio-Ledger- oder Event-Authority. Ein spaeterer durable Consumer muss die vorhandene FinTechCore Persistence-/Domain-Event-Authority ueber einen explizit reviewten Contract wiederverwenden.

## 11. Provider / Evidence Gap — current main

Aktuelle ProviderMatrix: `provider-matrix/1.9.0`.

Bereits vorhanden und wiederzuverwenden:

- CoinGecko / CoinAPI / historische EODHD Crypto Market Evidence;
- `DefiLlamaProtocolProvider` / `defi-protocol-evidence/1.1.0`;
- Binance Public / Kraken Futures Public;
- GoPlus;
- DEX Screener;
- Sourcify;
- Dune Saved-Query Evidence;
- Free Crypto News als primaere Crypto-News-Metadata/Provenance-Quelle;
- GDELT als sekundaere/cross-asset News Discovery;
- ProviderMatrix / Evidence/DQ Contracts;
- Pattern Research Foundation.

Noch als gebundene Evidence-Provider/Adapter zu vervollstaendigen:

- dedicated Honeypot Buy/Sell Simulation;
- Exploit Incident Identity/Lifecycle;
- Oracle Integrity/Liveness/Deviation Evidence;
- External Audit / Formal Verification Evidence;
- Holder Clustering / Sniper / Team / Exchange Wallet Methodology;
- Governance / Developer / Retention / Organic Activity;
- Token Unlock / Treasury / Staking Sustainability;
- governed Social Sentiment / NLP.

Keiner dieser Provider darf direkt eine Scoring-, Portfolio-Target-, Risk-Approval- oder Execution-Authority bilden.

## 12. Persistence / Security

Kanonisch bleiben:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
public.outbox_jobs
```

P1 fuehrt keine Datenbank-, Render-, Stripe-, Secret-, IAM- oder Execution-Mutation aus.

## 13. Current State

```text
current main = 14e4f3c8a309faae63fb336a432aac38ab08ceda
FT-0 ... FT-6B = DONE on main
Supersession A+B = DONE on main
FT-2D Meme/DeFi Research Scoring 0.3.0 = DONE on main / non-executable
P1 Portfolio Allocation = IMPLEMENTED ON MAIN-SYNC BRANCH
P1 bounded FT-5 portfolio-risk projection = IMPLEMENTED ON MAIN-SYNC BRANCH
crypto champion = crypto-technical-provenance@0.7.0 unchanged
Meme/DeFi productive promotion = BLOCKED
FT-7 = BLOCKED
FT-8 = PLANNED
FT-9 = PLANNED
```

Der historische P1-Branch war bei Wiederaufnahme 81 Commits hinter `main`; seine fachlich gueltigen Teile wurden selektiv auf einen frischen Branch vom aktuellen `main` portiert. Stale Dokument-/Registry-/Provider-Projektionen werden nicht uebernommen.

## 14. Naechste Schritte

1. fokussierte statische/Unit-Regression fuer Allocation + FT-5 Projection;
2. Main-/Open-PR-Korrelation vor PR erneut ausfuehren;
3. Hard-Gate Provider/Evidence Packages getrennt priorisieren: Honeypot -> Exploit -> Oracle -> Audit/Formal Verification -> Holder Clustering;
4. Backtest-/Stress-/Correlation-Evidence als getrennten P2-Validation-Scope behandeln;
5. erst danach produktive Meme/DeFi Model-Promotion separat Owner-gaten;
6. FT-7 erst nach separater Architektur-/Security-Entscheidung oeffnen.
