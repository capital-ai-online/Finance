# SC-2 Commodity Orchestrator — vollständige Roadmap

**SPT:** `SC-MD-SPT-0001`  
**Parent Work Package:** `SC-2 — Model Registry & Universal Asset Interface`  
**Authority:** ADR-0087 / `AUTH-GOV-AGENT-TRUST-ROOT`  
**Status:** ACTIVE ROADMAP — canonical implementation status is projected below from merged code/evidence  
**Original Baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Original execution branch:** `feat/commodity-orchestrator-research-boundary-2026-08-23`  
**Source package:** Google-Drive Commodity-Orchestrator documentation supplied 2026-08-23 plus repository canonical architecture/evidence  
**Status evidence:** `docs/evidence/sc-md/SC_COMMODITY_P2C_PROMOTION_GOVERNANCE_2026-08-25.md`  

## 0. Kanonische Implementierungsprojektion — 2026-08-25

> Die darunter erhaltenen Checkboxen bilden die ursprüngliche Roadmap-/Planungsbaseline ab und werden **nicht** rückwirkend als Merge-Nachweis interpretiert. Maßgeblich für den tatsächlichen Implementierungsstand sind gemergter Code, ADRs, Evidence, Tests und die folgende Projektion. Roadmap-Issue-Zustände sind in diesem Workstream keine Implementierungs-Authority.

| Phase | Kanonischer Status | Evidenz / verbleibendes Gate |
|---|---|---|
| P0-A | IMPLEMENTED | Research-/Authority-Boundary gemergt |
| P0-B | IMPLEMENTED IN CANONICAL CHAIN | Missing/Neutral-Semantik aus kanonischem Pfad isoliert; physische Legacy-Entfernung bleibt P2-E |
| P0-C | IMPLEMENTED | UAI, Taxonomie und Feature Contracts gemergt |
| P0-D | IMPLEMENTED | Commodity Provider-/Evidence-Pfade hinter zentraler Governance |
| P0-E | IMPLEMENTED | ein Commodity-Champion + vier `scoreEligible=false` Challenger in bestehender Registry |
| P1-A | IMPLEMENTED RESEARCH FOUNDATION | Energy Evidence/Contract/Challenger; keine Promotion |
| P1-B | IMPLEMENTED RESEARCH FOUNDATION | Industrial/Critical Metals Evidence/Contract/Challenger |
| P1-C | IMPLEMENTED RESEARCH FOUNDATION | Precious Metals Evidence/Contract/Challenger |
| P1-D | IMPLEMENTED RESEARCH FOUNDATION | Agriculture Evidence/Contract/Challenger |
| P1-E | IMPLEMENTED | source-/feature-spezifische DQ/Hard Gates fail-closed |
| P2-A | FOUNDATION IMPLEMENTED; EMPIRICAL EVIDENCE OPEN | Weight/Correlation/Sensitivity/Fingerprint Contracts vorhanden; reale Reports je Modell erforderlich |
| P2-B | ENGINE + VINTAGE GOVERNANCE IMPLEMENTED; EMPIRICAL DATASETS OPEN | PIT Contracts, Walk-forward/OOS Engine und Historical Vintage Acquisition gemergt; reale archivierte Datasets/Runs fehlen noch |
| P2-C | IN PROGRESS | immutable Descriptor, Resilience/Stress/Promotion Review und Owner-Decision-Binding auf `feat/commodity-p2c-promotion-governance-2026-08-25`; keine Registry-Mutation |
| P2-D | OPEN | CanonicalScoreResult/Explainability/Ranking für Kategorie-Challenger erst nach Evidence Review |
| P2-E | OPEN | Legacy RawMaterials Routes/UI/Scorer bleiben physisch vorhanden, aber non-canonical |
| P3-A | OPEN | Shadow Runtime / Observability |
| P3-B | OPEN | Universe Coverage / SLA |
| P3-C | BLOCKED | Controlled Champion Promotion erst nach vollständiger P2/P3-Evidence + Human/Owner-Entscheidung |
| P3-D | OPEN / SEPARATE | Resource Project Valuation bleibt eigener Model Scope |

**Merged implementation anchors:** PR #513 (P0/P1), PR #518 (P2 Validation Foundation), PR #519 (Historical Walk-forward/OOS), PR #521 (Historical Vintage Acquisition).  
**Current architectural invariant:** `ScoringModelRegistry` und `ScoringDispatcher` bleiben die einzigen produktiven Model-/Execution-Authorities; `commodity-evidence-scoring@1.0.0` bleibt bis zu einer separat kontrollierten Promotion der Commodity-Champion.

