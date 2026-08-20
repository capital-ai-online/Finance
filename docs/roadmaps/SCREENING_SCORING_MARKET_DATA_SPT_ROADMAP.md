# Screening · Scoring · Market Data — Single Point of Trust Roadmap

**Document ID:** SC-MD-SPT-0001  
**Version:** 1.1.0  
**Status:** ACTIVE — CANONICAL EXECUTION AUTHORITY  
**Stand:** 2026-08-20  
**Repository-Baseline:** `main@f1dff495fe792a4d4a26a3513f0525b4974bd349` + Draft PR #458  
**Owner:** SvenKulessa  
**Authority:** DOCUMENTATION_HYGIENE_POLICY · GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY / ADR-0096 · ROADMAP_CONSOLIDATION_MASTER_INDEX · ADR-0032 · ADR-0041 / ESS-0016 · ADR-0087 · ESS EventMesh/Traceability · Owner Chat-Priorität 2026-08-20

---

## 1. Zweck

Single Point of Trust für die **Screening-/Scoring-/Market-Data-Wertschöpfungskette** der CAPITAL-AI Multi-Asset-Plattform. Diese Fassung konsolidiert die bislang getrennt beschriebenen Market-Data-, Evidence-, Scoring-, Display-, Buffett-, Telemetry-, Compliance- und Documentary-Korrelationen in **eine homogene fachliche Kette**, ohne eine zweite Runtime-, Scoring-, Governance- oder Dokumentations-Authority zu erzeugen.

Leitregeln:

1. **Eine fachliche Authority pro Entscheidung.** Neue Implementierungsdetails erweitern bestehende Authorities oder werden als Evidence/Revalidation dokumentiert.
2. **Catalog ≠ Evidence.** ADR-0032 bleibt Parent-Authority für die Trennung von Asset-Katalog und verifizierten Finanzbeobachtungen.
3. **Providerzugriff über bestehende Data Plane.** ADR-0041 / ESS-0016 bleiben Parent-Authority für Gateway, Provenance, Freshness, Rate Limits, Cache, Coalescing und Circuit Breaker.
4. **Ein produktiver Scoring Exit.** ADR-0087 bleibt fachliche UAI/Model-Registry/Single-Dispatcher-Authority.
5. **Display ist keine Scoring-Authority.** `verified-asset-display/1.0.0` ist eine read-only Presentation-/Research-Projektion aus vorhandener Evidence.
6. **Entitlement vor kostenrelevantem Consumer-I/O.** Buffett muss die serverseitige ADR-0034-Autorisierung vor der Asset-Auswertung durchlaufen.
7. **Audit und Telemetry bleiben getrennt.** Operational Telemetry misst die Kette; EventMesh/Traceability/Compliance/Documentary liefern Governance-/Audit-Evidence.

ADR-0088/0089/0090 begrenzen Research/Gemini weiterhin auf Acquisition-only, default-off und Free-Tier-only; Research-/LLM-Ausgabe ist keine direkte Score- oder Market-Evidence.

---

## 2. Authority- und Korrelationsmodell

