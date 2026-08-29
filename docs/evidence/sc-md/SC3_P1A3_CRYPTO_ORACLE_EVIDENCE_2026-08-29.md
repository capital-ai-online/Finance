# SC-3 / P1-A3 — Crypto Oracle Integrity, Liveness & Deviation Evidence

**Date:** 2026-08-29  
**Roadmap:** `FT-CORE-CRYPTO-01` / P1-A Hard-Gate Evidence Completion  
**Base:** `main@46d29911f0e15b98460c1b965a039987793ce0e5`  
**Depends on:** PR #594, PR #597, ADR-0087, ADR-0099, ADR-0100  
**Status:** CONTRACT FOUNDATION IMPLEMENTED — REAL PROVIDER/FEED COVERAGE EVIDENCE STILL REQUIRED

## 1. Purpose

After Exploit-Lifecycle Evidence, the next explicit DeFi hard-gate gap is `oracleRiskWithinPolicy`.

This package creates a provider-agnostic, read-only Research Evidence contract for:

- exact protocol / chain / oracle / feed identity;
- observation freshness;
- underlying feed-update freshness;
- availability;
- deviation;
- confidence / uncertainty;
- independent source-authority evidence;
- optional fallback-feed evidence.

The contract does not create a new Oracle provider, risk authority, score authority or execution path.

## 2. Primary-source review

The design was checked against current primary documentation on 2026-08-29.

### Pyth

Pyth explicitly documents that a returned price can be stale and recommends staleness checks. Current Pyth Pro semantics distinguish the response timestamp from `feedUpdateTimestamp`; a carried-forward price can therefore arrive in a current response without being freshly generated. Confidence represents publisher disagreement / price uncertainty, and low publisher participation can affect quality interpretation.

Relevant primary references:

- Pyth Core — Best Practices;
- Pyth Pro — Understanding Price Data;
- Pyth Pro — Payload Reference.

### Chainlink

Chainlink Data Feeds expose feed/network-specific identities and `latestRoundData()` includes `updatedAt`. Chainlink also explicitly requires L2 consumers to check Sequencer Uptime Feeds where applicable. This supports treating chain/feed identity and update freshness as first-class evidence rather than assuming provider reachability proves oracle health.

Relevant primary reference:

- Chainlink — Using Data Feeds on EVM Chains.

## 3. Reuse / dependency decision

Existing CAPITAL-AI architecture is reused:

- `CryptoResearchGateEvidence` and the existing `oracleRiskWithinPolicy` hard-gate key;
- DeFi Research Scoring 0.3.0 oracle factor family;
- provider/evidence authority separation established by ProviderMatrix and ADR-0100;
- fail-closed Evidence patterns from P1-A simulation and P1-A2 Exploit Lifecycle.

No Oracle SDK and no new npm dependency is introduced in this package. A concrete Chainlink/Pyth/protocol-specific adapter remains a later provider package subject to security, licensing, maintenance, chain-coverage and architecture review.

## 4. Contract

New contract:

```text
crypto-oracle-evidence/0.1.0
```

Feed identity:

```text
protocolId
chainId
oracleId
feedId
baseAssetId
quoteAssetId
```

Observation identity and provenance:

```text
role = PRIMARY | FALLBACK
availability = AVAILABLE | UNAVAILABLE | UNKNOWN
observedAtMs
feedUpdatedAtMs
providerId
authorityId / authorityVersion
sourceAuthorityId / sourceAuthorityVersion
deviationBps
confidenceBps
evidenceRefs
```

The explicit separation between `observedAtMs` and `feedUpdatedAtMs` prevents a fresh HTTP/RPC read from masking stale underlying Oracle data.

## 5. Governed policy

The contract does not hardcode one universal Oracle threshold. A versioned policy supplies:

```text
maxObservationAgeMs
maxFeedUpdateAgeMs
maxDeviationBps
maxConfidenceBps
minIndependentSourceAuthorities
fallbackRequirement = NOT_REQUIRED | REQUIRED
```

This keeps protocol/feed-specific risk tolerances outside the generic evidence engine.

