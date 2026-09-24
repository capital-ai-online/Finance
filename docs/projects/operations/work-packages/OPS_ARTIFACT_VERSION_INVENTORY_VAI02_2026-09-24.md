# OPS-ARTIFACT-VERSION-INVENTORY-VAI02

Status: IMPLEMENTATION_IN_PROGRESS
Project: CAPITAL-AI-OPS
Primary PVC: PVC-06 Version Management
Supporting PVC: PVC-04 Supervisor, PVC-07 Release Management
Source issue: #1429
Dependency: VAI-01 / PR #1430 merged

## Goal

Extend the merged read-only Artifact Version Inventory with an evidence-derived producer-consumer graph and deterministic consumer fingerprints.

## Scope

VAI-02 only:
- resolve relative imports to tracked semantic/schema/version producers;
- discover quoted tracked-path references;
- correlate exported *_VERSION producers with repository consumers that bind the same symbol and declared value;
- classify consumer relationships as import, workflow/script, validator, test, registry, runtime-manifest or path-reference evidence;
- derive consumerFingerprint from sorted producer identities and bindings;
- expose ambiguous producer resolution explicitly instead of choosing one.

## Authority boundary

`package.json#version` remains the sole platform-version authority.
The graph is derived evidence; it cannot create or transfer version authority.
No hard-coded consumer-path inventory is introduced.
VAI-03 Self-Healing generation integration and VAI-04 findings/actions remain out of scope.

## Exit evidence

- PR-template v1.8 producer and known consumers are graph-connected without a consumer allowlist.
- Relative import consumers resolve to tracked producer identities.
- Consumer fingerprints are deterministic.
- Binding drift changes inventory identity while unchanged producer identity remains stable.
- Duplicate producer candidates produce explicit ambiguity evidence and no arbitrary edge.
- TypeScript and focused tests pass.
- Exact-head CI/Governance/Security evidence is required before merge.
