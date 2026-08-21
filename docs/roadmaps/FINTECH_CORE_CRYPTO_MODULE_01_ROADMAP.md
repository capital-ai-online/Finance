# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 1.2.0  
**Status:** IN IMPLEMENTATION — FT-0 bis FT-3 umgesetzt; FT-4 als naechster Roadmap-Block  
**Owner-Prioritaet:** Chat-Prioritaet 2026-08-20; Synchronisierung/Projekt-Chat-Transfer 2026-08-21  
**Execution Branch:** `feat/fintech-core-ft3-durable-traceability-v2-2026-08-21`  
**Original Base:** `main@f1dff495fe792a4d4a26a3513f0525b4974bd349`  
**FT-3 Continuation Baseline:** `main@5595ec0abe1f1b6755620f3435badbf874d54aba`  
**Work Claim:** `FINTECH-CORE-FT3-DURABLE-TRACEABILITY-2026-08-21`  
**Primary Architecture Decision:** `ADR-0099`  
**Protected Scoring Authority:** `ADR-0087`, `SC-2`, `ScoringModelRegistry`, `ScoringDispatcher`

## 1. Ziel

Der Enterprise Crypto Orchestrator ist das erste fachliche Modul der CAPITAL-AI FinTech Core Engine. Er komponiert einen reproduzierbaren und auditierbaren Finanz-Workflow, ist aber weder Trading-Strategie noch zweite Scoring-Engine.

Der Scope umfasst:

- kategoriespezifische Crypto-Analyseprofile,
- provenance-faehige Feature-/Evidence-Contracts,
- technische Pattern- und Multi-Timeframe-Analyse,
- asset-/timeframe-/regime-spezifische Pattern Reliability,
- durable Workflow-/Event-/Decision-Evidence,
- spaetere Risk-/Compliance-/Execution-/Reconciliation-Gates.

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
10. `public.outbox_jobs` bleibt die bestehende Queue-/Lease-Authority; FT-3 fuehrt keine zweite Queue ein.
11. Das private Schema `fintech_core` wird nicht fuer Browserrollen geoeffnet.
12. Service-seitige Persistenz bleibt fail-closed und fuehrt keine Execution-Side-Effects aus.

## 3. Main-Korrelation 2026-08-21

Der Foundation-Branch wurde vor PR #467 gegen `main@95dea79cb6c67d7925af2b4c6df59c53baf2b46f` synchronisiert. PR #467 wurde anschliessend gemergt und machte die FT-0..FT-2C-Vertraege sowie ADR-0099 auf `main` kanonisch.

Aktuelle FT-3-Baseline:

`main@5595ec0abe1f1b6755620f3435badbf874d54aba`

Der urspruengliche FT-3-Persistenzbranch war nach dem Merge 69 Commits hinter `main`. Statt Force-Rebase/Overwrite wurde ein neuer Fortsetzungsbranch direkt vom aktuellen `main` erstellt und die verifizierten FT-3-Artefakte dort sauber uebernommen.

## 4. Aktueller Implementierungsstand

| Phase | Status | Evidenz |
|---|---|---|
| FT-0 Contract Freeze & Governance Baseline | DONE | `FT0_CRYPTO_MODULE_FOUNDATION_2026-08-20.md` |
| FT-1 FinTech Core Engine Foundation | DONE | `FT1_CORE_ENGINE_FOUNDATION_2026-08-20.md` |
| FT-2A Crypto Category Profile Resolution | DONE | `FT2A_CRYPTO_CATEGORY_PROFILE_RESOLUTION_2026-08-20.md` |
| FT-2B Category-specific Feature Contracts | DONE | `FT2B_CRYPTO_CATEGORY_FEATURE_CONTRACTS_2026-08-20.md` |
| FT-2C Technical Pattern Engine Foundation | DONE | `FT2C_PATTERN_ENGINE_FOUNDATION_2026-08-20.md` |
| FT-3 Durable Workflow & Traceability | DONE | `FT3_DURABLE_WORKFLOW_TRACEABILITY_2026-08-21.md` |
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
- fail-closed Research-/Scoring-Trennung,
- ADR-Namespace-Korrelation auf `ADR-0099` bei stabiler Authority-ID.

## 6. FT-1 — DONE

Umgesetzt:

- `FinTechCoreEngine`,
- `FinTechCoreModuleRegistry`,
- `FinTechCoreModule` Contract,
- `WorkflowContext`, `DomainEvent`, `DecisionRecord`, `OrderIntent`,
- deterministische `WorkflowStateMachine`,
- Crypto Module Descriptor `fintech-core.crypto`,
- Runtime-Modi fuer die Foundation nur `RESEARCH` und `PAPER`,
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
- deterministische Multi-Timeframe-/Kontextaufloesung,
- `PatternResearchEngine`,
- Walk-forward-/Out-of-sample- und Kostenparameter als Research-Validation-Gates,
- Konflikte bleiben explizite `CONFLICTING_EVIDENCE`,
- kein synthetischer Pattern-Composite-Score,
- `scoreEligible=false`, `executionEligible=false`, `authority=RESEARCH_CONTEXT_ONLY`.

### Offene FT-2C-Folgeschritte

- 1h/4h-Pattern nur nach Reliability-/Conflict-Gate als begrenztes Feature weiterfuehren,
- kein Double Counting zwischen Timeframes/Pattern-Evidence,
- externe Detector-Bibliothek erst nach separatem PoC und Supply-Chain-/Lizenzpruefung,
- TA-Lib bleibt bevorzugter PoC-Kandidat, ist aber keine aktuelle Dependency.

