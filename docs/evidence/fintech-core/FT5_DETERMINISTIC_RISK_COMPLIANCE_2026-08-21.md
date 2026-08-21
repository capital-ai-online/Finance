# FT-5 — Deterministic Risk + Compliance Evidence

**Roadmap:** `FT-CORE-CRYPTO-01`  
**ADR:** `ADR-0099`  
**Work Claim:** `FINTECH-CORE-FT5-DETERMINISTIC-RISK-COMPLIANCE-2026-08-21`  
**Branch:** `feat/fintech-core-ft4-research-paper-trading-2026-08-21`  
**Baseline:** `main@a0663563a6a01bbdf292db8796c1b291bdd8ee57`  
**Date:** 2026-08-21

## 1. Scope

FT-5 implements a deterministic, fail-closed pre-trade Risk + Compliance domain boundary after FT-4 and before FT-6.

Implemented Risk gates:

- `ORDER_NOTIONAL`
- `GROSS_EXPOSURE`
- `DRAWDOWN`
- `LIQUIDITY`
- `STALENESS`
- `COUNTERPARTY`

Implemented Compliance integration points:

- `KYC`
- `KYB`
- `AML`
- `SANCTIONS`
- `WALLET_SCREENING`
- `JURISDICTION`
- `TRAVEL_RULE`

Not part of FT-5:

- binding approvals into an execution-eligible `OrderIntent`;
- live order signing/routing/execution;
- exchange or custody credentials;
- settlement/reconciliation semantics;
- legal determination of which controls apply in a jurisdiction;
- KYC/KYB/AML/Sanctions provider implementation;
- new Supabase tables or migrations;
- new queue, scorer or LLM authority.

## 2. Repository Reuse / Existing Authorities

Reused:

- `FinTechCoreDecisionRecord` from FT-1/FT-3;
- append-only `fintech_core.decision_records` through the existing FT-3 persistence port;
- existing `FinTechCoreOrderIntent` approval fields only as a future FT-6 contract dependency, not modified by FT-5;
- FT-4 `PaperFixedPoint` representation for deterministic monetary thresholds/evidence;
- UAI/run/trace/correlation/decision identity.

Existing components explicitly **not** promoted to FT-5 authority:

- `src/agents/cryptoRiskAgent.ts` — LLM/fallback-driven research assessment, therefore not suitable for deterministic authorization;
- `src/services/crossAssetRiskContext.ts` — useful contextual evidence but explicitly non-execution-authorizing;
- `src/platform/Compliance/*` — SecurityComplianceAuditor repository/ISO control scanning, not transaction AML/KYC policy authority;
- ADR-0058 Agent IAM risk classes — agent/tool authorization authority, not financial pre-trade risk policy.

No duplicate Compliance, IAM or Scoring authority was created.

## 3. Deterministic Policy Boundary

`RiskComplianceContracts.ts` defines versioned inputs without embedding regulatory/business thresholds into executable source code.

`FinTechCoreRiskPolicySnapshot` supplies policy identity/version, fixed-point order/exposure limits, drawdown/liquidity/freshness thresholds, expected portfolio/liquidity/market/counterparty Evidence Authorities and policy evidence refs.

`FinTechCoreCompliancePolicySnapshot` supplies policy identity/version, the explicit set of required controls, an expected Evidence Authority per required control, maximum evidence age and policy evidence refs.

The core **does not infer** whether KYC, KYB, Travel Rule or another control is legally required. That remains external policy/compliance authority.

## 4. Evidence Integrity

A PASS result is insufficient by itself. Evidence must also satisfy:

- exact control identity;
- exact expected `authorityId` from the policy snapshot;
- non-empty provider identity;
- non-empty provenance/evidence refs;
- valid observed timestamp;
- configured freshness limit.

Risk-specific evidence is separately provenance-bound for order notional, portfolio exposure/equity, liquidity, market freshness and counterparty.

Authority mismatch, missing/stale evidence or invalid provenance produces `NOT_COMPUTABLE` and cannot become approval.

## 5. Gate Semantics

Outcome precedence is conservative:

```text
REJECTED > NOT_COMPUTABLE > REVIEW_REQUIRED > APPROVED
```

Examples:

- over-limit notional/exposure/drawdown or inadequate liquidity -> `REJECTED`;
- stale market data -> `NOT_COMPUTABLE`;
- missing Sanctions evidence -> `NOT_COMPUTABLE`;
- authoritative Sanctions FAIL -> `REJECTED`;
- Wallet Screening manual review -> `REVIEW_REQUIRED`;
- wrong Evidence Authority even with PASS -> `NOT_COMPUTABLE`.

No missing value is converted to `0`, `PASS` or a probability.

## 6. Monetary Determinism

Risk monetary values use the FT-4 JSON-safe fixed-point representation:

```text
atoms: integer encoded as string
scale: decimal scale
```

`BigInt` comparisons and integer basis-point arithmetic are used for order-notional limits, gross-exposure limits, drawdown bps and liquidity coverage bps. This avoids binary floating-point money-state drift inside the gate engine.

## 7. OrderIntent Boundary — Deferred to FT-6

FT-5 intentionally produces **decisions only**. `FinTechCorePreTradeAuthorizationDecision` therefore declares:

```text
executionHandoffEligible = false
```

