# Screening · Scoring · Market Data — Single Point of Trust Roadmap

**Document ID:** SC-MD-SPT-0001  
**Version:** 1.0.6  
**Status:** ACTIVE — CANONICAL EXECUTION AUTHORITY  
**Stand:** 2026-08-16  
**Repository-Baseline:** `main` (SC-1 / SC-3 / SC-4 Phase A / SC-7 Phase A+B; SC-5 Phase A–D code; Phase B PR may still be open)  
**Owner:** SvenKulessa  
**Authority:** DOCUMENTATION_HYGIENE_POLICY · ROADMAP_CONSOLIDATION_MASTER_INDEX · ADR-0020 / ADR-0041 · ESS EventMesh/Traceability

---

## 1. Zweck

Dieses Dokument ist der **Single Point of Trust (SPT)** für die Screening-/Scoring-/Market-Data-Wertschöpfungskette der CAPITAL-AI Multi-Asset-Plattform (8 Assetklassen, Universal-Asset-Interface-Ziel, Score-Kontrakte, Market-Data-Gateways).

Es ersetzt als Ausführungsautorität:

| Dokument | Rolle | Status nach diesem SPT |
|---|---|---|
| `docs/architecture/ENTERPRISE_SCREENING_SCORING_MASTER_ARCHITECTURE.md` (Phase 2) | Aspirational Blueprint Aug-01 | **SUPERSEDED** — Phase-1-Inventar bleibt Evidence |
| `docs/architecture/ENTERPRISE_SCREENING_REMEDIATION_2026-08.md` | Enger Remediation-Scope | **ARCHIVED** → `docs/archive/legacy/` |
| Parallel-Remediation-Branches / Ad-hoc-Screening-Todos | Fragmentiert | **FORBIDDEN** — nur über dieses SPT |

**Keine parallele Remediation.** Alle offenen Screening-/Scoring-/MD-Arbeiten werden ausschließlich hier getrackt.

---

## 2. Code-vs-Docs-Synthese (Update 2026-08-16)

### 2.1 Was der Code heute liefert

| Schicht | Code-Pfad | Reife |
|---|---|---|
| Market-Data Gateway | `src/platform/MarketData/` | **SC-4 Matrix/Health + SC-5 CoinGecko canonical multi-field** |
| Provider | TwelveData, FMP Index, CoinGecko (price + marketCap/supply on Canonical); CoinAPI/EODHD/TwelveData(crypto) gateway adapters registered (SC-5 Phase D, unconsumed); Alpaca shadow | **Kern live** |
| Evidence / Consensus | Snapshot/Spot consensus, traditional/commodity/macro evidence | **Stark ausgebaut** |
| Scoring-Engines | Base/DeFi, crypto 9-Faktor, meme, raw materials, traditional, verified technical | **Multi-Engine, noch fragmentiert** |
| Ranking / Eligibility | `ranking.service` + SC-7 composite opt-in (Phase A+B) | **Crypto-lastig; orchestrator wired** |
| Classification | Adapter + expanded deterministic table (SC-1) | **Canonical exit path** |
| Unified DQ/Confidence | `CompositeDataQuality` (SC-3); impact flags false | **Foundation + ranking consumer map** |

### 2.2 Verbleibende Lücken

1. scoreImpact / rankingImpact noch Owner-gated (`false`)
2. Ranking-Generalisierung cross-asset (Overall / Category / Tier / Growth)
3. Multi-provider crypto quorum + `executionPriceEligible` — Gateway-Adapter (CoinAPI/EODHD/TwelveData) seit SC-5 Phase D registriert, aber noch **nicht konsumiert**; Verdrahtung + Flip bleiben Owner-gated
4. Model registry & UAI adapters (SC-2)
5. Alpaca primary promotion (ADR-0041 Owner gate)
6. Horizon / Walk-Forward backtests (SC-8)

---

## 3. Kanonische Wertschöpfungskette (SPT-Modell)

