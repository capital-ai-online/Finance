# SC-2 — Model Registry & Universal Asset Interface

**SPT:** `SC-MD-SPT-0001`  
**Version:** 1.0.1  
**Status:** IN IMPLEMENTATION — A1/A2 consolidation + Research Evidence Shadow + Free-Tier-only hardening + Main-Sync  
**Integration Branch:** `agent/sc2-stack-main-sync`  
**Baseline:** `main@275fdf4c06a91dea91e7aaea18bcfb3801a120c0`  
**Historical Parent:** `agent/gemini-research-evidence-adapter` (enthält gemergten PR #416)  
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
- [ ] erster produktiver Consumer: `/api/crypto/score`

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
- [ ] Main-Sync-PR-CI für `agent/sc2-stack-main-sync`
- [ ] Shadow-Consumer gezielt verdrahten und Coverage/Latenz/Quota messen
- [ ] reale Source-Policy + Lizenzfreigaben je Domain/Field
- [ ] field-spezifische Promotion zu `ScoringEvidenceRef` — separat Owner-gated

Evidence:
- `docs/evidence/sc-md/SC2_GEMINI_SHADOW_TRANSPORT_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_FREE_TIER_ONLY_2026-08-19.md`

Runbook: `docs/runbooks/GEMINI_RESEARCH_SHADOW.md`.

### Phase B — Consumer Migration

- [ ] `/api/crypto/list`, `/score`, `/top10` über Registry-Resolution
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

Die Registry übernimmt zentrale Versionierung, kontrollierte Deployment-Aliase, nachvollziehbare Modellmetadaten und fail-closed Promotion. UAI/Evidence-Trennung verhindert, dass Asset-Katalogdaten oder AI-Outputs stillschweigend zu Finanz-Evidence werden. Der Gemini-Shadow-Transport bleibt vor dem Evidence Gate, ist explizit rate-/circuit-/quota-begrenzt und liefert nur zitierte Research Candidates. ADR-0090 ergänzt eine Kosten-Trust-Boundary: der kanonische Runtime-Entry-Point ist Free-Tier-only, Paid Mode ist verboten und Billing-Freiheit wird zusätzlich operator-attestiert. Produktive Score-Wirkung erfordert weiterhin einen separat versionierten und reviewbaren Evidence-/Feature-Contract. Outcome-/Walk-Forward-Validierung bleibt SC-8.

## Main-Korrelation 2026-08-19

Der alte Stack basierte auf `345b2bd3`. `main` rückte zunächst auf `f8a1630a` (Governance Authority / Regulatory Hardening) und danach auf `275fdf4c` (M10 Phase 4 Assertion Verification) vor. PR #416 ist in `agent/gemini-research-evidence-adapter` gemerged. Für die Main-Integration wurde `agent/sc2-stack-main-sync` frisch von `main@275fdf4c` erstellt und nur der SC-2-Fachdelta übernommen.

Korrelationsentscheidungen:

- `ADR-0086` bleibt Governance Authority; SC-2 verwendet `ADR-0087`–`ADR-0090`.
- `AGENTS.md`, `docs/governance/GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md`, `server/ai.ts`, `server/aiGovernanceSupabaseSink.ts` und M10 Phase 4 bleiben unverändert aus `main` erhalten.
- Die beiden im alten Stack abweichenden Systemadmin-Testdateien werden nicht reappliziert; `main` bleibt autoritativ.
- Der Document Registry wird additiv zusammengeführt statt durch die alte Stack-Version ersetzt.
- M10 Phase 4 hat keinen Pfad- oder Runtime-Konflikt mit `src/platform/Scoring`, `src/platform/ResearchEvidence` oder `server/researchEvidence`.

## Definition of Done SC-2

SC-2 ist erst `LANDED`, wenn alle produktiven Score-Einstiegspunkte über UAI + Registry laufen und kein paralleler Model-Selection-Pfad mehr einen extern sichtbaren Score erzeugen kann. Research-/AI-Provider dürfen nur über die kanonische Research/Evidence-Grenze einspeisen. Vor PR-Abschluss wird jeder ausführende Branch erneut gegen den aktuellen `main` verglichen und bei Korrelationen angepasst.
