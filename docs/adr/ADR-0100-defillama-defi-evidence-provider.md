# ADR-0100 — DeFiLlama als ergänzender kanonischer DeFi-Evidence-Provider

- **Authority ID:** `AUTH-ADR-DEFILLAMA-DEFI-EVIDENCE-PROVIDER-2026-08-21`
- **Version:** 1.0.0
- **Date:** 2026-08-21
- **Lifecycle:** proposed
- **Branch:** `claude/defillama-defi-provider-9ny9py`
- **Current Main Baseline:** `6c90c04de8924b8783f23ab4789afa810e9ea3a8`
- **Supersedes:** none
- **Protected authorities:** ADR-0041 (Enterprise Market-Data Provider &amp; MCP Architecture), ADR-0087 / SC-2 Single Scoring Architecture, ADR-0099 FinTech Core Crypto Module 01

## Kontext

CAPITAL-AI besitzt bereits eine kanonische Marktdaten-Architektur (`src/platform/MarketData/*`: `ProviderRegistry`, `ProviderMatrix`, `MarketDataGateway` mit wiederverwendbarem `CircuitBreaker`/`MarketDataCache`/`RateLimitBudget`/`RequestCoalescer`, Contract `market-data/1.0.0`, ADR-0041) sowie eine FinTechCore-Evidence-Schicht (`CryptoFeatureEvidence`, `CryptoCategoryFeatureContracts.ts`), die für das `defi`-Analyseprofil bereits die Feature-Keys `protocol.tvlUsd`, `protocol.feesUsd` und `protocol.revenueUsd` definiert, aber bislang ohne Provider.

DeFiLlama liefert genau diese Kennzahlen kostenfrei über `https://api.llama.fi`, jedoch protokoll-/chain-bezogen statt symbol-bezogen — die Daten passen nicht auf die Snapshot-Semantik `MarketDataProvider.getSnapshot({symbol, assetClass})`, die für Spot-Preise gebaut ist.

`docs/roadmaps/FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` führt „FT-9 DeFi/DEX/Cross-Chain" ausdrücklich als `PLANNED`/„spätere Expansion", blockiert bis FT-0…FT-8 abgeschlossen sind. Diese Entscheidung darf dieses Gate nicht unterlaufen: es wird ausschließlich die Evidence-Grundlage geschaffen, nicht die Scoring-Konsumption.

Geschützte Scoring-Kette (unverändert):

```text
verified Evidence / Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
```

## Entscheidung

DeFiLlama wird als **eigenständiger, nicht-gateway-gerouteter Evidence-Provider** angebunden, der ausschließlich bestehende Bausteine wiederverwendet:

1. **Kein neues Provider-Interface.** `DefiLlamaProtocolProvider` (`src/platform/MarketData/providers/DefiLlamaProtocolProvider.ts`) implementiert bewusst **nicht** `MarketDataProvider` (Snapshot-Semantik passt nicht), reused aber `CircuitBreaker` und `RateLimitBudget` 1:1 aus `platform/MarketData` sowie einen endpunktspezifischen TTL-Cache im Stil der bestehenden Nicht-Gateway-Provider (`server/fmpIndices.ts`).
2. **`ProviderMatrix`-Eintrag `defillama`** (`gatewayStatus: 'not_wired'`, `capabilities: ['fundamentals']`) hält die Provider-Inventory kanonisch und einheitlich, ohne Gateway-Routing/Rate-Limit-Vererbung zu verändern (`rateLimitOverridesFromMatrix()`/`providersBehindGateway()` bleiben für bestehende Provider unverändert; siehe Test `tests/unit/providerMatrix.test.ts`).
3. **Evidence statt Snapshot.** `src/services/defiProtocolEvidence.ts` löst ein Registry-Symbol über die neue, kuratierte `CRYPTO_DEFILLAMA_SLUGS`-Alias-Map (`src/lib/assetRegistry.ts`, gleiches Muster wie `CRYPTO_COINGECKO_IDS`) auf ein DeFiLlama-Protokoll-Slug auf, ruft `/protocol/{slug}` (TVL) und `/overview/fees` (Fees/Revenue) ab und mappt das Ergebnis über den reinen Adapter `DefiLlamaProtocolFeatureAdapter.ts` (keine I/O, kein Score) auf `CryptoFeatureEvidence` für `protocol.tvlUsd`/`protocol.feesUsd`/`protocol.revenueUsd`.
4. **Free-Tier ausschließlich.** Basis-URL `https://api.llama.fi`, kein API-Key, kein Secret. `pro-api.llama.fi` wird nicht verwendet; ein Pro-Upgrade erfordert eine separate ADR-Ergänzung mit dokumentiertem fachlichem Bedarf, Kosten-Nutzen-Bewertung und Secret-Management-Konzept (`DEFILLAMA_API_KEY`, reserviert, aktuell nicht verwendet).
5. **Zero-Interpolation.** Fehlende, negative, `NaN`/`Infinity`- oder nicht auffindbare Werte werden nie durch 0 oder einen künstlichen Wert ersetzt; sie bleiben `null` mit Status `NOT_AVAILABLE`/`INVALID` und explizitem `reason`. Ein zwischengespeicherter Wert wird nur innerhalb einer festen Freshness-Grenze (6h) als `STALE` ausgeliefert, danach `NOT_AVAILABLE`.
6. **Kein Scoring-Wiring.** Diese Entscheidung führt **keine** Verbindung zu `ScoringModelRegistry`/`ScoringDispatcher` und **keinen** zweiten Dispatcher/Orchestrator ein. `CryptoOrchestrator` bleibt unverändert `scoreEligible=false`. Das FT-9-Roadmap-Gate bleibt bestehen; eine künftige Scoring-Aktivierung erfordert eine separate ADR-Ergänzung und explizite Owner-Freigabe.

