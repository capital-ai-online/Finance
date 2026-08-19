# SC-2 — Model Registry & Universal Asset Interface

**SPT:** `SC-MD-SPT-0001`  
**Version:** 1.0.4  
**Status:** IN IMPLEMENTATION — Phase C1 canonical Standard-Crypto dispatcher exit  
**Execution Branch:** `agent/sc2-canonical-scoring-dispatcher`  
**Baseline:** `main@24b70a794a7ce7dad62197f42a8948b347dbfbc3`  
**Historical Integration:** PR #418 stack; PR #421 `/score`; PR #424 `/list` + `/top10`; all Human-merged after required main revalidation  
**Start:** 2026-08-19  
**ADRs:** ADR-0087, ADR-0088, ADR-0089, ADR-0090

## Ziel

SC-2 konsolidiert die historisch gewachsenen Scoring-Pfade in **eine** kanonische Architektur. Dieses Work Package ist dem Screening/Scoring/Market-Data-SPT untergeordnet und erzeugt keine zweite Roadmap. Research-/AI-Fähigkeiten dürfen nur als Acquisition-/Evidence-Adapter in diese Architektur eintreten.

## Architektur-Invariante

```text
UAI Identity
   -> Evidence Acquisition / MarketDataGateway / ResearchEvidenceAdapter
          -> GeminiResearchTransport (optional shadow, server-only, default-off, free-tier-only)
          -> AI_DISCOVERED_EVIDENCE (niemals direkt scoreEligible)
          -> Source Validation
          -> zukünftige field-spezifische Evidence Promotion
   -> Evidence + Data Quality Gate
   -> Feature Contract
   -> ScoringModelRegistry (canonical champion only)
   -> ScoringDispatcher
   -> Domain Executor Adapter
   -> CanonicalScoreResult
   -> Ranking / Eligibility
   -> EventMesh / Traceability / Supervisor
```

Kein öffentlicher Score-Pfad darf langfristig Modellwahl, Evidence-Bypass oder Result-Semantik außerhalb dieser Kette besitzen. AI-/Research-Provider dürfen keine zweite Scoring- oder Provenance-Architektur erzeugen.

## A1 — Architecture Freeze & Parallel-Path Inventory

| Pfad | Rolle nach aktuellem Stand | Ziel |
|---|---|---|
| `/api/crypto/score` | UAI + Registry auf main | Phase C: Dispatcher-Consumer |
| `/api/crypto/list`, `/top10` | UAI + Registry auf main via PR #424 | Phase C: Dispatcher-Consumer |
| `/api/crypto/analyze` | Agenten-Research; vor C1 noch Parallelscore möglich | **C1: Research/Enrichment-only, scoreEligible=false** |
| `DeFiOrchestration` | vor C1 browser-lokaler DeFi-Score | **C1: kanonischen `/api/crypto/score` konsumieren** |
| `server.application.ts` Standard-Crypto | Legacy Market-Data-/Compatibility-Scoring | **C2: hinter Dispatcher / retire** |
| `scoring.service.ts` Base/DeFi | Legacy Aggregator | nur noch Legacy/Simulation bis Retire; kein produktiver C1-Consumer |
| `cryptoScoringService.ts` | deterministische verified Domain Engine | bleibt Executor hinter Dispatcher |
| Meme direct score | separater Contract | Migration/Canonical adapter; bis dahin legacy |
| Raw Materials Orchestrator | AI + eigener Scoringpfad | Research von verifizierter Commodity-Evidence trennen |
| TraditionalAssetScoring | verified inputs, eigener Result-Contract | CanonicalResultAdapter |
| Commodity/Sovereign in `registryRoutes` | evidence-aware, route-lokale Executorlogik | Executor extrahieren + CanonicalResultAdapter |
| Individual Bond | Evidence nicht ausreichend | blocked / SCORE_NOT_COMPUTABLE |

Vollständige Baseline: `docs/evidence/sc-md/SC2_A1_A2_BASELINE_2026-08-19.md`.

## A2 — UAI + ScoringModelRegistry

### Phase A — Foundation

- [x] UAI Identity Contract `uai/1.0.0`
- [x] Adapter für `RegistryAsset` und `AssetCatalogCandidate`
- [x] immutable, Git-versionierte `ScoringModelRegistry`
- [x] Champion/Challenger/Legacy/Blocked Lifecycle-Metadaten
- [x] fail-closed Resolver bei fehlendem oder mehrdeutigem Champion
- [x] vorhandene verifizierte Model-Familien initial registriert
- [x] Unit-Tests für Identity, Routing, Bond-Gate und Ambiguität
- [x] `/api/crypto/score` erster produktiver Registry-Consumer — PR #421 gemerged

### Phase A.5 — Research-/Extraction-/Evidence-Discovery Re-Entry Boundary