## 10. FT-3 — Durable Workflow & Traceability — DONE

### 10.1 Private Persistenz

Produktiv vorhanden:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Eigenschaften:

- privates Schema;
- RLS als Defense in Depth;
- `anon`/`authenticated` ohne Schema-Zugriff;
- `service_role` mit Least Privilege;
- append-only Event-/Decision-/OrderIntent-/Reconciliation-Evidence;
- immutable Workflow-Identitaet/-Kontext;
- Workflow-Lifecycle-Updates nur fuer `status`, `sequence`, `updated_at`, `completed_at`;
- Correlation-/Trace-/FK-Indexes fuer Audit-Rekonstruktion.

### 10.2 Wiederverwendung

Weiterhin fuehrend:

- `public.outbox_jobs`,
- `public.agent_audit_events`,
- `public.score_snapshots`,
- bestehende Traceability/EventMesh-Vertraege.

`pgmq` oder eine andere zweite Queue-Authority wurde nicht eingefuehrt.

### 10.3 Application Persistence Boundary

Neu:

- `FinTechCorePersistencePort` als storage-agnostischer Domain-Port;
- `server/fintechCorePersistence.ts` als privilegierter Supabase-Adapter;
- fuenf versionierte `public` RPCs als schmale serverseitige Entry-Points.

Die RPCs:

- sind `SECURITY INVOKER`,
- sind nur fuer `service_role` ausfuehrbar,
- geben `anon`/`authenticated` kein EXECUTE,
- oeffnen das private Schema nicht fuer Browser/Data API,
- erzwingen idempotente Replays bzw. Compare-and-Set bei Workflow-Transitions,
- fuehren keine Order aus.

### 10.4 Production Verification

Produktionsmigrationen:

- `20260821000550` — `fintech_core_durable_traceability`
- `20260821000558` — `fintech_core_durable_traceability_least_privilege`
- `20260821000716` — `fintech_core_fk_indexes`
- `20260821003628` — `fintech_core_rpc_persistence_boundary`

Verifiziert:

- service-role-only Function EXECUTE;
- `SECURITY INVOKER` fuer alle fuenf RPCs;
- idempotente Create-/Event-/Decision-/OrderIntent-Replays;
- compare-and-set Workflow Transition und Replay;
- conflicting Event-ID/Payload wird abgelehnt;
- keine Verifikationsdaten nach Rollback;
- keine neuen `fintech_core` Security-Advisor-Findings;
- keine unindexierten `fintech_core` Foreign Keys.

### 10.5 Bewusst nicht in FT-3 erfunden

Der DB-Scaffold fuer `reconciliation_records` ist vorhanden. Ein typed Application-Reconciliation-Contract wird erst in FT-6 eingefuehrt, weil die aktuell kanonischen FinTechCore-Vertraege noch keine Settlement-/Custody-Semantik definieren.

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
- typed Reconciliation-/Settlement-Vertrag,
- Reconciliation- und Crash-/Duplicate-Tests.

### FT-7 Guarded Live

Blockiert bis FT-0..FT-6 bestanden sind. Genau ein CEX-Adapter, Human Approval, Kill Switch, Circuit Breakers und keine Agent-Key-Capability.

### FT-8 Enterprise Hardening

BCP/DR, Custody-Boundary, Multi-Venue, OpenTelemetry/W3C Trace Context, SLOs, Audit Retention, Chaos/Failover und regulatorische Exportfaehigkeit.

### FT-9 DeFi / DEX / Cross-Chain

DEX/Aggregator-, Smart-Contract-, Bridge-, Oracle- und Cross-Chain-Risk/Settlement-Gates.

## 12. Offene Projekt-Chat-Punkte

Noch nicht als erledigt markiert:

- erneute externe/Drive-Quellpruefung, falls konkrete Formeln erforderlich werden,
- privater Storage-/Evidence-Bucket,
- Pattern-Badge-/UI-Integration,
- produktive Risk-/Compliance-/Execution-Adapter,
- Guarded Live/Production,
- FT-4 bis FT-9,
- Merge des FT-3-PRs.

## 13. Security / Compliance / Data Integrity

Weiterhin verpflichtend:

- fail-closed bei fehlender/staler Evidence oder Persistenzfehlern,
- keine zweite Scoring Authority,
- keine direkte LLM-/Agent-Side-Effect-Capability,
- Idempotency vor Side-Effect-Retry,
- provenance-faehige Evidence,
- klare Runtime-Modi,
- Least Privilege und private financial persistence,
- Human/Governance-Gates fuer spaetere produktive Mutationen.

## 14. Open Source / Plugins

- Bestehende Repository-Funktionen bleiben fuehrend.
- GitHub wird fuer Branch-/Registry-/PR-Governance genutzt.
- Supabase/PostgreSQL ist die bestehende FT-3-Persistenzplattform.
- Kein neuer Postgres-Client wurde aufgenommen; `@supabase/supabase-js` plus bestehender privilegierter Server-Client werden wiederverwendet.
- TA-Lib bleibt BSD-3-Clause-PoC-Kandidat fuer spaetere technische Indikator-/Candlestick-Primitives; keine aktuelle Integration.
- Projektspezifische Context-/Reliability-/Governance-Semantik bleibt CAPITAL-AI-eigene Schicht.

## 15. Naechster fachlicher Schritt

Nach FT-3 ist **FT-4 Research & Paper Trading** der naechste fachliche Roadmap-Block. Vor dessen Umsetzung ist der FT-3-Branch gemaess Governance erneut gegen den dann aktuellen `main` zu korrelieren und ueber einen eigenen PR mit Post-PR-CI zu validieren.