## 1. Ziel

CAPITAL-AI erhält einen eigenständigen Commodity/Rohstoff-Orchestrator, dessen fachliche Scoring-Modelle vollständig unabhängig vom Crypto-Scoring arbeiten, während die gemeinsame Enterprise-Wertschöpfungskette wiederverwendet wird:

```text
UAI
  -> governed Evidence Acquisition / Provider Gateway
  -> Evidence + Data Quality Gate
  -> commodity-specific Feature Contract
  -> existing ScoringModelRegistry
  -> existing ScoringDispatcher
  -> commodity-specific Domain Executor Adapter
  -> CanonicalScoreResult
  -> existing Ranking / Eligibility
  -> EventMesh / Traceability / Supervisor
```

Der Commodity-Orchestrator ist Research-/Evidence-Composition und besitzt keine produktive Scoring-, Ranking-, Trade- oder Execution-Authority.

## 2. Nicht verhandelbare Architekturgrenzen

1. Kein zweiter Dispatcher.
2. Keine zweite Model Registry oder YAML-Registry als produktive Authority.
3. Kein Crypto-Executor und keine Crypto-On-Chain-Features im Commodity-Modul.
4. Keine LLM-/Agent-Zahl darf Provider-Evidence oder einen `CanonicalScoreResult` ersetzen.
5. Missing/stale/invalid Evidence wird nicht auf `0`, `50`, PASS oder einen neutralen Score gesetzt.
6. Hard Gates sind Policy-/Eligibility-Grenzen und keine additiven Score-Faktoren.
7. Commodity-Unterklassen dürfen eigene Feature-/Weight-Profile besitzen; sie werden über die bestehende Registry versioniert.
8. Neue Modelle starten als Challenger/Shadow und sind `scoreEligible=false`, bis Promotion-Evidence vollständig ist.
9. Correlated Features dürfen ohne Korrelations-/Double-Counting-Prüfung nicht mehrfach additiv gewichtet werden.
10. Backtesting muss point-in-time, no-lookahead und mit derselben deterministischen Evaluator-Logik wie Runtime arbeiten.

## 3. Quellen- und Fachbaseline

### Repository-Authority

- `AGENTS.md`
- `docs/architecture/ORCHESTRATORS_AND_SCORING_ENGINES.md`
- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- ADR-0087 Single Scoring Architecture
- bestehende `ScoringModelRegistry`, `ScoringDispatcher`, `ScoringExecutorAdapters`
- bestehender `commodity-evidence-scoring/1.0.0`
- bestehende `market-evidence-dq/1.0.0`-/Canonical-Integrity-Mechanismen

### Fachliche Primärquellen

- Regulation (EU) 2024/1252 (Critical Raw Materials Act): Economic Importance und Supply Risk als getrennte Achsen; Produktions-/Handels-/Recycling-/Substitutionsdaten.
- USGS 2025 Critical Minerals Methodology, rev. 2026: wirtschaftliche Effekte von Trade Disruptions, Importabhängigkeit, Produktionskonzentration und Single Point of Failure.
- EIA Open Data API v2: Petroleum, Natural Gas, Coal, STEO/AEO und Energie-Fundamentaldaten.
- USDA FAS PSD API: Production, Supply & Distribution sowie Release-Date-/Revision-Informationen für Agrarrohstoffe.
- CFTC Commitments of Traders Public Reporting API: Positioning-Evidence für Futures-Märkte.

## 4. Ziel-Taxonomie

### Instrumentebene

- `commodity-benchmark` — börsen-/spot-/futuresbezogene Benchmark-Bewertung.
- `commodity-physical-market` — physischer/OTC-Markt, nur bei ausreichender verifizierter Evidence.
- `commodity-resource-project` — Mine/Förderprojekt/Reserve; separates zukünftiges Bewertungsmodell, niemals mit Benchmark-Scoring vermischen.

### Commodity-Domain

- `energy`
- `industrial_metals`
- `precious_metals`
- `agriculture`
- `critical_materials` als orthogonale Criticality/Supply-Risk-Eigenschaft, nicht als konkurrierende Hauptklasse.

## 5. Score-Semantik

