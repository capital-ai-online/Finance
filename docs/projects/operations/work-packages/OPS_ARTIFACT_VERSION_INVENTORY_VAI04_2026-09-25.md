# OPS-ARTIFACT-VERSION-INVENTORY-VAI04

Status: IMPLEMENTED_ON_BRANCH / EXACT_HEAD_VALIDATION_REQUIRED
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
