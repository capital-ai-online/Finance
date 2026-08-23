# CV — Crypto Visualization Optimization

**Status:** ACTIVE / CV-0 IMPLEMENTED ON FEATURE BRANCH  
**Stand:** 2026-08-23  
**Baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Branch:** `feat/crypto-visualization-work-packages-2026-08-23`  
**Parent Authorities:** `docs/frontend/FRONTEND_ARCH.md`, `docs/frontend/FRONTEND_ROADMAP.md`, ADR-0087, ADR-0099, ADR-0100, `SC-MD-SPT-0001`  
**Scope:** Presentation / read-only visualization. Dieses Work Package erzeugt keine zweite Scoring-, Evidence-, MarketData-, Ranking-, Pattern-, Regime- oder Execution-Authority.

## 1. Ausgangslage auf aktuellem Main

Der Krypto-Backend-/Scoring-Stand ist der grafischen Darstellung inzwischen voraus:

- produktiver Crypto-Champion: `crypto-technical-provenance@0.7.0`, `scoreEligible=true`, verified Evidence erforderlich;
- Research-Challenger: `crypto-meme-integrity@0.3.0` und `crypto-defi-fundamental@0.3.0`, beide `scoreEligible=false`, `research-only:not-executable`;
- Research-Module für Sentiment, Momentum, Regime-Projektion, Multi-Timeframe-Pattern-Confluence, Signal Fusion und L1-L4 Kill-Switch-Telemetrie;
- Extended Evidence Contract `crypto-extended-evidence/1.4.0` mit DeFiLlama, GoPlus EVM/Solana, Binance Public, Kraken Futures Public, DexScreener, Sourcify, Dune und GDELT;
- MarketData History mit verifizierten 4h-Bars, aktuell kanonisch als `timestamp + close` projiziert;
- `RankingBoard` als kanonische Ranking-Fläche mit bis zu 24 Kandidaten je Assetklasse, Top/Worst 3, Sentiment, Momentum, Pattern, Coverage und Universe SLA;
- `CryptoScoringEnterprise` zeigt Score-Gauge, Intelligent Score, Radar, Faktor-Detailwerte, Trade-Setup-Ladder, Coverage und Provider/Evidence;
- `EnterpriseAsset4hChart` visualisiert aktuell verifizierte Close-Werte als Area Chart.

### Festgestellte Visual-Gaps

1. **Authority-Semantik ist visuell zu wenig sichtbar.** Canonical Score, Research Assessment und Evidence-only Telemetrie müssen auf den ersten Blick unterscheidbar sein.
2. **Radar + Progressbars komprimieren zu stark.** Hard Gates, Correlation Groups, Missing Evidence und Research-Gewichte werden nicht als Modellstruktur sichtbar.
3. **4h-Marktchart ist für Krypto zu flach.** Der aktuelle History-Contract liefert nur `close`; OHLCV, Volumen-Pane, Crosshair und Trade-Setup-Overlays fehlen.
4. **Multi-Timeframe-Forschung ist im Backend vorhanden, aber nicht als Timeframe-Matrix sichtbar.** Gleichzeitig muss die kanonische 30×1D-Scorebindung klar getrennt bleiben.
5. **Evidence-Provenance ist textlastig.** Providerstatus, Freshness, Coverage und Evidence-Lücken benötigen eine scanbare Matrix.
6. **Ranking ist listenorientiert.** Cross-sectional Breadth, Cluster, Momentum-/Sentiment-Verteilung und DeFi/Meme-Segmente sind nicht als Heatmap/Treemap sichtbar.
7. **Meme- und DeFi-Challenger besitzen unterschiedliche Modelltopologien, werden im UI aber nicht als eigene Research Lenses dargestellt.**

## 2. State-of-the-Art Referenzbild

Die Zielrichtung wird nicht als Kopie eines Fremdprodukts umgesetzt. Relevante Muster aus aktuellen Crypto-/Financial-Analytics-Produkten sind:

- Marktübersicht als Heatmap/Treemap mit frei wählbarer Größen- und Farbmetrik;
- Screener mit Table- und Chart-Views sowie Drill-down;
- synchronisierte Financial-Chart-Panes für Preis, Volumen und Indikatoren;
- mehrere analytische Linsen unter einem Composite Read statt Vermischung aller Signale in einer einzigen Zahl;
- kombinierte On-chain-, Spot- und Derivatives-Sichten;
- flexible Dashboards mit Time Series, Counters, Tables und Research-Kontext;
- klare Unterscheidung von Datenstatus, Unsicherheit und Nichtverfügbarkeit.