Produktiv werden mindestens folgende voneinander getrennte Dimensionen modelliert:

1. **Market Score** — Trend, Momentum, Breakout, Volatilitätsqualität, Liquidität und verifizierte Marktstruktur.
2. **Fundamental Balance Score** — kategoriespezifische Angebots-/Nachfrage-/Inventory-/Production-/Stocks-Daten.
3. **Positioning / Structure Score** — z. B. CFTC Positioning und Futures-Termstruktur, sofern verifiziert verfügbar.
4. **Supply Risk / Criticality Score** — Konzentration, Importabhängigkeit, Substituierbarkeit, Recycling, Governance-/Trade-Risk; getrennt vom Market Score.
5. **Data Quality / Confidence** — keine additive Alpha-Komponente; steuert Berechenbarkeit, Coverage und Promotion/Eligibility.

Ein Cross-Dimension Composite wird erst nach Backtesting, Korrelationsanalyse und expliziter Modellentscheidung zugelassen.

---

# 6. Umsetzungsroadmap

## P0-A — Research-/Authority-Boundary — IMPLEMENTED ON BRANCH

**Ziel:** bestehenden `RawMaterialsOrchestrator` von produktiver Score-Authority entkoppeln.

- [x] `RESEARCH_CONTEXT_ONLY`-Contract.
- [x] `canonical=false`, `scoreEligible=false`, `scoringAuthority=false`, `executionAuthority=false`.
- [x] `RawMaterialsScoringService` aus Orchestrator entfernt.
- [x] Legacy-Dashboard-Shape nur an Route als expliziter Compatibility Adapter isoliert.
- [x] Regression Guard gegen Dispatcher-/Registry-/Scoring-Import im Orchestrator.

**Exit Gate:** keine direkte produktive Score-Ausführung aus dem Orchestrator.

## P0-B — Legacy Neutral Defaults & Semantic Integrity

**Ziel:** synthetische Neutralwerte und widersprüchliche Feature-Semantik aus zukünftiger kanonischer Commodity-Evidence entfernen.

- [ ] Inventar aller `?? 50`/Fallback-50/Default-Score-Pfade in Raw-Materials Agents, Scoring und UI.
- [ ] Missing-Werte als `unknown`/`missing` mit Coverage statt Neutralwert modellieren.
- [ ] `substitution_potential` semantisch eindeutig definieren (`substitutability` oder `substitution_difficulty`) und alle Daten/Kommentare migrieren.
- [ ] `ACTIVE_VERSION`/Legacy `v0.5.4` vs `v0.6.0` Drift dokumentieren und Legacy-Lifecycle markieren.
- [ ] LLM-Outputs explizit `UNVERIFIED_AGENT_RESEARCH`; niemals Feature Promotion ohne Source Evidence.
- [ ] Negative Tests für missing/stale/invalid/no-source.

**Exit Gate:** keine synthetische Neutralisierung kann in einen kanonischen Feature Snapshot gelangen.

## P0-C — Commodity Identity, Taxonomy & Feature Contracts

**Ziel:** providerneutrale, UAI-gebundene Commodity Feature Contracts ohne Parallelverträge.

- [ ] UAI `instrumentKind`/`subtype` für Benchmark, Physical und Resource Project festlegen.
- [ ] bestehende Scoring-/Integrity-Verträge erweitern statt `FeatureSnapshot`/`ScoreBreakdown` doppelt neu zu definieren.
- [ ] Feature-Metadaten: id, semantic version, unit, direction, evidence refs, observedAt, retrievedAt, freshness, status, confidence.
- [ ] kategoriespezifische Feature Sets: Energy, Industrial Metals, Precious Metals, Agriculture.
- [ ] `Supply Risk/Criticality` als getrennte Feature-Domain.
- [ ] Feature/Weight fingerprint lineage wiederverwenden.
- [ ] Contract tests: category mismatch, unit mismatch, stale evidence, missing required feature, identity mismatch.

**Exit Gate:** jeder Commodity-Faktor besitzt eindeutige Semantik, Unit, Evidence und Version.

## P0-D — Commodity Provider Gateway & Evidence Contract

**Ziel:** bestehende direkte Commodity-Provider-Pfade in die zentrale Provider-Governance überführen.

