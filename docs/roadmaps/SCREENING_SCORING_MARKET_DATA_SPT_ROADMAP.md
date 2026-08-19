# Screening · Scoring · Market Data — Single Point of Trust Roadmap

**Document ID:** SC-MD-SPT-0001  
**Version:** 1.0.21  
**Status:** ACTIVE — CANONICAL EXECUTION AUTHORITY  
**Stand:** 2026-08-19  
**Repository-Baseline:** `main@8cf8ba6a0be86c022e7fc71667271f97b686b2fd` + `agent/sc7-cross-asset-ranking-generalization`  
**Owner:** SvenKulessa  
**Authority:** DOCUMENTATION_HYGIENE_POLICY · GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY / ADR-0086 · ROADMAP_CONSOLIDATION_MASTER_INDEX · ADR-0020 / ADR-0041 · ESS EventMesh/Traceability

---

## 1. Zweck

Dieses Dokument ist der **Single Point of Trust (SPT)** für die Screening-/Scoring-/Market-Data-Wertschöpfungskette der CAPITAL-AI Multi-Asset-Plattform.

**Keine parallele Remediation und keine parallele Scoring-Architektur.** Alle offenen Screening-/Scoring-/MD-Arbeiten werden ausschließlich hier getrackt. ADR-0087 konkretisiert UAI + ScoringModelRegistry + Single Dispatcher. ADR-0088/0089 integrieren Research-Evidence/Gemini ausschließlich als Acquisition-Adapter vor dem Evidence Gate; ADR-0090 macht diesen Gemini-Pfad Free-Tier-only und verbietet Paid Mode.

---

## 2. Code-vs-Docs-Synthese — Update 2026-08-19

### 2.1 Was der Code heute liefert

| Schicht | Code-Pfad | Reife |
|---|---|---|
| Market-Data Gateway | `src/platform/MarketData/` | **SC-4 Matrix/Health + SC-5 CoinGecko canonical multi-field** |
| Provider | TwelveData, FMP Index, CoinGecko; weitere Gateway-Adapter registriert; Alpaca shadow | **Kern live** |
| Evidence / Consensus | Snapshot/Spot consensus, traditional/commodity/macro evidence | **stark ausgebaut** |
| Research Evidence | `src/platform/ResearchEvidence/` + `server/researchEvidence/` | **Gemini default-off/Free-Tier-only/keine Score-Wirkung** |
| UAI / Model Registry | `src/platform/Scoring/` | **C3 Multi-Asset Binding auf main** |
| Canonical Dispatcher | `src/platform/Scoring/ScoringDispatcher.ts` | **Crypto/Traditional/Commodity/Sovereign produktiv konsolidiert** |
| Scoring-Engines | verified Crypto, Traditional, Commodity Evidence, Sovereign Benchmark; Legacy Research Engines | **produktive Model-Execution hinter einem Dispatcher** |
| Scoring Integrity / Lineage | `CanonicalScoreResult.integrity` | **UAI + Dispatcher + Registry + Model + Executor lineage auf main** |
| Ranking / Eligibility | `ranking.service` + `src/platform/Ranking/` | **Crypto A–C landed; Phase D cross-asset shadow implementiert** |
| Unified DQ/Confidence | `CompositeDataQuality`; impact flags false | **Foundation + consumer map** |

### 2.2 Verbleibende Lücken

