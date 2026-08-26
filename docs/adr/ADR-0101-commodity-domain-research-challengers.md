# ADR-0101 — Commodity Domain Research Challengers innerhalb der Single-Scoring-Architektur

**Status:** Accepted for P0/P1 implementation and P2 validation/promotion governance; P3-A observability foundation defined  
**Date:** 2026-08-23  
**Updated:** 2026-08-26  
**Parent authority:** ADR-0087, SC-2 Model Registry & Universal Asset Interface  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md`  
**Traceability:** Commodity P0–P2-C gemäß gemergtem Code/Evidence; P3-A Foundation auf dediziertem Branch, Exit Gate bleibt bis realer Beobachtungsperiode offen. Roadmap-Issues werden in diesem Chat nicht als Status-Authority verändert.

## Kontext

Die Commodity/Rohstoff-Domäne benötigt andere Fundamentals, Freshness-Regeln und Modellhypothesen als Crypto. Die Owner-Dokumentation ergänzt Feature Contracts, Gewichte, Domain Executor, Hard Gates, Backtesting und Modellversionierung. Eine wörtliche Übernahme der vorgeschlagenen Modulstruktur würde jedoch eine zweite Model Registry, einen parallelen Crypto Executor und potenziell einen zweiten Gate-/Scoring-Stack erzeugen.

ADR-0087 bleibt deshalb übergeordnet: UAI, `ScoringModelRegistry`, `ScoringDispatcher`, `CanonicalScoreResult`, Provider Governance, DQ/Provenance und Ranking bleiben jeweils Single Point of Trust.

## Entscheidung

1. `RawMaterialsOrchestrator` ist ausschließlich Research-/Evidence-Orchestrator und besitzt keine Scoring-, Ranking- oder Execution-Authority.
2. Der Orchestrator hat zwei strikt getrennte Research-Modi:
   - Agent Research bleibt `UNVERIFIED_AGENT_RESEARCH` und darf weder numerische Provider-Evidence ersetzen noch Scores autorisieren.
   - Source-backed Research übernimmt ausschließlich bereits verifizierte Provider-/Adapter-Evidence, bindet sie an UAI, komponiert einen domänenspezifischen `CommodityResearchFeatureSnapshot` und bewertet deterministisch Research-Readiness/Hard Gates.
3. Der Source-backed Research Evaluator liefert in P0/P1 bewusst **keinen numerischen Challenger-Composite-Score** (`researchCompositeScore=null`). Die Owner-Gewichtshypothesen werden nicht ausgeführt; Kalibrierung, Korrelation, Point-in-Time Backtesting und Weight Promotion verbleiben in P2.
4. Commodity Benchmarks erhalten deterministische UAI-`instrumentKind`s:
   - `commodity-energy-benchmark`
   - `commodity-industrial-metal-benchmark`
   - `commodity-precious-metal-benchmark`
   - `commodity-agriculture-benchmark`
5. Mine-/Förderprojekt-/Reservebewertung bleibt über `commodity-resource-project` vollständig getrennt und ist nicht Teil des P0/P1 Benchmark-Scorings.
6. Vier Kategorie-Modelle werden ausschließlich als `challenger`, `research-only`, `scoreEligible=false` in der vorhandenen `ScoringModelRegistry` geführt. Der bestehende `commodity-evidence-scoring@1.0.0` bleibt bis zu einer späteren Owner-gesteuerten Promotion der einzige produktive Commodity-Champion.
7. Die Gewichtsmatrix aus der Owner-Dokumentation wird als `research-hypothesis`, `executable=false` erfasst. Aus P0/P1 folgt kein produktiver Weight-Flip.
8. Missing/Stale/Invalid Evidence wird nicht auf 0, 50, PASS oder andere Neutralwerte gesetzt. Category Feature Snapshots führen Status, Provenance, Freshness und Coverage explizit; erforderliche Lücken blockieren `researchReady`.
9. Die Commodity-DQ-Policy ist feature-/quellenspezifisch: Markt-/CFTC-/EIA-/USDA-/USGS-/CRMA-Evidence besitzt unterschiedliche Freshness-Fenster. Zukunftszeitstempel, `observedAt > retrievedAt`, Unit-Mismatch und nicht vorgelagert aufgelöste Duplicate-Feature-Evidence sind fail-closed `INVALID`.
10. Nach der feldspezifischen Commodity-DQ wird die bestehende `evaluateDataQualityGate`-Authority als finales Provider-/Coverage-Gate wiederverwendet. Es entsteht kein zweiter allgemeiner DQ-Service und keine pauschale globale Freshness-Regel.
11. Der historische `RawMaterialsScoringService` bleibt bis P2-E ausschließlich Legacy-/Sandbox-Kompatibilität. Sein 50er-Neutralwert darf die neue Feature-/Canonical-Chain nicht erreichen.
12. TwelveData Commodity History wird über die bestehende Provider-Governance und `MarketDataHistoryGateway` geführt. Direkte route-/service-lokale Time-Series-Autorität entfällt.
13. EIA, USDA FAS PSD, CFTC COT, USGS MCS und EU CRMA werden als offizielle Commodity-Evidence-Quellen in der bestehenden Provider Matrix inventarisiert. HTTP-basierte Research/Fundamental-Quellen nutzen `ResearchEvidenceProviderHttp` und erben Rate Limit, Circuit Breaker und Provider Health.
14. Economic Importance und Supply Risk aus CRMA bleiben getrennte Merkmale. Supply-Risk/Kritikalität wird nicht automatisch in einen Benchmark-Market-Score addiert.
15. Der Research-Evaluator erzeugt deterministische Feature-Lineage über den bestehenden Scoring-Fingerprint. Solange Gewichte nicht ausführbar sind, wird der Weight-Fingerprint explizit als `NON_EXECUTABLE_ZERO_WEIGHT` gebunden und darf nicht als produktive Gewichtung interpretiert werden.
16. P0/P1 endet mit nicht-produktiven Challengern. Backtesting, Korrelation/Double-Counting, executable weights, Promotion Package und Consumer/Legacy-Retirement verbleiben in P2/P3.
17. Der gemeinsame `ResearchEvidenceProviderHttp` unterscheidet HTTP-/Transportfehler von parsebaren Application-Level-Providerfehlern. Ein JSON-Payload mit explizitem `status=error` wird als `PROVIDER_ERROR`, `payloadUsable=false` und Provider-Health `unavailable` behandelt; der Payload wird nicht als `READY` weitergereicht.
18. Öffentliche Commodity-5xx-Antworten geben nur stabile, nicht-sensitive Fehlercodes und generische Meldungen zurück. Exceptions und Providerdetails werden ausschließlich serverseitig diagnostiziert; rohe `error.message`- oder Provider-Payloadtexte sind keine API-Response-Evidence.

## P2-A/P2-B — Validierungsgrundlage

19. Die Drive-Gewichtsmatrizen bleiben auch in P2 zunächst `research-hypothesis`, `executable=false`. Sie werden **nicht** automatisch von fünf breiten Faktorgruppen auf einzelne Features expandiert. Eine Feature-/Latent-Factor-Allokation benötigt empirische Korrelation-, Sensitivitäts- und Point-in-Time-Backtest-Evidence.
20. Kandidatengewichte werden auf **Latent-Factor-Ebene** validiert. Features innerhalb eines Faktors dürfen nur `WITHIN_LATENT_FACTOR_ONLY` renormalisiert werden; fehlende Features oder Faktoren dürfen kein Gewicht in einen anderen Faktor verschieben.
21. Pairwise Correlation ist ein versioniertes Research-Diagnostic und keine Scoring-Komponente. Hohe empirische Korrelation über verschiedene Latent Factors ist Promotion-blockierend, bis Dekorrelation/Aggregation fachlich belegt ist. Korrelation innerhalb desselben Faktors wird über die Faktoraggregation gebunden und darf nicht als zusätzliche additive Belohnung auftreten.
22. Der bestehende `buildEffectiveScoringFingerprintMetadata()`-Vertrag bleibt Authority für effective-feature/effective-weight-Lineage. P2 führt keinen zweiten Fingerprint-Mechanismus ein.
23. Point-in-Time Backtesting trennt `observedAt`, `availableAt` und `retrievedAt`. Maßgeblich für Lookahead ist `availableAt` des **exakten Daten-Vintage**. Ein historischer Wirtschafts-/Positionswert darf nicht vor seiner tatsächlichen Veröffentlichung in einem Entscheidungs-Snapshot erscheinen.
24. Revisionsfähige Fundamentals (insbesondere USDA/EIA) benötigen Release- und Revision-Lineage. Spätere Retrievals historischer Werte sind nur zulässig, wenn der exakt historisch verfügbare Vintage identifizierbar ist.
25. Backtest-Requests binden Modellversion, Universe, Domains, Zeitraum, Rebalance, Holding Period, Top-N, Confidence, Window Mode, Trainingsminimum, Point-in-Time-Policy und versionierte Cost/Slippage-Annahmen.
26. Eine Backtest-Ausgabe bleibt `VALIDATION_ONLY`, `canonical=false`, `scoreEligible=false`. `promotionEvidenceEligible=true` darf ausschließlich die Vollständigkeit eines Review-Pakets anzeigen und benötigt mindestens: gültigen Request, keine Leakage-Blocker, Point-in-Time-Gate, validierte Cost Assumptions, OOS-Validierung, Benchmark, Correlation Evidence und Sensitivity Evidence.
27. Auch ein vollständiges P2-Evidence-Paket führt **keine** automatische Registry-Promotion aus. Champion/Challenger-Wechsel bleibt explizite Owner-Entscheidung in der bestehenden `ScoringModelRegistry`/`ScoringDispatcher`-Governance.

## P2-B — Historical Dataset & Walk-forward/OOS Engine

28. Der historische Backtest-Executor besitzt **keinen Provider-/HTTP-Zugriff**. Provider-Acquisition und historische Vintage-Beschaffung bleiben vorgelagert; der Executor akzeptiert nur ein bereits versioniertes, unveränderliches Historical Dataset. Dadurch ist derselbe Input deterministisch wiederholbar und die Validation Engine wird keine zweite Evidence-Acquisition-Authority.
29. Historische Datensätze erhalten einen content-addressed `datasetFingerprint`. Er bindet Modell/Universe/Normalisierungsvertrag, PIT-Vintages, normalisierte Faktorwerte, Universe-Membership-Evidence, Normalisierungs-Evidence, Outcomes sowie Benchmark-Definitionen/-Returns. Eine Änderung historischer Inputs erzeugt eine andere Identität.
30. Jede historische Asset-Zeile benötigt eine explizite `universeMembershipEvidenceId`. Historische Universen dürfen nicht aus dem heutigen Asset-Katalog rückwirkend konstruiert werden; fehlende Membership-Evidence gilt als Survivorship-Risk und blockiert den Datensatz.
31. Normalisierte Latent-Factor-Werte benötigen eine eigene `normalizationEvidenceId` und einen versionierten `normalizationContractVersion`. Der Backtest-Executor normalisiert keine heterogenen Rohdaten selbst. Eine Roh-Evidence darf über `factorEvidenceFeatureKeys` nicht mehreren Latent Factors gleichzeitig als Autorisierung dienen.
32. Walk-forward/expanding-window Splits sind strikt temporal: Training darf nur Beobachtungen enthalten, deren `decisionAt` vor dem Testzeitpunkt liegt **und deren Outcome (`realizedAt`) spätestens am Testzeitpunkt bereits bekannt war**. Dadurch wird Target-/Outcome-Leakage zusätzlich zur Feature-Availability-Grenze geschlossen.
33. `minConfidence` wird vor der Bildung von Train-/Test-Splits angewendet. Niedrige Confidence wird nicht durch spätere Portfolioselektion neutralisiert. Unzureichende OOS-Perioden blockieren den Run fail-closed.
34. Ein OOS-Run benötigt mindestens einen Benchmark des aktuellen Commodity-Champions und eine naive Baseline mit zeitlich ausgerichteten, evidenzgebundenen Returns. Fehlende Benchmark-Perioden verhindern ein vollständiges OOS-Evidence-Paket.
35. Die Validation Engine berechnet ausschließlich Research-Metriken und -Evidence: Rank IC, Rank-Monotonicity, Top-N Hit Rate, Return/Volatility, Drawdown, Profit Factor, Turnover, Regime-/Domain-Diagnostik und versionierte Kosten. Der resultierende `commodity-oos:<sha256>`-Identifier ist ein reproduzierbarer Review-Nachweis, **keine** Score-/Registry-/Ranking-/Trading-Authority.
36. Für den Historical Replay dürfen validierte `research-candidate` Faktorweights numerisch angewendet werden, um ihre empirische Wirkung zu testen. Das ändert ihren Contract nicht: `executable=false`, `scoreEligible=false`; Runtime/Dispatcher darf diese Gewichte weiterhin nicht verwenden.

## P2-B — Historical Vintage Acquisition & Dataset Assembly

37. Ein historischer **Wert** und ein historisch **verfügbarer Vintage** sind unterschiedliche Evidence-Klassen. Eine heutige API-Abfrage eines alten EIA-, USDA- oder CFTC-Zeitraums wird deshalb als `CURRENT_HISTORY_ONLY` klassifiziert und darf nicht allein aufgrund des alten `observedAt` in ein promotionsfähiges PIT-Dataset gelangen.
38. `CommodityHistoricalVintage` leitet den Evidence-Grad policybasiert aus Source, Acquisition Mode, `observedAt`, `availableAt`, `retrievedAt`, Release-/Revision-ID und Availability-Evidence ab. Ein Caller kann `PIT_VERIFIED` nicht als freies Boolean setzen. Jeder Vintage erhält einen content-addressed Fingerprint.
39. EIA- und USDA-Historie ist nur dann `PIT_VERIFIED`, wenn ein **archivierter release-spezifischer Capture** den damals verfügbaren Payload/Vintage bindet. Für USDA gilt dies insbesondere wegen revisionsfähiger Forecast-/Market-Year-Werte; eine aktuelle `dataReleaseDates`-Antwort beweist nicht den Inhalt früherer Releases.
40. CFTC `report_date` ist Observation-Time und nicht automatisch Availability-Time. PRE-/Socrata-Historie aus einer heutigen Abfrage bleibt `CURRENT_HISTORY_ONLY`. `PIT_VERIFIED` erfordert Evidence des tatsächlich veröffentlichten/archivierten Report-Artefakts einschließlich Publikationszeitpunkt; eine nur kalenderbasierte Friday-Annahme wird nicht als Beweis akzeptiert.
41. USGS MCS wird als versionierte Annual Release modelliert: Statistikjahr ist `observedAt`, Veröffentlichungs-/Versionszeitpunkt ist `availableAt`. Ein in MCS 2026 enthaltener Wert für 2025 darf folglich nicht für eine Decision vor Veröffentlichung der 2026er Release verwendet werden. Versions-/Revision-Evidence bleibt Bestandteil des Vintages.
42. EU-CRMA-Methodik und numerische Criticality-Evidence werden getrennt behandelt. Economic Importance und Supply Risk bleiben getrennte Features; ein numerical PIT Vintage benötigt eine versionierte veröffentlichte Assessment-/Release-Evidence. Die Verordnung allein autorisiert keinen historischen Zahlenwert.
43. `assembleCommodityHistoricalDataset()` ist die einzige neue Brücke von source-spezifischen Vintages zur PR-#519-Historical-Validation-Engine. Sie akzeptiert ausschließlich `PIT_VERIFIED`, prüft Asset/Domain/Decision Availability sowie Normalisierungs-Lineage und delegiert die finale Dataset-/PIT-/Factor-Evidence-Validierung an `validateCommodityHistoricalDataset()`. Aktuelle Historie wird weder still verworfen noch hochgestuft.

## P2-C — Model Descriptor & Promotion Governance

44. Jede promotionsfähige Modellrevision benötigt einen unveränderlichen `CommodityImmutableModelDescriptor`. Dieser bindet Modell-, Feature-, Weight-, DQ-, Correlation-, Stability-, Backtest- und Historical-Vintage-Vertragsversionen sowie `validFrom`/optional `validUntil`, unterstützte Quellen und Calibration-/Dataset-/OOS-Lineage.
45. Der Descriptor übernimmt die bestehenden Fingerprint-Semantiken: `effectiveWeightFingerprint` und Historical-`datasetFingerprint` bleiben die kanonischen raw SHA-256-Hexwerte der vorhandenen Plattformfunktionen. Descriptor- und Promotion-Package-Identitäten erhalten eigene `sha256:<hex>`-Fingerprints; es entsteht keine konkurrierende Weight-/Dataset-Fingerprint-Authority.
46. Ein P2-C-Review-Paket benötigt neben der P2-A/P2-B Weight-/Correlation-/Sensitivity-/Backtest-Evidence zusätzlich **Provider-Resilience-Evidence** und **Stress-/Regime-Evidence**. Thresholds werden als versionierte Policies ausgewertet; Caller-Booleans können kein PASS autorisieren.
47. Provider Resilience bindet je erforderlicher Quelle mindestens Sample Count, Availability Rate, Freshness Pass Rate, Error Rate, Circuit-Open Events, optional P95-Latency und eine Evidence-ID. Alle im Descriptor als supported/required gebundenen Quellen müssen im Resilience-Paket nachgewiesen sein.
48. Stress Evidence bindet explizit erforderliche Szenarien, OOS-Evidence, Leakage-Status sowie policybasierte Grenzen für Rank IC, Drawdown und Turnover. Fehlende Szenarien, Leakage oder Policy-Verletzungen blockieren Owner-Reviewfähigkeit fail-closed.
49. Das Promotion Package erzeugt einen deterministischen Champion/Challenger-Diff gegen den **aktuell registrierten** Commodity-Champion und bindet diesen Champion zugleich als Rollback Target. Für den aktuellen Stand ist `commodity-evidence-scoring@1.0.0` Rollback-Ziel; eine spätere Änderung der Registry erzeugt ein neues Review-Paket.
50. `readyForOwnerReview=true` ist ausschließlich ein Evidence-Completeness-Signal. Das Paket bleibt `canonical=false`, `scoreEligible=false`, `registryMutationPerformed=false` und enthält keinerlei Mutation von `ScoringModelRegistry`, `ScoringDispatcher`, Ranking oder Runtime Executor.
51. Eine Owner-Entscheidung muss explizit als `HUMAN_OWNER`-Evidence an den **exakten Promotion-Package-Fingerprint** gebunden sein. Auch eine gültige `APPROVE`-Assessment-Ausgabe führt keine Registry-Mutation aus. Controlled Promotion bleibt ein separates Folgepaket auf frischem Branch nach vollständigen P2/P3-Gates und Human Merge.

## P3-A — Shadow Runtime & Observability

52. `provider-runtime-observability/1.0.0` ergänzt die vorhandene `ProviderHealth`-Momentaufnahme um ein bounded, pro Prozess geführtes Laufzeit-Ledger. Gespeichert werden ausschließlich governte Provider-/Capability-IDs, Outcome, Dauer, HTTP-Status, Payload-Usability, Circuit-State sowie Rate-Budget-Rest/Reset. URL, Request-Pfad, Query, Payload, API-Key, Secret oder Provider-Rohdaten sind verboten.
53. `ResearchEvidenceProviderHttp` erzeugt genau eine Runtime-Beobachtung pro Request-Outcome — einschließlich `NOT_CONFIGURED`, lokalem `RATE_LIMITED`, `CIRCUIT_OPEN`, HTTP-/Transportfehler, Application-Level-Providerfehler, Schemafehler und `READY`. Damit erben EIA/USDA/CFTC/USGS und weitere dort angebundene Quellen dieselbe Latency-/Error-/Circuit-/Budget-Beobachtung ohne zweiten Transportstack.
54. `commodity-shadow-observability/1.0.0` akzeptiert ausschließlich einen bereits governten `CommodityResearchFeatureSnapshot` plus die deterministische `CommodityCategoryResearchEvaluation`. Provider-/Feature-Zuordnung wird nur über explizite Bindings akzeptiert; P3-A inferiert weder Category noch Provider aus Symbolen und erzeugt keine zusätzlichen API-Aufrufe.
55. Solange `weightHypothesis.executable=false` und `researchCompositeScore=null` gelten, ist numerische Challenger-Score-Stability **nicht anwendbar**. P3-A persistiert deshalb `NOT_APPLICABLE_UNTIL_EXECUTABLE_WEIGHTS` mit `score=null`/`delta=null`, statt aus DQ, Coverage oder Hypothesengewichten einen Ersatzscore abzuleiten.
56. Für den bestehenden produktiven Commodity-Champion darf ein bereits vorliegender Canonical-Score als read-only Comparator mitgeführt werden. Dessen Score-/Feature-/Weight-Drift ist Beobachtungsevidence und verändert weder Challenger noch Champion, Ranking oder Eligibility.
57. P3-A misst Research-Status, Feature-/Required-Coverage, DQ, Feature-Status-Wechsel sowie effective-feature/evidence-Fingerprint-Drift. Der P3-A-`evidenceFingerprint` ist eine content-addressed Observation-Identität und ersetzt weder den bestehenden Scoring-Fingerprint noch Historical Dataset/Weight Fingerprints.
58. Jede Shadow-Beobachtung erzeugt eine sanitisierte kanonische `TelemetryRecord`-Evidence mit `eventName=commodity.shadow.observation.completed` und `auditReference=ADR-0101/P3-A`. Die Enterprise Traceability Matrix wird zur Laufzeit nicht mutiert; operative Telemetrie referenziert Governance/Lineage, während ETM weiter über ihren bestehenden Build-Prozess erzeugt wird.
59. Die erste P3-A-Stufe bleibt absichtlich in-memory und pro Prozess, analog zu vorhandenen Circuit-/Rate-/Gemini-Shadow-Primitiven. OpenTelemetry/Prometheus bleiben geeignete spätere Exportpfade, werden in diesem bounded Scope aber nicht als neue Runtime-Dependency eingeführt. Horizontal geteilte Langzeit-SLO-/Promotion-Evidence benötigt einen separaten persistenten/exportierten Observability-Slice.
60. Die Implementierung der Foundation erfüllt **nicht** automatisch das P3-A Exit Gate. Eine definierte reale Beobachtungsperiode mit ausreichenden Samples sowie ohne ungeklärte P0/P1-Integrity-Findings bleibt zwingende nachgelagerte Evidence.

## Sicherheits-, Governance- und Datenintegritätsfolgen

- Keine neue Credential- oder IAM-Authority.
- Provider-Schlüssel bleiben serverseitig und werden nicht in Evidence/Logs persistiert.
- Neue Provider werden fail-closed behandelt; fehlende Keys oder Mapping-Bindings führen nicht zu synthetischer Evidence.
- Identitätszuordnung zu Vendor-Symbolen ist explizit bzw. fail-closed.
- Provider-/Research-Evidence kann weder `CanonicalScoreResult` noch Ranking-/Execution-Eligibility direkt erzeugen.
- Kein selbstständiger Modell-Promotion-Mechanismus wird eingeführt.
- Jährliche USGS-Daten und regulatorische CRMA-Referenzen werden nicht mit Intraday-/Weekly-Freshness verwechselt; die Policy folgt der Veröffentlichungsfrequenz der Quelle.
- Duplicate Evidence ohne explizite vorgelagerte Merge-/Consensus-Entscheidung wird nicht stillschweigend überschrieben.
- Erfolgreiches HTTP/JSON-Parsen allein bedeutet nicht `payloadUsable=true`, wenn der Provider im Payload selbst einen Fehlerstatus meldet.
- Interne Exception-, SDK-, Netzwerk- oder Providerdetails werden nicht über Commodity-5xx-Routen an Clients gespiegelt; öffentliche Fehlercodes bleiben stabil und maschinenlesbar.
- P2-Validierungs- und Promotion-Review-Artefakte besitzen keine Runtime-, Ranking-, Trading- oder Execution-Authority.
- Missing-Data-Renormalisierung bleibt innerhalb eines Latent Factors; Cross-Factor-Reweighting durch Datenlücken ist verboten.
- Backtest-Evidence ohne reale Release-/Vintage-Semantik gilt als Leakage-Risiko und ist nicht promotion-fähig.
- Historical Dataset und OOS Evidence enthalten ausschließlich Identitäten/Lineage/Research-Werte; sie eröffnen keinen neuen externen Write-/Secret-/Execution-Pfad.
- Der Backtest-Executor importiert keine Provider-Gateways, keine Routes und keinen `ScoringDispatcher`/`ScoringModelRegistry`/Ranking-Pfad.
- Historical Acquisition nutzt für HTTP-Quellen weiterhin `ResearchEvidenceProviderHttp`; es entsteht kein zweiter Rate-Limit-/Circuit-Breaker-/Provider-Health-Stack.
- Evidence Grade ist fail-closed. `CURRENT_HISTORY_ONLY` und `REFERENCE_STATIC` bleiben Research-Evidence und können nicht durch Dataset Assembly zu `PIT_VERIFIED` konvertiert werden.
- Ein Owner-Approval-Evidence-Objekt ist Evidence und keine technische Mutation Authority. Registry-/Dispatcher-Änderungen bleiben separate, human-gated Repository-Arbeit.
- Der persistierte Work Claim eines terminal gemergten Commodity-Pakets wird entsprechend Development Chain Execution Policy 2.0.0 auf `released`, `exclusive=false` gestellt; stale Claim-Metadaten dürfen keine künstliche Writer-Authority fortsetzen.
- Shadow-Ledger enthalten keine Provider-Payloads, Rohwerte, URLs, Queries oder Secrets; Feature-Rohwerte gehen ausschließlich gehasht in den P3-A-Evidence-Fingerprint ein.
- `canonical=false`, `scoreEligible=false`, `rankingEligible=false`, `executionEligible=false` und `registryMutationPerformed=false` sind feste Shadow-Contract-Invarianten.

## Nicht gewählt

- zweite YAML Commodity Model Registry;
- Commodity-spezifischer Dispatcher;
- Crypto-On-Chain-Features oder Crypto Domain Executor im Commodity-Modul;
- globale 60-Minuten-Freshness für alle Fundamentals;
- ungeprüfte Übernahme der Owner-Beispielgewichte;
- automatische Verteilung der Drive-Gruppengewichte auf einzelne Features;
- Cross-Factor-Renormalisierung bei Missing Data;
- Backtesting mit heutiger/latest-revision Evidence für historische Entscheidungszeitpunkte;
- Live-Provider-Aufrufe innerhalb des Historical Backtest Executors;
- heutige EIA-/USDA-/CFTC-Historie als implizit point-in-time korrekt;
- aus CFTC-Wochentag/Report-Date abgeleitete Availability ohne Release-Artefakt;
- rückwirkende Universe-Zusammensetzung aus dem heutigen Katalog;
- Training auf Targets, die zum Test-Entscheidungszeitpunkt noch nicht realisiert waren;
- automatische Promotion durch `promotionEvidenceEligible`, OOS-Fingerprint, vollständiges P2-C-Paket oder Owner-Decision-Assessment;
- direkte Registry-/Dispatcher-Mutation aus `CommodityModelPromotion`;
- ein zweites MLOps-/Model-Registry-System nur für Promotion-Artefakte;
- Ore Grade/Tonnage/Capex/Opex im Commodity-Benchmark-Modell;
- LLM-basierte numerische Füllwerte;
- numerischer P1/P3-A-Challenger-Score ohne P2-Kalibrierung, executable weights und OOS-Evidence;
- rohe Exception-/Provider-Payloadtexte als öffentliche 5xx-Fehlerdetails;
- neue OpenTelemetry-/Prometheus-Runtime-Dependency nur für die erste bounded P3-A-Ledger-Stufe;
- automatische keyed-API-Aufrufe allein zur Erzeugung von Observability-Samples.

## Validierung / Promotion

P0/P1 benötigt Contract-/Authority-/Provider-Negativtests. P2 ergänzt Correlation-/Double-Counting-, Weight-Stability-, Historical-Dataset-, Historical-Vintage-, Point-in-Time-, Survivorship-, Outcome-Leakage-, Confidence-, Benchmark-, Walk-forward/OOS-, Provider-Resilience-, Stress-/Regime-, Descriptor-/Fingerprint- und Owner-Decision-Binding-Negativtests. P3-A ergänzt Provider-Latency/Error/Circuit/Budget-Aggregation, Shadow-Authority-, Snapshot/Evaluation-Mismatch-, Drift- und Sanitization-Regressionen.

Produktive Promotion eines Kategorie-Modells ist durch diese ADR ausdrücklich **nicht** autorisiert. Sie erfordert weiterhin reale OOS-/Stress-Evidence, Provider-Resilienz, Security/Data-Integrity Review, P2-D/P3-Integrationsgates, finalen Main-/Open-PR-Sync und eine separate explizite Human/Owner-Entscheidung. Ein Review-Paket, eine Shadow-Beobachtung oder eine Entscheidungsevidence kann diese nachgelagerte Registry-/Runtime-Änderung nicht selbst ausführen.

Für das Error-Handling sind zusätzlich mindestens Application-Level-Providerfehler (`status=error`), Health-Diagnostik mit `payloadUsable=false` sowie die Nichtweitergabe roher Exceptiontexte über Commodity-5xx-Routen als Regression zu prüfen.
