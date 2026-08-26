# SC-2 Commodity P3-A — Runtime Activation Evidence

**Datum:** 2026-08-26  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md` → P3-A  
**Parent Authority:** ADR-0087 / ADR-0101  
**Vorgänger:** PR #547 / `docs/evidence/sc-md/SC_COMMODITY_P3A_SHADOW_OBSERVABILITY_2026-08-26.md`  
**Branch:** `fix/commodity-p3a-runtime-activation-2026-08-26`

## 1. Anlass

PR #547 hat die P3-A Shadow-/Provider-Observability-Foundation gemergt. Der Merge-Commit `c734e0820435bea4774e1311b1e60b2b744b908e` wurde auf Render erfolgreich als `live` ausgerollt.

Der Post-Deploy-Wirksamkeitscheck hat jedoch gezeigt, dass der produktive Verified-Commodity-Score-Pfad weiterhin ausschließlich:

```text
getTwelveDataCommodityEvidence()
  -> dispatchCanonicalScore()
  -> CanonicalScoreResult
```

verwendete. `RawMaterialsOrchestrator.composeSourceBackedResearch()` besaß damit nach PR #547 keinen produktiven Consumer im Verified-Score-Pfad. Die Foundation war deployt, aber reale Verified-Score-Anfragen konnten noch keine Commodity-Challenger-Shadow-Observation erzeugen.

**Folge:** Der Render-Deploy von PR #547 allein wird nicht als belastbarer Start der Challenger-Beobachtungsperiode gewertet.

## 2. Korrektur

Dieser bounded Activation-Slice verbindet den bestehenden Endpoint:

`GET /api/raw-materials/verified-score/:symbol`

mit einer neuen internen Bridge:

`commodity-shadow-runtime-bridge/1.0.0`.

Der Ablauf lautet danach:

```text
Verified Score Request
  -> getTwelveDataCommodityEvidence(symbol, 90)       [einmal]
  -> dispatchCanonicalScore(...)                     [Champion Authority]
  -> observeVerifiedCommodityScoreShadow(...)
       -> dieselbe CommodityMarketEvidence-Instanz
       -> kanonische vorgelagerte Commodity-Taxonomie
       -> optional registrierter Champion-Comparator
       -> RawMaterialsOrchestrator.composeSourceBackedResearch()
       -> CommodityShadowObservability
  -> unveränderter Canonical API Response