| Ebene | Kanonische Quelle | Rolle in dieser Wertschöpfungskette | Status / Behandlung |
|---|---|---|---|
| Catalog / Provenance | ADR-0032 | Trennung Asset Catalog ↔ verifizierte Market Evidence; No-Demo-/Fail-Closed-Invariante | **Parent-Authority**; durch PR #458 erneut berührt und zu revalidieren |
| Traditional Quote / Eligibility | ADR-0025 | `traditional-quote/1.0.0`, Screening-/Alert-Referenzwerte | spezialisierter Contract; Proposed-Dokument ist keine höhere Authority als ADR-0032/0041 |
| Index / Commodity / Sovereign Evidence | ADR-0033 | assetklassenspezifische Evidence-Contracts | **Accepted / resolved**; Semantik bleibt unverändert |
| Buffett Access | ADR-0034 | serverseitige Subscription-/Quota-Autorisierung | **Accepted**; vor Buffett-Hydration verbindlich |
| Provider Data Plane | ADR-0041 + ESS-0016 | Gateway, Provider-Adapter, Freshness, Provenance, Resilience | **Parent-Authority** |
| Runtime Facade | ADR-0075 + ADR-0083 | Cache/Coalescing/Background Refresh innerhalb kanonischer Serverstruktur | ADR-0083 Parent; ADR-0075 Implementierungsentscheidung/Phase |
| Scoring | ADR-0087 + SC-2 Evidence | UAI, Model Registry, Dispatcher, Executor, CanonicalScoreResult | **einzige produktive Scoring-Authority** |
| Ranking / Comparability | SC-7 | Intended-Use-Kohorten, Normalisierungs-/Comparability-Gates | Shadow/Owner-gated wie dokumentiert |
| Operational Telemetry | ADR-0056 + `src/platform/Telemetry/contracts.ts` | messbare Stufen der FinTech-Kette | querliegende Telemetry-Projektion, keine Audit-Authority |
| Compliance | ADR-0007 + Security/Compliance Authorities | Data Integrity, Datenschutz, deterministische Analyse, Audit, Export | querliegende Kontrollkette |
| Documentary / Change Governance | ESS-0010/0011/0012 + `DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP` | Change → Evidence → Traceability → Quality/Security/Compliance → Release | separate **Change-/Governance-Kette**, nicht Runtime-Datenpfad |
| Verified Asset Display | `verified-asset-display/1.0.0` + ADR-0032-Revalidation 2026-08-20 | per-symbol Presentation-/Research-Projektion | **keine neue Authority** |
| ADR-0097 | Draft-PR-Artefakt | enthielt überwiegend bereits vorhandene Entscheidungen | **vor Merge zu retiren/konsolidieren**, nicht als zweite Authority fortführen |

### 2.1 Supersession-Regel für ADR-0097

Die Korrelation zeigt **keine neue Architekturentscheidung**, die ADR-0032/0041/0087 ablösen müsste. ADR-0097 darf deshalb nicht durch bloße Neuheit eine zweite Authority erzeugen. Seine fachlich neuen Implementierungsdetails werden wie folgt verteilt:

- `verified-asset-display/1.0.0` → ADR-0032-Revalidation / diese SPT-Kette;
- progressive per-symbol Hydration → Provider-/Consumer-Implementierung unter ADR-0032 + ADR-0041;
- 90-s Background Provider-I/O → Runtime-Implementierung unter ADR-0083 / ADR-0075 + ADR-0041;
- Buffett stock-only → Domain-/Frontend-Regel unter ADR-0032 + ADR-0034;
- Work-Claim-Lifecycle → bestehende Governance-/Coordination-Regeln;
- Scoring bleibt vollständig unter ADR-0087.

Damit ist **kein semantisches Supersession-Paket gegen ADR-0032 erforderlich**, weil deren Entscheidung unverändert richtig bleibt; behoben wird Implementation-/Consumer-Drift.

---

## 3. Homogene kanonische FinTech-Wertschöpfungskette

Die bestehende Telemetry-Kette und die bisherige SPT-Scoring-Kette werden nicht konkurrierend geführt, sondern hier hierarchisch zusammengeführt.

```text
[1] Request Intake
    API / UI / Scheduler / Internal Consumer
      ↓
[2] Identity & Access
    IAM / AuthN / AuthZ
      ↓
[3] Entitlement & Usage Gate
    Subscription / Quota / Feature Authorization
      ↓
[4] Asset Discovery & Universal Identity
    metadata-only Asset Catalog → canonical symbol / asset class → UAI
      ↓
[5] Orchestration & Runtime Guard
    request orchestration / cache / coalescing / cadence / circuit state
      ↓
[6] Market-Data / Evidence Acquisition
    provider-neutral gateway + approved domain adapters
      ↓
[7] Data Validation & Provenance
    provider identity + evidence IDs + observedAt/retrievedAt + freshness + DQ
      ↓
      ├───────────────────────────────────────────────────────────────┐
      │                                                               │
      │ A. DISPLAY / RESEARCH LANE                                    │ B. CANONICAL SCORING LANE
      │                                                               │
      │ verified-asset-display/1.0.0                                  │ Classification + Feature Contract
      │ read-only / per symbol                                        │      ↓
      │ no execution-price eligibility                                │ ScoringModelRegistry
      │      ↓                                                        │      ↓
      │ domain-specific analysis                                      │ ScoringDispatcher
      │ (z.B. Buffett stock-only)                                     │      ↓
      │      ↓                                                        │ Domain Executor Adapter
      │ explainability / presentation                                 │      ↓
      │                                                               │ CanonicalScoreResult + lineage
      │                                                               │      ↓
      │                                                               │ Confidence / DQ Composite
      │                                                               │      ↓
      │                                                               │ Ranking Comparability Gate
      │                                                               │      ↓
      │                                                               │ Ranking / Eligibility / SLO
      │                                                               │
      └──────────────────────────────┬────────────────────────────────┘
                                     ↓
[8] Output Delivery
    UI / API / Alerts / Backtest Evidence / Export
      ↓
[9] EventMesh / Traceability / Supervisor references
      ↓
[10] Quality / Security / Compliance / Documentary evidence
      ↓
[11] Release / Deployment Runtime Evidence
```

