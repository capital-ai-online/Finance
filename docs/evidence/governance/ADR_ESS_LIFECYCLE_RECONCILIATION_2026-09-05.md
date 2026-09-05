# ADR / ESS Lifecycle Reconciliation Evidence — 2026-09-05

**Evidence type:** governance/document-lifecycle reconciliation  
**Repository:** `SvenKulessa/Finance`  
**Main baseline:** `313d27e5861390e2704612f7e65b4c1f3d9e7a68`  
**Branch:** `agent/governance-adr-ess-archive-20260905`  
**Project:** `CAPITAL-AI-GOV`  
**Primary PVC:** `PVC-05`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`

## Scope

Reconcile ADR/ESS lifecycle state against current `/AGENTS.md`, the Governance Control Plane, current DevelopmentChain authority, canonical registries, code-level M10 retirement evidence and project ownership boundaries.

## Confirmed historical / non-authorizing artifacts

| Artifact | Disposition | Current evidence |
|---|---|---|
| ADR-0005 | historical full text archived; old path is compatibility redirect | current Frontend authority and prior code revalidation |
| ADR-0066 | historical / non-authorizing; full text archived; old path is compatibility redirect | `DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`, `HUMAN_OWNER_PR_APPROVAL_POLICY.md`, M10 retirement evidence |
| ESS-0004 | suspended / archived | ADR-0096 and Governance Control Plane validator |
| ESS-0012 Vocabulary predecessor | superseded / archived | ESS-0017 Vocabulary Governance |
| ESS-0022 | historical / retired / non-authorizing; removed from active `.ai/skills` namespace | M10 retirement evidence and current DevelopmentChain authority |
| ADR-DRAFT prerender | superseded compatibility redirect | ADR-0084 |
| ADR-DRAFT SeoEngine | superseded compatibility redirect | ADR-0082 |

## M10 decision correlation

The former productive M10 passkey/WebAuthn `AUTHORIZE_PR_CI` runtime is `RETIRED / ARCHIVED / OFF`. Normal PR technical CI does not require or expect M10. Current repository discovery must not classify absence of M10 implementation as a gap. Historical M10 `VERIFIED PASS` evidence remains audit/history only.

Therefore:

- ADR-0066 cannot remain an apparently current `PROPOSED` architecture target;
- ESS-0022 cannot remain in the active `.ai/skills` namespace;
- both remain traceable as historical/non-authorizing artifacts;
- any future passkey PR-authorization architecture requires a new separately scoped Human/Owner decision.

## Proposed artifacts intentionally not deactivated

The following proposed artifacts were inspected but were not changed because current Governance ownership does not authorize unilateral lifecycle disposition for their primary domain scope:

- `ADR-0098` — Media project scope;
- `ADR-0103` — Quality Management project scope;
- `ESS-0020` — Security/Auth MFA/AAL2 scope;
- `ESS-0021` — Operations/Systemadmin execution scope.

Their presence as `PROPOSED` is not sufficient evidence that they are obsolete. Recency alone does not establish supersession, and foreign-project work is denied by default.

## Code enforcement

`tests/unit/adrEssLifecycleArchive.test.ts` binds the repository to the reconciled state:

- ADR-0066 must resolve as historical in ADR and Authority registries;
- the old ADR path must remain a non-authorizing redirect;
- ESS-0022 must resolve to its historical archive path;
- active `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md` must remain absent;
- current DevelopmentChain authority must continue to state M10 retirement.

## Validation truth

This evidence records repository correlation and committed invariants only. Local Node/Vitest/Governance CLI execution must be reported separately and must not be claimed as PASS unless actually executed against the exact branch head.