- [x] providerneutraler `ResearchEvidenceAdapter`-Contract
- [x] UAI-gebundener `ResearchEvidenceCandidate` mit `AI_DISCOVERED_EVIDENCE`
- [x] harte Invariante `scoreEligible=false` für Discovery + Source Validation
- [x] Source-Policy-Klassen und öffentliche HTTPS-/SSRF-nahe URL-Grenzen
- [x] `GeminiResearchEvidenceAdapter` + `GeminiResearchTransport` Interface
- [x] Search/URL-Context/Structured-Output Mapping
- [x] provider-owned Citation-/Source-Bindung verpflichtend
- [x] Function Calling deaktiviert
- [x] Regressionstests implementiert

Evidence: `docs/evidence/sc-md/SC2_GEMINI_RESEARCH_EVIDENCE_ADAPTER_2026-08-19.md`.

### Phase A.6 — Server-only Gemini Research Shadow Runtime

- [x] REST `GeminiResearchTransport` gegen Interactions API
- [x] server-only; keine öffentliche Route / kein Startup-Traffic
- [x] Feature Flag `GEMINI_RESEARCH_SHADOW_ENABLED=false`
- [x] `GEMINI_API_KEY` über kanonische `finance-secrets.env`-Manifestliste
- [x] Rate-/Request-/Token-Budgets + CircuitBreaker + Provider Health
- [x] prompt-/secret-freie Audit-Telemetrie
- [x] `store=false` / `background=false`
- [x] provider-owned `url_citation`-Span-Bindung; kein Model-Source-JSON
- [x] `createGeminiResearchFreeTierRuntime()` mit `paidBillingPermitted=false`
- [x] `gemini-2.5-flash` gepinnt; lokale Kosten auf 0
- [x] `GEMINI_RESEARCH_FREE_TIER_ONLY=true`
- [x] Operator-Attestation für billing-freies Projekt
- [x] Render: `FREE_TIER_ATTESTED=true`, `FREE_TIER_ONLY=true`, Shadow Kill-Switch weiter `false`
- [x] Main-Sync PR #418 Human-gemerged nach vollständiger Revalidation
- [ ] Shadow-Consumer gezielt verdrahten und Coverage/Latenz/Quota messen
- [ ] reale Source-Policy + Lizenzfreigaben je Domain/Field
- [ ] field-spezifische Promotion zu `ScoringEvidenceRef` — separat Owner-gated

Evidence:
- `docs/evidence/sc-md/SC2_GEMINI_SHADOW_TRANSPORT_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_FREE_TIER_ONLY_2026-08-19.md`

Runbook: `docs/runbooks/GEMINI_RESEARCH_SHADOW.md`.

## Phase B — Consumer Migration

- [x] `/api/crypto/score` über UAI + Registry — PR #421
- [x] `/api/crypto/list` + `/api/crypto/top10` über dieselbe Registry-Resolution — PR #424 Human-gemerged
- [ ] Traditional stock/forex/index mit CanonicalResultAdapter
- [ ] Commodity/Sovereign Executor aus `registryRoutes` extrahieren
- [ ] Registry routes über UAI + Registry-Resolution
- [ ] Meme/Raw-Materials direkte Modellwahl hinter kanonische Adapter setzen oder retire
- [x] `/api/crypto/analyze` auf Research-/Enrichment-Semantik begrenzen — **C1 Implementation auf aktuellem Branch; PR/CI pending**

## Phase C — Single Dispatcher Exit

### C1 — Standard-Crypto Router/UI Dispatcher Exit

- [x] `ScoringDispatcher` als kanonische Model-Execution-Grenze implementiert
- [x] UAI + Registry + Executor-/Evidence-/Result-Contract-Check in Dispatcher zusammengeführt
- [x] `/api/crypto/score` ruft nur noch `dispatchCanonicalScore()`
- [x] `/api/crypto/list` ruft nur noch `dispatchCanonicalScore()`
- [x] `/api/crypto/top10` ruft nur noch `dispatchCanonicalScore()`
- [x] direkte verified-Scorer-Imports aus `cryptoRoutes.ts` entfernt
- [x] frühere route-facing `CryptoScoreExecutionPolicy` retired
- [x] `/api/crypto/analyze` erzeugt keinen Score, Rank, Eligibility oder Value Corridor mehr
- [x] `/api/crypto/analyze` kennzeichnet Agentenoutput `scoreEligible=false`
- [x] caller scoring overrides auf `/api/crypto/analyze` fail-closed abgewiesen
- [x] `DeFiOrchestration` berechnet keinen Browser-Score mehr; konsumiert `/api/crypto/score`
- [x] Agenten-Reanalyse kann den kanonischen UI-Score nicht überschreiben
- [x] strukturelle Dispatcher-/Research-Boundary-Tests hinzugefügt
- [ ] PR-CI/Governance auf exaktem C1-Head
- [ ] Human Merge + finaler Main-Abgleich

