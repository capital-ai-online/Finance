# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 1.1.0  
**Status:** IN IMPLEMENTATION — FT-0 bis FT-2C umgesetzt; FT-3 als naechstes persistentes Gate  
**Owner-Prioritaet:** Chat-Prioritaet 2026-08-20; Synchronisierung/Projekt-Chat-Transfer 2026-08-21  
**Execution Branch:** `feat/fintech-core-crypto-module-01`  
**Original Base:** `main@f1dff495fe792a4d4a26a3513f0525b4974bd349`  
**Current Sync Baseline:** `main@95dea79cb6c67d7925af2b4c6df59c53baf2b46f`  
**Work Claim:** `FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`  
**Primary Architecture Decision:** `ADR-0099` (`proposed`; remapped from the pre-reservation FinTech draft ADR-0098 after namespace collision with Media Project v2)  
**Protected Scoring Authority:** `ADR-0087`, `SC-2`, `ScoringModelRegistry`, `ScoringDispatcher`

## 1. Ziel

Der Enterprise Crypto Orchestrator ist das erste fachliche Modul der CAPITAL-AI FinTech Core Engine. Er komponiert einen reproduzierbaren und auditierbaren Finanz-Workflow, ist aber weder Trading-Strategie noch zweite Scoring-Engine.

Der Scope umfasst:

- kategoriespezifische Crypto-Analyseprofile,
- provenance-faehige Feature-/Evidence-Contracts,
- technische Pattern- und Multi-Timeframe-Analyse,
- asset-/timeframe-/regime-spezifische Pattern Reliability,
- spaetere Risk-/Compliance-/Execution-/Reconciliation-Gates,
- durable Workflow- und Decision-Evidence ab FT-3.

## 2. Nicht verhandelbare Architektur-Invarianten

