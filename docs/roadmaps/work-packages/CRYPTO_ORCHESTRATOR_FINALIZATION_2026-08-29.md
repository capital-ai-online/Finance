# Crypto Orchestrator Finalization Work Package

**Document ID:** `WP-CRYPTO-ORCHESTRATOR-FINALIZATION-2026-08-29`  
**Version:** `1.0.0`  
**Lifecycle:** active  
**Owner:** CAPITAL-AI  
**Base:** `main@fd4c33905f45332f6ae11de6b80a6a3c20576c77`  
**Evidence:** `docs/evidence/sc-md/CRYPTO_ORCHESTRATOR_FINALIZATION_2026-08-29.md`

## Statusübersicht

| Paket | Status | Bemerkung |
|---|---|---|
| CV-0 Authority/View-Model | DONE | bestehende Authority-Grenze unverändert |
| CV-1 Score Command Center | DONE / EXISTING MAIN | kanonischer Score Hero und Authority-Semantik vorhanden |
| CV-2 Verified Market Chart v2 | SEPARATE FOLLOW-UP | Lightweight-Charts-/OHLCV-Spike bleibt separater Dependency-/Chart-Scope |
| CV-3 Factor & Model Explorer | CONTRACT COMPLETE / RUNTIME EVIDENCE PENDING | Hard-Gate-State-Vertrag ergänzt; keine Frontend-Reberechnung |
| CV-4 Evidence & Provenance Matrix | PRESENTATION FOUNDATION IMPLEMENTED | Runtime Provider-State bleibt evidence-gated |
| CV-5 Multi-Timeframe Lens | PRESENTATION FOUNDATION IMPLEMENTED | 1D/30 Bars canonical, andere Timeframes Research only |
| CV-6 Ranking Heatmap & Breadth | PRESENTATION FOUNDATION IMPLEMENTED | keine zweite Ranking-Berechnung; RankingBoard-View-Contract noch zu verdrahten |
| CV-7 Meme & DeFi Research Lenses | IMPLEMENTED + TOPOLOGY DEEPENED | spezialisierte Feature-Familien sichtbar, Runtime-Werte evidence-gated |
| CV-8 Derivatives / Market Structure | PRESENTATION FOUNDATION IMPLEMENTED | Funding/OI/Liquidity nur mit verifizierter Runtime-Evidence |
| CV-9 Accessibility / Performance | STATIC GATE IMPLEMENTED / LIVE MEASUREMENT PENDING | textuelle Zustände, Tabellenstruktur, keine neue Bundle-Dependency; axe/Lighthouse noch runtimebasiert |

## P1 Hard-Gate / Provider Completion

### Contract completion

- [x] Meme BUY/SELL simulation gate states typed.
- [x] Meme liquidity lock / transfer tax / contract integrity / manipulation policy typed.
- [x] Meme independent market confirmations typed with `>=2` requirement.
- [x] DeFi smart-contract / oracle / admin-mint / pause / upgrade-authority / exploit gate states typed.
- [x] Missing backend input => `NOT_COMPUTABLE`.
- [x] No gate state writes into canonical scoring.

### Real provider evidence still required

- [ ] GoPlus credential/entitlement evidence for real transaction simulation.
- [ ] governed route/calldata identity coverage.
- [ ] chain/asset coverage and freshness evidence.
- [ ] known-positive/negative honeypot validation set.
- [ ] exploit lifecycle/status authority.
- [ ] oracle liveness/deviation/manipulation evidence.
- [ ] external audit/formal-verification semantics.
- [ ] holder/entity clustering methodology.
- [ ] Binance/Kraken futures identity coverage.
- [ ] DEX Screener / DeFiLlama identity resolution.
- [ ] reviewed Dune query IDs/schema/freshness contracts.

Diese offenen Punkte dürfen nicht als erledigt markiert werden, solange reale Provider-/Runtime-Evidence fehlt.

## Model Promotion Gate

Meme/DeFi bleiben Challenger. Promotion wird nicht Bestandteil dieses Work Packages. Vor Promotion sind mindestens OOS/walk-forward TEVV, Stress-/Manipulations-/Exploit-/Liquidity-Shock-Evidence, Correlation-/Double-counting-Review und Owner Approval erforderlich.

## Visual follow-up boundary

Die in diesem Paket hinzugefügten Visuals bleiben bewusst dependency-frei und nutzen bestehende UI-Bausteine. CV-2 Financial Chart v2 bleibt der nächste separate Visual-PR, weil eine mögliche neue Financial-Chart-Library Lizenz-, Bundle-, A11y- und Performance-Gates auslöst.