- [ ] TwelveData `commodity` in `ProviderMatrix`/Gateway Capability registrieren.
- [ ] `CommodityMarketEvidence.provider` providerneutral statt Literal `'TwelveData'` machen.
- [ ] direkte TwelveData-Aufrufe hinter bestehenden Gateway/Adapter, Rate-Limit, Circuit-Breaker und Provider-Health-Grenzen führen.
- [ ] Mapping/Identity fail-closed; keine fuzzy/ambiguous provider symbol promotion.
- [ ] Evidence IDs, observed/retrieved timestamps und freshness in bestehende DQ Envelope binden.
- [ ] Provider failure/fallback darf niemals statische Registry-Werte als Live Evidence deklarieren.

**Exit Gate:** kein kanonischer Commodity Market-Evidence-Pfad umgeht ProviderMatrix/Gateway.

## P0-E — Canonical Commodity Model Registry Design

**Ziel:** Kategorie-Modelle in der bestehenden `ScoringModelRegistry`, ohne zweite YAML-Authority.

- [ ] aktuelle `commodity-evidence-scoring@1.0.0` Lifecycle/Rolle dokumentieren.
- [ ] Challenger Descriptors für `commodity-energy`, `commodity-industrial-metals`, `commodity-precious-metals`, `commodity-agriculture` entwerfen.
- [ ] jeweils eigene `featureContractVersion`, `executorKey`, lifecycle=`challenger`, `scoreEligible=false`.
- [ ] Weight Profiles als versionierte Modellkonfiguration in bestehende Registry-/Contract-Struktur integrieren.
- [ ] keine produktiven Gewichte aus der Drive-Dokumentation ungeprüft übernehmen.
- [ ] Collision-/Ambiguity-Tests für Registry Scopes.

**Exit Gate:** genau ein produktiver Champion pro Scope; neue Modelle sind nicht implizit ausführbar.

## P1-A — Energy Evidence & Challenger

**Ziel:** Energy-spezifische Fundamentaldaten und ein nicht-produktiver Challenger.

- [ ] EIA API v2 Adapter für relevante Petroleum/Natural-Gas/Coal/STEO-Daten.
- [ ] Inventory, Production, Demand/Consumption, Imports/Exports und ggf. Storage-/Refinery-Daten mit Release/Freshness.
- [ ] Termstruktur nur aus verifizierten Laufzeitdaten; keine symbolbasierte Synthese.
- [ ] CFTC Positioning für zugelassene Futures-Kontrakte.
- [ ] Market Evidence aus bestehender Commodity-Market-Pipeline.
- [ ] Energy Feature Contract + deterministic evaluator.
- [ ] Challenger-Ausgabe Research/Shadow only.

**Exit Gate:** reproduzierbarer Energy Feature Snapshot mit vollständiger Provenance.

## P1-B — Industrial / Battery / Critical Metals Evidence & Challenger

**Ziel:** Metallmodell mit produktions-/supply-risk-orientierter Evidence.

- [ ] USGS Mineral Commodity Data/Methodik als primäre Supply-Risk-Quelle prüfen und adapterfähig abbilden.
- [ ] EU CRMA Economic Importance/Supply Risk als getrennte Regulatory/Research Evidence modellieren.
- [ ] Production, concentration, import dependency, recycling, substitution und reserve/supply attributes nur source-backed.
- [ ] Market price/history getrennt von Criticality.
- [ ] Resource-project-spezifische Ore Grade/Tonnage-Werte nicht in Benchmark-Score übernehmen.
- [ ] Industrial Metals Feature Contract + Challenger.

**Exit Gate:** Market Score und Criticality/Supply-Risk Score sind separat reproduzierbar.

## P1-C — Precious Metals Evidence & Challenger

**Ziel:** Edelmetallmodell ohne ungeeignete Erz-/Projektmetriken.

- [ ] Preis-/Trend-/Volatilitäts-/Liquiditäts-Evidence.
- [ ] verifizierbare Makro-/Positioning-Faktoren nur nach separatem Contract Review.
- [ ] CFTC Positioning für geeignete Futures-Kontrakte.
- [ ] Supply-/recycling-/concentration evidence nur, wenn Quelle und Zeitbezug belastbar sind.
- [ ] Precious Metals Feature Contract + Challenger.

**Exit Gate:** keine Resource-Project-Faktoren im Benchmark-Modell.

## P1-D — Agriculture Evidence & Challenger

**Ziel:** Agrar-Scoring aus offiziellen Production/Supply/Distribution-Daten.

