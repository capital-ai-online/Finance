# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 1.5.0  
**Status:** IN IMPLEMENTATION — FT-0 bis FT-5 umgesetzt; FT-6A Decision-bound OrderIntent & Reconciliation auf Branch implementiert  
**Owner-Prioritaet:** Chat-Prioritaet 2026-08-20; Finalisierung anhand Drive-Architekturquelle 2026-08-22  
**Execution Branch:** `feature/crypto-orchestrator-finalization-ft6-2026-08-22`  
**Current Main Baseline:** `main@d04270726c56c89cb2b8cab25570662c5d4480f4`  
**Drive Source:** `FinTech Enterprise Orchestration Modell_1881859777413601727.pdf` (`15TtZwH1be6si8mEuo7Xc6inq_e21brfa`)  
**Primary Architecture Decision:** `ADR-0099`  
**Protected Scoring Authority:** `ADR-0087`, `SC-2`, `ScoringModelRegistry`, `ScoringDispatcher`

## 1. Ziel

Der Enterprise Crypto Orchestrator komponiert einen reproduzierbaren und auditierbaren Finanz-Workflow, ist aber weder Trading-Strategie noch zweite Scoring-Engine. Der Scope umfasst Category-/Pattern-Evidence, durable Workflow-/Decision-Evidence, simuliertes Paper Accounting, deterministische Risk-/Compliance-Entscheidungen und kontrollierte OrderIntent-/Reconciliation-Gates.

Die Drive-Quelle wird als Architektur- und Best-Practice-Input genutzt. Sie ersetzt keine bestehende CAPITAL-AI-Authority. Insbesondere werden Trading-Execution, Custody, AML/KYC-Provider oder globale DQ-Grenzwerte nicht aus dem externen Dokument als parallele Runtime-Policy uebernommen.

## 2. Nicht verhandelbare Architektur-Invarianten

