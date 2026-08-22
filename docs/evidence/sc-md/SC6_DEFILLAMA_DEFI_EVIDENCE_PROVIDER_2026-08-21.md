# SC-6 — DeFiLlama DeFi-Evidence-Provider (ADR-0100)

- **Datum:** 2026-08-21
- **Branch:** `claude/defillama-defi-provider-9ny9py`
- **Authority:** ADR-0100 (DeFiLlama als ergänzender kanonischer DeFi-Evidence-Provider), ADR-0041 (Market-Data Provider &amp; MCP Architecture), ADR-0087 (Single Scoring Architecture)

## Zusammenfassung

DeFiLlama (Free-Tier, `https://api.llama.fi`, kein API-Key) ist als ergänzender, nicht-gateway-gerouteter Evidence-Provider für DeFi-Protokoll-TVL, -Fees und -Revenue angebunden. Rollout-Stufe: **evidence_only** (kein Scoring-Konsument existiert).

## Wiederverwendete Komponenten

| Komponente | Quelle | Verwendung |
|---|---|---|
| `CircuitBreaker` | `src/platform/MarketData/CircuitBreaker.ts` | unverändert wiederverwendet, eigene Circuit-Instanz für `defillama` |
| `RateLimitBudget` | `src/platform/MarketData/RateLimitBudget.ts` | unverändert wiederverwendet, Policy aus `ProviderMatrix`-Eintrag |
| `ProviderMatrix` | `src/platform/MarketData/ProviderMatrix.ts` | +1 Eintrag `defillama` (`gatewayStatus: 'not_wired'`), Version 1.4.0 → 1.5.0 |
| `CryptoFeatureEvidence` | `src/platform/FinTechCore/Modules/Crypto/CryptoCategoryFeatureContracts.ts` | Ziel-Contract, unverändert; Feature-Keys `protocol.tvlUsd`/`feesUsd`/`revenueUsd` bereits vordefiniert |
| Asset-Alias-Konvention | `src/lib/assetRegistry.ts` (`CRYPTO_COINGECKO_IDS`-Muster) | neue `CRYPTO_DEFILLAMA_SLUGS`-Map im selben Stil |
| `recordProviderHealth()` | `src/platform/Supervisor/providerHealth.ts` | unverändert wiederverwendet für Observability |

## Neue Dateien

- `src/platform/MarketData/providers/DefiLlamaProtocolProvider.ts` — HTTP-Client (Protokoll-TVL, Fees/Revenue), eigener TTL-Cache, Retry mit exponentiellem Backoff (Muster aus `src/services/cryptoHistoryProvider.ts`).
- `src/platform/FinTechCore/Modules/Crypto/Adapters/DefiLlamaProtocolFeatureAdapter.ts` — reiner Mapping-Adapter (keine I/O, kein Score), analog `VerifiedCryptoSnapshotFeatureAdapter.ts`.
- `src/services/defiProtocolEvidence.ts` — öffentlicher Einstiegspunkt (Symbol → Slug → Provider → Adapter), analog `cryptoQuoteEvidence.ts`.

## Endpunkte (P3-Rollout, gestaffelt)

Aktiviert: `/protocol/{protocol}` (TVL), `/overview/fees` (Fees/Revenue). Bewusst noch nicht aktiviert in dieser Iteration: `/v2/chains`, `/v2/historicalChainTvl`, `/stablecoins`, `/pools`, `/overview/dexs`, `/overview/open-interest` — folgen gemäß Rollout-Regel „nicht alle Endpunkte gleichzeitig" nach Qualitätsbewertung dieser ersten Stufe.

## Zero-Interpolation-Nachweis

- Fehlende/negative/nicht-endliche TVL- oder Fees-/Revenue-Werte werden nie zu `0` oder einem erfundenen Wert — sie bleiben `null` mit Status `NOT_AVAILABLE`/`INVALID` und explizitem `reason` (siehe `tests/unit/defiLlamaProtocolProvider.test.ts`, Tests „never coerces a missing/negative/non-finite TVL to zero").
- Ein zwischengespeicherter Wert wird nach TTL-Ablauf nur innerhalb einer festen 6h-Freshness-Grenze als `STALE` ausgeliefert, danach `NOT_AVAILABLE` (kein unbegrenztes „letzter bekannter Wert").
- Uneindeutige oder fehlende Slug-Zuordnung liefert `UNSUPPORTED_ASSET`/`NOT_AVAILABLE`, nie eine geratene Fee-/Revenue-Zuordnung (exakter Slug-Match, keine Fuzzy-Logik).

## Tests

- `tests/unit/defiLlamaProtocolProvider.test.ts` (13 Tests): Normalisierung, Schema-/Nullwert-/Negativwert-Behandlung, Feature-Flag-Kill-Switch, Retry/Backoff, Circuit-Breaker-Öffnung, Cache-Hit, Last-Known-Good/Stale-Grenze, Timeout/Invalid-JSON.
- `tests/unit/defiLlamaProtocolFeatureAdapter.test.ts` (7 Tests): reines Mapping, degraded/STALE-Kennzeichnung, Zero-Interpolation.
- `tests/unit/defiProtocolEvidence.test.ts` (6 Tests): Symbol→Slug-Auflösung, Feature-Flag, READY/PARTIAL/SOURCE_UNAVAILABLE-Statusableitung.
- `tests/unit/providerMatrix.test.ts` (+1 Test): neuer Matrix-Eintrag bleibt außerhalb von Gateway-Routing/Rate-Limit-Vererbung; bestehende Provider-Einträge unverändert (Regression).
- Vollständiger lokaler Lauf zum Zeitpunkt dieser Evidence: `npx vitest run tests/unit` → 271 Testdateien, 1679 Tests bestanden (0 Fehler), `tsc --noEmit` fehlerfrei.

## Bewusst nicht umgesetzt (Scope-Grenzen)

- **Kein Scoring-Wiring:** kein Aufruf von `ScoringModelRegistry`/`ScoringDispatcher`; `defillama_scoring_features_enabled` ist als Name reserviert, aber ohne lesenden Code-Pfad (siehe ADR-0100).
- **Kein UI/PDF/API-Oberflächenanschluss** in dieser Iteration — `fetchDefiProtocolEvidence()` ist aufrufbar, aber noch nicht in eine Route/Komponente verdrahtet. Das ist eine bewusste, dokumentierte Folgearbeit, kein Versehen.
- **Kein Pro-Tier:** `pro-api.llama.fi` wird nicht verwendet, kein `DEFILLAMA_API_KEY` existiert im Repository.
