# Screening · Scoring · Market Data — Single Point of Trust Roadmap

**Document ID:** SC-MD-SPT-0001  
**Version:** 1.0.20  
**Status:** ACTIVE — CANONICAL EXECUTION AUTHORITY  
**Stand:** 2026-08-19  
**Repository-Baseline:** `main@3ed2b2e9c9421bc979ca2487610a6a49a655e888` + PR #435 / `agent/sc2-global-multi-asset-exit`  
**Owner:** SvenKulessa  
**Authority:** DOCUMENTATION_HYGIENE_POLICY · GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY / ADR-0086 · ROADMAP_CONSOLIDATION_MASTER_INDEX · ADR-0020 / ADR-0041 · ESS EventMesh/Traceability

---

## 1. Zweck

Dieses Dokument ist der **Single Point of Trust (SPT)** für die Screening-/Scoring-/Market-Data-Wertschöpfungskette der CAPITAL-AI Multi-Asset-Plattform.

**Keine parallele Remediation und keine parallele Scoring-Architektur.** Alle offenen Screening-/Scoring-/MD-Arbeiten werden ausschließlich hier getrackt. ADR-0087 konkretisiert UAI + ScoringModelRegistry + Single Dispatcher. ADR-0088/0089 integrieren Research-Evidence/Gemini ausschließlich als Acquisition-Adapter vor dem Evidence Gate; ADR-0090 macht diesen Gemini-Pfad Free-Tier-only und verbietet Paid Mode. Die etablierte Governance-Authority-/Supersession-Entscheidung bleibt die hier gemeinte ADR-0086-Authority; die durch PR #414 zusätzlich eingeführte zweite ADR-Datei mit derselben Nummer ist ein separates Governance-Remediation-Item.

---

## 2. Code-vs-Docs-Synthese — Update 2026-08-19

### 2.1 Was der Code heute liefert

| Schicht | Code-Pfad | Reife |
|---|---|---|
| Market-Data Gateway | `src/platform/MarketData/` | **SC-4 Matrix/Health + SC-5 CoinGecko canonical multi-field** |
| Provider | TwelveData, FMP Index, CoinGecko; weitere Gateway-Adapter registriert; Alpaca shadow | **Kern live** |
| Evidence / Consensus | Snapshot/Spot consensus, traditional/commodity/macro evidence | **stark ausgebaut** |
| Research Evidence | `src/platform/ResearchEvidence/` + `server/researchEvidence/` | **Gemini default-off/Free-Tier-only/keine Score-Wirkung** |
| UAI / Model Registry | `src/platform/Scoring/` | **Foundation auf main; C3 Multi-Asset Binding in PR #435** |
| Canonical Dispatcher | `src/platform/Scoring/ScoringDispatcher.ts` | **C1/C2 landed; C3 Crypto/Traditional/Commodity/Sovereign Binding implementiert, CI offen** |
| Scoring-Engines | verified Crypto, Traditional, Commodity Evidence, Sovereign Benchmark; Legacy Research Engines | **produktive Konsolidierung C3 aktiv** |
| Ranking / Eligibility | `ranking.service` + SC-7 composite opt-in | **Crypto-lastig; cross-asset noch offen** |
| Unified DQ/Confidence | `CompositeDataQuality`; impact flags false | **Foundation + consumer map** |

### 2.2 Verbleibende Lücken

1. **SC-2 C3 Validation/Merge:** Multi-Asset Single-Dispatcher-Code ist implementiert; M10-authorisierte CI/Governance und Human Merge offen.
2. scoreImpact / rankingImpact weiterhin Owner-gated (`false`).
3. Ranking-Generalisierung cross-asset offen.
4. Multi-provider crypto quorum + `executionPriceEligible` offen.
5. Gemini Shadow: interner Consumer + Coverage/Latenz/Quota-Messung offen; Shadow bleibt deaktiviert.
6. Evidence Promotion: reale Source-/Lizenz-/Field-Policies und Promotion zu `ScoringEvidenceRef` separat Owner-gated.
7. Alpaca primary promotion Owner-gated.
8. SC-8 vollständige Drift-/Golden-/Walk-Forward-Governance offen.
9. Physisch verbleibender, aber produktiv unerreichbarer Multi-Asset-Legacy-Code in `server.application.ts` ist Source-Hygiene, nicht zweite Scoring-Autorität.

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
Confidence + DQ Composite -> Ranking / Eligibility / SLO
          ↓