1. **SC-7 Phase D/E:** Cross-Asset-Ranking shadow validieren, reale Peer-/Growth-/Comparability-Evidence anbinden und Observability ergänzen; `rankingImpact=false` bleibt Owner-gated.
2. **Cross-segment comparability:** gleiche Modell-ID/-Version reicht nicht. `traditional-scoring@2.1.0` verwendet für Stock vs. Forex/Index unterschiedliche Gewichtssätze; ohne validierte Normalisierung bleiben Assetklassen getrennt.
3. **Cross-model comparability:** Crypto 0..10 und andere historische Präsentationsskalen 0..100 dürfen nicht ohne verifizierte Normalisierung global geordnet werden.
4. Multi-provider Crypto quorum + `executionPriceEligible` offen.
5. Gemini Shadow: interner Consumer + Coverage/Latenz/Quota-Messung offen; Shadow bleibt deaktiviert.
6. Evidence Promotion: reale Source-/Lizenz-/Field-Policies und Promotion zu `ScoringEvidenceRef` separat Owner-gated.
7. Alpaca primary promotion Owner-gated.
8. SC-8 vollständige Drift-/Golden-/Walk-Forward-Governance offen.
9. Physisch verbleibender, aber produktiv unerreichbarer Multi-Asset-Legacy-Code in `server.application.ts` ist Source-Hygiene, nicht zweite Scoring-Autorität.
10. Final-head Full-CI-Evidence für PR #435 bleibt wegen des parallel bearbeiteten M10-Autorisierungsfehlers unvollständig; dies ist eine CI-Control-Evidence-Lücke, keine zweite Scoring-Architektur.

---

## 3. Kanonische Wertschöpfungskette

```text
[Asset Catalog / Request]
          ↓
Universal Asset Interface (identity only)
          ↓
Evidence Acquisition
  Market Providers -> MarketDataGateway / domain evidence adapters
  Research Providers -> ResearchEvidenceAdapter
    optional GeminiResearchTransport -> AI_DISCOVERED_EVIDENCE (scoreEligible=false)
          ↓
DataQualityService + Evidence/Consensus Services
          ↓
Classification (Asset Class / Category / Tier)
          ↓
Feature Contract
          ↓
ScoringModelRegistry (canonical champion only)
          ↓
ScoringDispatcher (single productive model-execution authority)
          ↓
Domain Executor Adapter -> CanonicalScoreResult
          ↓
Confidence + DQ Composite
          ↓
Ranking comparability / peer-group gate
  default: modelId@version + assetClass
  cross-asset/cross-model only with verified normalization evidence
          ↓
Ranking / Eligibility / SLO
          ↓
EventMesh + Traceability + Supervisor
          ↓
API / Screener UI / Alerts / Backtest Evidence
```

**Harter Vertrag:** UAI Identity, ScoringModelRegistry, ScoringDispatcher, CanonicalScoreResult und fail-closed Evidence. LLM-/Research-Output ist niemals direkt verifizierte Finanz-Evidence. Gemini Shadow ist Acquisition-only und Free-Tier-only; `AI_DISCOVERED_EVIDENCE` bleibt `scoreEligible=false`. Fehlende validierte Evidence oder Modelauflösung bleibt `SCORE_NOT_COMPUTABLE` bzw. in Market-Data-Sinks `score=null`.

**Ranking-Hard-Gate:** Ein CanonicalScoreResult oder eine gemeinsame Modell-ID macht verschiedene Intended-Use-Segmente nicht automatisch vergleichbar. SC-7 Phase D ordnet standardmäßig nur innerhalb `modelId@version + assetClass`-Kohorten. Cross-Asset-/Cross-Model-Ordnung verlangt separat verifizierte Normalisierungsevidence; cross-cohort order bleibt sonst undefiniert.

---

## 4. Ausführungs-Backlog (SC-*)

| ID | Titel | Priorität | Status (2026-08-19) | DoD (kurz) |
|---|---|---|---|---|
| **SC-0** | Baseline freeze & inventory | P0 | **LANDED** | SPT gemerged |
| **SC-1** | Classification consolidation | P0 | **LANDED** | Canonical schema; deterministic coverage |
| **SC-2** | Model registry & UAI adapters | P1 | **LANDED — C1/C2/C3 Human-merged** | alle produktiven Score-Consumer via UAI + Registry + einen Dispatcher + canonical result |
| **SC-3** | Unified DQ + Confidence composite | P0 | **FOUNDATION LANDED** | Composite; impact off |
| **SC-4** | Gateway hardening & provider matrix | P1 | **Phase A LANDED** | Matrix + RL + supervisor health |
| **SC-5** | Live coverage expansion | P1 | **Phase A–D code** | execution quorum still open |
| **SC-6** | Scoring integrity & lineage | P1 | **CORE LANDED WITH C3** | UAI/model/executor/result-contract lineage canonical |
| **SC-7** | Ranking generalization | P1 | **A–C LANDED · D IMPLEMENTED/SHADOW** | intended-use cohorts + cross-asset modes; impact off |
| **SC-8** | Horizon / Walk-Forward backtests | P2 | FOUNDATION/PARTIAL | drift + golden-set + full walk-forward governance open |