### Free versus Pro

| Kriterium | Free (`api.llama.fi`) | Pro (`pro-api.llama.fi`) |
|---|---|---|
| Kosten | keine | kostenpflichtig |
| Secret-Management | keins nötig | `DEFILLAMA_API_KEY`, Secret-Rotation nötig |
| Abdeckung für P0-Endpunkte (TVL, Fees, Revenue) | vollständig | zusätzliche Endpunkte, aktuell kein fachlicher Bedarf |
| Rate-Limits | für den aktuellen Bedarf ausreichend (konservatives Matrix-Budget: 30/min) | höher |
| Entscheidung | **gewählt** | zurückgestellt, keine Freigabe erteilt |

### Rollout-Stufen

Feature-Flags (env-gelesen, `=== 'false'` schaltet ab, alles andere/unset bleibt an):

- `DEFILLAMA_PROVIDER_ENABLED` — schaltet den HTTP-Provider vollständig ab (P0-10 Kill-Switch).
- `DEFILLAMA_EVIDENCE_ENABLED` — schaltet die Evidence-Auslieferung ab (aktuelle Rollout-Stufe: **evidence_only**, kein Scoring-Konsument existiert).
- `defillama_scoring_features_enabled` — **reserviert, aktuell ohne Wirkung**: es existiert bewusst kein Code-Pfad, der diesen Namen liest, da keine Scoring-Konsumption implementiert wurde. Eine künftige FT-9-Anbindung muss diesen Flag zusammen mit einer ADR-Ergänzung einführen, statt eine wirkungslose Attrappe vorzuziehen.

### Verworfene Alternativen

- **DeFiLlama als `MarketDataProvider` im Gateway registrieren:** verworfen, da die Snapshot-Semantik (`symbol`→Preis) fachlich falsch für Protokoll-TVL/Fees wäre und eine erzwungene Passung mehr Verwirrung als Nutzen stiftet.
- **Neuer, eigenständiger DeFi-Dispatcher/Orchestrator:** verworfen — verstößt gegen die Single-Scoring-Architecture (ADR-0087) und die FinTechCore-Autoritätsgrenzen (ADR-0099).
- **Sofortige Scoring-Aktivierung für das `defi`-Profil:** verworfen, da FT-9 im Roadmap-Gate weiterhin blockiert ist; eine Umgehung wäre ein Governance-Konflikt (AGENTS.md §4).

## Folgen

- Neue Dateien: `DefiLlamaProtocolProvider.ts`, `DefiLlamaProtocolFeatureAdapter.ts`, `defiProtocolEvidence.ts`, zugehörige Unit-Tests.
- Geänderte Dateien: `ProviderMatrix.ts` (+1 Eintrag, Versionsbump), `assetRegistry.ts` (+`CRYPTO_DEFILLAMA_SLUGS`).
- Kein Effekt auf bestehende Scores, bestehende Provider-Priorität (Binance/CoinGecko) oder bestehende Snapshot-Konsumenten.
- Beobachtbarkeit über bestehenden `recordProviderHealth()`-Sink (Supervisor), keine neue Metrik-Pipeline.

## Rollback

Rollback erfordert kein Datenrollback: `DEFILLAMA_PROVIDER_ENABLED=false` (oder Nichteinbinden der neuen Module) stellt den Vorzustand vollständig wieder her, da kein bestehender Codepfad verändert wurde. Historische Evidence wird aus Auditgründen nicht rückwirkend gelöscht.
