# SC Commodity P2-A → P2-C — Evidence Pipeline

**Datum:** 2026-08-28  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md` → P2-A / P2-B / P2-C  
**Issues:** #499 P2-A, #500 P2-B  
**Parent authorities:** ADR-0087, ADR-0101, ADR-0102  
**Branch:** `feat/commodity-p2abc-evidence-pipeline-2026-08-28`  
**Base at work start:** `main@fc891ac601daa1a77cf25450b324a1f9ba5ed93d`

## 1. Anlass

P2-A, P2-B und P2-C besitzen auf `main` bereits jeweils eigenständige, fail-closed Validierungsprimitiven:

- P2-A: Candidate-Weight-, Correlation-/Double-Counting- und Sensitivity-/Weight-Stability-Contracts;
- P2-B: immutable Historical Dataset, PIT-/Vintage-Governance, Walk-forward/OOS-Executor, Kosten- und Benchmark-Contracts;
- P2-C: immutable Model Descriptor, Provider Resilience, Stress-/Regime-Evidence und Promotion Review Package.

Bisher fehlte jedoch eine einzige interne Composition-Grenze, die einen P2-Review-Run deterministisch von P2-A bis P2-C verbindet. Aufrufer konnten die einzelnen Primitiven korrekt verwenden, mussten Correlation-, Sensitivity- und OOS-Evidence-IDs aber selbst zwischen den Stufen weiterreichen.

## 2. Umsetzung

`commodity-p2-evidence-pipeline/1.0.0` komponiert ausschließlich bereits vorhandene Authorities:

```text
Candidate Weight Profile
  -> P2-A Weight Validation
  -> P2-A Correlation Report -> derived correlationEvidenceId
  -> P2-A Sensitivity Report -> derived sensitivityEvidenceId
  -> P2-B immutable Historical Dataset Validation
  -> P2-B Walk-forward/OOS
       binds exact P2-A evidence IDs
       -> derived outOfSampleEvidenceId
  -> P2-C Provider Resilience
  -> P2-C Stress Evidence
       binds exact P2-B outOfSampleEvidenceId
  -> P2-C Immutable Model Descriptor
       binds dataset fingerprint + P2-A/P2-B lineage
  -> P2-C Promotion Review Package
