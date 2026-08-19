# Screening · Scoring · Market Data — Single Point of Trust Roadmap

**Document ID:** SC-MD-SPT-0001  
**Version:** 1.0.12  
**Status:** ACTIVE — CANONICAL EXECUTION AUTHORITY  
**Stand:** 2026-08-19  
**Repository-Baseline:** `main@f8a1630a` + SC-2 parent chain through `agent/gemini-research-evidence-adapter` + current child `agent/gemini-free-tier-only` (Draft PR #416)  
**Owner:** SvenKulessa  
**Authority:** DOCUMENTATION_HYGIENE_POLICY · GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY / ADR-0086 · ROADMAP_CONSOLIDATION_MASTER_INDEX · ADR-0020 / ADR-0041 · ESS EventMesh/Traceability

---

## 1. Zweck

Dieses Dokument ist der **Single Point of Trust (SPT)** für die Screening-/Scoring-/Market-Data-Wertschöpfungskette der CAPITAL-AI Multi-Asset-Plattform (Universal-Asset-Interface-Ziel, Score-Kontrakte, Market-Data-Gateways).

Es ersetzt als Ausführungsautorität:

| Dokument | Rolle | Status nach diesem SPT |
|---|---|---|
| `docs/architecture/ENTERPRISE_SCREENING_SCORING_MASTER_ARCHITECTURE.md` (Phase 2) | Aspirational Blueprint Aug-01 | **SUPERSEDED** — Phase-1-Inventar bleibt Evidence |
| `docs/architecture/ENTERPRISE_SCREENING_REMEDIATION_2026-08.md` | Enger Remediation-Scope | **ARCHIVED** → `docs/archive/legacy/` |
| Parallel-Remediation-Branches / Ad-hoc-Screening-Todos | Fragmentiert | **FORBIDDEN** — nur über dieses SPT |

**Keine parallele Remediation und keine parallele Scoring-Architektur.** Alle offenen Screening-/Scoring-/MD-Arbeiten werden ausschließlich hier getrackt. ADR-0087 konkretisiert UAI + ScoringModelRegistry; ADR-0088/0089 integrieren Research-Evidence/Gemini ausschließlich als Acquisition-Adapter vor dem Evidence Gate; ADR-0090 macht diesen Gemini-Pfad Free-Tier-only und verbietet Paid Mode. ADR-0086 bleibt die auf `main` gemergte Governance-Authority-/Supersession-Entscheidung und ist nicht Teil der SC-2-Fachnummerierung.

---

## 2. Code-vs-Docs-Synthese (Update 2026-08-19)

### 2.1 Was der Code heute liefert

| Schicht | Code-Pfad | Reife |
|---|---|---|
| Market-Data Gateway | `src/platform/MarketData/` | **SC-4 Matrix/Health + SC-5 CoinGecko canonical multi-field** |
| Provider | TwelveData, FMP Index, CoinGecko; CoinAPI/EODHD/TwelveData(crypto) gateway adapters registered, unconsumed; Alpaca shadow | **Kern live** |
| Evidence / Consensus | Snapshot/Spot consensus, traditional/commodity/macro evidence | **Stark ausgebaut** |
| Research Evidence | `src/platform/ResearchEvidence/` + `server/researchEvidence/` | **SC-2 A.5/A.6: Contract + server-only Gemini Shadow; default-off, Free-Tier-only, keine Score-Wirkung** |
| Scoring-Engines | Base/DeFi, crypto 9-Faktor, meme, raw materials, traditional, verified technical | **Multi-Engine; A1/A2 Konsolidierung gestartet** |
| UAI / Model Registry | `src/platform/Scoring/` | **SC-2 Phase A Foundation im Parent-Branch: UAI + fail-closed Champion Resolver** |
| Ranking / Eligibility | `ranking.service` + SC-7 composite opt-in | **Crypto-lastig; cross-asset noch offen** |
| Classification | Adapter + expanded deterministic table | **Canonical exit path** |
| Unified DQ/Confidence | `CompositeDataQuality`; impact flags false | **Foundation + consumer map** |

### 2.2 Verbleibende Lücken

1. scoreImpact / rankingImpact weiterhin Owner-gated (`false`)
2. Ranking-Generalisierung cross-asset offen
3. Multi-provider crypto quorum + `executionPriceEligible` weiterhin offen; vorhandene Gateway-Adapter noch unconsumed
4. **SC-2 Consumer Migration:** alle produktiven Score-Entry-Points noch über Registry/Dispatcher + CanonicalScoreResult vereinheitlichen
5. **Gemini Shadow Validation:** vollständiges CI-PASS, interner Shadow-Consumer sowie Coverage/Latenz/Quota-Messung offen; Free-Tier-Key und Billing-Attestation sind operativ gesetzt, Shadow bleibt deaktiviert
6. **Evidence Promotion:** reale Source-/Lizenz-/Field-Policies und Promotion von validierten Research Candidates zu ScoringEvidenceRef separat Owner-gated
7. Alpaca primary promotion Owner-gated
8. SC-8 vollständige Drift-/Golden-/Walk-Forward-Governance offen

---

## 3. Kanonische Wertschöpfungskette (SPT-Modell)

```text
[Asset Catalog / Request]
          ↓
Universal Asset Interface (identity only)
          ↓
 ┌──────────────────────────────────────────────────────────────────┐
 │ Evidence Acquisition                                             │
 │ Market Providers -> MarketDataGateway                            │
 │ Research Providers -> ResearchEvidenceAdapter                    │
 │   optional GeminiResearchTransport                               │
 │     -> canonical Free-Tier-only factory (server-only/off)        │
 │     -> AI_DISCOVERED_EVIDENCE (scoreEligible=false)              │
 │     -> Source Validation                                         │
 │     -> future field-specific Evidence Promotion                  │
 └──────────────────────────────┬───────────────────────────────────┘
                                ↓
                DataQualityService + Evidence/Consensus Services
                                ↓
                Classification (Asset Class / Category / Tier)
                                ↓
                        Feature Contract
                                ↓
                ScoringModelRegistry (canonical champion only)
                                ↓
                Scoring Executor Adapter -> CanonicalScoreResult
                                ↓
                Confidence + DQ Composite -> Ranking / Eligibility / SLO
                                ↓
                EventMesh + Traceability + Supervisor
                                ↓
                API / Screener UI / Alerts / Backtest Evidence
```

**Harter Vertrag:** UAI Identity, ScoringModelRegistry, CanonicalScoreResult und fail-closed Evidence. LLM-/Research-Output ist niemals direkt verifizierte Finanz-Evidence. Gemini Shadow ist Acquisition-only und Free-Tier-only; `AI_DISCOVERED_EVIDENCE` bleibt `scoreEligible=false`. Fehlende validierte Evidence oder Modelauflösung bleibt `SCORE_NOT_COMPUTABLE`.

---

## 4. Ausführungs-Backlog (SC-*)

| ID | Titel | Priorität | Status (2026-08-19) | DoD (kurz) |
|---|---|---|---|---|
| **SC-0** | Baseline freeze & inventory | P0 | **LANDED** | SPT gemerged |
| **SC-1** | Classification consolidation | P0 | **LANDED** | Canonical schema; deterministic coverage |
| **SC-2** | Model registry & UAI adapters | P1 | **IN IMPLEMENTATION — A + A.5 + A.6 + Free-Tier hardening** | UAI + registry + zero-cost research shadow + all score consumers via one dispatcher + canonical result |
| **SC-3** | Unified DQ + Confidence composite | P0 | **FOUNDATION LANDED** | Composite; impact off |
| **SC-4** | Gateway hardening & provider matrix | P1 | **Phase A LANDED** | Matrix + RL + supervisor health |
| **SC-5** | Live coverage expansion | P1 | **Phase A–D code** | execution quorum still open |
| **SC-6** | Scoring integrity & lineage | P1 | PARTIAL | contract unification continues with SC-2 |
| **SC-7** | Ranking generalization | P1 | **Phase A–C LANDED** | cross-asset modes still open; impact off |
| **SC-8** | Horizon / Walk-Forward backtests | P2 | FOUNDATION/PARTIAL | drift + golden-set + full walk-forward governance open |

**Kritischer Pfad:** SC-0 → SC-1 + SC-3 → SC-4 → SC-5 → **SC-2/SC-6 consolidation** → SC-7 full → SC-8.

---

## 5. Authority & Mutationsregeln

1. Runtime-/Code-/Produktions-Evidence  
2. Explizite Human/Owner-Freigabe + Accepted ADR im jeweiligen Scope  
3. Spezifische ESS/Governance Policies gemäß `GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY` / ADR-0086  
4. **Dieses SPT (SC-MD-SPT-0001)**  
5. ROADMAP_CONSOLIDATION_MASTER_INDEX  
6. Historische/archivierte Docs

Mutation von Scoring-Gewichten, Eligibility-Schwellen, Market-Data-Provider-Routing, Live-Gates oder **scoreImpact/rankingImpact** erfordert Owner-Freigabe.

ADR-0090 überschreibt für Gemini Research Shadow die frühere konfigurierbare Paid-/USD-Kostensteuerung: der kanonische Server-Entry-Point ist **Free-Tier-only**, pinnt `gemini-2.5-flash`, verbietet Paid Mode und verlangt zusätzlich eine Operator-Attestation, dass der `GEMINI_API_KEY` zu einem Google-Projekt ohne Billing-Verknüpfung gehört. Der Owner hat am 2026-08-19 bestätigt, dass der Free-Tier-Key ohne Billing in `finance-secrets.env` liegt; im Render-Service ist `GEMINI_RESEARCH_FREE_TIER_ATTESTED=true` gesetzt. Der unabhängige Kill-Switch bleibt `GEMINI_RESEARCH_SHADOW_ENABLED=false`, daher entsteht weiterhin kein Gemini-Traffic. Der Blueprint behält `GEMINI_RESEARCH_FREE_TIER_ATTESTED=false` als sicheren Default für neue Deployments. Eine Score-Evidence-Promotion bleibt ein eigenes field-spezifisches Gate.

### Main-Korrelation 2026-08-19

Während der SC-2-Arbeit ist `main` von `345b2bd3` auf `f8a1630a` vorgerückt. Die 20 neuen Main-Commits betreffen Governance Authority/Regulatory Hardening und belegen `ADR-0086`. Die SC-2-ADR-Kette wurde daher vor Merge kollisionsfrei auf `ADR-0087`–`ADR-0090` renummeriert. Der neue Governance Document Registry wird in diesem Branch übernommen und um die SC-2-Artefakte ergänzt. Die neuen AI-Governance-Sink-Änderungen auf `main` erzeugen keinen direkten Provider-/Scoringpfad für Gemini Research und werden nicht parallel dupliziert.

---

## 6. Related

- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- `docs/adr/ADR-0087-single-scoring-architecture-uai-model-registry.md`
- `docs/adr/ADR-0088-gemini-research-evidence-reentry-boundary.md`
- `docs/adr/ADR-0089-gemini-research-shadow-runtime.md`
- `docs/adr/ADR-0090-gemini-free-tier-only-zero-cost-policy.md`
- `docs/evidence/sc-md/SC2_A1_A2_BASELINE_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_RESEARCH_EVIDENCE_ADAPTER_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_SHADOW_TRANSPORT_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_FREE_TIER_ONLY_2026-08-19.md`
- `docs/runbooks/GEMINI_RESEARCH_SHADOW.md`
- `src/platform/Scoring/`
- `src/platform/ResearchEvidence/`
- `server/researchEvidence/`

---

*SC-2 A1/A2 + A.5/A.6 Free-Tier hardening 2026-08-19: UAI/Model Registry im Parent; ResearchEvidenceAdapter + server-only Gemini Shadow Transport im Child; Zero-Cost-Policy im aktuellen Child `agent/gemini-free-tier-only`. Shadow bleibt default-off, billing-free/free-tier-only, secret-/rate-/quota-/circuit-/health-/telemetry-gated und ohne Score-/Ranking-/Market-Data-Routing-Impact. Merge nur nach CI, Main-Korrelationscheck und Owner-Review.*