### 3.1 Dritte fachliche Lane: Quote / Alert / Backtest

Quote-, Alert- und Backtest-Consumer benutzen dieselben Stufen 1–7, verzweigen danach jedoch in ihre jeweils freigegebenen Quote-/History-Contracts. Sie dürfen weder den Display-Contract zu einem Execution-Price-Feed erklären noch einen Score erzeugen, wenn der Scoring-Dispatcher nicht durchlaufen wurde.

### 3.2 Telemetry-Mapping

Die vorhandenen `FinTechValueChainStage`-Werte bleiben der operative Mess-Contract. Die fachlich detailliertere SPT-Kette wird darauf projiziert:

| Telemetry Stage | SPT-Stufen |
|---|---|
| `request-intake` | 1 Request Intake |
| `identity-access` | 2 Identity & Access |
| `entitlement-usage` | 3 Entitlement & Usage Gate |
| `orchestration` | 4 Asset Discovery/UAI + 5 Orchestration/Runtime Guard |
| `market-data-provider` | 6 Evidence Acquisition |
| `data-validation` | 7 Validation/Provenance/DQ |
| `scoring-analysis` | Canonical Scoring Lane **oder** klar gekennzeichnete deterministische Analyse wie Buffett; Telemetry-Name erzeugt keine Scoring-Authority |
| `explainability` | Explainability / Evidence Presentation |
| `billing` | optionale Billing-/Subscription-Operation; kein Pflichtschritt jeder Analyseanfrage |
| `output-delivery` | 8 UI/API/Alert/Export-Ausgabe |
| `deployment-runtime` | 11 Release-/Runtime-Evidence |

EventMesh, Audit, Traceability und Documentary werden absichtlich **nicht** als zusätzliche Telemetry-Nutzdatenbank modelliert. Telemetry darf nur auf deren Evidence referenzieren.

---

## 4. Buffett Value Check — kanonische Sub-Chain

Der Buffett Value Check ist eine **deterministische Aktienanalyse**, aber **kein Consumer der kanonischen Multi-Asset-Scoring-Authority**.

```text
Buffett View / Aktienauswahl
  ↓
Identity / Session
  ↓
POST /api/entitlements/warren-buffett/authorize
  ↓ DENY → keine Provider-Hydration
  ↓ ALLOW
Stock-only Catalog Validation
  ↓
GET /api/registry/assets/:symbol/verified-display
  ↓
Traditional Quote + Stock Fundamentals
  ↓
Provenance / Availability Gate
  ↓
Graham / DCF Szenarioanalyse
  ↓
Explainability: verified input vs manual assumption
  ↓
UI Output
```

Verbindliche Regeln:

- ausschließlich `assetClass/type === stock`;
- serverseitige ADR-0034-Autorisierung **vor** kosten-/quota-relevantem Provider-I/O;
- der Entitlement-Endpunkt muss Nicht-Aktien für Buffett fail-closed ablehnen, bevor Quota verbraucht wird;
- kein synthetisches EPS, kein pauschaler Score, kein automatisches PASS bei fehlenden Fundamentals;
- manuelle Modellannahmen sind erlaubt, aber als Szenarioannahmen zu kennzeichnen;
- `verified-asset-display/1.0.0` bleibt `executionPriceEligible=false`;
- Buffett-Ergebnis ist keine Kauf-/Verkaufsentscheidung und kein `CanonicalScoreResult`.

