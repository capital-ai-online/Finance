# SC-2 Commodity P3-B — Universe Coverage / SLA Foundation

**Datum:** 2026-08-26  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md` → P3-B  
**Authority:** ADR-0087 / ADR-0101  
**Vorgänger:** PR #549 / `SC_COMMODITY_P3A_RUNTIME_ACTIVATION_2026-08-26.md`  
**Branch:** `feat/commodity-p3b-universe-sla-2026-08-26`  
**Initial Base:** `main@825788cac6250d2913f9a67eeb3d316ca5dc390f`  
**Synchronisierter Main:** `main@f78d9f2838cfc3b2896cb167978a470aeb484f5e`

## 1. Produktions- und P3-A-Status

PR #549 wurde human-gemergt und hat die P3-A Runtime-Activation produktiv eingeführt. Während P3-B1 liefen danach zusätzlich PR #550 mit der Security-Remediation und PR #551 mit der Dark-Black-/AIF-Gold-Branding-Migration in `main` ein.

Aktueller Main-Commit:

`f78d9f2838cfc3b2896cb167978a470aeb484f5e`

Aktueller Render Deploy:

- Deploy ID: `dep-da7m53btqb8s73djfveg`
- Commit: `f78d9f2838cfc3b2896cb167978a470aeb484f5e`
- Status: `live`
- `finishedAt`: `2026-08-26T22:03:45.889801Z` (`2026-08-27 00:03:45 CEST`)

Der Main-CI-Lauf #2502 (`33017773705`) hat Repository-Integrität, Dependency-Audit, TypeScript, Unit Tests, Production Build, CSP, Deployment-Readiness, Docker-Hardening/Image und Supply-Chain-Provenance erfolgreich durchlaufen. Der Render-Deployment-Pfad liefert denselben Main-Commit live aus. Damit gilt aktuell:

`production == main == f78d9f2838cfc3b2896cb167978a470aeb484f5e`

Die Security-Änderungen aus PR #550 betreffen Server-Security, Auth-/Telemetry-, OrchestratorPanel- und Security-Testpfade. PR #551 betrifft Design Tokens, CSS, Social-Media-Preview/-Templates und Branding-Tests. Beide ändern weder AssetCatalog, ProviderMatrix, Commodity-Taxonomie noch TwelveData-Reference-Mapping. P3-B1 wurde nach beiden Main-Merges explizit synchronisiert.

### P3-A Observation Start Gate

Die P3-A Runtime-Activation-Evidence verlangt zusätzlich mindestens eine reale, nach dem Activation-Deploy ausgeführte `GET /api/raw-materials/verified-score/:symbol`-Anfrage, die eine Shadow Observation erzeugen kann.

Render Request Logs wurden für den Zeitraum

`2026-08-26T21:27:40Z` bis `2026-08-26T22:04:30Z`

auf `/api/raw-materials/verified-score/*` geprüft. Ergebnis: keine passende reale Anfrage im geprüften Fenster.

**Status P3-A:** `OBSERVATION_START_PENDING_TRAFFIC`.

Der Deploy-Zeitpunkt wird daher weiterhin nicht als `observationPeriodStartedAt` festgeschrieben. Es wird kein synthetischer Traffic allein zur Erzeugung von Samples erzeugt. Sobald eine reale Verified-Score-Anfrage auf einer Produktion eingeht, in der die P3-A-Activation enthalten ist, muss das Observation-Writing erneut über Runtime-Evidence verifiziert werden; erst dann beginnt die Mindestbeobachtungsperiode von 14 Kalendertagen.

## 2. P3-B Roadmap-Anforderung

P3-B fordert:

1. mindestens 24 reale Commodity-Kandidaten in zulässigen Segmenten, soweit Provider-Evidence verfügbar ist;
2. messbare Unterkategorie-Coverage ohne synthetische Filler;
3. transparente `SOURCE_UNAVAILABLE`-/`SCORE_NOT_COMPUTABLE`-Gaps;
4. validiertes Provider-Kosten-/Quota-Budget für 24 Assets.

Der Exit bleibt Evidence-basiert. Kataloggröße allein ist kein SLA-PASS.

## 3. Wiederverwendung statt Parallelarchitektur

P3-B1 verwendet ausschließlich bestehende Authorities:

- `getAssetSearchCatalog()` für reale Katalogidentitäten;
- `classifyCommodityResearchInstrumentKind()` für die bestehende vierteilige Commodity-Taxonomie;
- `resolveTwelveDataCommodityReference()` für fail-closed Provider-Identity-Mapping;
- `ProviderMatrix` für das interne TwelveData Rate-Limit;
- keine neue Model Registry, kein Dispatcher, kein Ranking und kein eigener Provider-HTTP-Stack.

## 4. Neuer interner Contract

`commodity-universe-sla/1.0.0`

Der Contract ist Mapping-/SLA-Evidence und besitzt keine Score-Authority:

- `canonical=false`
- `scoreEligible=false`
- `rankingEligible=false`
- `executionEligible=false`
- `exitGateEligible=false` in P3-B1

### Zielverteilung

- Gesamtziel: `24`
- Energy: `6`
- Industrial Metals: `6`
- Precious Metals: `6`
- Agriculture: `6`

Nur reale `AssetCatalogEntry`-Identitäten dürfen gezählt werden. Provider-Mapping muss eindeutig auflösbar sein. Nicht gemappte Identitäten bleiben Gap; sie werden nicht durch synthetische Kandidaten ersetzt.

## 5. Provider-Budget

Repository-Policy für TwelveData:

- ProviderMatrix Capacity: `30` Requests / `60_000 ms`
- geplanter P3-B History-Batch: `24` Symbole

Aktuelle Twelve-Data-Primärquelle dokumentiert `/time_series` mit **1 API Credit pro Symbol**. Damit beträgt der modellierte 24er-Batch:

`24 symbols × 1 credit = 24 API credits`

Das liegt unter dem internen CAPITAL-AI-Ceiling von 30 Requests/Minute.

**Wichtig:** Der tatsächlich gebuchte Twelve-Data-Plan und dessen reales API-Credit-Limit werden nicht aus Repository-Code geraten. Deshalb bleibt:

`externalPlanQuotaStatus = UNVERIFIED`

und:

`historyProbePerformed = false`.

Ein 24er History-Run ist erst zulässig, wenn die externe Plan-/Quota-Grenze belastbar festgestellt und gegen das interne Limit korreliert wurde.

### Twelve-Data-Primärquellen

- Twelve Data API Documentation — `/time_series`, API credits cost: 1 per symbol: `https://twelvedata.com/docs`
- Twelve Data Support — Credits: `https://support.twelvedata.com/en/articles/5615854-credits`
- Twelve Data Pricing: `https://twelvedata.com/pricing`

Stand der Webprüfung: 2026-08-26.

## 6. SLI/SLO-Semantik

P3-B verwendet SLI/SLO statt pauschaler „SLA erfüllt“-Booleans.

Google SRE empfiehlt, SLIs als quantitative Service-Messgrößen und SLOs als explizite Zielwerte/-bereiche zu definieren sowie Ziele nicht blind aus der momentanen Performance abzuleiten.

Primärquellen:

- Google SRE — Service Level Objectives: `https://sre.google/sre-book/service-level-objectives/`
- Google SRE Workbook — Implementing SLOs: `https://sre.google/workbook/implementing-slos/`

Für P3-B werden daraus zunächst folgende SLIs abgeleitet:

- Catalog Candidate Count je Commodity-Domain;
- Provider Mapping Count je Domain;
- Mapping Coverage = mapped / checked;
- Source-Unavailable Count;
- später: History Availability Rate;
- später: Freshness Pass Rate;
- später: P95 Provider Latency;
- später: Circuit-Open Events;
- später: tatsächlicher Credit-/Request-Verbrauch des kontrollierten 24er-Runs.

Ein verbindliches produktives SLO wird erst nach realer Messung und Owner-/Produktentscheidung festgelegt. P3-B1 erfindet keinen Zielwert aus der aktuellen Performance.

## 7. Implementierter P3-B1-Scope

`src/services/commodityUniverseSla.ts`:

- balanciert maximal sechs eindeutig gemappte Kandidaten pro Domain;
- prüft reale Repository-Katalogidentitäten;
- modelliert den 24er Provider-Budgetbedarf;
- führt **keine** Commodity-History-Abfrage aus;
- gibt `MAPPING_READY`, `GAP` oder `SOURCE_UNAVAILABLE` zurück;
- Provider-Exceptions werden nicht im Assessment gespiegelt;
- 15-Minuten-Prozesscache verhindert unnötige Mapping-Neubewertung;
- kein Score-/Ranking-/Execution-Pfad.

`tests/unit/commodityUniverseSla.test.ts` schützt:

1. der reale Repository-Katalog besitzt mindestens 24 Commodity-Identitäten und mindestens sechs Identitäten je Research-Domain;
2. exakt `6 × 4 = 24` gemappte Kandidaten werden bei ausreichender Mapping-Coverage gewählt;
3. ein Domain-Shortfall bleibt `GAP` und erzeugt keinen Filler;
4. Provider-Reference-Ausfall bleibt fail-closed `SOURCE_UNAVAILABLE` ohne Exception-Leak;
5. der 24-Credit-History-Batch bleibt nur modelliert und `historyProbePerformed=false`;
6. der P3-B Exit bleibt in dieser Stufe explizit geschlossen.

## 8. Finaler Main-Sync / Korrelation

Während der P3-B1-Umsetzung traten zwei Main-Races auf. Beide wurden vor Merge-Readiness explizit synchronisiert und semantisch bewertet.

### PR #550 — Security Remediation

- Merge-Main: `e9d9c27a4bebdbc45ab70d923d4f154bcd7740ba`
- Security-/Auth-/Telemetry-/ProbeProtection-/Honeytoken-Änderungen: übernommen, nicht verändert;
- `src/components/OrchestratorPanel.tsx`: übernommen, kein P3-B-Consumer;
- kein P3-B-Claimed-Path-Overlap.

### PR #551 — Branding / Social Engine

- Merge-Main: `f78d9f2838cfc3b2896cb167978a470aeb484f5e`
- Design Tokens, CSS, MediaStudioPreview, Social-Media-Templates und Branding-Tests: übernommen, nicht verändert;
- keine Änderung an AssetCatalog, ProviderMatrix, Commodity Research Taxonomy, TwelveData Mapping oder Scoring Authority;
- kein P3-B-Claimed-Path-Overlap.

Nach beiden Synchronisierungen bleiben unverändert:

- AssetCatalog: Identity-Authority;
- ProviderMatrix: Provider-Policy-Authority;
- Commodity Research Taxonomy: Domain-Authority;
- TwelveData Commodity Mapping: Provider-Identity-Boundary;
- ScoringModelRegistry/ScoringDispatcher: alleinige produktive Scoring-Authority.

Offener Parallel-PR nach dem finalen Sync:

- #552 Frontend Dashboard Consumer — kein File-Level-Overlap mit P3-B1.

## 9. Nächste Arbeitspakete

### P3-B2 — Runtime Mapping Evidence

- P3-B1 nach PR/CI deployen.
- kontrollierten Mapping-Assessment-Consumer bereitstellen; dabei ausschließlich Reference-Mapping prüfen, nicht 24 Histories laden.
- reale Mapping-Coverage für alle vier Domains als Evidence erfassen.
- unklare/ambige TwelveData-Mappings als Gap inventarisieren.

### P3-B3 — External Plan / Quota Verification

- tatsächliches TwelveData Account-/Plan-Credit-Limit über autorisierte Account-/Provider-Metadaten verifizieren;
- keine API-Keys oder Secret-Werte in Evidence aufnehmen;
- effektives Batch-Ceiling = `min(CAPITAL-AI internal rate limit, verified provider plan limit)` dokumentieren.

### P3-B4 — Controlled 24-Asset History Evidence Run

Nur nach P3-B3:

- exakt 24 provider-gemappte reale Kandidaten, 6 je Domain;
- paced/bounded unter effektivem Credit-Limit;
- `SOURCE_UNAVAILABLE`/`SCORE_NOT_COMPUTABLE` nicht ersetzen;
- Availability, Freshness, Latency, Error/Circuit und Credit-Verbrauch erfassen;
- keine Promotion-/Ranking-Wirkung.

### P3-B5 — SLA Evidence Review

- Mapping + History SLIs konsolidieren;
- Gap-Matrix je Domain/Provider erstellen;
- erst danach Owner-visible SLO-/SLA-Zielentscheidung;
- P3-B Exit nur bei real erfüllter Coverage oder transparent dokumentiertem Gap.

### P3-A parallel

- auf die erste reale Verified-Score-Anfrage auf einer Produktion mit enthaltener P3-A Runtime-Activation warten;
- anschließend Observation-Writing über Runtime-Evidence verifizieren;
- erst dann `observationPeriodStartedAt` festlegen;
- Mindestperiode 14 Kalendertage ab tatsächlichem Start.

## 10. Open-Source-/Plugin-Bewertung

Für P3-B1 ist keine zusätzliche Library gerechtfertigt.

- OpenTelemetry bleibt für spätere persistente/exportierte SLO-Telemetrie geeignet, ist aber für die reine Universe-/Mapping-Assessment-Schicht unnötiger Integrationsumfang.
- GitHub und Render decken Repository-/Deploy-/Log-Korrelation ab.
- Keine zusätzliche Provider-, MLOps- oder SLA-Plattform wird eingeführt.

## 11. Status

- Main/Production: `f78d9f2838cfc3b2896cb167978a470aeb484f5e` / `LIVE`
- P3-A Runtime Activation: `DEPLOYED`
- P3-A Observation Period: `START_PENDING_REAL_TRAFFIC`
- P3-B1 Universe/SLA Foundation: `IMPLEMENTED_ON_BRANCH`
- P3-B2 Runtime Mapping Evidence: `OPEN`
- P3-B3 External Plan/Quota Verification: `OPEN`
- P3-B4 Controlled 24-Asset History Run: `BLOCKED_BY_P3-B3`
- P3-B5 SLA Evidence Review: `OPEN`
- P3-C Promotion: `BLOCKED`
