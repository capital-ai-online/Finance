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

## 11. Validierungsstatus

Vor PR-Erstellung:

- keine Hosted-CI ausgelöst;
- keine Render-/Supabase-/Stripe-/Secret-Mutation;
- keine Dependency-/Workflow-/Docker-Änderung;
- aktueller Scope auf Runtime Bridge, Verified-Score-Binding, Regression, Claim-Lifecycle und Evidence begrenzt.

Nach PR-Erstellung gelten die vorhandenen Class-R-/trusted-main-Gates. Der Startzeitpunkt der Beobachtungsperiode darf erst nach Human-Merge + verifiziertem Render-Live-Deploy dokumentiert werden.

**Status:** P3-A Foundation live; produktive Challenger-Observation-Aktivierung in diesem Slice; Beobachtungsperiode noch nicht gestartet.