CAPITAL-AI soll diese Muster um einen eigenen Schwerpunkt erweitern: **Evidence-, Governance- und Model-Lineage-native Visualisierung**.

## 3. OSS-/Library-Entscheidung

### Bestehender Stack — zuerst nutzen

- `Recharts 3.9`: weiterhin für Gauge, einfache Area/Line/Bar, Radar und kleine Dashboards.
- `D3 7.9`: bevorzugt für maßgeschneiderte Heatmaps, Treemaps, Matrix-/Brush-/Scale-Logik, wenn Recharts nicht reicht.

### Kandidat für Financial Charting

**TradingView Lightweight Charts 5.2** ist für CV-2 als gezielter Kandidat zu evaluieren:

- Candlestick/OHLC, Bar, Histogram, Line, Area;
- Canvas-basiert und für Financial Charts optimiert;
- Pane-Support vorhanden;
- Apache-2.0, aber NOTICE-/Attribution-Anforderung beachten.

**Entscheidung:** keine Dependency in CV-0 hinzufügen. Einführung nur in einem separaten Implementierungs-PR nach Bundle-, Lizenz-/Attribution-, Accessibility- und Integrationstest.

### Apache ECharts 6

ECharts 6 bietet Candlesticks, Heatmaps, `visualMap`, `dataZoom`, Matrix-Koordinatensystem und professionelle Trading-Compositions. Da CAPITAL-AI bereits Recharts + D3 besitzt, würde ECharts derzeit eine dritte allgemeine Visualisierungsbibliothek erzeugen.

**Entscheidung:** nicht als Default aufnehmen. Nur erneut evaluieren, falls CV-4/CV-6 mit D3 nachweislich unverhältnismäßig komplex oder performancekritisch werden.

---

# 4. Umsetzungsstatus

| Paket | Priorität | Status | Nachweis |
|---|---:|---|---|
| CV-0 Authority/View-Model Contract | P0 | **IMPLEMENTED ON FEATURE BRANCH** | `docs/evidence/frontend/CV0_CRYPTO_VISUALIZATION_AUTHORITY_2026-08-23.md` |
| CV-1 Score Command Center | P0 | NEXT | noch nicht gestartet |
| CV-2 Verified Market Chart v2 | P0/P1 | PLANNED | Contract-/Library-Spike offen |
| CV-3 Factor & Model Explorer | P0 | PLANNED | offen |
| CV-4 Evidence & Provenance Matrix | P1 | PLANNED | offen |
| CV-5 Multi-Timeframe Lens | P1 | PLANNED | offen |
| CV-6 Ranking Heatmap & Breadth | P1 | PLANNED | offen |
| CV-7 Meme & DeFi Research Lenses | P1/P2 | PLANNED | offen |
| CV-8 Derivatives / Market Structure | P2 | PLANNED | offen |
| CV-9 Accessibility / Performance Gate | P0 Gate | ACTIVE PER WAVE | CV-0 statische Regressionen vorhanden; Live-A11y/Performance noch nicht gemessen |

# 5. Arbeitspakete

## CV-0 — Crypto Visualization Contract & Authority Labels

**Priorität:** P0  
**Status:** **IMPLEMENTED ON FEATURE BRANCH**  
**Ziel:** eine read-only View-Model-Grenze zwischen Backend-Contracts und Visualisierung schaffen, ohne fachliche Regeln im Frontend zu duplizieren.

### Umgesetzt

- [x] `CryptoVisualizationViewModel` / `CryptoVisualizationMetric` als reine Presentation Projection definiert.
- [x] Authority-Metadaten:
  - `CANONICAL_SCORE`
  - `RESEARCH`
  - `EVIDENCE_ONLY`
  - `MARKET_DATA`
- [x] `status`, `observedAt`, `retrievedAt`, Provider-/Evidence-Referenzen sowie optionale Eligibility-Felder abbildbar.
- [x] Missing Values bleiben `null`/`undefined`; kein `0`, `50`, READY oder PASS wird erzeugt.
- [x] `AuthorityBadge` implementiert.
- [x] `FreshnessBadge` implementiert; keine lokalen Freshness-Schwellen.
- [x] `EvidenceStateIndicator` implementiert.
- [x] `ResearchOnlyBanner` implementiert und screenreader-lesbar.
- [x] Binance Quick Analysis trennt `MARKET_DATA` und `RESEARCH` sichtbar.
- [x] 4h Market Chart projiziert `qualityState`, Zeitstempel, Provider und Evidence über die CV-0-Grenze.
- [x] statischen Vorab-Claim `4H · verified` entfernt; Status folgt dem gelieferten Contract.
- [x] Regressionstest `tests/unit/cryptoVisualizationContract.test.ts` ergänzt.
- [x] Evidence-Dokumentation erstellt.

