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

Single Point of Trust für die Screening-/Scoring-/Market-Data-Wertschöpfungskette der CAPITAL-AI Multi-Asset-Plattform. Keine parallele Remediation und keine parallele Scoring-Architektur. ADR-0087 ist die fachliche UAI/Registry/Single-Dispatcher-Authority; ADR-0088/0089/0090 begrenzen Research/Gemini auf Acquisition-only, default-off und Free-Tier-only.

---

## 2. Code-vs-Docs-Synthese — 2026-08-19

| Schicht | Code-Pfad | Reife |
|---|---|---|
| Market Data | `src/platform/MarketData/` | SC-4/SC-5 Foundation + canonical providers |
| Evidence / Consensus | domain evidence + DQ services | stark ausgebaut |
| Research Evidence | `src/platform/ResearchEvidence/`, `server/researchEvidence/` | Gemini default-off, keine Score-Wirkung |
| UAI / Registry | `src/platform/Scoring/` | **C3 LANDED** |
| Dispatcher | `ScoringDispatcher.ts` | **ein produktiver Multi-Asset Execution Exit** |
| Scoring Integrity | `CanonicalScoreResult.integrity` | **UAI + Dispatcher + Registry + Model + Executor + Feature lineage** |
| Ranking | `ranking.service` + `src/platform/Ranking/` | A–C LANDED · **D IMPLEMENTED/SHADOW** |
| DQ / Confidence | `CompositeDataQuality` | Foundation; impact off |

### Verbleibende Lücken

1. SC-7 Phase D/E: Shadow-Validierung, reale Peer-/Growth-/Comparability-Evidence, Observability; `rankingImpact=false` bleibt Owner-gated.
2. Cross-segment comparability: selbst gleiche Modell-ID/-Version reicht nicht; `traditional-scoring@2.1.0` nutzt andere Stock- als Forex/Index-Gewichte.
3. Cross-model comparability: historische Score-Präsentation ist Crypto 0..10, andere Finanzklassen 0..100; globale Ordnung benötigt validierte Normalisierung.
4. Multi-provider Crypto quorum + `executionPriceEligible` offen.
5. Gemini Shadow interner Consumer/Coverage/Latenz/Quota offen; Shadow bleibt deaktiviert.
6. Evidence-Promotion und Alpaca primary bleiben Owner-gated.
7. SC-8 vollständige Drift-/Golden-/Walk-Forward-Governance offen.
8. Unerreichbarer Legacy-Code ist Source-Hygiene, keine zweite produktive Scoring-Authority.
9. PR #435 final-head Full-CI-Evidence bleibt wegen parallel bearbeitetem M10-Autorisierungsfehler unvollständig; dies ist ein separater Control-Plane-Evidence-Track.

---

## 3. Kanonische Wertschöpfungskette

```text
Asset Catalog / Request
  ↓
Universal Asset Identity
  ↓
Evidence Acquisition
  ↓
Evidence / Data Quality Gate
  ↓
Classification + Feature Contract
  ↓
ScoringModelRegistry
  ↓
ScoringDispatcher
  ↓
Domain Executor Adapter
  ↓
CanonicalScoreResult + full execution lineage
  ↓
Confidence / DQ Composite
  ↓
Ranking comparability gate
  default intended-use cohort:
    modelId@modelVersion
    + assetClass
    + featureVersion
    + scoringVersion
  cross-cohort only with verified normalization evidence
  ↓
Ranking / Eligibility / SLO
  ↓
EventMesh / Traceability / Supervisor
  ↓
API / UI / Alerts / Backtest Evidence
```

**Scoring-Hard-Gate:** fehlende validierte Evidence oder Modelauflösung bleibt `SCORE_NOT_COMPUTABLE` bzw. `score=null`; Research/LLM-Output ist niemals direkt verified score evidence.

**Ranking-Hard-Gate:** Ein gemeinsamer CanonicalScoreResult-Typ oder eine gemeinsame Modell-ID erzeugt keine Vergleichbarkeit. Default-Ranking bleibt auf demselben Intended-Use-Contract (`model + assetClass + feature + scoring`) begrenzt. Cross-Asset-/Cross-Model-Ordnung verlangt separat verifizierte Normalisierung; `crossCohortOrder=false` bleibt sonst verbindlich.

---

## 4. Ausführungs-Backlog

