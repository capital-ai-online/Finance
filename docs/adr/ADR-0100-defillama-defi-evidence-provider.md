# ADR-0100 — DeFiLlama als ergänzender kanonischer DeFi-Evidence-Provider

- **Authority ID:** `AUTH-ADR-DEFILLAMA-DEFI-EVIDENCE-PROVIDER-2026-08-21`
- **Version:** 1.1.0
- **Date:** 2026-08-22
- **Lifecycle:** accepted
- **Current Main Baseline:** `571de76e4d5f1d33460bf129d2231885dfde9584`
- **Supersession package:** `SC2_MEME_DEFI_MODEL_SUPERSESSION_2026-08-22`
- **Supersedes:** same-authority `1.0.0 / proposed` projection
- **Protected authorities:** ADR-0041 (Enterprise Market-Data Provider & MCP Architecture), ADR-0087 / SC-2 Single Scoring Architecture, ADR-0099 FinTech Core Crypto Module 01

## Kontext

CAPITAL-AI besitzt bereits eine kanonische Marktdaten-Architektur (`src/platform/MarketData/*`: `ProviderRegistry`, `ProviderMatrix`, `MarketDataGateway` mit wiederverwendbarem `CircuitBreaker`/`MarketDataCache`/`RateLimitBudget`/`RequestCoalescer`, Contract `market-data/1.0.0`, ADR-0041) sowie eine FinTechCore-Evidence-Schicht (`CryptoFeatureEvidence`, `CryptoCategoryFeatureContracts.ts`).

DeFiLlama liefert protokoll-/chain-bezogene DeFi-Kennzahlen. Diese Daten passen nicht auf die Spot-Snapshot-Semantik `MarketDataProvider.getSnapshot({symbol, assetClass})` und dürfen deshalb weder in den bestehenden MarketDataGateway hineingezwungen noch direkt zu Score-Evidence aufgewertet werden.

Die offizielle DeFiLlama-API-Dokumentation wurde am 2026-08-22 erneut verifiziert (`https://api-docs.defillama.com/llms.txt`): Free API und Pro API sind getrennte Services; die Free API verwendet `https://api.llama.fi` ohne Authentisierung und enthält unter anderem `/protocol/{protocol}` sowie `/overview/fees`. Die Pro API verwendet `https://pro-api.llama.fi/{KEY}` und ist kostenpflichtig. Diese ADR autorisiert weiterhin ausschließlich die Free API.

Geschützte Scoring-Kette (unverändert):

```text
verified Evidence / Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
```

## Entscheidung

DeFiLlama ist als **ergänzender Evidence-Provider** akzeptiert. Die bestehende Implementierung bleibt innerhalb der vorhandenen Authorities:

1. **Kein neues Provider-Interface.** `DefiLlamaProtocolProvider` implementiert bewusst nicht `MarketDataProvider`, weil Protocol-TVL/Fees/Revenue keine Spot-Snapshot-Semantik besitzen. Wiederverwendet werden bestehende `CircuitBreaker`, `RateLimitBudget` und Supervisor-Provider-Health-Bausteine.
2. **Kanonisches Provider-Inventar.** `ProviderMatrix` führt `defillama` mit `gatewayStatus: 'not_wired'` und Capability `fundamentals`. Es entsteht kein zweites Market-Data-Gateway.
3. **Evidence statt Score.** `defiProtocolEvidence.ts` löst nur kuratierte `CRYPTO_DEFILLAMA_SLUGS` auf und mappt `/protocol/{slug}` sowie `/overview/fees` über `DefiLlamaProtocolFeatureAdapter.ts` auf `CryptoFeatureEvidence` (`protocol.tvlUsd`, `protocol.feesUsd`, `protocol.revenueUsd`).
4. **Free-Tier ausschließlich.** Basis-URL `https://api.llama.fi`, kein API-Key, kein Secret. Eine Pro-Anbindung benötigt eine separate Kosten-/Security-/Secret-Management-Entscheidung.
5. **Zero-Interpolation.** Fehlende, negative, nicht-finite oder nicht eindeutig zuordenbare Werte werden nie durch 0, PASS oder einen künstlichen Neutralwert ersetzt.
6. **Freshness fail-closed.** Service-Contract `defi-protocol-evidence/1.1.0` unterscheidet `READY`, `PARTIAL`, `STALE` und `SOURCE_UNAVAILABLE`. `READY` wird ausschließlich ausgegeben, wenn alle emittierten Features `VERIFIED` sind. Ein vollständig stale Evidence-Set wird explizit `STALE` und ist nicht score-admissible.
7. **Kein Scoring-Wiring.** DeFiLlama ruft weder `ScoringModelRegistry` noch `ScoringDispatcher` auf. Der DeFi-Challenger bleibt `scoreEligible=false` und `research-only:not-executable`.
8. **Korrelationskontrolle.** TVL, Fees und Revenue werden im Supersession-B-Research-Contract derselben Korrelationsgruppe `defi-scale-activity` zugeordnet. Sie dürfen bei einer späteren Modellpromotion nicht ohne validierte De-Korrelation/Latent-Factor-Transformation unabhängig additiv gewichtet werden.