### Akzeptanzstatus

- [x] Research kann nicht als kanonische Authority gekennzeichnet werden, ohne den Presentation-Consistency-Guard zu verletzen.
- [x] `scoreEligible=false` und `executionEligible=false` sind im `ResearchOnlyBanner` sichtbar und per ARIA lesbar.
- [x] Keine Modellgewichte oder Gate-Regeln werden im Frontend neu berechnet.
- [x] Contract-/Regressionstest gegen Authority-Verwechslung im Source vorhanden.
- [ ] TypeScript/Unit/Production-Build real ausgeführt und PASS nachgewiesen — **noch offen; nicht behauptet**.
- [ ] Hosted `build-and-test` — erst nach späterer PR-Erstellung gemäß Kosten-/Governance-Regel.

### Nachweis

- Code-Commit: `a1dbac4a00b909e2af160462a891fddbf4f54299`
- Evidence: `docs/evidence/frontend/CV0_CRYPTO_VISUALIZATION_AUTHORITY_2026-08-23.md`

---

## CV-1 — Crypto Score Command Center

**Priorität:** P0  
**Status:** NEXT  
**Ziel:** den oberen Bereich des Enterprise Crypto Scorers von einer Gauge-Sammlung zu einem klaren Entscheidungs-/Evidence-Cockpit umbauen.

### Zielaufbau

1. Asset Identity + Marktstatus + Datenfreshness.
2. **Canonical Score Hero** als einzig dominante Score-Zahl.
3. Ranking/Eligibility als getrennte sekundäre Kennzahl.
4. Drei kompakte Linsen:
   - Technical / Canonical,
   - Research Context,
   - Evidence Health.
5. Decision/Risk nur mit Authority-Herkunft und explizitem Status.

### Änderungen

- Radial Gauge behalten, aber Kontext hinzufügen: Modell-ID/-Version, 30×1D Basis, Coverage, Freshness.
- CV-0 `AuthorityBadge` im Score-Hero als `CANONICAL_SCORE` verwenden.
- `Intelligent Score` nicht gleichrangig zum kanonischen Score visualisieren; als Ranking-Metrik kennzeichnen.
- Score-Delta nur anzeigen, wenn ein historischer kanonischer Score gleicher Modellversion und Evidence-Semantik verfügbar ist.
- Research-Lens nicht in die Scorefarbe einmischen.

### Akzeptanz

- Innerhalb von 3 Sekunden erkennbar: kanonischer Score, Modellversion, Score-Zeitbasis, Datenstatus, Research-only Zustand.
- Keine Farbe ist alleiniger Bedeutungsträger.
- Mobile Stack ohne horizontales Scrollen.

---

## CV-2 — Verified Crypto Market Chart v2

**Priorität:** P0/P1  
**Ziel:** aus dem aktuellen 4h-Close-Area-Chart einen professionellen Financial-Chart bauen, ohne Score- und MarketData-Authority zu vermischen.

### Backend-Voraussetzung

Aktueller `market-data-history/1.0.0` projiziert nur:

```text
{ timestamp, close }
```

Für Candlestick/Volume ist eine **rückwärtskompatibel geplante, versionierte OHLCV-Projektion** erforderlich, z. B.:

```text
{ timestamp, open, high, low, close, volume? }
```

Die Providerquelle muss jeden Wert attestieren; kein Client darf OHLCV aus Close synthetisieren.

### UI

- Candlestick/OHLC als Default, Area/Line optional.
- Volume-Pane, sofern verified Volume vorhanden.
- Crosshair + synchroner Tooltip.
- Range/Interval getrennt darstellen.
- 4h-Analysekontext visuell klar vom 30×1D Canonical Score trennen.
- Trade-Setup Entry/SL/TP als optionale MarkLines/Price Lines über dem Chart.
- Provider, Evidence ID, Quality State und Freshness direkt im Chart-Footer.

### OSS Spike

- P0 Spike: Recharts/D3 vs Lightweight Charts 5.2.
- Entscheidung anhand Bundle Size, mobile Pan/Zoom, Crosshair, Pane-Support, Accessibility und Attribution.

### Akzeptanz