| ID | Titel | Priorität | Status | DoD kurz |
|---|---|---|---|---|
| SC-0 | Baseline freeze & inventory | P0 | LANDED | SPT |
| SC-1 | Classification consolidation | P0 | LANDED | canonical schema |
| SC-2 | Model registry & UAI | P1 | **LANDED — C1/C2/C3** | Single Dispatcher / canonical result |
| SC-3 | Unified DQ + Confidence | P0 | FOUNDATION LANDED | impact off |
| SC-4 | Gateway hardening | P1 | Phase A LANDED | matrix/health |
| SC-5 | Live coverage | P1 | Phase A–D code | execution quorum open |
| SC-6 | Scoring integrity & lineage | P1 | **CORE LANDED WITH C3** | execution lineage |
| SC-7 | Ranking generalization | P1 | **A–C LANDED · D IMPLEMENTED/SHADOW** | intended-use cohorts; impact off |
| SC-8 | Walk-Forward / backtests | P2 | FOUNDATION/PARTIAL | drift/golden/full governance open |

**Kritischer Pfad:** SC-0 → SC-1 + SC-3 → SC-4 → SC-5 → SC-2/SC-6 LANDED → **SC-7 D/E** → SC-8.

---

## 5. Authority & Mutationsregeln

1. Runtime-/Code-/Produktions-Evidence
2. explizite Human/Owner-Freigabe + Accepted ADR
3. spezifische ESS/Governance Policies
4. dieses SPT
5. Consolidation Master Index
6. Archive

Scoring-Gewichte, Eligibility-Schwellen, Provider-Routing, Live-Gates sowie `scoreImpact/rankingImpact` bleiben Owner-gated.

### Main-Korrelation

- #421, #424: erste Crypto UAI/Registry Consumer LANDED.
- #427: C1 Dispatcher + Research-only Analyze LANDED.
- #428: C2a Composition-Root operational exit LANDED.
- #430: C2b physical Standard-Crypto cleanup LANDED.
- #429: M10 Controlled Cutover LANDED.
- #435: C3 Global Multi-Asset Single-Dispatcher Exit LANDED; Merge-Commit `78d1ba83...` enthält final synchronisierten Head `8c4f45c4...`.
- #438: post-C3 Main-Fortschritt; SC-7 Startbaseline `main@8cf8ba6a...`.
- Der Owner bearbeitet den M10-CI-Autorisierungsfehler parallel und hat die fachliche Roadmap-Fortsetzung ausdrücklich freigegeben. M10 wird dadurch weder deaktiviert noch umgangen.

### SC-7 Phase D

- canonical `src/platform/Ranking/` projection boundary;
- Modi `overall | category | tier | growth`;
- Default-Kohorte = `modelId@version + assetClass + featureVersion + scoringVersion`;
- Admission verlangt Dispatcher-/Registry-/Model-/Executor-/Result-/Feature-/Scoring-Lineage;
- gleiche Model-ID/-Version allein reicht nicht für Cross-Asset-Vergleichbarkeit;
- Cross-Cohort ranking nur mit verified `ScoreComparabilityEvidence` + normalized value + method/evidence lineage;
- Growth nur mit verified `GrowthRankingEvidence`;
- Governance/UAI/Operations fail-closed;
- deterministic `assetId` tie-break;
- ranked output trägt vollständige Execution-Lineage;
- `CROSS_ASSET_RANKING_IMPACT_ENABLED=false` und `RANKING_SCORE_IMPACT_ENABLED=false`.

Phase D implementiert **keine Kalibrierung und keine produktive Ranking-Aktivierung**.

### Enterprise-/FinTech-Benchmark

Engineering-Benchmark, keine Behauptung direkter regulatorischer Anwendbarkeit: SR 26-2 betont intended model use, Validierung, Inventory, Governance/Controls, Dokumentation und Monitoring. SC-7 behandelt Output-Vergleichbarkeit deshalb als zu validierende Model-Use-Annahme. NIST AI RMF 1.0 dient ergänzend als Lifecycle-/Measurement-Benchmark und wird aktuell überarbeitet.

---

## 6. Related

- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- `docs/roadmaps/work-packages/SC-7_RANKING_COMPOSITE_OPT_IN.md`
- `docs/adr/ADR-0087-single-scoring-architecture-uai-model-registry.md`
- `docs/evidence/sc-md/SC2_GLOBAL_MULTI_ASSET_EXIT_2026-08-19.md`
- `docs/evidence/sc-md/SC7_CROSS_ASSET_RANKING_GENERALIZATION_2026-08-19.md`
- `src/platform/Scoring/`
- `src/platform/Ranking/`

---

*Stand 2026-08-19: SC-2/C3 und SC-6 Core-Lineage sind Human-gemerged. SC-7 Phase D ist shadow/read-only implementiert. Ranking-/Score-Impact, Cross-Cohort-Kalibrierung und Gemini Shadow bleiben deaktiviert bzw. separat Owner-gated.*
