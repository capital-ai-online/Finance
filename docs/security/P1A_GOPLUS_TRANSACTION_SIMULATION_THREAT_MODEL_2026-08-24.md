# P1-A GoPlus Transaction Simulation Threat Model

**Date:** 2026-08-24  
**Scope:** `FT-CORE-CRYPTO-01 / P1-A`  
**Branch:** `feat/fintech-core-p1a-honeypot-evidence-postmerge-2026-08-24`  
**Base at scope start:** `main@7afa86e24812e3de96e93882b9658d2b2e0311e7`  
**Contracts:** `goplus-transaction-simulation-evidence/1.0.0`, `crypto-meme-honeypot-simulation-evidence/0.1.0`  
**Authorities preserved:** ADR-0087, ADR-0099, ADR-0100, ProviderMatrix, FT-5 Risk/Compliance, FT-6B OrderIntent, FT-7 real-execution gate

## 1. Security objective

P1-A may observe an externally simulated EVM transaction and project two research-only hard-gate evidence values:

```text
risk.buySimulationSuccess
risk.sellSimulationSuccess
```

It must not construct trade routes, sign or broadcast transactions, create orders, grant Risk/Compliance approval, promote a scoring model or enable live execution.

The security objective is therefore **evidence integrity and authority containment**, not transaction execution.

## 2. Assets to protect

1. `GOPLUS_API_KEY` confidentiality and non-propagation into source, logs, PR metadata or evidence records.
2. Route/calldata provenance and the upstream route-authority binding supplied by the caller.
3. Chain, token, sender, target and transaction-parameter identity.
4. Integrity of simulation status, revert state and target-token balance changes.
5. Integrity of the derived `risk.buySimulationSuccess` / `risk.sellSimulationSuccess` values.
6. Existing scoring, FT-5 Risk/Compliance, FT-6B OrderIntent and FT-7 execution authorities.
7. ProviderMatrix as the single provider inventory and `ResearchEvidenceProviderHttp` as the governed transport boundary.

## 3. Trust boundaries

### TB-1 — Governed route evidence -> P1-A provider request

Input includes chain/token/from/to/calldata plus a versioned `routeAuthorityId`, `routeAuthorityVersion` and `routeEvidenceRefs`.

Risk: a caller injects arbitrary calldata or falsely labels an ungoverned route as trusted.

Controls:

- structural EVM address/calldata validation before network access;
- non-empty versioned route authority and evidence references required;
- deterministic transaction fingerprint binds route-relevant request fields and route authority;
- P1-A itself does not construct or modify a route;
- the contract is research-only and cannot authorize execution.

Residual risk: P1-A currently validates the **presence and exact BUY/SELL consistency** of route authority metadata, not an external cryptographic registry signature for that authority. Real-universe route-authority verification remains a promotion prerequisite.

### TB-2 — CAPITAL-AI -> GoPlus HTTPS API

Risk: credential leakage, provider outage, schema drift, malicious/malformed response or compromised upstream provider.

Controls:

- API key is read only from runtime configuration and sent in the Authorization header;
- absent key returns `NOT_CONFIGURED` before transport;
- shared `ResearchEvidenceProviderHttp` retains ProviderMatrix, timeout, rate-limit, circuit-breaker and Supervisor-health behavior;
- non-success transport/application results fail closed;
- response must expose deterministic simulation/revert fields before it is admissible;
- no provider response can grant a financial or execution capability.

Residual risk: HTTPS/provider integrity and GoPlus service correctness remain external dependencies. P1-A does not claim independent provider corroboration.

### TB-3 — GoPlus response -> Meme hard-gate research evidence

Risk: incomplete response, wrong token balance delta, replay/staleness or token-security flags being mistaken for successful buy/sell simulation.

Controls:

- BUY success requires an attributable positive target-token balance delta;
- SELL success requires an attributable negative target-token balance delta;
- confirmed revert yields a failed direction;
- missing target-token balance evidence remains `NOT_COMPUTABLE`, never PASS/FAIL/0;
- exact BUY/SELL chain, token, route-authority ID and route-authority version correlation is mandatory;
- provider evidence IDs and request fingerprints remain in lineage;
- `is_honeypot`, `cannot_buy`, `cannot_sell_all` or generic risk flags cannot manufacture a simulation PASS;
- output is `scoreEligible=false`, `executionEligible=false`, `authority=RESEARCH_EVIDENCE_ONLY`.

