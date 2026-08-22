# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 1.9.0  
**Status:** IN IMPLEMENTATION — FT-0 bis FT-6B auf `main`; Supersession A+B branch-ready; FT-7 blockiert  
**Current baseline:** `main@571de76e4d5f1d33460bf129d2231885dfde9584`  
**FT-6A Merge:** PR #481  
**FT-6B Merge:** PR #483  
**Primary Architecture Decision:** `ADR-0099`  
**Protected Scoring Authority:** `ADR-0087`  
**DeFi Evidence Authority:** `ADR-0100`

## 1. Authority Boundary

Der FinTech Core ist `financial_workflow_composition_authority`. Er ist keine Trading-Strategie, keine produktive Scoring Engine, keine Compliance-Policy-Authority, keine IAM-Authority, kein Exchange-/Broker-Gateway und kein Custody-System.

Kanonische Scoring-Kette:

```text
UAI Identity
  -> Evidence Acquisition
  -> Evidence/Data Quality Gate
  -> Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor Adapter
  -> CanonicalScoreResult
  -> Ranking/Eligibility
  -> EventMesh/Traceability/Supervisor
```

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`. DeFiLlama bleibt Evidence Acquisition. Missing/Stale Evidence wird niemals zu `0`, `PASS` oder synthetischer Verfuegbarkeit umgedeutet.

## 2. Nicht verhandelbare Invarianten

1. `ScoringDispatcher` bleibt einzige produktive Scoring-Execution-Authority.
2. Keine zweite Model Registry, Queue, Event-Journal-, Order-Ledger-, Reconciliation- oder Persistence-Architektur.
3. `public.outbox_jobs` bleibt Queue-/Lease-Authority.
4. Privates Schema bleibt `fintech_core`.
5. `anon`/`authenticated` erhalten keine direkte Finance-Capability.
6. Financial Quantity/Price/Money verwendet `atoms:string + scale:number`.
7. FT-5 Risk-/Compliance-Decisions sind die einzige Approval-Quelle fuer FT-6.
8. LLM-/Agent-Outputs duerfen keine Freigabe erzeugen oder ueberschreiben.
9. `PAPER` bleibt simuliert; reale Kapitalbewegung ist ausgeschlossen.
10. `GUARDED_LIVE` und `PRODUCTION` bleiben bis FT-7 fail-closed.
11. Meme/DeFi-Challenger duerfen keinen produktiven Score liefern, solange keine explizite Promotion erfolgt.
12. Stale/missing/invalid Evidence kann kein REQUIRED-/HARD_GATE erfuellen.
13. Correlated raw features duerfen nicht mehrfach additiv gewichtet werden, bevor De-Korrelation/Latent-Factor validiert ist.

## 3. Phasenstatus

| Phase | Status | Ergebnis |
|---|---|---|
| FT-0 Contract/Governance Foundation | DONE | Contracts + ADR-0099 |
| FT-1 Core Engine Foundation | DONE | Engine/Module Registry/Workflow State |
| FT-2A Category Profile Resolution | DONE | Crypto Category Profiles |
| FT-2B Category Feature Contracts | DONE | Typed category evidence |
| FT-2C Pattern Research Foundation | DONE | Research-only pattern contracts |
| FT-3 Durable Workflow & Traceability | DONE | private schema + append-only persistence |
| FT-4 Research & Paper Trading | DONE | deterministic Fixed Point + replay |
| FT-5 Deterministic Risk + Compliance | DONE | versioned policy/evidence decisions |
| FT-6A Decision Binding Foundation | DONE / MERGED #481 | decision/hash-bound PAPER intent scaffold |
| FT-6B OrderIntent & Reconciliation Closure | DONE / MERGED #483 | single canonical intent, Fixed Point, policy binding, typed reconciliation, v2 persistence |
| Supersession A | IMPLEMENTED / PENDING PR | authority/current-state/legacy cleanup + fail-closed operating-mode hardening |
| Supersession B | IMPLEMENTED / PENDING PR | Meme/DeFi 0.2.0 non-executable research contracts + correlation controls + DeFi stale semantics |
| FT-7 Guarded Live / Single CEX | BLOCKED | separate explicit architecture/security decision required |
| FT-8 Production Hardening | PLANNED | trace, SLO, BCP/DR, chaos/recovery |
| FT-9 DEX/Bridge/Cross-Chain | PLANNED | no productive DeFi/DEX scoring or execution authorized here |

## 4. FT-6B Canonical OrderIntent

`FinTechCoreOrderIntent` ist die einzige Domain-Authority. Financial Values sind Fixed Point; `clientOrderId`, `idempotencyKey` und `intentHash` werden deterministisch aus immutable Feldern abgeleitet.

Kanonische Persistenz:

```text
BOUND -> fintech_core_append_order_intent_v2
```

Legacy/research compatibility:

```text
UNBOUND -> fintech_core_append_order_intent_v1
```

Der v1-Pfad ist nicht kanonisch und wird erst nach Consumer-/Replay-/Bestandsdaten-Nachweis entfernt.

## 5. Operating Modes — fail-closed

Nach expliziter Owner-Freigabe wurde die stale Future-Capability-Projektion korrigiert:

```text
RESEARCH      real=false simulated=false newOrders=false
PAPER         real=false simulated=true  newOrders=true
GUARDED_LIVE  real=false simulated=false newOrders=false
PRODUCTION    real=false simulated=false newOrders=false
EMERGENCY     real=false simulated=false newOrders=false
```

`isOrderIntentEligibleForRealExecution(...)` bleibt fuer jeden Modus `false`. FT-7+ benoetigt eine neue Architektur-/Security-Entscheidung.

## 6. Supersession B — Meme

`crypto-meme-integrity@0.2.0`:

- `challenger` / `research-only` / `scoreEligible=false`;
- executor `research-only:not-executable`;
- feature contract `crypto-meme-research-features/0.2.0`;
- keine ausfuehrbaren Gewichte;
- Trend + Momentum + Volatility Quality = Korrelationsgruppe `meme-price-path`;
- Contract-Integrity und Manipulation-Risk sind Promotion-Gates;
- historische 35/25/20/20-Formel aus `MemeCoinScoringService` bleibt non-authorizing.

## 7. Supersession B — DeFi

`crypto-defi-fundamental@0.2.0`:

- `challenger` / `research-only` / `scoreEligible=false`;
- executor `research-only:not-executable`;
- feature contract `crypto-defi-research-features/0.2.0`;
- keine ausfuehrbaren Gewichte;
- TVL + Fees + Revenue = Korrelationsgruppe `defi-scale-activity`;
- unabhängige additive Gewichtung erst nach validierter De-Korrelation/Latent-Factor-Transformation;
- DeFiLlama bleibt Evidence-only.

`defi-protocol-evidence/1.1.0`:

```text
READY              -> alle emittierten Features VERIFIED
PARTIAL            -> mindestens ein VERIFIED, Set nicht voll verified
STALE              -> kein VERIFIED, stale Evidence vorhanden
SOURCE_UNAVAILABLE -> keine verified/stale Evidence
```

## 8. Fingerprint / Promotion

Meme/DeFi besitzen bewusst **keine** Effective-Weight-Fingerprints, weil keine executable weights existieren. Eine spaetere Promotion muss in derselben reviewten Modellversion liefern:

- executable weights + nominal-weights version;
- Effective-Feature-Fingerprint;
- Effective-Weight-Fingerprint;
- Evidence-/DQ-/Freshness-Contract-Bindung;
- Out-of-sample Challenger-vs-Champion-Validierung;
- explizite Owner-Freigabe.

Die bestehende `scoringFingerprint`-Authority wird wiederverwendet; es entsteht kein zweites Lineage-System.

## 9. Persistence / Security

Kanonisch bleiben:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
public.outbox_jobs
```

FT-6B fuegt keine zweite Queue/Persistence-Authority hinzu. Service-role-only / SECURITY INVOKER bleibt erhalten. Supersession B fuehrt keine Datenbank-, Render-, Stripe-, Secret- oder Execution-Mutation aus.

## 10. Current State

```text
FT-0 ... FT-6B = DONE on main
Supersession A = IMPLEMENTED in branch / pending PR
Supersession B = IMPLEMENTED in same branch / pending PR
crypto champion = crypto-technical-provenance@0.7.0 unchanged
Meme/DeFi productive promotion = BLOCKED
FT-7 = BLOCKED
FT-8 = PLANNED
FT-9 = PLANNED
```

## 11. Naechste Schritte

1. gezielten Regressionstest fuer Supersession A+B ausfuehren;
2. Branch gegen aktuellen `main` und offene PRs erneut korrelieren/synchronisieren;
3. erst danach einen gemeinsamen deutschen Pull Request mit kanonischer PR-Vorlage erstellen;
4. Hosted CI erst nach PR-Erstellung ausfuehren;
5. FT-7 und spaetere Meme/DeFi-Promotion getrennt human-gated behandeln.
