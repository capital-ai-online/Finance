# Commodity / Raw-Materials Research-Orchestrator Boundary — 2026-08-23

**Status:** implementation evidence, non-authorizing  
**Branch:** `feat/commodity-orchestrator-research-boundary-2026-08-23`  
**Baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Work item:** Chat-Priorität P0 — `RawMaterialsOrchestrator` formal als Research-/Evidence-Orchestrator definieren  
**Parent authorities:** `AGENTS.md`, `docs/architecture/ORCHESTRATORS_AND_SCORING_ENGINES.md`, ADR-0087 canonical scoring

## Ziel

Der bestehende `RawMaterialsOrchestrator` wird auf Research-Komposition begrenzt. Er darf weder produktive Scores berechnen noch Modelle auswählen, Ranking-/Eligibility-Status setzen oder Execution Authority erzeugen.

Die bestehende Plattformkette bleibt unverändert:

```text
UAI
-> verified evidence / DQ
-> feature contract
-> ScoringModelRegistry
-> ScoringDispatcher
-> registered commodity executor
-> CanonicalScoreResult
```

Es wird **kein** zweiter Dispatcher, keine zweite Registry, keine zweite Provider-Governance und keine Crypto-Abhängigkeit eingeführt.

## Umgesetzte Boundary

`src/orchestrator/rawMaterialsOrchestrator.ts` liefert jetzt ausschließlich `RawMaterialsResearchContext` mit:

- Klassifikations-Research;
- Fundamentals-Research;
- Risk-Research;
- Strategic-Valuation-Research;
- qualitativer Begründung;
- explizitem Authority-Marker `RESEARCH_CONTEXT_ONLY`;
- `canonical=false`;
- `scoreEligible=false`;
- `scoringAuthority=false`;
- `executionAuthority=false`;
- `evidenceStatus=UNVERIFIED_AGENT_RESEARCH`.

Der Orchestrator importiert weder `RawMaterialsScoringService` noch `ScoringDispatcher`, `ScoringModelRegistry` oder `CanonicalScoreResult`.

## Legacy-Isolation

Das bestehende `RawMaterialsDashboard` erwartet weiterhin den historischen `AnalysisPayload`. Um in diesem ersten P0-Arbeitspaket kein paralleles Frontend oder Breaking Change einzuführen, bleibt die bisherige strukturelle Score-Kompatibilität **vorübergehend ausschließlich in `src/routes/rawMaterialsRoutes.ts` isoliert**.

Dieser Pfad ist explizit markiert als:

```text
legacyCompatibility=true
scoreSemantic=legacy-structural-research
canonical=false
scoreEligible=false
marketEvidenceVerified=false
```

Er besitzt keine Registry-, Ranking-, Eligibility- oder Execution-Authority. Die kanonische Commodity-Bewertung bleibt ausschließlich `/verified-score/:symbol -> dispatchCanonicalScore(...)`.

## Korrelations-/Doppelarchitekturprüfung

Nicht eingeführt wurden:

- Commodity-spezifischer zweiter Dispatcher;
- Commodity-spezifische zweite Model Registry;
- Crypto-Feature- oder Crypto-Weight-Wiederverwendung;
- neuer Score-Result-Vertrag neben `CanonicalScoreResult`;
- neuer Provider Gateway;
- neuer Ranking-Pfad;
- Promotion agentisch erzeugter Zahlen zu verifizierter Evidence.

Die Agents bleiben Research-only. Ihre numerischen Einschätzungen sind keine verifizierten Providerdaten.

## Best-Practice-Abgleich

- NIST AI RMF: Validität, Zuverlässigkeit, Transparenz und Nachvollziehbarkeit werden durch die explizite Research-/Scoring-Grenze unterstützt.
- EU Critical Raw Materials Act: Supply Risk und Economic Importance werden als fachlich getrennte Commodity-Dimensionen betrachtet; dieses Arbeitspaket führt noch keine neue Gewichtung oder produktive Kritikalitätsformel ein.
- CAPITAL-AI Governance: bestehende Plattformautoritäten werden wiederverwendet statt dupliziert.

## Restpunkte nach diesem P0

Nicht Teil dieses Arbeitspakets und bewusst offen:

1. Legacy-`50`-Fallbacks in Agent-/Structural-Research-Pfaden entfernen bzw. in `unknown`/Coverage-Semantik überführen.
2. `RawMaterialsDashboard` vom Legacy-Structural-Score entkoppeln und Research Context sowie kanonischen Commodity Score getrennt konsumieren.
3. TwelveData Commodity Evidence hinter die zentrale ProviderMatrix/Gateway-/Adapter-Governance bringen.
4. Category-/instrument-spezifische Commodity Feature Contracts als Challenger-Modelle definieren.

Diese Restpunkte dürfen die hier etablierte Orchestrator-Authority-Grenze nicht wieder aufweichen.