1. Produktive Scores entstehen ausschliesslich ueber `ScoringModelRegistry -> ScoringDispatcher -> CanonicalScoreResult`.
2. `CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.
3. Missing/stale Evidence wird nicht synthetisch zu `0`, `PASS` oder einer Erfolgswahrscheinlichkeit umgedeutet.
4. FinTech Core ersetzt keine IAM-, Compliance-Policy-, Quality-, Governance-, Supervisor-, Release- oder Deployment-Authority.
5. Side-effecting Actions benoetigen vor Retry end-to-end Idempotency.
6. `GUARDED_LIVE` und `PRODUCTION` bleiben blockiert, bis die spaeteren Gates explizit erfuellt sind.
7. `public.outbox_jobs` bleibt die Queue-/Lease-Authority; keine zweite Queue wird eingefuehrt.
8. Das private Schema `fintech_core` wird nicht fuer Browserrollen geoeffnet.
9. FT-4 Paper Trading verwendet ausschliesslich fiktives Kapital; Fees/Slippage/Funding sind explizite Evidence.
10. Paper State muss deterministisch aus append-only durable Events rekonstruierbar sein.
11. FT-5 Policy-Grenzwerte und erforderliche Controls kommen als versionierte externe Policy-Snapshots; der Core erfindet keine Rechts-/Business-Policy.
12. FT-5 akzeptiert keinen LLM-/Agent-Output als Risk-/Compliance-Freigabe.
13. PASS-Evidence muss an die erwartete Authority gebunden, provenance-faehig und frisch sein.
14. FT-5 produziert ausschließlich Decisions; `executionHandoffEligible=false` fuer **alle** Operating Modes.
15. FT-6 bindet FT-5 Decisions an einen `OrderIntent`, darf daraus aber keine reale Execution-Autorisierung ableiten.
16. FT-6A OrderIntent Binding ist `PAPER`-only.
17. Risk-/Compliance-Approval States im FT-6 OrderIntent werden aus append-only Decision Records abgeleitet und nicht vom Aufrufer gesetzt.
18. Decision IDs, Output Hashes, Workflow Identity, Policy Metadata, Bounds und Evidence werden deterministisch in den Intent Hash gebunden.
19. Reconciliation-Mismatch bleibt sichtbare Evidence und wird nicht automatisch repariert/promoviert.
20. DeFiLlama bleibt Evidence Acquisition; es besitzt keine direkte Order-, Score-, Ranking- oder Eligibility-Authority.

## 3. Main-Korrelation 2026-08-22

PR #475 etablierte auf `main@d04270726c56c89cb2b8cab25570662c5d4480f4` die aktuelle P0/P1 Scoring-/Universe-Baseline. Der zuvor konsolidierte PR #479 wurde extern geschlossen, aber nicht gemergt; sein validierter Head und die daran anschliessend geschriebenen FT-6-Commits wurden deshalb verlustfrei auf den branchbasierten Finalisierungsstand `feature/crypto-orchestrator-finalization-ft6-2026-08-22` uebernommen.

Der Finalisierungsbranch wurde nach Wiederherstellung erneut gegen `main` geprueft: Merge-Base ist exakt der aktuelle `main`-Stand, der Branch war bei Wiederherstellung `0 behind`. Die aus #479 uebernommenen Vocabulary-/DeFiLlama-Aenderungen bleiben damit dieselbe konsolidierte, additive Schicht; FT-6 baut darauf auf, ohne #475 zurueckzunehmen.

## 4. Aktueller Implementierungsstand

| Phase | Status | Evidenz |
|---|---|---|
| FT-0 Contract Freeze & Governance Baseline | DONE | `FT0_CRYPTO_MODULE_FOUNDATION_2026-08-20.md` |
| FT-1 FinTech Core Engine Foundation | DONE | `FT1_CORE_ENGINE_FOUNDATION_2026-08-20.md` |
| FT-2A Crypto Category Profile Resolution | DONE | `FT2A_CRYPTO_CATEGORY_PROFILE_RESOLUTION_2026-08-20.md` |
| FT-2B Category-specific Feature Contracts | DONE | `FT2B_CRYPTO_CATEGORY_FEATURE_CONTRACTS_2026-08-20.md` |
| FT-2C Technical Pattern Engine Foundation | DONE | `FT2C_PATTERN_ENGINE_FOUNDATION_2026-08-20.md` |
| FT-3 Durable Workflow & Traceability | DONE | `FT3_DURABLE_WORKFLOW_TRACEABILITY_2026-08-21.md` |
| FT-4 Research & Paper Trading | DONE | `FT4_RESEARCH_PAPER_TRADING_2026-08-21.md` |
| FT-5 Deterministic Risk + Compliance | DONE | `FT5_DETERMINISTIC_RISK_COMPLIANCE_2026-08-21.md` |
| FT-6A Decision-bound OrderIntent & Reconciliation | IMPLEMENTED ON BRANCH | `FT6A_ORDER_INTENT_RECONCILIATION_2026-08-22.md` |
| FT-6B Persistence / Paper-Fill Closure | PLANNED | nach FT-6A Hosted Validation |
| FT-7 Guarded Live / Single CEX | BLOCKED | FT-0..FT-6 muessen bestehen |
| FT-8 Enterprise Production Hardening | PLANNED | nach Guarded-Live-Gates |
| FT-9 DeFi / DEX / Cross-Chain | PLANNED | spaetere Expansion |

## 5. FT-0 bis FT-2C — DONE

FT-0 etabliert Contract-/Governance-/Authority-Baseline. FT-1 liefert `FinTechCoreEngine`, Module Registry, deterministic Workflow State Machine und die Modi `RESEARCH`/`PAPER`. FT-2A trennt kanonische Crypto-Taxonomie und provenance-aware Analysis Profiles. FT-2B liefert typed Category Feature/Evidence Contracts. FT-2C liefert detector-agnostische Pattern-Contracts, Exact-Key Reliability und Multi-Timeframe Research Resolution; Pattern bleibt `scoreEligible=false`, `executionEligible=false`, `RESEARCH_CONTEXT_ONLY`.

Offen aus FT-2C bleiben reliability-/conflict-gated 1h/4h-Promotion, Double-Counting-Schutz und ein spaeter separat gepruefter TA-Lib/Detector-PoC.

## 6. FT-3 — Durable Workflow & Traceability — DONE

Produktiv vorhanden:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Das Schema ist privat, RLS/Least Privilege bleibt aktiv, append-only Evidence und immutable Workflow-Identitaet werden erzwungen. `FinTechCorePersistencePort` bleibt storage-agnostisch; serverseitige RPCs sind `SECURITY INVOKER` und service-role-only. Bestehende `public.outbox_jobs`, `agent_audit_events`, `score_snapshots` und Traceability/EventMesh-Primitiven werden wiederverwendet.

## 7. FT-4 — Research & Paper Trading — DONE

FT-4 implementiert einen durable/replay-faehigen simulierten Workflow:

```text
operatingMode = PAPER
accountingMode = CASH_LONG_ONLY
real capital = false
exchange/custody side effects = false
```

### 7.1 Simulierte Balances und Kosten

Paper-Balances, Average Entry Price, Gross Realized PnL, Fees und Funding werden als JSON-safe Fixed-Point `atoms + scale` mit `BigInt` berechnet. Short Selling, Margin und Leverage sind nicht implementiert. Jeder Fill besitzt explizite Fee-/Slippage-/Funding-Evidence.

### 7.2 Deterministic Fill + Replay

`PaperTradingEngine.ts` simuliert BUY/SELL, blockiert unzureichenden Bestand, erzeugt `FinTechCoreDomainEvent`s und nutzt `paperSequence`/`causationId`. `PaperTradingWorkflowService.ts` rekonstruiert den aktuellen State vor jeder Simulation.

Es gibt keine zweite Paper-Ledger-Tabelle; Journal bleibt `fintech_core.domain_events`:

```text
PAPER_ACCOUNT_INITIALIZED   sequence 0
PAPER_FILL_SIMULATED        sequence 1..N
```

DB-Guards erzwingen kanonische Payload-/Sequence-Semantik, genau eine Initialisierung und Fill-Causation.

### 7.3 Replay Reader / Production Verification

Der read-only `FinTechCoreDomainEventReaderPort` nutzt `public.fintech_core_list_domain_events_v1(text)`, `SECURITY INVOKER`, service-role-only.

Verifiziert wurden RLS/Privileges, Guards/Unique Indizes, Replay-Reihenfolge, Duplicate-/Causation-Negativfaelle und die Trennung von Paper und Real Capital.

### 7.4 Open Source

QuantConnect LEAN und NautilusTrader wurden bewertet, aber fuer den engen Paper-Scope wegen ueberbreiter Runtime-/Execution-/Dependency-Flaeche nicht integriert.

## 8. FT-5 — Deterministic Risk + Compliance — DONE

### 8.1 Risk Gates

`RiskCompliance/DeterministicPreTradeGate.ts` bewertet:

```text
ORDER_NOTIONAL
GROSS_EXPOSURE
DRAWDOWN
LIQUIDITY
STALENESS
COUNTERPARTY
```

Grenzwerte kommen aus einem extern versionierten `FinTechCoreRiskPolicySnapshot`. Monetaere Werte verwenden FT-4 Fixed-Point/`BigInt`. Order-, Portfolio-, Liquidity-, Market- und Counterparty-Evidence besitzt eigene Provenance-/Authority-Bindung.

### 8.2 Compliance Integration Points

Typed Integrationspunkte:

```text
KYC
KYB
AML
SANCTIONS
WALLET_SCREENING
JURISDICTION
TRAVEL_RULE
```

`FinTechCoreCompliancePolicySnapshot` legt explizit fest, welche Controls erforderlich sind, welche Evidence Authority je Control zulaessig ist und wie alt Evidence maximal sein darf. Der Core erfindet weder rechtliche Anwendbarkeit noch Provider-Ergebnisse.

Control-Zustaende: `PASS`, `FAIL`, `MISSING`, `STALE`, `REVIEW_REQUIRED`. Nur frische, provenance-faehige und authority-bound PASS-Evidence kann `APPROVED` werden.

### 8.3 Fail-Closed Semantik

```text
REJECTED > NOT_COMPUTABLE > REVIEW_REQUIRED > APPROVED
```

Limit-/Counterparty-/Sanctions-Fail wird `REJECTED`; missing/stale/mismatched-authority Evidence wird `NOT_COMPUTABLE`; Human/Provider Review bleibt `REVIEW_REQUIRED`. Es gibt keine synthetischen PASS-/Zero-/Probability-Fallbacks.

### 8.4 Keine LLM-/Parallel-Authority

`CryptoRiskAgent` und andere AI-/Research-Komponenten duerfen Kontext liefern, aber keine FT-5-Freigabe autorisieren. `src/platform/Compliance` bleibt Repository-/ISO-Compliance-Komponente; ADR-0058 bleibt Agent-/Tool-Risk-Authorization. Architecture Tests blockieren direkte AI-/Agent-/Provider-/Exchange-Imports in der FT-5 Gate-Schicht.

### 8.5 Durable Decision Evidence Reuse

FT-5 fuehrt keine neue Tabelle ein. `RiskComplianceDecisionRecords.ts` mappt Ergebnisse in bestehende FT-3 `FinTechCoreDecisionRecord`s:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Policy-ID/-Version, Run/Trace/Correlation/Asset/Decision-Version, Hashes, Evidence-Refs und Outcome bleiben auditierbar.

### 8.6 Handoff zu FT-6

FT-5 erzeugt **keinen** execution-authorizing OrderIntent-Handoff. Der Contract erzwingt fuer jedes FT-5-Ergebnis:

```text
executionHandoffEligible = false
```

FT-6A darf nur die nachweislich `APPROVED`en Decision Records binden; es darf diese Entscheidung nicht neu berechnen oder von Agenten ersetzen lassen.

## 9. FT-6 — OrderIntent & Reconciliation

### 9.1 FT-6A — IMPLEMENTED ON BRANCH

Implementiert:

- `FinTechCoreBoundOrderIntent` als Erweiterung des vorhandenen FT-3 Intent-Scaffolds;
- Risk-/Compliance-Approval wird aus append-only FT-5 Decision Records abgeleitet;
- exakter Run-/Trace-/Correlation-/Module-/Asset-/DecisionVersion-Abgleich;
- Risk-/Compliance-Decision-ID und `outputHash` werden in den Intent gebunden;
- `clientOrderId` und `idempotencyKey`;
- TTL sowie Quantity-/Price-/Slippage-Bounds;
- deterministischer SHA-256 `intentHash` ueber Workflow-, Order-, Decision-, Policy- und Evidence-Identitaet;
- `PAPER`-only Domain Gate;
- `executionHandoffEligible=false`;
- typed `FinTechCoreReconciliationRecord`;
- Decision↔Intent Replay/Tamper Check `MATCHED`/`MISMATCH`;
- explizit keine Settlement-Finality und keine Real-Execution-Behauptung;
- private service-role-only SQL-Migration fuer Binding-Felder, Decision-FKs und Reconciliation-RPCs vorbereitet;
- Unit-/Persistence-/Architecture-Negativtests.

Die Migration `20260822002500_fintech_core_ft6_order_intent_reconciliation.sql` ist **nicht produktiv angewendet**.

### 9.2 FT-6B — PLANNED

Restarbeiten:

- separat autorisierte Migration Application + Production Verification;
- `ORDER_INTENT_PAPER_FILL` Reconciliation gegen FT-4 Replay;
- DB-Crash-/Duplicate-/Replay-Negativverifikation;
- finaler FT-6 Closure-Nachweis;
- kein Guarded-Live-Cutover in FT-6.

## 10. Drive-Architekturabgleich

Die Drive-Vorlage beschreibt u. a. Workflow-IDs, Data Quality, deterministic Risk, Compliance vor Execution, OrderIntent-Bounds, Execution/Reconciliation und Audit. CAPITAL-AI mappt dies wie folgt:

```text
Drive Orchestrator control plane
  -> FinTechCore workflow composition
