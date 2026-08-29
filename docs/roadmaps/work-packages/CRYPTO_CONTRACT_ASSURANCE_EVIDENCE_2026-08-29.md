# Crypto Contract Assurance Evidence Work Package

**Document ID:** `WP-CRYPTO-CONTRACT-ASSURANCE-EVIDENCE-2026-08-29`  
**Version:** `1.0.0`  
**Lifecycle:** active  
**Owner:** CAPITAL-AI  
**Base:** `main@11037c2b5d3ea44e7886d5bd589e3e71fa0d79e9`  
**Roadmap:** `FT-CORE-CRYPTO-01` / P1-A Hard-Gate Evidence Completion  
**Predecessors:** PR #597 Exploit Lifecycle; PR #598 Oracle Evidence remains separate/open

## Goal

Create the next provider-agnostic DeFi hard-gate evidence layer after Exploit and Oracle work: deployed-code identity, independent audit evidence and formal-verification evidence for `hardGates.smartContractEvidenceVerified`.

## Scope

- typed deployed-code/source identity evidence bound to protocol, chain, contract address and runtime-code hash;
- typed audit identity, scope, auditor/report authorities, report age and unresolved finding summaries;
- typed formal-verification identity, specification/version, verifier/version and proof state;
- explicit policy for observation age, audit age, formal-proof age, required audit scope, auditor quorum, blocking severities and whether formal verification is required;
- fail-closed `PASS | BLOCKED | NOT_COMPUTABLE` evaluation;
- read-only projection to the existing DeFi hard gate;
- regression tests and evidence documentation.

## Explicit non-goals

- no provider/SDK addition;
- no audit vendor selection;
- no automated scraping of audit PDFs;
- no assumption that Sourcify/source verification is an audit;
- no assumption that an audit proves formal correctness;
- no model promotion;
- no score/ranking/risk/order/execution authority;
- no external mutation.

## Invariants

1. Source/bytecode identity verification is distinct from security audit and formal verification.
2. Missing or stale evidence never becomes PASS/0/neutral.
3. A deployed-code mismatch is blocking.
4. Known unresolved findings in policy-blocking severities are blocking even if they originate from a partial audit.
5. Only audits satisfying the policy-required scope count toward the auditor quorum.
6. Duplicate reports from the same versioned auditor authority do not manufacture independence.
7. Formal verification is evaluated against an explicit specification and target runtime-code identity.
8. `COUNTEREXAMPLE` is blocking; `INCONCLUSIVE`/`UNKNOWN` cannot satisfy a required formal-verification gate.
9. A proof tool/version is evidence metadata, not a security authority by itself.
10. The output remains `scoreEligible=false`, `executionEligible=false`, `authority=RESEARCH_EVIDENCE_ONLY`.

## Real evidence still required

- governed contract-address/runtime-code-hash identity inventory per protocol/chain;
- admissible source-verification authority mapping;
- reviewed audit-report sources, licensing/access and immutable report references;
- auditor identity and independence policy;
- normalized finding/remediation semantics;
- governed formal specifications and proof artifacts where formal verification is required;
- verifier/tool version mapping and proof reproducibility evidence;
- coverage/freshness records over the actual DeFi universe.

## Next roadmap order

After this contract package:

```text
real audit/formal-verification provider coverage
-> holder/entity clustering methodology
-> P1-B provider identity coverage
-> OOS / walk-forward / stress / correlation validation
-> separate owner-gated Meme/DeFi promotion
```

PR #598 Oracle Evidence must remain independently reviewable and is not copied into this branch.