Residual risk: this contract foundation does not yet establish a production freshness/SLA policy or empirical false-positive/false-negative calibration. Therefore it is insufficient for productive model promotion by itself.

## 4. Threats and controls

| Threat | Impact | Control | Residual state |
|---|---|---|---|
| API key omitted | accidental unauthenticated fallback | `NOT_CONFIGURED`; no fetch | controlled |
| API key leakage | provider credential compromise | env-only lookup; no key in evidence/logging contract | operational secret hygiene still required |
| Arbitrary/invalid calldata | misleading simulation | strict calldata/address validation + route authority/evidence refs | upstream route-authority truth still external |
| BUY/SELL identity drift | combines unrelated simulations | exact chain/token/route-authority correlation | controlled |
| Provider outage / HTTP failure | missing evidence | `SOURCE_UNAVAILABLE`; no PASS | controlled |
| Schema drift / malformed payload | incorrect parsing | required deterministic status fields; invalid response fails closed | provider schema monitoring remains required |
| Simulation revert | honeypot/route failure hidden | explicit `directionSucceeded=false` | controlled |
| Missing target-token delta | false negative/positive | `directionSucceeded=null` -> `NOT_COMPUTABLE` | controlled |
| Token-security flag substituted for simulation | false PASS | separate contracts; adapter consumes simulation evidence only | controlled |
| Replay / stale result | outdated hard gate | observation timestamp retained; promotion blocked pending governed freshness/SLA | open before promotion |
| Provider false positive/negative | model integrity degradation | research-only; known-positive/negative calibration required before promotion | open before promotion |
| Route authority spoofing | untrusted route treated as governed | authority ID/version/evidence required and fingerprinted | cryptographic/registry binding open before production use |
| Simulation output used as execution approval | authority escalation | `scoreEligible=false`, `executionEligible=false`; no FT-5/FT-6/FT-7 capability | controlled |
| Provider compromise | manipulated evidence | fail-closed structural validation; no financial authority; future corroboration/validation required | open before promotion |

## 5. Required negative tests

The P1-A unit suite must prove at minimum:

- missing API key causes no network call;
- missing route authority/evidence causes no network call;
- positive BUY target-token delta is required for BUY success;
- negative SELL target-token delta is required for SELL success;
- missing target-token delta remains `NOT_COMPUTABLE`;
- a confirmed revert is a failed direction;
- mismatched BUY/SELL route authority is `NOT_COMPUTABLE`;
- one real direction failure blocks the pair;
- both verified successful directions populate only the two canonical Meme hard-gate keys;
- outputs remain non-score/non-execution authority.

## 6. Promotion and production gates

P1-A may not be treated as productive Meme/DeFi promotion evidence until a separate reviewed package establishes:

1. governed real route/calldata construction and route-authority verification;
2. production credential/entitlement availability without exposing the secret;
3. chain/asset coverage for the governed universe;
4. versioned freshness/SLA admission policy;
5. known-honeypot and normal-token false-positive/false-negative calibration;
6. provider/schema drift monitoring;
7. independent corroboration strategy where justified by risk;
8. explicit Owner-approved model promotion through the existing `ScoringModelRegistry -> ScoringDispatcher` path.

FT-7 real execution remains independently blocked.

## 7. Data integrity and privacy

- No customer PII is required by the contract.
- No private key, wallet signing secret or exchange credential is accepted.
- `GOPLUS_API_KEY` is not part of request/evidence output objects.
- Transaction fingerprints contain a hash of request identity, not the secret.
- Evidence references must remain provenance pointers, not raw credentials.
- Missing/malformed evidence is never synthesized.

## 8. Rollback

No external mutation, deployment, schema change or provider-side configuration is performed by this work package.

Rollback is therefore repository-only:

1. human-gated `git revert` of the P1-A merge commit;
2. verify the new provider/adapter exports are absent;
3. run the existing class-C validation path;
4. confirm Meme/DeFi challengers remain non-executable and FT-7 remains blocked.

No provider credential rotation is required unless a separate security incident establishes credential exposure.