for every operating mode, including manually constructed `GUARDED_LIVE` or `PRODUCTION` contexts.

FT-5 contains no helper that writes `riskApproval=APPROVED` or `complianceApproval=APPROVED` into an `OrderIntent`. Binding decisions/hashes/policy versions to an immutable OrderIntent belongs to FT-6 together with TTL, price/quantity/slippage bounds, client-order identity and reconciliation semantics.

Crypto Module 01 still advertises only `RESEARCH` and `PAPER`, so there is no live module capability in FT-5.

## 8. Durable Decision Evidence

`RiskComplianceDecisionRecords.ts` maps FT-5 results to existing FT-3 append-only records:

- `PRE_TRADE_RISK_GATE`
- `PRE_TRADE_COMPLIANCE_GATE`

The existing decision schema carries run/trace/correlation/module/asset identity, decision version, policy ID/version, input/output hashes, evidence refs and decision timestamp/outcome.

No new table or Supabase migration is required for FT-5.

## 9. Compliance / Regulatory Research

Primary/current sources reviewed for the architecture boundary:

1. **Regulation (EU) 2023/1114 (MiCA)** — Article 68 requires effective risk-assessment arrangements and sufficient records for crypto-asset services/activities/orders/transactions.
2. **EBA ML/TF Risk Factor Guidelines for CASPs** — CASPs must identify customer/product/delivery-channel/geographical ML/TF risk factors and apply mitigating measures.
3. **EBA Travel Rule Guidelines under Regulation (EU) 2023/1113** — applicable from 30 December 2024; require detection and handling of missing/incomplete information accompanying relevant fund/crypto transfers.
4. **FATF Seventh Targeted Update on VA/VASPs, 16 July 2026** — continues to highlight risk-based supervision, Travel Rule implementation, unhosted-wallet, stablecoin, offshore-VASP and DeFi risks.

These sources support explicit, attributable, risk-based evidence and fail-closed integration points. FT-5 does not encode legal advice or jurisdiction-specific legal conclusions.

## 10. Open-Source / Plugin Evaluation

### Open Policy Agent (OPA)

- functional fit: high for centralized policy-as-code, broader than FT-5 evaluator need;
- maintainer activity: active; CNCF Graduated; GitHub latest observed release `v1.16.2` (12 May 2026);
- security: project documents a third-party Cure53 security audit and maintains a security process;
- license: Apache-2.0;
- enterprise suitability: high;
- integration/dependencies: additional OPA/Rego runtime/API or WASM boundary;
- maintainability/lock-in: policy portability is good, but Rego becomes another policy language/runtime to govern;
- architecture compatibility: possible later if CAPITAL-AI centralizes many independent policy domains, unnecessary for the narrow FT-5 typed gate.

Decision: **not integrated in FT-5**.

### Cedar

- functional fit: high for authorization/policy evaluation, broader than current financial threshold evaluator;
- maintainer activity: active; GitHub latest observed release `v4.11.0` (18 May 2026);
- security: published security guidance plus formalization/differential-testing work in `cedar-spec`;
- license: Apache-2.0;
- enterprise suitability: high;
- integration/dependencies: Rust/Go or additional service/runtime boundary for this TypeScript application;
- maintainability/lock-in: strong formal policy model, but another policy DSL/runtime and governance surface;
- architecture compatibility: possible for a future centralized authorization plane, not needed for the small deterministic FT-5 calculation boundary.

Decision: **not integrated in FT-5**.

### Plugin review

- existing GitHub Connector is sufficient for repository/branch/governance work;
- no installed specialist AML/KYC/Sanctions plugin is available;
- plugin search returned no suitable financial-compliance provider integration;
- no new plugin is introduced.

## 11. Security / Architecture Invariants

Architecture tests enforce that FT-5 gate files do not import:

- OpenAI/Anthropic/agent model routing;
- `CryptoRiskAgent`/agent code;
- direct `fetch()` provider I/O;
- Supabase client/server persistence;
- Kraken/CCXT/Binance/Coinbase execution clients;
- productive scoring implementations.

Crypto Module 01 remains non-live through FT-5. FT-5 does not create an execution-eligible OrderIntent handoff.

## 12. Validation Status

Implemented unit/negative test coverage includes:

- all six Risk gates passing;
- order-notional rejection;
- stale market evidence;
- wrong market Evidence Authority;
- missing required compliance control;
- Sanctions FAIL;
- PASS evidence from wrong authority;
- manual-review propagation;
- PAPER evaluation with execution handoff blocked;
- manually constructed `GUARDED_LIVE` evaluation with execution handoff still blocked;
- mapping into FT-3 decision records.

Per repository cost/governance policy, GitHub CI has **not** been started before PR creation. No new Supabase/Render/Stripe mutation was required for FT-5.

## 13. Next Gate

After FT-5, the next roadmap block is FT-6 `OrderIntent & Reconciliation`:

- immutable/hash-bound OrderIntent;
- binding of FT-5 Risk/Compliance Decisions to OrderIntent approval state;
- TTL and price/quantity/slippage bounds;
- idempotency/client-order identity;
- typed reconciliation/settlement semantics;
- crash/duplicate/reconciliation tests.

Guarded Live remains blocked until FT-6 and later explicit human/operational gates are satisfied.
