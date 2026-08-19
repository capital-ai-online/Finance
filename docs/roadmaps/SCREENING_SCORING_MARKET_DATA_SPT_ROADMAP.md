# Screening · Scoring · Market Data — Single Point of Trust Roadmap

**Document ID:** SC-MD-SPT-0001  
**Version:** 1.0.17  
**Status:** ACTIVE — CANONICAL EXECUTION AUTHORITY  
**Stand:** 2026-08-19  
**Repository-Baseline:** `main@4c280fb53e74e38d571e4b44b620a7b33681e0be` + Execution Branch `agent/sc2-composition-root-crypto-exit`  
**Owner:** SvenKulessa  
**Authority:** DOCUMENTATION_HYGIENE_POLICY · GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY / ADR-0086 · ROADMAP_CONSOLIDATION_MASTER_INDEX · ADR-0020 / ADR-0041 · ESS EventMesh/Traceability

---

## 1. Zweck

Dieses Dokument ist der **Single Point of Trust (SPT)** für die Screening-/Scoring-/Market-Data-Wertschöpfungskette der CAPITAL-AI Multi-Asset-Plattform.

**Keine parallele Remediation und keine parallele Scoring-Architektur.** Alle offenen Screening-/Scoring-/MD-Arbeiten werden ausschließlich hier getrackt. ADR-0087 konkretisiert UAI + ScoringModelRegistry; ADR-0088/0089 integrieren Research-Evidence/Gemini ausschließlich als Acquisition-Adapter vor dem Evidence Gate; ADR-0090 macht diesen Gemini-Pfad Free-Tier-only und verbietet Paid Mode. ADR-0086 bleibt die gemergte Governance-Authority-/Supersession-Entscheidung und ist nicht Teil der SC-2-Fachnummerierung.

---

## 2. Code-vs-Docs-Synthese — Update 2026-08-19

### 2.1 Was der Code heute liefert

| Schicht | Code-Pfad | Reife |
|---|---|---|
| Market-Data Gateway | `src/platform/MarketData/` | **SC-4 Matrix/Health + SC-5 CoinGecko canonical multi-field** |
| Provider | TwelveData, FMP Index, CoinGecko; weitere Gateway-Adapter registriert; Alpaca shadow | **Kern live** |
| Evidence / Consensus | Snapshot/Spot consensus, traditional/commodity/macro evidence | **Stark ausgebaut** |
| Research Evidence | `src/platform/ResearchEvidence/` + `server/researchEvidence/` | **SC-2 A.5/A.6 auf main; Gemini default-off/Free-Tier-only/keine Score-Wirkung** |
| Scoring-Engines | Base/DeFi, crypto 9-Faktor, meme, raw materials, traditional, verified technical | **Multi-Engine; Konsolidierung aktiv** |
| UAI / Model Registry | `src/platform/Scoring/` | **Foundation + Standard-Crypto Consumer auf main** |
| Canonical Dispatcher | `src/platform/Scoring/ScoringDispatcher.ts` | **C1 LANDED; C2a Composition-Root Operational Exit aktiv** |
| Ranking / Eligibility | `ranking.service` + SC-7 composite opt-in | **Crypto-lastig; cross-asset noch offen** |
| Classification | Adapter + expanded deterministic table | **Canonical exit path** |
| Unified DQ/Confidence | `CompositeDataQuality`; impact flags false | **Foundation + consumer map** |

### 2.2 Verbleibende Lücken

1. scoreImpact / rankingImpact weiterhin Owner-gated (`false`)
2. Ranking-Generalisierung cross-asset offen
3. Multi-provider crypto quorum + `executionPriceEligible` weiterhin offen
4. **SC-2 C2a:** Standard-Crypto Composition-Root-/Legacy-Ausgänge produktiv hinter Dispatcher bzw. Simulation-only — aktueller Branch
5. **SC-2 C2b:** operativ unerreichbaren Standard-Crypto-Dead-Code aus `server.application.ts` physisch entfernen
6. **SC-2 C3:** Traditional/Commodity/Sovereign/Meme/Raw-Materials mit CanonicalResultAdapter/Dispatcher vereinheitlichen
7. **Gemini Shadow Validation:** interner Shadow-Consumer sowie Coverage/Latenz/Quota-Messung offen; Shadow bleibt deaktiviert
8. **Evidence Promotion:** reale Source-/Lizenz-/Field-Policies und Promotion zu `ScoringEvidenceRef` separat Owner-gated
9. Alpaca primary promotion Owner-gated
10. SC-8 vollständige Drift-/Golden-/Walk-Forward-Governance offen

