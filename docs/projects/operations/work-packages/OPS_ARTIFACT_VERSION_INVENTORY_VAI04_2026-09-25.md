# OPS-ARTIFACT-VERSION-INVENTORY-VAI04

Status: DONE_MAIN / TERMINAL
Project: CAPITAL-AI-OPS
Primary PVC: PVC-06 Version Management
Supporting PVC: PVC-04 Supervisor, PVC-07 Release Management
Source issue: #1429
Dependencies: VAI-01 #1430, VAI-02 #1443, VAI-03 #1445

## Goal

Complete VAI-04 without changing the independently assured core Self-Healing generation.

## Design

The Artifact-Version layer exposes three evidence-level finding IDs:

- `ARTIFACT_VERSION_CONSUMER_DRIFT`
- `ARTIFACT_VERSION_DECLARATION_DRIFT`
- `ARTIFACT_VERSION_UNCLASSIFIED`

They are projections onto the existing Self-Healing authority, not new core `FindingClass` values.

Deterministic consumer/declaration drift maps to:

`REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT -> RECONCILE_REPOSITORY_PROJECTION`

Unclassified, ambiguous, invalid-hash, owner-unresolved or non-deterministic evidence maps fail-closed to:

`SECURITY_OR_POLICY_BLOCKED -> OBSERVE_ONLY`

## Why the core contract is unchanged

`self-healing-contract/1.2.0` is independently QM/Security assured. VAI-04 does not need a new action or writer, so changing that generation would add assurance churn without increasing capability.

## Exit evidence

- no new Self-Healing action/controller/writer;
- deterministic consumer/declaration drift delegates only to the existing bounded repository projection writer;
- mutation requires a valid inventory hash, affected paths, deterministic evidence, resolved owner and zero graph ambiguities;
- unclassified/incomplete evidence remains observation-only;
- focused tests prove routing and negative cases;
- exact-head CI/Governance/Security readback required before merge;
- Human/CODEOWNER merge boundary remains authoritative.


## Main completion evidence

- Human/CODEOWNER merge: PR #1456.
- Merge commit: `a503cea6b4ff9c72f8cf2a35113ab7a537922574`; implementation head: `70f26f27c57970a821ca7734f5fe217aa455c861`.
- Exact-head evidence before merge: CI #6537, Governance #6059, Container Security #3522, Project Directive #844 and PR #937 completed successfully.
- Fresh CURRENT_MAIN readback: `f61df72e717399e783824d0b12190f2e7f6a96fd`; the VAI-04 merge is an ancestor of this generation with `behind=0`.
- VAI-01 #1430, VAI-02 #1443 and VAI-03 #1445 are also Human/CODEOWNER-merged.
- Deterministic consumer/declaration drift delegates only to the existing `RECONCILE_REPOSITORY_PROJECTION` path; unclassified/ambiguous evidence remains `OBSERVE_ONLY`.
- The VAI-04 work claim is released/non-exclusive by this closure slice. No second controller, writer family, version authority or merge authority is created.