```

## 3. Non-Interference / Authority

Die Bridge besitzt keine produktive Scoring-Authority.

Feste Invarianten:

- kein zweiter Provider-Request;
- kein zweiter Dispatcher;
- keine Registry-Mutation;
- keine Ranking-/Eligibility-/Trading-/Execution-Wirkung;
- der öffentliche Verified-Score-Response wird nicht um Shadow-Werte erweitert;
- Shadow-Fehler blockieren oder verändern den Canonical-Score nicht;
- arbitrary Exception-/Providertexte werden nicht als Diagnosecode weitergereicht;
- Provider-Binding stammt aus dem bereits verifizierten `CommodityMarketEvidence.providerId`;
- `market.priceHistory` verwendet dieselbe Evidence-Instanz wie der Champion.

## 4. Taxonomie

Die Bridge implementiert keine eigene Symbol-/Kategorie-Heuristik. Sie ruft den bereits vorhandenen kanonischen Commodity-Research-Helper `classifyCommodityResearchInstrumentKind()` vor der Shadow-Grenze auf.

`CommodityShadowObservability` selbst bleibt unverändert: es inferiert weder Provider noch Feature-Bindings und validiert Challenger/Champion weiterhin read-only gegen die bestehende Registry.

## 5. Champion Comparator

Wenn der bestehende Dispatcher `DISPATCHED` liefert, werden ausschließlich folgende bereits vorliegenden Werte an die Shadow-Runtime gespiegelt:

- `modelId`;
- `modelVersion`;
- Canonical Status;
- Canonical Score oder `null`.

Bei `SCORE_NOT_COMPUTABLE` wird kein Champion-Comparator synthetisiert.

## 6. Beobachtungsperioden-Start

Die reale P3-A Challenger-Beobachtungsperiode startet **nicht** mit PR-Erstellung und auch nicht rückwirkend mit dem Deploy von PR #547.

Sie startet erst, wenn alle folgenden Bedingungen gleichzeitig erfüllt sind:

1. dieser Runtime-Activation-Slice ist human-gemergt;
2. der zugehörige Merge-Commit wird auf dem produktiven Render-Service als `live` verifiziert;
3. `/healthz`/Deployment-Identity korreliert mit diesem Merge-Commit;
4. mindestens eine reale Verified-Commodity-Score-Anfrage kann danach eine P3-A Observation schreiben.

Der Render-`finishedAt`-Zeitpunkt dieses zukünftigen Activation-Deploys ist der technische `observationPeriodStartedAt`.

### Initiale Mindestdauer

Die erste Beobachtungsperiode läuft mindestens **14 Kalendertage** ab `observationPeriodStartedAt` und wird automatisch fachlich als **nicht abgeschlossen** betrachtet, solange Sample-/Coverage-/Integrity-Gates nicht ausreichend belegt sind.

Die Mindestdauer ist kein Promotion-PASS und kein automatischer P3-A-Exit. Sie dient dazu, mindestens mehrere wöchentliche Betriebszyklen beobachten zu können. Unzureichende reale Traffic-/Provider-Samples verlängern die Beobachtungsperiode.

## 7. Erwartete Evidence während der Periode

Zu sammeln und anschließend gegen ADR-0101/P3-A zu bewerten sind mindestens:

- Anzahl Verified-Score-/Shadow-Observations;
- Challenger-Domain-/Instrument-Abdeckung;
- `evaluationStatus` und Statuswechsel;
- Feature Coverage / Required Coverage;
- DQ-Entwicklung;
- Evidence-/Effective-Feature-Fingerprint-Drift;
- optional Champion-Score-Drift;
- TwelveData `commodity-history` Availability/Error/P95/Circuit/Rate-Budget;
- lokale Denials getrennt von echten Provider-Attempts;
- keine ungeklärten P0/P1 Integrity Findings.

Für EIA/USDA/CFTC/USGS gilt weiterhin: P3-A erzeugt keine API-Aufrufe ausschließlich zur Sample-Erzeugung. Deren Resilience-Evidence kann nur aus fachlich begründeten realen Research-/Evidence-Consumer-Pfaden stammen.

## 8. Noch offene Exit-Gates

Auch nach Aktivierung bleiben insbesondere offen:

- ausreichende reale Sample Counts;
- vollständige Kategorie-/Provider-Coverage;
- eine belastbare Beobachtungsperiode;
- bei Multi-Instance-Betrieb persistente/exportierte Aggregation;
- keine offenen Integrity Findings;
- P3-B Universe/SLA;
- P3-C Controlled Promotion bleibt separat human-gated.

## 9. Regressionen

`tests/unit/commodityP3ARuntimeActivation.test.ts` schützt:

1. exakt dieselbe bereits beschaffte `CommodityMarketEvidence`-Instanz wird gespiegelt;
2. `twelvedata / commodity-history / market.priceHistory` wird explizit gebunden;
3. der registrierte Champion wird nur bei erfolgreichem Dispatch als Comparator übergeben;
4. `SCORE_NOT_COMPUTABLE` erzeugt keinen erfundenen Champion;
5. Observer-/Composition-Exceptions werden zu stabilem `BLOCKED` ohne Detail-Leak;
6. der Verified-Score-Route enthält weiterhin nur einen `getTwelveDataCommodityEvidence(symbol, 90)`-Acquisition-Call.

## 10. Work-Claim-Lifecycle

Der Work Claim aus PR #547 ist durch dessen Human-Merge terminal und wird in diesem Slice auf:

- `status=released`;
- `exclusive=false`

gesetzt. Der ursprüngliche Claim bleibt als historische Traceability erhalten, besitzt aber keine Writer-Authority mehr.

## 11. Main-Sync / Korrelation — 2026-08-26

Nach Merge von PR #548 wurde dieser Branch non-destructive mit `main@60663c3fc6f76e8ae1f5685076480c552ab722f8` synchronisiert.

Vor dem Sync: `7 ahead / 6 behind`, Merge-Base `c734e0820435bea4774e1311b1e60b2b744b908e`.

Die seit dem alten Merge-Base hinzugekommenen Main-Dateien lagen ausschließlich im BB-2-Dashboard-Scope (`src/app/**` plus `tests/unit/dashboardCompositionBoundary.test.ts`). Der P3-A-Scope hatte keinen File-Level-Overlap. Der Sync erfolgte als echter Merge-Commit ohne Force-Push.

Nach dem Sync und der nachfolgenden Baseline-Contract-Korrektur enthält der Branch aktuellen `main` vollständig; Merge-Base ist `60663c3fc6f76e8ae1f5685076480c552ab722f8`, `0 behind`.

## 12. Production-URL-Contract-Korrektur

Im bestehenden PR-Baseline-Schema `1.1.0` wurde das Feld `productionUrl` technisch mit dem Health-Endpoint `https://capital-ai.online/healthz` belegt und im PR-Body zugleich als **Produktions-URL** beschriftet. Dadurch wurden kanonischer Website-Origin und Health-Probe semantisch vermischt.

Dieser PR korrigiert das für nachfolgende PRs mit Baseline-Schema `1.2.0`:

- `productionUrl = https://capital-ai.online/` — kanonischer Produktions-/Website-Origin;
- `productionHealthUrl = https://capital-ai.online/healthz` — technischer Health-/Deployment-Identity-Endpoint;
- `productionPreflight.mjs` fragt ausschließlich `productionHealthUrl` ab;
- beide URLs werden content-addressed in die Baseline-ID aufgenommen;
- `renderProductionBaselineBlock()` rendert beide Felder getrennt;
- `validateProductionBaselineForPr()` validiert beide Semantiken fail-closed;
- `scripts/pr/lib.test.mjs` schützt die Trennung regressionsfest.

Der aktuelle PR selbst wird bis zum Merge weiterhin durch den **trusted-main Schema-1.1.0-Validator** geprüft. Deshalb muss sein maschinenverwalteter Baseline-Block für diesen Übergangs-PR noch das alte trusted-main-Format verwenden. Nach Human-Merge wird `1.2.0` der kanonische Contract für neu gerenderte PR-Baselines.

## 13. Validierungsstatus

- `main@60663c3fc6f76e8ae1f5685076480c552ab722f8` ist im Main-CI #2487 vollständig PASS und wurde anschließend als genau dieser Commit live und healthy auf Render verifiziert.
- trusted-main Preflight für den aktuellen PR-Head erzeugt eine aktuelle Schema-1.1.0-Baseline gegen genau diesen Production-/Main-Stand.
- Exact-Head CI/Governance nach Main-Sync und URL-Contract-Korrektur sind maßgeblich; ältere grüne Runs gelten nur als historische Evidence.
- keine Supabase-/Stripe-/Secret-/Datenbankmutation;
- keine Workflow-Datei geändert.

**Status:** P3-A Runtime Activation + Production-URL-Contract-Korrektur im PR; Beobachtungsperiode noch nicht gestartet.