---

## 3. Kanonische Wertschöpfungskette

```text
[Asset Catalog / Request]
          ↓
Universal Asset Interface (identity only)
          ↓
Evidence Acquisition
  Market Providers -> MarketDataGateway
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
ScoringDispatcher (single model-execution authority)
          ↓
Domain Executor Adapter -> CanonicalScoreResult
          ↓
Confidence + DQ Composite -> Ranking / Eligibility / SLO
          ↓
EventMesh + Traceability + Supervisor
          ↓
API / Screener UI / Alerts / Backtest Evidence
```

**Harter Vertrag:** UAI Identity, ScoringModelRegistry, ScoringDispatcher, CanonicalScoreResult und fail-closed Evidence. LLM-/Research-Output ist niemals direkt verifizierte Finanz-Evidence. Gemini Shadow ist Acquisition-only und Free-Tier-only; `AI_DISCOVERED_EVIDENCE` bleibt `scoreEligible=false`. Fehlende validierte Evidence oder Modelauflösung bleibt `SCORE_NOT_COMPUTABLE`.

---

## 4. Ausführungs-Backlog (SC-*)

| ID | Titel | Priorität | Status (2026-08-19) | DoD (kurz) |
|---|---|---|---|---|
| **SC-0** | Baseline freeze & inventory | P0 | **LANDED** | SPT gemerged |
| **SC-1** | Classification consolidation | P0 | **LANDED** | Canonical schema; deterministic coverage |
| **SC-2** | Model registry & UAI adapters | P1 | **IN IMPLEMENTATION — C1 LANDED; C2a active** | alle produktiven Score-Consumer via UAI + Registry + einen Dispatcher + canonical result |
| **SC-3** | Unified DQ + Confidence composite | P0 | **FOUNDATION LANDED** | Composite; impact off |
| **SC-4** | Gateway hardening & provider matrix | P1 | **Phase A LANDED** | Matrix + RL + supervisor health |
| **SC-5** | Live coverage expansion | P1 | **Phase A–D code** | execution quorum still open |
| **SC-6** | Scoring integrity & lineage | P1 | **PARTIAL — Crypto Dispatcher/Registry lineage landed; C2a active** | contract unification continues with SC-2 |
| **SC-7** | Ranking generalization | P1 | **Phase A–C LANDED** | cross-asset modes still open; impact off |
| **SC-8** | Horizon / Walk-Forward backtests | P2 | FOUNDATION/PARTIAL | drift + golden-set + full walk-forward governance open |

**Kritischer Pfad:** SC-0 → SC-1 + SC-3 → SC-4 → SC-5 → **SC-2/SC-6 consolidation** → SC-7 full → SC-8.

---

## 5. Authority & Mutationsregeln

1. Runtime-/Code-/Produktions-Evidence  
2. Explizite Human/Owner-Freigabe + Accepted ADR  
3. Spezifische ESS/Governance Policies gemäß ADR-0086  
4. **Dieses SPT (SC-MD-SPT-0001)**  
5. ROADMAP_CONSOLIDATION_MASTER_INDEX  
6. Historische/archivierte Docs

Mutation von Scoring-Gewichten, Eligibility-Schwellen, Market-Data-Provider-Routing, Live-Gates oder **scoreImpact/rankingImpact** erfordert Owner-Freigabe.

ADR-0090 bleibt für Gemini Research Shadow autoritativ: Free-Tier-only, `gemini-2.5-flash`, Paid Mode verboten, Operator-Attestation für billing-freies Projekt, Render-Attestation gesetzt, unabhängiger Kill-Switch `GEMINI_RESEARCH_SHADOW_ENABLED=false`. Eine Score-Evidence-Promotion bleibt ein eigenes field-spezifisches Gate.

### Main-Korrelation 2026-08-19