- kein `/api/charts-scoring`-Fallback;
- keine Demo-/synthetischen Candles;
- Unsupported/Partial Data → expliziter DATA_UNAVAILABLE/PARTIAL State;
- Chart-Overlay verändert niemals Score oder Eligibility.

---

## CV-3 — Factor & Model Explorer

**Priorität:** P0  
**Ziel:** Radar als Übersicht behalten, aber die tatsächliche Modellstruktur drill-downfähig machen.

### Canonical Technical Lens

- gruppierte horizontale Bullet Bars für Technisch, Risiko, Marktstruktur und Kontext;
- Faktorwert + Status + Evidence/Freshness;
- Radar nur als Overview, nicht als alleinige Detaildarstellung.

### Research Model Lens

Tabs/Segmente:

- `Canonical 0.7.0`
- `Meme Research 0.3.0`
- `DeFi Research 0.3.0`

Challenger nur anzeigen, wenn Kategorie/Evidence passt; immer `RESEARCH ONLY`.

### Modellstruktur sichtbar machen

- Top-level weight bars;
- Correlation Groups als gruppierte Container;
- Hard Gates als Gate-Rail (`PASS / BLOCKED / NOT_COMPUTABLE`);
- Missing Evidence separat;
- Effective Feature-/Weight-Fingerprint als Lineage-Detail, nicht als Hauptmetrik.

### Akzeptanz

- Nutzer kann erkennen, **warum** ein Research Assessment nicht berechenbar oder blockiert ist.
- Korrelierte Faktoren werden nicht als scheinbar unabhängige Scores dargestellt.
- Kein Frontend-Re-Scoring.

---

## CV-4 — Evidence & Provenance Matrix

**Priorität:** P1  
**Ziel:** die vorhandene Providerbreite als visuell scanbare Evidence-Map nutzbar machen.

### Datenbasis

`crypto-extended-evidence/1.4.0`:

- DeFiLlama
- GoPlus / GoPlus Solana
- Binance Public
- Kraken Futures Public
- DexScreener
- Sourcify
- Dune
- GDELT

### Darstellung

**Matrix Provider × Evidence Domain** mit Zuständen:

- verified/ready,
- partial,
- stale,
- unavailable,
- unsupported,
- invalid.

Zusätzlich:

- verified/unavailable Feature Count;
- Freshness-Zeitleiste;
- Provider-Tooltip mit Reason;
- Evidence-Drilldown nach Feature-Key und Evidence-ID;
- bei Dune: Query Identity und Freshness, niemals arbitrary SQL/Execute Controls.

D3-basierte Matrix/Heatmap bevorzugen. Farbe + Symbol/Pattern kombinieren, damit Status nicht nur farbcodiert ist.

### Akzeptanz

- Provider-Ausfall und fehlende Identitätszuordnung sind unterscheidbar.
- stale ≠ unavailable ≠ invalid.
- Evidence-only Provider erhalten keine Score-/Trade-Affordance.

---

## CV-5 — Multi-Timeframe Pattern, Momentum & Regime Lens

**Priorität:** P1  
**Ziel:** vorhandene Research-Signale als Matrix sichtbar machen und gleichzeitig die kanonische Score-Zeitbasis schützen.

### Darstellung

Zeilen: 1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W — nur soweit reale Evidence existiert.

Spalten:

- Trend
- Momentum
- Pattern Direction
- Pattern Quality
- Sentiment
- Regime/Phase Context
- Evidence State

### Regeln

- `1D / 30 Bars` erhält sichtbares **Canonical Score Basis** Label.
- andere Timeframes: `Analysis/Research Context`.
- Pattern-Confluence nur aus Backend-Research-Ausgabe projizieren.
- Higher-TF Confirmation als Verbindung/Bracket sichtbar machen.
- `NOT_COMPUTABLE` nicht als neutral interpretieren.

### Pattern Badge

Bestehende Bullish/Bearish-Logik zu drei Intensitätsstufen ausbauen, aber nur aus expliziter Backend-Strength/Quality ableiten. Bei fehlendem Pattern: Text `NO PATTERN`, kein dekorativer Platzhalter.

### Akzeptanz

- keine suggerierten Intraday-Scores;
- höhere Timeframe-Bestätigung schnell erkennbar;
- keyboard-/screenreader-lesbare tabellarische Alternative.

---

## CV-6 — Crypto Ranking Heatmap & Breadth View

**Priorität:** P1  
**Ziel:** `RankingBoard` um eine cross-sectionale Marktsicht ergänzen, ohne es zu ersetzen.

