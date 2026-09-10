# OPS-02-SEC-06 — Premium / Protected Capability Inventory

**Project:** `CAPITAL-AI-OPS`  
**Project stage:** `PVC-02 — Controlled Implementation`  
**Security finding:** `S1-R2-06 — Entitlement authority`  
**Status:** `PARENT INVENTORY COMPLETE — CHILD RETURNS RE-CORRELATED — SECURITY VERIFICATION OPEN`  
**Lifecycle:** evidence/inventory; non-authorizing  
**Current-main correlation:** `main@e9839f5e3eccc0ae01d6a10e53d3787435e1379d`  
**Correlation date:** `2026-09-10`

## Purpose

This inventory records the seven canonical subscription capabilities and the current owner-return state of their entitlement-enforcement gaps. It remains evidence for the OPS Roadmap and independent Security verification; it is not a parallel project-routing, entitlement or authorization contract.

Current Human-readable routing is:

```text
finding
→ affected PVC / Primary Owner
→ target project Roadmap
→ applicable ADR / ESS
→ owner implementation / tests / evidence
→ independent Security verification
```

Current repository evidence fields use `main_sha`, `branch_head_sha`, `pr_head_sha` and `merge_sha`. Historical branch/evidence state is not promoted to current fact without current-main correlation.

## Capability findings — current owner-return projection

| Capability | Current classification | Primary remediation owner |
|---|---|---|
| `verified_screening` | `IMPLEMENTED_SERVER_ENFORCEMENT / EVIDENCE_READY / SECURITY_VERIFICATION_OPEN` | `CAPITAL-AI-FINTECH / PVC-16` |
| `backtest` | `OPEN / FIN-SEC-03 / SERVER_AUTHORITATIVE_ENFORCEMENT_REQUIRED` | `CAPITAL-AI-FINTECH / PVC-15` |
| `monte_carlo` | `OPEN / FIN-SEC-03 / ALTERNATE_CLIENT_LOCAL_PATH_REMEDIATION_REQUIRED` | `CAPITAL-AI-FINTECH / PVC-15` |
| `full_ai_analysis` | `OPEN / FIN-SEC-03 / EXPLICIT_PRODUCTIVE_BINDING_REQUIRED` | `CAPITAL-AI-FINTECH / PVC-15` |
| `realtime_ai_newsfeed` | `PRODUCT_ACCESS_ROUTE_GAP_CLOSED_ON_MAIN / AUTHORITY_UNAVAILABLE_DISTINCTION_OPEN / SECURITY_VERIFICATION_OPEN` | `CAPITAL-AI-DATA / PVC-09` |
| `buffett_value_check` | `SERVER_AUTHORITY_PRESENT / FIN-SEC-03 CONSUMER_INTEGRATION_REMAINS_OPEN` | `CAPITAL-AI-FINTECH / PVC-15` |
| `pdf_compliance_export` | `SERVER_ENFORCED / EVIDENCE_PRESENT` | no new productive remediation identified by this parent inventory |

## Current child-return evidence

### FINTECH / PVC-16 — `verified_screening`

Current main FINTECH evidence and planning record `FIN-SEC-02` as `IMPLEMENTED / EVIDENCE_READY`, with independent Security verification requested and explicitly not self-closed.

The productive canonical verified-score/context/batch routes consume the accepted server-side `verified_screening` entitlement/quota boundary. Therefore the former parent classification `PARTIAL_SERVER_ENFORCEMENT / ALTERNATE_PATH_GAP` is no longer the current implementation state.

OPS consumes this owner return and does **not** mark `S1-R2-06` `VERIFIED` or `CLOSED`.

### FINTECH / PVC-15 — `backtest`, `monte_carlo`, `full_ai_analysis`, `buffett_value_check`

Current FINTECH planning keeps `FIN-SEC-03` as `OPEN / REFERRED_NOT_EXECUTED / P1 HIGH`. Accordingly:

- Backtest still requires a server-authoritative protected-execution boundary;
- Monte Carlo still requires elimination or binding of the alternate client-local execution path;
- `full_ai_analysis` still requires an explicit productive protected-capability binding;
- existing Buffett server authority must be preserved while remaining consumer integration is corrected through the owning downstream path.

OPS does not implement these foreign FINTECH/PVC-15 children in this parent inventory sync.

### DATA / PVC-09 — `realtime_ai_newsfeed`

Current DATA planning records the productive News route-access implementation as `IMPLEMENTED — DATA EVIDENCE READY / SECURITY VERIFICATION OPEN` while retaining a narrower unresolved authority-state distinction.

Current owner return establishes:

- the productive News route-access bypass is closed on main;
- authoritative identity/tier enforcement remains server-side and fail-closed;
- current evidence covers protected route composition and entitlement behavior;
- the remaining gap is the canonical distinction between ordinary unauthenticated/Free state and an authority-unavailable state, unless higher authority reclassifies that required status semantics;
- independent Security verification remains open.

OPS therefore records the productive access-route gap as closed without inventing a second entitlement/IAM authority or claiming the narrower DATA dependency complete.

## Protected invariant

Browser/local `subscriptionTier`, temporary checkout projection, caller-supplied user identity, provider/model labels or presentation helpers are not protected-capability authority.

Protected capability execution must resolve from a verified principal plus authoritative server/provider entitlement/quota/ledger state. Missing or stale authority fails closed.

## Required negative evidence

Where a capability remains protected, owner remediation and independent Security verification must cover as applicable:

- browser-tier escalation;
- forged identity;
- missing/invalid bearer identity;
- stale entitlement state;
- direct/alternate route bypass;
- quota/ledger bypass;
- fail-closed behavior when a canonical productive capability is not yet bound;
- authority-unavailable semantics where the canonical owner contract requires a distinct state.

## Owner work

### FINTECH / PVC-16

`FIN-SEC-02` implementation/evidence is present on current main. Remaining work is independent Security verification and any owner-directed response to that verification; OPS does not duplicate the scoring/entitlement boundary.

### FINTECH / PVC-15

`FIN-SEC-03` remains open for Backtest, Monte Carlo, `full_ai_analysis` and remaining Buffett consumer integration. FINTECH retains productive business-logic ownership.

### DATA / PVC-09

The productive News route-access bypass is closed. DATA retains the current authority-unavailable distinction dependency and any resulting owner implementation after canonical entitlement/IAM semantics are available or reclassified by higher authority.

## Reference pattern — PDF compliance export

The existing server-ledger path remains the reference pattern:

```text
browser intent
→ authenticated bearer
→ verified server principal
→ authoritative subscription / credit ledger
→ ALLOW
→ protected operation
```

Failure to establish authoritative credits remains fail-closed.

## Security and execution-delegation boundary

Current Governance may allow bounded Security-primary repository remediation without transferring the affected project/PVC ownership. That execution delegation does not alter the state recorded here: productive FINTECH/DATA business semantics remain with their mapped owners and independent Security `VERIFIED/CLOSED` authority remains separate.

## Evidence boundary

This inventory records owner-return state only. It does not claim all child remediation PASS and does not mark `S1-R2-06` `VERIFIED` or `CLOSED`. `CAPITAL-AI-SEC` retains independent verification.

Detailed historical route observations remain recoverable from Git history. New productive implementation starts from then-current `main`, the target project's current Roadmap and applicable ADR/ESS rather than from historical handoff metadata.