- [ ] USDA FAS PSD Adapter einschließlich `dataReleaseDates`/Revision Awareness.
- [ ] Production, Consumption, Ending Stocks/Stocks-to-Use, Imports/Exports und Yield, sofern im jeweiligen Commodity Contract verfügbar.
- [ ] CFTC Positioning für zugelassene Futures-Kontrakte.
- [ ] Seasonality nur point-in-time/historisch korrekt, nicht aus Future Information.
- [ ] Agriculture Feature Contract + Challenger.

**Exit Gate:** Agrar-Snapshots sind revision-aware und frei von Lookahead.

## P1-E — Hard Gates & Data Quality Policy

**Ziel:** Gates als eigenständige, versionierte Eligibility-/Computability-Grenze.

- [ ] bestehende DQ Gate-Funktionen wiederverwenden; kein zweiter `hard-gate.service` ohne Bedarf.
- [ ] required feature coverage je Commodity Domain.
- [ ] max age/freshness je Datenquelle und Feature, nicht global pauschal `60 min`.
- [ ] source unavailable / identity mismatch / unit mismatch / stale required evidence => `SCORE_NOT_COMPUTABLE`.
- [ ] Illiquidity/event-risk nur dort als Hard Gate, wo Evidenz und Policy explizit freigegeben sind.
- [ ] `warn`/`degrade` darf keinen Block überschreiben.

**Exit Gate:** kein hoher Score kann ein Blocking Gate überstimmen.

## P2-A — Weight Profiles, Correlation & Double-Counting Control

**Ziel:** wissenschaftlich/empirisch begründete Gewichte statt direkt übernommener Beispielwerte.

- [ ] Drive-Matrizen 35/20/15/... ausschließlich als Research Hypothesis erfassen.
- [ ] Feature correlation, redundancy und latent-factor groups bestimmen.
- [ ] correlated features nicht mehrfach additiv belohnen.
- [ ] missing feature renormalization nur innerhalb freigegebener Faktorgruppen.
- [ ] Sensitivitätsanalyse und Weight Stability.
- [ ] versionierter effective-feature/effective-weight fingerprint.

**Exit Gate:** jede Gewichtung besitzt Backtest-/Sensitivity-/Correlation-Evidence.

## P2-B — Point-in-Time Backtesting Framework

**Ziel:** gleiche deterministische Modelllogik historisch und live validieren.

- [ ] Backtest Run Contract: modelId/version, universe, domains, start/end, rebalance, holding period, topN, confidence.
- [ ] point-in-time Feature Snapshots; nur Daten verwenden, die am Entscheidungszeitpunkt veröffentlicht/verfügbar waren.
- [ ] Release-/Revision-Zeitpunkte für USDA/EIA/sonstige Fundamentals berücksichtigen.
- [ ] keine survivorship-, lookahead- oder future-revision leakage.
- [ ] walk-forward / expanding-window Out-of-Sample.
- [ ] Transaction-cost/slippage assumptions getrennt und versioniert.
- [ ] Metriken: rank IC/monotonicity, hit rate, return/risk diagnostics, turnover, drawdown, stability by regime/domain.
- [ ] Benchmark gegen aktuellen Commodity Champion und naive baselines.

**Exit Gate:** Challenger-Promotion ist ohne OOS-/Stress-/Leakage-Evidence blockiert.

## P2-C — Model Versioning & Promotion Package

**Ziel:** vollständige Reproduzierbarkeit und Governance je Modellrevision.

- [ ] SemVer für model/feature/weight/evidence contract.
- [ ] immutable model descriptor + training/calibration/backtest lineage.
- [ ] `validFrom`/optional `validUntil` und supported sources.
- [ ] promotion evidence bundle: DQ coverage, backtest, stress, correlation, provider resilience.
- [ ] Champion/Challenger diff und rollback target.
- [ ] explicit Owner approval für produktive Promotion.

**Exit Gate:** kein Modell kann allein durch Code-Deployment Champion werden.

## P2-D — Explainability, Canonical Result & Ranking Integration

**Ziel:** neue Commodity-Modelle nutzen bestehende Output-/Ranking-Authority.

