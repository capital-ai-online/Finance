# FT-4 — Research & Paper Trading Evidence

**Work item:** FT-4 Research & Paper Trading  
**Date:** 2026-08-21  
**Branch:** `feat/fintech-core-ft4-research-paper-trading-2026-08-21`  
**Base:** `main@a0663563a6a01bbdf292db8796c1b291bdd8ee57`  
**Dependency:** PR #468 merged; FT-3 durable workflow/event persistence is canonical  
**Production target:** Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`)

## 1. Traceability

FT-4 implements the roadmap block `FT-CORE-CRYPTO-01 / Research & Paper Trading` and the Owner direction of 2026-08-21 to continue after merge of PR #468.

Roadmap scope:

- durable/replay-capable paper workflow;
- explicitly simulated balances;
- fees/slippage/funding as evidence;
- no real capital.

The implementation preserves ADR-0099 and ADR-0087/SC-2: Paper Trading is simulation/evidence, not a productive scoring or execution authority.

## 2. Repository and reuse decision

Reused rather than duplicated:

- `FinTechCoreWorkflowContext` and `PAPER` operating mode;
- FT-3 `fintech_core.domain_events` as the append-only paper journal;
- FT-3 `FinTechCorePersistencePort` and privileged server adapter;
- existing UAI asset identity;
- existing workflow trace/correlation/decision-version envelope;
- existing Supabase/PostgreSQL platform and `@supabase/supabase-js` server path.

Not introduced:

- no exchange adapter;
- no wallet/custody key capability;
- no live `OrderIntent` generation;
- no second scoring engine;
- no second queue/ledger;
- no Kafka/NATS/Temporal/pgmq runtime;
- no Render or Stripe mutation.

## 3. Open-source assessment

Two established trading engines were reviewed as alternatives before custom implementation:

### QuantConnect LEAN

- mature, feature-rich paper/backtest execution stack;
- Apache-2.0 license;
- supports explicit fill/fee/slippage models;
- enterprise-capable but introduces a large C# runtime and a parallel execution architecture relative to the existing TypeScript FinTechCore.

**Decision:** not integrated for FT-4. Functional scope and integration surface are materially larger than the required deterministic paper-domain slice.

### NautilusTrader

- actively maintained event-driven trading platform;
- deterministic/replay-oriented architecture;
- LGPL-3.0 license;
- introduces Rust/Python runtime and broader trading-engine authority.

**Decision:** not integrated for FT-4. Useful reference architecture, but unnecessary dependency/runtime/lock-in surface for the narrow roadmap requirement.

Custom code is therefore limited to the missing domain primitive while infrastructure, identity, persistence and audit capabilities are reused.

## 4. FT-4 domain contracts

`src/platform/FinTechCore/PaperTrading/PaperTradingContracts.ts` defines:

- contract version `fintech-core/paper-trading/0.1.0`;
- event version `fintech-core/paper-trading-event/0.1.0`;
- accounting mode `CASH_LONG_ONLY`;
- `PAPER_ACCOUNT_INITIALIZED` and `PAPER_FILL_SIMULATED` event types;
- JSON-safe fixed-point values as `atoms` + decimal `scale`;
- explicit fee/slippage/funding evidence;
- fictional quote and asset balances;
- average entry price, gross realized PnL, cumulative fees and cumulative funding;
- deterministic `paperSequence` and event causation.

No real-money account, venue account, exchange credential or custody identifier exists in the contract.

## 5. Deterministic paper engine

`PaperTradingEngine.ts` is pure domain code and uses `BigInt` fixed-point arithmetic rather than binary floating-point for monetary/quantity state.

Implemented behavior:

- requires `operatingMode=PAPER`;
- requires explicit evidence references;
- BUY/SELL simulated fill price incorporates supplied slippage bps;
- fees are explicit bps evidence;
- funding is explicit amount evidence or explicitly `NOT_APPLICABLE` with a reason;
- insufficient fictional cash rejects a BUY;
- CASH_LONG_ONLY rejects a SELL that would create a short position;
- successful fills update only fictional balances;
- every fill produces a canonical `FinTechCoreDomainEvent`;
- causation chains every fill to the preceding paper event;
- deterministic replay recomputes stored fill calculations and rejects tampered or non-contiguous journals.

Gross realized price PnL is retained separately from cumulative fees/funding so cost attribution remains auditable rather than hidden in a single opaque number.

## 6. Durable workflow service

`PaperTradingWorkflowService` uses only:

- `appendDomainEvent` from the existing persistence port;
- the new read-only `FinTechCoreDomainEventReaderPort`.

Before each simulated fill the current paper state is reconstructed from the durable journal. Only a successful simulated fill is appended. Invalid replay or duplicate initialization fails closed.

## 7. Production migration

Repository migration:

`supabase/migrations/20260821093000_fintech_core_paper_replay_reader.sql`

Production migration:

| Production version | Name | Result |
| --- | --- | --- |
| `20260821071823` | `fintech_core_paper_replay_reader` | PASS |

The migration adds no table. It adds:

- `fintech_core.guard_paper_domain_event()`;
- `fintech_core_domain_events_paper_guard` BEFORE INSERT trigger;
- one-init-per-run unique partial index;
- unique `(run_id, paperSequence)` partial expression index;
- `public.fintech_core_list_domain_events_v1(text)` read-only replay RPC.

The guard enforces canonical paper contract/kind/sequence fields, init sequence 0 without causation and positive fill sequence with causation before the expression index is evaluated.

## 8. Security verification

Production verification after migration:

- reader `SECURITY DEFINER`: **false**;
- guard `SECURITY DEFINER`: **false**;
- `anon` reader EXECUTE: **false**;
- `authenticated` reader EXECUTE: **false**;
- `service_role` reader EXECUTE: **true**;
- guard direct EXECUTE for `service_role`: **false**;
- `fintech_core.domain_events` RLS: **enabled**;
- paper guard trigger: **present**;
- initialization unique index: **present**;
- paper sequence unique index: **present**.

The private `fintech_core` schema remains unexposed to browser roles.

## 9. Transactional functional verification

A production transaction inserted one temporary PAPER workflow and two canonical events:

1. `PAPER_ACCOUNT_INITIALIZED`, sequence 0;
2. `PAPER_FILL_SIMULATED`, sequence 1, caused by the initialization event.

With `SET LOCAL ROLE service_role`, `fintech_core_list_domain_events_v1` returned exactly:

- count: 2;
- event types: initialization then fill;
- paper sequences: `[0, 1]`.

Negative gates were then verified:

- duplicate paper sequence rejected;
- second account initialization for the same run rejected;
- fill without required causation rejected by the paper guard.

The transaction was rolled back. A post-rollback query confirmed:

- verification workflow rows: **0**;
- verification paper event rows: **0**.

No test data remains in production.

## 10. Advisor verification

### Security Advisor

No new FT-4/`fintech_core` security finding was introduced. Existing unrelated project findings remain outside FT-4, including service-only public-table RLS informational notices and the existing Auth leaked-password-protection warning.

Reference remediation for that existing Auth warning: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Performance Advisor

No new unindexed foreign key or FT-4 performance defect was reported. Existing project-level warnings outside FT-4 were not changed.

Reference linter documentation: https://supabase.com/docs/guides/database/database-linter

## 11. Validation coverage

Added tests:

- `tests/unit/fintechCorePaperTrading.test.ts`;
- `tests/unit/fintechCorePaperTradingWorkflowService.test.ts`;
- `tests/unit/fintechCoreSupabaseReplayReader.test.ts`;
- extended `tests/architecture/fintechCoreAuthorityBoundary.test.ts`.

Coverage includes:

- PAPER-only initialization;
- deterministic fixed-point BUY/SELL calculations;
- explicit fee/slippage/funding evidence;
- insufficient fictional balances;
- no short selling;
- deterministic event replay;
- tamper detection;
- durable workflow service behavior;
- service-role replay RPC mapping;
- malformed RPC rows fail closed;
- continued absence of live exchange/order execution dependencies in the FinTechCore domain.

Pre-PR GitHub CI was not manually triggered in accordance with repository cost/governance policy. Full repository CI remains a post-PR gate.

## 12. Result and boundary

**FT-4 Research & Paper Trading implementation: PASS pending post-PR CI.**

FT-4 now has a deterministic, durable and replayable fictional trading workflow with explicit cost evidence and no real capital capability.

Explicitly deferred to later roadmap phases:

- deterministic productive Risk + Compliance gates (FT-5);
- typed OrderIntent/Reconciliation/Settlement behavior (FT-6);
- Guarded Live / exchange routing / Human Approval / Kill Switch (FT-7);
- custody, multi-venue and enterprise resilience hardening (FT-8).