EventMesh + Traceability + Supervisor
          ↓
API / Screener UI / Alerts / Backtest Evidence
```

**Harter Vertrag:** UAI Identity, ScoringModelRegistry, ScoringDispatcher, CanonicalScoreResult und fail-closed Evidence. LLM-/Research-Output ist niemals direkt verifizierte Finanz-Evidence. Gemini Shadow ist Acquisition-only und Free-Tier-only; `AI_DISCOVERED_EVIDENCE` bleibt `scoreEligible=false`. Fehlende validierte Evidence oder Modelauflösung bleibt `SCORE_NOT_COMPUTABLE` bzw. in Market-Data-Sinks `score=null`.

---

## 4. Ausführungs-Backlog (SC-*)

| ID | Titel | Priorität | Status (2026-08-19) | DoD (kurz) |
|---|---|---|---|---|
| **SC-0** | Baseline freeze & inventory | P0 | **LANDED** | SPT gemerged |
| **SC-1** | Classification consolidation | P0 | **LANDED** | Canonical schema; deterministic coverage |
| **SC-2** | Model registry & UAI adapters | P1 | **IN IMPLEMENTATION — C1/C2 landed; C3 PR #435 validation pending** | alle produktiven Score-Consumer via UAI + Registry + einen Dispatcher + canonical result |
| **SC-3** | Unified DQ + Confidence composite | P0 | **FOUNDATION LANDED** | Composite; impact off |
| **SC-4** | Gateway hardening & provider matrix | P1 | **Phase A LANDED** | Matrix + RL + supervisor health |
| **SC-5** | Live coverage expansion | P1 | **Phase A–D code** | execution quorum still open |
| **SC-6** | Scoring integrity & lineage | P1 | **PARTIAL -> C3 UAI/model lineage implemented** | contract unification lands with SC-2 C3 |
| **SC-7** | Ranking generalization | P1 | **Phase A–C LANDED** | cross-asset modes still open; impact off |
| **SC-8** | Horizon / Walk-Forward backtests | P2 | FOUNDATION/PARTIAL | drift + golden-set + full walk-forward governance open |

**Kritischer Pfad:** SC-0 → SC-1 + SC-3 → SC-4 → SC-5 → **SC-2/SC-6 consolidation** → SC-7 full → SC-8.

---

## 5. Authority & Mutationsregeln

1. Runtime-/Code-/Produktions-Evidence  
2. Explizite Human/Owner-Freigabe + Accepted ADR  
3. Spezifische ESS/Governance Policies gemäß der etablierten Governance Authority  
4. **Dieses SPT (SC-MD-SPT-0001)**  
5. ROADMAP_CONSOLIDATION_MASTER_INDEX  
6. Historische/archivierte Docs

Mutation von Scoring-Gewichten, Eligibility-Schwellen, Market-Data-Provider-Routing, Live-Gates oder **scoreImpact/rankingImpact** erfordert Owner-Freigabe.

ADR-0090 bleibt für Gemini Research Shadow autoritativ: Free-Tier-only, `gemini-2.5-flash`, Paid Mode verboten, Operator-Attestation für billing-freies Projekt, unabhängiger Kill-Switch `GEMINI_RESEARCH_SHADOW_ENABLED=false`. Eine Score-Evidence-Promotion bleibt ein eigenes field-spezifisches Gate.

### Main-Korrelation 2026-08-19

- PR #421 (`/api/crypto/score`) Human-gemerged nach Main-Revalidation.
- PR #424 (`/api/crypto/list` + `/top10`) Human-gemerged nach Main-Revalidation.
- PR #427 führte C1 `ScoringDispatcher`, Research-only `/analyze` und kanonischen DeFi-UI-Score ein; Human-gemerged.
- PR #428 führte C2a Composition-Root-/Legacy-Operational-Exit ein; Human-gemerged.
- PR #430 führte C2b Physical Standard-Crypto Cleanup ein; Human-gemerged auf `main@2d8e482174e97601d4343249e50d208ccf6f6355`.
- Unmittelbar vor #430 wurde PR #429 **M10 Controlled Cutover** gemerged. #430 wurde danach mit dem neuen Main synchronisiert; gegen die neue #429-Basis blieb der #430-Scope exakt sieben C2b-Dateien.
- C3 startete frisch von `main@2d8e4821...` auf `agent/sc2-global-multi-asset-exit` und wurde erst nach Abschluss der statischen Pre-PR-Arbeit als Draft PR #435 geöffnet.
- Während der PR-Erstellung merge-te PR #432 und verschob Main auf `3ed2b2e9c9421bc979ca2487610a6a49a655e888`. C3 wurde sofort als echter zweiparentiger Sync auf diesen Main gebracht. `DOC-ADR-0091` und alle #432-Dateien bleiben erhalten.
- PR #433 ist weiter offen; direkter C3-Overlap ausschließlich `docs/governance/document-registry.json`, dort additive M10-Closure-Einträge. Falls #433 vorher landet, muss die Registry vor C3-Merge-Readiness neu zusammengesetzt werden.
- Nach #429 ist teure PR-CI nur über die PR-state-gebundene Owner-Passkey/WebAuthn-Transaktion `AUTHORIZE_PR_CI` für den exakten aktuellen Head zulässig; Human Merge bleibt separat.
- Die ADR-0086-Nummernkollision aus PR #414 bleibt außerhalb SC-2; ADR-0087 ist fachliche Single-Scoring-Authority.

### Phase-C-Scope-Entscheidung

Phase C bleibt sequenziell und erzeugt keine zweite Roadmap:

- **C1 — LANDED:** Standard-Crypto Router/UI + Research Boundary -> `ScoringDispatcher`.
- **C2a — LANDED:** Market-Data Runtime + Legacy Standard-Crypto Endpoints -> Dispatcher; Chart-Score -> Simulation-only.
- **C2b — LANDED:** physische Standard-Crypto-Legacy-Ausführung entfernt; Cold-Start geschlossen.
- **C3 — IMPLEMENTED, VALIDATION PENDING (PR #435):**
  - Traditional CanonicalResultAdapter;
  - Commodity/Sovereign Dispatcher binding;
  - Registry verified score/batch/context -> Dispatcher;
  - Meme public score -> Crypto champion/Dispatcher;
  - Raw-Materials verified score -> Dispatcher;
  - Raw-Materials structural score remains non-productive research;
  - all scorable market-data classes intercepted before legacy scorer;
  - UAI/model/executor lineage attached;
  - repo-wide Single-Dispatcher structural proof prepared;
  - PR #432 main-race reconciled; #433 additive Registry correlation tracked.

Global Phase C wird erst nach C3 required CI/Governance + Human Merge als abgeschlossen markiert.

### Enterprise-/FinTech-Benchmark — verifiziert 2026-08-19

Als aktueller Enterprise-Benchmark dient die am 17.04.2026 veröffentlichte Federal Reserve/OCC/FDIC **Revised Guidance on Model Risk Management (SR 26-2)**. Für CAPITAL-AI ist das Engineering-Muster relevant, intended model use, Model Inventory, Governance/Controls, Validierung, Dokumentation und Monitoring an einer nachvollziehbaren Modell-Lifecycle-Grenze zusammenzuführen. C3 reduziert die verbleibenden produktiven Modellexecution-Surfaces auf eine identifizierbare UAI-/Registry-/Dispatcher-Autorität und bindet Model-ID, Version, Alias und Executor an die Runtime-Lineage. Daraus wird keine konkrete aufsichtsrechtliche Anwendbarkeit behauptet.

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
- `docs/evidence/sc-md/SC2_PHYSICAL_LEGACY_CRYPTO_CLEANUP_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GLOBAL_MULTI_ASSET_EXIT_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_RESEARCH_EVIDENCE_ADAPTER_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_SHADOW_TRANSPORT_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_FREE_TIER_ONLY_2026-08-19.md`
- `docs/runbooks/GEMINI_RESEARCH_SHADOW.md`
- `src/platform/Scoring/`
- `src/platform/ResearchEvidence/`
- `server/researchEvidence/`

---

*SC-2 Stand 2026-08-19: C1, C2a und C2b sind Human-gemerged. C3 Multi-Asset Single-Dispatcher-Code ist in Draft PR #435 gegen `main@3ed2b2e9...` implementiert; als nächste zwingende Stufe folgt Governance plus die separate M10 Owner-Passkey-Autorisierung für teure CI auf dem exakten finalen Head. Gemini Shadow bleibt default-off.*