- [ ] CanonicalScoreResult bleibt einzige produktive Score Response.
- [ ] Factors/used/missing/evidence/model lineage in bestehender Integrity-Struktur.
- [ ] separate Anzeige von Market, Fundamental und Supply-Risk/Criticality ohne irreführenden Universalwert.
- [ ] RankingBoard konsumiert ausschließlich READY canonical score; keine Frontend-Berechnung.
- [ ] No Demo Data / no placeholder score.
- [ ] UI-Kommentare bei nicht vorhandenem Pattern/Feature statt Placeholder.

**Exit Gate:** Frontend enthält keine Commodity-Scoring-Authority.

## P2-E — Legacy Retirement / Strangler Completion

**Ziel:** historische Rohstoff-Scorepfade physisch entfernen, sobald Consumer migriert sind.

- [ ] `RawMaterialsDashboard` auf Research Context + canonical verified score trennen.
- [ ] `/api/raw-materials/analyze` Legacy Compatibility Payload entfernen.
- [ ] `/api/raw-materials/score` als Sandbox entweder klar isolieren oder ersetzen; niemals scoreEligible.
- [ ] `RawMaterialsScoringService` und statische pseudo-evidenzielle Score-Nutzung entfernen/archivieren, sobald keine Consumer verbleiben.
- [ ] alte `SCORING_VERSIONS`/`RAW_MATERIALS_DATABASE` Score-Faktoren nicht als aktuelle Evidence führen.
- [ ] dead imports/routes/tests/docs entfernen oder als HISTORICAL markieren.

**Exit Gate:** produktive oder quasi-produktive Legacy Commodity Score-Pfade = 0.

## P3-A — Shadow Runtime & Observability

**Ziel:** reale Provider-/Model-Qualität vor Promotion messen.

- [ ] Challenger parallel lesen, aber keine Ranking-/Eligibility-Wirkung.
- [ ] Provider coverage, freshness, latency, error rate, circuit breaker state.
- [ ] Score stability/drift und feature coverage.
- [ ] model-version/evidence fingerprint in Audit/Traceability.
- [ ] budget/rate-limit controls für keyed APIs.

**Exit Gate:** definierte Beobachtungsperiode ohne ungeklärte P0/P1 Integrity Findings.

## P3-B — Universe Coverage / SLA

**Ziel:** Commodity-Unterklassen erfüllen bestehende Universe-SLA ohne Filler.

- [ ] mindestens 24 reale Kandidaten in zulässigen Commodity-Segmenten, soweit Provider-Evidence verfügbar.
- [ ] Unterkategorie-Coverage messen, nicht synthetisch auffüllen.
- [ ] `SOURCE_UNAVAILABLE`/`SCORE_NOT_COMPUTABLE` transparent ausweisen.
- [ ] Provider-Kosten/Quota gegen 24-Asset-Budget validieren.

**Exit Gate:** SLA wird aus realen Katalogidentitäten + Evidence erfüllt oder transparent als Gap ausgewiesen.

## P3-C — Controlled Champion Promotion

**Ziel:** einzelne Kategorie-Challenger kontrolliert produktiv schalten.

Je Modell zwingend:

- [ ] verifizierte Provider Coverage/Freshness.
- [ ] vollständige Contract-/negative Tests.
- [ ] Point-in-Time OOS Backtesting.
- [ ] Stress-/Regime-Prüfung.
- [ ] Correlation/Double-Counting Review.
- [ ] Security/Data-Integrity Review.
- [ ] Architecture/ADR impact review.
- [ ] finaler Main-/Open-PR-Sync.
- [ ] Owner-visible Promotion Decision.
- [ ] exakt ein Registry Champion für den Scope.
- [ ] rollbackfähige Vorgängerversion.

## P3-D — Resource Project Valuation (separates Folgepaket)

**Ziel:** Mine/Förderprojekt-Bewertung erst nach Benchmark-Orchestrator stabilisieren.

Mögliche spätere Features:

- ore grade / quality
- recoverable reserves / resources
- recovery rate
- capex / opex
- marginal production cost
- infrastructure / logistics
- jurisdiction / permitting
- mine/project life
- time-to-production

Diese Features dürfen nicht in Commodity-Benchmark-Scores gelangen. Ein Resource Project benötigt eigenen `instrumentKind`, Feature Contract, Backtesting/Validation und Model Scope.

---

# 7. Abhängigkeiten / Reihenfolge