### Aktueller PR-#458-Korrelationsbefund

Der Branch filtert die Buffett-Suche bereits korrekt auf Aktien und lädt danach `verified-display`. Die serverseitige ADR-0034-Autorisierung wird in `BuffetValueCheck.tsx` jedoch noch **nicht** vorgeschaltet; `server/entitlements.ts` validiert aktuell Catalog-Presence, aber noch nicht `asset.type === 'stock'`. Beide Punkte sind P0-Gaps vor Merge-Readiness.

---

## 5. Code-vs-Docs-Synthese — 2026-08-20

| Schicht | Code-Pfad | Reife / Befund |
|---|---|---|
| Asset Catalog | `src/lib/assetSearchCatalog.ts`, Registry Routes | metadata-only / ADR-0032-konform |
| Market Data | `src/platform/MarketData/` + `server/marketData/` | SC-4/SC-5 Foundation + canonical provider controls |
| Runtime Guard | `marketDataRuntimeFacade.ts`, compatibility facade | 60-s Cache; PR #458 ergänzt mindestens 90-s Background Provider-I/O |
| Evidence / Consensus | domain evidence + DQ services | stark ausgebaut; fail-closed |
| Verified Display | `src/services/verifiedAssetDisplay.ts` | PR #458: per-symbol read-only Presentation Projection |
| Buffett | `src/components/BuffetValueCheck.tsx` | PR #458: stock-only + verified fundamentals; **Entitlement-Vorschaltung offen** |
| Buffett Entitlement | `server/entitlements.ts` | Contract vorhanden; stock-only server validation offen |
| Research Evidence | `src/platform/ResearchEvidence/`, `server/researchEvidence/` | Gemini default-off, keine Score-Wirkung |
| UAI / Registry | `src/platform/Scoring/` | **C3 LANDED** |
| Dispatcher | `ScoringDispatcher.ts` | **ein produktiver Multi-Asset Execution Exit** |
| Scoring Integrity | `CanonicalScoreResult.integrity` | UAI + Dispatcher + Registry + Model + Executor + Feature lineage |
| Ranking | `ranking.service` + `src/platform/Ranking/` | A–C LANDED; D shadow/konsolidiert |
| DQ / Confidence | `CompositeDataQuality` | Foundation; impact off |
| Telemetry | `src/platform/Telemetry/contracts.ts` | operative Wertschöpfungsstufen vorhanden; fachliche Substufen werden hierauf gemappt |

---

## 6. Korrelationsentscheidungen / Dokument-Disposition

| Dokument / Contract | Korrelation | Konsolidierte Behandlung |
|---|---|---|
| ADR-0032 | zentraler Scope-Overlap mit Verified Display | bleibt Parent; neue Revalidation-Evidence statt neuer ADR |
| ADR-0033 | liefert bestehende Commodity/Sovereign/Index Evidence | unverändert wiederverwenden |
| ADR-0041 / ESS-0016 | Provider-/Resilience-Regeln | unverändert Parent; 90-s Cadence ist Runtime-Implementierung darunter |
| ADR-0075 / ADR-0083 | Cache/Runtime-/Composition-Verantwortung | Runtime-Änderung dort einordnen; kein zweiter Runtime-Contract |
| ADR-0087 / SC-2 | Scoring | unverändert; Display/Buffett dürfen keinen `CanonicalScoreResult` simulieren |
| ADR-0034 | Buffett Entitlement | in Sub-Chain nach vorne ziehen; derzeitige Consumer-Lücke schließen |
| ADR-0056 / Telemetry Contract | operative Value-Chain-Namen | als Messprojektion beibehalten; keine zweite fachliche Kette |
| ADR-0007 | Compliance Value Chain | cross-cutting Controls/Evidence, nicht als zweiter Market-Data-Datenpfad |
| Documentary Event Value Chain | Repository-/Change-Lifecycle | cross-cutting Change-Governance; nicht Runtime Request Flow |
| `DATENQUALITAETSSCHICHT.md` | historische live/fallback-/Provenance-Aussagen | Projection auf ADR-0032 + diese SPT-Kette |
| `BACKEND_ARCH.md` | Runtime-/Fallback-Darstellung | Projection auf ADR-0032/0041/0083 + diese SPT-Kette |
| API / Frontend Inventories | Consumer-/Provider-Sicht | Projection, keine Authority |
| ADR-0097 | weitgehende Authority-Duplikation | vor Merge aus aktivem ADR-/Authority-Namespace entfernen; Inhalte in Revalidation/SPT erhalten |

