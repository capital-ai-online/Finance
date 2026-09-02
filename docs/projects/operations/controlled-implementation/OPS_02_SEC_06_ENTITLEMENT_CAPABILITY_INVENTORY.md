# OPS-02-SEC-06 — Premium / Protected Capability Inventory

**Project:** `CAPITAL-AI-OPS`  
**Project stage:** `PVC-02 — Controlled Implementation`  
**Security finding:** `S1-R2-06 — Entitlement authority`  
**Status:** `PARENT INVENTORY COMPLETE — CHILD REMEDIATION REQUIRED — SECURITY VERIFICATION PENDING`  
**Lifecycle:** evidence/inventory; non-authorizing

## Purpose

This inventory records the seven canonical subscription capabilities and the observed entitlement-enforcement gaps. It remains evidence for the OPS Roadmap and independent Security verification; it is not a parallel project-routing contract.

Current Human-readable routing is:

```text
finding
→ affected PVC / Primary Owner
→ target project Roadmap
→ applicable ADR / ESS
→ owner implementation / tests / evidence
→ independent Security verification
```

Current repository evidence fields use `main_sha`, `branch_head_sha`, `pr_head_sha` and `merge_sha`. The former `candidate_sha` field is retired.

## Capability findings

| Capability | Current classification | Primary remediation owner |
|---|---|---|
| `verified_screening` | `PARTIAL_SERVER_ENFORCEMENT / ALTERNATE_PATH_GAP` | `CAPITAL-AI-FINTECH / PVC-16` |
| `backtest` | `NO_PAID_ENTITLEMENT_ENFORCEMENT` | `CAPITAL-AI-FINTECH / PVC-15` |
| `monte_carlo` | `CLIENT_LOCAL_ALTERNATE_PATH_GAP` | `CAPITAL-AI-FINTECH / PVC-15` |
| `full_ai_analysis` | `UNBOUND_PRODUCT_CAPABILITY / FAIL_CLOSED_FOR_VERIFICATION` | `CAPITAL-AI-FINTECH / PVC-15` |
| `realtime_ai_newsfeed` | `PRODUCT_CONTRACT_VS_RUNTIME_GAP` | `CAPITAL-AI-DATA / PVC-09` |
| `buffett_value_check` | `SERVER_AUTHORITY_PRESENT / FAIL_CLOSED_CLIENT_INTEGRATION_GAP` | `CAPITAL-AI-FINTECH / PVC-15` |
| `pdf_compliance_export` | `SERVER_ENFORCED / EVIDENCE_PRESENT` | no new productive remediation identified by this parent inventory |

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
- fail-closed behavior when a canonical productive capability is not yet bound.

## Owner work

### FINTECH / PVC-16

Unify all productive canonical verified-score/context/batch routes with the accepted `verified_screening` entitlement/quota boundary without creating a second scoring or entitlement authority.

### FINTECH / PVC-15

Define authoritative protected execution boundaries for Backtest and Monte Carlo, bind `full_ai_analysis` to an explicit productive capability, and preserve the existing server-owned Buffett authorization pattern while correcting consumer integration where needed.

### DATA / PVC-09

Reconcile public `/api/news*` evidence ingress with the accepted `realtime_ai_newsfeed` product entitlement. Either enforce the authoritative paid capability at the correct boundary or obtain an explicit higher-authority reclassification if the product is intentionally public.

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

## Evidence boundary

This inventory does not claim child remediation PASS and does not mark `S1-R2-06` `VERIFIED` or `CLOSED`. CAPITAL-AI-SEC retains independent verification.

Detailed route-level observations from the original inventory remain recoverable from Git history. New implementation work must start from current `main`, the target project's current Roadmap and applicable ADR/ESS rather than from historical handoff metadata.