```text
P0-A Research Boundary [done]
  -> P0-B Legacy/Missing Semantics
  -> P0-C Identity + Feature Contracts
  -> P0-D Provider Gateway
  -> P0-E Registry Challenger Design
       -> P1-A Energy
       -> P1-B Industrial/Critical Metals
       -> P1-C Precious Metals
       -> P1-D Agriculture
       -> P1-E Hard Gates / DQ
            -> P2-A Weights/Correlation
            -> P2-B Backtesting
            -> P2-C Version/Promotion Package
            -> P2-D Explainability/Ranking
            -> P2-E Legacy Retirement
                 -> P3-A Shadow Runtime
                 -> P3-B Universe SLA
                 -> P3-C Champion Promotion
                 -> P3-D Resource Project (separate follow-up)
```

Category implementations P1-A through P1-D may proceed in parallel only after P0-C/P0-D/P0-E contracts are stable.

# 8. Provider-Priorität

| Domain | Provider/Quelle | Rolle | Priority |
|---|---|---|---|
| Market Price/History | existing TwelveData commodity path, migrated behind Gateway | market evidence | P0 |
| Energy Fundamentals | EIA API v2 | primary official evidence | P1 |
| Agriculture Fundamentals | USDA FAS PSD | primary official evidence | P1 |
| Futures Positioning | CFTC COT Public Reporting API | primary official evidence | P1 |
| Critical Minerals / Supply Risk | USGS | primary official research/evidence | P1 |
| EU Criticality | EU CRMA methodology/data | regulatory/criticality evidence | P1 |
| News context | existing GDELT | research context only unless separately promoted | P2 |

Neue Anbieter werden vor Integration auf Lizenz, Terms, Kosten/Quota, Security, Provenance, Enterprise-Eignung und Lock-in geprüft.

# 9. Drive-Dokument: Übernahme / Nicht-Übernahme

| Vorschlag | Entscheidung | Begründung |
|---|---|---|
| Feature Contract | ADAPT | bestehende Contracts erweitern, kein zweites Framework |
| Scoring Contract | ADAPT | `CanonicalScoreResult` bleibt Authority |
| Category Weight Profiles | RESEARCH HYPOTHESIS | erst nach Backtesting/Correlation |
| Commodity Domain Executor | ADAPT | als Adapter hinter bestehendem Dispatcher |
| Hard Gates | ADAPT | bestehende DQ/Policy-Gates wiederverwenden |
| Backtesting Contract | ADOPT CONCEPT | point-in-time/no-lookahead ergänzen |
| Model Version Contract | ADAPT | bestehende Registry/Integrity Lineage nutzen |
| Commodity Fundamentals | ADOPT/VERIFY | je Kategorie + verifizierte Provider |
| Crypto On-Chain im Commodity Modul | REJECT | Domain-Korrelation/Parallelarchitektur |
| eigener Crypto Domain Executor | REJECT | bestehende Crypto Authority |
| `commodity-model-registry.yaml` als Registry | REJECT | zweite Model Registry verboten |
| NestJS `@Injectable` Service Layer | REJECT FOR NOW | Repo ist Express/TypeScript; unnötige Framework-Abhängigkeit |
| globale 60-Minuten Freshness | REJECT | source-/feature-spezifische Release-Kadenzen |
| pauschale Trade-Ready Gates | REJECT | Research/Scoring ist keine Trade-Authority |

# 10. Definition of Done — Gesamtprogramm

Der Commodity-Orchestrator gilt erst als vollständig integriert, wenn:

1. Research, Evidence, Scoring und Ranking Authorities strikt getrennt sind.
2. keine kanonische Bewertung auf LLM-Schätzungen, Default-50 oder statischen Pseudodaten beruht.
3. alle produktiven Commodity-Evidence-Pfade durch zentrale Provider-Governance laufen.
4. jede Kategorie einen versionierten Feature Contract und eine nachvollziehbare Datenbasis besitzt.
5. Supply Risk/Criticality nicht mit Market Score semantisch vermischt wird.
6. Challenger point-in-time/OOS/backtest/stress/correlation validiert sind.
7. jede Promotion Owner-visible und Registry-gesteuert erfolgt.
8. CanonicalScoreResult/Ranking/UI keine parallele Scoring-Authority enthalten.
9. Legacy-Commodity-Scorepfade vollständig retired oder eindeutig non-authoritative sandbox-only sind.
10. finaler Main-Sync, Security/Data-Integrity/Governance und erforderliche CI vor Merge/Promotion PASS sind.