```text
[Providers] → MarketDataGateway (CB/Cache/RL/Coalesce + ProviderMatrix)
                    ↓
            DataQualityService + Evidence/Consensus Services
                    ↓
            Classification (Asset Class / Category / Tier)
                    ↓
            Scoring Engines (per class / model registry)
                    ↓
            Confidence + DQ Composite → Ranking / Eligibility / SLO
                    ↓
            EventMesh (score.* / data.*) + Traceability + Supervisor
                    ↓
            API / Screener UI / Alerts / Backtest Evidence
```

**Harter Vertrag:** Universal Asset Interface (Adapter), Score-Kontrakt, fail-closed Evidence, keine Symbol-Hash-/Random-Walk-Finanzlogik.

---

## 4. Ausführungs-Backlog (SC-*)

| ID | Titel | Priorität | Status (2026-08-16) | DoD (kurz) |
|---|---|---|---|---|
| **SC-0** | Baseline freeze & inventory | P0 | **LANDED** | SPT gemerged |
| **SC-1** | Classification consolidation | P0 | **LANDED** | Canonical schema; deterministic coverage |
| **SC-2** | Model registry & UAI adapters | P1 | OPEN | model_registry; UAI adapters |
| **SC-3** | Unified DQ + Confidence composite | P0 | **FOUNDATION LANDED** | Composite; impact off |
| **SC-4** | Gateway hardening & provider matrix | P1 | **Phase A LANDED** | Matrix + RL + supervisor health |
| **SC-5** | Live coverage expansion | P1 | **Phase A–D code; Phase B PR may be open** | Canonical multi-field on gateway; CoinAPI/EODHD/TwelveData crypto adapters registered (Phase D); execution quorum still open |
| **SC-6** | Scoring integrity & lineage | P1 | PARTIAL | calculation_version + lineage |
| **SC-7** | Ranking generalization | P1 | **Phase A+B LANDED** | Cross-asset modes still open; impact off |
| **SC-8** | Horizon / Walk-Forward backtests | P2 | OPEN | Drift-Evidence; golden-set regression |

**Kritischer Pfad:** SC-0 → SC-1 + SC-3 → SC-4 → SC-5 → SC-2/SC-6 → SC-7 (full) → SC-8.

---

## 5. Authority & Mutationsregeln

1. Runtime-/Code-/Produktions-Evidence  
2. Explizite Human/Owner-Freigabe  
3. Spezifische ADR/ESS (Market Data: ADR-0020, ADR-0041; Screening-SLO: ADR-0028)  
4. **Dieses SPT (SC-MD-SPT-0001)**  
5. ROADMAP_CONSOLIDATION_MASTER_INDEX  
6. Historische/archivierte Docs

Mutation von Scoring-Gewichten, Eligibility-Schwellen, Provider-Routing, Live-Gates oder **scoreImpact/rankingImpact** erfordert Owner-Freigabe.

---

## 6. Related

- `docs/roadmaps/work-packages/SC-1_CLASSIFICATION_CONSOLIDATION.md`
- `docs/roadmaps/work-packages/SC-3_UNIFIED_DQ_CONFIDENCE.md`
- `docs/roadmaps/work-packages/SC-4_GATEWAY_HARDENING_PROVIDER_MATRIX.md`
- `docs/roadmaps/work-packages/SC-5_LIVE_COVERAGE_EXPANSION.md`
- `docs/roadmaps/work-packages/SC-7_RANKING_COMPOSITE_OPT_IN.md`
- `docs/evidence/sc-md/`
- `src/platform/MarketData/ProviderMatrix.ts`
- `src/platform/MarketData/providers/CoinGeckoMarketDataProvider.ts`
- `src/platform/MarketData/providers/CoinAPIMarketDataProvider.ts`
- `src/platform/MarketData/providers/EODHDMarketDataProvider.ts`
- `src/services/cryptoQuoteEvidence.ts`
- `src/services/cryptoSnapshotProvider.ts`

---

*SC-5 Phase D 2026-08-16 (CoinAPI/EODHD/TwelveData crypto gateway adapters registered; unconsumed). Keine scoreImpact-Mutation. Keine executionPriceEligible-Flip. Merge nur nach Owner-Review.*