### Ansichten

Toggle:

- `Ranking` — heutige Top/Worst-Liste;
- `Heatmap` — cross-sectional;
- `Distribution` — Score-/Momentum-/Sentiment-Breadth.

### Heatmap

- Farbe wählbar: Canonical Score, Momentum, Sentiment, Pattern Direction, Availability.
- Zellgröße nur aus verified Metriken, z. B. Market Cap oder Volume; falls nicht verfügbar, gleich große Tiles statt synthetischer Gewichtung.
- Filter: Crypto gesamt, DeFi, Meme, weitere vorhandene Registry-Subtypes.
- Asset klickbar → Enterprise Crypto Scorer.

### Breadth

- Anteil READY / PARTIAL / NOT_COMPUTABLE;
- Score-Tier-Verteilung;
- bullish/bearish Pattern Breadth;
- Momentum-/Sentiment-Verteilung;
- Universe SLA / 24er Coverage bleibt sichtbar.

### Akzeptanz

- aktuelle RankingBoard-Authority bleibt kanonisch;
- keine zweite Ranking-Berechnung im Heatmap-Code;
- Filter ändern nur Projection, nicht Eligibility.

---

## CV-7 — Meme & DeFi Research Lenses

**Priorität:** P1/P2  
**Ziel:** die beiden 0.3.0 Challenger so visualisieren, dass ihre unterschiedlichen Risikostrukturen verständlich sind.

### Meme Lens

Visual Groups:

- Liquidity / Execution
- Market Structure
- Sentiment / Social Authenticity
- Narrative
- Distribution
- Contract / Rug Risk
- Exchange Access

Spezialdarstellungen:

- Holder Concentration stacked distribution;
- Liquidity/Slippage quality ladder;
- Social authenticity confidence strip;
- Rug/Honeypot Hard-Gate rail.

### DeFi Lens

Visual Groups:

- Utilization
- Fundamentals / Revenue
- Liquidity
- Contract Security
- Oracle Integrity
- Tokenomics
- Governance
- Ecosystem
- Risk Families

Spezialdarstellungen:

- TVL/Fees/Revenue als **eine korrelationsgebundene Scale-/Activity-Familie**, nicht drei additive Scores;
- Risk-family bars;
- Contract/Oracle/Exploit Gate rail;
- Treasury/Unlock/Concentration nur bei verified Evidence.

### Akzeptanz

- beide Linsen tragen dauerhaft `RESEARCH ONLY · NOT EXECUTABLE`;
- `riskAdjustedScore=null` wird als nicht definiert dargestellt, nicht als 0;
- Hard Gates und Missing Evidence sind vor dem Research-Score sichtbar.

---

## CV-8 — Derivatives / Market Structure Research Panel

**Priorität:** P2  
**Ziel:** Binance-/Kraken-Evidence sinnvoll als Marktstruktur-Linse darstellen.

### Mögliche Metriken, nur sofern im bestehenden Evidence Contract verified geliefert

- Funding
- Open Interest / OI Change
- Volume / Volume Acceleration
- Spread / Liquidity
- relative Marktstärke

### Darstellung

- synchronized small multiples unter dem Price Chart;
- divergierende Skalen für Funding;
- OI-/Price-Divergence Annotation nur als beschreibende Research-Hilfe;
- kein automatisch erzeugtes Buy/Sell-Signal.

### Nicht-Ziel

Liquidation Heatmaps oder Orderbook-Depth dürfen erst aufgenommen werden, wenn dafür ein eigener verifizierter Provider-/Evidence-Contract vorhanden ist. Fremdprodukt-Visualisierungen sind Referenzmuster, keine Datenquelle.

---

## CV-9 — Accessibility, Performance & Visual Evidence Closure

**Priorität:** P0 als Gate für jede Implementierungswelle  
**Ziel:** komplexere Visualisierungen dürfen die bestehende A11y-/Performance-Basis nicht verschlechtern.

### Anforderungen

- Tabellen-/Textalternative für Heatmaps und komplexe Charts;
- WCAG 2.2 AA Kontrast;
- Status nie ausschließlich über Farbe;
- Focus/Keyboard für Chart-Toggles, Drilldowns und Timeframe-Zellen;
- `prefers-reduced-motion` respektieren;
- große Visualisierungen lazy laden;
- Bundle-Diff pro neuer Library dokumentieren;
- Lighthouse/axe nur mit reproduzierbaren Messwerten als PASS markieren.

