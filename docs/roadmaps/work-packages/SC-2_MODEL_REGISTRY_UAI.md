# SC-2 — Model Registry & Universal Asset Interface

**SPT:** `SC-MD-SPT-0001`  
**Version:** 1.0.2  
**Status:** IN IMPLEMENTATION — Phase A first productive registry consumer  
**Execution Branch:** `agent/sc2-crypto-score-registry-consumer`  
**Baseline:** `main@ca968b2563975df64245cb88ee45a7c04019a3a1`  
**Historical Integration:** PR #418 merged after post-#419 revalidation  
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
   -> Domain Executor Adapter
   -> CanonicalScoreResult
   -> Ranking / Eligibility
   -> EventMesh / Traceability / Supervisor
```

Kein öffentlicher Score-Pfad darf langfristig Modellwahl, Evidence-Bypass oder Result-Semantik außerhalb dieser Kette besitzen. AI-/Research-Provider dürfen keine zweite Scoring- oder Provenance-Architektur erzeugen.

## A1 — Architecture Freeze & Parallel-Path Inventory

### Scope

- öffentliche und interne Score-Einstiegspunkte inventarisieren;
- Modellwahl, Evidence-Policy und Result-Contract je Pfad erfassen;
- Parallelpfade als `canonical`, `migration-required`, `research-only` oder `blocked` klassifizieren;
- keine neue Scoring-Engine außerhalb von `src/platform/Scoring`-Contracts und bestehenden Domain-Executoren zulassen.

### Initiale Befunde

| Pfad | heutige Rolle | Ziel |
|---|---|---|
| `/api/crypto/score` | verified, fail-closed, CanonicalScoreResult | erster Registry-Consumer |
| `/api/crypto/list`, `/top10` | verified crypto + ranking | auf denselben Registry/Dispatcher ziehen |
| `/api/crypto/analyze` | Agent + Market-Mix; kann Parallelscore erzeugen | Research/Enrichment; kein alternativer Canonical Score |
| `scoring.service.ts` Base/DeFi | Legacy Aggregator | Domain-Executor nur hinter Evidence/Registry oder retire |
| `cryptoScoringService.ts` | deterministische Engine im verified path | bleibt Executor, nicht Architektur |
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
- [x] erster produktiver Consumer: `/api/crypto/score` — auf `agent/sc2-crypto-score-registry-consumer` implementiert, PR/CI pending

#### Phase A first productive consumer — `/api/crypto/score`

- [x] Request-Symbol wird vor Modellexecution als UAI `crypto:<SYMBOL>` normalisiert
- [x] `ScoringModelRegistry` wählt ausschließlich den kanonischen Champion
- [x] Executor-Bindung fail-closed auf `verifiedCryptoTechnicalScoring.evaluateVerifiedCryptoTechnicalScore`
- [x] `verified-required` Evidence Policy und kanonischer Result-Contract werden vor Ausführung geprüft
- [x] keine Legacy-/Challenger-Fallbacks
- [x] bestehendes `model: technical-provenance` bleibt API-kompatibel
- [x] additive `modelRegistry`-Metadaten im Score-Result
- [x] Scoring-Lineage enthält UAI assetId + Registry modelId/version/alias/executor/Contracts
- [x] Score-Mathematik, Ranking und Eligibility unverändert
- [ ] PR-CI auf exaktem Branch-Head
- [ ] Human Merge + finaler Main-Abgleich

Evidence: `docs/evidence/sc-md/SC2_CRYPTO_SCORE_REGISTRY_CONSUMER_2026-08-19.md`.

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

Owner-gated Aktivierungsstufe aus ADR-0088/ADR-0089; Zero-Cost-Policy konkretisiert durch ADR-0090.

- [x] REST `GeminiResearchTransport` gegen Interactions API
- [x] server-only; keine öffentliche Route / kein Startup-Traffic
- [x] Feature Flag `GEMINI_RESEARCH_SHADOW_ENABLED=false`
- [x] `GEMINI_API_KEY` über kanonische `finance-secrets.env`-Manifestliste
- [x] lokales RPM via bestehendem `RateLimitBudget`
- [x] tägliches Request-/Token-Shadow-Budget
- [x] bestehender `CircuitBreaker`
- [x] bestehende Supervisor Provider Health
- [x] kanonische, prompt-/secret-freie Audit-Telemetrie
- [x] `store=false` / `background=false`
- [x] provider-owned `url_citation`-Span-Bindung; kein Model-Source-JSON
- [x] Regressionstests implementiert

#### Phase A.6 Free-Tier-only Hardening

- [x] kanonischer `createGeminiResearchFreeTierRuntime()`
- [x] `paidBillingPermitted=false`
- [x] `gemini-2.5-flash` gepinnt (Free-Tier-Vertrag am 2026-08-19 verifiziert)
- [x] Modell-/Paid-Preis-Overrides aus kanonischem Entry-Point entfernt/ignoriert
- [x] lokale Input-/Output-/Search-Unit-Costs auf 0 erzwungen
- [x] `GEMINI_RESEARCH_FREE_TIER_ONLY=true`
- [x] `GEMINI_RESEARCH_FREE_TIER_ATTESTED=false` sicherer Blueprint-Default / zweiter Kill-Switch
- [x] Free-Tier-Key muss aus Projekt ohne Billing-Verknüpfung stammen
- [x] lokales hartes Request-Cap 100/Tag; Blueprint Default 50/Tag
- [x] Canonical server index exponiert keinen Paid-Runtime-Factory
- [x] Free-Tier-Regressionstests implementiert
- [x] Owner bestätigt 2026-08-19: Free-Tier `GEMINI_API_KEY` ohne Billing liegt in `finance-secrets.env`
- [x] Render Service Attestation gesetzt: `GEMINI_RESEARCH_FREE_TIER_ATTESTED=true`; `GEMINI_RESEARCH_FREE_TIER_ONLY=true`
- [x] Render Shadow Kill-Switch bleibt ausdrücklich `GEMINI_RESEARCH_SHADOW_ENABLED=false`
- [x] PR #416 CI #1790: TypeScript, komplette Unit-Suite, Production Build, CSP, Deployment Readiness und Docker PASS
- [x] Main-Sync PR #418: nach Merge von PR #419 erneut gegen `main@51cb1cda` validiert; CI #1799 + Governance #1121 PASS; Human Merge `main@ca968b25`
- [ ] Shadow-Consumer gezielt verdrahten und Coverage/Latenz/Quota messen
- [ ] reale Source-Policy + Lizenzfreigaben je Domain/Field
- [ ] field-spezifische Promotion zu `ScoringEvidenceRef` — separat Owner-gated

Evidence:
- `docs/evidence/sc-md/SC2_GEMINI_SHADOW_TRANSPORT_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_FREE_TIER_ONLY_2026-08-19.md`

Runbook: `docs/runbooks/GEMINI_RESEARCH_SHADOW.md`.

### Phase B — Consumer Migration

- [x] `/api/crypto/score` über UAI + Registry-Resolution; bestehender verified Executor bleibt unverändert
- [ ] `/api/crypto/list` + `/api/crypto/top10` über dieselbe Registry-Resolution
- [ ] Traditional stock/forex/index mit CanonicalResultAdapter
- [ ] Commodity/Sovereign Executor aus `registryRoutes` extrahieren
- [ ] Registry routes über UAI + Registry-Resolution
- [ ] Meme/Raw-Materials direkte Modellwahl hinter kanonische Adapter setzen oder retire
- [ ] `/api/crypto/analyze` auf Research-/Enrichment-Semantik begrenzen; Research Evidence ausschließlich über `ResearchEvidenceAdapter`

### Phase C — Single Dispatcher Exit

- [ ] ein kanonischer Scoring Dispatcher als einziger Modellexecution-Einstieg
- [ ] keine Route importiert produktive Scoring-Engines direkt, außer Dispatcher/Executor-Adapter
- [ ] alle extern sichtbaren Score-Resultate `CanonicalScoreResult`
- [ ] Legacy model-selection/fallback paths entfernt
- [ ] Traceability enthält UAI assetId + modelId/version/alias

## Nicht-Ziele dieses Work Packages

- keine Änderung von Scoring-Gewichten;
- keine Änderung von Ranking-/Eligibility-Schwellen;
- kein `scoreImpact`-/`rankingImpact`-Flip;
- kein Market-Data-Provider-Routing-/executionPriceEligible-Flip;
- keine neuen synthetischen/LLM-basierten Finanzmerkmale;
- keine automatische Evidence-Promotion aus AI-Ausgaben;
- keine Gemini-Aufnahme in das Anthropic/OpenAI-Agent-Routing;
- keine öffentliche Gemini-Research-Route in Phase A.6;
- **keine kostenpflichtige Gemini-Nutzung**.

## Enterprise-/FinTech-Abgleich

Die Registry übernimmt zentrale Versionierung, kontrollierte Deployment-Aliase, nachvollziehbare Modellmetadaten und fail-closed Promotion. Der erste produktive Consumer verschiebt nun auch die tatsächliche Modellwahl aus der Route in diese Registry und schreibt die Auswahl in die Scoring-Lineage. Das folgt dem 2026 aktualisierten Model-Risk-Governance-Muster aus Federal Reserve/OCC/FDIC: Model Use, Model Inventory, Dokumentation und Controls werden als zusammenhängender Lifecycle behandelt. Die regulatorische Guidance ist hier ein Governance-Benchmark; sie wird nicht als Aussage über eine konkrete aufsichtsrechtliche Einstufung von CAPITAL-AI verwendet.

UAI/Evidence-Trennung verhindert weiterhin, dass Asset-Katalogdaten oder AI-Outputs stillschweigend zu Finanz-Evidence werden. Der Gemini-Shadow-Transport bleibt vor dem Evidence Gate, ist explizit rate-/circuit-/quota-begrenzt und liefert nur zitierte Research Candidates. ADR-0090 ergänzt eine Kosten-Trust-Boundary: der kanonische Runtime-Entry-Point ist Free-Tier-only, Paid Mode ist verboten und Billing-Freiheit wird zusätzlich operator-attestiert. Produktive Score-Wirkung erfordert weiterhin einen separat versionierten und reviewbaren Evidence-/Feature-Contract. Outcome-/Walk-Forward-Validierung bleibt SC-8.

## Main-Korrelation 2026-08-19

Der historische SC-2-Stack basierte auf `345b2bd3`. `main` rückte über Governance/Regulatory Hardening, M10 Phase 4 und PR #419 M10 Phase 5 auf `51cb1cdac9cb25d303f306d40c5b27b83ba954de` vor. PR #418 wurde danach auf `ad61a7ec` erneut gegen diesen Stand validiert (CI #1799 und Governance #1121 PASS) und als `ca968b2563975df64245cb88ee45a7c04019a3a1` Human-gemerged.

Der aktuelle Execution-Branch `agent/sc2-crypto-score-registry-consumer` wurde frisch von `main@ca968b25` erstellt. Open PR #414 hat keinen Pfad-Overlap mit diesem Work Package.

Korrelationsentscheidungen:

- `ADR-0086` bleibt Governance Authority; SC-2 verwendet `ADR-0087`–`ADR-0090`.
- M10 Phase 5 (`server/m10/**`, zugehörige Migration/Tests) bleibt unverändert aus `main` erhalten.
- PR #414 verändert keine der in diesem Work Package beanspruchten Scoring-/Research-/Roadmap-Dateien; dessen separate ADR-0086-Nummernkollision bleibt außerhalb SC-2.
- der neue Consumer führt keine zweite Engine oder Dispatcher-Architektur ein; die Route nutzt weiterhin den bestehenden verified Executor, aber nur nach Registry-Autorisierung.

## Definition of Done SC-2

SC-2 ist erst `LANDED`, wenn alle produktiven Score-Einstiegspunkte über UAI + Registry laufen und kein paralleler Model-Selection-Pfad mehr einen extern sichtbaren Score erzeugen kann. Research-/AI-Provider dürfen nur über die kanonische Research/Evidence-Grenze einspeisen. Vor PR-Abschluss wird jeder ausführende Branch erneut gegen den aktuellen `main` verglichen und bei Korrelationen angepasst.
