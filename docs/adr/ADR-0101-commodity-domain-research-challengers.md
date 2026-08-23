# ADR-0101 — Commodity Domain Research Challengers innerhalb der Single-Scoring-Architektur

**Status:** Accepted for P0/P1 implementation  
**Date:** 2026-08-23  
**Parent authority:** ADR-0087, SC-2 Model Registry & Universal Asset Interface  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md`  
**Issues:** #490–#498

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

## Nicht gewählt

- zweite YAML Commodity Model Registry;
- Commodity-spezifischer Dispatcher;
- Crypto-On-Chain-Features oder Crypto Domain Executor im Commodity-Modul;
- globale 60-Minuten-Freshness für alle Fundamentals;
- ungeprüfte Übernahme der Owner-Beispielgewichte;
- Ore Grade/Tonnage/Capex/Opex im Commodity-Benchmark-Modell;
- LLM-basierte numerische Füllwerte;
- numerischer P1-Challenger-Score ohne P2-Kalibrierung und OOS-Evidence;
- rohe Exception-/Provider-Payloadtexte als öffentliche 5xx-Fehlerdetails.

## Validierung / Promotion

P0/P1 benötigt Contract-/Authority-/Provider-Negativtests. Produktive Promotion eines Kategorie-Modells ist durch diese ADR ausdrücklich **nicht** autorisiert und erfordert die P2/P3-Gates der Commodity Roadmap einschließlich Point-in-Time/OOS-Backtesting, Korrelationsprüfung, Provider-Resilienz, Security/Data-Integrity Review und expliziter Owner-Entscheidung.

Für das Error-Handling sind zusätzlich mindestens Application-Level-Providerfehler (`status=error`), Health-Diagnostik mit `payloadUsable=false` sowie die Nichtweitergabe roher Exceptiontexte über Commodity-5xx-Routen als Regression zu prüfen.
