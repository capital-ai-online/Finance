# SC-3 / P1-A4 — Crypto Contract Assurance Evidence

**Document ID:** `EVID-SC3-P1A4-CRYPTO-CONTRACT-ASSURANCE-2026-08-29`  
**Version:** `1.0.0`  
**Lifecycle:** active  
**Base:** `main@11037c2b5d3ea44e7886d5bd589e3e71fa0d79e9`  
**Work Package:** `WP-CRYPTO-CONTRACT-ASSURANCE-EVIDENCE-2026-08-29`

## 1. Problem

The DeFi research model already contains `contractSecurity.multipleAudits`, `contractSecurity.formalVerification` and the hard gate `smartContractEvidenceVerified`, but current main does not provide a dedicated provider-agnostic assurance contract that can prove those semantics without collapsing source verification, audits and formal verification into one boolean.

The existing provider inventory explicitly states that Sourcify can prove source/bytecode verification only. A source match is not an audit, an exploit-free claim or a proof of formal correctness.

## 2. Primary-source alignment

Ethereum's current smart-contract verification documentation explicitly distinguishes source-code verification from formal verification: source verification establishes that published source compiles to the deployed bytecode, while formal verification evaluates correctness against a formal specification.

Ethereum's formal-verification guidance describes formal verification as proving that a contract/model satisfies specified properties or invariants. Solidity's SMTChecker likewise attempts to prove properties derived from explicit assertions/assumptions; a tool result therefore remains meaningful only together with the specification, target code and tool/version context.

These distinctions are encoded directly in the contract model rather than left as documentation-only conventions.

## 3. New contracts

### Contract assurance evaluation

```text
crypto-contract-assurance-evidence/0.1.0
```

Canonical identity:

```text
protocolId
chainId
contractAddress
runtimeCodeHash
```

All source-identity, audit and formal-verification observations must bind to that exact identity.

### Hard-gate projection

```text
crypto-contract-assurance-hard-gate-projection/0.1.0
```

Projection target:

```text
hardGates.smartContractEvidenceVerified
```

The projection is read-only and cannot write a productive score, risk approval, order or execution decision.

## 4. Evidence families

### Deployed-code identity

States:

```text
EXACT_MATCH
MISMATCH
UNKNOWN
```

An exact match can satisfy only the code-identity portion of the policy. It cannot manufacture audit or formal-verification evidence. An admitted mismatch is blocking.

### Audit evidence

Each observation binds:

- audit ID;
- exact contract/runtime-code identity;
- `FULL_CONTRACT | PARTIAL | UNKNOWN` scope;
- report issue and observation timestamps;
- auditor authority ID/version;
- report authority ID/version;
- unresolved findings by severity;
- immutable evidence references.

The policy defines the required audit scope, minimum independent auditor count, maximum audit age and which finding severities are blocking. No global auditor threshold or severity policy is invented by the evaluator.

Partial audits do not count toward a `FULL_CONTRACT` quorum, but known unresolved blocking findings from an admitted partial audit still block. This prevents incomplete coverage from becoming positive evidence without hiding known adverse evidence.

### Formal-verification evidence

Each proof binds:

- proof ID;
- exact contract/runtime-code identity;
- formal specification ID/version;
- verifier/tool ID/version;
- proof generation and observation timestamps;
- proof authority ID/version;
- immutable evidence references.

States:

```text
PROVED
COUNTEREXAMPLE
INCONCLUSIVE
UNKNOWN
```

`COUNTEREXAMPLE` is blocking. Where formal verification is policy-required, missing, inconclusive or unknown proof evidence remains `NOT_COMPUTABLE`; only an admitted `PROVED` result can satisfy that requirement.

## 5. Independence and anti-double-counting

Auditor independence is keyed by versioned `auditorAuthorityId@auditorAuthorityVersion`, not report count or provider count. Two reports from the same governed auditor authority cannot manufacture a two-auditor quorum.

Source-verification providers, audit-report registries and proof tools are distinct evidence roles. The same provider transport can carry evidence without becoming the semantic authority for all three roles.

## 6. Fail-closed behavior

`NOT_COMPUTABLE` applies to missing/stale/mismatched/non-admissible evidence that is insufficient to establish the policy requirement.

`BLOCKED` applies to positively adverse evidence, including:

- deployed-code mismatch;
- unresolved audit findings in a policy-blocking severity;
- formal-verification counterexample.

`PASS` is possible only when every requirement explicitly selected by the versioned policy is satisfied.

No state is converted to a neutral score or productive approval.

## 7. Security / architecture impact

- no new dependency;
- no new external provider;
- no secrets or credentials;
- no AuthN/AuthZ change;
- no persistence/schema change;
- no network or provider mutation;
- no new ScoringModelRegistry/Dispatcher path;
- no model promotion;
- `LIVE_EXECUTION` remains blocked.

The package reuses the existing research-evidence authority boundary and the typed hard-gate projection pattern established by the Exploit package.

## 8. Repository tests

Regression coverage includes:

- no evidence => `NOT_COMPUTABLE`;
- source verification alone cannot satisfy an audit-required policy;
- exact identity + qualifying audit can satisfy the policy;
- deployed-code mismatch => `BLOCKED`;
- unresolved blocking finding => `BLOCKED`;
- duplicate auditor authority does not increase independence;
- partial audit alone cannot satisfy `FULL_CONTRACT` quorum;
- required formal verification needs explicit `PROVED` evidence;
- `COUNTEREXAMPLE` => `BLOCKED`;
- stale or identity-mismatched observations are rejected;
- projection only maps explicit computable PASS/BLOCKED to the existing DeFi hard gate.

## 9. What remains open

This is repository/contract completion, not real-world assurance completion. Still required:

1. governed deployed-contract identity inventory;
2. reviewed source-verification authority mapping;
3. audit source/provider selection with license/access/provenance review;
4. auditor-independence governance;
5. normalized remediation semantics and immutable report evidence;
6. formal specification governance and proof reproducibility where required;
7. actual protocol/chain coverage and freshness evidence;
8. model validation before any Meme/DeFi promotion.

The open Oracle PR #598 is intentionally not duplicated or depended upon by this branch.