Evidence: `docs/evidence/sc-md/SC2_CANONICAL_SCORING_DISPATCHER_2026-08-19.md`.

### C2 — Composition Root / Legacy Standard-Crypto Exit

- [ ] `server.application.ts::calculateAssetScore()` Standard-Crypto hinter `ScoringDispatcher`
- [ ] Standard-Crypto Heuristik-Fallback im Market-Data-Aggregator entfernen
- [ ] Legacy `/api/crypto-scoring/:symbol` Standard-Crypto hinter Dispatcher oder retire
- [ ] `/api/charts-scoring` für Crypto kanonisch anbinden oder als nicht-produktive Simulation klar separieren/retire
- [ ] Score-Snapshot/Alert-Pipeline nur aus kanonisch autorisierten Standard-Crypto-Scores speisen

### C3 — Global Multi-Asset Exit

- [ ] Traditional/Commodity/Sovereign/Meme/Raw-Materials Adapter in Dispatcher binden
- [ ] keine produktive Route importiert Scoring Engines direkt, außer Dispatcher/Executor-Adapter
- [ ] alle extern sichtbaren produktiven Score-Resultate `CanonicalScoreResult`
- [ ] Legacy model-selection/fallback paths entfernt oder ausdrücklich nicht-produktive Simulation
- [ ] repo-weite Traceability enthält UAI assetId + modelId/version/alias
- [ ] repo-weiter struktureller Test beweist Single-Dispatcher-Invariante

**Global Phase C bleibt `IN IMPLEMENTATION`, bis C2 + C3 erfüllt sind.**

## Nicht-Ziele

- keine Änderung von Scoring-Gewichten;
- keine Änderung von Ranking-/Eligibility-Schwellen;
- kein `scoreImpact`-/`rankingImpact`-Flip;
- kein Market-Data-Provider-Routing-/executionPriceEligible-Flip;
- keine neuen synthetischen/LLM-basierten Finanzmerkmale;
- keine automatische Evidence-Promotion aus AI-Ausgaben;
- keine Gemini-Aufnahme in Anthropic/OpenAI-Agent-Routing;
- **keine kostenpflichtige Gemini-Nutzung**.

## Enterprise-/FinTech-Abgleich — verifiziert 2026-08-19

Die am 17.04.2026 veröffentlichte Federal Reserve/OCC/FDIC Revised Guidance on Model Risk Management (SR 26-2) dient als aktueller Enterprise-Benchmark für den deterministischen Modellbestand. Das relevante Engineering-Muster ist die Verbindung von intended model use, inventory, governance/controls, validation, Dokumentation und laufendem Monitoring. C1 setzt diese Richtung technisch um, indem produktive Standard-Crypto-Consumer ihre Modellexecution nicht mehr selbst auswählen, sondern die Registry-Entscheidung an einer versionierten Dispatcher-Grenze durchsetzen.

NIST AI RMF 1.0 bleibt ergänzender freiwilliger Lifecycle-/Traceability-Benchmark; NIST weist aktuell darauf hin, dass AI RMF 1.0 überarbeitet wird. Eine spätere finale Revision wird nicht vorweggenommen.

## Main-Korrelation 2026-08-19

- PR #424 wurde nach zwischenzeitlichem Merge von PR #425 erneut gegen den aktualisierten Main geprüft; finaler Head `476c3dc8` bestand CI #1829 und Governance #1146.
- Human-Merge PR #424 erzeugte `main@24b70a794a7ce7dad62197f42a8948b347dbfbc3`.
- C1-Branch `agent/sc2-canonical-scoring-dispatcher` wurde frisch von genau diesem Main-Commit erstellt.
- Open PR #426: M10 Evidence-Scope, kein direkter C1-Pfadoverlap.
- Open PR #414: Privacy/DSGVO-Scope, kein direkter C1-Pfadoverlap.
- `ADR-0086` bleibt Governance Authority; SC-2 verwendet ADR-0087–ADR-0090.
- Vor PR-Erstellung und erneut vor Merge-Readiness erfolgt ein Branch-vs-current-main-Abgleich.

## Definition of Done SC-2

SC-2 ist erst `LANDED`, wenn alle produktiven Score-Einstiegspunkte über UAI + Registry + einen kanonischen Dispatcher laufen und kein paralleler Model-Selection-Pfad mehr einen extern sichtbaren produktiven Score erzeugen kann. Research-/AI-Provider dürfen nur über die kanonische Research/Evidence-Grenze einspeisen. Vor PR-Abschluss wird jeder ausführende Branch erneut gegen den aktuellen `main` verglichen und bei Korrelationen angepasst.