1. Produktive Scores entstehen ausschliesslich ueber `ScoringModelRegistry -> ScoringDispatcher -> CanonicalScoreResult`.
2. `CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.
3. Category-/Pattern-Analyse liefert Evidence/Features, keine direkte Kapitalentscheidung.
4. Missing oder stale Evidence wird nicht synthetisch zu `0`, `PASS` oder einer Erfolgswahrscheinlichkeit umgedeutet.
5. Pattern Reliability ist exact-key gebunden an Asset, Profil, Timeframe, Regime, Pattern und Validation-Version.
6. FinTech Core ersetzt keine IAM-, Compliance-, Quality-, Governance-, Supervisor-, Release- oder Deployment-Authority.
7. Side-effecting Actions benoetigen vor Retry end-to-end Idempotency.
8. `GUARDED_LIVE` und `PRODUCTION` bleiben blockiert, bis die spaeteren Gates explizit erfuellt sind.
9. EventMesh ist kein alleiniger Financial Ledger.
10. Keine produktive Supabase-/Render-/Exchange-/Custody-Mutation in FT-0 bis FT-2C.

## 3. Main-Korrelation 2026-08-21

Vor dem Sync war der Branch 62 Commits vor und 135 Commits hinter `main`.

Direkt relevante neue Main-Regeln:

- ADR-0098 ist auf `main` fuer `Media Project v2 Timeline Contract` belegt.
- `docs/adr/registry.json` verlangt fuer neue ADRs eine nachvollziehbare Namespace-Reservierung.
- Governance-/Documentary- und PR-Baseline-Regeln auf `main` bleiben fuehrend.

Folge fuer diesen Workstream:

- der FinTech-Draft wird auf `ADR-0099` remapped,
- historische FT-0..FT-2C-Evidence bleibt erhalten,
- das Sync-Evidence-Dokument erklaert die historische ADR-0098-Referenz eindeutig,
- keine neue parallele Scoring-, Queue- oder Governance-Authority wird eingefuehrt.

## 4. Aktueller Implementierungsstand

| Phase | Status | Evidenz |
|---|---|---|
| FT-0 Contract Freeze & Governance Baseline | DONE | `FT0_CRYPTO_MODULE_FOUNDATION_2026-08-20.md` |
| FT-1 FinTech Core Engine Foundation | DONE | `FT1_CORE_ENGINE_FOUNDATION_2026-08-20.md` |
| FT-2A Crypto Category Profile Resolution | DONE | `FT2A_CRYPTO_CATEGORY_PROFILE_RESOLUTION_2026-08-20.md` |
| FT-2B Category-specific Feature Contracts | DONE | `FT2B_CRYPTO_CATEGORY_FEATURE_CONTRACTS_2026-08-20.md` |
| FT-2C Technical Pattern Engine Foundation | DONE | `FT2C_PATTERN_ENGINE_FOUNDATION_2026-08-20.md` |
| FT-3 Durable Workflow & Traceability | PLANNED | Migration/Security Review ausstehend |
| FT-4 Research & Paper Trading | PLANNED | nach FT-3 |
| FT-5 Deterministic Risk + Compliance | PLANNED | nach FT-4 |
| FT-6 OrderIntent & Reconciliation | PLANNED | nach FT-5 |
| FT-7 Guarded Live / Single CEX | BLOCKED | FT-0..FT-6 muessen bestehen |
| FT-8 Enterprise Production Hardening | PLANNED | nach Guarded-Live-Gates |
| FT-9 DeFi / DEX / Cross-Chain | PLANNED | spaetere Expansion |

## 5. FT-0 — DONE

Umgesetzt:

- Work Claim und Roadmap,
- Core-/Crypto-Contract-Versionen,
- Operating-Mode-Contract,
- Category Analysis Profile Contract,
- Pattern-/Reliability-/Validation-Contracts,
- Authority-Boundary-Tests,
- fail-closed Research-/Scoring-Trennung.

Governance-Migration beim 2026-08-21-Sync:

- FinTech ADR von der historischen Vorreservierungsnummer `ADR-0098` auf `ADR-0099` verschoben,
- aktueller Main-Stand und ADR-Registry-Regeln korreliert.

## 6. FT-1 — DONE

Umgesetzt:

- `FinTechCoreEngine`,
- `FinTechCoreModuleRegistry`,
- `FinTechCoreModule` Contract,
- `WorkflowContext`, `DomainEvent`, `DecisionRecord`, `OrderIntent`,
- deterministische `WorkflowStateMachine`,
- Crypto Module Descriptor `fintech-core.crypto`,
- Runtime-Modi fuer diese Phase nur `RESEARCH` und `PAPER`,
- explizite Trennung `RETRY_SAFE` / `SIDE_EFFECTING`.

Keine Exchange-/Custody-Side-Effects.

## 7. FT-2A — DONE

Umgesetzt:

- Wiederverwendung der kanonischen `CryptoCategory`,
- separater analytischer Profile-Layer,
- provenance-aware Primary-/Secondary-Profile,
- deterministic/evidence-backed Merge,
- Agent-/LLM-Research kann kein Secondary Profile promoten,
- Unknown/nicht belegte Klassen bleiben fail-closed.

## 8. FT-2B — DONE

Typed Feature-/Evidence-Contracts existieren fuer:

- Layer 1,
- Layer 2 / Rollup,
- DeFi,
- RWA,
- NFT,
- Stablecoin,
- Exchange Token,
- GameFi,
- AI/DePIN.

Der Verified-Crypto-Snapshot-Adapter ueberfuehrt nur universelle Markt-/Supply-Evidence. Marktvolumen, Market Cap, Supply oder Preisveraenderung ersetzen keine kategoriespezifische Evidence.

Meme bleibt ohne belastbare Spezialformel `PENDING_EVIDENCE`.

## 9. FT-2C — DONE als Research Foundation

Umgesetzt:

- detector-agnostischer OHLCV-/Pattern-SPI,
- immutable Exact-Key `PatternReliabilityRegistry`,
- deterministische Multi-Timeframe-/Kontextauflosung,
- `PatternResearchEngine`,
- Walk-forward-/Out-of-sample- und Kostenparameter als Research-Validation-Gates,
- Konflikte bleiben explizite `CONFLICTING_EVIDENCE`,
- kein synthetischer Pattern-Composite-Score,
- `scoreEligible=false`, `executionEligible=false`, `authority=RESEARCH_CONTEXT_ONLY`.

### Offene FT-2C-Folgeschritte

- 1h/4h-Pattern nur nach Reliability-/Conflict-Gate als begrenztes Feature weiterfuehren,
- kein Double Counting zwischen Timeframes/Pattern-Evidence,
- externe Detector-Bibliothek erst nach separatem PoC und Supply-Chain-/Lizenzpruefung,
- TA-Lib bleibt bevorzugter PoC-Kandidat, ist aber noch keine Dependency.

## 10. FT-3 — Durable Workflow & Traceability — PLANNED

Zielbild nach separatem Migration-/Security-Review:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Wiederverwendung vor Eigenentwicklung:

- `public.outbox_jobs`,
- `public.agent_audit_events`,
- `public.score_snapshots`,
- bestehende Traceability/EventMesh-Vertraege.

`pgmq` darf nicht parallel als zweite Queue-Authority eingefuehrt werden. Eine Konvergenz-/Ablosungsentscheidung braucht einen eigenen Architekturentscheid.

Vor einer produktiven Supabase-Mutation sind mindestens Schema-/Privilege-/RLS-/Security-Review und die dafuer vorgesehene Produktionsfreigabe erforderlich.

## 11. FT-4 bis FT-9

### FT-4 Research & Paper Trading

- durable/replay-faehiger Paper Workflow,
- explizit simulierte Balances,
- Fees/Slippage/Funding in Evidence,
- kein reales Kapital.

### FT-5 Deterministic Risk + Compliance

- Exposure-/Order-/Drawdown-/Liquidity-/Staleness-/Counterparty-Gates,
- KYC/KYB-/AML-/Sanctions-/Wallet-/Jurisdiction-Integrationspunkte,
- `OrderIntent` ohne Risk=APPROVED und Compliance=APPROVED unmoeglich.

### FT-6 OrderIntent & Reconciliation

- immutable/hash-bound OrderIntent,
- TTL und Price/Quantity/Slippage Bounds,
- Idempotency/Client-Order-ID,
- Reconciliation- und Crash-/Duplicate-Tests.

### FT-7 Guarded Live

Blockiert bis FT-0..FT-6 bestanden sind. Genau ein CEX-Adapter, Human Approval, Kill Switch, Circuit Breakers und keine Agent-Key-Capability.

### FT-8 Enterprise Hardening

BCP/DR, Custody-Boundary, Multi-Venue, OpenTelemetry/W3C Trace Context, SLOs, Audit Retention, Chaos/Failover und regulatorische Exportfaehigkeit.

### FT-9 DeFi / DEX / Cross-Chain

DEX/Aggregator-, Smart-Contract-, Bridge-, Oracle- und Cross-Chain-Risk/Settlement-Gates.

## 12. Offene Projekt-Chat-Punkte

Noch **nicht** als erledigt uebertragen:

- erneute Pruefung der externen/Drive-Quell-PDF, falls fuer konkrete Formeln erforderlich,
- FT-3 Supabase-Migration,
- privater Storage-/Evidence-Bucket,
- Pattern-Badge-/UI-Integration,
- produktive Risk-/Compliance-/Execution-Adapter,
- Render-/Supabase-Produktionsmutationen,
- Guarded Live/Production,
- PR/Merge.

## 13. Security / Compliance / Data Integrity

Der aktuelle Sync veraendert keine produktiven Finanzwerte und keine Laufzeitintegration ausserhalb des FinTechCore-Branch-Scopes.

Weiterhin verpflichtend:

- fail-closed bei fehlender/staler Evidence,
- keine zweite Scoring Authority,
- keine direkte LLM-/Agent-Side-Effect-Capability,
- Idempotency vor Side-Effect-Retry,
- provenance-faehige Evidence,
- klare Runtime-Modi,
- Human/Governance-Gates fuer spaetere produktive Mutationen.

## 14. Open Source / Plugins

- Bestehende Repository-Funktionen bleiben fuehrend.
- GitHub wird fuer Branch-/Registry-/PR-Governance genutzt.
- Supabase und Render werden erst in den dafuer vorgesehenen produktiven Phasen mutiert.
- TA-Lib: BSD-3-Clause, gepflegter PoC-Kandidat fuer Standard-Indikatoren/Candlestick-Primitives; keine Integration in diesem Sync.
- Projektspezifische Context-/Reliability-/Governance-Semantik bleibt CAPITAL-AI-eigene Schicht.

## 15. Naechster fachlicher Schritt

Nach Abschluss des Main-/Governance-Syncs ist **FT-3 Durable Workflow & Traceability** der naechste Roadmap-Block. Vor einer Migration werden bestehende Supabase-/Outbox-/Audit-Primitives erneut gegen den dann aktuellen `main` geprueft; es wird keine zweite Persistenz- oder Queue-Authority parallel aufgebaut.
