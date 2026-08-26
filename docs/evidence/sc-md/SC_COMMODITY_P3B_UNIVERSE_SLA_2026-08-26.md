# SC-2 Commodity P3-B — Universe Coverage / SLA Foundation

**Datum:** 2026-08-26  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md` → P3-B  
**Authority:** ADR-0087 / ADR-0101  
**Vorgänger:** PR #549 / `SC_COMMODITY_P3A_RUNTIME_ACTIVATION_2026-08-26.md`  
**Branch:** `feat/commodity-p3b-universe-sla-2026-08-26`  
**Base:** `main@825788cac6250d2913f9a67eeb3d316ca5dc390f`

## 1. Produktions- und P3-A-Status

PR #549 wurde human-gemergt. Der aktuelle Main-Commit ist:

`825788cac6250d2913f9a67eeb3d316ca5dc390f`

Render Deploy:

- Deploy ID: `dep-da7lk38u01pc73dq99a0`
- Commit: `825788cac6250d2913f9a67eeb3d316ca5dc390f`
- Status: `live`
- `finishedAt`: `2026-08-26T21:27:40.719061Z` (`2026-08-26 23:27:40 CEST`)

Damit sind Merge, Deployment und Commit-Korrelation erfüllt.

Die P3-A Runtime-Activation-Evidence verlangt jedoch zusätzlich mindestens eine reale, nach diesem Deploy ausgeführte `GET /api/raw-materials/verified-score/:symbol`-Anfrage, die eine Shadow Observation erzeugen kann.

Render Request Logs wurden für den Zeitraum unmittelbar nach dem Live-Deploy bis `2026-08-26T21:41:00Z` auf `/api/raw-materials/verified-score/*` geprüft. Ergebnis: keine passende reale Anfrage im geprüften Fenster.

**Status P3-A:** `OBSERVATION_START_PENDING_TRAFFIC`.

Der Render-Deploy-Zeitpunkt wird daher noch nicht als `observationPeriodStartedAt` festgeschrieben. Es wird kein synthetischer Traffic allein zur Erzeugung von Samples erzeugt.

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

## 8. Nächste Arbeitspakete

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

- auf die erste reale Verified-Score-Anfrage nach `main@825788ca...` warten;
- anschließend Observation-Writing über Runtime-Evidence verifizieren;
- erst dann `observationPeriodStartedAt` festlegen;
- Mindestperiode 14 Kalendertage ab tatsächlichem Start.

## 9. Open-Source-/Plugin-Bewertung

Für P3-B1 ist keine zusätzliche Library gerechtfertigt.

- OpenTelemetry bleibt für spätere persistente/exportierte SLO-Telemetrie geeignet, ist aber für die reine Universe-/Mapping-Assessment-Schicht unnötiger Integrationsumfang.
- GitHub und Render decken Repository-/Deploy-/Log-Korrelation ab.
- Keine zusätzliche Provider-, MLOps- oder SLA-Plattform wird eingeführt.

## 10. Status

- P3-A Runtime Activation: `DEPLOYED`
- P3-A Observation Period: `START_PENDING_REAL_TRAFFIC`
- P3-B1 Universe/SLA Foundation: `IMPLEMENTED_ON_BRANCH`
- P3-B2 Runtime Mapping Evidence: `OPEN`
- P3-B3 External Plan/Quota Verification: `OPEN`
- P3-B4 Controlled 24-Asset History Run: `BLOCKED_BY_P3-B3`
- P3-B5 SLA Evidence Review: `OPEN`
- P3-C Promotion: `BLOCKED`