### Free versus Pro

| Kriterium | Free (`api.llama.fi`) | Pro (`pro-api.llama.fi/{KEY}`) |
|---|---|---|
| Authentisierung | keine | API-Key erforderlich |
| Kosten | keine | laut DeFiLlama-Dokumentation aktuell kostenpflichtig |
| Autorisiert durch diese ADR | **Ja** | **Nein** |
| TVL | `/protocol/{protocol}` | Free-Endpunkte mit Pro-Prefix plus zusätzliche APIs |
| Fees/Revenue | `/overview/fees` | Free-Endpunkte mit Pro-Prefix plus zusätzliche APIs |
| Secret-Management | keines | erforderlich; separate Entscheidung nötig |

### Rollout-Stufen

- `DEFILLAMA_PROVIDER_ENABLED` — HTTP-Provider Kill-Switch.
- `DEFILLAMA_EVIDENCE_ENABLED` — Evidence-Auslieferung Kill-Switch.
- Eine Scoring-Aktivierung existiert bewusst nicht. Ein künftiger Scoring-Flag darf erst zusammen mit einer explizit reviewten Modellpromotion eingeführt werden.

### Verworfene Alternativen

- **DeFiLlama als `MarketDataProvider` im Gateway registrieren:** verworfen, da Protocol-Evidence fachlich keine Spot-Snapshot-Semantik besitzt.
- **Neuer DeFi-Dispatcher/Orchestrator:** verworfen; Verstoß gegen ADR-0087.
- **Direkte DeFiLlama-to-Score-Verbindung:** verworfen; Provider-Evidence darf das Feature-/DQ-/Registry-Gate nicht umgehen.
- **TVL, Fees und Revenue als drei unabhängige positive Score-Faktoren:** verworfen, bis eine validierte De-Korrelation/Latent-Factor-Transformation nachgewiesen ist.

## Supersession-B Modellgrenze

Der Registry-Challenger `crypto-defi-fundamental@0.2.0` verwendet `crypto-defi-research-features/0.2.0` als Research-Feature-Contract. Der Contract enthält **keine ausführbaren Gewichte** und kann keinen `CanonicalScoreResult` erzeugen.

Promotion setzt mindestens voraus:

1. explizite Owner-Freigabe;
2. bestehende `ScoringModelRegistry` / `ScoringDispatcher` Authority;
3. protokoll-/token-sichere Identity-Zuordnung;
4. DQ/Freshness-Gates für alle REQUIRED/HARD_GATE-Features;
5. versionierte Gewichte und Effective-Feature-/Effective-Weight-Fingerprints;
6. Behandlung von Forks, Multi-Chain-Deployments und double-counted TVL;
7. dokumentierte Challenger-vs-Champion-Validierung.

## Folgen

- DeFiLlama bleibt Evidence-only und außerhalb Ranking-, Eligibility-, Order- und Execution-Authority.
- Die bestehende Binance/CoinGecko-Preispriorität bleibt unverändert.
- `CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.
- Keine neue Queue, Datenbank, Registry, Dispatcher-, Supervisor- oder Persistence-Authority.
- Stale Evidence ist explizit und kann keine REQUIRED/HARD_GATE-Semantik erfüllen.

## Rollback

Codeänderungen sind per Git-Revert rücksetzbar. Operativ können `DEFILLAMA_PROVIDER_ENABLED=false` oder `DEFILLAMA_EVIDENCE_ENABLED=false` die Evidence-Akquisition abschalten. Es erfolgt keine Datenbank-/Schema-/Secret-/Render-Mutation und kein historisches Evidence-Delete.