---

## 7. Verbleibende Lücken

### P0 vor Merge von PR #458

1. Buffett-Consumer muss `/api/entitlements/warren-buffett/authorize` vor `verified-display` aufrufen.
2. Buffett-Entitlement-Endpunkt muss Nicht-Aktien fail-closed ablehnen, bevor Quota konsumiert wird.
3. ADR-0097 als zweite Authority retiren; Verweise auf ADR-0032-Revalidation / SC-MD-SPT-0001 umstellen.
4. Dokumentprojektionen (`DATENQUALITAETSSCHICHT`, Backend, API, Frontend, Phase 3.4.6) auf dieselben Parent-Authorities ausrichten.
5. TypeScript/Unit-/Contract-/Governance-Checks nach Dokumentkonsolidierung ausführen.

### Bestehender SPT-Backlog

1. SC-7 Phase D/E: Shadow-Validierung, reale Peer-/Growth-/Comparability-Evidence, Observability; `rankingImpact=false` bleibt Owner-gated.
2. Cross-segment comparability: selbst gleiche Modell-ID/-Version reicht nicht; `traditional-scoring@2.1.0` nutzt andere Stock- als Forex/Index-Gewichte.
3. Cross-model comparability: historische Score-Präsentation ist Crypto 0..10, andere Finanzklassen 0..100; globale Ordnung benötigt validierte Normalisierung.
4. Multi-provider Crypto quorum + `executionPriceEligible` offen.
5. Gemini Shadow interner Consumer/Coverage/Latenz/Quota offen; Shadow bleibt deaktiviert.
6. Evidence-Promotion und Alpaca primary bleiben Owner-gated.
7. SC-8 vollständige Drift-/Golden-/Walk-Forward-Governance offen.
8. Unerreichbarer Legacy-Code ist Source-Hygiene, keine zweite produktive Scoring-Authority.

---

## 8. Ausführungs-Backlog

| ID | Titel | Priorität | Status | DoD kurz |
|---|---|---|---|---|
| SC-0 | Baseline freeze & inventory | P0 | LANDED | SPT |
| SC-1 | Classification consolidation | P0 | LANDED | canonical schema |
| SC-2 | Model registry & UAI | P1 | **LANDED — C1/C2/C3** | Single Dispatcher / canonical result |
| SC-3 | Unified DQ + Confidence | P0 | FOUNDATION LANDED | impact off |
| SC-4 | Gateway hardening | P1 | Phase A LANDED | matrix/health |
| SC-5 | Live coverage | P1 | Phase A–D code | execution quorum open |
| SC-5D | Verified Display / Consumer Revalidation | P0 | **IN PR #458** | ADR-0032 revalidated; entitlement-first Buffett; no duplicate authority |
| SC-6 | Scoring integrity & lineage | P1 | **CORE LANDED WITH C3** | execution lineage |
| SC-7 | Ranking generalization | P1 | **A–C LANDED · D SHADOW/CONSOLIDATED** | intended-use cohorts; impact off |
| SC-8 | Walk-Forward / backtests | P2 | FOUNDATION/PARTIAL | drift/golden/full governance open |

**Kritischer Pfad für PR #458:** Authority-Konsolidierung → Buffett Entitlement Gate → dokumentierte Parent-Verweise → lokale/PR-Checks → finaler Main-Sync → Merge-Review.

---

## 9. Authority & Mutationsregeln

1. Runtime-/Code-/Produktions-Evidence
2. explizite Human/Owner-Freigabe + Accepted ADR
3. spezifische ESS/Governance Policies
4. dieses SPT
5. Consolidation Master Index
6. Archive

