# OPS-ARTIFACT-VERSION-INVENTORY-VAI01

Status: DONE_MAIN
Project: CAPITAL-AI-OPS
Primary PVC: PVC-06 Version Management
Supporting PVC: PVC-04 Supervisor, PVC-07 Release Management
Source handover: GOV-TO-OPS-ARTIFACT-VERSION-INVENTORY-20260924
Source issue: #1429
Dependency: PR #1428 merged

## Goal

Build the first bounded Artifact Version Inventory slice as read-only evidence over every Git-tracked repository path.

## Scope

VAI-01 only:
- enumerate Git index stage-0 tracked paths;
- preserve the exact Git object id as the content identity;
- classify each path into exactly one approved artifact domain;
- discover strong local version/schema declarations without treating arbitrary version text as a platform version;
- calculate a deterministic content-inventory hash;
- expose unclassified/conflicting identity cases without repairing them.

Approved domains:
- PLATFORM_VERSION_AUTHORITY
- PLATFORM_VERSION_MIRROR
- SEMANTIC_CONTRACT_VERSIONED
- SCHEMA_VERSIONED
- DERIVED_CONTENT_IDENTITY
- GENERATED_OR_EPHEMERAL
- UNCLASSIFIED_REQUIRES_OWNER_REVIEW

## Authority boundary

package.json#version remains the sole platform-version authority.
package-lock.json is a platform-version mirror only.
Ordinary source, configuration and binary content uses the Git object id as identity.
Generated content remains generated/ephemeral evidence.
No blanket SemVer rewrite is permitted.

This slice does not build the producer-consumer graph, does not emit Self-Healing findings, and does not add a new VersionManager, Self-Healing controller, merge authority or provider mutation.

## Exit evidence

- 100 percent of tracked stage-0 paths receive exactly one domain classification.
- Inventory hash is stable for an unchanged Git index.
- Changing one tracked blob changes the inventory hash.
- A PR-template structural change retaining the same declared 1.8.0 version changes identity.
- Inventory generation does not mutate tracked repository bytes.
- Focused unit tests pass.
- Exact-head CI, Governance and Security evidence is required before Human/CODEOWNER merge.

## Main completion evidence

- Human/CODEOWNER merge: PR #1430
- Merge commit: `b23d4c2e1bb00fb0db18cfcd77108e709b532ffa`
- Post-merge verification baseline: `ea9fafc03aa9e05ee9e2f801da09c50392cd1ecc`
- VAI-01 implementation is present on CURRENT_MAIN.
- The VAI-01 work claim is released and non-exclusive in this closeout slice.
- Issue #1429 remains open because VAI-02, VAI-03 and VAI-04 are separate follow-up slices.

## Continuation

VAI-02 may add the producer-consumer version/fingerprint graph on top of the merged VAI-01 inventory without duplicating version authority. VAI-03 and VAI-04 remain later bounded slices.
