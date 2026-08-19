# SC-2 — Model Registry & Universal Asset Interface

**SPT:** `SC-MD-SPT-0001`  
**Version:** 1.0.6  
**Status:** IN IMPLEMENTATION — Phase C2b physical Standard-Crypto legacy cleanup  
**Execution Branch:** `agent/sc2-physical-legacy-crypto-cleanup`  
**Baseline:** `main@0d84e479ea97c97490dd65bea85fad2ec76ee157`  
**Historical Integration:** PR #418 stack; PR #421 `/score`; PR #424 `/list` + `/top10`; PR #427 C1 dispatcher; PR #428 C2a operational exit; all Human-merged after required main revalidation  
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
| `/api/crypto/score` | C1 Dispatcher auf main | kanonisch |
| `/api/crypto/list`, `/top10` | C1 Dispatcher auf main | kanonisch |
| `/api/crypto/analyze` | Research/Enrichment-only seit C1 | kanonische Research-Grenze |
| `DeFiOrchestration` | konsumiert kanonischen `/api/crypto/score` seit C1 | kanonisch |
| `server.application.ts` Standard-Crypto | C2a produktiv umgangen; C2b physischer Cleanup aktiv | Standard-Crypto-Legacy vollständig entfernen |
| `scoring.service.ts` Base/DeFi | Legacy Aggregator | kein produktiver Standard-Crypto-Consumer; später Retire |
| `cryptoScoringService.ts` | deterministische verified Domain Engine | Executor hinter Dispatcher |
| Meme direct score | separater Contract | C3 Migration/Canonical adapter |
| Raw Materials Orchestrator | AI + eigener Scoringpfad | C3 Research von verifizierter Commodity-Evidence trennen |
| TraditionalAssetScoring | verified inputs, eigener Result-Contract | C3 CanonicalResultAdapter |
| Commodity/Sovereign in `registryRoutes` | evidence-aware, route-lokale Executorlogik | C3 Executor extrahieren + CanonicalResultAdapter |
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
- [x] `/api/crypto/analyze` auf Research-/Enrichment-Semantik begrenzt — PR #427 Human-gemerged

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
- [x] PR #427 CI/Governance PASS
- [x] Human Merge PR #427 -> `main@4c280fb53e74e38d571e4b44b620a7b33681e0be`

Evidence: `docs/evidence/sc-md/SC2_CANONICAL_SCORING_DISPATCHER_2026-08-19.md`.

### C2 — Composition Root / Legacy Standard-Crypto Exit

#### C2a — Operational Exit — LANDED

- [x] Application Market-Data Runtime erkennt Standard-Crypto vor dem Legacy-Enricher
- [x] Standard-Crypto Market-Data-Score ausschließlich über `ScoringDispatcher`
- [x] fehlende verified Evidence -> `score=null`, kein Upstream-/Heuristik-Fallback
- [x] Snapshot-Pipeline erhält nur finite kanonisch autorisierte Standard-Crypto-Scores
- [x] Alert-Pipeline erhält nur finite kanonisch autorisierte Standard-Crypto-Scores
- [x] Legacy `GET /api/crypto-scoring/:symbol` Standard-Crypto wird vor historischem Handler durch Dispatcher abgefangen
- [x] Legacy `POST /api/crypto-scoring/:symbol` Standard-Crypto verbietet caller scoring overrides fail-closed
- [x] `/api/charts-scoring` explizit `simulation-only`, `scoreEligible=false`, `productionScoring=false`
- [x] Meme-Pfade bleiben absichtlich C3 und fallen durch den Compatibility Router
- [x] strukturelle/behavior Regressionstests ergänzt
- [x] PR #428 finaler Head `b34cbf2f` — CI #1849 + Governance #1166/#1167 PASS
- [x] Human Merge PR #428 -> `main@0d84e479ea97c97490dd65bea85fad2ec76ee157`

Evidence: `docs/evidence/sc-md/SC2_COMPOSITION_ROOT_CRYPTO_EXIT_2026-08-19.md`.

#### C2b — Physical Legacy Cleanup — ACTIVE