Drive run/trace/strategy/portfolio/version
  -> FinTechCoreWorkflowContext
Drive Data Quality gate
  -> existing MarketEvidenceQualityRecord + versioned policy thresholds
Drive Risk / Compliance approval
  -> FT-5 deterministic decision records
Drive OrderIntent bounds
  -> FT-6A deterministic bound intent
Drive Reconciliation / Audit
  -> FT-6 typed append-only reconciliation evidence
```

Der beispielhafte Drive-Schwellenwert `DQ < 0.80` wird nicht als globale harte Policy eingebaut. Eine solche fixe Zahl ohne bestehende Domain-/Policy-Authority wuerde den vorhandenen Evidence-/Risk-Policy-Vertrag duplizieren.

## 11. FT-7 bis FT-9

### FT-7 Guarded Live

Blockiert bis FT-0..FT-6 bestanden und separat autorisiert sind. Genau ein CEX-Adapter, Human Approval, Kill Switch, Circuit Breakers und keine Agent-Key-Capability.

### FT-8 Enterprise Hardening

BCP/DR, Custody-Boundary, Multi-Venue, OpenTelemetry/W3C Trace Context, SLOs, Audit Retention, Chaos/Failover und regulatorische Exportfaehigkeit.

### FT-9 DeFi / DEX / Cross-Chain

DEX/Aggregator-, Smart-Contract-, Bridge-, Oracle- und Cross-Chain-Risk/Settlement-Gates. Bleibt weiterhin `PLANNED`/blockiert bis die vorgelagerten Gates bestanden sind.

**Evidence-Vorarbeit (ADR-0100):** DeFiLlama liefert bereits Protokoll-TVL/Fees/Revenue als `CryptoFeatureEvidence` im Rollout-Status `evidence_only` — ohne ScoringDispatcher-Anbindung, ohne zweiten Dispatcher/Orchestrator und ohne FT-9 Gate-Verschiebung. Die Promotion in produktive Scoring Features bleibt ein separater, model-contract-gesteuerter Schritt.

## 12. 24-Asset Ziel und Datenbestaendigkeit

Die Crypto-Finalisierung wird nur dann als scorefaehige Produktionsbasis bewertet, wenn der bestehende SC-2-/Universe-SLA-Pfad fuer mindestens 24 reale, deduplizierte und evidence-admitted Crypto Assets den erforderlichen Status nachweist.

Regeln:

- kein synthetisches Filling;
- keine Demo Assets;
- kein fehlendes Asset als `0`-Score;
- Identity immer ueber UAI;
- Evidence muss freshness-/provenance-faehig sein;
- Category-/DeFi-Evidence wird nur bei explizitem Feature-/Model-Contract scoreEligible;
- Unterdeckung wird als `DEGRADED`/`INSUFFICIENT` sichtbar gemacht;
- Provider-Ausfall darf nicht stillschweigend zu veralteter oder erfundener Evidence fuehren.

Dieser 24-Asset-Nachweis ist ein verbleibender Finalisierungs-Gate und wird nicht durch FT-6A ersetzt.

## 13. Security / Compliance / Data Integrity

Weiterhin verpflichtend:

- fail-closed bei fehlender/staler/mismatched-authority Evidence oder Persistenz-/Replayfehlern;
- keine zweite Scoring Authority;
- keine direkte LLM-/Agent-Side-Effect- oder Approval-Capability;
- Idempotency vor Side-Effect-Retry;
- provenance-faehige Evidence;
- Least Privilege und private financial persistence;
- simuliertes Paper Accounting strikt von realem Kapital trennen;
- Risk-/Compliance-Policy und Evidence Authorities versioniert/externalisieren;
- Decision Records als einzige FT-6 Approval-Quelle;
- Reconciliation-Mismatch nie automatisch promoten;
- Human/Governance-Gates fuer spaetere produktive Mutationen.

## 14. Open Source / Plugins

- bestehende Repository-Funktionen bleiben fuehrend;
- GitHub fuer Branch-/Registry-/PR-/CI-Governance;
- Supabase/PostgreSQL fuer private Durability; FT-6 Migration aktuell nur als Branch-Artefakt;
- keine neue Datenbank-/Queue-/Execution-Dependency fuer FT-6A;
- QuantConnect LEAN/NautilusTrader fuer FT-4 bewertet, nicht integriert;
- OPA/Cedar fuer FT-5 bewertet, nicht integriert;
- TA-Lib bleibt spaeterer Detector-/Indicator-PoC-Kandidat.

## 15. Naechster fachlicher Schritt

Nach FT-6A folgen in dieser Reihenfolge:

1. finaler Main-/Korrelationscheck des Branches;
2. Hosted CI/Governance nach Erstellen des konsolidierten Draft PR;
3. FT-6B Migration/Replay/Reconciliation Closure nach separater Supabase-Mutationsfreigabe;
4. 24-Asset Crypto Universe Availability-/Evidence-Admittance-Nachweis;
5. letzte DeFi-/Category-Evidence-Promotionen ausschliesslich ueber bestehende Feature-/Model Contracts;
6. erst danach Entscheidung, ob FT-7 Guarded Live ueberhaupt aktiviert werden soll.

Die anschliessende Skill Prompt Engine und der Stock Orchestrator muessen dieselben UAI-, Evidence/DQ-, Registry-, Dispatcher-, CanonicalScoreResult- und Universe-SLA-Vertraege wiederverwenden.