Scoring-Gewichte, Eligibility-Schwellen, Provider-Routing, Live-Gates sowie `scoreImpact/rankingImpact` bleiben Owner-gated. Display-/UI-Code darf diese Grenzen nicht indirekt verändern.

Externe Plattformmutation ist **nicht** Bestandteil der Dokumentkonsolidierung. Render/Supabase/Stripe bleiben unverändert.

---

## 10. Main- und PR-Korrelation

- Aktueller bestätigter Main für diese Konsolidierung: `f1dff495fe792a4d4a26a3513f0525b4974bd349`.
- PR #458 arbeitet auf `fix/verified-asset-values-buffett-hydration` und war unmittelbar vor dieser Konsolidierung `0` Commits hinter `main`.
- Offener PR #457 verändert Quality-Center-/Validator-/Build-Orchestrierungsdateien; kein direkter Dateiüberschnitt mit dem bisherigen PR-#458-Scope wurde festgestellt.
- Die Konsolidierung löst **keine** GitHub-CI, Render-, Supabase- oder Stripe-Mutation aus.
- Vor Merge-Readiness ist erneut der aktuelle `main` zu laden und semantisch zu korrelieren.

---

## 11. Enterprise-/State-of-the-Art-Abgleich

Die Struktur folgt dem Repository-Prinzip „eine Authority, mehrere nachvollziehbare Views“ und entspricht dem Grundgedanken von ISO/IEC/IEEE 42010, Architekturbeziehungen und Stakeholder-Concerns konsistent in einer Architecture Description zu halten. Für Datenherkunft wird die bestehende CAPITAL-AI-Provenance-Struktur beibehalten; Provider, Evidence, Aktivitäten und Ableitung bleiben nachvollziehbar im Sinne etablierter Provenance-Modelle. Value-Stream-Mapping wird als Beziehung von Wertstufen zu Capabilities/Information/Controls verwendet, nicht als Anlass für eine zweite technische Pipeline.

Keine neue Open-Source-Runtime ist für diese Konsolidierung erforderlich. Bestehende Repository-Contracts sind funktional und architektonisch geeigneter als die Einführung eines zusätzlichen Frameworks.

---

## 12. Related

- `docs/adr/resolved/ADR-0032-asset-catalog-market-evidence-separation.md`
- `docs/adr/evidence/ADR-0032-REVALIDATION-2026-08-08-R001.md`
- `docs/adr/ADR-0025-verified-traditional-quotes-and-screening-eligibility.md`
- `docs/adr/resolved/ADR-0033-index-provider-mapping-commodity-sovereign-evidence-scoring.md`
- `docs/adr/ADR-0034-central-subscription-entitlements-and-buffett-access.md`
- `docs/adr/ADR-0041-enterprise-market-data-provider-and-mcp-architecture.md`
- `.ai/skills/ESS-0016-Enterprise-Market-Data-Provider-MCP-Governance.md`
- `docs/adr/ADR-0075-phase-3-4-7-runtime-facade.md`
- `docs/adr/ADR-0083-server-runtime-architecture-consolidation.md`
- `docs/adr/ADR-0087-single-scoring-architecture-uai-model-registry.md`
- `docs/adr/ADR-0056-observability-telemetry-baseline.md`
- `docs/adr/ADR-0007-compliance-value-chain.md`
- `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md`
- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- `docs/roadmaps/work-packages/SC-7_RANKING_COMPOSITE_OPT_IN.md`
- `docs/evidence/sc-md/SC2_GLOBAL_MULTI_ASSET_EXIT_2026-08-19.md`
- `src/platform/Telemetry/contracts.ts`
- `src/platform/Scoring/`
- `src/platform/Ranking/`

---

*Stand 2026-08-20: Die fachliche Market-Data-/Screening-/Scoring-Wertschöpfungskette ist als einheitlicher SPT konsolidiert. Verified Display und Buffett sind als Presentation-/Analysis-Lane eingeordnet; sie erzeugen keine zweite Scoring- oder Market-Data-Authority. PR #458 bleibt Draft, bis die identifizierten P0-Korrelations-Gaps geschlossen und die technische Validierung durchgeführt sind.*