**Kritischer Pfad:** SC-0 → SC-1 + SC-3 → SC-4 → SC-5 → **SC-2/SC-6 LANDED** → **SC-7 Phase D/E** → SC-8.

---

## 5. Authority & Mutationsregeln

1. Runtime-/Code-/Produktions-Evidence  
2. Explizite Human/Owner-Freigabe + Accepted ADR  
3. Spezifische ESS/Governance Policies gemäß etablierter Governance Authority  
4. **Dieses SPT (SC-MD-SPT-0001)**  
5. ROADMAP_CONSOLIDATION_MASTER_INDEX  
6. Historische/archivierte Docs

Mutation von Scoring-Gewichten, Eligibility-Schwellen, Market-Data-Provider-Routing, Live-Gates oder **scoreImpact/rankingImpact** erfordert Owner-Freigabe.

ADR-0090 bleibt für Gemini Research Shadow autoritativ: Free-Tier-only, `gemini-2.5-flash`, Paid Mode verboten, unabhängiger Kill-Switch `GEMINI_RESEARCH_SHADOW_ENABLED=false`. Eine Score-Evidence-Promotion bleibt ein eigenes field-spezifisches Gate.

### Main-Korrelation 2026-08-19

- PR #421 (`/api/crypto/score`) Human-gemerged nach Main-Revalidation.
- PR #424 (`/api/crypto/list` + `/top10`) Human-gemerged nach Main-Revalidation.
- PR #427 führte C1 `ScoringDispatcher`, Research-only `/analyze` und kanonischen DeFi-UI-Score ein; Human-gemerged.
- PR #428 führte C2a Composition-Root-/Legacy-Operational-Exit ein; Human-gemerged.
- PR #430 führte C2b Physical Standard-Crypto Cleanup ein; Human-gemerged.
- PR #429 führte M10 Controlled Cutover ein; nachfolgende Branches wurden gegen Main reconciled.
- PR #435 führte C3 Global Multi-Asset Single-Dispatcher Exit ein und wurde Human-gemerged. Merge-Commit `78d1ba83...` enthält exakt den zuletzt synchronisierten C3-Head `8c4f45c4...`.
- PR #438 wurde unmittelbar danach Human-gemerged; SC-7-Startbaseline ist `main@8cf8ba6a...`.
- Der sichtbare finale PR-Event-CI von #435 wurde am M10-Autorisierungsgate vor Checkout/Tests/Build gestoppt. Der Owner bearbeitet diesen Control-Plane-Fehler parallel und hat die Fortsetzung der fachlichen Roadmap ausdrücklich freigegeben; M10 wird dadurch nicht abgeschaltet oder umgangen.
- Die ADR-0086-Nummernkollision aus PR #414 bleibt außerhalb SC-2; ADR-0087 ist fachliche Single-Scoring-Authority.

### Phase-C-Scope-Entscheidung

- **C1 — LANDED:** Standard-Crypto Router/UI + Research Boundary -> `ScoringDispatcher`.
- **C2a — LANDED:** Market-Data Runtime + Legacy Standard-Crypto Endpoints -> Dispatcher; Chart-Score -> Simulation-only.
- **C2b — LANDED:** physische Standard-Crypto-Legacy-Ausführung entfernt; Cold-Start geschlossen.
- **C3 — LANDED:** Traditional Adapter, Commodity/Sovereign Dispatcher binding, Registry verified score/batch/context, Meme -> Crypto champion, Raw-Materials verified -> Dispatcher, globale UAI/Model/Executor-Lineage und Single-Dispatcher-Proof.