- PR #421 (`/api/crypto/score` Registry-Consumer) wurde nach PR #422 auf aktuellem Main revalidiert und Human-gemerged.
- PR #424 migrierte `/api/crypto/list` + `/top10` und wurde nach erneutem Main-Abgleich Human-gemerged.
- PR #427 führte C1 `ScoringDispatcher`, Research-only `/analyze` und den kanonischen DeFi-UI-Score ein. Finaler Head `0a46cec3` bestand CI #1837 + Governance #1155 und wurde Human-gemerged.
- Aktuelle C2a-Baseline ist `main@4c280fb53e74e38d571e4b44b620a7b33681e0be`.
- `agent/sc2-composition-root-crypto-exit` wurde frisch von diesem Stand erstellt.
- Open PR #426 ist M10-Evidence-only; Open PR #414 ist Privacy/DSGVO. Beide werden vor C2a-PR erneut auf Pfad-/Semantik-Korrelation geprüft.

### Phase-C-Scope-Entscheidung

Phase C bleibt sequenziell und erzeugt keine zweite Roadmap:

- **C1 — LANDED:** Standard-Crypto Router/UI + Research Boundary -> `ScoringDispatcher`
- **C2a — ACTIVE:** Market-Data Runtime + Legacy Standard-Crypto Endpoints -> Dispatcher; Chart-Score -> Simulation-only
- **C2b — NEXT:** unerreichbaren Standard-Crypto-Dead-Code aus `server.application.ts` physisch entfernen
- **C3 — OPEN:** verbleibende Assetklassen -> CanonicalResultAdapter + Dispatcher; danach repo-weite Single-Dispatcher-Proof

Global Phase C wird erst nach C2b + C3 als abgeschlossen markiert.

### Enterprise-/FinTech-Benchmark — verifiziert 2026-08-19

Als aktueller Enterprise-Benchmark dient die am 17.04.2026 veröffentlichte Federal Reserve/OCC/FDIC **Revised Guidance on Model Risk Management (SR 26-2)**. Für CAPITAL-AI ist besonders das Engineering-Muster relevant, intended model use, Model Inventory, Governance/Controls, Validierung, Dokumentation und Monitoring an einer nachvollziehbaren Modell-Lifecycle-Grenze zusammenzuführen. C1/C2 reduzieren deshalb produktive Modellexecution-Surfaces und erzwingen für Standard-Crypto eine identifizierbare Registry-/Dispatcher-Autorität. Daraus wird keine konkrete aufsichtsrechtliche Anwendbarkeit behauptet.

NIST AI RMF 1.0 dient ergänzend als freiwilliger Lifecycle-/Traceability-Benchmark. NIST weist aktuell darauf hin, dass AI RMF 1.0 überarbeitet wird; dieses SPT unterstellt keine bereits finale Nachfolgeversion.

---

## 6. Related

- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- `docs/adr/ADR-0087-single-scoring-architecture-uai-model-registry.md`
- `docs/adr/ADR-0088-gemini-research-evidence-reentry-boundary.md`
- `docs/adr/ADR-0089-gemini-research-shadow-runtime.md`
- `docs/adr/ADR-0090-gemini-free-tier-only-zero-cost-policy.md`
- `docs/evidence/sc-md/SC2_A1_A2_BASELINE_2026-08-19.md`
- `docs/evidence/sc-md/SC2_CRYPTO_SCORE_REGISTRY_CONSUMER_2026-08-19.md`
- `docs/evidence/sc-md/SC2_CRYPTO_LIST_TOP10_REGISTRY_CONSUMERS_2026-08-19.md`
- `docs/evidence/sc-md/SC2_CANONICAL_SCORING_DISPATCHER_2026-08-19.md`
- `docs/evidence/sc-md/SC2_COMPOSITION_ROOT_CRYPTO_EXIT_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_RESEARCH_EVIDENCE_ADAPTER_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_SHADOW_TRANSPORT_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_FREE_TIER_ONLY_2026-08-19.md`
- `docs/runbooks/GEMINI_RESEARCH_SHADOW.md`
- `src/platform/Scoring/`
- `src/platform/ResearchEvidence/`
- `server/researchEvidence/`

---

*SC-2 Stand 2026-08-19: C1 ist auf `main@4c280fb5` gelandet. C2a erzwingt den kanonischen Standard-Crypto-Dispatcher jetzt auch für Market-Data-/Legacy-Compatibility-Ausgänge und trennt Charts-Scoring explizit als nicht-produktive Simulation. C2b/C3 bleiben sichtbar offen; Gemini Shadow bleibt default-off.*
