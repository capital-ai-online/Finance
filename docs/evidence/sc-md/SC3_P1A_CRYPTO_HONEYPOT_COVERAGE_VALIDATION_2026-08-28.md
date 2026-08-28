# SC-3 / P1-A — Crypto Honeypot Coverage, Freshness & Validation

**Date:** 2026-08-28  
**Roadmap:** `FT-CORE-CRYPTO-01` / P1-A  
**Base:** `main@27b4d6baa7ceec954b5d91a83e240e47447a998b`  
**Depends on:** PR #525, PR #574, ADR-0087, ADR-0099, ADR-0100  
**Status:** IMPLEMENTED CONTRACT/HARNESS — REAL LABELLED CORPUS AND ROUTE COVERAGE EVIDENCE STILL REQUIRED

## 1. Problem

PR #525 established a governed read-only GoPlus EVM transaction-simulation provider and an exact BUY/SELL hard-gate adapter. That foundation deliberately did not claim production coverage, freshness or false-positive/false-negative performance.

The remaining P1-A gap is therefore not another HTTP integration. It is evidence admission and validation:

```text
exact asset / chain / route coverage
+ current observations
+ bounded BUY/SELL observation skew
+ independently labelled known-positive / known-negative corpus
+ deterministic validation metrics
```

No model promotion may be inferred merely because the provider is reachable.

## 2. Current primary-source check

GoPlus currently documents the EVM transaction-simulation endpoint as:

```text
POST https://api.gopluslabs.io/api/v1/transaction_simulation
Authorization: Bearer <token>
```

The response includes `is_simulated`, `is_revert`, `revert_reason`, ERC-20 balance changes, risk flags and suspicious addresses. GoPlus also documents application-level status `2` as partial data and states that complete data may be requested again later. Partial or missing evidence therefore cannot satisfy a CAPITAL-AI hard gate.

GoPlus publishes current supported-chain / supported-DEX information separately. CAPITAL-AI does not convert generic provider support into per-asset production coverage; coverage remains explicit empirical evidence bound to the exact chain/token/route identity.

Primary references reviewed on 2026-08-28:

- GoPlus Transaction Simulation API reference;
- GoPlus Transaction Simulation response detail;
- GoPlus API status codes;
- GoPlus supported DEX / mainstream-token documentation.

## 3. Reuse / dependency decision

Existing architecture is reused:

- provider identity `goplus`;
- `ResearchEvidenceProviderHttp`;
- `goplus-transaction-simulation-evidence/1.0.0`;
- `crypto-meme-honeypot-simulation-evidence/0.1.0`;
- ProviderMatrix rate-limit/circuit-breaker/Supervisor controls;
- existing exact route-authority and route-evidence binding.

No additional SDK or provider is introduced. The official `@goplus/sdk-node` alternative remains unnecessary for this bounded validation slice because transport/auth/rate-limit governance already exists in the repository and no new GoPlus protocol surface is required.

## 4. New admission contract

Contract:

```text
crypto-meme-honeypot-simulation-admission/0.1.0
```

The admission policy is explicitly versioned and binds:

```text
policyId / policyVersion
chainId
tokenAddress
routeAuthorityId / routeAuthorityVersion
coverageAuthorityId / coverageAuthorityVersion
coverageEvidenceRefs
maxObservationAgeMs
maxPairObservationSkewMs
```

The policy does not contain a global provider-supported flag. It represents exact empirical coverage for one governed identity.

Admission requires:

1. exactly one BUY and one SELL provider observation;
2. exact chain/token/route identity match to the admission policy;
3. both provider observations `VERIFIED`, attributable and non-executable;
4. evaluation time not before either observation;
5. both observations within governed maximum age;
6. BUY/SELL timestamp skew within governed maximum;
7. underlying hard-gate composition produces `READY` or `BLOCKED`, not `NOT_COMPUTABLE`.

Any failure returns `NOT_ADMITTED`. No PASS, FAIL or neutral default is manufactured from missing/stale evidence.

## 5. Independent validation harness

Contract:

```text
crypto-meme-honeypot-simulation-validation/0.1.0
```

Each validation case requires:

```text
caseId
expectedOutcome = SAFE | BLOCKED
labelProviderId
labelAuthorityId / labelAuthorityVersion
labelEvidenceRefs
admitted simulation result
```

The label provider must be independent from `goplus`. Duplicate case IDs or ungoverned labels are rejected rather than counted.

Metrics are deterministic:

- accepted / rejected case count;
- computable / inconclusive case count;
- expected SAFE / BLOCKED counts;
- true-safe / true-blocked counts;
- false-blocked / false-safe counts;
- computable rate;
- safe-acceptance rate;
- blocked-detection rate.

Inconclusive cases remain in the denominator of class-specific rates through the expected-class totals; missing evidence therefore cannot improve measured quality.

The harness has no built-in promotion threshold:

```text
scoreEligible=false
executionEligible=false
promotionEligible=false
authority=RESEARCH_VALIDATION_ONLY
```

A later owner-gated promotion package must define reviewed acceptance criteria together with the actual labelled corpus and out-of-sample/stress evidence.

## 6. Test-fixture boundary

Unit-test cases only prove deterministic contract behavior. Their addresses, evidence IDs and labels are explicitly test fixtures and are **not** known honeypot/safe-token production evidence.

No accuracy, sensitivity, specificity, provider coverage or production readiness is claimed from test fixtures.

## 7. Remaining real-world P1-A evidence

Still required before P1-A can be considered promotion-evidence complete:

1. independently governed known-honeypot and known-safe labels with immutable evidence references;
2. governed real route/calldata evidence for each tested chain/token;
3. explicit empirical coverage records per admitted identity;
4. production freshness/SLA observations over a representative period;
5. validation report over the real labelled corpus;
6. failure-mode evidence for partial provider responses, rate limits and unsupported identities;
7. owner-reviewed acceptance criteria.

Only after these are present should P1-A be closed as validation-complete. Meme/DeFi model promotion remains a later separate gate.

## 8. Next roadmap order

After P1-A real-world validation evidence:

```text
Exploit incident identity/lifecycle
-> Oracle integrity/liveness/deviation
-> External audit/formal-verification evidence
-> Holder/sniper/team/exchange-wallet methodology
-> P2 OOS / walk-forward / stress / correlation validation
-> separate owner-gated Meme/DeFi promotion
```

FT-7 remains blocked.