- [x] Cold-Start-Fallback von `/api/market-data` ebenfalls hinter `enrichStandardCryptoWithCanonicalScore()` geschlossen
- [x] operativ überholten Standard-Crypto-Zweig aus `server.application.ts::calculateAssetScore()` entfernt
- [x] direkte Standard-Crypto Base/DeFi-/Heuristik-Imports und Aufrufe aus `server.application.ts` entfernt
- [x] historischen `/api/charts-scoring` Handler aus `server.application.ts` physisch entfernt; Authority verbleibt im Simulation-only Compatibility Router
- [x] historische `/api/crypto-scoring/:symbol` GET/POST-Bodies auf Meme-only reduziert; Standard-Crypto erreicht sie nur bei Wiring-Regression und wird dann `SCORING_BOUNDARY_VIOLATION` fail-closed abgewiesen
- [x] struktureller C2b-Regressionstest ergänzt
- [ ] Branch unmittelbar vor PR gegen aktuellen `main` + offene PRs revalidieren
- [ ] PR-CI/Governance auf exaktem C2b-Head
- [ ] Human Merge + finaler Main-Abgleich

Evidence: `docs/evidence/sc-md/SC2_PHYSICAL_LEGACY_CRYPTO_CLEANUP_2026-08-19.md`.

### C3 — Global Multi-Asset Exit

- [ ] Traditional/Commodity/Sovereign/Meme/Raw-Materials Adapter in Dispatcher binden
- [ ] keine produktive Route importiert Scoring Engines direkt, außer Dispatcher/Executor-Adapter
- [ ] alle extern sichtbaren produktiven Score-Resultate `CanonicalScoreResult`
- [ ] Legacy model-selection/fallback paths entfernt oder ausdrücklich nicht-produktive Simulation
- [ ] repo-weite Traceability enthält UAI assetId + modelId/version/alias
- [ ] repo-weiter struktureller Test beweist Single-Dispatcher-Invariante

**Global Phase C bleibt `IN IMPLEMENTATION`, bis C2b + C3 erfüllt sind.**

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

Die am 17.04.2026 veröffentlichte Federal Reserve/OCC/FDIC Revised Guidance on Model Risk Management (SR 26-2) dient als aktueller Enterprise-Benchmark für den deterministischen Modellbestand. Das relevante Engineering-Muster ist die Verbindung von intended model use, inventory, governance/controls, validation, Dokumentation und laufendem Monitoring. C1/C2 reduzieren deshalb produktive Modellexecution-Surfaces und binden Standard-Crypto-Ausgänge an eine identifizierbare Registry-/Dispatcher-Autorität. C2b entfernt zusätzlich physische Fallback-Ausführungsflächen, damit deklarierter Model Use und tatsächlich erreichbarer Runtime-Graph übereinstimmen.

NIST AI RMF 1.0 bleibt ergänzender freiwilliger Lifecycle-/Traceability-Benchmark; NIST weist aktuell darauf hin, dass AI RMF 1.0 überarbeitet wird. Eine spätere finale Revision wird nicht vorweggenommen.

## Main-Korrelation 2026-08-19

- PR #427 C1 bestand final CI #1837 + Governance #1155 und wurde Human-gemerged.
- PR #428 C2a bestand final CI #1849 + Governance #1166/#1167 und wurde Human-gemerged.
- Aktueller C2b-Baseline-Commit ist `main@0d84e479ea97c97490dd65bea85fad2ec76ee157`.
- C2b-Branch `agent/sc2-physical-legacy-crypto-cleanup` wurde frisch von genau diesem Main-Commit erstellt.
- Beim C2b-Scan wurde ein Cold-Start-Edge gefunden: `/api/market-data` konnte bei erstem Providerfehler direkt `enrichMarketDataAsset()` aufrufen. Dieser Edge wird vor physischer Löschung mit derselben kanonischen Standard-Crypto-Enrichment-Grenze geschlossen.
- Offene PRs werden unmittelbar vor C2b-PR und erneut vor Merge-Readiness auf Pfad-/Semantik-Korrelation geprüft; insbesondere M10-Cutover-Änderungen können den CI-Autorisierungsprozess beeinflussen.
- `ADR-0086` bleibt Governance Authority; SC-2 verwendet ADR-0087–ADR-0090.

## Definition of Done SC-2

SC-2 ist erst `LANDED`, wenn alle produktiven Score-Einstiegspunkte über UAI + Registry + einen kanonischen Dispatcher laufen und kein paralleler Model-Selection-Pfad mehr einen extern sichtbaren produktiven Score erzeugen kann. Research-/AI-Provider dürfen nur über die kanonische Research/Evidence-Grenze einspeisen. Vor PR-Abschluss wird jeder ausführende Branch erneut gegen den aktuellen `main` verglichen und bei Korrelationen angepasst.