Global Phase C ist mit Human Merge von PR #435 **LANDED**. Die M10-Full-CI-Evidence-Lücke wird separat geschlossen und ändert nicht die fachliche Authority-Kette.

### SC-7 Phase-D-Scope

Phase D generalisiert Ranking ohne produktiven Impact:

- `src/platform/Ranking/` als canonical ranking projection boundary;
- Modi `overall | category | tier | growth`;
- Default-Kohorte: `modelId@version + assetClass`;
- gleiche Modell-ID/-Version allein erzeugt keine Cross-Asset-Vergleichbarkeit;
- cross-model/cross-asset ranking nur mit verified `ScoreComparabilityEvidence` inklusive normalisiertem Wert + Method-/Evidence-Lineage;
- Growth nur mit verified `GrowthRankingEvidence`;
- Governance/UAI/Dispatcher/Model lineage fail-closed;
- deterministic `assetId` tie-break;
- `crossCohortOrder=false`;
- `CROSS_ASSET_RANKING_IMPACT_ENABLED=false` und bestehendes `RANKING_SCORE_IMPACT_ENABLED=false`.

Phase D implementiert **keine** Kalibrierung und aktiviert keine produktive Ranking-Wirkung.

### Enterprise-/FinTech-Benchmark — verifiziert 2026-08-19

Als Engineering-Benchmark dient die am 17.04.2026 veröffentlichte Federal Reserve/OCC/FDIC **Revised Guidance on Model Risk Management (SR 26-2)**. Für CAPITAL-AI ist das Muster relevant, intended model use, Model Inventory, Governance/Controls, Validierung, Dokumentation und Monitoring an nachvollziehbaren Modell-Lifecycle-Grenzen zusammenzuführen. SC-7 Phase D behandelt die Vergleichbarkeit unterschiedlicher Model-/Segment-Outputs selbst als zu validierende Model-Use-Annahme. Daraus wird keine konkrete aufsichtsrechtliche Anwendbarkeit behauptet.

NIST AI RMF 1.0 dient ergänzend als freiwilliger Lifecycle-/Traceability-Benchmark und wird aktuell von NIST überarbeitet. Phase D trennt Implementierung, Mess-/Vergleichsevidence und spätere Aktivierungsentscheidung explizit.

---

## 6. Related

- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- `docs/roadmaps/work-packages/SC-7_RANKING_COMPOSITE_OPT_IN.md`
- `docs/adr/ADR-0087-single-scoring-architecture-uai-model-registry.md`
- `docs/adr/ADR-0088-gemini-research-evidence-reentry-boundary.md`
- `docs/adr/ADR-0089-gemini-research-shadow-runtime.md`
- `docs/adr/ADR-0090-gemini-free-tier-only-zero-cost-policy.md`
- `docs/evidence/sc-md/SC2_GLOBAL_MULTI_ASSET_EXIT_2026-08-19.md`
- `docs/evidence/sc-md/SC7_CROSS_ASSET_RANKING_GENERALIZATION_2026-08-19.md`
- `docs/runbooks/GEMINI_RESEARCH_SHADOW.md`
- `src/platform/Scoring/`
- `src/platform/Ranking/`
- `src/platform/ResearchEvidence/`
- `server/researchEvidence/`

---

*Stand 2026-08-19: SC-2 Phase C und SC-6 Core-Lineage sind Human-gemerged. SC-7 Phase D läuft auf `agent/sc7-cross-asset-ranking-generalization` als shadow/read-only comparability foundation. Ranking-Impact, Score-Impact, Cross-Asset-/Cross-Model-Kalibrierung und Gemini Shadow bleiben deaktiviert bzw. separat Owner-gated.*