```

Die Pipeline besitzt keinen Provider-/HTTP-Zugriff und keine Scoring-, Registry-, Ranking-, Trading- oder Execution-Authority.

## 3. Lineage-Härtung

Die Pipeline reduziert `trust-by-caller` zwischen den bestehenden P2-Stufen:

1. `correlationEvidenceId` wird ausschließlich aus dem in derselben Pipeline erzeugten `CommodityCorrelationReport` abgeleitet.
2. `sensitivityEvidenceId` wird ausschließlich aus dem in derselben Pipeline erzeugten `CommodityWeightStabilityReport` abgeleitet.
3. Beide IDs werden unverändert in `executeCommodityHistoricalBacktest()` gebunden.
4. `outOfSampleEvidenceId` stammt ausschließlich aus der bestehenden Historical Backtest Engine.
5. Dieselbe OOS-ID wird anschließend in alle Stress-Szenarien und in die Descriptor-Lineage injiziert.
6. Der Dataset-Fingerprint stammt weiterhin ausschließlich aus `validateCommodityHistoricalDataset()`.
7. Das Promotion Package wird weiterhin durch `CommodityModelPromotion` deterministisch revalidiert.

Damit entsteht keine neue Fingerprint- oder Evidence-Authority. Die Pipeline ist eine Composition-Grenze über bestehende Authorities.

## 4. Fail-Closed bei fehlender empirischer Evidence

Dieser Branch erzeugt **keine** erfundenen historischen Marktdaten oder Fundamentals.

Insbesondere bleiben folgende Regeln unverändert:

- heutige EIA-/USDA-/CFTC-API-Werte werden nicht rückwirkend zu historischen PIT-Vintages erklärt;
- `CURRENT_HISTORY_ONLY` und `REFERENCE_STATIC` werden nicht zu `PIT_VERIFIED` hochgestuft;
- fehlende Historical Observations blockieren Dataset Validation und OOS;
- ohne echte OOS-Evidence erhält Stress Evidence keine gültige OOS-Bindung;
- `readyForOwnerReview` bleibt false, solange irgendein P2-A/P2-B/P2-C-Gate offen ist;
- auch `readyForOwnerReview=true` wäre nur Review-Evidence und keine Champion-Promotion.

## 5. Aktueller P2-Status nach diesem Slice

| Phase | Code-/Contract-Status | Empirisches Exit Gate |
|---|---|---|
| P2-A | Foundation + kanonische Pipeline-Composition implementiert | **OFFEN** — reale normalisierte PIT-Serien, Correlation- und Sensitivity-/Stability-Runs je Modell erforderlich |
| P2-B | Engine/Vintage Governance + kanonische Pipeline-Composition implementiert | **OFFEN** — reale archivierte PIT-Vintages/Datasets, Outcomes, Benchmarks und echte Walk-forward/OOS-Runs erforderlich |
| P2-C | Descriptor/Resilience/Stress/Promotion Governance + kanonische Pipeline-Composition implementiert | **IMPLEMENTED, REVIEW BLOCKED BY EVIDENCE** — Review-Paket bleibt blockiert, bis P2-A/P2-B und Resilience/Stress reale Evidence liefern |

Die Issues #499 und #500 müssen deshalb weiterhin offen bleiben.

## 6. Best-Practice-/State-of-the-Art-Abgleich

Geprüft wurden insbesondere:

- Federal Reserve Revised Guidance on Model Risk Management (17.04.2026): unabhängige Validierung, Backtesting/Outcomes Analysis und laufende Überwachung;
- NIST TEVV-Athlon (07.08.2026): strukturierte Test/Evaluation/Verification/Validation;
- CFTC Historical Compressed COT / Release Schedule für reale historische Report-Artefakte;
- USDA FAS PSD Release-/Revision-Semantik;
- EIA Open Data API v2.

Die Umsetzung folgt daraus insbesondere mit PIT/no-lookahead, immutable/content-addressed Lineage, OOS, getrennten Resilience-/Stress-Gates und keiner automatischen Promotion.

## 7. Open Source / Plugins

### Geprüft

- **MLflow** — Apache-2.0, aktiv gepflegt, Model-/Artifact-Governance geeignet; hier nicht übernommen, weil eine zusätzliche Python-/MLOps-/Model-Authority neben der bestehenden TypeScript-Registry und den vorhandenen Fingerprint-/Backtest-Contracts entstünde.
- **Evidently** — Apache-2.0, aktiv gepflegt, Evaluation/Monitoring geeignet; für diesen bounded P2-Composition-Slice ebenfalls keine geringere Integrations-/Security-Fläche als Wiederverwendung der nativen Contracts.

### Verwendet

- GitHub Connector für Repository-/Branch-/PR-Governance.
- Render ist für diesen reinen P2-Repository-Slice nicht erforderlich; keine Runtime-Mutation.
- Supabase/Stripe sind nicht betroffen.

## 8. Security und Datenintegrität

- keine Secrets/API-Keys;
- kein Provider-I/O aus der Pipeline;
- keine neue Dependency;
- keine Registry-/Dispatcher-Mutation;
- keine CanonicalScoreResult-/Ranking-/Execution-Ausgabe;
- keine synthetische historische Evidence;
- keine freie Caller-OOS-ID in Stress/Descriptor;
- `authority=VALIDATION_ONLY`, `canonical=false`, `scoreEligible=false`, `executionEligible=false`, `registryMutationPerformed=false` bleiben feste Result-Invarianten.

## 9. Regressionen

`tests/unit/commodityP2EvidencePipeline.test.ts` schützt mindestens:

1. P2-A Correlation-/Sensitivity-Evidence-IDs werden intern erzeugt und exakt in P2-B und P2-C weitergebunden.
2. Fehlende reale Historical Observations erzeugen kein OOS-Evidence-Objekt und können P2-C nicht review-fähig machen.
3. Alle Authority-Flags bleiben non-authorizing.

Bestehende Tests für `CommodityModelValidation`, `CommodityHistoricalBacktestEngine`, `CommodityHistoricalVintage` und `CommodityModelPromotion` bleiben die detaillierten Component-Gates.

## 10. Main-Korrelation während der Umsetzung

Während des Branch-Workflows ist `main` von `fc891ac601daa1a77cf25450b324a1f9ba5ed93d` um vier Commits weitergelaufen. Der Delta betrifft ausschließlich FT-6A/Supabase-Migrationsledger-Recovery:

- Work Claim FT6A;
- Recovery-Runbook;
- Migration-Ledger-Validator/Test;
- reine Umbenennungen bereits vorhandener FinTechCore-Migrationen.

Es besteht kein Datei-, Commodity-, Scoring-, Provider-, UAI-, Dependency-, AuthN/AuthZ- oder Contract-Overlap mit diesem P2-Scope. Unmittelbar vor PR-Erstellung erfolgt trotzdem der verpflichtende erneute Main-Sync und eine zweite Korrelation.

## 11. Verbleibender fachlicher Pfad

Nach Merge dieses Slices ist der nächste sinnvolle Schritt nicht Champion-Promotion, sondern reale Evidence Acquisition:

1. archivierte Release-Captures/Artefakte für EIA, USDA und CFTC sowie versionierte USGS/CRMA Evidence beschaffen;
2. immutable Domain-Datasets mit Historical Universe Membership, Normalization Evidence, Outcomes und Benchmarks assemblieren;
3. dieselbe Pipeline auf diese Inputs ausführen;
4. P2-A Correlation/Sensitivity und P2-B OOS/Stress/Resilience empirisch bewerten;
5. erst bei vollständigem Paket Owner Review für P2-C zulassen.

P3-C bleibt ausdrücklich außerhalb dieses Branches.