### Akzeptanz

- keine kritischen axe Findings auf Crypto Scorer / Ranking / Research Lens;
- Performance-Budget vor Implementierung festlegen;
- neue Financial-Chart-Library erhält einen eigenen Lazy Boundary;
- Mobile Rendering für 360–430px Breite verifizieren.

---

# 6. Empfohlene Umsetzungsreihenfolge

```text
CV-0 Authority/View-Model Contract          DONE ON FEATURE BRANCH
   ↓
CV-1 Score Command Center                   NEXT
   ├── CV-3 Factor & Model Explorer
   ├── CV-4 Evidence Matrix
   └── CV-5 Multi-Timeframe Lens

CV-2 Verified Market Chart v2
   └── CV-8 Derivatives / Market Structure

CV-6 Ranking Heatmap & Breadth
   └── CV-7 Meme / DeFi Research Lenses

CV-9 läuft als Gate über jede Welle
```

## Priorisierte erste Implementierungswelle

**P0-A:** CV-0 **umgesetzt** → CV-1 **next**  
**P0-B:** CV-2 Contract Spike + Financial Chart PoC  
**P0-C:** CV-3 Hard-Gates/Model Explorer  
**P1-A:** CV-4 + CV-5  
**P1-B:** CV-6  
**P1/P2:** CV-7 + CV-8

# 7. Architektur-/Governance-Invarianten

1. `ScoringModelRegistry -> ScoringDispatcher -> Domain Executor -> CanonicalScoreResult` bleibt alleinige produktive Score-Authority.
2. `crypto-meme-integrity@0.3.0` und `crypto-defi-fundamental@0.3.0` bleiben Research-Challenger, bis ein separater Promotion-Prozess abgeschlossen ist.
3. Extended Evidence bleibt `EVIDENCE_ONLY`, `scoreEligible=false`, `executionEligible=false`.
4. 4h-/Intraday-Charts verändern den produktiven 30×1D Crypto Score nicht.
5. Pattern-/Regime-/Signal-Fusion-Research bleibt non-authorizing.
6. Kein Visual-Widget erzeugt oder verändert OrderIntent, FT-5 Decisions, FT-6 Binding oder FT-7 Capability.
7. Missing/Stale/Invalid Data wird nie synthetisch aufgefüllt.
8. Keine dritte allgemeine Chart-Library ohne dokumentierten Need-/Bundle-/License-Entscheid.
9. CV-0 Authority-Metadaten sind Presentation Labels und keine zweite fachliche Registry.
10. Freshness wird nur aus geliefertem Backend-/Providerzustand dargestellt; der Client darf keine eigenen Freshness-Grenzwerte erfinden.

# 8. Erkannte Dokumentationsdrift

`src/platform/FinTechCore/README.md` beschreibt Meme-/DeFi-Challenger stellenweise noch als `0.2.0`, während die aktuelle `ScoringModelRegistry` und SC-3 Evidence bereits `0.3.0` führen. Diese Drift ist **nicht** Bestandteil der grafischen Umsetzung und soll in einem separaten Documentary-/Version-Sync behoben werden, statt durch dieses Work Package eine zweite fachliche Beschreibung zu erzeugen.

Die im `COMPONENT_INVENTORY.md` zuvor noch vorhandene Frontend-Design-Drift (`#18181b`, historische `aif-*`-Rollen, Montserrat) wurde im CV-0-Dokumentationsschritt auf den bereits kanonischen Manifest-v6.1-Iststand korrigiert. Dadurch entsteht keine neue Design-Authority; das Inventory verweist auf `docs/frontend/design-tokens.json`.

# 9. Definition of Done für das Gesamtprogramm

- Crypto-Hauptansicht trennt Canonical, Research und Evidence-only semantisch eindeutig.
- Price/OHLCV, Faktoren, Evidence, Multi-Timeframe und Ranking sind drill-downfähig, ohne Backend-Regeln im Browser nachzubauen.
- Meme/DeFi Research ist verständlich, aber niemals als produktive Empfehlung dargestellt.
- Jede Visualisierung besitzt Status/Freshness/Provenance, wo die Backend-Evidence dies liefert.
- Heatmap/Chart/Matrix besitzen barrierearme Alternativen.
- Keine Demo-/Fallback-Finanzwerte.
- Kein zweiter Score-/Ranking-/Pattern-/Regime-/Execution-Pfad.
- Implementierung bleibt kompatibel mit `src/app -> src/features -> src/shared` und der bestehenden Frontend-Roadmap.