## 6. Evaluation semantics

### PASS

`oracleRiskWithinPolicy=true` is produced only when:

1. exact feed identity matches;
2. at least one PRIMARY observation is admitted;
3. observations themselves are current;
4. the underlying feed update is current;
5. availability is known and AVAILABLE;
6. deviation evidence exists and is within policy;
7. confidence/uncertainty evidence exists and is within policy;
8. the governed minimum number of independent `sourceAuthorityId@version` values is present;
9. if required by policy, FALLBACK evidence is present and itself in policy.

### BLOCKED

The hard gate is blocked when admitted evidence proves an explicit adverse condition, including:

- PRIMARY or required/admitted FALLBACK is unavailable;
- feed-update age exceeds policy even though the observation read is fresh;
- deviation exceeds policy;
- confidence/uncertainty exceeds policy.

A healthy fallback does not mask a stale or unavailable primary feed.

### NOT_COMPUTABLE

No PASS or neutral default is created when:

- evidence is missing;
- exact feed identity does not match;
- observation evidence is stale;
- availability is UNKNOWN;
- deviation or confidence is missing;
- source-authority independence is below policy;
- required fallback evidence is missing;
- policy/identity itself is invalid.

## 7. Correlation / independence boundary

Provider count is not source independence.

Two adapters or retrieval paths that resolve to the same underlying source authority must carry the same governed `sourceAuthorityId@version` and count only once. This prevents the same Oracle/feed lineage from becoming artificial corroboration through multiple transports.

The generic contract does not infer publisher independence from vendor branding, RPC endpoints or HTTP provider count.

## 8. Hard-gate projection

New projection:

```text
crypto-oracle-hard-gate-projection/0.1.0
```

It maps the computable Research Evidence result read-only onto the existing DeFi key:

```text
hardGates.oracleRiskWithinPolicy
```

No score, ranking, risk approval, portfolio target, order or execution authority is introduced.

## 9. Security / data integrity

- no secrets or credentials;
- no external mutation;
- no RPC transaction or contract write;
- no new provider authority;
- missing/stale/unknown evidence remains fail-closed;
- adapter/provider availability cannot manufacture Oracle PASS;
- fallback cannot mask stale primary evidence;
- source-authority independence is explicit;
- `scoreEligible=false`;
- `executionEligible=false`;
- `LIVE_EXECUTION` remains blocked.

## 10. Tests

Regression tests cover:

- fully in-policy evidence -> PASS;
- missing/stale/mismatched observation -> NOT_COMPUTABLE;
- fresh read with stale underlying feed -> BLOCKED;
- unavailable feed -> BLOCKED;
- excessive deviation -> BLOCKED;
- excessive confidence -> BLOCKED;
- missing quality metric -> NOT_COMPUTABLE;
- duplicate source authority -> not independent;
- policy-required fallback missing -> NOT_COMPUTABLE;
- healthy fallback cannot mask stale primary;
- hard-gate projection preserves PASS/BLOCKED/NOT_COMPUTABLE.

## 11. Real evidence still required

This package does not claim production Oracle coverage. Still required:

1. governed mapping of protocol -> chain -> oracle -> exact feed identity;
2. reviewed concrete provider adapters, preferably reusing existing transport/governance;
3. protocol-specific heartbeat/freshness policies;
4. definition and provenance of deviation reference prices;
5. provider-specific confidence/uncertainty normalization semantics;
6. L2 sequencer-state evidence where the consumed Oracle requires it;
7. empirical outage/staleness/fallback validation;
8. real source-/publisher-independence evidence;
9. coverage matrix for the supported DeFi asset/protocol universe.

Until these exist, Oracle Evidence remains a contract foundation, not promotion evidence.

## 12. Next backend order

After this Oracle contract foundation:

```text
Oracle provider/feed identity + runtime coverage
-> External Audit / Formal Verification Evidence
-> Holder / Entity Clustering
-> P2 OOS / walk-forward / stress / correlation validation
-> separate Owner-gated Meme/DeFi promotion
```

FT-7 remains blocked.
